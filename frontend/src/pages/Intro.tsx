import { lazy, Suspense, useEffect, useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router'
import { motion, useReducedMotion } from 'motion/react'
import { ChartNoAxesCombined } from 'lucide-react'
import { BotaoEntrar } from '../components/BotaoEntrar'
import type { LanyardProps } from '../components/Lanyard'
import { suporteWebGL } from '../services/webgl'

// O Django só serve arquivos estáticos em /react-assets/: as imagens ficam em public/react-assets/intro.
const IMG = '/react-assets/intro/'

// O three só é baixado quando os crachás 3D vão de fato aparecer (não no fallback).
const Lanyard = lazy(() => import('../components/Lanyard'))
const LanyardStage = lazy(() => import('../components/Lanyard').then(m => ({ default: m.LanyardStage })))

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
  const [webgl] = useState(() => suporteWebGL().webgl)
  const [saindo, setSaindo] = useState(false)
  // Cursor dos crachás: o canvas não recebe ponteiro, então cada Lanyard avisa por onHoverChange.
  const [cursores, setCursores] = useState<('grab' | 'grabbing' | '')[]>(['', '', ''])
  // Celular (< 768px), reduced-motion ou sem WebGL: fallback estático em leque.
  const tresD = webgl && !reduz && !celular

  // A descida para o site é feita pelas Cenas (AnimatePresence na raiz das rotas).
  function entrar() {
    if (saindo) return
    setSaindo(true)
    navigate('/dashboard')
  }

  const cursor = cursores.includes('grabbing') ? 'grabbing' : cursores.includes('grab') ? 'grab' : undefined
  return <div className="intro" style={{ cursor }}>
    <div className="intro-conteudo">
      <h1 className="sr-only">MyFinance</h1>
      {/* Marca d'água atrás dos crachás: dá profundidade e mostra o vidro. */}
      <span className="intro-marca-dagua" aria-hidden>MyFinance</span>
      <div className="intro-topo">
        <span className="marca"><span className="marca-icone"><ChartNoAxesCombined size={18} aria-hidden/></span><span>MyFinance</span></span>
        <p className="intro-rotulo">Engenharia de Software · AMF · 2026</p>
      </div>
      <ul className="sr-only" aria-label="Integrantes">
        {integrantes.map(p => <li key={p.foto}>{p.nome}</li>)}
      </ul>
      {/* Os três crachás dividem um palco em tela cheia (um canvas e um contexto WebGL), cada um com sua âncora. */}
      {tresD ? <Suspense fallback={null}><LanyardStage className="intro-crachas">
        {/* Os três montam juntos e carregam em paralelo; a entrada é escalonada (0, 180 e 360 ms) só depois que todos estão prontos. */}
        {integrantes.map((p, i) =>
          <Lanyard key={p.foto} {...comum} anchor={p.anchor} priority={p.anchor === 'center'} delay={atrasos[i]}
            frontImage={`${IMG}cracha-${p.foto}-frente.png`} backImage={`${IMG}cracha-${p.foto}-verso.png`}
            size={p.anchor === 'center' ? 0.56 : 0.5} strapLength={p.anchor === 'center' ? 0.36 : 0.3}
            onHoverChange={(hover, arrastando) => setCursores(c => c.map((v, j) => j === i ? (arrastando ? 'grabbing' : hover ? 'grab' : '') : v))}/>)}
      </LanyardStage></Suspense> : <div className="intro-leque" aria-hidden>
        {integrantes.map((p, i) => <div key={p.foto} className={'intro-estatico intro-estatico-' + p.anchor}
          style={{ '--giro': [-8, 0, 8][i] + 'deg' } as CSSProperties}>
          <span className="intro-fita"/>
          <img src={`${IMG}cracha-${p.foto}-frente.png`} alt="" width={1024} height={1440}/>
        </div>)}
      </div>}
      <div className="intro-texto">
        <BotaoEntrar aoEntrar={entrar}/>
      </div>
    </div>
  </div>
}
