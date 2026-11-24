import { Link, useSearchParams } from 'react-router'
import { SeletorMes, chaveMes, mesValido } from '../components/SeletorMes'
import { BoasVindas } from '../components/BoasVindas'
import { ResumoMes } from '../components/ResumoMes'
import { api } from '../services/api'
import { moeda } from '../services/format'
import { useQuery } from '../hooks/useQuery'
import { useAtualizacao } from '../layouts/contexto'
import { BarrasCategoria } from '../components/BarrasCategoria'
import { ListaTransacoes } from '../components/ListaTransacoes'
import { Rosca } from '../components/Rosca'
import { CabecalhoCard, Estado, Painel, VerTodas } from '../components/ui'
import { Numero } from '../components/Numero'
import { Entrada } from '../components/Entrada'
import { Barra } from '../components/Barra'
import { useUltimo } from '../hooks/useUltimo'
import type { Graficos, Insight, Resumo } from '../types/financeiro'
import { distribuirDinheiro } from '../services/distribuicao'

// Mini-indicadores do hero (substituem os cards de KPI separados).
const indicadores = [
  ['receitas', 'Receitas', 'var(--income)'], ['despesas', 'Despesas', 'var(--expense)'],
  ['reservado', 'Em metas', 'var(--goal)'], ['patrimonio', 'Patrimônio total', 'var(--available)'],
] as const

// Saldo grande; os centavos ficam em --text-muted.
function Saldo({ texto }: { texto: string }) {
  const i = texto.lastIndexOf(',')
  return <span className="saldo"><Numero texto={texto.slice(0, i)}/><span className="centavos"><Numero texto={texto.slice(i)}/></span></span>
}

/*
 * Bento em grade de 12 colunas:
 *   hero (8) + resumo do mês (4)
 *   distribuição (4) + por categoria (4) + metas (4)
 *   transações recentes (12)
 * Até 1024px o resumo desce para baixo do hero; distribuição e por categoria ficam lado a lado
 * e metas ocupa a linha seguinte. Até 768px, uma coluna só.
 */
