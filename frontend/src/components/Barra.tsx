import { useRef } from 'react'
import { motion, useInView, useReducedMotion } from 'motion/react'

// Preenchimento de barra que cresce do zero até `largura` (%), com atraso para o stagger.
// Observa o contêiner de largura cheia: o preenchimento começa com scaleX(0), área zero,
// e dentro de um trilho com overflow: hidden nunca seria dado como visível.
export function Barra({ largura, className, atraso = 0 }: { largura: number; className: string; atraso?: number }) {
  const reduz = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const visivel = useInView(ref, { once: true })
  return <div ref={ref} className="h-full w-full">
    <motion.div className={className} style={{ width: largura + '%', originX: 0 }}
      initial={{ scaleX: reduz ? 1 : 0 }} animate={visivel || reduz ? { scaleX: 1 } : undefined}
      transition={{ duration: reduz ? 0 : 1.3, ease: [0.16, 1, 0.3, 1], delay: atraso }}/>
  </div>
}
