import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Link, Route, Routes } from 'react-router'
import { MotionConfig } from 'motion/react'
import { Avisos, Cabecalho, Painel } from './components/ui'
import { Layout } from './layouts/Layout'
import { Dashboard } from './pages/Dashboard'
import { Categorias, Transacoes } from './pages/Registros'
import { DetalheMeta, Metas } from './pages/Metas'
import './styles/app.css'

// A Intro (e o three, que só ela usa) fica num chunk próprio.
const Intro = lazy(() => import('./pages/Intro'))

const basename = /^\/app(?:\/|$)/.test(location.pathname) ? '/app' : '/'
createRoot(document.getElementById('root')!).render(<StrictMode>
  <MotionConfig reducedMotion="user"><BrowserRouter basename={basename}><Avisos><Routes>
    <Route index element={<Suspense fallback={<div className="intro"/>}><Intro/></Suspense>}/>
    <Route element={<Layout/>}>
      <Route path="dashboard" element={<Dashboard/>}/>
      <Route path="categorias" element={<Categorias/>}/>
      <Route path="transacoes" element={<Transacoes/>}/>
      <Route path="metas" element={<Metas/>}/>
      <Route path="metas/:id" element={<DetalheMeta/>}/>
      <Route path="*" element={<><Cabecalho titulo="Página indisponível"/><Painel><p>Esta página não existe. <Link className="text-accent underline" to="/dashboard">Ir para o Dashboard</Link></p></Painel></>}/>
    </Route>
  </Routes></Avisos></BrowserRouter></MotionConfig>
</StrictMode>)
