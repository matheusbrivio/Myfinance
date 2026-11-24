import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Command } from 'cmdk'
import { ArrowDownRight, ArrowUpRight, Download, Goal, LayoutDashboard, List, Plus, Search, Tags, Target } from 'lucide-react'
import { api } from '../services/api'
import { dataBR, moeda } from '../services/format'
import type { Lista, Transacao } from '../types/financeiro'

const paginas = [
  { caminho: '/dashboard', titulo: 'Dashboard', Icone: LayoutDashboard },
  { caminho: '/transacoes', titulo: 'Transações', Icone: List },
  { caminho: '/categorias', titulo: 'Categorias', Icone: Tags },
  { caminho: '/metas', titulo: 'Metas', Icone: Goal },
]
export const urlExportar = (filtros = '') => '/api/v1/transacoes/exportar/' + (filtros ? '?' + filtros : '')

/** Ctrl+K no Windows/Linux, ⌘K no Mac. */
export const atalho = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘K' : 'Ctrl K'

// Busca de transações enquanto digita: espera 250 ms parado e traz até 8.
function useBuscaTransacoes(termo: string) {
  const [resultados, setResultados] = useState<Transacao[]>([])
  const [buscando, setBuscando] = useState(false)
  useEffect(() => {
    // O backend aceita até 100 caracteres; resultados do termo anterior somem enquanto digita.
    const texto = termo.trim().slice(0, 100)
    setResultados([])
    if (texto.length < 2) { setBuscando(false); return }
    const controle = new AbortController()
    setBuscando(true)
    const timer = window.setTimeout(() => {
      api<Lista<Transacao>>('transacoes/?busca=' + encodeURIComponent(texto), { signal: controle.signal })
        .then(lista => setResultados(lista.resultados.slice(0, 8)))
        .catch(() => { if (!controle.signal.aborted) setResultados([]) })
        .finally(() => { if (!controle.signal.aborted) setBuscando(false) })
    }, 250)
    return () => { window.clearTimeout(timer); controle.abort() }
  }, [termo])
  return { resultados, buscando }
}

/**
 * Paleta de comandos (cmdk): ações, navegação e busca de transações.
 * Abre com Ctrl+K / ⌘K e pelo botão "Buscar" da barra. Setas navegam, Enter executa, Esc fecha;
 * o foco volta ao elemento que estava focado antes de abrir.
 */
export function PaletaComandos({ aberta, mudar, novaTransacao }: { aberta: boolean; mudar: (aberta: boolean) => void; novaTransacao: () => void }) {
  const navigate = useNavigate()
  const [termo, setTermo] = useState('')
  const { resultados, buscando } = useBuscaTransacoes(aberta ? termo : '')
  useEffect(() => { if (!aberta) setTermo('') }, [aberta])
  // Foco de volta para onde estava (botão Buscar, ou o elemento focado quando o atalho abriu a paleta).
  const anterior = useRef<HTMLElement | null>(null)
  if (aberta && anterior.current === null) anterior.current = document.activeElement as HTMLElement | null
  const devolverFoco = (e: Event) => {
    e.preventDefault()
    const alvo = anterior.current
    anterior.current = null
    if (alvo?.isConnected) alvo.focus()
  }
  const executar = (acao: () => void) => () => { mudar(false); acao() }
  return <DialogPrimitive.Root open={aberta} onOpenChange={mudar}>
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-[rgba(15,23,42,.25)] backdrop-blur-[4px]"/>
      <DialogPrimitive.Content className="paleta glass-strong fixed left-1/2 top-[12vh] z-50 w-[min(560px,calc(100%-2rem))] -translate-x-1/2 overflow-hidden rounded-[20px]"
        aria-describedby={undefined} onCloseAutoFocus={devolverFoco}>
        <DialogPrimitive.Title className="sr-only">Buscar e executar comandos</DialogPrimitive.Title>
        {/* Esc tratado aqui também: com avisos abertos, a ordem das camadas do Radix não garante que o diálogo receba a tecla. */}
        <Command label="Paleta de comandos" loop onKeyDown={e => { if (e.key === 'Escape') { e.preventDefault(); mudar(false) } }}>
          <div className="paleta-campo flex items-center gap-2 border-b border-line px-4">
            <Search size={18} className="shrink-0 text-muted" aria-hidden/>
            <Command.Input value={termo} onValueChange={setTermo} placeholder="Buscar transações, páginas e ações…" className="paleta-entrada"/>
          </div>
          <Command.List className="paleta-lista">
            <Command.Empty className="px-4 py-6 text-center text-sm text-muted">{buscando ? 'Buscando…' : 'Nada encontrado.'}</Command.Empty>
            <Command.Group heading="Ações">
              <Command.Item onSelect={executar(novaTransacao)}><Plus size={16} aria-hidden/>Nova transação</Command.Item>
              <Command.Item onSelect={executar(() => navigate('/metas?nova=1'))}><Target size={16} aria-hidden/>Nova meta</Command.Item>
              <Command.Item onSelect={executar(() => navigate('/categorias?nova=1'))}><Tags size={16} aria-hidden/>Nova categoria</Command.Item>
              <Command.Item onSelect={executar(() => { window.location.href = urlExportar() })}><Download size={16} aria-hidden/>Exportar CSV</Command.Item>
            </Command.Group>
            <Command.Group heading="Ir para">
              {paginas.map(({ caminho, titulo, Icone }) => <Command.Item key={caminho} value={'Ir para ' + titulo} onSelect={executar(() => navigate(caminho))}>
                <Icone size={16} aria-hidden/>{titulo}
              </Command.Item>)}
            </Command.Group>
            {resultados.length > 0 && <Command.Group heading="Transações">
              {resultados.map(t => <Command.Item key={t.id} value={`transacao ${t.id} ${t.descricao} ${termo}`}
                onSelect={executar(() => navigate('/transacoes?busca=' + encodeURIComponent(t.descricao || termo)))}>
                {t.tipo === 'receita' ? <ArrowUpRight size={16} className="text-good" aria-hidden/> : <ArrowDownRight size={16} className="text-bad" aria-hidden/>}
                <span className="min-w-0 flex-1 truncate">{t.descricao || 'Sem descrição'}</span>
                <span className="num shrink-0 text-xs text-muted">{dataBR(t.data)} · {moeda(t.valor)}</span>
              </Command.Item>)}
            </Command.Group>}
          </Command.List>
        </Command>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  </DialogPrimitive.Root>
}
