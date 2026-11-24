import { motion, useReducedMotion } from 'motion/react'

// Anel de progresso âmbar com o percentual no centro; cresce do zero.
export function AnelProgresso({ valor, texto, rotulo, atraso = 0 }: { valor: number; texto: string; rotulo: string; atraso?: number }) {
  const reduz = useReducedMotion()
  const raio = 56
  const volta = 2 * Math.PI * raio
  const fracao = Math.min(100, Math.max(0, valor)) / 100
  return <div className="anel" role="progressbar" aria-label={rotulo} aria-valuenow={valor} aria-valuemin={0} aria-valuemax={100}>
    <svg viewBox="0 0 128 128" width="128" height="128" aria-hidden>
      <circle cx="64" cy="64" r={raio} fill="none" stroke="var(--track)" strokeWidth="8"/>
      {fracao > 0 && <motion.circle className="anel-progresso" cx="64" cy="64" r={raio} fill="none" stroke="var(--goal)" strokeWidth="8"
        strokeLinecap="round" strokeDasharray={volta}
        initial={{ strokeDashoffset: reduz ? volta * (1 - fracao) : volta }} animate={{ strokeDashoffset: volta * (1 - fracao) }}
        transition={{ duration: reduz ? 0 : 1.4, ease: [0.16, 1, 0.3, 1], delay: atraso }}/>}
    </svg>
    <span className="forte absolute inset-0 grid place-items-center text-[26px] leading-none text-text">{texto}</span>
  </div>
}
