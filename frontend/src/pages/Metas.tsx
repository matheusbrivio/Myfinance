import { useEffect, useState } from 'react'
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
  // ?nova=1 (vindo da paleta de comandos) abre o modal de nova meta.
  const [params, setParams] = useSearchParams()
  const [nova, setNova] = useState(false)
  // Reage à URL (também com a página já aberta): abre o modal e limpa o parâmetro.
  useEffect(() => {
    if (params.get('nova') === '1') { setNova(true); setParams({}, { replace: true }) }
  }, [params, setParams])
  return <>
    <Cabecalho titulo="Metas" subtitulo="Quanto já foi guardado para cada objetivo."><button className={primario} onClick={() => setNova(true)}><Plus size={16} aria-hidden/>Nova meta</button></Cabecalho>
    {!q.data ? <Estado carregando={q.loading} erro={q.error} tentar={q.reload} linhas={3}/> : <>
      {q.data.length ? <div className="grade">{q.data.map((meta, i) => <Entrada key={meta.id} delay={Math.min(i, 8) * 0.05}
        className="col-span-12 tab:col-span-6 bento:col-span-4"><CardMeta meta={meta}/></Entrada>)}</div> :
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
  if (!q.data) return <><Cabecalho titulo="Metas" subtitulo="Detalhe da meta">{voltar}</Cabecalho><Estado carregando={q.loading} erro={q.error} tentar={q.reload}/></>
  const { meta, historico } = q.data
  const acao = params.get('acao')
  const aporte = acao === 'aportar' && meta.pode_aportar
  const retirada = acao === 'retirar' && meta.pode_retirar
  return <>
    <Cabecalho titulo="Metas" subtitulo={'Detalhe de ' + meta.nome}>{voltar}</Cabecalho>
    <div className="grade items-start">
      <Entrada className="col-span-12 bento:col-span-5 space-y-5">
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
      <Entrada className="col-span-12 bento:col-span-7" delay={0.08}><Painel><Acordeao titulo="Histórico da meta">
        {historico.length ? <div className="overflow-x-auto"><table className="w-full text-left text-sm">
          <thead><tr>{['Movimentação','Valor','Data e hora','Saldo'].map(s => <th key={s} className={'rotulo-secao px-2 pb-3 ' + (s === 'Valor' || s === 'Saldo' ? 'text-right' : '')} scope="col">{s}</th>)}</tr></thead>
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
