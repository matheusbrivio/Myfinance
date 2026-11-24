import { expect, test } from 'vitest'
import { centavos, serieGastos } from './serieGastos'
import type { Transacao } from '../types/financeiro'

const t = (data: string, tipo: Transacao['tipo'], valor: string): Transacao => ({
  id: Math.random(), descricao: '', tipo, valor, data, categoria: null, categoria_nome: null, convencional: true,
})
const hoje = new Date(2026, 10, 24) // 24/11/2026

test('converte valores da API em centavos sem erro de arredondamento', () => {
  expect(centavos('0.10')).toBe(10)
  expect(centavos('1234.56')).toBe(123456)
  expect(centavos('-10.5')).toBe(-1050)
})

test('mês: um ponto por dia até hoje, só despesas, com pico e mês anterior', () => {
  const s = serieGastos([
    t('2026-11-10', 'despesa', '750.00'),
    t('2026-11-18', 'despesa', '286.40'),
    t('2026-11-18', 'despesa', '13.60'),
    t('2026-11-05', 'receita', '1800.00'),
    t('2026-11-15', 'aporte_meta', '200.00'),
    t('2026-10-20', 'despesa', '100.00'),
    t('2026-10-28', 'despesa', '999.00'),
  ], 'Mês', hoje)
  expect(s.dados).toHaveLength(24)
  expect(s.dados[9]).toBe(750)
  expect(s.dados[17]).toBe(300)
  expect(s.total).toBe(1050)
  expect(s.pico).toEqual({ rotulo: '10/11', valor: 750 })
  expect(s.anterior).toBe(100) // 01/10 a 24/10; o dia 28/10 fica de fora
})

test('ano: doze meses terminando no mês atual', () => {
  const s = serieGastos([t('2025-12-03', 'despesa', '50.00'), t('2025-11-30', 'despesa', '70.00')], 'Ano', hoje)
  expect(s.rotulos).toHaveLength(12)
  expect(s.dados[0]).toBe(50)
  expect(s.total).toBe(50)
  expect(s.anterior).toBe(70)
})

test('semana sem gastos não tem pico', () => {
  const s = serieGastos([t('2026-11-01', 'despesa', '10.00')], 'Semana', hoje)
  expect(s.dados).toEqual([0, 0, 0, 0, 0, 0, 0])
  expect(s.pico).toBeNull()
})
