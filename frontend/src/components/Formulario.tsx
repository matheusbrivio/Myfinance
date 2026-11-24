import { useId, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react'
import { motion, useAnimationControls, useReducedMotion } from 'motion/react'
import { ArrowDownRight, ArrowUpRight, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { ErroAPI, api } from '../services/api'
import { dataBR, dataISO, moeda, tipos, valorAPI } from '../services/format'
import { botao, campo, icone, primario, useAviso } from './ui'
import { PilulaAtiva } from './Abas'
import HoldButton from './HoldButton'

export type Campo = {
  nome: string; rotulo: string; obrigatorio?: boolean
  tipo?: 'texto' | 'area' | 'data' | 'moeda' | 'select' | 'segmento'
  opcoes?: { valor: string; rotulo: string }[]
  /** Ocupa meia linha (ex.: Data e Categoria lado a lado). */
  meia?: boolean
  /** Valor em destaque: serifa grande, só com linha embaixo. */
  destaque?: boolean
}
const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const tremor = { x: [0, -6, 6, -4, 3, 0], transition: { duration: 0.3 } }

export function Calendario({ id, valor, mudar, invalido, obrigatorio, descricao }: {
  id: string; valor: string; mudar: (v: string) => void; invalido?: boolean; obrigatorio?: boolean; descricao?: string
}) {
  const [aberto, setAberto] = useState(false)
  const [mes, setMes] = useState(() => {
    const [, mesInicial, anoInicial] = valor.split('/').map(Number)
    const hoje = new Date()
    return mesInicial >= 1 && mesInicial <= 12 && anoInicial >= 1000
      ? new Date(anoInicial, mesInicial - 1, 1) : new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  })
  const acionador = useRef<HTMLButtonElement>(null)
  const dias = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate()
  return <div className="relative">
    <div className="flex gap-2">
      <input id={id} value={valor} onChange={e => mudar(e.target.value)} placeholder="DD/MM/AAAA" className={campo + ' num'}
        aria-invalid={invalido} aria-describedby={descricao} required={obrigatorio} inputMode="numeric"/>
      <button type="button" ref={acionador} className={icone + ' size-11 shrink-0 border border-white/10 bg-black/30'} aria-label="Abrir calendário"
        aria-expanded={aberto} onClick={() => setAberto(!aberto)}><CalendarDays size={18} aria-hidden/></button>
    </div>
    {aberto && <div className="glass glass-modal absolute left-0 z-30 mt-2 w-[min(18rem,calc(100vw-3rem))] rounded-[20px] p-3" onKeyDown={e => {
      if (e.key === 'Escape') { e.stopPropagation(); setAberto(false); acionador.current?.focus() }
    }}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <button type="button" className={icone} aria-label="Mês anterior" onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1))}><ChevronLeft size={16} aria-hidden/></button>
        <span aria-live="polite" className="text-sm font-medium">{meses[mes.getMonth()]} de {mes.getFullYear()}</span>
        <button type="button" className={icone} aria-label="Mês seguinte" onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() + 1, 1))}><ChevronRight size={16} aria-hidden/></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d => <span key={d} className="py-1 text-xs text-muted">{d}</span>)}
        {Array.from({length: mes.getDay()}, (_, i) => <span key={'v'+i}/>)}
        {Array.from({length: dias}, (_, i) => {
          const data = [i+1, mes.getMonth()+1, mes.getFullYear()].map(n => String(n).padStart(2, '0')).join('/')
          return <button key={i} type="button" className={'num rounded-full py-1.5 hover:bg-white/10' + (data === valor ? ' bg-pill text-[#0B0F17]' : '')} aria-label={data}
            onClick={() => { mudar(data); setAberto(false); acionador.current?.focus() }}>{i+1}</button>
        })}
      </div>
    </div>}
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
          <input type="radio" className="sr-only" name={'campo-' + c.nome} value={o.valor} checked={valor === o.valor}
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
            <span className="serif text-muted" aria-hidden>R$</span>
            <input {...comum} className="valor-input serif" inputMode="decimal" placeholder="0,00" autoComplete="off" onChange={e => mudar(e.target.value)}/>
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
        <HoldButton key={tentativaExclusao} size="lg" radius={16} holdTime={1200} releaseTime={200}
          backgroundColor="rgba(255,255,255,0.08)" fillColor="#D9503A" textColor="#FFF4F1" fillTextColor="#FFFFFF"
          doneLabel={verbo === 'encerrar' ? 'Encerrada' : 'Excluída'} resetAfter={0} disabled={enviando}
          className="w-full" onHold={() => { void enviar() }}>{verbo === 'encerrar' ? 'Segure para encerrar' : 'Segure para excluir'}</HoldButton>
        <p className="text-center text-sm text-muted">Segure por 1,2 s. Soltar antes cancela.</p>
        {cancelar && <button type="button" className={botao} onClick={cancelar}>Cancelar</button>}
      </div> : <div className={'grid gap-3 sm:col-span-2 ' + (cancelar ? 'grid-cols-3' : '')}>
        {cancelar && <button type="button" className={botao} onClick={cancelar}>Cancelar</button>}
        <button type="submit" className={primario + (cancelar ? ' col-span-2' : '')} disabled={enviando}>{enviando ? 'Enviando…' : rotuloSalvar}</button>
      </div>}
    </fieldset>
  </motion.form>
}
