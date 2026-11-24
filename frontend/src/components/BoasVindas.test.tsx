// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { BoasVindas } from './BoasVindas'
import { Avisos } from './ui'
import { AtualizacaoContext } from '../layouts/contexto'
import { ErroAPI, api } from '../services/api'

vi.mock('../services/api', async original => ({ ...(await original<typeof import('../services/api')>()), api: vi.fn() }))
const mock = vi.mocked(api)
afterEach(() => { cleanup(); vi.resetAllMocks() })

function montar() {
  const contexto = { versao: 0, abrirNovaTransacao: vi.fn(), recarregar: vi.fn() }
  render(<AtualizacaoContext.Provider value={contexto}><Avisos><BoasVindas/></Avisos></AtualizacaoContext.Provider>)
  return contexto
}

test('carregar dados de exemplo chama a API, avisa e recarrega', async () => {
  mock.mockResolvedValueOnce({ categorias: 6, transacoes: 24, metas: 3 })
  const contexto = montar()
  fireEvent.click(screen.getByRole('button', { name: 'Carregar dados de exemplo' }))
  expect(await screen.findByText('Dados de exemplo carregados.')).toBeTruthy()
  expect(mock).toHaveBeenCalledWith('exemplo/', { method: 'POST' })
  expect(contexto.recarregar).toHaveBeenCalledTimes(1)
})

test('recusa da API vira aviso de erro e não recarrega', async () => {
  mock.mockRejectedValueOnce(new ErroAPI('Os dados de exemplo só podem ser carregados quando ainda não há transações.', 409))
  const contexto = montar()
  fireEvent.click(screen.getByRole('button', { name: 'Carregar dados de exemplo' }))
  expect(await screen.findByText(/só podem ser carregados/)).toBeTruthy()
  expect(contexto.recarregar).not.toHaveBeenCalled()
})

test('duplo clique envia um pedido só', async () => {
  let resolver: (v: unknown) => void = () => {}
  mock.mockReturnValueOnce(new Promise(r => { resolver = r }) as never)
  montar()
  const botao = screen.getByRole('button', { name: 'Carregar dados de exemplo' })
  fireEvent.click(botao)
  fireEvent.click(screen.getByRole('button', { name: 'Carregando…' }))
  expect(mock).toHaveBeenCalledTimes(1)
  resolver({ categorias: 6, transacoes: 24, metas: 3 })
  expect(await screen.findByText('Dados de exemplo carregados.')).toBeTruthy()
})

test('começar do zero abre a nova transação', () => {
  const contexto = montar()
  fireEvent.click(screen.getByRole('button', { name: 'Começar do zero' }))
  expect(contexto.abrirNovaTransacao).toHaveBeenCalledTimes(1)
})
