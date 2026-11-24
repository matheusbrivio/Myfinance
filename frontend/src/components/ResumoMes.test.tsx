// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { ResumoMes } from './ResumoMes'

afterEach(cleanup)

test('lista as frases na ordem recebida, com o tom de cada uma', () => {
  render(<ResumoMes itens={[
    { tipo: 'variacao_categoria', tom: 'alerta', texto: 'Você gastou 23% a mais com Alimentação do que em outubro.' },
    { tipo: 'economia', tom: 'positivo', texto: 'Você guardou 18% do que recebeu em novembro.' },
  ]}/>)
  expect(screen.getByRole('heading', { name: 'Resumo do mês' })).toBeTruthy()
  const itens = within(screen.getByRole('list', { name: 'Resumo do mês' })).getAllByRole('listitem')
  expect(itens.map(i => i.textContent)).toEqual([
    'Atenção:Você gastou 23% a mais com Alimentação do que em outubro.',
    'Positivo:Você guardou 18% do que recebeu em novembro.',
  ])
  expect(itens[0].querySelector('.insight-alerta')).toBeTruthy()
  expect(itens[1].querySelector('.insight-positivo')).toBeTruthy()
  // O tom também chega ao leitor de tela, não só pela cor.
  expect(screen.getByText('Atenção:')).toBeTruthy()
  expect(screen.getByText('Positivo:')).toBeTruthy()
})

test('enquanto calcula, anuncia o estado', () => {
  render(<ResumoMes itens={undefined}/>)
  expect(screen.getByRole('status').textContent).toBe('Calculando o resumo…')
})

test('erro mostra a falha e permite tentar de novo', () => {
  const tentar = vi.fn()
  render(<ResumoMes itens={undefined} erro="falhou" tentar={tentar}/>)
  expect(screen.getByRole('alert').textContent).toContain('Não foi possível calcular o resumo do mês.')
  fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
  expect(tentar).toHaveBeenCalledTimes(1)
})

test('sem frases, explica que ainda não há dados', () => {
  render(<ResumoMes itens={[]}/>)
  expect(screen.getByText('Ainda não há dados suficientes para o resumo deste mês.')).toBeTruthy()
})
