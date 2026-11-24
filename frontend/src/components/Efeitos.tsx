import type { CSSProperties } from 'react'

// Texts reveal: palavras sobem de uma máscara com atraso escalonado.
export function TextoReveal({ texto }: { texto: string }) {
  return <>{texto.split(' ').map((p, i, todas) => <span key={i}>
    <span className="reveal-palavra"><span style={{ '--i': i } as CSSProperties}>{p}</span></span>{i < todas.length - 1 && ' '}
  </span>)}</>
}

// Matrix dot loader: grade 3x3 de pontos com onda diagonal.
export function MatrizLoader() {
  return <span className="matriz" aria-hidden>{Array.from({ length: 9 }, (_, i) =>
    <i key={i} style={{ '--i': (i % 3) + Math.floor(i / 3) } as CSSProperties}/>)}</span>
}

// Skeleton loader: linhas com shimmer; somem quando os dados chegam.
export function Esqueleto({ linhas = 4 }: { linhas?: number }) {
  return <div aria-hidden className="grid gap-2">{Array.from({ length: linhas }, (_, i) =>
    <div key={i} className="esq" style={{ '--i': i } as CSSProperties}/>)}</div>
}
