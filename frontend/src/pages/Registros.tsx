import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { Historico } from '../components/Historico'
import { Formulario, Calendario, type Campo } from '../components/Formulario'
import { Abas } from '../components/Abas'
import { Dialogo, Estado, Painel, botao, campo, primario } from '../components/ui'
import { useQuery } from '../hooks/useQuery'
import { api, todas } from '../services/api'
import { dataBR, dataISO } from '../services/format'
import type { Categoria, Lista, Transacao } from '../types/financeiro'

type Edicao<T> = { modo: 'novo' | 'editar' | 'excluir'; item?: T }
const nomes = [{ nome: 'nome', rotulo: 'Nome', obrigatorio: true }, { nome: 'descricao', rotulo: 'Descrição', tipo: 'area' }] satisfies Campo[]

export function Categorias() {
  const q = useQuery('categorias', signal => todas<Categoria>('categorias/', signal))
  const [edicao, setEdicao] = useState<Edicao<Categoria>>()
  const titulo = edicao?.modo === 'editar' ? 'Editar categoria' : edicao?.modo === 'excluir' ? 'Excluir categoria' : 'Nova categoria'
  return <>
    <button className={primario + ' mb-4'} onClick={() => setEdicao({ modo: 'novo' })}>Nova categoria</button>
    {!q.data ? <Estado carregando={q.loading} erro={q.error} tentar={q.reload} linhas={4}/> :
      <div className="grid gap-3 sm:grid-cols-2">{q.data.length ? q.data.map(item => <Painel key={item.id}>
        <h2 className="break-words font-semibold">{item.nome}</h2><p className="mb-3 break-words text-muted">{item.descricao}</p>
        <Acoes editar={() => setEdicao({ modo: 'editar', item })} excluir={() => setEdicao({ modo: 'excluir', item })}/>
      </Painel>) : <p className="text-muted">Nenhuma categoria cadastrada.</p>}</div>}
    <EdicaoRegistro edicao={edicao} titulo={titulo} campos={nomes} recurso="categorias"
      inicial={edicao?.item ? { nome: edicao.item.nome, descricao: edicao.item.descricao } : undefined}
      fechar={() => setEdicao(undefined)} recarregar={q.reload} />
  </>
}
export function Acoes({ editar, excluir }: { editar: () => void; excluir: () => void }) {
  return <div className="flex flex-wrap gap-2"><button className={botao} onClick={editar}>Editar</button>
    <button className={botao + ' text-bad'} onClick={excluir}>Excluir</button></div>
}
export function EdicaoRegistro<T extends {id: number}>({ edicao, campos, titulo, recurso, inicial, fechar, recarregar }: {
  edicao?: Edicao<T>; campos: Campo[]; titulo: string; recurso: string; inicial?: Record<string,string>; fechar: () => void; recarregar: () => void
}) {
  if (!edicao) return null
  const method = edicao.modo === 'excluir' ? 'DELETE' : edicao.modo === 'editar' ? 'PATCH' : 'POST'
  return <Dialogo titulo={titulo} aberto onOpenChange={open => { if (!open) fechar() }}>
    <Formulario campos={method === 'DELETE' ? [] : campos} inicial={inicial} method={method}
      endpoint={recurso + '/' + (edicao.item ? edicao.item.id + '/' : '')}
      sucesso={method === 'DELETE' ? 'Operação concluída.' : 'Registro salvo.'} concluir={() => { fechar(); recarregar() }}/>
  </Dialogo>
}

