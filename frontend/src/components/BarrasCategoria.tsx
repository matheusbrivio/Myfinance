import { moeda } from '../services/format'
import type { Graficos } from '../types/financeiro'
import { Painel, Secao } from './ui'
import { Barra } from './Barra'

// 02 — Despesas por categoria: barras horizontais com dados de GET /api/v1/graficos/.
export function BarrasCategoria({ dados, total }: { dados: Graficos['despesas_por_categoria']; total: string }) {
  return <Painel><Secao n="02" rotulo="Despesas por categoria" titulo="Despesas por categoria"/>
    <ul aria-label="Despesas por categoria" className="grid gap-4">{dados.map((d, i) => <li key={String(d.id)}>
      <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-4 text-sm">
        <span className="break-words text-soft">{d.nome}</span>
        <span className="num text-bad">{moeda(d.valor)} <span className="text-muted">· {d.percentual.replace('.', ',')}%</span></span>
      </div>
      <div className="trilho"><Barra className="barra-categoria" largura={Math.max(2, d.proporcao * 100)} atraso={i * 0.08}/></div>
    </li>)}</ul>
    <p className="mt-6 flex items-baseline justify-between border-t border-line pt-4 text-sm text-muted">Total em despesas
      <strong className="serif text-2xl font-normal text-text">{moeda(total)}</strong></p>
  </Painel>
}
