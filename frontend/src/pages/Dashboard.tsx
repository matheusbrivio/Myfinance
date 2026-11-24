import { Link } from 'react-router'
import { api } from '../services/api'
import { moeda } from '../services/format'
import { useQuery } from '../hooks/useQuery'
import { useAtualizacao } from '../layouts/contexto'
import { BarrasCategoria } from '../components/BarrasCategoria'
import { ListaTransacoes } from '../components/ListaTransacoes'
import { Rosca } from '../components/Rosca'
import { Estado, Painel, Secao } from '../components/ui'
import { Numero } from '../components/Numero'
import { Entrada } from '../components/Entrada'
import type { Graficos, Resumo } from '../types/financeiro'
import { distribuirDinheiro } from '../services/distribuicao'

const kpis = [
  ['receitas', 'Receitas', 'var(--income)'], ['despesas', 'Despesas', 'var(--expense)'],
  ['reservado', 'Reservado em metas', 'var(--accent)'], ['disponivel', 'Disponível', 'var(--available)'],
] as const
const mesAno = () => new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date()).replace(' de ', ' ')

// Saldo enorme em serifa; os centavos ficam mais apagados.
function Saldo({ texto }: { texto: string }) {
  const i = texto.lastIndexOf(',')
  return <span className="serif saldo"><Numero texto={texto.slice(0, i)}/><span className="centavos"><Numero texto={texto.slice(i)}/></span></span>
}

export function Dashboard() {
  const { versao } = useAtualizacao()
  const q = useQuery('dashboard#' + versao, signal => api<Resumo>('resumo/', { signal }))
  const g = useQuery('graficos#' + versao, async signal => (await api<Graficos>('graficos/', { signal })) ?? null)
  if (!q.data) return <Estado carregando={q.loading} erro={q.error} tentar={q.reload} linhas={3}/>
  const resumo = q.data
  const distribuicao = distribuirDinheiro(resumo.saldos)
  const livre = distribuicao.estado === 'valido' ? distribuicao.segmentos[0].percentual : null
  const despesas = g.data?.despesas_por_categoria ?? []
  const vazio = distribuicao.estado === 'vazio'
  return <div className="space-y-6">
    <Entrada><section className="hero">
      <div>
        <h2 className="rotulo-hero">Saldo disponível<span> · {mesAno()}</span></h2>
        <p className={'mt-3 break-all ' + (resumo.saldos.disponivel.startsWith('-') ? 'text-bad' : 'text-text')}><Saldo texto={moeda(resumo.saldos.disponivel)}/></p>
        {livre && <p className="frase-hero"><em>{livre}</em> de tudo que entrou continua livre para usar</p>}
      </div>
      <div className="glass patrimonio">
        <p className="rotulo-secao">Patrimônio total controlado</p>
        <p className="serif mt-2 break-all text-4xl"><Numero texto={moeda(resumo.saldos.patrimonio)}/></p>
      </div>
    </section></Entrada>
    {vazio && <Entrada><Painel className="vazio-dashboard">
      <img src="/logo.svg" alt="" width={120} height={120}/>
      <div><h2 className="titulo-card">Comece registrando sua primeira receita</h2>
        <p className="mt-2 text-soft">Use o botão “Nova transação” no topo. Os gráficos e metas aparecem assim que houver movimento.</p></div>
    </Painel></Entrada>}
    <Entrada agrupar delay={0.06} className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(230px,1fr))]">{kpis.map(([id, titulo, cor]) => <Painel key={id} className="kpi">
      <h2 className="rotulo-secao flex items-center gap-2"><span className="ponto" style={{ background: cor, color: cor }} aria-hidden/>{titulo}</h2>
      <p className="num mt-3 break-all text-2xl font-medium" style={{ color: cor }}><Numero texto={moeda(resumo.saldos[id])}/></p>
    </Painel>)}</Entrada>
    <Entrada trigger="scroll" className="grid items-start gap-6 lg:grid-cols-2">
      <Rosca saldos={resumo.saldos}/>
      {despesas.length > 0 && <BarrasCategoria dados={despesas} total={resumo.saldos.despesas}/>}
    </Entrada>
    <Entrada trigger="scroll" className="grid items-start gap-6 lg:grid-cols-2">
      <Painel><Secao n="03" rotulo="Transações recentes" titulo="Transações recentes"/><ListaTransacoes itens={resumo.recentes} rotulo="Transações recentes"/></Painel>
      <Painel><Secao n="04" rotulo="Metas em andamento" titulo="Metas em andamento"/>
        {resumo.metas.length ? <ul className="grid gap-6">{resumo.metas.map(m => <li key={m.id}>
          <div className="flex items-baseline justify-between gap-4">
            <Link to={'/metas/' + m.id} className="break-words text-soft hover:text-text">{m.nome}</Link>
            <strong className="serif text-4xl font-normal text-accent">{m.progresso.percentual.replace('.', ',')}%</strong>
          </div>
          <div className="trilho trilho-fino" role="progressbar" aria-label={'Progresso de ' + m.nome} aria-valuenow={Number(m.progresso.barra)} aria-valuemin={0} aria-valuemax={100}>
            <div className="barra-ambar" style={{ width: m.progresso.barra + '%' }}/>
          </div>
          <p className="mt-2 text-sm text-muted"><span className="num">{moeda(m.progresso.acumulado)}</span> de <span className="num">{moeda(m.objetivo)}</span></p>
        </li>)}</ul> : <p className="text-muted">Nenhuma meta ativa.</p>}
      </Painel>
    </Entrada>
  </div>
}
