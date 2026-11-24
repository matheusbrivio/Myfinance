from datetime import date, datetime, time, timedelta
from decimal import Decimal
from unittest.mock import patch

from django.test import TestCase
from django.utils import timezone

from categorias.models import Categoria
from metas.services import criar_meta_validada, movimentar
from transacoes.models import Transacao

HOJE = date(2026, 11, 24)


def lancar(tipo, valor, dia, categoria=None, descricao=""):
    return Transacao.objects.create(tipo=tipo, valor=Decimal(valor), data=dia, categoria=categoria, descricao=descricao)


def aporte(meta, valor, dia):
    movimentar(meta.pk, Transacao.Tipo.APORTE_META, Decimal(valor),
               instante=timezone.make_aware(datetime.combine(dia, time(12))))


@patch("api.mensal.hoje", lambda: HOJE)
class InsightsTest(TestCase):
    def insights(self, mes="2026-11"):
        resposta = self.client.get("/api/v1/insights/" + (f"?mes={mes}" if mes else ""))
        self.assertEqual(resposta.status_code, 200, resposta.content)
        return resposta.json()

    def por_tipo(self, mes="2026-11"):
        return {i["tipo"]: i for i in self.insights(mes)}

    def setUp(self):
        self.alimentacao = Categoria.objects.create(nome="Alimentação")
        self.lazer = Categoria.objects.create(nome="Lazer")

    def test_aumento_numa_categoria(self):
        lancar("despesa", "100.00", date(2026, 10, 10), self.alimentacao)
        lancar("despesa", "123.00", date(2026, 11, 10), self.alimentacao)
        primeiro = self.insights()[0]
        self.assertEqual(primeiro, {"tipo": "variacao_categoria", "tom": "alerta",
                                    "texto": "Você gastou 23% a mais com Alimentação do que em outubro."})

    def test_reducao_e_maior_variacao_absoluta(self):
        lancar("despesa", "100.00", date(2026, 10, 10), self.alimentacao)
        lancar("despesa", "110.00", date(2026, 11, 10), self.alimentacao)
        lancar("despesa", "200.00", date(2026, 10, 12), self.lazer)
        lancar("despesa", "50.00", date(2026, 11, 12), self.lazer)
        item = self.por_tipo()["variacao_categoria"]
        self.assertEqual(item["tom"], "positivo")
        self.assertEqual(item["texto"], "Você gastou 75% a menos com Lazer do que em outubro.")

    def test_categoria_abaixo_do_minimo_e_sem_receitas(self):
        lancar("despesa", "49.99", date(2026, 10, 10), self.alimentacao)
        lancar("despesa", "300.00", date(2026, 11, 10), self.alimentacao)
        tipos = self.por_tipo()
        self.assertNotIn("variacao_categoria", tipos)
        self.assertNotIn("economia", tipos)

    def test_taxa_de_economia(self):
        lancar("receita", "1000.00", date(2026, 11, 5))
        lancar("despesa", "820.00", date(2026, 11, 8))
        item = self.por_tipo()["economia"]
        self.assertEqual(item, {"tipo": "economia", "tom": "positivo",
                                "texto": "Você guardou 18% do que recebeu em novembro."})

    def test_economia_negativa(self):
        lancar("receita", "1000.00", date(2026, 11, 5))
        lancar("despesa", "1120.00", date(2026, 11, 8))
        item = self.por_tipo()["economia"]
        self.assertEqual(item["tom"], "alerta")
        self.assertEqual(item["texto"], "Você gastou 12% a mais do que recebeu em novembro.")

    def test_projecao_de_meta(self):
        lancar("receita", "5000.00", date(2026, 8, 1))
        meta = criar_meta_validada(nome="Notebook novo", objetivo=Decimal("1600.00"), prazo=date(2027, 12, 1))
        aporte(meta, "300.00", HOJE - timedelta(days=40))
        aporte(meta, "300.00", HOJE - timedelta(days=10))
        item = self.por_tipo()["meta"]
        self.assertEqual(item, {"tipo": "meta", "tom": "neutro",
                                "texto": "No ritmo atual, a meta Notebook novo fecha em abril de 2027."})

    def test_meta_parada(self):
        lancar("receita", "5000.00", date(2026, 8, 1))
        meta = criar_meta_validada(nome="Viagem", objetivo=Decimal("900.00"), prazo=date(2027, 12, 1))
        aporte(meta, "100.00", HOJE - timedelta(days=52))
        item = self.por_tipo()["meta"]
        self.assertEqual(item, {"tipo": "meta", "tom": "alerta", "texto": "A meta Viagem está sem aportes há 52 dias."})

    def test_meta_concluida_ou_sem_aporte_nao_aparece(self):
        lancar("receita", "5000.00", date(2026, 8, 1))
        concluida = criar_meta_validada(nome="Feita", objetivo=Decimal("100.00"), prazo=date(2027, 12, 1))
        aporte(concluida, "100.00", HOJE - timedelta(days=5))
        criar_meta_validada(nome="Sem aporte", objetivo=Decimal("100.00"), prazo=date(2027, 12, 1))
        self.assertNotIn("meta", self.por_tipo())

    def test_maior_gasto(self):
        lancar("despesa", "750.00", date(2026, 11, 10), descricao="Aluguel")
        lancar("despesa", "80.00", date(2026, 11, 12), descricao="Mercado")
        lancar("despesa", "900.00", date(2026, 10, 12), descricao="Fora do mês")
        item = self.por_tipo()["maior_gasto"]
        self.assertEqual(item, {"tipo": "maior_gasto", "tom": "neutro",
                                "texto": "Seu maior gasto foi Aluguel (R$ 750,00), no dia 10."})

    def test_valor_em_formato_brasileiro(self):
        lancar("despesa", "1234.50", date(2026, 11, 3), descricao="Notebook")
        self.assertEqual(self.por_tipo()["maior_gasto"]["texto"], "Seu maior gasto foi Notebook (R$ 1.234,50), no dia 3.")

    def test_limite_e_ordem(self):
        lancar("receita", "5000.00", date(2026, 11, 1))
        lancar("despesa", "100.00", date(2026, 10, 10), self.alimentacao)
        lancar("despesa", "150.00", date(2026, 11, 10), self.alimentacao)
        meta = criar_meta_validada(nome="Carro", objetivo=Decimal("9000.00"), prazo=date(2028, 1, 1))
        aporte(meta, "200.00", HOJE - timedelta(days=3))
        tipos = [i["tipo"] for i in self.insights()]
        self.assertEqual(tipos, ["variacao_categoria", "economia", "meta"])

    def test_virada_do_ano(self):
        lancar("despesa", "100.00", date(2025, 12, 10), self.alimentacao)
        lancar("despesa", "150.00", date(2026, 1, 10), self.alimentacao)
        self.assertEqual(self.por_tipo("2026-01")["variacao_categoria"]["texto"],
                         "Você gastou 50% a mais com Alimentação do que em dezembro.")

    def test_mes_atual_compara_o_mesmo_recorte(self):
        # Hoje é dia 24: a despesa de 28 de outubro não entra na comparação.
        lancar("despesa", "100.00", date(2026, 10, 10), self.alimentacao)
        lancar("despesa", "500.00", date(2026, 10, 28), self.alimentacao)
        lancar("despesa", "110.00", date(2026, 11, 10), self.alimentacao)
        self.assertEqual(self.por_tipo()["variacao_categoria"]["texto"],
                         "Você gastou 10% a mais com Alimentação do que em outubro.")

    def test_categoria_so_no_mes_atual(self):
        lancar("despesa", "300.00", date(2026, 11, 10), self.alimentacao)
        self.assertNotIn("variacao_categoria", self.por_tipo())

    def test_economia_negativa_perto_de_zero(self):
        lancar("receita", "1000.00", date(2026, 11, 5))
        lancar("despesa", "1004.00", date(2026, 11, 8))
        item = self.por_tipo()["economia"]
        self.assertEqual(item["tom"], "alerta")
        self.assertEqual(item["texto"], "Você gastou 1% a mais do que recebeu em novembro.")

    def test_meta_arquivada_nao_aparece(self):
        lancar("receita", "5000.00", date(2026, 8, 1))
        meta = criar_meta_validada(nome="Arquivada", objetivo=Decimal("900.00"), prazo=date(2027, 12, 1))
        aporte(meta, "100.00", HOJE - timedelta(days=5))
        type(meta).objects.filter(pk=meta.pk).update(arquivada_em=timezone.now())
        self.assertNotIn("meta", self.por_tipo())

    def test_meta_de_menor_prazo_primeiro(self):
        lancar("receita", "5000.00", date(2026, 8, 1))
        longa = criar_meta_validada(nome="Longa", objetivo=Decimal("900.00"), prazo=date(2028, 1, 1))
        curta = criar_meta_validada(nome="Curta", objetivo=Decimal("900.00"), prazo=date(2027, 1, 1))
        aporte(longa, "100.00", HOJE - timedelta(days=5))
        aporte(curta, "100.00", HOJE - timedelta(days=60))
        self.assertEqual(self.por_tipo()["meta"]["texto"], "A meta Curta está sem aportes há 60 dias.")

    def test_meta_so_no_mes_atual(self):
        lancar("receita", "5000.00", date(2026, 8, 1))
        meta = criar_meta_validada(nome="Viagem", objetivo=Decimal("900.00"), prazo=date(2027, 12, 1))
        aporte(meta, "100.00", HOJE - timedelta(days=5))
        self.assertIn("meta", self.por_tipo("2026-11"))
        self.assertNotIn("meta", self.por_tipo("2026-10"))

    def test_sem_dados_lista_vazia(self):
        self.assertEqual(self.insights(), [])

    def test_sem_mes_usa_o_mes_atual(self):
        lancar("despesa", "90.00", date(2026, 11, 2), descricao="Farmácia")
        self.assertEqual(self.insights(None)[0]["tipo"], "maior_gasto")

    def test_mes_invalido_ou_futuro(self):
        for mes in ["2026-13", "2026-12", "abc"]:
            self.assertEqual(self.client.get(f"/api/v1/insights/?mes={mes}").status_code, 400, mes)
