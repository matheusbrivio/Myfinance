from decimal import Decimal

from django.test import TestCase, override_settings

from django.db import IntegrityError, transaction
from django.db.models.deletion import ProtectedError
from django.test import Client

from categorias.models import Categoria
from .models import Transacao


@override_settings(MYFINANCE_REACT_DEFAULT=False)
class TransacaoTests(TestCase):
    def setUp(self):
        self.categoria = Categoria.objects.create(nome="Casa")
        self.dados = {
            "descricao": "Mercado", "valor": "0,01", "tipo": "despesa",
            "data": "2026-11-23", "categoria": self.categoria.pk,
        }

    def criar(self, **dados):
        resposta = self.client.post("/transacoes/nova/", self.dados | dados)
        self.assertRedirects(resposta, "/transacoes/")
        return Transacao.objects.latest("pk")

    def test_restricoes_e_precisao_no_sqlite(self):
        registro = self.criar(valor="92233720368547758,07")
        self.assertEqual(registro.valor, Decimal("92233720368547758.07"))
        self.assertEqual(Transacao.objects.get(valor=registro.valor), registro)
        for valor in [0, -1]:
            with self.subTest(valor=valor):
                with self.assertRaises(IntegrityError), transaction.atomic():
                    Transacao.objects.filter(pk=registro.pk).update(valor=valor)
        with self.assertRaises(ProtectedError):
            self.categoria.delete()

    def test_listagem_vazia_e_ordenacao(self):
        self.assertContains(self.client.get("/transacoes/"), "Nenhuma transação")
        primeira = self.criar(descricao="Primeira")
        antiga = self.criar(descricao="Antiga", data="2026-01-01", valor="10", tipo="receita")
        recente = self.criar(descricao="x" * 200)
        resposta = self.client.get("/transacoes/")
        self.assertEqual(list(resposta.context["transacoes"]), [recente, primeira, antiga])
        for texto in ["0,01", "10,00", "Receita", "Despesa", "23/11/2026", "Casa", "Editar", "Excluir"]:
            self.assertContains(resposta, texto)

    def test_validacao_no_cadastro_e_na_edicao(self):
        registro = self.criar()
        casos = [(campo, None) for campo in self.dados if campo not in ("descricao", "categoria")] + [
            ("descricao", "x" * 201), ("valor", "abc"),
            ("valor", "0"), ("valor", "-1"), ("valor", "1,001"),
            ("valor", "92233720368547758,08"), ("tipo", "outro"),
            ("data", "2026-02-30"), ("categoria", self.categoria.pk + 1),
        ]
        for url in ["/transacoes/nova/", f"/transacoes/{registro.pk}/editar/"]:
            for campo, valor in casos:
                with self.subTest(url=url, campo=campo, valor=valor):
                    dados = self.dados.copy()
                    if valor is None:
                        del dados[campo]
                    else:
                        dados[campo] = valor
                    resposta = self.client.post(url, dados)
                    self.assertIn(campo, resposta.context["form"].errors)
        self.assertEqual(Transacao.objects.count(), 1)
        self.assertEqual(Transacao.objects.get().valor, Decimal("0.01"))
        self.assertEqual(self.client.get("/transacoes/999/editar/").status_code, 404)

    def test_descricao_opcional(self):
        anterior = self.criar()
        dados = self.dados.copy()
        del dados["descricao"]
        self.assertRedirects(self.client.post("/transacoes/nova/", dados), "/transacoes/")
        anterior.refresh_from_db()
        self.assertEqual(anterior.descricao, "Mercado")
        self.assertRedirects(
            self.client.post(f"/transacoes/{anterior.pk}/editar/", dados | {"descricao": " "}),
            "/transacoes/",
        )
        self.assertContains(self.client.get("/transacoes/"), "Sem descrição", count=2)

    def test_categoria_opcional_mantem_saldo_e_protege_tipos_internos(self):
        registro = self.criar(categoria="")
        self.assertIsNone(registro.categoria_id)
        self.assertContains(self.client.get("/transacoes/"), "Sem categoria")
        self.assertEqual(self.client.get("/").context["resumo"]["despesas"], 1)
        with self.assertRaises(IntegrityError), transaction.atomic():
            Transacao.objects.filter(pk=registro.pk).update(tipo="aporte_meta")

    def test_editar_todos_os_campos(self):
        registro = self.criar()
        outra = Categoria.objects.create(nome="Trabalho")
        url = f"/transacoes/{registro.pk}/editar/"
        self.assertContains(self.client.get(url), 'value="23/11/2026"')
        resposta = self.client.post(url, {
            "descricao": "Salário", "valor": "100,10", "tipo": "receita",
            "data": "2026-11-24", "categoria": outra.pk,
        }, follow=True)
        for texto in ["Salário", "100,10", "Receita", "24/11/2026", "Trabalho"]:
            self.assertContains(resposta, texto)

    def test_exclusoes_e_vinculo_criado_apos_confirmacao(self):
        categoria_url = f"/categorias/{self.categoria.pk}/excluir/"
        self.assertContains(self.client.get(categoria_url), "Confirmar exclusão")
        registro = self.criar()
        url = f"/transacoes/{registro.pk}/excluir/"
        self.assertContains(self.client.get(url), "Cancelar")
        self.assertContains(self.client.get("/transacoes/"), "Mercado")
        self.assertContains(self.client.post(categoria_url), "transações vinculadas")
        self.assertTrue(Categoria.objects.filter(pk=self.categoria.pk).exists())
        self.assertTrue(Transacao.objects.filter(pk=registro.pk).exists())
        self.assertEqual(Client(enforce_csrf_checks=True).post(url).status_code, 403)
        self.assertRedirects(self.client.post(url), "/transacoes/")
        self.assertEqual(self.client.post(url).status_code, 404)
        self.assertRedirects(self.client.post(categoria_url), "/categorias/")

    def test_dashboard_reflete_alteracoes_validas(self):
        def totais():
            resumo = self.client.get("/").context["resumo"]
            return [resumo[chave] for chave in ("receitas", "despesas", "disponivel")]

        self.assertEqual(totais(), [0, 0, 0])
        registro = self.criar(tipo="receita", valor="100,00")
        self.assertEqual(totais(), [10000, 0, 10000])
        url = f"/transacoes/{registro.pk}/editar/"
        self.assertRedirects(self.client.post(url, self.dados | {"valor": "30,00"}), "/transacoes/")
        self.assertEqual(totais(), [0, 3000, -3000])
        self.assertContains(self.client.get("/"), "-R$ 30,00")
        self.client.post(url, self.dados | {"valor": "0"})
        self.assertEqual(totais(), [0, 3000, -3000])
        self.client.post(f"/transacoes/{registro.pk}/excluir/")
        self.assertEqual(totais(), [0, 0, 0])

    def test_dashboard_soma_acima_do_limite_de_uma_linha(self):
        for _ in range(2):
            self.criar(tipo="receita", valor="92233720368547758,07")
        self.assertContains(self.client.get("/"), "R$ 184.467.440.737.095.516,14")

    def test_entrada_localizada_e_mensagens(self):
        for valor in ["R$ 1.234,56", "1234,56", "1234.56"]:
            self.assertEqual(self.criar(valor=valor, data="23/11/2026").valor, Decimal("1234.56"))
        resposta = self.client.get("/transacoes/", HTTP_ACCEPT_LANGUAGE="en-US")
        self.assertContains(resposta, "R$ 1.234,56", count=3)
        self.assertContains(resposta, "23/11/2026", count=3)
        resposta = self.client.post("/transacoes/nova/", self.dados | {
            "data": "31/02/2026", "valor": "12.34,56",
        })
        self.assertIn("data", resposta.context["form"].errors)
        self.assertContains(resposta, "Informe um valor válido.")
        self.assertContains(resposta, "Informe uma data válida.")
