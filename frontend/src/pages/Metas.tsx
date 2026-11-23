import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { CardMeta } from '../components/CardMeta'
import { Formulario, type Campo } from '../components/Formulario'
import { Dialogo, Estado, Painel, botao, primario } from '../components/ui'
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
    <button className={primario + ' mb-4'} onClick={() => setNova(true)}>Nova meta</button>
    {!q.data ? <Estado carregando={q.loading} erro={q.error} tentar={q.reload}/> : <>
      {q.data.length ? <div className="grid gap-3 lg:grid-cols-2">{q.data.map(meta => <CardMeta key={meta.id} meta={meta}/>)}</div> :
        <p className="text-muted">Nenhuma meta cadastrada.</p>}
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
  if (!q.data) return <Estado carregando={q.loading} erro={q.error} tentar={q.reload}/>
  const { meta, historico } = q.data
  const acao = params.get('acao')
  const aporte = acao === 'aportar' && meta.pode_aportar
  const retirada = acao === 'retirar' && meta.pode_retirar
  return <div className="space-y-4">
    <Link to="/metas" className={botao}>Voltar para metas</Link>
    <CardMeta meta={meta}/>
    {meta.descricao && <p className="break-words">{meta.descricao}</p>}
    <p className="text-muted">Criada em {instanteBR.format(new Date(meta.criada_em))} · Restante {moeda(meta.progresso.restante)}</p>
    {!meta.arquivada_em && <div className="flex gap-2">
      <button className={botao} onClick={() => setEdicao('editar')}>Editar meta</button>
      <button className={botao + ' text-bad'} onClick={() => setEdicao('excluir')}>{historico.length ? 'Encerrar meta' : 'Excluir meta'}</button>
    </div>}
    <Painel><h2 className="mb-3 text-lg font-semibold">Histórico da meta</h2>
      {historico.length ? <div className="overflow-x-auto"><table className="w-full text-left text-sm">
        <thead><tr>{['Movimentação','Valor','Data e hora','Saldo'].map(s => <th key={s} className="p-2" scope="col">{s}</th>)}</tr></thead>
        <tbody>{historico.map(m => <tr key={m.transacao_id} className="border-t border-line"><td className="p-2">{tipos[m.tipo]}</td>
          <td className="p-2">{moeda(m.valor)}</td><td className="p-2">{instanteBR.format(new Date(m.instante))}</td><td className="p-2">{moeda(m.saldo)}</td></tr>)}</tbody>
      </table></div> : <p className="text-muted">Nenhuma movimentação registrada.</p>}
    </Painel>
    <EdicaoRegistro edicao={edicao ? { modo: edicao, item: meta } : undefined}
      titulo={edicao === 'editar' ? 'Editar meta' : historico.length ? 'Encerrar meta' : 'Excluir meta'}
      campos={campos} inicial={{nome:meta.nome, descricao:meta.descricao, objetivo:meta.objetivo, prazo:meta.prazo}}
      recurso="metas" fechar={() => setEdicao(undefined)} recarregar={() => edicao === 'excluir' ? navigate('/metas') : q.reload()}/>
    {(aporte || retirada) && <Dialogo titulo={aporte ? 'Fazer aporte' : 'Fazer retirada'} aberto onOpenChange={open => {if (!open) setParams({})}}>
      <Formulario key={acao} campos={[{nome:'valor', rotulo:'Valor', tipo:'moeda', obrigatorio:true}]}
        endpoint={endpoint + (aporte ? 'aportes/' : 'retiradas/')} sucesso="Movimentação registrada."
        concluir={() => { setParams({}); q.reload() }}/>
    </Dialogo>}
  </div>
}
