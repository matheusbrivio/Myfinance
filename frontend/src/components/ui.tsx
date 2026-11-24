import * as DialogPrimitive from '@radix-ui/react-dialog'
import * as Toast from '@radix-ui/react-toast'
import { createContext, useContext, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { CircleAlert, X } from 'lucide-react'
import { Esqueleto, MatrizLoader } from './Efeitos'
import { Entrada } from './Entrada'

// Botões em pílula: contornado (padrão), claro (principal) e ícone redondo.
export const botao = 'botao inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-5 h-11 text-sm font-medium text-text hover:bg-white/[.06] disabled:opacity-50'
export const primario = 'botao inline-flex items-center justify-center gap-2 rounded-full border border-pill bg-pill px-5 h-11 text-sm font-semibold text-[#0B0F17] shadow-[0_6px_24px_-8px_rgba(244,246,248,.5)] hover:bg-white disabled:opacity-50'
export const icone = 'inline-grid size-9 place-items-center rounded-full text-soft hover:bg-white/[.08] hover:text-text'
export const campo = 'campo w-full rounded-[14px] border border-white/10 bg-black/30 px-4 h-11 text-[15px] text-text placeholder:text-muted aria-invalid:border-bad'
export const painel = 'glass min-w-0 rounded-[26px] p-6'

const suave = [0.16, 1, 0.3, 1] as const

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

// Modal de vidro, 500px, raio 30px. Entra com scale .97 → 1 + fade + blur; sai mais rápido.
export function Dialogo({ titulo, aberto, onOpenChange, children }: {
  titulo: string; aberto: boolean; onOpenChange: (open: boolean) => void; children: ReactNode
}) {
  const reduz = useReducedMotion()
  return <DialogPrimitive.Root open={aberto} onOpenChange={onOpenChange}>
    <AnimatePresence>{aberto && <DialogPrimitive.Portal forceMount>
      <DialogPrimitive.Overlay asChild forceMount>
        <motion.div className="fixed inset-0 z-40 bg-[rgba(3,5,9,.6)]"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduz ? 0 : 0.25 }}/>
      </DialogPrimitive.Overlay>
      <DialogPrimitive.Content asChild forceMount>
        <motion.div className="dialogo glass glass-modal fixed inset-0 z-50 m-auto h-fit max-h-[90vh] w-[min(500px,calc(100%-2rem))] overflow-y-auto rounded-[30px] p-7"
          initial={reduz ? { opacity: 0 } : { opacity: 0, scale: 0.97, filter: 'blur(6px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)', transition: { duration: reduz ? 0 : 0.35, ease: suave }, transitionEnd: { filter: 'none' } }}
          exit={reduz ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, scale: 0.98, filter: 'blur(4px)', transition: { duration: 0.18, ease: 'easeIn' } }}>
          <div className="mb-6 flex items-start justify-between gap-4">
            <DialogPrimitive.Title className="serif text-[34px] leading-tight">{titulo}</DialogPrimitive.Title>
            <DialogPrimitive.Close className="grid size-10 shrink-0 place-items-center rounded-full border border-white/12 bg-white/5 text-soft hover:bg-white/10 hover:text-text" aria-label="Fechar diálogo"><X size={18}/></DialogPrimitive.Close>
          </div>
          <DialogPrimitive.Description className="sr-only">Formulário de {titulo.toLowerCase()}</DialogPrimitive.Description>
          {children}
        </motion.div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>}</AnimatePresence>
  </DialogPrimitive.Root>
}

// Check verde desenhado (traço animado).
function Check() {
  const reduz = useReducedMotion()
  const traco = (atraso: number, duracao: number) => reduz ? {} : {
    initial: { pathLength: 0 }, animate: { pathLength: 1 }, transition: { delay: atraso, duration: duracao, ease: 'easeOut' as const },
  }
  return <svg className="check" viewBox="0 0 24 24" width="26" height="26" aria-hidden>
    <motion.circle cx="12" cy="12" r="10" {...traco(0.05, 0.35)}/>
    <motion.path d="M7.5 12.5l3 3 6-6.5" {...traco(0.3, 0.25)}/>
  </svg>
}

type Aviso = { id: number; texto: string; tipo: 'sucesso' | 'info' | 'erro'; detalhe?: string; saindo?: boolean }
type Avisar = (texto: string, tipo?: Aviso['tipo'], detalhe?: string) => void
const AvisosContext = createContext<Avisar>(() => {})
export const useAviso = () => useContext(AvisosContext)
// Toast de vidro no canto inferior direito: sobe + fade; sai em 180 ms depois de 4 s.
export function Avisos({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([])
  const id = useRef(0)
  const reduz = useReducedMotion()
  const avisar: Avisar = (texto, tipo = 'sucesso', detalhe) => {
    const novo = { id: ++id.current, texto, tipo, detalhe }
    setAvisos(atuais => [...atuais, novo])
  }
  return <AvisosContext.Provider value={avisar}>
    <Toast.Provider duration={4000} swipeDirection="right">
      {children}
      {avisos.map(aviso => <Toast.Root key={aviso.id} asChild forceMount open={!aviso.saindo}
        duration={aviso.tipo === 'erro' ? Infinity : 4000}
        onOpenChange={aberto => {
          if (aberto) return
          setAvisos(v => v.map(a => a.id === aviso.id ? { ...a, saindo: true } : a))
          window.setTimeout(() => setAvisos(v => v.filter(a => a.id !== aviso.id)), 180)
        }}>
        <motion.li className="aviso glass flex items-start gap-3 rounded-[22px] p-4 pr-3"
          initial={reduz ? false : { opacity: 0, y: 16 }}
          animate={aviso.saindo ? { opacity: 0, y: reduz ? 0 : 8 } : { opacity: 1, y: 0 }}
          transition={{ duration: reduz ? 0 : aviso.saindo ? 0.18 : 0.35, ease: suave }}>
          {aviso.tipo === 'sucesso' ? <Check/> : aviso.tipo === 'erro' ? <CircleAlert className="mt-0.5 shrink-0 text-bad" size={24} aria-hidden/> : null}
          <div className="min-w-0 flex-1">
            <Toast.Title className={'font-medium ' + (aviso.tipo === 'erro' ? 'text-bad' : 'text-text')}>{aviso.texto}</Toast.Title>
            {aviso.detalhe && <Toast.Description className="num mt-0.5 break-words text-sm text-muted">{aviso.detalhe}</Toast.Description>}
          </div>
          <Toast.Close aria-label="Fechar notificação" className={icone + ' size-8 shrink-0'}><X size={16}/></Toast.Close>
        </motion.li>
      </Toast.Root>)}
      <Toast.Viewport label="Notificações" className="fixed bottom-5 right-5 z-[60] grid w-[min(24rem,calc(100%-2.5rem))] gap-2" />
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
