import { lazy, Suspense, useEffect, useState } from 'react'
import { Link, Route, Routes, useLocation } from 'react-router'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { FundoLiquido } from '../components/FundoLiquido'
import { Cabecalho, Painel } from '../components/ui'
import { Layout } from './Layout'
import { Dashboard } from '../pages/Dashboard'
import { Categorias, Transacoes } from '../pages/Registros'
import { DetalheMeta, Metas } from '../pages/Metas'
import { EmTransicaoContext } from './transicao'

// A Intro (e o three, que só ela usa) fica num chunk próprio.
const Intro = lazy(() => import('../pages/Intro'))

const curva = [0.76, 0, 0.24, 1] as const

/**
 * Intro ↔ app como duas cenas empilhadas na vertical. Ida: a intro sobe (-100vh) e o app vem
 * de baixo (100vh → 0), em 1 s. Volta (pela logo): o inverso. As trocas entre páginas internas
 * do app não passam por aqui (a chave da cena só muda entre "intro" e "app").
 * O fundo é único e fica fixo; só a camada de pontos e manchas desliza (-30vh) no app.
 */
export function Cenas() {
  const location = useLocation()
  const reduz = useReducedMotion()
  const chave = location.pathname === '/' ? 'intro' : 'app'
  // +1: indo para o app (a câmera desce); -1: voltando para a intro.
  const direcao = chave === 'app' ? 1 : -1
  const [anterior, setAnterior] = useState(chave)
  const [transicao, setTransicao] = useState(false)
  if (chave !== anterior) { setAnterior(chave); setTransicao(true) }
  useEffect(() => { if (transicao) window.scrollTo(0, 0) }, [transicao])

  const variantes = {
    entra: (d: number) => reduz ? { opacity: 0 } : { y: d > 0 ? '100vh' : '-100vh' },
    parada: { opacity: 1, y: 0 },
    sai: (d: number) => reduz ? { opacity: 0 } : { y: d > 0 ? '-100vh' : '100vh' },
  }
  return <>
    <FundoLiquido noApp={chave === 'app'}/>
    <EmTransicaoContext.Provider value={transicao}>
      {/* popLayout: a cena que sai fica absolute; a que entra fica fixed (cena-em-transicao) até parar. */}
      <AnimatePresence initial={false} mode="popLayout" custom={direcao} onExitComplete={() => setTransicao(false)}>
        <motion.div key={chave} className={'cena' + (transicao ? ' cena-em-transicao' : '')} custom={direcao} variants={variantes}
          initial="entra" animate="parada" exit="sai" transition={{ duration: reduz ? 0.15 : 1, ease: curva }}>
          <Routes location={location}>
            <Route index element={<Suspense fallback={<div className="intro"/>}><Intro/></Suspense>}/>
            <Route element={<Layout/>}>
              <Route path="dashboard" element={<Dashboard/>}/>
              <Route path="categorias" element={<Categorias/>}/>
              <Route path="transacoes" element={<Transacoes/>}/>
              <Route path="metas" element={<Metas/>}/>
              <Route path="metas/:id" element={<DetalheMeta/>}/>
              <Route path="*" element={<><Cabecalho titulo="Página indisponível"/><Painel><p>Esta página não existe. <Link className="text-accent underline" to="/dashboard">Ir para o Dashboard</Link></p></Painel></>}/>
            </Route>
          </Routes>
        </motion.div>
      </AnimatePresence>
    </EmTransicaoContext.Provider>
  </>
}
