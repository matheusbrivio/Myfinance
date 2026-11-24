import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'

const TAP_MS = 250
const HIT_PAD = 10
type Ease = (t: number) => number
const LINEAR: Ease = t => t
const EASE_OUT: Ease = t => 1 - Math.pow(1 - t, 3)

export type FaseSegurar = 'idle' | 'holding' | 'done'
export type EntradaSegurar = 'pointer' | 'key' | null

/**
 * Mecânica de "pressione e segure", extraída do HoldButton.
 * - Ponteiro: pointer capture; cancela se o ponteiro sair da área (com 10px de folga) ou da janela.
 * - Teclado: Espaço e Enter seguram; Escape cancela.
 * - Cancela no blur da janela e ao trocar de aba.
 * O progresso (0..1) avança linear em `tempo` e volta com ease-out em `soltar` ms.
 */
export function useSegurar<T extends HTMLElement = HTMLButtonElement>({
  tempo, soltar = 200, desativado = false, reiniciarApos = 0, aoCompletar, aoToque, aoProgresso,
}: {
  tempo: number
  soltar?: number
  desativado?: boolean
  /** Depois de completar, volta ao início após esse tempo (0 = fica em "done"). */
  reiniciarApos?: number
  aoCompletar?: () => void
  aoToque?: () => void
  /** Chamado a cada quadro com o progresso, para quem quer escrever direto no estilo. */
  aoProgresso?: (p: number) => void
}) {
  const [fase, setFase] = useState<FaseSegurar>('idle')
  const [entrada, setEntrada] = useState<EntradaSegurar>(null)
  const [progress, setProgress] = useState(0)
  const faseRef = useRef<FaseSegurar>('idle')
  const entradaRef = useRef<EntradaSegurar>(null)
  const ref = useRef<T>(null)
  const gesto = useRef<{ pointerId: number | null; inicio: number; caixa: DOMRect | null }>({ pointerId: null, inicio: 0, caixa: null })
  const timers = useRef<{ completar?: ReturnType<typeof setTimeout>; reiniciar?: ReturnType<typeof setTimeout> }>({})
  const animacao = useRef({ raf: 0, p: 0, de: 0, para: 0, inicio: 0 })
  // Callbacks sempre atuais, sem recriar os handlers.
  const opcoes = useRef({ tempo, soltar, desativado, reiniciarApos, aoCompletar, aoToque, aoProgresso })
  opcoes.current = { tempo, soltar, desativado, reiniciarApos, aoCompletar, aoToque, aoProgresso }

  const ir = (proxima: FaseSegurar, tipo: EntradaSegurar = null) => {
    faseRef.current = proxima
    entradaRef.current = tipo
    setFase(proxima)
    setEntrada(tipo)
  }
  const limparTimers = () => {
    clearTimeout(timers.current.completar)
    clearTimeout(timers.current.reiniciar)
  }

  const conduzir = (para: number, duracao: number, ease: Ease) => {
    const m = animacao.current
    cancelAnimationFrame(m.raf)
    m.de = m.p
    m.para = para
    m.inicio = performance.now()
    const passo = (agora: number) => {
      const t = duracao > 0 ? Math.min(1, (agora - m.inicio) / duracao) : 1
      m.p = m.de + (m.para - m.de) * ease(t)
      opcoes.current.aoProgresso?.(m.p)
      setProgress(m.p)
      if (t < 1) {
        m.raf = requestAnimationFrame(passo)
        return
      }
      m.raf = 0
      if (m.para === 1) completar()
    }
    m.raf = requestAnimationFrame(passo)
  }

  const completar = () => {
    if (faseRef.current !== 'holding') return
    if (performance.now() - gesto.current.inicio < opcoes.current.tempo - 50) return
    limparTimers()
    ir('done', entradaRef.current)
    opcoes.current.aoCompletar?.()
    const { reiniciarApos: depois, soltar: volta } = opcoes.current
    if (depois > 0) {
      timers.current.reiniciar = setTimeout(() => {
        ir('idle')
        conduzir(0, volta, EASE_OUT)
      }, depois)
    }
  }

  // Usa o ref, se houver; senão, o próprio elemento que recebeu o evento.
  const comecar = (tipo: EntradaSegurar, elemento: Element) => {
    if (opcoes.current.desativado || faseRef.current !== 'idle') return false
    const alvo = ref.current ?? elemento
    if (!alvo) return false
    gesto.current.inicio = performance.now()
    gesto.current.caixa = alvo.getBoundingClientRect()
    ir('holding', tipo)
    conduzir(1, opcoes.current.tempo, LINEAR)
    timers.current.completar = setTimeout(completar, opcoes.current.tempo + 100)
    return true
  }

  const liberar = ({ desviou = false }: { desviou?: boolean } = {}) => {
    if (faseRef.current !== 'holding') return
    limparTimers()
    const segurou = performance.now() - gesto.current.inicio
    ir('idle')
    conduzir(0, opcoes.current.soltar, EASE_OUT)
    if (!desviou && segurou < TAP_MS) opcoes.current.aoToque?.()
  }
  const liberarRef = useRef(liberar)
  liberarRef.current = liberar

  const fimPonteiro = (e: PointerEvent<T>, op?: { desviou?: boolean }) => {
    if (e.pointerId !== gesto.current.pointerId) return
    gesto.current.pointerId = null
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
    } catch { /* o elemento pode já ter perdido a captura */ }
    liberar(op)
  }

  const handlers = {
    onPointerDown: (e: PointerEvent<T>) => {
      if (e.button !== 0 || !e.isPrimary || gesto.current.pointerId !== null) return
      if (!comecar('pointer', e.currentTarget)) return
      gesto.current.pointerId = e.pointerId
      try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* sem captura, segue sem ela */ }
    },
    onPointerMove: (e: PointerEvent<T>) => {
      if (e.pointerId !== gesto.current.pointerId) return
      const r = gesto.current.caixa
      if (!r) return
      const fora = e.clientX < r.left - HIT_PAD || e.clientX > r.right + HIT_PAD || e.clientY < r.top - HIT_PAD || e.clientY > r.bottom + HIT_PAD
      if (fora) fimPonteiro(e, { desviou: true })
    },
    onPointerUp: (e: PointerEvent<T>) => fimPonteiro(e),
    onPointerCancel: (e: PointerEvent<T>) => fimPonteiro(e, { desviou: true }),
    onLostPointerCapture: (e: PointerEvent<T>) => fimPonteiro(e, { desviou: true }),
    onPointerLeave: (e: PointerEvent<T>) => { if (e.pointerType !== 'touch') fimPonteiro(e, { desviou: true }) },
    onKeyDown: (e: KeyboardEvent<T>) => {
      if (e.key === 'Escape') {
        if (entradaRef.current === 'key') liberar({ desviou: true })
        return
      }
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        if (!e.repeat) comecar('key', e.currentTarget)
      }
    },
    onKeyUp: (e: KeyboardEvent<T>) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        if (entradaRef.current === 'key') liberar()
      }
    },
    onContextMenu: (e: { preventDefault: () => void }) => e.preventDefault(),
  }

  // Segurando: cancela no blur da janela e ao trocar de aba.
  useEffect(() => {
    if (fase !== 'holding') return undefined
    const cancelar = () => liberarRef.current({ desviou: true })
    const aoMudarVisibilidade = () => { if (document.hidden) cancelar() }
    window.addEventListener('blur', cancelar)
    document.addEventListener('visibilitychange', aoMudarVisibilidade)
    return () => {
      window.removeEventListener('blur', cancelar)
      document.removeEventListener('visibilitychange', aoMudarVisibilidade)
    }
  }, [fase])

  useEffect(() => {
    const t = timers.current
    const m = animacao.current
    return () => {
      clearTimeout(t.completar)
      clearTimeout(t.reiniciar)
      cancelAnimationFrame(m.raf)
    }
  }, [])

  return { ref, fase, entrada, progress, handlers }
}
