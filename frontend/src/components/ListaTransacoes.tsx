import { ArrowDownRight, ArrowUpRight, Target } from 'lucide-react'
import { dataBR, moeda, tipos } from '../services/format'
import type { Transacao } from '../types/financeiro'

export const icones = { receita: ArrowUpRight, despesa: ArrowDownRight, aporte_meta: Target, retirada_meta: Target } as const
export const cores = { receita: 'text-good', despesa: 'text-bad', aporte_meta: 'text-accent', retirada_meta: 'text-accent' } as const

// Lista de transações recentes: linhas de 56px com ícone num círculo tingido, descrição, categoria e data,
// e o valor alinhado à direita em mono.
export function ListaTransacoes({ itens, rotulo = 'Transações' }: { itens: Transacao[]; rotulo?: string }) {
  if (!itens.length) return <p className="text-sm text-muted">Nenhuma transação encontrada.</p>
  return <ul aria-label={rotulo} className="lista-tr">
    {itens.map(t => {
      const Icone = icones[t.tipo]
      return <li key={t.id} className="linha-tr">
        <span className={'icone-tr ' + cores[t.tipo]} title={tipos[t.tipo]}><Icone size={18} aria-hidden/><span className="sr-only">{tipos[t.tipo]}</span></span>
        <span className="min-w-0">
          <strong className="descricao-tr truncate">{t.descricao || 'Sem descrição'}</strong>
          <span className="meta-tr truncate">{t.categoria_nome || 'Sem categoria'} · {dataBR(t.data)}</span>
        </span>
        <span className={'num valor-tr ' + (t.tipo === 'receita' ? 'text-good' : t.tipo === 'despesa' ? 'text-bad' : 'text-soft')}>{moeda(t.valor)}</span>
      </li>
    })}
  </ul>
}