export function Transacoes() {
  const [params, setParams] = useSearchParams()
  const q = useQuery('transacoes?' + params, signal => api<Lista<Transacao>>('transacoes/?' + params, { signal }))
  const cats = useQuery('categorias', signal => todas<Categoria>('categorias/', signal))
  const [edicao, setEdicao] = useState<Edicao<Transacao>>()
  const opcoes = (cats.data ?? []).map(c => ({ valor: String(c.id), rotulo: c.nome }))
  const campos: Campo[] = [
    { nome: 'descricao', rotulo: 'Descrição' },
    { nome: 'tipo', rotulo: 'Tipo', tipo: 'select', obrigatorio: true,
      opcoes: [{ valor: '', rotulo: 'Selecione um tipo' }, { valor: 'receita', rotulo: 'Receita' }, { valor: 'despesa', rotulo: 'Despesa' }] },
    { nome: 'valor', rotulo: 'Valor', tipo: 'moeda', obrigatorio: true },
    { nome: 'data', rotulo: 'Data', tipo: 'data', obrigatorio: true },
    { nome: 'categoria', rotulo: 'Categoria', tipo: 'select', opcoes: [{ valor: '', rotulo: 'Sem categoria' }, ...opcoes] },
  ]
  const item = edicao?.item
  const inicial = item && { descricao: item.descricao, data: item.data, valor: item.valor,
    tipo: item.tipo, categoria: item.categoria === null ? '' : String(item.categoria) }
  const titulo = edicao?.modo === 'editar' ? 'Editar transação' : edicao?.modo === 'excluir' ? 'Excluir transação' : 'Nova transação'
  const chaveFiltros = ['tipo','categoria','data_inicio','data_fim'].map(k => params.get(k) || '').join('|')
  return <>
    <button disabled={!cats.data} className={primario + ' mb-4'} onClick={() => setEdicao({ modo: 'novo' })}>Nova transação</button>
    {cats.error && <Estado carregando={false} erro={cats.error} tentar={cats.reload}/>}
    <div className="mb-3"><Abas rotulo="Tipo de transação" valor={params.get('tipo') || ''} opcoes={[
      { valor: '', rotulo: 'Todas' }, { valor: 'receita', rotulo: 'Receitas' }, { valor: 'despesa', rotulo: 'Despesas' }]}
      mudar={tipo => {
        const novos = new URLSearchParams(params)
        if (tipo) novos.set('tipo', tipo); else novos.delete('tipo')
        novos.delete('pagina'); setParams(novos)
      }}/></div>
    <Filtros key={chaveFiltros} params={params} opcoes={opcoes} setParams={setParams}/>
    {!q.data ? <Estado carregando={q.loading} erro={q.error} tentar={q.reload} linhas={5}/> :
      <Painel><Historico itens={q.data.resultados} acoes={item => <Acoes editar={() => setEdicao({ modo: 'editar', item })} excluir={() => setEdicao({ modo: 'excluir', item })}/>}/>
        <Paginacao pagina={q.data.pagina} total={q.data.total} mudar={pagina => {
          const novos = new URLSearchParams(params)
          novos.set('pagina', String(pagina)); setParams(novos)
        }}/>
      </Painel>}
    <EdicaoRegistro edicao={edicao} titulo={titulo} campos={campos} recurso="transacoes" inicial={inicial}
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
  return <form className="mb-4 grid gap-3 rounded-xl border border-line bg-panel/95 p-4 sm:grid-cols-2 xl:grid-cols-3" onSubmit={e => {
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
    <div className="flex flex-wrap gap-2 sm:col-span-2 xl:col-span-3">
      <button className={primario}>Aplicar filtros</button>
      <button type="button" className={botao} onClick={() => { setCategoria(''); setInicio(''); setFim(''); setParams(new URLSearchParams()) }}>Limpar filtros</button>
    </div>
  </form>
}
function Paginacao({ pagina, total, mudar }: { pagina: number; total: number; mudar: (n: number) => void }) {
  const paginas = Math.ceil(total / 25)
  if (paginas <= 1) return null
  return <nav aria-label="Paginação" className="mt-4 flex flex-wrap items-center gap-3">
    <button className={botao} disabled={pagina <= 1} onClick={() => mudar(pagina - 1)}>Anterior</button>
    <span>Página {pagina} de {paginas}</span>
    <button className={botao} disabled={pagina >= paginas} onClick={() => mudar(pagina + 1)}>Próxima</button>
  </nav>
}
