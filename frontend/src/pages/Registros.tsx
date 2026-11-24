import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router'
import { Download, Pencil, Plus, Trash2 } from 'lucide-react'
import { urlExportar } from '../components/PaletaComandos'
import { Formulario, Calendario, type Campo } from '../components/Formulario'
import { Abas } from '../components/Abas'
import { Entrada } from '../components/Entrada'
import { cores, icones } from '../components/ListaTransacoes'
import { Cabecalho, Dialogo, Estado, Painel, botaoTexto, campo, icone, primario } from '../components/ui'
import { useQuery } from '../hooks/useQuery'
import { useUltimo } from '../hooks/useUltimo'
import { useAtualizacao } from '../layouts/contexto'
import { camposTransacao } from '../services/camposTransacao'
import { api, todas } from '../services/api'
import { dataBR, dataISO, moeda, somar, tipos } from '../services/format'
import type { Categoria, Lista, Transacao } from '../types/financeiro'

type Edicao<T> = { modo: 'novo' | 'editar' | 'excluir'; item?: T }
const nomes = [{ nome: 'nome', rotulo: 'Nome', obrigatorio: true }, { nome: 'descricao', rotulo: 'Descrição', tipo: 'area' }] satisfies Campo[]

export function Categorias() {
  const q = useQuery('categorias', signal => todas<Categoria>('categorias/', signal))
  // ?nova=1 (vindo da paleta de comandos) abre o modal de nova categoria.
  const [params, setParams] = useSearchParams()
  const [edicao, setEdicao] = useState<Edicao<Categoria>>()
  // Reage à URL (também com a página já aberta): abre o modal e limpa o parâmetro.
  useEffect(() => {
    if (params.get('nova') === '1') { setEdicao({ modo: 'novo' }); setParams({}, { replace: true }) }
  }, [params, setParams])
  const titulo = edicao?.modo === 'editar' ? 'Editar categoria' : edicao?.modo === 'excluir' ? 'Excluir categoria' : 'Nova categoria'
  return <>
    <Cabecalho titulo="Categorias" subtitulo="Agrupe as transações pelo tipo de gasto ou de receita.">
      <button className={primario} onClick={() => setEdicao({ modo: 'novo' })}><Plus size={16} aria-hidden/>Nova categoria</button>
    </Cabecalho>
    {!q.data ? <Estado carregando={q.loading} erro={q.error} tentar={q.reload} linhas={4}/> :
      q.data.length ? <div className="grade">{q.data.map((item, i) => <Entrada key={item.id} delay={Math.min(i, 8) * 0.04}
        className="col-span-12 tab:col-span-6 bento:col-span-4"><Painel className="flex h-full flex-col p-5">
        <h2 className="titulo-card break-words">{item.nome}</h2>
        <p className="mt-1 mb-4 line-clamp-2 flex-1 break-words text-sm text-soft">{item.descricao || <span className="text-muted">Sem descrição</span>}</p>
        <div className="-mx-2 -mb-2 border-t border-line pt-2"><Acoes nome={item.nome} editar={() => setEdicao({ modo: 'editar', item })} excluir={() => setEdicao({ modo: 'excluir', item })}/></div>
      </Painel></Entrada>)}</div> : <Painel><p className="text-muted">Nenhuma categoria cadastrada.</p></Painel>}
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
      verbo={verbo} endpoint={recurso + '/' + (atual.item ? atual.item.id + '/' : '')}
      sucesso={method === 'DELETE' ? 'Operação concluída.' : 'Registro salvo.'} concluir={() => { fechar(); recarregar() }}/>
  </Dialogo>
}

