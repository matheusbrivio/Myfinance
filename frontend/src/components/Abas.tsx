import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'

// Indicador deslizante: mede o item ativo e move uma barra com transform.
export function useDeslizante(seletor: string, chave: unknown) {
  const ref = useRef<HTMLDivElement>(null)
  const [caixa, setCaixa] = useState<{ x: number; w: number; y: number; h: number }>()
  useLayoutEffect(() => {
    const medir = () => {
      const raiz = ref.current
      const ativo = raiz?.querySelector<HTMLElement>(seletor)
      if (!raiz || !ativo) return setCaixa(undefined)
      setCaixa({ x: ativo.offsetLeft, w: ativo.offsetWidth, y: ativo.offsetTop, h: ativo.offsetHeight })
    }
    medir()
    if (typeof ResizeObserver === 'undefined' || !ref.current) return
    const obs = new ResizeObserver(medir)
    obs.observe(ref.current)
    return () => obs.disconnect()
  }, [seletor, chave])
  const indicador = caixa && <span aria-hidden className="indicador"
    style={{ transform: `translate(${caixa.x}px, ${caixa.y}px)`, width: caixa.w, height: caixa.h }}/>
  return { ref, indicador }
}

export type OpcaoAba = { valor: string; rotulo: string }
// Abas segmentadas (Todas / Receitas / Despesas).
export function Abas({ opcoes, valor, mudar, rotulo }: {
  opcoes: OpcaoAba[]; valor: string; mudar: (v: string) => void; rotulo: string
}): ReactNode {
  const { ref, indicador } = useDeslizante('[aria-selected="true"]', valor)
  return <div ref={ref} role="tablist" aria-label={rotulo} className="abas">
    {indicador}
    {opcoes.map(o => <button key={o.valor} role="tab" type="button" aria-selected={o.valor === valor}
      className="aba" onClick={() => mudar(o.valor)}>{o.rotulo}</button>)}
  </div>
}
