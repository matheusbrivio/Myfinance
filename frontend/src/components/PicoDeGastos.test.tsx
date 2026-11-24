// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { PicoDeGastos } from './PicoDeGastos'
import { todas } from '../services/api'
vi.mock('../services/api', async original => ({ ...(await original<typeof import('../services/api')>()), todas: vi.fn() }))
const mockTodas = vi.mocked(todas)
// jsdom não desenha canvas: o card monta só com o texto acessível.
HTMLCanvasElement.prototype.getContext = (() => null) as never
afterEach(() => { cleanup(); vi.resetAllMocks() })
test('falha da API não quebra nem cria alerta', async () => {
  mockTodas.mockRejectedValue(new Error('x'))
  render(<PicoDeGastos/>)
  await new Promise(r => setTimeout(r, 20))
  expect(screen.queryByRole('alert')).toBeNull()
})
test('renderiza com dados e resumo acessível', async () => {
  const hoje = new Date(); const d = (n: number) => { const x = new Date(hoje.getFullYear(), hoje.getMonth(), Math.max(1, hoje.getDate() - n)); return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}` }
  mockTodas.mockResolvedValue([
    { id: 1, descricao: 'Aluguel', tipo: 'despesa', valor: '750.00', data: d(0), categoria: null, categoria_nome: null, convencional: true },
  ] as never)
  render(<PicoDeGastos/>)
  expect((await screen.findByText(/Gastos em/)).textContent).toContain('750,00')
})
