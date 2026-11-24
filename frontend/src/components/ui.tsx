import * as DialogPrimitive from '@radix-ui/react-dialog'
import * as Toast from '@radix-ui/react-toast'
import { createContext, useContext, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { CircleAlert, X } from 'lucide-react'
import { Esqueleto, MatrizLoader } from './Efeitos'
import { Entrada } from './Entrada'
import { Link } from 'react-router'

// Botões em pílula: contornado (padrão), claro (principal) e ícone redondo.
export const botao = 'botao inline-flex items-center justify-center gap-2 rounded-full border border-[rgba(15,23,42,.12)] px-4 h-10 text-sm font-medium text-text hover:bg-[rgba(15,23,42,.04)] disabled:opacity-50'
export const primario = 'botao inline-flex items-center justify-center gap-2 rounded-full border border-ink bg-ink px-4 h-10 text-sm font-semibold text-white shadow-[0_6px_16px_-8px_rgba(15,23,42,.5)] hover:bg-[#1E293B] disabled:opacity-50'
export const icone = 'inline-grid size-9 place-items-center rounded-full text-soft hover:bg-track hover:text-text'
export const campo = 'campo w-full rounded-[12px] border border-[rgba(15,23,42,.10)] bg-white/70 px-4 h-11 text-[15px] text-text placeholder:text-muted aria-invalid:border-bad'
// Botão de texto, para ações secundárias discretas ("Cancelar", "Limpar").
export const botaoTexto = 'inline-flex h-10 items-center justify-center gap-1.5 rounded-[12px] px-3 text-sm font-medium text-soft hover:bg-track hover:text-text disabled:opacity-50'
export const painel = 'glass min-w-0 rounded-[24px] p-6'

const suave = [0.16, 1, 0.3, 1] as const

// Cabeçalho de todo card: título (16/600) à esquerda e ação discreta à direita.
export function CabecalhoCard({ titulo, acao }: { titulo: string; acao?: ReactNode }) {
  return <div className="mb-4 flex items-center justify-between gap-3"><h2 className="titulo-card">{titulo}</h2>{acao}</div>
}
// Ação discreta de card: "Ver todas →".
export function VerTodas({ para, rotulo }: { para: string; rotulo: string }) {
  return <Link to={para} className="ver-todas" aria-label={rotulo}>Ver todas →</Link>
}
// Cabeçalho de página: título (32/600) com subtítulo de uma linha; à direita, a ação principal.
export function Cabecalho({ titulo, subtitulo, children }: { titulo: string; subtitulo?: string; children?: ReactNode }) {
  return <Entrada className="cabecalho"><div className="min-w-0"><h1 className="titulo-pagina">{titulo}</h1>
    {subtitulo && <p className="subtitulo-pagina">{subtitulo}</p>}</div>
    {children && <div className="flex flex-wrap items-center gap-3">{children}</div>}</Entrada>
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
        <motion.div className="fixed inset-0 z-40 bg-[rgba(15,23,42,.25)] backdrop-blur-[4px]"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduz ? 0 : 0.25 }}/>
      </DialogPrimitive.Overlay>
      {/* Escape com um calendário aberto fecha só o calendário, não o modal. */}
      <DialogPrimitive.Content asChild forceMount onEscapeKeyDown={e => { if (document.querySelector('[data-calendario-aberto]')) e.preventDefault() }}>
        <motion.div className="dialogo glass glass-modal fixed inset-0 z-50 m-auto h-fit w-[min(460px,calc(100%-2rem))] rounded-[24px] p-6"
          initial={reduz ? { opacity: 0 } : { opacity: 0, scale: 0.97, filter: 'blur(6px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)', transition: { duration: reduz ? 0 : 0.35, ease: suave }, transitionEnd: { filter: 'none' } }}
          exit={reduz ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, scale: 0.98, filter: 'blur(4px)', transition: { duration: 0.18, ease: 'easeIn' } }}>
          <div className="mb-5 flex items-center justify-between gap-4">
            <DialogPrimitive.Title className="text-[20px] font-semibold leading-tight tracking-[-0.02em]">{titulo}</DialogPrimitive.Title>
            <DialogPrimitive.Close className="grid size-9 shrink-0 place-items-center rounded-full border border-line bg-[rgba(15,23,42,.04)] text-soft hover:bg-track hover:text-text" aria-label="Fechar diálogo"><X size={18}/></DialogPrimitive.Close>
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
  return <span className="check-circulo" aria-hidden><svg className="check" viewBox="0 0 24 24" width="20" height="20">
    <motion.path d="M6.5 12.5l3.5 3.5 7.5-8" {...traco(0.1, 0.3)}/>
  </svg></span>
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
      {/* No celular, fica acima do menu fixo do rodapé (que tem ~76px) para não cobrir a navegação. */}
      <Toast.Viewport label="Notificações" className="fixed bottom-[92px] right-5 z-[60] grid w-[min(24rem,calc(100%-2.5rem))] gap-2 tab:bottom-5" />
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
