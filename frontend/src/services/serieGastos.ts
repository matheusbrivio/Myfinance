import type { Transacao } from '../types/financeiro'

export type Periodo = 'Semana' | 'Mês' | 'Ano'
export const PERIODOS: Periodo[] = ['Semana', 'Mês', 'Ano']

export interface SerieGastos {
  /** Gasto de cada ponto, em reais (um ponto por dia na semana e no mês, por mês no ano). */
  dados: number[]
  rotulos: string[]
  /** Total gasto no período, em reais. */
  total: number
  /** Total gasto no período anterior equivalente, em reais. */
  anterior: number
  /** Ponto de maior gasto, ou null quando não houve gasto. */
  pico: { rotulo: string; valor: number } | null
  /** Descrição curta do período, ex.: "Últimos 7 dias". */
  descricao: string
}

type Faixa = { inicio: string; fim: string; rotulo: string }

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const dia = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
const ddmm = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
const semana = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' })
const mesCurto = new Intl.DateTimeFormat('pt-BR', { month: 'short' })
const mesLongo = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })
const semPonto = (s: string) => s.replace('.', '')

/** Valor da API ("1234.56", "-10.00") em centavos inteiros, sem erro de ponto flutuante. */
export function centavos(valor: string) {
  const negativo = valor.startsWith('-')
  const [inteiro, fracao = ''] = valor.replace(/^[-+]/, '').split('.')
  const c = Number(inteiro) * 100 + Number((fracao + '00').slice(0, 2))
  return negativo ? -c : c
}

function faixas(periodo: Periodo, hoje: Date): { atuais: Faixa[]; anterior: [string, string]; descricao: string } {
  if (periodo === 'Semana') {
    const atuais = Array.from({ length: 7 }, (_, i) => {
      const d = dia(hoje, i - 6)
      return { inicio: iso(d), fim: iso(d), rotulo: `${semPonto(semana.format(d))} ${ddmm(d)}` }
    })
    return { atuais, anterior: [iso(dia(hoje, -13)), iso(dia(hoje, -7))], descricao: 'Últimos 7 dias' }
  }
  if (periodo === 'Mês') {
    const atuais = Array.from({ length: hoje.getDate() }, (_, i) => {
      const d = new Date(hoje.getFullYear(), hoje.getMonth(), i + 1)
      return { inicio: iso(d), fim: iso(d), rotulo: ddmm(d) }
    })
    // Mesmo trecho do mês anterior (do dia 1 até o mesmo dia, ou até o fim dele).
    const ultimoAnterior = new Date(hoje.getFullYear(), hoje.getMonth(), 0).getDate()
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)
    const fim = new Date(hoje.getFullYear(), hoje.getMonth() - 1, Math.min(hoje.getDate(), ultimoAnterior))
    const nome = mesLongo.format(hoje)
    return { atuais, anterior: [iso(inicio), iso(fim)], descricao: nome[0].toUpperCase() + nome.slice(1) }
  }
  const atuais = Array.from({ length: 12 }, (_, i) => {
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 11 + i, 1)
    const fim = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 0)
    return { inicio: iso(inicio), fim: iso(fim), rotulo: `${semPonto(mesCurto.format(inicio))}/${String(inicio.getFullYear()).slice(2)}` }
  })
  const anterior: [string, string] = [
    iso(new Date(hoje.getFullYear(), hoje.getMonth() - 23, 1)),
    iso(new Date(hoje.getFullYear(), hoje.getMonth() - 11, 0)),
  ]
  return { atuais, anterior, descricao: 'Últimos 12 meses' }
}

/** Soma as despesas convencionais por dia ou por mês. Aportes e retiradas de metas não entram. */
export function serieGastos(transacoes: Transacao[], periodo: Periodo, hoje = new Date()): SerieGastos {
  const { atuais, anterior, descricao } = faixas(periodo, hoje)
  const somas = atuais.map(() => 0)
  let somaAnterior = 0
  for (const t of transacoes) {
    if (t.tipo !== 'despesa') continue
    const valor = centavos(t.valor)
    if (t.data >= anterior[0] && t.data <= anterior[1]) somaAnterior += valor
    const i = atuais.findIndex(f => t.data >= f.inicio && t.data <= f.fim)
    if (i >= 0) somas[i] += valor
  }
  const total = somas.reduce((a, b) => a + b, 0)
  let pico: SerieGastos['pico'] = null
  somas.forEach((v, i) => {
    if (v > 0 && (!pico || v / 100 > pico.valor)) pico = { rotulo: atuais[i].rotulo, valor: v / 100 }
  })
  return {
    dados: somas.map(v => v / 100),
    rotulos: atuais.map(f => f.rotulo),
    total: total / 100,
    anterior: somaAnterior / 100,
    pico,
    descricao,
  }
}
