import { useReduzMovimento } from '../hooks/useReduzMovimento'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { dataBR, moeda } from '../services/format'
import type { Meta } from '../types/financeiro'
import { Painel, botao } from './ui'
import { Confete } from './Efeitos'
import { PercentualPop } from './Numero'

export function CardMeta({ meta }: { meta: Meta }) {
  const reduz = useReduzMovimento()
  const p = meta.progresso
  const [confete, setConfete] = useState(false)
  useEffect(() => {
    const chave = 'mf-pct-' + meta.id
    const atual = Number(p.percentual)
    let antes: number | null = null
    try { const v = sessionStorage.getItem(chave); antes = v === null ? null : Number(v); sessionStorage.setItem(chave, String(atual)) } catch { /* sem storage */ }
    if (reduz || antes === null || antes >= 100 || atual < 100) return
    setConfete(true)
    const t = window.setTimeout(() => setConfete(false), 1000)
    return () => window.clearTimeout(t)
  }, [meta.id, p.percentual, reduz])
  return <Painel className="relative">
    <div className="flex items-start justify-between gap-3"><h2 className="min-w-0 break-words text-lg font-semibold">{meta.nome}</h2><span className="shrink-0 text-xs text-muted">{meta.arquivada_em ? 'Arquivada' : p.status}</span></div>
    <p className="mt-3 break-all text-sm text-muted"><strong className="num text-white">{moeda(p.acumulado)}</strong> de {moeda(meta.objetivo)}</p>
    <div className="my-3 h-2 overflow-hidden rounded-full bg-line" role="progressbar" aria-label={'Progresso de ' + meta.nome} aria-valuenow={Number(p.barra)} aria-valuemin={0} aria-valuemax={100}>
      <div className="barra-meta h-full rounded-full bg-gradient-to-r from-sky-400 to-violet-400" style={{ width: p.barra + '%' }}/>
    </div>
    <p className="relative text-sm"><PercentualPop texto={p.percentual.replace('.', ',') + '%'}/> · {p.dias} dias restantes{confete && <Confete/>}</p>
    <p className="mt-1 text-sm text-muted">Prazo {dataBR(meta.prazo)} · Aporte mensal {p.mensal === null ? 'indisponível' : moeda(p.mensal)}</p>
    <div className="mt-4 flex flex-wrap gap-2">
      <Link className={botao} to={'/metas/' + meta.id}>Histórico</Link>
      {meta.pode_aportar && <Link className={botao} to={'/metas/' + meta.id + '?acao=aportar'}>Aportar</Link>}
      {meta.pode_retirar && <Link className={botao} to={'/metas/' + meta.id + '?acao=retirar'}>Retirar</Link>}
    </div>
  </Painel>
}
