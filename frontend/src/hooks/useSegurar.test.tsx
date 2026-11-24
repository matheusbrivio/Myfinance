// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { useSegurar } from './useSegurar'

function Botao({ aoCompletar }: { aoCompletar: () => void }) {
  const { progress, fase, handlers } = useSegurar({ tempo: 1000, aoCompletar })
  return <button {...handlers} data-fase={fase} data-progress={progress.toFixed(2)}>Segurar</button>
}
const montar = () => {
  const aoCompletar = vi.fn()
  render(<Botao aoCompletar={aoCompletar}/>)
  return { aoCompletar, botao: screen.getByRole('button', { name: 'Segurar' }) }
}
const avancar = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms))

beforeEach(() => { vi.useFakeTimers() })
afterEach(() => { cleanup(); vi.useRealTimers() })

test('segurar completa em 1000 ms', async () => {
  const { aoCompletar, botao } = montar()
  fireEvent.keyDown(botao, { key: ' ' })
  await avancar(900)
  expect(aoCompletar).not.toHaveBeenCalled()
  expect(botao.dataset.fase).toBe('holding')
  await avancar(200)
  expect(aoCompletar).toHaveBeenCalledTimes(1)
  expect(botao.dataset.fase).toBe('done')
})

test('soltar antes de 1000 ms cancela e o progresso volta a zero', async () => {
  const { aoCompletar, botao } = montar()
  fireEvent.keyDown(botao, { key: ' ' })
  await avancar(500)
  expect(Number(botao.dataset.progress)).toBeGreaterThan(0.3)
  fireEvent.keyUp(botao, { key: ' ' })
  await avancar(1200)
  expect(aoCompletar).not.toHaveBeenCalled()
  expect(botao.dataset.fase).toBe('idle')
  expect(botao.dataset.progress).toBe('0.00')
})

test('Escape cancela enquanto segura pelo teclado', async () => {
  const { aoCompletar, botao } = montar()
  fireEvent.keyDown(botao, { key: 'Enter' })
  await avancar(500)
  fireEvent.keyDown(botao, { key: 'Escape' })
  await avancar(1200)
  expect(aoCompletar).not.toHaveBeenCalled()
  expect(botao.dataset.fase).toBe('idle')
})
