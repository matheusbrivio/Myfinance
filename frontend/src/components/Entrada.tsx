import { Children, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'

const suave = [0.16, 1, 0.3, 1] as const

// Entrada padrão: sobe 18px, sai do blur de 6px até nítido, 0,9s. `agrupar` anima os filhos em sequência.
export function Entrada({ agrupar = false, trigger = 'mount', delay = 0, className, children }: {
  agrupar?: boolean; trigger?: 'mount' | 'scroll'; delay?: number; className?: string; children: ReactNode
}) {
  const reduz = useReducedMotion()
  const variante = (atraso: number) => reduz ? {} : ({
    initial: { opacity: 0, y: 18, filter: 'blur(6px)' },
    ...(trigger === 'scroll'
      ? { whileInView: { opacity: 1, y: 0, filter: 'blur(0px)' }, viewport: { once: true, margin: '0px 0px -8% 0px' } }
      : { animate: { opacity: 1, y: 0, filter: 'blur(0px)' } }),
    transition: { duration: 0.9, ease: suave, delay: atraso },
  })
  if (!agrupar) return <motion.div className={className} {...variante(delay)}>{children}</motion.div>
  return <div className={className}>{Children.map(children, (filho, i) =>
    <motion.div className="min-w-0" {...variante(delay + i * 0.08)}>{filho}</motion.div>)}</div>
}
