import { Component, type ReactNode } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { useReduzMovimento } from '../hooks/useReduzMovimento'
import { api } from '../services/api'
import { moeda } from '../services/format'
import { useQuery } from '../hooks/useQuery'
import { CardMeta } from '../components/CardMeta'
import { Historico } from '../components/Historico'
import { Estado, Painel } from '../components/ui'
import { Numero } from '../components/Numero'
import { Entrada } from '../components/Entrada'
import type { Resumo } from '../types/financeiro'
import { distribuirDinheiro } from '../services/distribuicao'

class LimiteGrafico extends Component<{ children: ReactNode }, { falhou: boolean }> {
  state = { falhou: false }
  static getDerivedStateFromError() { return { falhou: true } }
  render() { return this.state.falhou ? <p className="text-muted">O gráfico está indisponível. Consulte a legenda.</p> : this.props.children }
}
function Grafico({ saldos }: { saldos: Resumo['saldos'] }) {
  const reduz = useReduzMovimento()
  const distribuicao = distribuirDinheiro(saldos)
  const setores = distribuicao.estado === 'valido' ? distribuicao.segmentos.filter(s => s.proporcao > 0) : []
  return <Painel><h2 className="mb-2 text-lg font-semibold">Distribuição do dinheiro</h2>
    {distribuicao.estado === 'vazio' ? <p className="text-muted">Nenhuma receita registrada para distribuir.</p> :
    <div className={distribuicao.estado === 'valido' ? 'grid items-center gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]' : 'space-y-3'}>
      {distribuicao.estado === 'valido' ? <LimiteGrafico><div className="relative h-56 min-w-0 md:h-64">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{width: 220, height: 224}}>
          <PieChart>
            <Pie data={setores} dataKey="proporcao" nameKey="nome" innerRadius="55%" outerRadius="77%"
              paddingAngle={setores.length > 1 ? 3 : 0}
              stroke="none" isAnimationActive={!reduz} animationDuration={380} animationEasing="ease-out">
              {setores.map(s => <Cell key={s.id} fill={s.cor}/>)}
            </Pie>
            <Tooltip content={({ active, payload }) => {
              const s = payload?.[0]?.payload as (typeof setores)[number] | undefined
              return active && s ? <div className="rounded border border-line bg-base p-2">
                <strong>{s.nome}</strong><div>{moeda(s.valor)} · {s.percentual}</div>
              </div> : null
            }}/>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
          <span className="text-xs text-muted">Total de receitas</span>
          <strong className="max-w-28 break-all text-sm tabular-nums">{moeda(saldos.receitas)}</strong>
        </div>
      </div></LimiteGrafico> : <p className="text-muted">
        {distribuicao.estado === 'negativo'
          ? 'O saldo disponível está negativo. Veja os valores reais abaixo, sem percentuais.'
          : 'Os valores não formam uma distribuição do total de receitas. Veja os valores reais abaixo, sem percentuais.'}
      </p>}
      <ul aria-label="Legenda da distribuição" className="grid gap-2">{distribuicao.segmentos.map(s => <li key={s.id} className="flex flex-wrap justify-between gap-x-4 gap-y-1 border-b border-line py-2 text-sm">
        <span className="break-words"><span className="mr-2 inline-block size-2.5 rounded-full" style={{ background: s.cor }} aria-hidden/>{s.nome}</span>
        <span className="break-all tabular-nums">{'percentual' in s && s.percentual + ' · '}{moeda(s.valor)}</span></li>)}</ul>
    </div>}
  </Painel>
}
const secundarios = [['receitas', 'Receitas convencionais'], ['despesas', 'Despesas convencionais'], ['reservado', 'Saldo reservado em metas'], ['patrimonio', 'Patrimônio total controlado']] as const
const cor = (id: string, valor: string) => valor.startsWith('-') || id === 'despesas' ? 'text-bad' : id === 'receitas' ? 'text-good' : id === 'reservado' ? 'text-warn' : 'text-accent'
export function Dashboard() {
  const q = useQuery('dashboard', signal => api<Resumo>('resumo/', { signal }))
  if (!q.data) return <Estado carregando={q.loading} erro={q.error} tentar={q.reload} linhas={3}/>
  const resumo = q.data
  return <div className="space-y-4">
    <Entrada><Painel className="hero">
      <h2 className="font-mono text-xs uppercase tracking-wider text-muted">Saldo disponível</h2>
      <p className={'mt-2 break-all text-4xl font-semibold tracking-tight sm:text-6xl ' + cor('disponivel', resumo.saldos.disponivel)}><Numero texto={moeda(resumo.saldos.disponivel)}/></p>
    </Painel></Entrada>
    <Entrada agrupar delay={0.06} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{secundarios.map(([id, titulo]) => <Painel key={id}>
      <h2 className="mb-2 font-mono text-xs uppercase tracking-wider text-muted">{titulo}</h2>
      <p className={'break-all text-xl font-semibold ' + cor(id, resumo.saldos[id])}><Numero texto={moeda(resumo.saldos[id])}/></p>
    </Painel>)}</Entrada>
    <Entrada trigger="scroll"><Grafico saldos={resumo.saldos}/></Entrada>
    <Entrada trigger="scroll"><Painel><h2 className="mb-3 text-lg font-semibold">Transações recentes</h2><Historico itens={resumo.recentes}/></Painel></Entrada>
    <Entrada trigger="scroll"><section><h2 className="mb-3 text-xl font-semibold">Metas financeiras</h2>
      {resumo.metas.length ? <Entrada agrupar trigger="scroll" className="grid gap-3 lg:grid-cols-2">{resumo.metas.map(meta => <CardMeta key={meta.id} meta={meta}/>)}</Entrada> : <p className="text-muted">Nenhuma meta ativa.</p>}
    </section></Entrada>
  </div>
}
