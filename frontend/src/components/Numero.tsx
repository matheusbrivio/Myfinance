import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useReduzMovimento } from '../hooks/useReduzMovimento'

const digitos = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

// Spinning counter na abertura; number subtle change nas trocas seguintes.
// O texto final fica em sr-only: leitores de tela e testes enxergam o valor real.
export function Numero({ texto, className = '' }: { texto: string; className?: string }) {
  const reduz = useReduzMovimento()
  const [fase, setFase] = useState<'giro' | 'estavel'>('giro')
  const anterior = useRef(texto)
  useEffect(() => {
    const t = window.setTimeout(() => setFase('estavel'), 700)
    return () => window.clearTimeout(t)
  }, [])
  const mudou = anterior.current !== texto
  useEffect(() => { anterior.current = texto })
  if (reduz) return <span className={'num ' + className}>{texto}</span>
  if (fase === 'estavel') return <span key={texto} className={'num ' + className + (mudou ? ' troca' : '')}>{texto}</span>
  let i = 0
  return <span className={'num ' + className}>
    <span className="sr-only">{texto}</span>
    <span aria-hidden>{[...texto].map((c, k) => /\d/.test(c)
      ? <span key={k} className="dig"><span className="dig-col" style={{ '--d': Number(c), '--i': i++ } as CSSProperties}>
        {digitos.map(d => <span key={d}>{d}</span>)}</span></span>
      : <span key={k}>{c}</span>)}</span>
  </span>
}

// Number pop-in: percentual da meta.
export function PercentualPop({ texto }: { texto: string }) {
  return <strong key={texto} className="num pop">{texto}</strong>
}
