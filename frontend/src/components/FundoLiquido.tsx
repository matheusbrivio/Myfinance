import { useEffect, useState } from 'react'
import LiquidEther from './LiquidEther'

const CORES = ['#1F5F73', '#6FB7D6', '#F0B27A']
const consultas = ['(min-width: 768px)', '(prefers-reduced-motion: reduce)']

function temWebGL2() {
  try { return !!document.createElement('canvas').getContext('webgl2') } catch { return false }
}
const casa = (c: string) => window.matchMedia?.(c).matches === true
// Fluido só em tela larga, sem reduced-motion e com WebGL2; senão, gradiente estático.
function usarFluido() { return casa(consultas[0]) && !casa(consultas[1]) && temWebGL2() }

export function FundoLiquido() {
  const [fluido, setFluido] = useState(usarFluido)
  useEffect(() => {
    const ms = consultas.map(c => window.matchMedia?.(c))
    const mudar = () => setFluido(usarFluido())
    ms.forEach(m => m?.addEventListener('change', mudar))
    return () => ms.forEach(m => m?.removeEventListener('change', mudar))
  }, [])
  return <div className="fundo" aria-hidden>
    {fluido ? <LiquidEther colors={CORES} intensity={1.1} mouseForce={14} cursorSize={110} persistence={0.8}
      viscosity={0.25} resolution={0.3} autoDemo autoSpeed={0.25} autoIntensity={1.6} clickBurst={false} intro
      backgroundColor="#05070C" maxDevicePixelRatio={1.5}/> : <div className="fundo-estatico"/>}
    <div className="fundo-veu"/>
  </div>
}
