import { lazy, Suspense, useEffect, useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router'
import { motion, useReducedMotion } from 'motion/react'
import { Play } from 'lucide-react'
import { FundoLiquido } from '../components/FundoLiquido'
import type { LanyardProps } from '../components/Lanyard'

// O Django só serve arquivos estáticos em /react-assets/: as imagens ficam em public/react-assets/intro.
const IMG = '/react-assets/intro/'

// O three só é baixado quando os crachás 3D vão de fato aparecer (não no fallback).
const Lanyard = lazy(() => import('../components/Lanyard'))

const integrantes = [
  { nome: 'Matheus Brivio', foto: 'matheus', anchor: 'left' },
  { nome: 'Eduardo Rafael da Silva Suarez', foto: 'eduardo', anchor: 'center' },
  { nome: 'Murillo Muller', foto: 'murillo', anchor: 'right' },
] as const
const comum = {
  cardColor: '#F6F7F9', finish: 'glossy', metal: 'silver',
  strapImage: IMG + 'fita.png', strapColor: '#0F172A', strapWidth: 0.75,
  gravity: 1, damping: 0.55, elasticity: 0.5, breeze: 0.2, interactive: true, intro: true,
} satisfies LanyardProps
const atrasos = [0, 180, 360]

function temWebGL() {
  if (typeof WebGLRenderingContext === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch { return false }
}
function useCelular() {
  const consulta = '(max-width: 767px)'
  const [celular, setCelular] = useState(() => window.matchMedia?.(consulta).matches ?? false)
  useEffect(() => {
    const m = window.matchMedia?.(consulta)
    const mudar = () => setCelular(m.matches)
    m?.addEventListener('change', mudar)
    return () => m?.removeEventListener('change', mudar)
  }, [])
  return celular
}

/** Tela de introdução: três crachás pendurados, título do projeto e o botão Play que entra no site. */
export default function Intro() {
  const reduz = useReducedMotion()
  const navigate = useNavigate()
  const celular = useCelular()
  const [webgl] = useState(temWebGL)
  const [montados, setMontados] = useState(0)
  const [saindo, setSaindo] = useState(false)
  // Cursor dos crachás: o canvas não recebe ponteiro, então cada Lanyard avisa por onHoverChange.
  const [cursores, setCursores] = useState<('grab' | 'grabbing' | '')[]>(['', '', ''])
  // Celular (< 768px), reduced-motion ou sem WebGL: fallback estático em leque.
  const tresD = webgl && !reduz && !celular

  // Os crachás entram em sequência: esquerda, centro (180 ms) e direita (360 ms).
  useEffect(() => {
    if (!tresD) return
    const timers = atrasos.map((ms, i) => window.setTimeout(() => setMontados(n => Math.max(n, i + 1)), ms))
    return () => timers.forEach(t => window.clearTimeout(t))
  }, [tresD])

  function entrar() {
    if (saindo) return
    setSaindo(true)
    window.setTimeout(() => navigate('/dashboard'), reduz ? 0 : 350)
  }

  const cursor = cursores.includes('grabbing') ? 'grabbing' : cursores.includes('grab') ? 'grab' : undefined
  return <div className="intro" style={{ cursor }}>
    <FundoLiquido/>
    <motion.div className="intro-conteudo" animate={saindo && !reduz ? { opacity: 0, y: -12, filter: 'blur(8px)' } : { opacity: saindo ? 0 : 1 }}
      transition={{ duration: reduz ? 0 : 0.35, ease: [0.4, 0, 1, 1] }}>
      <ul className="sr-only" aria-label="Integrantes">
        {integrantes.map(p => <li key={p.foto}>{p.nome}</li>)}
      </ul>
      {/* Os três Lanyards cobrem a tela inteira, empilhados, cada um com sua âncora: nada corta na borda. */}
      {tresD ? <div className="intro-crachas" aria-hidden>
        {integrantes.map((p, i) => i < montados && <Suspense key={p.foto} fallback={null}>
          <Lanyard {...comum} className="intro-lanyard" anchor={p.anchor} priority={p.anchor === 'center'}
            frontImage={`${IMG}cracha-${p.foto}-frente.png`} backImage={`${IMG}cracha-${p.foto}-verso.png`}
            size={p.anchor === 'center' ? 0.56 : 0.5} strapLength={p.anchor === 'center' ? 0.36 : 0.3}
            onHoverChange={(hover, arrastando) => setCursores(c => c.map((v, j) => j === i ? (arrastando ? 'grabbing' : hover ? 'grab' : '') : v))}/>
        </Suspense>)}
      </div> : <div className="intro-leque" aria-hidden>
        {integrantes.map((p, i) => <div key={p.foto} className={'intro-estatico intro-estatico-' + p.anchor}
          style={{ '--giro': [-8, 0, 8][i] + 'deg' } as CSSProperties}>
          <span className="intro-fita"/>
          <img src={`${IMG}cracha-${p.foto}-frente.png`} alt="" width={1024} height={1440}/>
        </div>)}
      </div>}
      <div className="intro-texto">
        <p className="intro-rotulo">Projeto de Engenharia de Software · AMF · 2026</p>
        <h1 className="intro-titulo">MyFinance</h1>
        <p className="intro-subtitulo">Controle de finanças pessoais</p>
        <div className="intro-play">
          <span className="relative grid place-items-center">
            {/* Anel que pulsa suave a cada 2,4 s enquanto o botão está parado. */}
            {!reduz && <motion.span aria-hidden className="play-anel" initial={{ opacity: 0.55, scale: 1 }}
              animate={{ opacity: [0.55, 0], scale: [1, 1.45] }} transition={{ duration: 1.6, ease: 'easeOut', repeat: Infinity, repeatDelay: 0.8 }}/>}
            <motion.button type="button" className="botao-play" aria-label="Entrar no MyFinance" onClick={entrar} disabled={saindo}
              whileHover={reduz ? undefined : { scale: 1.06 }} whileTap={reduz ? undefined : { scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
              <Play size={30} fill="currentColor" aria-hidden/>
            </motion.button>
          </span>
          <span aria-hidden>Entrar no site</span>
        </div>
      </div>
    </motion.div>
  </div>
}
