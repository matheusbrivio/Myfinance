import { useId, useState, type CSSProperties, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

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

const cores = ['#7dd3fc', '#4ade80', '#fbbf24', '#fb7185', '#f6f8ff']
// Confetti burst: só quando a meta chega a 100%. Posições fixas, sem aleatoriedade em render.
export function Confete() {
  return <span aria-hidden className="confete">{Array.from({ length: 28 }, (_, i) => {
    const ang = (i / 28) * Math.PI * 2 + (i % 3) * 0.2
    const dist = 70 + (i * 37) % 60
    return <i key={i} style={{ '--dx': Math.round(Math.cos(ang) * dist) + 'px', '--dy': Math.round(Math.sin(ang) * dist - 20) + 'px',
      '--r': (i * 47) % 360 + 'deg', background: cores[i % cores.length] } as CSSProperties}/>
  })}</span>
}

// Accordion: altura animada por grid-template-rows, sem medir conteúdo.
export function Acordeao({ titulo, children, aberto: inicial = true }: { titulo: string; children: ReactNode; aberto?: boolean }) {
  const [aberto, setAberto] = useState(inicial)
  const id = useId()
  return <div className="acordeao" data-aberto={aberto}>
    <h2 className="text-lg font-semibold"><button type="button" className="acordeao-gatilho" aria-expanded={aberto} aria-controls={id}
      onClick={() => setAberto(!aberto)}>{titulo}<ChevronDown size={18} aria-hidden/></button></h2>
    <div id={id} className="acordeao-corpo" role="region" aria-label={titulo} inert={!aberto}><div>{children}</div></div>
  </div>
}
