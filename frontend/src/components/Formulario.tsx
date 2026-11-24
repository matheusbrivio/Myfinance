import { useRef, useState, type FormEvent } from 'react'
import { ErroAPI, api } from '../services/api'
import { dataBR, dataISO, valorAPI } from '../services/format'
import { botao, campo, useAviso } from './ui'
import { Button } from './Button'

export type Campo = { nome: string; rotulo: string; obrigatorio?: boolean; tipo?: 'texto' | 'area' | 'data' | 'moeda' | 'select'; opcoes?: { valor: string; rotulo: string }[] }
const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
export function Calendario({ id, valor, mudar, invalido, obrigatorio }: { id: string; valor: string; mudar: (v: string) => void; invalido?: boolean; obrigatorio?: boolean }) {
  const [aberto, setAberto] = useState(false)
  const [mes, setMes] = useState(() => {
    const [, mesInicial, anoInicial] = valor.split('/').map(Number)
    const hoje = new Date()
    return mesInicial >= 1 && mesInicial <= 12 && anoInicial >= 1000
      ? new Date(anoInicial, mesInicial - 1, 1) : new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  })
  const acionador = useRef<HTMLButtonElement>(null)
  const dias = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate()
  return <>
    <input id={id} value={valor} onChange={e => mudar(e.target.value)} placeholder="DD/MM/AAAA" className={campo} aria-invalid={invalido} required={obrigatorio} />
    <button type="button" ref={acionador} className={botao + ' mt-2'} aria-expanded={aberto} onClick={() => setAberto(!aberto)}>Abrir calendário</button>
    {aberto && <div className="mt-2 max-w-xs rounded-lg border border-line p-2" onKeyDown={e => {
      if (e.key === 'Escape') { setAberto(false); acionador.current?.focus() }
    }}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <button type="button" className={botao} aria-label="Mês anterior" onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1))}>‹</button>
        <span aria-live="polite">{meses[mes.getMonth()]} de {mes.getFullYear()}</span>
        <button type="button" className={botao} aria-label="Mês seguinte" onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() + 1, 1))}>›</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d => <span key={d}>{d}</span>)}
        {Array.from({length: mes.getDay()}, (_, i) => <span key={'v'+i}/>)}
        {Array.from({length: dias}, (_, i) => {
          const data = [i+1, mes.getMonth()+1, mes.getFullYear()].map(n => String(n).padStart(2, '0')).join('/')
          return <button key={i} type="button" className="rounded py-1 hover:bg-line" aria-label={data}
            onClick={() => { mudar(data); setAberto(false); acionador.current?.focus() }}>{i+1}</button>
        })}
      </div>
    </div>}
  </>
}
export function Formulario({ campos, inicial = {}, endpoint, method = 'POST', sucesso, concluir }: {
  campos: Campo[]; inicial?: Record<string, string>; endpoint: string; method?: 'POST' | 'PATCH' | 'DELETE'
  sucesso: string; concluir: () => void
}) {
  const [dados, setDados] = useState(() => Object.fromEntries(Object.entries(inicial).map(([nome, valor]) => {
    const tipo = campos.find(c => c.nome === nome)?.tipo
    return [nome, tipo === 'moeda' ? valor.replace('.', ',') : tipo === 'data' ? dataBR(valor) : valor]
  })))
  const [erros, setErros] = useState<Record<string, string[]>>({})
  const [erroGeral, setErroGeral] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [treme, setTreme] = useState(false)
  const pendente = useRef(false)
  const tentativa = useRef<{ corpo: string; chave: string } | undefined>(undefined)
  const aviso = useAviso()
  function tremer() { setTreme(true); window.setTimeout(() => setTreme(false), 350) }
  async function enviar(event: FormEvent) {
    event.preventDefault()
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
      aviso(sucesso)
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
    } finally {
      pendente.current = false
      setEnviando(false)
    }
  }
  return <form onSubmit={enviar} className={'space-y-4' + (treme ? ' treme' : '')} aria-busy={enviando}>
    {erroGeral && <p role="alert" className="text-sm text-bad">{erroGeral}</p>}
    {method === 'DELETE' && <p>Confirma esta operação?</p>}
    <fieldset disabled={enviando} className="space-y-4">
      {campos.map(c => {
        const id = 'campo-' + c.nome
        const comum = { id, value: dados[c.nome] ?? '', className: campo, required: c.obrigatorio,
          'aria-invalid': !!erros[c.nome], 'aria-describedby': erros[c.nome] ? id+'-erro' : undefined }
        const mudar = (valor: string) => {
          setDados(v => ({ ...v, [c.nome]: valor }))
          setErros(v => Object.fromEntries(Object.entries(v).filter(([chave]) => chave !== c.nome)))
        }
        return <div key={c.nome}>
          <label htmlFor={id} className="mb-1 block text-sm font-semibold">{c.rotulo}{c.obrigatorio && ' *'}</label>
          {c.tipo === 'select' ? <select {...comum} onChange={e => mudar(e.target.value)}>
            {c.opcoes?.map(o => <option key={o.valor} value={o.valor}>{o.rotulo}</option>)}
          </select> : c.tipo === 'area' ? <textarea {...comum} onChange={e => mudar(e.target.value)}/> :
          c.tipo === 'data' ? <Calendario id={id} valor={comum.value} mudar={mudar} invalido={!!erros[c.nome]} obrigatorio={c.obrigatorio}/> :
          <input {...comum} inputMode={c.tipo === 'moeda' ? 'decimal' : undefined} onChange={e => mudar(e.target.value)}/>}
          {erros[c.nome] && <p id={id+'-erro'} className="mt-1 text-sm text-bad">{erros[c.nome].join(' ')}</p>}
        </div>
      })}
      <Button type="submit" disabled={enviando}>{enviando ? 'Enviando…' : method === 'DELETE' ? 'Confirmar' : 'Salvar'}</Button>
    </fieldset>
  </form>
}
