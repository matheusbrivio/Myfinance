import { Link } from 'react-router'
import { ChartNoAxesCombined } from 'lucide-react'
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
import type { Graficos, Resumo } from '../types/financeiro'
import { distribuirDinheiro } from '../services/distribuicao'

// Mini-indicadores do hero (substituem os cards de KPI separados).
const indicadores = [
  ['receitas', 'Receitas', 'var(--income)'], ['despesas', 'Despesas', 'var(--expense)'],
  ['reservado', 'Em metas', 'var(--goal)'], ['patrimonio', 'Patrimônio total', 'var(--available)'],
] as const
const mesAno = () => new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date())

// Saldo grande; os centavos ficam em --text-muted.
function Saldo({ texto }: { texto: string }) {
  const i = texto.lastIndexOf(',')
  return <span className="saldo"><Numero texto={texto.slice(0, i)}/><span className="centavos"><Numero texto={texto.slice(i)}/></span></span>
}

/*
 * Bento em grade de 12 colunas:
 *   hero (8) + distribuição (4)
 *   transações recentes (8, duas linhas) + por categoria (4) / metas (4)
 * Até 1024px a distribuição desce para baixo do hero e categoria/metas ficam lado a lado;
 * até 768px, uma coluna só.
 */
export function Dashboard() {
  const { versao } = useAtualizacao()
  const q = useQuery('dashboard#' + versao, signal => api<Resumo>('resumo/', { signal }))
  const g = useQuery('graficos#' + versao, async signal => (await api<Graficos>('graficos/', { signal })) ?? null)
  const graficos = useUltimo(g.data)
  const resumo = useUltimo(q.data)
  if (!resumo) return <><h1 className="sr-only">Dashboard</h1><Estado carregando={q.loading} erro={q.error} tentar={q.reload} linhas={3}/></>
  const distribuicao = distribuirDinheiro(resumo.saldos)
  const livre = distribuicao.estado === 'valido' ? distribuicao.segmentos[0].percentual : null
  const despesas = graficos?.despesas_por_categoria ?? []
  const vazio = distribuicao.estado === 'vazio'
  const metas = resumo.metas.slice(0, 3)
  return <div className="grade items-start">
    <h1 className="sr-only">Dashboard</h1>
    {q.error && <div className="col-span-12"><Estado carregando={false} erro={q.error} tentar={q.reload}/></div>}
    {vazio && <Entrada className="col-span-12"><Painel className="vazio-dashboard">
      <span className="vazio-icone" aria-hidden><ChartNoAxesCombined size={36}/></span>
      <div><h2 className="titulo-card">Comece registrando sua primeira receita</h2>
        <p className="mt-1 text-sm text-soft">Use o botão “Nova transação” no topo. Os gráficos e metas aparecem assim que houver movimento.</p></div>
    </Painel></Entrada>}

    <Entrada className="col-span-12 bento:col-span-8 self-stretch"><Painel className="hero flex h-full flex-col">
      <h2 className="rotulo-hero">Saldo disponível<span> · {mesAno()}</span></h2>
      <p className={'mt-2 break-all ' + (resumo.saldos.disponivel.startsWith('-') ? 'text-bad' : 'text-text')}><Saldo texto={moeda(resumo.saldos.disponivel)}/></p>
      {livre && <p className="frase-hero"><em>{livre}</em> do que entrou continua livre</p>}
      <dl className="indicadores">{indicadores.map(([id, rotulo, cor]) => <div key={id} className="indicador">
        <dt className="flex items-center"><span className="ponto" style={{ background: cor }} aria-hidden/>{rotulo}</dt>
        <dd className="forte mt-1 break-all text-xl"><Numero texto={moeda(resumo.saldos[id])}/></dd>
      </div>)}</dl>
    </Painel></Entrada>

    <Entrada className="col-span-12 bento:col-span-4 self-stretch" delay={0.06}><Rosca saldos={resumo.saldos}/></Entrada>

    <Entrada className="col-span-12 bento:col-span-8 bento:row-span-2 self-stretch" delay={0.1} trigger="scroll">
      <Painel className="h-full"><CabecalhoCard titulo="Transações recentes" acao={resumo.recentes.length > 0 && <VerTodas para="/transacoes" rotulo="Ver todas as transações"/>}/>
        <ListaTransacoes itens={resumo.recentes} rotulo="Transações recentes"/></Painel>
    </Entrada>

    {despesas.length > 0 && <Entrada className="col-span-12 tab:col-span-6 bento:col-span-4" delay={0.14} trigger="scroll">
      <BarrasCategoria dados={despesas} total={resumo.saldos.despesas}/>
    </Entrada>}

    <Entrada className={'col-span-12 bento:col-span-4 ' + (despesas.length > 0 ? 'tab:col-span-6' : '')} delay={0.18} trigger="scroll">
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
  </div>
}
