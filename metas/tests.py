from datetime import date
from decimal import Decimal
from unittest.mock import patch

from django.db import IntegrityError, transaction
from django.db.models.deletion import ProtectedError
from django.test import TestCase, override_settings
from django.utils import timezone

from categorias.models import Categoria
from transacoes.models import Transacao
from transacoes.saldos import saldos

from .models import Meta, MovimentacaoMeta
from .progresso import progresso
from .services import movimentar


class ModelosTests(TestCase):
    def test_vinculo_unico_e_protegido(self):
        meta = Meta.objects.create(nome="Viagem", objetivo=10, prazo=date(2026, 12, 1))
        categoria = Categoria.objects.create(nome="Metas", interna=True)
        transacao = Transacao.objects.create(
            tipo=Transacao.Tipo.APORTE_META, categoria=categoria, data=meta.prazo,
            valor=Decimal("0.01"),
        )
        MovimentacaoMeta.objects.create(meta=meta, transacao=transacao)
        for objeto in (meta, transacao):
            with self.assertRaises(ProtectedError):
                objeto.delete()
        with self.assertRaises(IntegrityError), transaction.atomic():
            MovimentacaoMeta.objects.create(meta=meta, transacao=transacao)
        with self.assertRaises(IntegrityError), transaction.atomic():
            Meta.objects.filter(pk=meta.pk).update(objetivo=0)

    def test_categoria_interna_indisponivel(self):
        categoria = Categoria.objects.create(nome="Interna", interna=True)
        self.assertNotContains(self.client.get("/categorias/"), categoria.nome)
        for acao in ("editar", "excluir"):
            self.assertEqual(self.client.get(f"/categorias/{categoria.pk}/{acao}/").status_code, 404)
        resposta = self.client.post("/transacoes/nova/", {
            "tipo": "receita", "valor": "1", "data": "2026-11-23", "categoria": categoria.pk,
        })
        self.assertIn("categoria", resposta.context["form"].errors)


