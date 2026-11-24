import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { ArrowLeft, Plus } from 'lucide-react'
import { CardMeta } from '../components/CardMeta'
import { Formulario, type Campo } from '../components/Formulario'
import { Acordeao } from '../components/Efeitos'
import { Entrada } from '../components/Entrada'
import { Cabecalho, Dialogo, Estado, Painel, botao, primario } from '../components/ui'
import { useQuery } from '../hooks/useQuery'
import { api, todas } from '../services/api'
import { instanteBR, moeda, tipos } from '../services/format'
import type { Meta, Movimento } from '../types/financeiro'
import { EdicaoRegistro } from './Registros'

const campos: Campo[] = [
  { nome: 'nome', rotulo: 'Nome', obrigatorio: true }, { nome: 'descricao', rotulo: 'Descrição', tipo: 'area' },
  { nome: 'objetivo', rotulo: 'Valor objetivo', tipo: 'moeda', obrigatorio: true },
  { nome: 'prazo', rotulo: 'Data limite', tipo: 'data', obrigatorio: true },
]
export function Metas() {
  const q = useQuery('metas', signal => todas<Meta>('metas/', signal))
  const [nova, setNova] = useState(false)
  return <>
    <Cabecalho titulo="Metas"><button className={primario} onClick={() => setNova(true)}>Nova meta <Plus size={16} aria-hidden/></button></Cabecalho>
    {!q.data ? <Estado carregando={q.loading} erro={q.error} tentar={q.reload} linhas={3}/> : <>
      {q.data.length ? <Entrada agrupar className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(min(100%,420px),1fr))]">{q.data.map(meta => <CardMeta key={meta.id} meta={meta}/>)}</Entrada> :
        <Painel><p className="text-muted">Nenhuma meta cadastrada.</p></Painel>}
    </>}
    <EdicaoRegistro<Meta> edicao={nova ? { modo: 'novo' } : undefined} titulo="Nova meta" campos={[...campos, { nome: 'inicial', rotulo: 'Aporte inicial', tipo: 'moeda' }]}
      recurso="metas" fechar={() => setNova(false)} recarregar={q.reload}/>
  </>
}
export function DetalheMeta() {
  const { id } = useParams()
  const [params, setParams] = useSearchParams()
  const [edicao, setEdicao] = useState<'editar' | 'excluir'>()
  const navigate = useNavigate()
  const endpoint = 'metas/' + id + '/'
  const q = useQuery(endpoint, async signal => {
    const [meta, historico] = await Promise.all([
      api<Meta>(endpoint, {signal}), api<{resultados: Movimento[]}>(endpoint+'historico/', {signal}),
    ])
    return { meta, historico: historico.resultados }
  })
  const voltar = <Link to="/metas" className={botao + ' border-transparent'}><ArrowLeft size={16} aria-hidden/>Voltar para metas</Link>
  if (!q.data) return <><Cabecalho titulo="Metas">{voltar}</Cabecalho><Estado carregando={q.loading} erro={q.error} tentar={q.reload}/></>
  const { meta, historico } = q.data
  const acao = params.get('acao')
  const aporte = acao === 'aportar' && meta.pode_aportar
  const retirada = acao === 'retirar' && meta.pode_retirar
  return <>
    <Cabecalho titulo="Metas">{voltar}</Cabecalho>
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <Entrada className="space-y-4">
        <CardMeta meta={meta}/>
        <Painel>
          {meta.descricao && <p className="mb-3 break-words text-soft">{meta.descricao}</p>}
          <p className="text-sm text-muted">Criada em <span className="num">{instanteBR.format(new Date(meta.criada_em))}</span> · Restante <span className="num">{moeda(meta.progresso.restante)}</span></p>
          {!meta.arquivada_em && <div className="mt-4 flex flex-wrap gap-2">
            <button className={botao} onClick={() => setEdicao('editar')}>Editar meta</button>
            <button className={botao + ' text-bad'} onClick={() => setEdicao('excluir')}>{historico.length ? 'Encerrar meta' : 'Excluir meta'}</button>
          </div>}
        </Painel>
      </Entrada>
      <Entrada delay={0.08}><Painel><Acordeao titulo="Histórico da meta">
        {historico.length ? <div className="overflow-x-auto"><table className="w-full text-left text-sm">
          <thead><tr>{['Movimentação','Valor','Data e hora','Saldo'].map(s => <th key={s} className={'rotulo-secao px-2 pb-3 font-normal ' + (s === 'Valor' || s === 'Saldo' ? 'text-right' : '')} scope="col">{s}</th>)}</tr></thead>
          <tbody>{historico.map(m => <tr key={m.transacao_id} className="border-t border-line"><td className="p-2">{tipos[m.tipo]}</td>
            <td className="num p-2 text-right">{moeda(m.valor)}</td><td className="num p-2">{instanteBR.format(new Date(m.instante))}</td><td className="num p-2 text-right">{moeda(m.saldo)}</td></tr>)}</tbody>
        </table></div> : <p className="text-muted">Nenhuma movimentação registrada.</p>}
      </Acordeao></Painel></Entrada>
    </div>
    <EdicaoRegistro edicao={edicao ? { modo: edicao, item: meta } : undefined}
      titulo={edicao === 'editar' ? 'Editar meta' : historico.length ? 'Encerrar meta' : 'Excluir meta'}
      campos={campos} inicial={{nome:meta.nome, descricao:meta.descricao, objetivo:meta.objetivo, prazo:meta.prazo}}
      recurso="metas" verbo={historico.length ? 'encerrar' : 'excluir'}
      fechar={() => setEdicao(undefined)} recarregar={() => edicao === 'excluir' ? navigate('/metas') : q.reload()}/>
    {(aporte || retirada) && <Dialogo titulo={aporte ? 'Fazer aporte' : 'Fazer retirada'} aberto onOpenChange={open => {if (!open) setParams({})}}>
      <Formulario key={acao} campos={[{nome:'valor', rotulo:'Valor', tipo:'moeda', obrigatorio:true}]} cancelar={() => setParams({})}
        endpoint={endpoint + (aporte ? 'aportes/' : 'retiradas/')} sucesso="Movimentação registrada."
        concluir={() => { setParams({}); q.reload() }}/>
    </Dialogo>}
  </>
}
