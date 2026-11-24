import { useEffect, useState } from 'react'
import LiquidEther from './LiquidEther'

const CORES = ['#93C5FD', '#3B82F6', '#FDBA74']
const consultas = ['(min-width: 768px)', '(prefers-reduced-motion: reduce)']

function temWebGL2() {
  if (typeof WebGL2RenderingContext === 'undefined') return false
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
    {fluido ? <LiquidEther lightMode colors={CORES} intensity={0.9} mouseForce={12} cursorSize={120} persistence={0.8}
      viscosity={0.3} resolution={0.3} autoDemo autoSpeed={0.2} autoIntensity={1.4} clickBurst={false}
      backgroundColor="#EEF1F5" maxDevicePixelRatio={1.5}/> : <div className="fundo-estatico"/>}
    <div className="fundo-veu"/>
  </div>
}
