import { useReduzMovimento } from '../hooks/useReduzMovimento'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { dataBR, moeda } from '../services/format'
import type { Meta } from '../types/financeiro'
import { Painel, botao, primario } from './ui'
import { AnelProgresso } from './AnelProgresso'
import { Confete } from './Efeitos'

export function CardMeta({ meta, acoes = true }: { meta: Meta; acoes?: boolean }) {
  const reduz = useReduzMovimento()
  const p = meta.progresso
  const concluida = Number(p.percentual) >= 100
  const [confete, setConfete] = useState(false)
  useEffect(() => {
    const chave = 'mf-pct-' + meta.id
    const atual = Number(p.percentual)
    let antes: number | null = null
    try { const v = sessionStorage.getItem(chave); antes = v === null ? null : Number(v); sessionStorage.setItem(chave, String(atual)) } catch { /* sem storage */ }
    if (reduz || antes === null || antes >= 100 || atual < 100) return
    setConfete(true)
    const t = window.setTimeout(() => setConfete(false), 1200)
    return () => window.clearTimeout(t)
  }, [meta.id, p.percentual, reduz])
  return <Painel className={'relative flex h-full flex-col' + (concluida ? ' meta-concluida' : '')}>
    <div className="flex items-start justify-between gap-3">
      <h2 className="titulo-card min-w-0 break-words">{meta.nome}</h2>
      <span className={'chip shrink-0' + (concluida ? ' chip-ambar' : '')}>{meta.arquivada_em ? 'Arquivada' : p.status}</span>
    </div>
    <div className="mt-5 flex flex-wrap items-center gap-6">
      <div className="relative">
        <AnelProgresso valor={Number(p.barra)} texto={p.percentual.replace('.', ',') + '%'} rotulo={'Progresso de ' + meta.nome}/>
        {confete && <Confete/>}
      </div>
      <dl className="dados-meta min-w-0 flex-1">
        <div><dt>Acumulado</dt><dd className="break-all"><strong className="num text-lg font-medium text-accent">{moeda(p.acumulado)}</strong> <span className="text-muted">de</span> <span className="num">{moeda(meta.objetivo)}</span></dd></div>
        <div><dt>Prazo</dt><dd><span className="num">{dataBR(meta.prazo)}</span> <span className="text-muted">· {p.dias} dias restantes</span></dd></div>
        <div><dt>Aporte mensal</dt><dd className="num">{p.mensal === null ? 'indisponível' : moeda(p.mensal)}</dd></div>
      </dl>
    </div>
    {acoes && <div className="mt-6 flex flex-wrap gap-2 pt-1">
      {meta.pode_aportar && <Link className={primario} to={'/metas/' + meta.id + '?acao=aportar'}>Aportar</Link>}
      {meta.pode_retirar && <Link className={botao} to={'/metas/' + meta.id + '?acao=retirar'}>Retirar</Link>}
      <Link className={botao + ' border-transparent'} to={'/metas/' + meta.id}>Histórico</Link>
    </div>}
  </Painel>
}
