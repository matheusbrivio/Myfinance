import { useEffect, useRef, useState } from 'react'
import { PeakChart } from './PeakChart'
import { useQuery } from '../hooks/useQuery'
import { todas } from '../services/api'
import { PERIODOS, serieGastos, type Periodo } from '../services/serieGastos'
import type { Transacao } from '../types/financeiro'

const reais = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

/** Largura disponível, arredondada em degraus de 20px: o card refaz a textura a cada largura nova. */
function useLargura(max: number) {
  const ref = useRef<HTMLDivElement>(null)
  const [largura, setLargura] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const medir = () => setLargura(Math.max(260, Math.min(max, Math.floor(el.clientWidth / 20) * 20)))
    medir()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(medir)
    ro.observe(el)
    return () => ro.disconnect()
  }, [max])
  return [ref, largura] as const
}

/**
 * Card "Pico de gastos": despesas por dia (semana e mês) ou por mês (ano), com o ponto de maior
 * gasto em destaque. Busca todas as transações (o backend não tem série temporal) e agrega aqui.
 * Se a busca falhar, não mostra nada: o resto do dashboard continua funcionando.
 */
export function PicoDeGastos({ maxWidth = 400 }: { maxWidth?: number }) {
  const q = useQuery('pico-gastos', signal => todas<Transacao>('transacoes/', signal))
  const [periodo, setPeriodo] = useState<Periodo>('Mês')
  const [ref, largura] = useLargura(maxWidth)

  const transacoes = Array.isArray(q.data) ? q.data : []
  const temDespesa = transacoes.some(t => t.tipo === 'despesa')
  const serie = temDespesa ? serieGastos(transacoes, periodo) : null

  const trend = !serie || serie.anterior === 0 || serie.total === serie.anterior
    ? 'none' : serie.total > serie.anterior ? 'up' : 'down'
  const caption = serie?.pico
    ? `Pico em ${serie.pico.rotulo}: ${reais.format(serie.pico.valor)}`
    : 'Nenhum gasto neste período'
  const comparacao = serie && serie.anterior > 0
    ? ` No período anterior: ${reais.format(serie.anterior)}.` : ''

  return (
    <div ref={ref} style={{ width: '100%', maxWidth, display: 'flex', justifyContent: 'center' }}>
      {serie && largura > 0 && (
        <PeakChart
          width={largura}
          data={serie.dados}
          labels={serie.rotulos}
          value={serie.total}
          valuePrefix="R$"
          decimals={2}
          title="Gastos no período"
          caption={caption}
          updatedText={serie.descricao}
          trend={trend}
          trendGood="down"
          periods={PERIODOS}
          period={periodo}
          onPeriodChange={p => setPeriodo(p as Periodo)}
          formatValue={v => reais.format(Math.max(0, v))}
          summary={`Gastos em ${serie.descricao.toLowerCase()}: ${reais.format(serie.total)}. ${caption}.${comparacao}`}
        />
      )}
    </div>
  )
}
