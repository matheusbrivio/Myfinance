import { ArrowDownRight, ArrowUpRight, Target } from 'lucide-react'
import type { ReactNode } from 'react'
import { dataBR, moeda, tipos } from '../services/format'
import type { Transacao } from '../types/financeiro'

const icones = { receita: ArrowUpRight, despesa: ArrowDownRight, aporte_meta: Target, retirada_meta: Target } as const
const cores = { receita: 'text-good', despesa: 'text-bad', aporte_meta: 'text-accent', retirada_meta: 'text-accent' } as const

// Lista de transações: ícone redondo (↗ receita, ↘ despesa, ◎ meta), descrição, categoria, data e valor.
export function ListaTransacoes({ itens, acoes, rotulo = 'Transações' }: {
  itens: Transacao[]; acoes?: (item: Transacao) => ReactNode; rotulo?: string
}) {
  if (!itens.length) return <p className="text-muted">Nenhuma transação encontrada.</p>
  return <ul aria-label={rotulo} className="lista-tr">
    {itens.map(t => {
      const Icone = icones[t.tipo]
      return <li key={t.id} className="linha-tr">
        <span className={'icone-tr ' + cores[t.tipo]} title={tipos[t.tipo]}><Icone size={18} aria-hidden/><span className="sr-only">{tipos[t.tipo]}</span></span>
        <span className="min-w-0">
          <strong className="descricao-tr break-words">{t.descricao || 'Sem descrição'}</strong>
          <span className="meta-tr"><span className="break-words">{t.categoria_nome || 'Sem categoria'}</span> · <span className="num">{dataBR(t.data)}</span></span>
        </span>
        <span className={'num valor-tr ' + (t.tipo === 'receita' ? 'text-good' : t.tipo === 'despesa' ? 'text-bad' : 'text-soft')}>{moeda(t.valor)}</span>
        {acoes && t.convencional && <span className="acoes-tr">{acoes(t)}</span>}
      </li>
    })}
  </ul>
}
