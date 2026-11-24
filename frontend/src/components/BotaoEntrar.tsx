import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowDown } from 'lucide-react'
import SpecularButton from './SpecularButton'
import { useSegurar } from '../hooks/useSegurar'

const CHAVE_VISITA = 'mf-intro-visitada'

// "Segure para entrar": visual do SpecularButton com a mecânica de segurar (1 s).
// Soltar antes volta o progresso em 200 ms; ao completar, faz o flash e chama aoEntrar.
export function BotaoEntrar({ aoEntrar }: { aoEntrar: () => void }) {
  const reduz = useReducedMotion()
  const [flash, setFlash] = useState(0)
  // A seta pulsa 2 vezes só na primeira visita da sessão.
  const [primeiraVisita] = useState(() => {
    try { return sessionStorage.getItem(CHAVE_VISITA) === null } catch { return false }
  })
  useEffect(() => { try { sessionStorage.setItem(CHAVE_VISITA, '1') } catch { /* sem storage */ } }, [])
  const { progress, fase, handlers } = useSegurar({
    tempo: 1000, soltar: 200,
    aoCompletar: () => { setFlash(n => n + 1); aoEntrar() },
  })
  return <div className="botao-entrar">
    <SpecularButton size="lg" radius={999} tint="#0F172A" tintOpacity={0.92} textColor="#FFFFFF"
      lineColor="#FFFFFF" baseColor="#475569" idleIntensity={0.45} thickness={1.4}
      followMouse proximity={220} progress={progress} flash={flash} data-fase={fase}
      aria-label="Segure para entrar no MyFinance" aria-describedby="dica-entrar" {...handlers}>
      <motion.span className="inline-flex" aria-hidden
        animate={primeiraVisita && !reduz ? { y: [0, 3, 0, 3, 0] } : undefined}
        transition={{ duration: 1.2, delay: 0.8, ease: 'easeInOut' }}>
        <ArrowDown size={18} aria-hidden/>
      </motion.span>
      Segure para entrar
    </SpecularButton>
    <p id="dica-entrar" className="dica-entrar">Pressione e segure por 1 segundo</p>
  </div>
}
