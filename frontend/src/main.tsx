import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Link, Route, Routes } from 'react-router'
import { Avisos } from './components/ui'
import { Layout } from './layouts/Layout'
import { Dashboard } from './pages/Dashboard'
import { Categorias, Transacoes } from './pages/Registros'
import { DetalheMeta, Metas } from './pages/Metas'
import './styles/app.css'

const basename = /^\/app(?:\/|$)/.test(location.pathname) ? '/app' : '/'
createRoot(document.getElementById('root')!).render(<StrictMode>
  <BrowserRouter basename={basename}><Avisos><Routes>
    <Route element={<Layout/>}>
      <Route index element={<Dashboard/>}/>
      <Route path="categorias" element={<Categorias/>}/>
      <Route path="transacoes" element={<Transacoes/>}/>
      <Route path="metas" element={<Metas/>}/>
      <Route path="metas/:id" element={<DetalheMeta/>}/>
      <Route path="*" element={<p>Esta página não existe. <Link className="text-accent" to="/">Ir para a visão geral</Link></p>}/>
    </Route>
  </Routes></Avisos></BrowserRouter>
</StrictMode>)
