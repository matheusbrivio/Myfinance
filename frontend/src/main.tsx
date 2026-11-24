import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Link, Route, Routes } from 'react-router'
import { Avisos, Cabecalho, Painel } from './components/ui'
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
      <Route path="*" element={<><Cabecalho titulo="Página indisponível"/><Painel><p>Esta página não existe. <Link className="text-accent underline" to="/">Ir para o Dashboard</Link></p></Painel></>}/>
    </Route>
  </Routes></Avisos></BrowserRouter>
</StrictMode>)
