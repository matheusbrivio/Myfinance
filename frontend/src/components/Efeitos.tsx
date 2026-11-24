import { useId, useState, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { ChevronDown } from 'lucide-react'

// Matrix dot loader: grade 3x3 de pontos com onda diagonal.
export function MatrizLoader() {
  const reduz = useReducedMotion()
  return <span className="matriz" aria-hidden>{Array.from({ length: 9 }, (_, i) =>
    <motion.i key={i} initial={{ opacity: 0.25 }} animate={reduz ? { opacity: 0.6 } : { opacity: [0.2, 1, 0.2], scale: [1, 1.25, 1] }}
      transition={reduz ? { duration: 0 } : { duration: 0.9, repeat: Infinity, ease: 'easeInOut', delay: ((i % 3) + Math.floor(i / 3)) * 0.09 }}/>)}</span>
}

// Skeleton loader: linhas de vidro com brilho; somem quando os dados chegam.
export function Esqueleto({ linhas = 4 }: { linhas?: number }) {
  const reduz = useReducedMotion()
  return <div aria-hidden className="grid gap-3">{Array.from({ length: linhas }, (_, i) =>
    <motion.div key={i} className="esq" initial={{ backgroundPosition: '120% 0' }}
      animate={reduz ? undefined : { backgroundPosition: '-120% 0' }}
      transition={{ duration: 1.4, repeat: Infinity, ease: 'linear', delay: i * 0.08 }}/>)}</div>
}

const cores = ['#F59E0B', '#FDBA74', '#2563EB', '#059669', '#E11D48']
// Confetti burst: uma única vez, quando a meta chega a 100%. Posições fixas, sem aleatoriedade em render.
export function Confete() {
  return <span aria-hidden className="confete">{Array.from({ length: 28 }, (_, i) => {
    const ang = (i / 28) * Math.PI * 2 + (i % 3) * 0.2
    const dist = 80 + (i * 37) % 70
    return <motion.i key={i} style={{ background: cores[i % cores.length] }}
      initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
      animate={{ x: Math.round(Math.cos(ang) * dist), y: Math.round(Math.sin(ang) * dist - 20), rotate: (i * 47) % 360, opacity: 0 }}
      transition={{ duration: 0.9, ease: [0.1, 0.7, 0.3, 1] }}/>
  })}</span>
}

// Accordion: altura animada de 0 até auto.
export function Acordeao({ titulo, children, aberto: inicial = true }: { titulo: string; children: ReactNode; aberto?: boolean }) {
  const [aberto, setAberto] = useState(inicial)
  const reduz = useReducedMotion()
  const id = useId()
  return <div className="acordeao">
    <h2 className="titulo-card"><button type="button" className="acordeao-gatilho" aria-expanded={aberto} aria-controls={id}
      onClick={() => setAberto(!aberto)}>{titulo}<motion.span animate={{ rotate: aberto ? 0 : -90 }} transition={{ duration: reduz ? 0 : 0.25 }} className="inline-grid"><ChevronDown size={20} aria-hidden/></motion.span></button></h2>
    <motion.div id={id} role="region" aria-label={titulo} inert={!aberto} className="overflow-hidden"
      initial={false} animate={aberto ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
      transition={{ duration: reduz ? 0 : 0.35, ease: [0.16, 1, 0.3, 1] }}>
      <div className="pt-4">{children}</div>
    </motion.div>
  </div>
}
