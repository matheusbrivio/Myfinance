import csv
import io
from datetime import date
from unittest.mock import patch

from django.test import TestCase

from . import tests as _base


class ExportarEBuscaTest(TestCase):
    base = _base.APITest.base
    setUp = _base.APITest.setUp
    write = _base.APITest.write
    lancar = _base.APITest.lancar

    def criar(self):
        casa = self.write("post", "categorias/", {"nome": "Casa"}).json()
        self.write("post", "transacoes/", {"tipo": "receita", "valor": "2100.00", "data": "2026-11-05",
                                           "descricao": "Estágio", "categoria": None})
        self.write("post", "transacoes/", {"tipo": "despesa", "valor": "750.00", "data": "2026-11-10",
                                           "descricao": "Aluguel de novembro", "categoria": casa["id"]})
        self.write("post", "transacoes/", {"tipo": "despesa", "valor": "1234.56", "data": "2026-11-23",
                                           "descricao": "Notebook; parcela \"1\"", "categoria": None})
        return casa

    def exportar(self, filtros=""):
        resposta = self.client.get(self.base + "transacoes/exportar/" + (f"?{filtros}" if filtros else ""))
        self.assertEqual(resposta.status_code, 200, resposta.content)
        return resposta

    def linhas(self, resposta):
        texto = resposta.content.decode("utf-8-sig")
        return list(csv.reader(io.StringIO(texto), delimiter=";"))

    @patch("api.mensal.hoje", lambda: date(2026, 11, 24))
    def test_formato_para_o_excel(self):
        self.criar()
        resposta = self.exportar()
        self.assertTrue(resposta.content.startswith(b"\xef\xbb\xbf"), "UTF-8 com BOM")
        self.assertIn("text/csv", resposta["Content-Type"])
        self.assertEqual(resposta["Content-Disposition"], 'attachment; filename="myfinance-transacoes-2026-11-24.csv"')
        linhas = self.linhas(resposta)
        self.assertEqual(linhas[0], ["Data", "Tipo", "Descrição", "Categoria", "Valor"])
        self.assertIn(["23/11/2026", "Despesa", 'Notebook; parcela "1"', "Sem categoria", "1234,56"], linhas)
        self.assertIn(["05/11/2026", "Receita", "Estágio", "Sem categoria", "2100,00"], linhas)
        self.assertEqual(len(linhas), 4)

    def test_exportar_com_filtros_da_listagem(self):
        casa = self.criar()
        linhas = self.linhas(self.exportar("tipo=despesa"))
        self.assertEqual([l[2] for l in linhas[1:]], ['Notebook; parcela "1"', "Aluguel de novembro"])
        linhas = self.linhas(self.exportar(f"categoria={casa['id']}"))
        self.assertEqual([l[4] for l in linhas[1:]], ["750,00"])
        linhas = self.linhas(self.exportar("data_inicio=2026-11-06&data_fim=2026-11-20"))
        self.assertEqual([l[0] for l in linhas[1:]], ["10/11/2026"])
        self.assertEqual(self.client.get(self.base + "transacoes/exportar/?tipo=outro").status_code, 400)

    def test_busca_sem_diferenciar_maiusculas(self):
        self.criar()
        dados = self.client.get(self.base + "transacoes/?busca=ALUGUEL").json()
        self.assertEqual([r["descricao"] for r in dados["resultados"]], ["Aluguel de novembro"])
        self.assertEqual(self.client.get(self.base + "transacoes/?busca=inexistente").json()["total"], 0)
        linhas = self.linhas(self.exportar("busca=notebook"))
        self.assertEqual(len(linhas), 2)

    def test_busca_combina_com_outros_filtros(self):
        self.criar()
        dados = self.client.get(self.base + "transacoes/?busca=al&tipo=despesa").json()
        self.assertEqual([r["descricao"] for r in dados["resultados"]], ["Aluguel de novembro"])

    def test_busca_longa_demais(self):
        self.assertEqual(self.client.get(self.base + "transacoes/?busca=" + "x" * 101).status_code, 400)

    def test_formula_nao_e_executada_no_excel(self):
        self.write("post", "transacoes/", {"tipo": "despesa", "valor": "1.00", "data": "2026-11-01",
                                           "descricao": "=HYPERLINK(\"http://x\")"})
        self.write("post", "transacoes/", {"tipo": "despesa", "valor": "2.00", "data": "2026-11-02", "descricao": "-5+3"})
        descricoes = {l[2] for l in self.linhas(self.exportar())[1:]}
        self.assertEqual(descricoes, {"'=HYPERLINK(\"http://x\")", "'-5+3"})

    def test_exportar_so_aceita_leitura(self):
        from transacoes.models import Transacao
        dados = {"tipo": "receita", "valor": "10.00", "data": "2026-11-01"}
        self.assertEqual(self.write("post", "transacoes/exportar/", dados).status_code, 405)
        self.assertFalse(Transacao.objects.exists())

    def test_rota_de_exportar_antes_do_detalhe(self):
        self.assertNotEqual(self.client.get(self.base + "transacoes/exportar/").status_code, 404)
        self.assertEqual(self.client.get(self.base + "transacoes/999/").status_code, 404)
