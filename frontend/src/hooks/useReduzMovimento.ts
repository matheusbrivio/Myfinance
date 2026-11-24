import { useSyncExternalStore } from 'react'

const consulta = '(prefers-reduced-motion: reduce)'
const assinar = (aviso: () => void) => {
  const m = window.matchMedia?.(consulta)
  m?.addEventListener('change', aviso)
  return () => m?.removeEventListener('change', aviso)
}
const ler = () => window.matchMedia?.(consulta).matches ?? false

// Substitui useReducedMotion: CSS cuida do resto via @media.
export function useReduzMovimento() {
  return useSyncExternalStore(assinar, ler, () => false)
}