const abas = [{ valor: '', rotulo: 'Todas' }, { valor: 'receita', rotulo: 'Receitas' }, { valor: 'despesa', rotulo: 'Despesas' }]
const colunas = ['Descrição', 'Categoria', 'Data', 'Valor', 'Ações']
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
  const itens = lista?.resultados ?? []
  const varias = (lista?.total ?? 0) > itens.length
  // Aplica um conjunto de filtros mantendo os outros parâmetros; volta para a página 1.
  const aplicar = (mudancas: Record<string, string>) => {
    const novos = new URLSearchParams(params)
    for (const [k, v] of Object.entries(mudancas)) if (v) novos.set(k, v); else novos.delete(k)
    novos.delete('pagina'); setParams(novos)
  }
  return <>
    <Cabecalho titulo="Transações" subtitulo="Tudo o que entrou e saiu, com filtros por tipo, categoria e período."/>
    {cats.error && <Estado carregando={false} erro={cats.error} tentar={cats.reload}/>}
    <Entrada className="relative z-10"><Filtros params={params} opcoes={opcoes} aplicar={aplicar} limpar={() => setParams(new URLSearchParams())}/></Entrada>
    <Entrada delay={0.05}><p className="resumo-linha">
      <span><strong className="forte">{lista?.total ?? '—'}</strong> {lista?.total === 1 ? 'transação' : 'transações'}</span>
      <span aria-hidden>·</span>
      <span>{varias ? 'Entrou nesta página' : 'Entrou'} <strong className="num text-good">{moeda(somar(itens.filter(t => t.tipo === 'receita').map(t => t.valor)))}</strong></span>
      <span aria-hidden>·</span>
      <span>{varias ? 'Saiu nesta página' : 'Saiu'} <strong className="num text-bad">{moeda(somar(itens.filter(t => t.tipo === 'despesa').map(t => t.valor)))}</strong></span>
    </p></Entrada>
    {q.error && lista && <Estado carregando={false} erro={q.error} tentar={q.reload}/>}
    {!lista ? <Estado carregando={q.loading} erro={q.error} tentar={q.reload} linhas={5}/> :
      <Entrada delay={0.1}><div className="glass overflow-hidden rounded-[24px]">
        {lista.resultados.length ? <div className="tabela-rolagem" tabIndex={0} role="region" aria-label="Lista de transações">
          <table className="tabela-tr">
            <thead><tr>{colunas.map(c => <th key={c} scope="col" className={c === 'Valor' ? 'text-right' : c === 'Ações' ? 'w-24' : ''}>
              {c === 'Ações' ? <span className="sr-only">Ações</span> : c}</th>)}</tr></thead>
            <tbody>{lista.resultados.map(t => {
              const Icone = icones[t.tipo]
              return <tr key={t.id}>
                <td><span className="flex min-w-40 items-center gap-3">
                  <span className={'icone-tr size-8 shrink-0 ' + cores[t.tipo]} title={tipos[t.tipo]}><Icone size={16} aria-hidden/><span className="sr-only">{tipos[t.tipo]}</span></span>
                  <span className="break-words font-medium">{t.descricao || 'Sem descrição'}</span></span></td>
                <td className="min-w-28 break-words text-soft">{t.categoria_nome || 'Sem categoria'}</td>
                <td className="num whitespace-nowrap text-soft">{dataBR(t.data)}</td>
                <td className={'num whitespace-nowrap text-right ' + (t.tipo === 'receita' ? 'text-good' : t.tipo === 'despesa' ? 'text-bad' : 'text-soft')}>{moeda(t.valor)}</td>
                <td><span className="acoes-linha">{t.convencional && <Acoes nome={t.descricao || 'transação de ' + moeda(t.valor)}
                  editar={() => setEdicao({ modo: 'editar', item: t })} excluir={() => setEdicao({ modo: 'excluir', item: t })}/>}</span></td>
              </tr>
            })}</tbody>
          </table>
        </div> : <p className="p-6 text-sm text-muted">Nenhuma transação encontrada.</p>}
        <Paginacao pagina={lista.pagina} total={lista.total} mudar={pagina => {
          const novos = new URLSearchParams(params)
          novos.set('pagina', String(pagina)); setParams(novos)
        }}/>
      </div></Entrada>}
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

