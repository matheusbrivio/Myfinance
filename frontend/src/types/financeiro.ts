export interface Categoria { id: number; nome: string; descricao: string }
export interface Transacao {
  id: number; descricao: string; tipo: 'receita' | 'despesa' | 'aporte_meta' | 'retirada_meta'
  valor: string; data: string; categoria: number | null; categoria_nome: string | null; convencional: boolean
}
export interface Meta {
  id: number; nome: string; descricao: string; objetivo: string; prazo: string; criada_em: string
  arquivada_em: string | null; pode_aportar: boolean; pode_retirar: boolean
  progresso: { acumulado: string; restante: string; mensal: string | null; dias: number; status: string; percentual: string; barra: string }
}
export interface Movimento { transacao_id: number; tipo: Transacao['tipo']; valor: string; instante: string; saldo: string }
export interface Lista<T> { resultados: T[]; pagina: number; total: number }
export interface Resumo {
  saldos: { disponivel: string; reservado: string; patrimonio: string; receitas: string; despesas: string }
  recentes: Transacao[]; metas: Meta[]
}
export interface Segmento { id: string | number | null; nome: string; percentual: string; valor: string; proporcao: number }
export interface Graficos { distribuicao: Segmento[]; despesas_por_categoria: Segmento[]; retiradas: string }
