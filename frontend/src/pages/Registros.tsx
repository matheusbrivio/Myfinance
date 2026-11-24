import { useRef, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { ListaTransacoes } from '../components/ListaTransacoes'
import { Formulario, Calendario, type Campo } from '../components/Formulario'
import { Abas } from '../components/Abas'
import { Entrada } from '../components/Entrada'
import { Numero } from '../components/Numero'
import { Cabecalho, Dialogo, Estado, Painel, botao, campo, icone, primario } from '../components/ui'
import { useQuery } from '../hooks/useQuery'
import { useUltimo } from '../hooks/useUltimo'
import { useAtualizacao } from '../layouts/contexto'
import { camposTransacao } from '../services/camposTransacao'
import { api, todas } from '../services/api'
import { dataBR, dataISO, moeda, somar } from '../services/format'
import type { Categoria, Lista, Transacao } from '../types/financeiro'

type Edicao<T> = { modo: 'novo' | 'editar' | 'excluir'; item?: T }
const nomes = [{ nome: 'nome', rotulo: 'Nome', obrigatorio: true }, { nome: 'descricao', rotulo: 'Descrição', tipo: 'area' }] satisfies Campo[]

export function Categorias() {
  const q = useQuery('categorias', signal => todas<Categoria>('categorias/', signal))
  const [edicao, setEdicao] = useState<Edicao<Categoria>>()
  const titulo = edicao?.modo === 'editar' ? 'Editar categoria' : edicao?.modo === 'excluir' ? 'Excluir categoria' : 'Nova categoria'
  return <>
    <Cabecalho titulo="Categorias">
      <button className={primario} onClick={() => setEdicao({ modo: 'novo' })}>Nova categoria <Plus size={16} aria-hidden/></button>
    </Cabecalho>
    {!q.data ? <Estado carregando={q.loading} erro={q.error} tentar={q.reload} linhas={4}/> :
      q.data.length ? <Entrada agrupar className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">{q.data.map(item => <Painel key={item.id} className="flex h-full flex-col">
        <h2 className="titulo-card break-words">{item.nome}</h2>
        <p className="mt-2 mb-5 flex-1 break-words text-soft">{item.descricao || <span className="text-muted">Sem descrição</span>}</p>
        <Acoes nome={item.nome} editar={() => setEdicao({ modo: 'editar', item })} excluir={() => setEdicao({ modo: 'excluir', item })}/>
      </Painel>)}</Entrada> : <Painel><p className="text-muted">Nenhuma categoria cadastrada.</p></Painel>}
    <EdicaoRegistro edicao={edicao} titulo={titulo} campos={nomes} recurso="categorias"
      inicial={edicao?.item ? { nome: edicao.item.nome, descricao: edicao.item.descricao } : undefined}
      fechar={() => setEdicao(undefined)} recarregar={q.reload} />
  </>
}
// Ações em ícone; o nome do item entra no aria-label para o leitor de tela.
export function Acoes({ nome, editar, excluir }: { nome: string; editar: () => void; excluir: () => void }) {
  return <div className="flex gap-1">
    <button type="button" className={icone} aria-label={'Editar ' + nome} title="Editar" onClick={editar}><Pencil size={16} aria-hidden/></button>
    <button type="button" className={icone + ' hover:text-bad'} aria-label={'Excluir ' + nome} title="Excluir" onClick={excluir}><Trash2 size={16} aria-hidden/></button>
  </div>
}
export function EdicaoRegistro<T extends {id: number}>({ edicao, campos, titulo, recurso, inicial, fechar, recarregar, resumo, verbo }: {
  edicao?: Edicao<T>; campos: Campo[]; titulo: string; recurso: string; inicial?: Record<string,string>; fechar: () => void; recarregar: () => void
  resumo?: ReactNode; verbo?: 'excluir' | 'encerrar'
}) {
  // Guarda a última edição para o modal poder animar a saída depois que `edicao` some.
  const ultima = useRef(edicao)
  if (edicao) ultima.current = edicao
  const atual = edicao ?? ultima.current
  const [conteudo, setConteudo] = useState<{ titulo: string; resumo?: ReactNode; inicial?: Record<string, string> }>({ titulo, resumo, inicial })
  if (edicao && (conteudo.titulo !== titulo || conteudo.resumo !== resumo || conteudo.inicial !== inicial)) setConteudo({ titulo, resumo, inicial })
  if (!atual) return null
  const method = atual.modo === 'excluir' ? 'DELETE' : atual.modo === 'editar' ? 'PATCH' : 'POST'
  return <Dialogo titulo={conteudo.titulo} aberto={!!edicao} onOpenChange={open => { if (!open) fechar() }}>
    <Formulario campos={method === 'DELETE' ? [] : campos} inicial={conteudo.inicial} method={method} resumo={conteudo.resumo} cancelar={fechar}
      rotuloSalvar={recurso === 'transacoes' ? 'Salvar transação' : 'Salvar'} verbo={verbo}
      endpoint={recurso + '/' + (atual.item ? atual.item.id + '/' : '')}
      sucesso={method === 'DELETE' ? 'Operação concluída.' : 'Registro salvo.'} concluir={() => { fechar(); recarregar() }}/>
  </Dialogo>
}

