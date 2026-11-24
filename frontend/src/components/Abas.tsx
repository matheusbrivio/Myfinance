import { type ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { useEmTransicao } from '../layouts/transicao'

export const mola = { type: 'spring', stiffness: 400, damping: 32 } as const

// Fundo deslizante compartilhado por menu e abas: `layoutId` move a pílula entre os itens.
export function PilulaAtiva({ id }: { id: string }) {
  const reduz = useReducedMotion()
  // Durante a descida intro → app a cena inteira se move; sem layoutId a pílula não "persegue" a posição.
  const emTransicao = useEmTransicao()
  if (emTransicao) return <span aria-hidden className="pilula-ativa"/>
  return <motion.span aria-hidden layoutId={id} className="pilula-ativa" transition={reduz ? { duration: 0 } : mola}/>
}

export type OpcaoAba = { valor: string; rotulo: string }
// Abas em pílula (Todas / Receitas / Despesas), mesmo estilo do menu.
export function Abas({ opcoes, valor, mudar, rotulo, id = 'abas' }: {
  opcoes: OpcaoAba[]; valor: string; mudar: (v: string) => void; rotulo: string; id?: string
}): ReactNode {
  return <div role="tablist" aria-label={rotulo} className="segmentado">
    {opcoes.map(o => <button key={o.valor} role="tab" type="button" aria-selected={o.valor === valor}
      className="pilula-item" onClick={() => mudar(o.valor)}>
      {o.valor === valor && <PilulaAtiva id={id}/>}
      <span className="pilula-texto">{o.rotulo}</span>
    </button>)}
  </div>
}
