import { ChartNoAxesCombined, Goal, LayoutDashboard, List, Tags } from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router'
import { useDeslizante } from '../components/Abas'
import { Entrada } from '../components/Entrada'
import { FundoLiquido } from '../components/FundoLiquido'

const paginas = [
  { caminho: '/', titulo: 'Visão geral', icone: LayoutDashboard },
  { caminho: '/transacoes', titulo: 'Transações', icone: List },
  { caminho: '/categorias', titulo: 'Categorias', icone: Tags },
  { caminho: '/metas', titulo: 'Metas', icone: Goal },
]
export function Layout() {
  const { pathname } = useLocation()
  const pagina = paginas.find(p => p.caminho === pathname || (p.caminho !== '/' && pathname.startsWith(p.caminho + '/')))
  const { ref, indicador } = useDeslizante('[aria-current="page"]', pathname)
  return <div className="min-h-screen">
    <FundoLiquido/>
    <div className="app">
    <header className="topbar">
      <NavLink to="/" className="marca"><ChartNoAxesCombined className="text-accent" size={18} aria-hidden/><span>MyFinance</span></NavLink>
      <nav aria-label="Principal" ref={ref} className="nav">
        {indicador}
        {paginas.map(({ caminho, titulo, icone: Icon }) => <NavLink end={caminho === '/'} key={caminho} to={caminho} className="nav-item">
          <Icon size={16} aria-hidden/><span>{titulo}</span></NavLink>)}
      </nav>
    </header>
    <main key={pathname} id="principal" className="pagina">
      <Entrada className="titulo-pagina"><h1>{pagina?.titulo ?? 'Página indisponível'}</h1></Entrada>
      <Outlet/>
    </main>
    </div>
  </div>
}
