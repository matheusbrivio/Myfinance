import { ChartNoAxesCombined, Goal, LayoutDashboard, List, Tags } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { NavLink, Outlet, useLocation } from 'react-router'
import { Fundo } from '../components/Fundo'

const paginas = [
  { caminho: '/', titulo: 'Visão geral', icone: LayoutDashboard },
  { caminho: '/transacoes', titulo: 'Transações', icone: List },
  { caminho: '/categorias', titulo: 'Categorias', icone: Tags },
  { caminho: '/metas', titulo: 'Metas', icone: Goal },
]
export function Layout() {
  const { pathname } = useLocation()
  const reduz = useReducedMotion()
  const pagina = paginas.find(p => p.caminho === pathname || (p.caminho !== '/' && pathname.startsWith(p.caminho + '/')))
  return <div className="min-h-screen md:grid md:grid-cols-[14rem_minmax(0,1fr)]">
    <Fundo/>
    <aside className="border-b border-line bg-panel px-4 py-4 md:sticky md:top-0 md:h-screen md:border-b-0 md:border-r md:p-5">
      <NavLink to="/" className="mb-3 flex items-center gap-2 text-lg font-bold md:mb-8"><ChartNoAxesCombined className="text-accent" aria-hidden /> MyFinance</NavLink>
      <nav aria-label="Principal" className="grid grid-cols-2 gap-1 sm:grid-cols-4 md:grid-cols-1">
        {paginas.map(({ caminho, titulo, icone: Icon }) => <NavLink end={caminho === '/'} key={caminho} to={caminho}
          className={({ isActive }) => 'flex items-center gap-2 rounded-lg px-2 py-2.5 text-sm md:px-3 ' + (isActive ? 'bg-sky-400/15 text-accent' : 'text-muted hover:bg-line')}>
          <Icon size={17} aria-hidden/>{titulo}</NavLink>)}
      </nav>
    </aside>
    <motion.main key={pathname} id="principal" initial={reduz ? false : { opacity: 0 }} animate={{ opacity: 1 }}
      transition={{ duration: reduz ? 0 : .16 }} className="mx-auto w-full min-w-0 max-w-screen-2xl px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
      <header className="mb-6"><h1 className="text-3xl font-semibold tracking-tight">{pagina?.titulo ?? 'Página indisponível'}</h1></header>
      <Outlet/>
    </motion.main>
  </div>
}
