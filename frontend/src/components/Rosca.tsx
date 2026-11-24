import { Component, type ReactNode } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { motion, useReducedMotion } from 'motion/react'
import { moeda } from '../services/format'
import { distribuirDinheiro } from '../services/distribuicao'
import type { Resumo } from '../types/financeiro'
import { Painel, Secao } from './ui'

class LimiteGrafico extends Component<{ children: ReactNode }, { falhou: boolean }> {
  state = { falhou: false }
  static getDerivedStateFromError() { return { falhou: true } }
  render() { return this.state.falhou ? <p className="text-muted">O gráfico está indisponível. Consulte a legenda.</p> : this.props.children }
}

// 01 — Distribuição: rosca fina com pontas arredondadas, total de receitas no centro e legenda.
export function Rosca({ saldos }: { saldos: Resumo['saldos'] }) {
  const reduz = useReducedMotion()
  const distribuicao = distribuirDinheiro(saldos)
  const setores = distribuicao.estado === 'valido' ? distribuicao.segmentos.filter(s => s.proporcao > 0) : []
  return <Painel className="@container"><Secao n="01" rotulo="Distribuição" titulo="Distribuição do dinheiro"/>
    {distribuicao.estado === 'vazio' ? <p className="text-muted">Nenhuma receita registrada para distribuir.</p> :
    <div className={distribuicao.estado === 'valido' ? 'grid items-center gap-6 @lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)]' : 'space-y-3'}>
      {distribuicao.estado === 'valido' ? <LimiteGrafico><div className="rosca relative mx-auto h-[250px] w-full max-w-[260px]">
        <motion.div className="absolute inset-0" initial={reduz ? false : { rotate: -70, opacity: 0 }} whileInView={{ rotate: 0, opacity: 1 }}
          viewport={{ once: true }} transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 250, height: 250 }}>
          <PieChart>
            <Pie data={setores} dataKey="proporcao" nameKey="nome" innerRadius={105} outerRadius={119} cornerRadius={7}
              paddingAngle={setores.length > 1 ? 5 : 0} startAngle={90} endAngle={-270}
              stroke="none" isAnimationActive={false}>
              {setores.map(s => <Cell key={s.id} fill={s.cor}/>)}
            </Pie>
            <Tooltip content={({ active, payload }) => {
              const s = payload?.[0]?.payload as (typeof setores)[number] | undefined
              return active && s ? <div className="glass rounded-2xl px-3 py-2 text-sm">
                <strong>{s.nome}</strong><div className="num">{moeda(s.valor)} · {s.percentual}</div>
              </div> : null
            }}/>
          </PieChart>
        </ResponsiveContainer>
        </motion.div>
        <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
          <span className="text-xs text-muted">Total de receitas</span>
          <strong className="forte max-w-36 break-all text-2xl">{moeda(saldos.receitas)}</strong>
        </div>
      </div></LimiteGrafico> : <p className="text-muted">
        {distribuicao.estado === 'negativo'
          ? 'O saldo disponível está negativo. Veja os valores reais abaixo, sem percentuais.'
          : 'Os valores não formam uma distribuição do total de receitas. Veja os valores reais abaixo, sem percentuais.'}
      </p>}
      <ul aria-label="Legenda da distribuição" className="grid gap-1">{distribuicao.segmentos.map(s => <li key={s.id} className="legenda-item">
        <span className="break-words"><span className="ponto" style={{ background: s.cor, color: s.cor }} aria-hidden/>{s.nome}</span>
        <span className="break-all">{'percentual' in s && <><b className="forte text-lg">{s.percentual}</b> · </>}<span className="num text-soft">{moeda(s.valor)}</span></span></li>)}</ul>
    </div>}
  </Painel>
}
