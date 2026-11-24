import { useEffect, useId, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react'
import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from 'motion/react'
import { ArrowDownRight, ArrowUpRight, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { ErroAPI, api } from '../services/api'
import { dataBR, dataISO, moeda, tipos, valorAPI } from '../services/format'
import { botaoTexto, campo, icone, primario, useAviso } from './ui'
import { PilulaAtiva } from './Abas'
import HoldButton from './HoldButton'

export type Campo = {
  nome: string; rotulo: string; obrigatorio?: boolean
  tipo?: 'texto' | 'area' | 'data' | 'moeda' | 'select' | 'segmento'
  opcoes?: { valor: string; rotulo: string }[]
  /** Ocupa meia linha (ex.: Data e Categoria lado a lado). */
  meia?: boolean
  /** Valor em destaque: número grande, só com linha embaixo. */
  destaque?: boolean
}
const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const tremor = { x: [0, -6, 6, -4, 3, 0], transition: { duration: 0.3 } }

const diasSemana = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
const doisDigitos = (n: number) => String(n).padStart(2, '0')
const formatar = (d: Date) => [d.getDate(), d.getMonth() + 1, d.getFullYear()].map(doisDigitos).join('/')
// Mês exibido ao abrir: o da data digitada, se válida; senão, o mês atual.
function mesDe(valor: string) {
  const [, m, a] = valor.split('/').map(Number)
  const hoje = new Date()
  return m >= 1 && m <= 12 && a >= 1000 ? new Date(a, m - 1, 1) : new Date(hoje.getFullYear(), hoje.getMonth(), 1)
}
const suaveCal = [0.16, 1, 0.3, 1] as const
const molaDia = { type: 'spring', stiffness: 500, damping: 35 } as const

/**
 * Seletor de datas: popover de vidro ancorado embaixo do campo, por cima do conteúdo.
 * Abre com fade + scale; os dias entram em cascata; trocar de mês desliza a grade na direção
 * da seta; a pílula do dia selecionado desliza entre os dias (layoutId).
 * Escape fecha e devolve o foco ao botão; clicar fora também fecha.
 */
export function Calendario({ id, valor, mudar, invalido, obrigatorio, descricao, compacto = false }: {
  id: string; valor: string; mudar: (v: string) => void; invalido?: boolean; obrigatorio?: boolean; descricao?: string
  /** Versão de 40px, para a barra de filtros. */
  compacto?: boolean
}) {
  const reduz = useReducedMotion()
  const idPilula = useId()
  const [aberto, setAberto] = useState(false)
  const [mes, setMes] = useState(() => mesDe(valor))
  const [direcao, setDirecao] = useState(0)
  // A cascata dos dias só acontece na abertura, não ao trocar de mês.
  const [cascata, setCascata] = useState(true)
  const [direita, setDireita] = useState(false)
  const [pulso, setPulso] = useState<string>()
  const acionador = useRef<HTMLButtonElement>(null)
  const raiz = useRef<HTMLDivElement>(null)
  const fechamento = useRef<number | undefined>(undefined)

  function abrir() {
    const caixa = raiz.current?.getBoundingClientRect()
    // Perto da borda direita, alinha o popover pela direita do campo para não sair da tela.
    setDireita(!!caixa && caixa.left + 300 > window.innerWidth - 12)
    setMes(mesDe(valor)); setDirecao(0); setCascata(true); setPulso(undefined); setAberto(true)
  }
  function fechar(devolverFoco: boolean) {
    window.clearTimeout(fechamento.current)
    setAberto(false)
    if (devolverFoco) acionador.current?.focus()
  }
  function trocarMes(passo: number) {
    setDirecao(passo); setCascata(false)
    setMes(m => new Date(m.getFullYear(), m.getMonth() + passo, 1))
  }
  function escolher(data: string) {
    mudar(data)
    if (reduz) return fechar(true)
    // Pulso curto no dia (a pílula desliza até ele) e depois fecha.
    setPulso(data)
    window.clearTimeout(fechamento.current)
    fechamento.current = window.setTimeout(() => fechar(true), 220)
  }

  useEffect(() => {
    if (!aberto) return
    const fora = (e: PointerEvent) => { if (!raiz.current?.contains(e.target as Node)) fechar(false) }
    // Escape no documento: funciona com o foco no campo ou dentro do popover.
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); fechar(true) } }
    document.addEventListener('pointerdown', fora)
    document.addEventListener('keydown', tecla)
    return () => { document.removeEventListener('pointerdown', fora); document.removeEventListener('keydown', tecla) }
  }, [aberto])
  useEffect(() => () => window.clearTimeout(fechamento.current), [])

  const hoje = formatar(new Date())
  const dias = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate()
  const chaveMes = mes.getFullYear() + '-' + mes.getMonth()
  const deslize = reduz ? 0 : 24
  return <div ref={raiz} className="relative" data-calendario-aberto={aberto || undefined}>
    <div className="flex gap-2">
      <input id={id} value={valor} onChange={e => mudar(e.target.value)} placeholder="DD/MM/AAAA" className={campo + ' num' + (compacto ? ' h-10 px-3 text-sm' : '')}
        aria-invalid={invalido} aria-describedby={descricao} required={obrigatorio} inputMode="numeric"/>
      <button type="button" ref={acionador} className={icone + (compacto ? ' size-10' : ' size-11') + ' shrink-0 border border-[rgba(15,23,42,.10)] bg-white/70'} aria-label="Abrir calendário"
        aria-expanded={aberto} onClick={() => aberto ? fechar(false) : abrir()}><CalendarDays size={18} aria-hidden/></button>
    </div>
    <AnimatePresence>{aberto && <motion.div role="group" aria-label="Calendário" className={'calendario glass ' + (direita ? 'right-0' : 'left-0')}
      style={{ transformOrigin: direita ? 'top right' : 'top left' }}
      initial={reduz ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: reduz ? 0 : 0.18, ease: suaveCal } }}
      exit={reduz ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, scale: 0.97, y: -4, transition: { duration: 0.12, ease: 'easeIn' } }}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <button type="button" className={icone + ' size-8'} aria-label="Mês anterior" onClick={() => trocarMes(-1)}><ChevronLeft size={16} aria-hidden/></button>
        <span aria-live="polite" className="relative grid h-6 flex-1 place-items-center overflow-hidden text-sm font-semibold">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span key={chaveMes} className="col-start-1 row-start-1 whitespace-nowrap"
              initial={reduz ? { opacity: 0 } : { opacity: 0, filter: 'blur(3px)' }} animate={{ opacity: 1, filter: 'blur(0px)' }}
              exit={reduz ? { opacity: 0 } : { opacity: 0, filter: 'blur(3px)' }} transition={{ duration: reduz ? 0 : 0.22 }}>
              {meses[mes.getMonth()]} de {mes.getFullYear()}
            </motion.span>
          </AnimatePresence>
        </span>
        <button type="button" className={icone + ' size-8'} aria-label="Mês seguinte" onClick={() => trocarMes(1)}><ChevronRight size={16} aria-hidden/></button>
      </div>
      <div className="grid grid-cols-7 text-center">{diasSemana.map(d => <span key={d} className="dia-semana">{d}</span>)}</div>
      <div className="relative overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false} custom={direcao}>
          <motion.div key={chaveMes} className="grid grid-cols-7 gap-y-0.5 text-center text-sm" custom={direcao}
            variants={{
              entra: (d: number) => ({ opacity: 0, x: d * deslize }),
              parado: { opacity: 1, x: 0 },
              sai: (d: number) => ({ opacity: 0, x: -d * deslize }),
            }}
            initial="entra" animate="parado" exit="sai" transition={{ duration: reduz ? 0 : 0.22, ease: suaveCal }}>
            {Array.from({ length: mes.getDay() }, (_, i) => <span key={'v' + i}/>)}
            {Array.from({ length: dias }, (_, i) => {
              const data = [i + 1, mes.getMonth() + 1, mes.getFullYear()].map(doisDigitos).join('/')
              const selecionado = data === valor
              return <motion.button key={data} type="button" aria-label={data} aria-pressed={selecionado}
                className={'dia num' + (selecionado ? ' dia-selecionado' : '')}
                initial={cascata && !reduz ? { opacity: 0, y: 4 } : false}
                animate={pulso === data ? { opacity: 1, y: 0, scale: [1, 1.08, 1] } : { opacity: 1, y: 0, scale: 1 }}
                transition={pulso === data ? { duration: 0.2 } : { duration: 0.2, delay: cascata ? Math.min(i * 0.008, 0.25) : 0 }}
                onClick={() => escolher(data)}>
                {selecionado && <motion.span aria-hidden layoutId={'dia-' + idPilula} className="dia-pilula" transition={reduz ? { duration: 0 } : molaDia}/>}
                <span className="relative z-[1]">{i + 1}</span>
                {data === hoje && <span aria-hidden className="dia-hoje"/>}
              </motion.button>
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>}</AnimatePresence>
  </div>
}

// Tipo em pílula segmentada (↗ Receita / ↘ Despesa): rádios nativos com a pílula clara deslizando.
function Segmento({ c, valor, mudar, invalido, descricao }: { c: Campo; valor: string; mudar: (v: string) => void; invalido: boolean; descricao?: string }) {
  const id = useId()
  return <fieldset aria-describedby={descricao} aria-invalid={invalido || undefined}>
    <legend className="rotulo">{c.rotulo}{c.obrigatorio && ' *'}</legend>
    <div className="segmento">
      {c.opcoes?.map(o => {
        const Icone = o.valor === 'receita' ? ArrowUpRight : o.valor === 'despesa' ? ArrowDownRight : null
        return <label key={o.valor} className="segmento-item">
          <input type="radio" className="segmento-radio" name={'campo-' + c.nome} value={o.valor} checked={valor === o.valor}
            required={c.obrigatorio} onChange={() => mudar(o.valor)}/>
          {valor === o.valor && <PilulaAtiva id={'segmento-' + id}/>}
          <span className="pilula-texto inline-flex items-center gap-1.5">{Icone && <Icone size={16} aria-hidden/>}{o.rotulo}</span>
        </label>
      })}
    </div>
  </fieldset>
}

export function Formulario({ campos, inicial = {}, endpoint, method = 'POST', sucesso, concluir, resumo, cancelar,
  rotuloSalvar = 'Salvar', verbo = 'excluir' }: {
  campos: Campo[]; inicial?: Record<string, string>; endpoint: string; method?: 'POST' | 'PATCH' | 'DELETE'
  sucesso: string; concluir: () => void; resumo?: ReactNode; cancelar?: () => void
  rotuloSalvar?: string; verbo?: 'excluir' | 'encerrar'
}) {
  const [dados, setDados] = useState(() => Object.fromEntries(Object.entries(inicial).map(([nome, valor]) => {
    const tipo = campos.find(c => c.nome === nome)?.tipo
    return [nome, tipo === 'moeda' ? valor.replace('.', ',') : tipo === 'data' ? dataBR(valor) : valor]
  })))
  const [erros, setErros] = useState<Record<string, string[]>>({})
  const [erroGeral, setErroGeral] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [tentativaExclusao, setTentativaExclusao] = useState(0)
  const pendente = useRef(false)
  const tentativa = useRef<{ corpo: string; chave: string } | undefined>(undefined)
  const aviso = useAviso()
  const reduz = useReducedMotion()
  const forma = useAnimationControls()
  function tremer() { if (!reduz) void forma.start(tremor) }
  async function enviar(event?: FormEvent) {
    event?.preventDefault()
    if (pendente.current) return
    pendente.current = true
    setEnviando(true)
    setErroGeral('')
    const body = Object.fromEntries(campos.flatMap(c => {
      const valor = dados[c.nome] ?? ''
      if (c.nome === 'inicial' && !valor) return []
      return [[c.nome, c.tipo === 'data' ? dataISO(valor) : c.tipo === 'moeda' ? valorAPI(valor) :
        c.nome === 'categoria' ? (valor ? Number(valor) : null) : valor]]
    }))
    const corpo = JSON.stringify(body)
    try {
      if (tentativa.current?.corpo !== corpo) tentativa.current = { corpo, chave: crypto.randomUUID() }
      await api(endpoint, { method, key: method === 'POST' ? tentativa.current.chave : undefined,
        body: method === 'DELETE' ? undefined : body })
      const valor = typeof body.valor === 'string' && /^\d+(\.\d{2})?$/.test(body.valor) ? moeda(body.valor) : undefined
      const tipo = typeof body.tipo === 'string' && body.tipo in tipos ? tipos[body.tipo as keyof typeof tipos] : undefined
      aviso(sucesso, 'sucesso', [valor, tipo].filter(Boolean).join(' · ') || (typeof body.nome === 'string' ? body.nome : undefined))
      concluir()
    } catch (erro) {
      if (erro instanceof ErroAPI && Object.keys(erro.campos).length) {
        setErros(erro.campos)
        setErroGeral(erro.message)
        tremer()
      } else {
        const texto = erro instanceof Error ? erro.message : 'Não foi possível salvar.'
        setErroGeral(texto)
        aviso(texto, 'erro')
        tremer()
      }
      // Depois de uma falha, o HoldButton volta ao início para permitir nova tentativa.
      if (method === 'DELETE') setTentativaExclusao(n => n + 1)
    } finally {
      pendente.current = false
      setEnviando(false)
    }
  }
  const corValor = dados.tipo === 'receita' ? 'var(--income)' : dados.tipo === 'despesa' ? 'var(--expense)' : 'var(--text)'
  return <motion.form onSubmit={enviar} className="space-y-5" aria-busy={enviando} animate={forma}>
    {erroGeral && <p role="alert" className="text-sm text-bad">{erroGeral}</p>}
    {method === 'DELETE' && (resumo ?? <p className="text-soft">Confirma esta operação?</p>)}
    <fieldset disabled={enviando} className="grid gap-5 sm:grid-cols-2">
      {campos.map(c => {
        const id = 'campo-' + c.nome
        const erro = erros[c.nome]
        const descricao = erro ? id + '-erro' : undefined
        const comum = { id, value: dados[c.nome] ?? '', className: campo, required: c.obrigatorio,
          'aria-invalid': !!erro, 'aria-describedby': descricao }
        const mudar = (valor: string) => {
          setDados(v => ({ ...v, [c.nome]: valor }))
          setErros(v => Object.fromEntries(Object.entries(v).filter(([chave]) => chave !== c.nome)))
        }
        const rotulo = <label htmlFor={id} className="rotulo">{c.rotulo}{c.obrigatorio && ' *'}</label>
        return <div key={c.nome} className={'min-w-0 ' + (c.meia ? '' : 'sm:col-span-2')}>
          {c.tipo === 'segmento' ? <Segmento c={c} valor={comum.value} mudar={mudar} invalido={!!erro} descricao={descricao}/> :
          c.destaque ? <>{rotulo}<div className="valor-destaque" style={{ '--cor-valor': corValor } as CSSProperties}>
            <span className="text-muted" aria-hidden>R$</span>
            <input {...comum} className="valor-input forte" inputMode="decimal" placeholder="0,00" autoComplete="off" onChange={e => mudar(e.target.value)}/>
          </div></> : <>{rotulo}
          {c.tipo === 'select' ? <select {...comum} onChange={e => mudar(e.target.value)}>
            {c.opcoes?.map(o => <option key={o.valor} value={o.valor}>{o.rotulo}</option>)}
          </select> : c.tipo === 'area' ? <textarea {...comum} className={campo + ' h-auto min-h-24 py-3'} onChange={e => mudar(e.target.value)}/> :
          c.tipo === 'data' ? <Calendario id={id} valor={comum.value} mudar={mudar} invalido={!!erro} obrigatorio={c.obrigatorio} descricao={descricao}/> :
          <input {...comum} inputMode={c.tipo === 'moeda' ? 'decimal' : undefined} onChange={e => mudar(e.target.value)}/>}</>}
          {erro && <motion.p key={erro.join(' ')} id={id + '-erro'} className="mt-1.5 text-sm text-bad" animate={reduz ? undefined : tremor}>{erro.join(' ')}</motion.p>}
        </div>
      })}
      {method === 'DELETE' ? <div className="grid gap-3 sm:col-span-2">
        <HoldButton key={tentativaExclusao} size="lg" radius={12} holdTime={1200} releaseTime={200}
          backgroundColor="rgba(15,23,42,0.06)" fillColor="#E11D48" textColor="#0F172A" fillTextColor="#FFFFFF"
          doneLabel={verbo === 'encerrar' ? 'Encerrada' : 'Excluída'} resetAfter={0} disabled={enviando}
          className="w-full" onHold={() => { void enviar() }}>{verbo === 'encerrar' ? 'Segure para encerrar' : 'Segure para excluir'}</HoldButton>
        <p className="text-center text-sm text-muted">Segure por 1,2 s. Soltar antes cancela.</p>
        {cancelar && <button type="button" className={botaoTexto + ' justify-self-end'} onClick={cancelar}>Cancelar</button>}
      </div> : <div className="flex items-center justify-end gap-2 pt-1 sm:col-span-2">
        {cancelar && <button type="button" className={botaoTexto} onClick={cancelar}>Cancelar</button>}
        <button type="submit" className={primario + ' min-w-28'} disabled={enviando}>{enviando ? 'Enviando…' : rotuloSalvar}</button>
      </div>}
    </fieldset>
  </motion.form>
}
