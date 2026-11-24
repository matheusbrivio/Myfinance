import { moeda } from '../services/format'
import type { Graficos } from '../types/financeiro'
import { CabecalhoCard, Painel } from './ui'
import { Barra } from './Barra'

// Por categoria: barras horizontais com dados de GET /api/v1/graficos/.
export function BarrasCategoria({ dados, total }: { dados: Graficos['despesas_por_categoria']; total: string }) {
  return <Painel><CabecalhoCard titulo="Despesas por categoria"/>
    <ul aria-label="Despesas por categoria" className="grid gap-3.5">{dados.map((d, i) => <li key={String(d.id)}>
      <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-4 text-sm">
        <span className="break-words">{d.nome}</span>
        <span className="num text-soft">{moeda(d.valor)} <span className="text-muted">· {d.percentual.replace('.', ',')}%</span></span>
      </div>
      <div className="trilho trilho-medio"><Barra className="barra-categoria" largura={Math.max(2, d.proporcao * 100)} atraso={i * 0.08}/></div>
    </li>)}</ul>
    <p className="mt-5 flex items-baseline justify-between border-t border-line pt-4 text-sm text-muted">Total em despesas
      <strong className="forte text-base text-text">{moeda(total)}</strong></p>
  </Painel>
}
