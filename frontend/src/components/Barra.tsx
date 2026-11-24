import { motion, useReducedMotion } from 'motion/react'

// Preenchimento de barra que cresce do zero até `largura` (%), com atraso para o stagger.
export function Barra({ largura, className, atraso = 0 }: { largura: number; className: string; atraso?: number }) {
  const reduz = useReducedMotion()
  return <motion.div className={className} style={{ width: largura + '%', originX: 0 }}
    initial={{ scaleX: reduz ? 1 : 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }}
    transition={{ duration: reduz ? 0 : 1.3, ease: [0.16, 1, 0.3, 1], delay: atraso }}/>
}
