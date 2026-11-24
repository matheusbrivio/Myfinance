from datetime import date, datetime, time
from decimal import Decimal
from unittest.mock import patch

from django.test import TestCase
from django.utils import timezone

from metas.services import criar_meta_validada, movimentar
from transacoes.models import Transacao

from . import tests as _base

HOJE = date(2026, 11, 24)


def instante(dia):
    return timezone.make_aware(datetime.combine(dia, time(12)))


@patch("api.mensal.hoje", lambda: HOJE)
class MensalTest(TestCase):
    base = _base.APITest.base
    setUp = _base.APITest.setUp
    write = _base.APITest.write
    lancar = _base.APITest.lancar

    def resumo(self, mes=None):
        resposta = self.client.get(self.base + "resumo/" + (f"?mes={mes}" if mes else ""))
        self.assertEqual(resposta.status_code, 200, resposta.content)
        return resposta.json()

    def test_sem_mes_continua_igual(self):
        self.lancar("receita", "500.00", data="2026-10-05")
        self.lancar("despesa", "80.00", data="2026-11-02")
        dados = self.resumo()
        self.assertNotIn("mes", dados)
        self.assertEqual(dados["saldos"], {"disponivel": "420.00", "reservado": "0.00", "patrimonio": "420.00",
                                          "receitas": "500.00", "despesas": "80.00"})
        grafico = self.client.get(self.base + "graficos/").json()
        self.assertEqual([x["id"] for x in grafico["distribuicao"]], ["receita", "despesa", "aporte_meta"])

    def test_transacao_no_ultimo_dia_do_mes(self):
        self.lancar("receita", "500.00", data="2026-10-05")
        self.lancar("despesa", "50.00", data="2026-10-31")
        self.lancar("despesa", "30.00", data="2026-11-01")
        dados = self.resumo("2026-10")
        self.assertEqual(dados["mes"], {"inicio": "2026-10-01", "fim": "2026-10-31", "receitas": "500.00",
                                        "despesas": "50.00", "reservado": "0.00", "sobra": "450.00"})
        self.assertEqual(dados["saldos"]["despesas"], "50.00")
        self.assertEqual(dados["saldos"]["patrimonio"], "450.00", "a despesa de novembro não entra na posição")
        self.assertEqual(self.resumo("2026-11")["mes"]["despesas"], "30.00")

    def test_mes_sem_movimento(self):
        self.lancar("receita", "300.00", data="2026-09-10")
        self.lancar("despesa", "100.00", data="2026-09-12")
        dados = self.resumo("2026-10")
        self.assertEqual(dados["mes"]["receitas"], "0.00")
        self.assertEqual(dados["mes"]["despesas"], "0.00")
        self.assertEqual(dados["saldos"]["disponivel"], "200.00")
        self.assertEqual(dados["recentes"], [])
        grafico = self.client.get(self.base + "graficos/?mes=2026-10").json()
        self.assertEqual(grafico["distribuicao"], [])
        self.assertEqual(grafico["despesas_por_categoria"], [])

    def test_retirada_de_meta_no_mes(self):
        self.lancar("receita", "1000.00", data="2026-11-02")
        meta = criar_meta_validada(nome="Viagem", objetivo=Decimal("500.00"), prazo=date(2027, 6, 1))
        movimentar(meta.pk, Transacao.Tipo.APORTE_META, Decimal("100.00"), instante=instante(date(2026, 11, 3)))
        movimentar(meta.pk, Transacao.Tipo.RETIRADA_META, Decimal("30.00"), instante=instante(date(2026, 11, 4)))
        dados = self.resumo("2026-11")
        self.assertEqual(dados["mes"]["reservado"], "70.00")
        self.assertEqual(dados["mes"]["sobra"], "930.00")
        self.assertEqual(dados["saldos"]["reservado"], "70.00")
        grafico = self.client.get(self.base + "graficos/?mes=2026-11").json()
        self.assertEqual({x["id"]: x["valor"] for x in grafico["distribuicao"]},
                         {"despesas": "0.00", "reservado": "70.00", "sobra": "930.00"})
        self.assertEqual(grafico["retiradas"], "30.00")

    def test_sobra_negativa(self):
        self.lancar("receita", "100.00", data="2026-11-02")
        self.lancar("despesa", "150.00", data="2026-11-03")
        self.assertEqual(self.resumo("2026-11")["mes"]["sobra"], "-50.00")
        sobra = [x for x in self.client.get(self.base + "graficos/?mes=2026-11").json()["distribuicao"] if x["id"] == "sobra"]
        self.assertEqual(sobra[0]["valor"], "-50.00")

    def test_recentes_do_mes(self):
        self.lancar("despesa", "1.00", data="2026-10-31")
        ids = [self.lancar("despesa", f"{i}.00", data=f"2026-11-0{i}")["id"] for i in range(1, 7)]
        recentes = self.resumo("2026-11")["recentes"]
        self.assertEqual([r["id"] for r in recentes], ids[::-1][:5])

    def test_mes_atual_vai_ate_hoje(self):
        self.lancar("receita", "100.00", data="2026-11-10")
        self.lancar("despesa", "40.00", data="2026-11-28")
        dados = self.resumo("2026-11")
        self.assertEqual(dados["mes"]["fim"], "2026-11-24")
        self.assertEqual(dados["mes"]["despesas"], "0.00")
        self.assertEqual(dados["saldos"]["patrimonio"], "100.00")

    def test_despesas_por_categoria_do_mes(self):
        cat = self.write("post", "categorias/", {"nome": "Mercado"}).json()
        self.lancar("despesa", "20.00", categoria=cat["id"], data="2026-10-20")
        self.lancar("despesa", "35.00", categoria=cat["id"], data="2026-11-20")
        grafico = self.client.get(self.base + "graficos/?mes=2026-11").json()
        self.assertEqual([(x["nome"], x["valor"]) for x in grafico["despesas_por_categoria"]], [("Mercado", "35.00")])

    def test_fevereiro_de_ano_bissexto(self):
        with patch("api.mensal.hoje", lambda: date(2028, 3, 10)):
            self.lancar("despesa", "10.00", data="2028-02-29")
            dados = self.resumo("2028-02")
        self.assertEqual(dados["mes"]["fim"], "2028-02-29")
        self.assertEqual(dados["mes"]["despesas"], "10.00")

    def test_mes_invalido_ou_futuro(self):
        for mes in ["2026-13", "texto", "2026-1", "2026-12", "0000-01", "٢٠٢٦-١١"]:
            for rota in ("resumo/", "graficos/"):
                resposta = self.client.get(self.base + f"{rota}?mes={mes}")
                self.assertEqual(resposta.status_code, 400, (rota, mes))
                self.assertIn("mes", resposta.json()["erro"]["campos"])
