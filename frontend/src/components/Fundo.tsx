import { useEffect, useState } from 'react'
import GradientASCII from './GradientASCII'
import GlowCursor from './GlowCursor'

const CORES = ['#1e3fd8', '#f6f8ff', '#a5d8ff', '#38bdf8']
const consulta = '(min-width: 768px)'

function temWebGL2() {
  try { return !!document.createElement('canvas').getContext('webgl2') } catch { return false }
}
const q = (c: string) => window.matchMedia?.(c).matches === true
function usarAscii() { return q(consulta) && temWebGL2() }
// Glow só com mouse (pointer fino), tela larga e sem reduced-motion.
function usarCursor() { return usarAscii() && !q('(pointer: coarse)') && !q('(prefers-reduced-motion: reduce)') }

// Fundo único: ASCII vívido no topo, escurecido por máscara no resto.
// Telas pequenas ou sem WebGL2 recebem um gradiente CSS estático.
export function Fundo() {
  const [ascii, setAscii] = useState(usarAscii)
  const [cursor, setCursor] = useState(usarCursor)
  useEffect(() => {
    const ms = [consulta, '(pointer: coarse)', '(prefers-reduced-motion: reduce)'].map(c => window.matchMedia?.(c))
    const mudar = () => { setAscii(usarAscii()); setCursor(usarCursor()) }
    ms.forEach(m => m?.addEventListener('change', mudar))
    return () => ms.forEach(m => m?.removeEventListener('change', mudar))
  }, [])
  return <div className="fundo" aria-hidden>
    {ascii ? <GradientASCII className="fundo-ascii" colors={CORES} shape="horizon" characters=" =+xX0S8#@"
      cellSize={18} density={0.8} dpr={1.5} mouseInteraction={false} clickEffect="none"/> : <div className="fundo-estatico"/>}
    {cursor && <div className="fundo-faixa"><GlowCursor color="#5f8bff" intensity={0.8} trailWidth={2} linger={0.8} glow={0.7}
      hotspot={0.5} clickBurst={false} quality="medium" maxDevicePixelRatio={1.5} theme="dark"/></div>}
    <div className="fundo-mascara"/>
  </div>
}
