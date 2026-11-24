import { useEffect, useState } from 'react'
import { ChartNoAxesCombined, Goal, LayoutDashboard, List, Plus, Search, Tags } from 'lucide-react'
import { PaletaComandos, atalho } from '../components/PaletaComandos'
import { NavLink, Outlet, useLocation } from 'react-router'
import { motion } from 'motion/react'
import { PilulaAtiva } from '../components/Abas'
import { useQuery } from '../hooks/useQuery'
import { useUltimo } from '../hooks/useUltimo'
import { todas } from '../services/api'
import { camposTransacao } from '../services/camposTransacao'
import type { Categoria } from '../types/financeiro'
import { EdicaoRegistro } from '../pages/Registros'
import { AtualizacaoContext } from './contexto'

const paginas = [
  { caminho: '/dashboard', titulo: 'Dashboard', icone: LayoutDashboard },
  { caminho: '/transacoes', titulo: 'Transações', icone: List },
  { caminho: '/categorias', titulo: 'Categorias', icone: Tags },
  { caminho: '/metas', titulo: 'Metas', icone: Goal },
]
export function Layout() {
  const { pathname } = useLocation()
  const [nova, setNova] = useState(false)
  const [aberturas, setAberturas] = useState(0)
  const [versao, setVersao] = useState(0)
  // Recarrega as categorias a cada abertura: uma categoria criada depois já aparece no modal.
  const cats = useUltimo(useQuery('categorias#' + aberturas, signal => todas<Categoria>('categorias/', signal)).data)
  const opcoes = (cats ?? []).map(c => ({ valor: String(c.id), rotulo: c.nome }))
  const abrirNovaTransacao = () => { setAberturas(n => n + 1); setNova(true) }
  // Paleta de comandos: Ctrl+K (⌘K no Mac) em qualquer página do app.
  const [paleta, setPaleta] = useState(false)
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPaleta(a => !a) }
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [])
  const recarregar = () => setVersao(v => v + 1)
  return <AtualizacaoContext.Provider value={{ versao, abrirNovaTransacao, recarregar }}>
    <div className="min-h-screen">
      <div className="app">
        {/* Uma única barra de vidro, fixa no topo. No celular o menu vai para uma barra no rodapé. */}
        <div className="container-app barra-fixa">
          <header className="barra">
            <NavLink to="/" className="marca" aria-label="MyFinance, voltar para a introdução">
              <span className="marca-icone"><ChartNoAxesCombined size={18} aria-hidden/></span><span>MyFinance</span>
            </NavLink>
            <nav aria-label="Principal" className="menu">
              {paginas.map(({ caminho, titulo, icone: Icone }) => <NavLink end={caminho === '/dashboard'} key={caminho} to={caminho} className="menu-item">
                {({ isActive }) => <>{isActive && <PilulaAtiva id="menu-pilula"/>}
                  <span className="pilula-texto menu-rotulo"><Icone className="menu-icone" size={18} aria-hidden/>{titulo}</span></>}
              </NavLink>)}
            </nav>
            <div className="flex items-center gap-2">
            <button type="button" className="botao-buscar" onClick={() => setPaleta(true)} aria-keyshortcuts="Control+K Meta+K">
              <Search size={16} aria-hidden/><span className="botao-buscar-texto">Buscar</span><kbd className="botao-buscar-tecla" aria-hidden>{atalho}</kbd>
            </button>
            <button type="button" className="cta" onClick={abrirNovaTransacao}>
              <span className="cta-texto">Nova transação</span><Plus size={18} aria-hidden/></button>
            </div>
          </header>
        </div>
        <motion.main key={pathname} id="principal" className="container-app pagina" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.16 }}>
          <Outlet/>
        </motion.main>
      </div>
      <PaletaComandos aberta={paleta} mudar={setPaleta} novaTransacao={abrirNovaTransacao}/>
      <EdicaoRegistro edicao={nova ? { modo: 'novo' } : undefined} titulo="Nova transação" campos={camposTransacao(opcoes)}
        recurso="transacoes" fechar={() => setNova(false)} recarregar={() => setVersao(v => v + 1)}/>
    </div>
  </AtualizacaoContext.Provider>
}
