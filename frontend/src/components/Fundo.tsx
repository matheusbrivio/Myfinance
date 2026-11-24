import { useEffect, useState } from 'react'
import GradientASCII from './GradientASCII'

const CORES = ['#1e3fd8', '#f6f8ff', '#a5d8ff', '#38bdf8']
const consulta = '(min-width: 768px)'

function temWebGL2() {
  try { return !!document.createElement('canvas').getContext('webgl2') } catch { return false }
}
function usarAscii() {
  return window.matchMedia?.(consulta).matches === true && temWebGL2()
}

// Fundo único: ASCII vívido no topo, escurecido por máscara no resto.
// Telas pequenas ou sem WebGL2 recebem um gradiente CSS estático.
export function Fundo() {
  const [ascii, setAscii] = useState(usarAscii)
  useEffect(() => {
    const m = window.matchMedia?.(consulta)
    if (!m) return
    const mudar = () => setAscii(usarAscii())
    m.addEventListener('change', mudar)
    return () => m.removeEventListener('change', mudar)
  }, [])
  return <div className="fundo" aria-hidden>
    {ascii ? <GradientASCII className="fundo-ascii" colors={CORES} shape="horizon" characters=" =+xX0S8#@"
      cellSize={18} density={0.8} dpr={1.5} mouseInteraction={false}/> : <div className="fundo-estatico"/>}
    <div className="fundo-mascara"/>
  </div>
}