const abas = [{ valor: '', rotulo: 'Todas' }, { valor: 'receita', rotulo: 'Receitas' }, { valor: 'despesa', rotulo: 'Despesas' }]
export function Transacoes() {
  const [params, setParams] = useSearchParams()
  const { versao } = useAtualizacao()
  const q = useQuery('transacoes?' + params + '#' + versao, signal => api<Lista<Transacao>>('transacoes/?' + params, { signal }))
  const lista = useUltimo(q.data)
  const cats = useQuery('categorias', signal => todas<Categoria>('categorias/', signal))
  const [edicao, setEdicao] = useState<Edicao<Transacao>>()
  const opcoes = (cats.data ?? []).map(c => ({ valor: String(c.id), rotulo: c.nome }))
  const campos = camposTransacao(opcoes)
  const item = edicao?.item
  const inicial = item && { descricao: item.descricao, data: item.data, valor: item.valor,
    tipo: item.tipo, categoria: item.categoria === null ? '' : String(item.categoria) }
  const titulo = edicao?.modo === 'editar' ? 'Editar transação' : edicao?.modo === 'excluir' ? 'Excluir transação' : 'Nova transação'
  const chaveFiltros = ['categoria','data_inicio','data_fim'].map(k => params.get(k) || '').join('|')
  const itens = lista?.resultados ?? []
  const varias = (lista?.total ?? 0) > itens.length
  const resumos = [
    { rotulo: 'Transações', valor: String(lista?.total ?? 0), cor: 'var(--text)', mono: false },
    { rotulo: varias ? 'Entrou (nesta página)' : 'Entrou', valor: moeda(somar(itens.filter(t => t.tipo === 'receita').map(t => t.valor))), cor: 'var(--income)', mono: true },
    { rotulo: varias ? 'Saiu (nesta página)' : 'Saiu', valor: moeda(somar(itens.filter(t => t.tipo === 'despesa').map(t => t.valor))), cor: 'var(--expense)', mono: true },
  ]
  return <>
    <Cabecalho titulo="Transações">
      <Abas id="abas-tipo" rotulo="Tipo de transação" valor={params.get('tipo') || ''} opcoes={abas} mudar={tipo => {
        const novos = new URLSearchParams(params)
        if (tipo) novos.set('tipo', tipo); else novos.delete('tipo')
        novos.delete('pagina'); setParams(novos)
      }}/>
    </Cabecalho>
    {cats.error && <Estado carregando={false} erro={cats.error} tentar={cats.reload}/>}
    <Entrada agrupar className="mb-6 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">{resumos.map(r => <Painel key={r.rotulo}>
      <h2 className="rotulo-secao">{r.rotulo}</h2>
      <p className={(r.mono ? 'num text-2xl' : 'forte text-3xl') + ' mt-2 break-all'} style={{ color: r.cor }}>{lista ? <Numero texto={r.valor}/> : '—'}</p>
    </Painel>)}</Entrada>
    <Entrada><Filtros key={chaveFiltros} params={params} opcoes={opcoes} setParams={setParams}/></Entrada>
    {q.error && lista && <Estado carregando={false} erro={q.error} tentar={q.reload}/>}
    {!lista ? <Estado carregando={q.loading} erro={q.error} tentar={q.reload} linhas={5}/> :
      <Entrada><Painel><ListaTransacoes itens={lista.resultados} acoes={item => <Acoes nome={item.descricao || 'transação de ' + moeda(item.valor)}
        editar={() => setEdicao({ modo: 'editar', item })} excluir={() => setEdicao({ modo: 'excluir', item })}/>}/>
        <Paginacao pagina={lista.pagina} total={lista.total} mudar={pagina => {
          const novos = new URLSearchParams(params)
          novos.set('pagina', String(pagina)); setParams(novos)
        }}/>
      </Painel></Entrada>}
    <EdicaoRegistro edicao={edicao} titulo={titulo} campos={campos} recurso="transacoes" inicial={inicial}
      resumo={edicao?.modo === 'excluir' && item ? <dl className="resumo-exclusao">
        <div><dt>Descrição</dt><dd className="break-words">{item.descricao || 'Sem descrição'}</dd></div>
        <div><dt>Data</dt><dd className="num">{dataBR(item.data)}</dd></div>
        <div><dt>Valor</dt><dd className={'num ' + (item.tipo === 'receita' ? 'text-good' : 'text-bad')}>{moeda(item.valor)}</dd></div>
      </dl> : undefined}
      fechar={() => setEdicao(undefined)} recarregar={() => {
        if (q.data?.pagina && q.data.pagina > 1 && q.data.resultados.length === 1) {
          const novos = new URLSearchParams(params); novos.delete('pagina'); setParams(novos)
        } else q.reload()
      }}/>
  </>
}
function Filtros({ params, opcoes, setParams }: {
  params: URLSearchParams; opcoes: { valor: string; rotulo: string }[]; setParams: (v: URLSearchParams) => void
}) {
  const [categoria, setCategoria] = useState(params.get('categoria') || '')
  const [inicio, setInicio] = useState(params.get('data_inicio') ? dataBR(params.get('data_inicio')!) : '')
  const [fim, setFim] = useState(params.get('data_fim') ? dataBR(params.get('data_fim')!) : '')
  return <form aria-label="Filtros" className="glass mb-6 grid gap-4 rounded-[26px] p-6 sm:grid-cols-2 xl:grid-cols-[repeat(3,minmax(0,1fr))_auto] xl:items-start" onSubmit={e => {
    e.preventDefault()
    const novos = new URLSearchParams()
    for (const [k,v] of Object.entries({ tipo: params.get('tipo') || '', categoria, data_inicio: dataISO(inicio), data_fim: dataISO(fim) })) if (v) novos.set(k,v)
    setParams(novos)
  }}>
    <div><label className="rotulo" htmlFor="filtro-categoria">Categoria</label><select id="filtro-categoria" className={campo} value={categoria} onChange={e => setCategoria(e.target.value)}>
      <option value="">Todas as categorias</option><option value="sem_categoria">Sem categoria</option>
      {opcoes.map(o => <option key={o.valor} value={o.valor}>{o.rotulo}</option>)}
    </select></div>
    <div><label className="rotulo" htmlFor="inicio">Data inicial</label><Calendario id="inicio" valor={inicio} mudar={setInicio}/></div>
    <div><label className="rotulo" htmlFor="fim">Data final</label><Calendario id="fim" valor={fim} mudar={setFim}/></div>
    <div className="flex flex-wrap gap-2 sm:col-span-2 xl:col-span-1 xl:pt-[22px]">
      <button className={primario} aria-label="Aplicar filtros">Aplicar</button>
      <button type="button" className={botao} aria-label="Limpar filtros" onClick={() => { setCategoria(''); setInicio(''); setFim(''); setParams(new URLSearchParams()) }}>Limpar</button>
    </div>
  </form>
}
function Paginacao({ pagina, total, mudar }: { pagina: number; total: number; mudar: (n: number) => void }) {
  const paginas = Math.ceil(total / 25)
  if (paginas <= 1) return null
  return <nav aria-label="Paginação" className="mt-5 flex flex-wrap items-center gap-3 border-t border-line pt-5">
    <button className={botao} disabled={pagina <= 1} onClick={() => mudar(pagina - 1)}>Anterior</button>
    <span className="num text-sm text-soft">Página {pagina} de {paginas}</span>
    <button className={botao} disabled={pagina >= paginas} onClick={() => mudar(pagina + 1)}>Próxima</button>
  </nav>
}
