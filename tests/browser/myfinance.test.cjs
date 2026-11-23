const assert = require("node:assert/strict");
const { spawn, spawnSync } = require("node:child_process");
const { mkdtempSync, realpathSync, rmSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { join, resolve } = require("node:path");
const test = require("node:test");
const { chromium, firefox } = require("playwright");

const raiz = resolve(__dirname, "../..");
const python = process.env.MYFINANCE_PYTHON || join(raiz, ".venv", "Scripts", "python.exe");
const origem = "http://127.0.0.1:18765";
const inicializar = `
import os
import django
from django.conf import settings
settings.DATABASES["default"]["NAME"] = os.environ["MYFINANCE_TEST_DB"]
django.setup()
from django.core.management import call_command
`;

async function iniciar(env) {
  const processo = spawn(python, ["-c", inicializar +
    "call_command('runserver', '127.0.0.1:18765', use_reloader=False)"], { cwd: raiz, env });
  let erro = "";
  processo.stderr.on("data", (dados) => { erro += dados; });
  try {
    for (let tentativa = 0; tentativa < 80; tentativa++) {
      if (processo.exitCode !== null) break;
      try {
        const resposta = await fetch(origem, { signal: AbortSignal.timeout(1000) });
        if (resposta.ok) return processo;
      } catch {
        // O servidor de teste ainda está iniciando.
      }
      await new Promise((continuar) => setTimeout(continuar, 100));
    }
    throw new Error(erro || "O Django não iniciou.");
  } catch (falha) {
    await parar(processo);
    throw falha;
  }
}

async function parar(processo) {
  if (!processo || processo.exitCode !== null || processo.signalCode !== null) return;
  const encerrou = new Promise((continuar) => processo.once("exit", continuar));
  processo.kill();
  await encerrou;
}

async function navegar(pagina, caminho) {
  const resposta = await pagina.goto(origem + caminho);
  assert.ok(resposta.ok(), caminho);
}

async function preencher(pagina, campos) {
  for (const [id, valor] of Object.entries(campos)) {
    const elemento = pagina.locator("#id_" + id);
    if (id === "tipo" || id === "categoria") await elemento.selectOption(valor);
    else await elemento.fill(valor);
  }
  await pagina.getByRole("button", { name: "Salvar" }).click();
}

test("MyFinance em Chromium e Firefox", { timeout: 120_000 }, async (suite) => {
  const temporarios = realpathSync(tmpdir());
  const diretorio = mkdtempSync(join(temporarios, "myfinance-browser-"));
  const env = {
    ...process.env,
    DJANGO_SETTINGS_MODULE: "config.settings",
    MYFINANCE_REACT_DEFAULT: "0",
    MYFINANCE_TEST_DB: join(diretorio, "teste.sqlite3"),
  };
  let servidor;
  try {
    const migracao = spawnSync(python, ["-c", inicializar + `
call_command("migrate", "transacoes", "0001_initial", verbosity=0)
import sqlite3
from contextlib import closing
with closing(sqlite3.connect(settings.DATABASES["default"]["NAME"])) as db, db:
    db.execute("INSERT INTO categorias_categoria VALUES (1, 'Trabalho', '', 'trabalho')")
    db.execute("INSERT INTO transacoes_transacao VALUES (1, 'Receita legada', 123456, 'receita', '2026-11-23', 1)")
call_command("migrate", verbosity=0)
`], { cwd: raiz, env, encoding: "utf8" });
    assert.equal(migracao.status, 0, migracao.stderr);
    servidor = await iniciar(env);

    for (const [nome, motor] of Object.entries({ chromium, firefox })) {
      if (process.env.MYFINANCE_BROWSER && process.env.MYFINANCE_BROWSER !== nome) continue;
      await suite.test(nome, async () => {
        const canal = nome === "chromium" ? process.env.MYFINANCE_CHROMIUM_CHANNEL : undefined;
        const navegador = await motor.launch({ channel: canal });
        const requisicoes = [];
        try {
          const contexto = await navegador.newContext({ locale: "en-US", viewport: { width: 360, height: 900 } });
          await contexto.route("**/*", (rota) => {
            if (rota.request().url().startsWith(origem + "/")) return rota.continue();
            requisicoes.push(rota.request().url());
            return rota.abort();
          });
          const pagina = await contexto.newPage();
          await navegar(pagina, "/transacoes/nova/");
          await pagina.keyboard.press("Tab");
          const foco = await pagina.locator(":focus-visible").count();
          assert.ok(foco > 0);
          const calendario = pagina.getByRole("button", { name: "Abrir calendário" });
          await calendario.focus();
          await pagina.keyboard.press("Enter");
          assert.ok(await pagina.getByRole("button", { name: "Mês anterior" }).isVisible());
          assert.ok(await pagina.getByText("Dom", { exact: true }).isVisible());
          await pagina.keyboard.press("Escape");
          assert.equal(await pagina.locator(":focus").textContent(), "Abrir calendário");
          await preencher(pagina, { valor: "1,00", tipo: "despesa", categoria: "1", data: "31/02/2026" });
          await pagina.getByText("Informe uma data válida.").waitFor({ state: "visible" });
          await preencher(pagina, { valor: "R$ 1.234,56", tipo: "despesa", categoria: "1", data: "23/11/2026" });
          await pagina.getByText("Transação salva.").waitFor({ state: "visible" });
          assert.ok(await pagina.getByText("Sem descrição", { exact: true }).first().isVisible());

          await navegar(pagina, "/metas/nova/");
          const nomeMeta = "Meta " + nome + " " + "x".repeat(130);
          await preencher(pagina, { nome: nomeMeta, objetivo: "40", prazo: "31/12/2027", inicial: "0" });
          await pagina.waitForURL(/\/metas\/\d+\/$/);
          const detalhe = new URL(pagina.url()).pathname;
          await pagina.getByText("Meta criada.").waitFor({ state: "visible" });
          const prefixo = detalhe.replace(/\/$/, "");
          const paginas = ["/", "/categorias/", "/transacoes/", "/metas/", detalhe,
            "/transacoes/nova/", prefixo + "/editar/", prefixo + "/excluir/"];
          for (const largura of [360, 768, 1280]) {
            await pagina.setViewportSize({ width: largura, height: 900 });
            for (const caminho of paginas) {
              await navegar(pagina, caminho);
              const larguraValida = await pagina.evaluate(() =>
                document.documentElement.scrollWidth <= document.documentElement.clientWidth);
              assert.ok(larguraValida, caminho + " em " + largura + " px");
            }
          }
          await pagina.locator("dialog[open]").waitFor();
          assert.equal(await pagina.locator(":focus").textContent(), "Voltar");
          await pagina.keyboard.press("Escape");
          await pagina.locator("dialog[open]").waitFor({ state: "detached" });

          await pagina.emulateMedia({ reducedMotion: "reduce" });
          await navegar(pagina, "/");
          await pagina.waitForFunction(() => Chart.getChart("grafico-financeiro"));
          assert.equal(await pagina.evaluate(() => Chart.getChart("grafico-financeiro").options.animation), false);
          assert.equal(await pagina.locator(".progress-bar").first().evaluate((barra) =>
            getComputedStyle(barra).animationDuration), "0s");
          await pagina.emulateMedia({ reducedMotion: "no-preference" });
          await navegar(pagina, "/");
          await pagina.waitForFunction(() => Chart.getChart("grafico-financeiro"));
          assert.equal(await pagina.evaluate(() => Chart.getChart("grafico-financeiro").options.animation.duration), 500);
          assert.ok(await pagina.getByText("R$ 1.234,56").first().isVisible());
          assert.deepEqual(requisicoes, []);

          const semJs = await navegador.newContext({ javaScriptEnabled: false, locale: "en-US" });
          try {
            const offline = await semJs.newPage();
            await navegar(offline, "/transacoes/nova/");
            assert.ok(await offline.getByPlaceholder("DD/MM/AAAA").isEditable());
            assert.equal(await offline.getByRole("button", { name: "Abrir calendário" }).count(), 0);
            await navegar(offline, "/");
            assert.ok(await offline.getByText("Receitas", { exact: true }).isVisible());
            await navegar(offline, prefixo + "/excluir/");
            assert.ok(await offline.getByRole("button", { name: "Confirmar exclusão" }).isVisible());
            assert.equal(await offline.locator("dialog[open]").count(), 0);
          } finally {
            await semJs.close();
          }
        } finally {
          await navegador.close();
        }
      });
    }

    const prova = spawnSync(python, ["-c", inicializar + `
from decimal import Decimal
from django.test import Client
from metas.models import Meta
from transacoes.models import Transacao

assert Transacao.objects.get(pk=1).valor == Decimal("1234.56")
cliente = Client(HTTP_HOST="localhost")
receita = Transacao.objects.get(pk=1)
Transacao.objects.create(tipo="receita", valor=2000, categoria=receita.categoria, data=receita.data)
assert cliente.post("/metas/nova/", {
    "nome": "Persistência", "objetivo": "100", "prazo": "31/12/2027", "inicial": "30",
}).status_code == 302
meta = Meta.objects.get(nome="Persistência")
assert cliente.post(f"/metas/{meta.pk}/retirar/", {"valor": "30"}).status_code == 302
assert cliente.post(f"/metas/{meta.pk}/excluir/").status_code == 302
`], { cwd: raiz, env, encoding: "utf8" });
    assert.equal(prova.status, 0, prova.stderr);
    await parar(servidor);
    servidor = await iniciar(env);
    const dashboard = await (await fetch(origem)).text();
    assert.match(dashboard, /R\$ 3\.234,56/);
    assert.doesNotMatch(dashboard, />Persistência</);
    const metas = await (await fetch(origem + "/metas/")).text();
    assert.match(metas, /Metas arquivadas/);
    assert.match(metas, /Persistência/);
    const historico = await (await fetch(origem + "/transacoes/")).text();
    assert.match(historico, /Aporte para meta — Persistência/);
    assert.match(historico, /Retirada da meta — Persistência/);
  } finally {
    await parar(servidor);
    if (realpathSync(diretorio) === diretorio && diretorio.startsWith(join(temporarios, "myfinance-browser-"))) {
      rmSync(diretorio, { recursive: true, force: true });
    }
  }
});
