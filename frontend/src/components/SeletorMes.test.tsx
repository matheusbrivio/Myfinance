// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { SeletorMes, chaveMes, mesValido, nomeMes, somarMes } from './SeletorMes'

afterEach(cleanup)

test('no mês atual o próximo mês fica desabilitado', () => {
  const mudar = vi.fn()
  render(<SeletorMes mes="2026-11" atual="2026-11" mudar={mudar}/>)
  const proximo = screen.getByRole('button', { name: 'Próximo mês' }) as HTMLButtonElement
  expect(proximo.disabled).toBe(true)
  expect(screen.getByText('novembro de 2026')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Mês anterior' }))
  expect(mudar).toHaveBeenCalledWith('2026-10')
})

test('num mês passado dá para avançar, também na virada do ano', () => {
  const mudar = vi.fn()
  render(<SeletorMes mes="2025-12" atual="2026-11" mudar={mudar}/>)
  const proximo = screen.getByRole('button', { name: 'Próximo mês' }) as HTMLButtonElement
  expect(proximo.disabled).toBe(false)
  fireEvent.click(proximo)
  expect(mudar).toHaveBeenCalledWith('2026-01')
})

test('ao voltar para o mês atual o foco vai para Mês anterior', () => {
  const mudar = vi.fn()
  render(<SeletorMes mes="2026-10" atual="2026-11" mudar={mudar}/>)
  const proximo = screen.getByRole('button', { name: 'Próximo mês' })
  proximo.focus()
  fireEvent.click(proximo)
  expect(mudar).toHaveBeenCalledWith('2026-11')
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Mês anterior' }))
})

test('mês atual no fuso de São Paulo', () => {
  // 1º de dezembro 01:00 UTC ainda é 30 de novembro em São Paulo.
  expect(chaveMes(new Date(Date.UTC(2026, 11, 1, 1)))).toBe('2026-11')
})

test('valida o mês da URL', () => {
  expect(mesValido('2026-10', '2026-11')).toBe('2026-10')
  expect(mesValido('2026-12', '2026-11')).toBe('2026-11')
  expect(mesValido('2026-13', '2026-11')).toBe('2026-11')
  expect(mesValido(null, '2026-11')).toBe('2026-11')
  for (const invalido of ['2026-1', '2026-00', '', '26-11', '2027-01']) expect(mesValido(invalido, '2026-11')).toBe('2026-11')
  expect(somarMes('2026-01', -1)).toBe('2025-12')
  expect(nomeMes('2026-03')).toBe('março de 2026')
})
