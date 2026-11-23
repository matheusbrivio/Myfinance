from uuid import uuid4

from django.test import Client, TestCase, override_settings

from categorias.models import Categoria
from metas.models import Meta, MovimentacaoMeta
from transacoes.models import Transacao


class APITest(TestCase):
    base = "/api/v1/"

    def setUp(self):
        self.client = Client(enforce_csrf_checks=True)
        self.token = self.client.get(self.base + "csrf/").json()["token"]
        self.headers = {"HTTP_X_CSRFTOKEN": self.token}

    def write(self, metodo, caminho, dados=None, chave=None, **headers):
        if metodo == "post":
            headers["HTTP_IDEMPOTENCY_KEY"] = chave or str(uuid4())
        return getattr(self.client, metodo)(self.base + caminho, dados or {}, "application/json",
                                            **(self.headers | headers))

    def lancar(self, tipo="receita", valor="200.00", categoria=None, data="2026-11-23"):
        resposta = self.write("post", "transacoes/", dict(tipo=tipo, valor=valor,
                                                         categoria=categoria, data=data))
        self.assertEqual(resposta.status_code, 201, resposta.content)
        return resposta.json()

    def test_categoria_opcional_e_filtros(self):
        cat = self.write("post", "categorias/", {"nome": "Casa"}).json()
        receita = self.lancar(categoria=cat["id"])
        despesa = self.lancar("despesa", "75.00", cat["id"])
        nula = self.lancar("despesa", "25.00")
        self.lancar("despesa", "10.00", data="2026-11-22")
        for busca, ids in [
            (f"tipo=receita&categoria={cat['id']}", [receita["id"]]),
            (f"tipo=despesa&categoria={cat['id']}", [despesa["id"]]),
            ("tipo=despesa&categoria=sem_categoria&data_inicio=2026-11-23&data_fim=2026-11-23", [nula["id"]]),
        ]:
            dados = self.client.get(self.base + "transacoes/?" + busca).json()
            self.assertEqual([r["id"] for r in dados["resultados"]], ids)
        self.assertEqual(self.write("delete", f"categorias/{cat['id']}/").status_code, 409)
        url = f"transacoes/{receita['id']}/"
        self.assertEqual(self.write("patch", url, {"descricao": "Salário"}).json()["categoria"], cat["id"])
        self.assertIsNone(self.write("patch", url, {"categoria": None}).json()["categoria"])
        self.assertEqual(self.client.get(self.base + "transacoes/?data_inicio=inválida").status_code, 400)

    def test_meta_historico_grafico_e_repeticao(self):
        self.lancar()
        self.lancar("despesa", "50.00")
        meta = self.write("post", "metas/", {
            "nome": "Viagem", "objetivo": "100.00", "prazo": "2027-11-23", "inicial": "40.00",
        })
        self.assertEqual(meta.status_code, 201, meta.content)
        meta_url = f"metas/{meta.json()['id']}/"
        chave = str(uuid4())
        aporte = self.write("post", meta_url + "aportes/", {"valor": "10.00"}, chave)
        self.assertEqual(aporte.status_code, 201, aporte.content)
        self.assertEqual(self.write("post", meta_url + "aportes/", {"valor": "10.00"}, chave).json(), aporte.json())
        self.assertEqual(self.write("post", meta_url + "aportes/", {"valor": "11.00"}, chave).status_code, 409)
        self.assertEqual(MovimentacaoMeta.objects.count(), 2)
        protegida = f"transacoes/{aporte.json()['transacao_id']}/"
        self.assertEqual(self.write("patch", protegida, {"descricao": "Nova"}).status_code, 404)
        self.assertEqual(self.write("delete", protegida).status_code, 404)
        self.assertEqual(self.write("delete", meta_url).status_code, 409)
        self.assertEqual(self.write("post", meta_url + "retiradas/", {"valor": "51.00"}).status_code, 400)
        self.assertEqual(self.write("post", meta_url + "retiradas/", {"valor": "50.00"}).status_code, 201)
        self.assertTrue(self.write("delete", meta_url).json()["arquivada_em"])
        historico = self.client.get(self.base + meta_url + "historico/").json()
        self.assertEqual([x["saldo"] for x in historico["resultados"]], ["40.00", "50.00", "0.00"])
        self.assertEqual(self.client.get(self.base + "resumo/").json()["saldos"]["disponivel"], "150.00")
        grafico = self.client.get(self.base + "graficos/").json()
        self.assertEqual([x["percentual"] for x in grafico["distribuicao"]], ["66.67", "16.67", "16.67"])
        self.assertEqual(grafico["despesas_por_categoria"][0]["id"], None)
        self.assertEqual(grafico["retiradas"], "50.00")

    @override_settings(CORS_ALLOWED_ORIGINS=["https://ui.example"])
    def test_csrf_cors_e_erros_json(self):
        url = self.base + "categorias/"
        self.assertEqual(self.client.post(url, {"nome": "Casa"}, "application/json").status_code, 403)
        autor = self.client.options(url, HTTP_ORIGIN="https://ui.example",
                                    HTTP_ACCESS_CONTROL_REQUEST_METHOD="POST")
        self.assertEqual(autor["Access-Control-Allow-Origin"], "https://ui.example")
        falha = self.write("post", "categorias/", {"nome": "Casa"}, HTTP_ORIGIN="https://fora.example")
        self.assertEqual(falha.status_code, 403)
        self.assertNotIn("Access-Control-Allow-Origin", falha)
        self.assertFalse(Categoria.objects.exists())
        for caminho, status in [("desconhecido/", 404), ("categorias/999/", 404)]:
            resposta = self.client.get(self.base + caminho)
            self.assertEqual(resposta.status_code, status)
            self.assertIn("erro", resposta.json())
        self.assertEqual(self.client.post(url, "{", "application/json", **self.headers).status_code, 400)
        self.assertEqual(self.client.put(url, "{}", "application/json", **self.headers).status_code, 405)

    def test_falha_atomica_e_graficos_vazios(self):
        from unittest.mock import patch
        self.assertEqual(self.client.get(self.base + "graficos/").json()["distribuicao"], [])
        self.lancar()
        dados = {"nome": "Falha", "objetivo": "100.00", "prazo": "2027-11-23", "inicial": "201.00"}
        self.assertEqual(self.write("post", "metas/", dados).status_code, 400)
        with self.assertLogs("api.middleware"), patch("api.http.Operacao.objects.create", side_effect=RuntimeError("interno")):
            self.client.raise_request_exception = False
            erro = self.write("post", "metas/", dados | {"inicial": "20.00"})
            self.assertEqual(erro.status_code, 500)
            self.assertNotIn("RuntimeError", erro.content.decode())
        self.assertFalse(Meta.objects.exists())
        self.assertFalse(MovimentacaoMeta.objects.exists())
        self.assertEqual(Transacao.objects.count(), 1)
