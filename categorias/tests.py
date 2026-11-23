from django.test import TestCase

from django.db import IntegrityError, transaction

from .models import Categoria


class CategoriaModelTests(TestCase):
    def test_nome_unico_sem_distinguir_maiusculas(self):
        Categoria.objects.create(nome="Alimentação")
        with self.assertRaises(IntegrityError), transaction.atomic():
            Categoria.objects.create(nome="ALIMENTAÇÃO")


class CategoriaViewTests(TestCase):
    def test_listar_e_cadastrar_com_limites(self):
        self.assertContains(self.client.get("/categorias/"), "Nenhuma categoria")
        for nome, descricao in [("x" * 100, "d" * 500), ("Outra", "")]:
            with self.subTest(nome=nome):
                response = self.client.post("/categorias/nova/", {
                    "nome": nome, "descricao": descricao,
                }, follow=True)
                self.assertContains(response, nome)
                if descricao:
                    self.assertContains(response, descricao)
        self.assertEqual(Categoria.objects.count(), 2)

    def test_validacao_de_cadastro_e_edicao(self):
        categoria = Categoria.objects.create(nome="Casa")
        Categoria.objects.create(nome="Alimentação")
        casos = [
            ({}, "nome"),
            ({"nome": ""}, "nome"),
            ({"nome": "   "}, "nome"),
            ({"nome": "x" * 101}, "nome"),
            ({"nome": "Válida", "descricao": "x" * 501}, "descricao"),
            ({"nome": "ALIMENTAÇÃO"}, "nome"),
        ]
        for url in ["/categorias/nova/", f"/categorias/{categoria.pk}/editar/"]:
            for dados, campo in casos:
                with self.subTest(url=url, dados=dados):
                    response = self.client.post(url, dados)
                    self.assertIn(campo, response.context["form"].errors)
        categoria.refresh_from_db()
        self.assertEqual(categoria.nome, "Casa")
        self.assertEqual(Categoria.objects.count(), 2)

    def test_editar_capitalizacao_e_descricao(self):
        categoria = Categoria.objects.create(nome="Casa")
        response = self.client.post(f"/categorias/{categoria.pk}/editar/", {
            "nome": "CASA", "descricao": "Contas mensais",
        }, follow=True)
        self.assertContains(response, "CASA")
        self.assertContains(response, "Contas mensais")
        categoria.refresh_from_db()
        self.assertEqual(categoria.nome, "CASA")
        self.assertEqual(self.client.get("/categorias/999/editar/").status_code, 404)

    def test_confirmar_exclusao(self):
        categoria = Categoria.objects.create(nome="Casa")
        url = f"/categorias/{categoria.pk}/excluir/"
        self.assertContains(self.client.get(url), "Confirmar exclusão")
        self.assertContains(self.client.get("/categorias/"), "Casa")
        self.assertRedirects(self.client.post(url), "/categorias/")
        self.assertFalse(Categoria.objects.filter(pk=categoria.pk).exists())
