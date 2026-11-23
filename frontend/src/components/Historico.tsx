import type { Transacao } from '../types/financeiro'
import { dataBR, moeda, tipos } from '../services/format'

export function Historico({ itens, acoes }: { itens: Transacao[]; acoes?: (item: Transacao) => React.ReactNode }) {
  if (!itens.length) return <p className="text-muted">Nenhuma transação encontrada.</p>
  return <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Histórico de transações">
    <table className="w-full text-left text-sm">
      <thead className="text-muted"><tr>{['Descrição', 'Tipo', 'Categoria', 'Data', 'Valor', ...(acoes ? ['Ações'] : [])].map(h => <th key={h} scope="col" className="p-2">{h}</th>)}</tr></thead>
      <tbody>{itens.map(t => <tr key={t.id} className="border-t border-line">
        <td className="min-w-28 break-words p-2">{t.descricao || 'Sem descrição'}</td>
        <td className="p-2">{tipos[t.tipo]}</td><td className="min-w-24 break-words p-2">{t.categoria_nome || 'Sem categoria'}</td>
        <td className="whitespace-nowrap p-2">{dataBR(t.data)}</td><td className={'whitespace-nowrap p-2 ' + (t.tipo === 'receita' ? 'text-good' : t.tipo === 'despesa' ? 'text-bad' : '')}>{moeda(t.valor)}</td>
        {acoes && <td className="p-2">{t.convencional && acoes(t)}</td>}
      </tr>)}</tbody>
    </table>
  </div>
}
