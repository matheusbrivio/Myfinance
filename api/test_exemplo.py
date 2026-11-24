from collections import defaultdict
from datetime import date
from io import StringIO
from unittest.mock import patch

from django.core.management import CommandError, call_command
from django.test import TestCase

from categorias.models import Categoria
from metas.models import Meta, MovimentacaoMeta
from transacoes.models import Transacao
from transacoes.saldos import centavos

from . import tests as _base


class BaseAPI(TestCase):
    """Cliente com CSRF e chave de idempotência, sem herdar os testes de APITest."""
    base = _base.APITest.base
    setUp = _base.APITest.setUp
    write = _base.APITest.write
    lancar = _base.APITest.lancar

CATEGORIAS = ["Moradia", "Alimentação", "Transporte", "Lazer", "Trabalho", "Estudos"]


def fluxos_por_mes():
    """Receitas, despesas e reservado líquido (centavos) de cada mês, a partir das transações."""
    meses = defaultdict(lambda: defaultdict(int))
    for t in Transacao.objects.all():
        meses[(t.data.year, t.data.month)][t.tipo] += centavos(t.valor)
    return meses


class ExemploAPITest(BaseAPI):
    def test_popula_base_vazia_com_saldos_consistentes(self):
        resposta = self.write("post", "exemplo/")
        self.assertEqual(resposta.status_code, 201, resposta.content)
        self.assertEqual(sorted(Categoria.objects.filter(interna=False).values_list("nome", flat=True)), sorted(CATEGORIAS))

        meses = fluxos_por_mes()
        self.assertEqual(len(meses), 3, "transações dos 3 últimos meses")
        for mes, tipos in meses.items():
            sobra = (tipos["receita"] - tipos["despesa"] - tipos["aporte_meta"] + tipos["retirada_meta"])
            self.assertGreater(sobra, 0, f"o mês {mes} precisa fechar com sobra positiva")
        atual, anterior = sorted(meses)[-1], sorted(meses)[-2]
        self.assertNotEqual(meses[atual]["despesa"], meses[anterior]["despesa"])

        # Os saldos do resumo conciliam com as transações criadas.
        totais = defaultdict(int)
        for t in Transacao.objects.all():
            totais[t.tipo] += centavos(t.valor)
        saldos = self.client.get(self.base + "resumo/").json()["saldos"]
        patrimonio = totais["receita"] - totais["despesa"]
        reservado = totais["aporte_meta"] - totais["retirada_meta"]
        self.assertEqual(saldos["patrimonio"], f"{patrimonio // 100}.{patrimonio % 100:02d}")
        self.assertEqual(saldos["reservado"], f"{reservado // 100}.{reservado % 100:02d}")

        metas = self.client.get(self.base + "metas/").json()["resultados"]
        self.assertEqual(len(metas), 3)
        percentuais = sorted(float(m["progresso"]["percentual"]) for m in metas)
        self.assertEqual(percentuais[-1], 100, "uma meta concluída")
        self.assertLess(percentuais[0], 10, "uma meta recém-criada com pouco progresso")
        # Toda movimentação de meta passou pelo serviço (lançamento + vínculo).
        self.assertEqual(MovimentacaoMeta.objects.count(),
                         Transacao.objects.filter(tipo__in=["aporte_meta", "retirada_meta"]).count())

    def test_recusa_com_409_quando_ja_ha_transacoes(self):
        self.lancar()
        resposta = self.write("post", "exemplo/")
        self.assertEqual(resposta.status_code, 409)
        self.assertIn("exemplo", resposta.json()["erro"]["mensagem"])
        self.assertEqual(Transacao.objects.count(), 1)
        self.assertFalse(Meta.objects.exists())

    def test_exige_csrf(self):
        self.assertEqual(self.client.post(self.base + "exemplo/", {}, "application/json").status_code, 403)
        self.assertFalse(Transacao.objects.exists())


class PopularExemploServicoTest(TestCase):
    def test_primeiro_dia_do_mes_ainda_fecha_com_sobra(self):
        from api.exemplo import popular_exemplo
        popular_exemplo(hoje=date(2026, 3, 1))
        self.assertFalse(Transacao.objects.filter(data__gt=date(2026, 3, 1)).exists())
        for mes, tipos in fluxos_por_mes().items():
            sobra = tipos["receita"] - tipos["despesa"] - tipos["aporte_meta"] + tipos["retirada_meta"]
            self.assertGreater(sobra, 0, mes)

    def test_fim_de_mes_e_meses_curtos(self):
        from api.exemplo import limpar_base, popular_exemplo
        for hoje in (date(2026, 5, 31), date(2026, 3, 31), date(2026, 12, 31)):
            with self.subTest(hoje=hoje):
                limpar_base()
                popular_exemplo(hoje=hoje)
                self.assertFalse(Transacao.objects.filter(data__gt=hoje).exists())
                for mes, tipos in fluxos_por_mes().items():
                    sobra = tipos["receita"] - tipos["despesa"] - tipos["aporte_meta"] + tipos["retirada_meta"]
                    self.assertGreater(sobra, 0, mes)
                self.assertEqual(len(fluxos_por_mes()), 3)

    def test_resumo_indica_base_vazia(self):
        self.assertTrue(self.client.get("/api/v1/resumo/").json()["vazia"])
        Transacao.objects.create(tipo="despesa", valor="5.00", data=date(2026, 1, 1))
        self.assertFalse(self.client.get("/api/v1/resumo/").json()["vazia"])

    def test_reaproveita_categoria_com_mesmo_nome(self):
        from api.exemplo import popular_exemplo
        Categoria.objects.create(nome="lazer")
        popular_exemplo(hoje=date(2026, 11, 24))
        self.assertEqual(Categoria.objects.filter(nome_normalizado="lazer").count(), 1)

    def test_aporte_acima_do_disponivel_continua_recusado(self):
        """As regras de meta valem: sem receitas antes, o primeiro aporte falharia."""
        from api.exemplo import popular_exemplo
        from django.core.exceptions import ValidationError
        with patch("api.exemplo.RECEITAS", []):
            with self.assertRaisesMessage(ValidationError, "excede o saldo disponível"):
                popular_exemplo(hoje=date(2026, 11, 24))
        self.assertFalse(Transacao.objects.exists())


class ComandoPopularExemploTest(TestCase):
    def test_limpar_apaga_e_recria(self):
        Transacao.objects.create(tipo="receita", valor="10.00", data=date(2026, 1, 1), descricao="Antiga")
        call_command("popular_exemplo", "--limpar", stdout=StringIO())
        self.assertFalse(Transacao.objects.filter(descricao="Antiga").exists())
        self.assertEqual(Meta.objects.count(), 3)
        self.assertEqual(Categoria.objects.filter(interna=False).count(), 6)

    def test_sem_limpar_recusa_base_com_dados(self):
        Transacao.objects.create(tipo="receita", valor="10.00", data=date(2026, 1, 1))
        with self.assertRaises(CommandError):
            call_command("popular_exemplo", stdout=StringIO())
        self.assertEqual(Transacao.objects.count(), 1)