@override_settings(MYFINANCE_REACT_DEFAULT=False)
class MetasTests(TestCase):
    def setUp(self):
        self.categoria = Categoria.objects.create(nome="Casa")
        self.receita = Transacao.objects.create(
            tipo="receita", valor=100, categoria=self.categoria, data=date(2026, 11, 23),
        )
        self.dados = {"nome": "Viagem", "objetivo": "100", "prazo": "2026-12-15"}

    def criar(self, **campos):
        resposta = self.client.post("/metas/nova/", self.dados | campos)
        meta = Meta.objects.latest("pk")
        self.assertRedirects(resposta, f"/metas/{meta.pk}/")
        return meta

    def test_criar_editar_e_excluir_sem_historico(self):
        meta = self.criar()
        self.assertIsNotNone(meta.criada_em)
        self.assertContains(self.client.get("/metas/"), "Viagem")
        self.assertRedirects(
            self.client.post(f"/metas/{meta.pk}/editar/", self.dados | {"nome": "Curso"}),
            f"/metas/{meta.pk}/",
        )
        self.assertContains(self.client.get(f"/metas/{meta.pk}/"), "Curso")
        url = f"/metas/{meta.pk}/excluir/"
        self.assertContains(self.client.get(url), "Confirmar exclusão")
        self.assertTrue(Meta.objects.filter(pk=meta.pk).exists())
        self.assertRedirects(self.client.post(url), "/metas/")
        self.assertFalse(Meta.objects.filter(pk=meta.pk).exists())

    def test_dados_e_aporte_inicial_invalidos(self):
        for campo, valor in [
            ("nome", ""), ("objetivo", "0"), ("objetivo", "-1"), ("prazo", ""),
            ("prazo", "2026-02-30"), ("inicial", "100.01"), ("inicial", "-1"),
            ("inicial", "0.001"),
        ]:
            with self.subTest(campo=campo, valor=valor):
                resposta = self.client.post("/metas/nova/", self.dados | {campo: valor})
                self.assertIn(campo, resposta.context["form"].errors)
                self.assertFalse(Meta.objects.exists())
                self.assertEqual(Transacao.objects.count(), 1)

    def test_aporte_e_retirada_nos_limites_e_encerramento(self):
        meta = self.criar(inicial="25")
        self.assertEqual(saldos()["reservado"], 2500)
        self.assertEqual(saldos()["disponivel"], 7500)
        base = f"/metas/{meta.pk}/"
        excluir, aportar, retirar = (f"{base}{acao}/" for acao in ("excluir", "aportar", "retirar"))
        for url, limite in [(aportar, "75.01"), (retirar, "25.01")]:
            for valor in [limite, "0", "-1", "0.001"]:
                with self.subTest(url=url, valor=valor):
                    self.assertIn("valor", self.client.post(url, {"valor": valor}).context["form"].errors)
        self.assertContains(self.client.post(excluir), "Retire o saldo reservado")
        self.assertRedirects(self.client.post(aportar, {"valor": "75"}), base)
        self.assertEqual(saldos()["disponivel"], 0)
        self.assertRedirects(self.client.post(retirar, {"valor": "100"}), base)
        self.assertEqual(saldos()["reservado"], 0)
        self.assertEqual(saldos()["disponivel"], 10000)
        self.assertRedirects(self.client.post(excluir), "/metas/")
        meta.refresh_from_db()
        self.assertIsNotNone(meta.arquivada_em)
        self.assertEqual(self.client.post(retirar, {"valor": "1"}).status_code, 404)
        self.assertEqual(self.client.post(aportar, {"valor": "1"}).status_code, 404)
        self.assertEqual(self.client.post(base + "editar/", self.dados).status_code, 404)
        resposta = self.client.get(base)
        self.assertContains(resposta, "Meta arquivada")
        self.assertEqual([saldo for _, saldo in resposta.context["historico"]], [2500, 10000, 0])

    def test_historico_protege_operacoes_e_preserva_nome_original(self):
        meta = self.criar(inicial="10")
        mov = MovimentacaoMeta.objects.get()
        transacao = mov.transacao
        self.assertIsNotNone(transacao.instante)
        self.client.post(f"/metas/{meta.pk}/editar/", self.dados | {"nome": "Curso"})
        self.client.post(f"/metas/{meta.pk}/retirar/", {"valor": "2"})
        self.assertContains(self.client.get("/transacoes/"), "Aporte para meta — Viagem")
        self.assertContains(self.client.get("/transacoes/"), "Retirada da meta — Curso")
        for acao in ("editar", "excluir"):
            url = f"/transacoes/{transacao.pk}/{acao}/"
            self.assertEqual(self.client.get(url).status_code, 404)
            self.assertEqual(self.client.post(url).status_code, 404)
        for tipo in (Transacao.Tipo.APORTE_META, Transacao.Tipo.RETIRADA_META):
            resposta = self.client.post("/transacoes/nova/", {
                "tipo": tipo, "data": "2026-11-23", "valor": "5", "categoria": self.categoria.pk,
            })
            self.assertIn("tipo", resposta.context["form"].errors)
        self.assertEqual(Transacao.objects.count(), 3)

    def test_rollback_sem_movimentacao_orfa(self):
        meta = self.criar()
        with patch("metas.services.MovimentacaoMeta.objects.create", side_effect=IntegrityError):
            with self.assertRaises(IntegrityError):
                movimentar(meta.pk, Transacao.Tipo.APORTE_META, Decimal("25"))
        self.assertEqual(Transacao.objects.count(), 1)
        self.assertFalse(Categoria.objects.filter(interna=True).exists())
        self.assertEqual(saldos()["disponivel"], 10000)

    def test_saldos_e_patrimonio_conciliados(self):
        self.criar(inicial="40")
        meta = Meta.objects.get()
        movimentar(meta.pk, Transacao.Tipo.RETIRADA_META, Decimal("10"))
        self.assertEqual(saldos(), {
            "receitas": 10000, "despesas": 0, "reservado": 3000,
            "disponivel": 7000, "patrimonio": 10000,
        })
        self.receita.tipo = Transacao.Tipo.DESPESA
        self.receita.save()
        self.assertEqual(saldos()["disponivel"], -13000)
        self.assertEqual(saldos()["reservado"], 3000)
        resposta = self.client.post(f"/metas/{meta.pk}/aportar/", {"valor": "0.01"})
        self.assertIn("valor", resposta.context["form"].errors)
        self.receita.delete()
        self.assertEqual(saldos()["patrimonio"], 0)
        self.assertEqual(saldos()["disponivel"], -3000)

    def test_progresso_prazo_e_arredondamento(self):
        meta = Meta(nome="Viagem", objetivo=Decimal("100"), prazo=date(2027, 1, 31))
        for hoje, saldo, percentual, dias, mensal, status in [
            (date(2026, 12, 2), 3000, "30", 60, 3500, "Em andamento"),
            (date(2026, 12, 30), 2999, "29,99", 32, 3501, "Em andamento"),
            (date(2027, 1, 31), 3000, "30", 0, 7000, "Em andamento"),
            (date(2027, 2, 1), 3000, "30", 0, None, "Vencida"),
            (date(2027, 2, 1), 12000, "120", 0, 0, "Concluída"),
        ]:
            with self.subTest(hoje=hoje, saldo=saldo):
                calculo = progresso(meta, saldo, hoje)
                self.assertEqual(
                    (calculo["percentual"], calculo["dias"], calculo["mensal"], calculo["status"]),
                    (percentual, dias, mensal, status),
                )
                if saldo > 10000:
                    self.assertEqual(calculo["barra"], "100")
        meta.objetivo = Decimal(0)
        self.assertEqual(progresso(meta, 0, date(2027, 1, 31))["percentual"], "0")

    def test_dashboard_cards_indicadores_e_grafico(self):
        meta = self.criar(inicial="40")
        ativa_sem_reserva = self.criar(nome="Sem reserva")
        arquivada = self.criar(nome="Arquivada")
        Meta.objects.filter(pk=arquivada.pk).update(arquivada_em=timezone.now())
        movimentar(meta.pk, Transacao.Tipo.RETIRADA_META, Decimal("10"))
        for _ in range(4):
            Transacao.objects.create(
                tipo="despesa", valor=Decimal("12.5"), data=date(2020, 1, 1),
                categoria=self.categoria,
            )
        resposta = self.client.get("/")
        self.assertEqual(resposta.context["resumo"], {
            "receitas": 10000, "despesas": 5000, "reservado": 3000,
            "disponivel": 2000, "patrimonio": 5000,
        })
        self.assertEqual(resposta.context["grafico"]["proporcoes"], [1, 0.5])
        self.assertEqual(resposta.context["recentes"], list(Transacao.objects.all()[:5]))
        self.assertContains(resposta, f"/metas/{meta.pk}/retirar/")
        self.assertNotContains(resposta, f"/metas/{ativa_sem_reserva.pk}/retirar/")
        self.assertNotContains(resposta, "Arquivada")
        self.assertContains(resposta, "grafico-financeiro")
        detalhe = self.client.get(f"/metas/{meta.pk}/")
        self.assertEqual(dict(resposta.context["cards"])[meta], detalhe.context["progresso"])

    def test_dashboard_sem_transacoes_convencionais(self):
        self.receita.delete()
        resposta = self.client.get("/")
        self.assertContains(resposta, "Nenhuma receita ou despesa para exibir no gráfico.")
        self.assertNotContains(resposta, "grafico-financeiro")
