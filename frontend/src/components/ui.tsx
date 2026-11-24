import * as DialogPrimitive from '@radix-ui/react-dialog'
import * as Toast from '@radix-ui/react-toast'
import { createContext, useContext, useRef, useState, type ReactNode } from 'react'
import { CircleAlert, X } from 'lucide-react'
import { Esqueleto, MatrizLoader } from './Efeitos'

export const botao = 'inline-flex items-center justify-center gap-2 rounded-[10px] border border-line px-3 py-2 text-sm font-medium hover:bg-line disabled:opacity-50'
export const primario = botao + ' bg-accent text-base border-accent hover:bg-sky-200'
export const campo = 'w-full rounded-[10px] border border-line bg-base px-3 py-2 text-sm aria-invalid:border-bad'
export const painel = 'min-w-0 rounded-xl border border-line bg-panel/95 p-5'

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
