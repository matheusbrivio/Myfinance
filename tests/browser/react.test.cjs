const assert = require('node:assert/strict')
const test = require('node:test')
const { chromium } = require('playwright')
const { spawn, spawnSync } = require('node:child_process')
const { mkdtempSync, realpathSync, rmSync } = require('node:fs')
const { tmpdir } = require('node:os')
const { join, resolve } = require('node:path')

const raiz = resolve(__dirname, '../..')
const python = process.env.MYFINANCE_PYTHON || join(raiz, '.venv', 'Scripts', 'python.exe')
const origem = 'http://127.0.0.1:18767'
const codigo = `
import os, sys, django
from django.conf import settings
settings.DATABASES["default"]["NAME"] = os.environ["MYFINANCE_TEST_DB"]
django.setup()
from django.core.management import call_command
if sys.argv[1] == "preparar":
    call_command("migrate", verbosity=0)
else:
    call_command("runserver", "127.0.0.1:18767", use_reloader=False)
`

test('React e templates Django usam os mesmos dados', {timeout: 90000}, async (t) => {
  const temp = realpathSync(tmpdir())
  const pasta = mkdtempSync(join(temp, 'myfinance-react-'))
  const env = {...process.env, DJANGO_SETTINGS_MODULE:'config.settings',
    MYFINANCE_TEST_DB:join(pasta,'test.sqlite3')}
  delete env.MYFINANCE_REACT_DEFAULT
  let servidor, browser
  let logs = ''
  try {
    const preparo = spawnSync(python, ['-c', codigo, 'preparar'], {cwd:raiz, env, encoding:'utf8'})
    assert.equal(preparo.status, 0, preparo.stderr)
    servidor = spawn(python, ['-c', codigo, 'servir'], {cwd:raiz, env})
    servidor.stderr.on('data', texto => { logs += texto })
    let pronto = false
    for (let i = 0; i < 70 && !pronto; i++) {
      try { pronto = (await fetch(origem+'/api/v1/resumo/', {signal:AbortSignal.timeout(1000)})).ok } catch {}
      if (!pronto) await new Promise(r => setTimeout(r,100))
    }
    assert.ok(pronto, logs)
    browser = await chromium.launch({channel: process.env.MYFINANCE_CHROMIUM_CHANNEL})
    const pagina = await browser.newPage({locale:'en-US', reducedMotion:'reduce', viewport:{width:360,height:850}})
    pagina.setDefaultTimeout(8000)
    const falhas = []
    pagina.on('pageerror', erro => falhas.push(erro.message))
    await pagina.goto(origem)
    // Intro: abre em /app/, mostra título, botão de segurar e os 3 integrantes na lista acessível.
    await pagina.getByRole('heading', {name:'MyFinance'}).waitFor()
    assert.equal(new URL(pagina.url()).pathname, '/app/')
    const entrar = pagina.getByRole('button', {name:'Segure para entrar no MyFinance'})
    assert.ok(await entrar.isVisible())
    assert.deepEqual(await pagina.getByRole('list', {name:'Integrantes'}).getByRole('listitem').allTextContents(),
      ['Matheus Brivio', 'Eduardo Rafael da Silva Suarez', 'Murillo Muller'])
    // Com reduced-motion a intro usa as imagens estáticas: as três precisam carregar.
    await pagina.waitForFunction(() => [...document.querySelectorAll('.intro img')].length === 3 &&
      [...document.querySelectorAll('.intro img')].every(img => img.complete && img.naturalWidth > 0))
    await t.test('soltar antes de 1 s não entra', async () => {
      await entrar.hover()
      await pagina.mouse.down()
      await pagina.waitForTimeout(300)
      await pagina.mouse.up()
      await pagina.waitForTimeout(600)
      assert.equal(new URL(pagina.url()).pathname, '/app/')
      assert.ok(await entrar.isVisible())
    })
    await entrar.hover()
    await pagina.mouse.down()
    await pagina.waitForTimeout(1150)
    await pagina.mouse.up()
    await pagina.getByRole('heading', {name:'Dashboard'}).waitFor()
    assert.equal(new URL(pagina.url()).pathname, '/app/dashboard')
    await pagina.getByText('Nenhuma receita registrada para distribuir.').waitFor()
    await pagina.evaluate(() => { window.myfinanceNavegacao = 'spa' })
    const nav = pagina.getByRole('navigation', {name:'Principal'})
    await nav.getByRole('link', {name:'Categorias'}).click()
    await pagina.getByRole('button', {name:'Nova categoria'}).click()
    await pagina.getByLabel('Nome').fill('Casa')
    await pagina.getByRole('button', {name:'Salvar'}).click()
    await pagina.getByRole('heading', {name:'Casa'}).waitFor()
    await nav.getByRole('link', {name:'Transações'}).click()
    assert.equal(await pagina.evaluate(() => window.myfinanceNavegacao), 'spa')
    async function lancar(tipo, valor, categoria = '') {
      await pagina.getByRole('button', {name:'Nova transação'}).click()
      const dialogo = pagina.getByRole('dialog')
      await dialogo.getByRole('radio', {name: tipo === 'receita' ? 'Receita' : 'Despesa'}).check()
      await dialogo.getByLabel('Valor').fill(valor)
      await dialogo.getByLabel('Data', {exact:false}).fill('23/11/2026')
      await dialogo.getByRole('button', {name:'Abrir calendário'}).click()
      await dialogo.getByRole('button', {name:'Mês anterior'}).waitFor()
      // O calendário abre por cima do formulário: Escape fecha só ele, o modal continua aberto.
      await pagina.keyboard.press('Escape')
      await dialogo.getByRole('button', {name:'Mês anterior'}).waitFor({state:'detached'})
      assert.ok(await dialogo.isVisible(), 'Escape no calendário não pode fechar o modal')
      assert.equal(await dialogo.getByLabel('Data', {exact:false}).inputValue(), '23/11/2026')
      await dialogo.getByLabel('Categoria').selectOption(categoria ? {label:categoria} : '')
      await dialogo.getByRole('button', {name:'Salvar'}).click()
      await dialogo.waitFor({state:'hidden'})
    }
    await lancar('receita','200,00','Casa')
    await lancar('despesa','75,00','Casa')
    await lancar('despesa','25,00')
    const tabela = pagina.getByRole('table')
    await tabela.getByText('Sem categoria').waitFor()
    await pagina.getByRole('tab', {name:'Despesas'}).click()
    await pagina.waitForURL(/tipo=despesa/)
    await pagina.locator('#filtro-categoria').selectOption('sem_categoria')
    await pagina.getByLabel('Data inicial').fill('23/11/2026')
    await pagina.getByLabel('Data final').fill('23/11/2026')
    await pagina.getByRole('button', {name:'Aplicar filtros'}).click()
    await pagina.waitForURL(/categoria=sem_categoria/)
    await tabela.getByText('R$ 25,00').waitFor()
    await tabela.getByText('R$ 75,00').waitFor({state:'detached'})
    assert.equal(await tabela.getByText('R$ 75,00').count(), 0)
    await pagina.reload()
    await tabela.getByText('R$ 25,00').waitFor()
    await pagina.getByRole('button', {name:'Limpar filtros'}).click()
    await tabela.getByText('R$ 75,00').waitFor()
    await nav.getByRole('link', {name:'Metas'}).click()
    await pagina.getByRole('button', {name:'Nova meta'}).click()
    const meta = pagina.getByRole('dialog')
    await meta.getByLabel('Nome').fill('Reserva ' + 'x'.repeat(100))
    await meta.getByLabel('Valor objetivo').fill('100')
    await meta.getByLabel('Data limite').fill('31/12/2027')
    await meta.getByLabel('Aporte inicial').fill('25')
    await meta.getByRole('button', {name:'Salvar'}).click()
    await meta.waitFor({state:'hidden'})
    await pagina.getByRole('link', {name:'Aportar'}).click()
    const aporte = pagina.getByRole('dialog')
    await aporte.getByLabel('Valor').fill('500')
    await aporte.getByRole('button', {name:'Salvar'}).click()
    await aporte.getByText('O aporte excede o saldo disponível.').waitFor()
    await aporte.getByLabel('Valor').fill('25')
    await aporte.getByRole('button', {name:'Salvar'}).click()
    await aporte.waitFor({state:'hidden'})
    await pagina.getByRole('progressbar', { name: /Progresso de Reserva/ }).waitFor()
    assert.equal(await pagina.getByRole('progressbar').getAttribute('aria-valuenow'),'50')
    await nav.getByRole('link', {name:'Dashboard'}).click()
    await pagina.getByRole('heading', {name:'Distribuição do dinheiro'}).waitFor()
    const porCategoria = pagina.getByRole('list', {name:'Despesas por categoria'})
    await porCategoria.getByRole('listitem').filter({hasText:'Casa'}).getByText('R$ 75,00').waitFor()
    await porCategoria.getByRole('listitem').filter({hasText:'Sem categoria'}).getByText('R$ 25,00').waitFor()
    const legenda = pagina.getByRole('list', {name:'Legenda da distribuição'})
    await pagina.getByText('Total de receitas', {exact:true}).waitFor()
    for (const [nome, texto, cor] of [
      ['Saldo disponível', '25,00% · R$ 50,00', '#2563EB'],
      ['Despesas convencionais', '50,00% · R$ 100,00', '#E11D48'],
      ['Reservado em metas', '25,00% · R$ 50,00', '#F59E0B'],
    ]) {
      await legenda.getByRole('listitem').filter({hasText:nome}).getByText(texto).waitFor()
      await pagina.locator(`path[fill="${cor}"]`).first().waitFor()
    }
    await nav.getByRole('link', {name:'Metas'}).click()
    await pagina.getByRole('link', {name:'Retirar', exact:true}).click()
    const retirada = pagina.getByRole('dialog')
    await retirada.getByLabel('Valor').fill('20')
    await retirada.getByRole('button', {name:'Salvar'}).click()
    await retirada.waitFor({state:'hidden'})
    await nav.getByRole('link', {name:'Dashboard'}).click()
    await legenda.getByText('35,00% · R$ 70,00').waitFor()
    await legenda.getByText('15,00% · R$ 30,00').waitFor()
    await nav.getByRole('link', {name:'Transações'}).click()
    await tabela.getByRole('row').filter({hasText:'R$ 75,00'}).getByRole('button', {name:/^Excluir/}).click()
    const exclusao = pagina.getByRole('dialog')
    await exclusao.getByText('R$ 75,00').waitFor()
    // HoldButton: segurar 1,2 s confirma; soltar antes cancela.
    const segurar = exclusao.getByRole('button', {name:/Segure para excluir/})
    const caixa = await segurar.boundingBox()
    await pagina.mouse.move(caixa.x + caixa.width / 2, caixa.y + caixa.height / 2)
    await pagina.mouse.down()
    await pagina.waitForTimeout(300)
    await pagina.mouse.up()
    await pagina.waitForTimeout(400)
    assert.ok(await exclusao.isVisible(), 'soltar antes de 1,2 s não pode excluir')
    await pagina.mouse.down()
    await pagina.waitForTimeout(1400)
    await pagina.mouse.up()
    await exclusao.waitFor({state:'hidden'})
    await nav.getByRole('link', {name:'Dashboard'}).click()
    await legenda.getByText('72,50% · R$ 145,00').waitFor()
    await legenda.getByText('12,50% · R$ 25,00').waitFor()
    await legenda.getByText('15,00% · R$ 30,00').waitFor()
    for (const width of [360,768,1280]) {
      await pagina.setViewportSize({width,height:850})
      const largura = await pagina.evaluate(() => ({
        pagina: document.documentElement.scrollWidth, janela: document.documentElement.clientWidth,
        elementos: [...document.querySelectorAll('main *')].filter(e => e.getBoundingClientRect().right > innerWidth + 2 && !e.closest('table')).slice(0,8).map(e => e.tagName + ':' + e.getAttribute('class')),
      }))
      assert.ok(largura.pagina <= largura.janela, 'rolagem horizontal em ' + width + ': ' + JSON.stringify(largura))
    }
    await t.test('segurar Espaço com o botão em foco entra', async () => {
      await pagina.goto(origem + '/app/')
      const botao = pagina.getByRole('button', {name:'Segure para entrar no MyFinance'})
      await botao.focus()
      await pagina.keyboard.down('Space')
      await pagina.waitForTimeout(1100)
      await pagina.keyboard.up('Space')
      await pagina.waitForURL(/\/app\/dashboard$/)
      await pagina.getByRole('heading', {name:'Dashboard'}).waitFor()
    })
    assert.deepEqual(falhas, [])
    const legado = await (await fetch(origem + '/transacoes/')).text()
    assert.match(legado, /Sem categoria/)
    assert.match(legado, /Aporte para meta/)
    assert.match(await (await fetch(origem + '/django/')).text(), /Saldo disponível/)
    assert.equal((await fetch(origem + '/api/v1/desconhecido/')).status, 404)
    await pagina.goto(origem + '/app/metas')
    await pagina.getByRole('button', {name:'Nova meta'}).waitFor()
    const fim = new Promise(r => servidor.once('exit',r))
    servidor.kill()
    await fim
    servidor = spawn(python, ['-c', codigo, 'servir'], {cwd:raiz, env:{...env, MYFINANCE_REACT_DEFAULT:'0'}})
    servidor.stderr.on('data', texto => { logs += texto })
    let legadoRestaurado = false
    for (let i = 0; i < 70 && !legadoRestaurado; i++) {
      try {
        const resposta = await fetch(origem+'/', {signal:AbortSignal.timeout(1000), redirect:'manual'})
        legadoRestaurado = resposta.ok && (await resposta.text()).includes('Saldo disponível')
      } catch {}
      if (!legadoRestaurado) await new Promise(r => setTimeout(r,100))
    }
    assert.ok(legadoRestaurado, logs)
    const depois = await (await fetch(origem+'/api/v1/resumo/')).json()
    assert.equal(depois.saldos.reservado, '30.00')
    assert.equal(depois.metas[0].progresso.percentual, '30')
  } finally {
    if (browser) await browser.close()
    if (servidor && servidor.exitCode === null && servidor.signalCode === null) {
      const fim = new Promise(r => servidor.once('exit',r))
      servidor.kill()
      await fim
    }
    if (realpathSync(pasta) === pasta && pasta.startsWith(join(temp,'myfinance-react-'))) rmSync(pasta,{recursive:true,force:true})
  }
})
