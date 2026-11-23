import { motion, useReducedMotion } from 'motion/react'
import { Link } from 'react-router'
import { dataBR, moeda } from '../services/format'
import type { Meta } from '../types/financeiro'
import { Painel, botao } from './ui'

export function CardMeta({ meta }: { meta: Meta }) {
  const reduz = useReducedMotion()
  const p = meta.progresso
  return <Painel>
    <div className="flex items-start justify-between gap-3"><h2 className="min-w-0 break-words text-lg font-semibold">{meta.nome}</h2><span className="shrink-0 text-xs text-muted">{meta.arquivada_em ? 'Arquivada' : p.status}</span></div>
    <p className="mt-3 break-all text-sm text-muted"><strong className="text-white">{moeda(p.acumulado)}</strong> de {moeda(meta.objetivo)}</p>
    <div className="my-3 h-2 overflow-hidden rounded-full bg-line" role="progressbar" aria-label={'Progresso de ' + meta.nome} aria-valuenow={Number(p.barra)} aria-valuemin={0} aria-valuemax={100}>
      <motion.div className="h-full origin-left rounded-full bg-gradient-to-r from-sky-400 to-violet-400" initial={reduz ? false : { width: 0 }} animate={{ width: p.barra + '%' }} transition={{ duration: reduz ? 0 : .3 }} />
    </div>
    <p className="text-sm"><strong>{p.percentual.replace('.', ',')}%</strong> · {p.dias} dias restantes</p>
    <p className="mt-1 text-sm text-muted">Prazo {dataBR(meta.prazo)} · Aporte mensal {p.mensal === null ? 'indisponível' : moeda(p.mensal)}</p>
    <div className="mt-4 flex flex-wrap gap-2">
      <Link className={botao} to={'/metas/' + meta.id}>Histórico</Link>
      {meta.pode_aportar && <Link className={botao} to={'/metas/' + meta.id + '?acao=aportar'}>Aportar</Link>}
      {meta.pode_retirar && <Link className={botao} to={'/metas/' + meta.id + '?acao=retirar'}>Retirar</Link>}
    </div>
  </Painel>
}
