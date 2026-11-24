import * as DialogPrimitive from '@radix-ui/react-dialog'
import * as Toast from '@radix-ui/react-toast'
import { createContext, useContext, useRef, useState, type ReactNode } from 'react'
import { CircleAlert, X } from 'lucide-react'
import { Esqueleto, MatrizLoader } from './Efeitos'
import { Entrada } from './Entrada'

// Botões em pílula: contornado (padrão), claro (principal) e ícone redondo.
export const botao = 'botao inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-5 h-11 text-sm font-medium text-text hover:bg-white/[.06] disabled:opacity-50'
export const primario = 'botao inline-flex items-center justify-center gap-2 rounded-full border border-pill bg-pill px-5 h-11 text-sm font-semibold text-[#0B0F17] shadow-[0_6px_24px_-8px_rgba(244,246,248,.5)] hover:bg-white disabled:opacity-50'
export const icone = 'inline-grid size-9 place-items-center rounded-full text-soft hover:bg-white/[.08] hover:text-text'
export const campo = 'campo w-full rounded-[14px] border border-white/10 bg-black/30 px-4 h-11 text-[15px] text-text placeholder:text-muted aria-invalid:border-bad'
export const painel = 'glass min-w-0 rounded-[26px] p-6'

// Rótulo de seção (mono, caixa alta) + título do card em serifa.
export function Secao({ n, rotulo, titulo }: { n: string; rotulo: string; titulo: string }) {
  return <div className="mb-5"><p className="rotulo-secao">{n} — {rotulo}</p><h2 className="titulo-card">{titulo}</h2></div>
}
// Cabeçalho de página: título grande em serifa; à direita, ações ou abas.
export function Cabecalho({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return <Entrada className="cabecalho"><h1 className="titulo-pagina">{titulo}</h1>{children && <div className="flex flex-wrap gap-3">{children}</div>}</Entrada>
}
export function Painel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={painel + ' ' + className}>{children}</section>
}
export function Dialogo({ titulo, aberto, onOpenChange, children }: {
  titulo: string; aberto: boolean; onOpenChange: (open: boolean) => void; children: ReactNode
}) {
  return <DialogPrimitive.Root open={aberto} onOpenChange={onOpenChange}>
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="dialogo-fundo fixed inset-0 z-40 bg-black/70" />
      <DialogPrimitive.Content className={'dialogo fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto ' + painel}>
        <DialogPrimitive.Title className="mb-4 pr-8 text-xl font-semibold">{titulo}</DialogPrimitive.Title>
        <DialogPrimitive.Description className="sr-only">Formulário de {titulo.toLowerCase()}</DialogPrimitive.Description>
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded p-1" aria-label="Fechar diálogo"><X size={18}/></DialogPrimitive.Close>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  </DialogPrimitive.Root>
}
type Aviso = { id: number; texto: string; tipo: 'sucesso' | 'info' | 'erro' }
const AvisosContext = createContext<(texto: string, tipo?: Aviso['tipo']) => void>(() => {})
export const useAviso = () => useContext(AvisosContext)
export function Avisos({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([])
  const id = useRef(0)
  return <AvisosContext.Provider value={(texto, tipo = 'sucesso') => {
    const novo = { id: ++id.current, texto, tipo }
    setAvisos(atuais => [...atuais, novo])
  }}>
    <Toast.Provider duration={4000} swipeDirection="right">
      {children}
      {avisos.map(aviso => <Toast.Root key={aviso.id} className={'aviso flex items-center gap-3 ' + painel}
        duration={aviso.tipo === 'erro' ? Infinity : 4000}
        onOpenChange={aberto => { if (!aberto) window.setTimeout(() => setAvisos(v => v.filter(a => a.id !== aviso.id)), 180) }}>
        {aviso.tipo === 'sucesso' ? <svg className="check" viewBox="0 0 24 24" width="22" height="22" aria-hidden><circle cx="12" cy="12" r="10"/><path d="M7.5 12.5l3 3 6-6.5"/></svg>
          : aviso.tipo === 'erro' ? <CircleAlert className="alerta text-bad" size={22} aria-hidden/> : null}
        <Toast.Description className={aviso.tipo === 'erro' ? 'text-bad' : 'text-slate-100'}>{aviso.texto}</Toast.Description>
        <Toast.Close aria-label="Fechar notificação" className="ml-auto p-1"><X size={16}/></Toast.Close>
      </Toast.Root>)}
      <Toast.Viewport label="Notificações" className="fixed bottom-4 right-4 z-[60] grid w-[min(22rem,calc(100%-2rem))] gap-2" />
    </Toast.Provider>
  </AvisosContext.Provider>
}
export function Estado({ carregando, erro, tentar, linhas }: { carregando: boolean; erro?: string; tentar: () => void; linhas?: number }) {
  if (carregando) return <div>
    <p role="status" className="carregando"><MatrizLoader/>Carregando…</p>
    {linhas ? <Esqueleto linhas={linhas}/> : null}
  </div>
  if (erro) return <div role="alert" className={painel}><p className="mb-3 text-bad">{erro}</p><button onClick={tentar} className={botao}>Tentar novamente</button></div>
  return null
}
