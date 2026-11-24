import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

const digitos = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
const suave = [0.16, 1, 0.3, 1] as const

// Spinning counter na montagem (0,9s); depois, cross-fade só dos dígitos que mudaram.
// O texto real fica em sr-only; a parte visual é aria-hidden.
export function Numero({ texto, className = '' }: { texto: string; className?: string }) {
  const reduz = useReducedMotion()
  const [primeira, setPrimeira] = useState(true)
  useEffect(() => {
    const t = window.setTimeout(() => setPrimeira(false), 1300)
    return () => window.clearTimeout(t)
  }, [])
  if (reduz) return <span className={'num-anim ' + className}>{texto}</span>
  let ordem = 0
  return <span className={'num-anim ' + className}>
    <span className="sr-only">{texto}</span>
    <span aria-hidden className="inline-flex">{[...texto].map((c, i) => {
      if (!/\d/.test(c)) return <span key={i + c} className="whitespace-pre">{c}</span>
      const d = Number(c)
      const atraso = ordem++ * 0.03
      if (primeira) return <span key={i} className="digito">
        <motion.span className="digito-coluna" initial={{ y: '0em' }} animate={{ y: -d + 'em' }} transition={{ duration: 0.9, ease: suave, delay: atraso }}>
          {digitos.map(n => <span key={n}>{n}</span>)}
        </motion.span>
      </span>
      return <span key={i} className="digito"><AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={c} className="inline-block" initial={{ opacity: 0, y: '0.35em', filter: 'blur(2px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: '-0.35em', filter: 'blur(2px)' }}
          transition={{ duration: 0.28, ease: 'easeOut' }}>{c}</motion.span>
      </AnimatePresence></span>
    })}</span>
  </span>
}