export function Dashboard() {
  const { versao } = useAtualizacao()
  // O mês fica na URL (?mes=AAAA-MM); sem ele, ou com valor inválido, o mês atual.
  const [params, setParams] = useSearchParams()
  const atual = chaveMes()
  const mes = mesValido(params.get('mes'), atual)
  const mudarMes = (novo: string) => {
    const proximos = new URLSearchParams(params)
    if (novo === atual) proximos.delete('mes'); else proximos.set('mes', novo)
    setParams(proximos, { replace: true })
  }
  const q = useQuery(`dashboard#${mes}#${versao}`, signal => api<Resumo>('resumo/?mes=' + mes, { signal }))
  const g = useQuery(`graficos#${mes}#${versao}`, async signal => (await api<Graficos>('graficos/?mes=' + mes, { signal })) ?? null)
  const ins = useQuery(`insights#${mes}#${versao}`, async signal => (await api<Insight[]>('insights/?mes=' + mes, { signal })) ?? [])
  const graficos = useUltimo(g.data)
  // Erro nos insights não derruba o dashboard: só o card mostra o erro.
  const insights = Array.isArray(ins.data) ? ins.data : undefined
  const resumo = useUltimo(q.data)
  if (!resumo) return <><h1 className="sr-only">Dashboard</h1><Estado carregando={q.loading} erro={q.error} tentar={q.reload} linhas={3}/></>
  // Distribuição do mês: receitas do mês em despesas, reservado líquido e sobra.
  const base = resumo.mes ? { ...resumo.saldos, receitas: resumo.mes.receitas, despesas: resumo.mes.despesas,
    reservado: resumo.mes.reservado, disponivel: resumo.mes.sobra } : resumo.saldos
  const distribuicao = distribuirDinheiro(base, !!resumo.mes)
  const livre = distribuicao.estado === 'valido' ? distribuicao.segmentos[0].percentual : null
  const despesas = graficos?.despesas_por_categoria ?? []
  const vazio = distribuicao.estado === 'vazio'
  const metas = resumo.metas.slice(0, 3)
  // Enquanto o mês novo carrega, os números do anterior ficam esmaecidos (e trocam com cross-fade ao chegar).
  const atualizando = !q.data && !q.error
  return <div className={'grade items-start transition-opacity' + (atualizando ? ' opacity-60' : '')} aria-busy={atualizando}>
    <h1 className="sr-only">Dashboard</h1>
    {q.error && <div className="col-span-12"><Estado carregando={false} erro={q.error} tentar={q.reload}/></div>}
    {(resumo.vazia ?? vazio) && <Entrada className="col-span-12"><BoasVindas/></Entrada>}

    <Entrada className="col-span-12 bento:col-span-8 self-stretch"><Painel className="hero flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="rotulo-hero">Saldo disponível<span className="sr-only"> no fim do mês selecionado</span></h2>
        <SeletorMes mes={mes} atual={atual} mudar={mudarMes}/>
      </div>
      <p className={'mt-2 break-all ' + (resumo.saldos.disponivel.startsWith('-') ? 'text-bad' : 'text-text')}><Saldo texto={moeda(resumo.saldos.disponivel)}/></p>
      {livre && <p className="frase-hero"><em>{livre}</em> do que entrou continua livre</p>}
      <dl className="indicadores">{indicadores.map(([id, rotulo, cor]) => <div key={id} className="indicador">
        <dt className="flex items-center"><span className="ponto" style={{ background: cor }} aria-hidden/>{rotulo}</dt>
        <dd className="forte mt-1 break-all text-xl"><Numero texto={moeda(resumo.saldos[id])}/></dd>
      </div>)}</dl>
    </Painel></Entrada>

    <Entrada className="col-span-12 bento:col-span-4 self-stretch" delay={0.06}><ResumoMes itens={insights} erro={ins.error} tentar={ins.reload}/></Entrada>

    <Entrada className={'col-span-12 tab:col-span-6 self-stretch ' + (despesas.length > 0 ? 'bento:col-span-4' : 'bento:col-span-6')} delay={0.1} trigger="scroll">
      <Rosca saldos={base} mensal={!!resumo.mes}/>
    </Entrada>

    {despesas.length > 0 && <Entrada className="col-span-12 tab:col-span-6 bento:col-span-4 self-stretch" delay={0.14} trigger="scroll">
      <BarrasCategoria dados={despesas} total={resumo.saldos.despesas}/>
    </Entrada>}

    <Entrada className={'col-span-12 self-stretch ' + (despesas.length > 0 ? 'tab:col-span-12 bento:col-span-4' : 'tab:col-span-6 bento:col-span-6')} delay={0.18} trigger="scroll">
      <Painel><CabecalhoCard titulo="Metas" acao={metas.length > 0 && <VerTodas para="/metas" rotulo="Ver todas as metas"/>}/>
        {metas.length ? <ul className="grid gap-5">{metas.map((m, i) => <li key={m.id}>
          <div className="flex items-baseline justify-between gap-4 text-sm">
            <Link to={'/metas/' + m.id} className="min-w-0 break-words font-medium hover:underline">{m.nome}</Link>
            <strong className="forte text-accent">{m.progresso.percentual.replace('.', ',')}%</strong>
          </div>
          <div className="trilho trilho-fino" role="progressbar" aria-label={'Progresso de ' + m.nome} aria-valuenow={Number(m.progresso.barra)} aria-valuemin={0} aria-valuemax={100}>
            <Barra className="barra-ambar" largura={Number(m.progresso.barra)} atraso={i * 0.1}/>
          </div>
          <p className="mt-1.5 text-xs text-muted"><span className="num">{moeda(m.progresso.acumulado)}</span> de <span className="num">{moeda(m.objetivo)}</span></p>
        </li>)}</ul> : <p className="text-sm text-muted">Nenhuma meta ativa.</p>}
      </Painel>
    </Entrada>

    <Entrada className="col-span-12" delay={0.22} trigger="scroll">
      <Painel><CabecalhoCard titulo="Transações recentes" acao={resumo.recentes.length > 0 && <VerTodas para="/transacoes" rotulo="Ver todas as transações"/>}/>
        <ListaTransacoes itens={resumo.recentes} rotulo="Transações recentes"/></Painel>
    </Entrada>
  </div>
}