function filtrosExportacao(params: URLSearchParams) {
  const filtros = new URLSearchParams(params)
  filtros.delete('pagina')
  return filtros.toString()
}
const dataCompleta = (v: string) => v === '' || /^\d{2}\/\d{2}\/\d{4}$/.test(v)
// Barra de ferramentas única: abas à esquerda; categoria, datas e "Limpar" à direita.
// Os filtros se aplicam ao mudar (datas, quando completas). "Aplicar" continua, pequeno, para quem
// digitou uma data e quer confirmar.
function Filtros({ params, opcoes, aplicar, limpar }: {
  params: URLSearchParams; opcoes: { valor: string; rotulo: string }[]
  aplicar: (mudancas: Record<string, string>) => void; limpar: () => void
}) {
  const [inicio, setInicio] = useState(params.get('data_inicio') ? dataBR(params.get('data_inicio')!) : '')
  const [fim, setFim] = useState(params.get('data_fim') ? dataBR(params.get('data_fim')!) : '')
  const mudarData = (chave: 'data_inicio' | 'data_fim', definir: (v: string) => void) => (v: string) => {
    definir(v)
    if (dataCompleta(v)) aplicar({ [chave]: dataISO(v) })
  }
  return <form aria-label="Filtros" className="glass barra-filtros" onSubmit={e => {
    e.preventDefault()
    aplicar({ data_inicio: dataISO(inicio), data_fim: dataISO(fim) })
  }}>
    <Abas id="abas-tipo" rotulo="Tipo de transação" valor={params.get('tipo') || ''} opcoes={abas} mudar={tipo => aplicar({ tipo })}/>
    <div className="filtros-direita">
      <label className="sr-only" htmlFor="filtro-categoria">Categoria</label>
      <select id="filtro-categoria" className={campo.replace('w-full', 'w-52') + ' h-10 text-sm'} value={params.get('categoria') || ''} onChange={e => aplicar({ categoria: e.target.value })}>
        <option value="">Todas as categorias</option><option value="sem_categoria">Sem categoria</option>
        {opcoes.map(o => <option key={o.valor} value={o.valor}>{o.rotulo}</option>)}
      </select>
      <label className="sr-only" htmlFor="inicio">Data inicial</label>
      <div className="w-44"><Calendario id="inicio" valor={inicio} mudar={mudarData('data_inicio', setInicio)} compacto/></div>
      <label className="sr-only" htmlFor="fim">Data final</label>
      <div className="w-44"><Calendario id="fim" valor={fim} mudar={mudarData('data_fim', setFim)} compacto/></div>
      <button className={botaoTexto + ' h-8 border border-line px-2.5 text-xs'} aria-label="Aplicar filtros">Aplicar</button>
      <button type="button" className={botaoTexto} aria-label="Limpar filtros" onClick={() => { setInicio(''); setFim(''); limpar() }}>Limpar</button>
      {/* Mesmos filtros da lista (menos a página). */}
      <a className={botaoTexto} href={urlExportar(filtrosExportacao(params))} download><Download size={16} aria-hidden/>Exportar CSV</a>
    </div>
  </form>
}
function Paginacao({ pagina, total, mudar }: { pagina: number; total: number; mudar: (n: number) => void }) {
  const paginas = Math.ceil(total / 25)
  if (paginas <= 1) return null
  return <nav aria-label="Paginação" className="flex flex-wrap items-center justify-end gap-2 border-t border-line px-4 py-3">
    <button className={botaoTexto} disabled={pagina <= 1} onClick={() => mudar(pagina - 1)}>Anterior</button>
    <span className="num text-sm text-soft">Página {pagina} de {paginas}</span>
    <button className={botaoTexto} disabled={pagina >= paginas} onClick={() => mudar(pagina + 1)}>Próxima</button>
  </nav>
}
