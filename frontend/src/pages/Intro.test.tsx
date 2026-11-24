// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, expect, test } from 'vitest'
import Intro from './Intro'

afterEach(cleanup)

test('intro lista os três integrantes para leitor de tela e tem o botão de segurar', () => {
  render(<MemoryRouter><Intro/></MemoryRouter>)
  const lista = screen.getByRole('list', { name: 'Integrantes' })
  expect(within(lista).getAllByRole('listitem').map(li => li.textContent)).toEqual([
    'Matheus Brivio', 'Eduardo Rafael da Silva Suarez', 'Murillo Muller',
  ])
  expect(screen.getByRole('heading', { name: 'MyFinance' })).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Segure para entrar no MyFinance' })).toBeTruthy()
})
