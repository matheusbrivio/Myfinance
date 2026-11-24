import type { Resumo } from '../types/financeiro'

const parcelas = [
  { id: 'disponivel', nome: 'Saldo disponível', cor: '#2563EB' },
  { id: 'despesas', nome: 'Despesas convencionais', cor: '#E11D48' },
  { id: 'reservado', nome: 'Reservado em metas', cor: '#F59E0B' },
] as const

function centavos(valor: string) {
  return /^-?\d+\.\d{2}$/.test(valor) ? BigInt(valor.replace('.', '')) : null
}

export function distribuirDinheiro(saldos: Resumo['saldos']) {
  const segmentos = parcelas.map(parcela => ({ ...parcela, valor: saldos[parcela.id] }))
  const receitas = centavos(saldos.receitas)
  if (receitas === 0n) return { estado: 'vazio', segmentos } as const

  const valores = segmentos.map(s => centavos(s.valor))
  if (receitas === null || receitas < 0n || !valores.every(v => v !== null)) {
    return { estado: 'invalido', segmentos } as const
  }
  if (valores[0] < 0n) return { estado: 'negativo', segmentos } as const
  if (valores.some(v => v < 0n) || valores.reduce((total, v) => total + v, 0n) !== receitas) {
    return { estado: 'invalido', segmentos } as const
  }

  // Distribui os centésimos de percentual restantes pelos maiores restos.
  const partes = valores.map((valor, indice) => {
    const escalado = valor * 10_000n
    return { indice, pontos: escalado / receitas, resto: escalado % receitas }
  })
  const faltam = Number(10_000n - partes.reduce((total, parte) => total + parte.pontos, 0n))
  const porResto = [...partes].sort((a, b) => a.resto === b.resto ? a.indice - b.indice : a.resto > b.resto ? -1 : 1)
  for (const parte of porResto.slice(0, faltam)) parte.pontos += 1n

  return {
    estado: 'valido',
    segmentos: segmentos.map((segmento, i) => ({
      ...segmento,
      proporcao: Number(valores[i]) / Number(receitas),
      percentual: (Number(partes[i].pontos) / 100).toFixed(2).replace('.', ',') + '%',
    })),
  } as const
}
