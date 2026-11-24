import { useState } from 'react'
import { ChartNoAxesCombined, Plus } from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router'
import { motion } from 'motion/react'
import { PilulaAtiva } from '../components/Abas'
import { FundoLiquido } from '../components/FundoLiquido'
import { useQuery } from '../hooks/useQuery'
import { useUltimo } from '../hooks/useUltimo'
import { todas } from '../services/api'
import { camposTransacao } from '../services/camposTransacao'
import type { Categoria } from '../types/financeiro'
import { EdicaoRegistro } from '../pages/Registros'
import { AtualizacaoContext } from './contexto'

const paginas = [
  { caminho: '/', titulo: 'Dashboard' },
  { caminho: '/transacoes', titulo: 'Transações' },
  { caminho: '/categorias', titulo: 'Categorias' },
  { caminho: '/metas', titulo: 'Metas' },
]
export function Layout() {
  const { pathname } = useLocation()
  const [nova, setNova] = useState(false)
  const [aberturas, setAberturas] = useState(0)
  const [versao, setVersao] = useState(0)
  // Recarrega as categorias a cada abertura: uma categoria criada depois já aparece no modal.
  const cats = useUltimo(useQuery('categorias#' + aberturas, signal => todas<Categoria>('categorias/', signal)).data)
  const opcoes = (cats ?? []).map(c => ({ valor: String(c.id), rotulo: c.nome }))
  return <AtualizacaoContext.Provider value={{ versao }}>
    <div className="min-h-screen">
      <FundoLiquido/>
      <div className="app">
        <header className="barra">
          <NavLink to="/" className="marca" aria-label="MyFinance, ir para o Dashboard">
            <span className="marca-icone"><ChartNoAxesCombined size={18} aria-hidden/></span><span>MyFinance</span>
          </NavLink>
          <nav aria-label="Principal" className="pilula-grupo glass menu">
            {paginas.map(({ caminho, titulo }) => <NavLink end={caminho === '/'} key={caminho} to={caminho} className="pilula-item">
              {({ isActive }) => <>{isActive && <PilulaAtiva id="menu-pilula"/>}<span className="pilula-texto">{titulo}</span></>}
            </NavLink>)}
          </nav>
          <button type="button" className="cta" onClick={() => { setAberturas(n => n + 1); setNova(true) }}>Nova transação <Plus size={18} aria-hidden/></button>
        </header>
        <motion.main key={pathname} id="principal" className="pagina" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.16 }}>
          <Outlet/>
        </motion.main>
      </div>
      <EdicaoRegistro edicao={nova ? { modo: 'novo' } : undefined} titulo="Nova transação" campos={camposTransacao(opcoes)}
        recurso="transacoes" fechar={() => setNova(false)} recarregar={() => setVersao(v => v + 1)}/>
    </div>
  </AtualizacaoContext.Provider>
}
