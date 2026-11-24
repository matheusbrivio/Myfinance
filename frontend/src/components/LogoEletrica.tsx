import { lazy, Suspense, useState } from 'react'
import { useReducedMotion } from 'motion/react'

// ogl só é baixado quando o estado vazio aparece.
const ElectricLogo = lazy(() => import('./ElectricLogo'))

function temWebGL2() {
  if (typeof WebGL2RenderingContext === 'undefined') return false
  try { return !!document.createElement('canvas').getContext('webgl2') } catch { return false }
}

// Logo elétrica grande no estado vazio; com reduced-motion ou sem WebGL2, SVG estático.
// Desmonta junto com o estado vazio, porque o efeito renderiza sem parar enquanto está visível.
export function LogoEletrica({ tamanho = 320 }: { tamanho?: number }) {
  const reduz = useReducedMotion()
  const [webgl] = useState(temWebGL2)
  const estatica = <img src="/react-assets/logo.svg" alt="" width={tamanho * 0.6} height={tamanho * 0.6} className="logo-estatica"/>
  return <div className="logo-eletrica" style={{ width: tamanho, height: tamanho }} aria-hidden>
    {reduz || !webgl ? estatica : <Suspense fallback={estatica}>
      <ElectricLogo src="/react-assets/logo-electric-src.svg" color="#EAF7FF" glowColor="#5FB4E0" scale={0.62} strands={3} bend={0.5}
        crackle={1.2} arcs={0.6} flicker={0.4} speed={1.6} cursorIntensity={0.6}/>
    </Suspense>}
  </div>
}
