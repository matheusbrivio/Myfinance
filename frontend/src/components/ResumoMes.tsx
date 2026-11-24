import { motion, useReducedMotion } from 'motion/react'
import { CircleAlert, Info, TrendingUp } from 'lucide-react'
import type { Insight } from '../types/financeiro'
import { CabecalhoCard, Painel, botaoTexto } from './ui'

const estilos = {
  positivo: { Icone: TrendingUp, classe: 'insight-positivo', rotulo: 'Positivo' },
  alerta: { Icone: CircleAlert, classe: 'insight-alerta', rotulo: 'Atenção' },
  neutro: { Icone: Info, classe: 'insight-neutro', rotulo: 'Informação' },
} as const

// "Resumo do mês": até 3 frases calculadas pela API, cada uma com um ícone de 32px pelo tom.
export function ResumoMes({ itens, erro, tentar }: { itens: Insight[] | undefined; erro?: string; tentar?: () => void }) {
  const reduz = useReducedMotion()
  return <Painel className="h-full">
    <CabecalhoCard titulo="Resumo do mês"/>
    {erro ? <div role="alert" className="grid justify-items-start gap-2 text-sm">
        <p className="text-soft">Não foi possível calcular o resumo do mês.</p>
        {tentar && <button type="button" className={botaoTexto + ' -ml-3'} onClick={tentar}>Tentar novamente</button>}
      </div> :
      itens === undefined ? <p role="status" className="text-sm text-muted">Calculando o resumo…</p> :
      itens.length === 0 ? <p className="text-sm text-muted">Ainda não há dados suficientes para o resumo deste mês.</p> :
      <ul role="list" className="grid grid-cols-[minmax(0,1fr)] gap-4" aria-label="Resumo do mês">
        {itens.map((item, i) => {
          const { Icone, classe, rotulo } = estilos[item.tom] ?? estilos.neutro
          return <motion.li role="listitem" key={item.tipo + item.texto} className="flex min-w-0 items-start gap-3"
            initial={reduz ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduz ? 0 : 0.45, delay: reduz ? 0 : 0.15 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}>
            <span className={'insight-icone ' + classe}><Icone size={16} aria-hidden/><span className="sr-only">{rotulo}:</span></span>
            <p className="min-w-0 break-words pt-1.5 text-sm leading-snug">{item.texto}</p>
          </motion.li>
        })}
      </ul>}
  </Painel>
}
