// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { MemoryRouter } from 'react-router'
import { Dashboard } from './Dashboard'
import { Avisos, useAviso } from '../components/ui'
import { Formulario } from '../components/Formulario'
import { ErroAPI, api } from '../services/api'
import { act, fireEvent } from '@testing-library/react'
import { moeda } from '../services/format'
import { distribuirDinheiro } from '../services/distribuicao'

vi.mock('../services/api', async original => ({
  ...(await original<typeof import('../services/api')>()), api: vi.fn(),
}))
const mock = vi.mocked(api)
afterEach(() => { cleanup(); vi.resetAllMocks(); vi.useRealTimers() })

test('mostra carregamento e erro com nova tentativa', async () => {
  mock.mockRejectedValue(new Error('Não foi possível conectar.'))
  render(<MemoryRouter><Dashboard/></MemoryRouter>)
  expect(screen.getByRole('status').textContent).toContain('Carregando')
  expect((await screen.findByRole('alert')).textContent).toContain('Não foi possível conectar.')
  expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeTruthy()
})

test('exibe indicadores e estados vazios com dados da API', async () => {
  mock.mockResolvedValueOnce({ saldos: { disponivel:'0.00', patrimonio:'0.00', reservado:'0.00', receitas:'0.00', despesas:'0.00' }, recentes:[], metas:[] })
  render(<MemoryRouter><Dashboard/></MemoryRouter>)
  expect(await screen.findByText('Saldo disponível')).toBeTruthy()
  expect(screen.getByText('Nenhuma receita registrada para distribuir.')).toBeTruthy()
  expect(screen.queryByRole('heading', { name: 'Despesas por categoria' })).toBeNull()
  expect(screen.getByText('Nenhuma meta ativa.')).toBeTruthy()
})

test('pede o resumo e os gráficos do mês atual', async () => {
  mock.mockResolvedValue({ saldos: { disponivel:'0.00', patrimonio:'0.00', reservado:'0.00', receitas:'0.00', despesas:'0.00' }, recentes:[], metas:[] })
  render(<MemoryRouter><Dashboard/></MemoryRouter>)
  await screen.findByText('Saldo disponível')
  const caminhos = mock.mock.calls.map(c => c[0])
  expect(caminhos.some(c => /^resumo\/\?mes=\d{4}-\d{2}$/.test(c))).toBe(true)
  expect(caminhos.some(c => /^graficos\/\?mes=\d{4}-\d{2}$/.test(c))).toBe(true)
})

test('sobra negativa do mês aparece sem percentuais', async () => {
  mock.mockResolvedValueOnce({ saldos: { receitas:'100.00', despesas:'150.00', reservado:'0.00', disponivel:'500.00', patrimonio:'500.00' },
    mes: { inicio:'2026-11-01', fim:'2026-11-24', receitas:'100.00', despesas:'150.00', reservado:'0.00', sobra:'-50.00' }, recentes:[], metas:[] })
  render(<MemoryRouter initialEntries={['/?mes=2026-11']}><Dashboard/></MemoryRouter>)
  expect(await screen.findByText(/A sobra do mês está negativa/)).toBeTruthy()
  const legenda = screen.getByRole('list', { name: 'Legenda da distribuição' })
  expect(legenda.textContent).toContain('Sobra do mês')
  expect(legenda.textContent).toContain('-R$ 50,00')
  expect(legenda.textContent).not.toContain('%')
})

test('mostra o resumo do mês ao lado do hero, e só o card falha se os insights falharem', async () => {
  const resumo = { saldos: { disponivel:'0.00', patrimonio:'0.00', reservado:'0.00', receitas:'0.00', despesas:'0.00' }, recentes:[], metas:[] }
  mock.mockImplementation(async (caminho: string) => caminho.startsWith('insights/')
    ? [{ tipo: 'maior_gasto', tom: 'neutro', texto: 'Seu maior gasto foi Aluguel (R$ 750,00), no dia 10.' }]
    : caminho.startsWith('resumo/') ? resumo : null)
  render(<MemoryRouter><Dashboard/></MemoryRouter>)
  expect(await screen.findByText('Seu maior gasto foi Aluguel (R$ 750,00), no dia 10.')).toBeTruthy()
  cleanup()
  mock.mockImplementation(async (caminho: string) => {
    if (caminho.startsWith('insights/')) throw new Error('falhou')
    return caminho.startsWith('resumo/') ? resumo : null
  })
  render(<MemoryRouter><Dashboard/></MemoryRouter>)
  expect(await screen.findByText('Não foi possível calcular o resumo do mês.')).toBeTruthy()
  expect(screen.getByText('Saldo disponível')).toBeTruthy()
})

test('usa o saldo disponível real com precisão de centavos', () => {
  const resultado = distribuirDinheiro({
    receitas: '2500.00', despesas: '1200.23', reservado: '550.00', disponivel: '749.77', patrimonio: '1299.77',
  })
  expect(resultado.estado).toBe('valido')
  expect(resultado.segmentos).toMatchObject([
    { valor: '749.77', percentual: '29,99%' },
    { valor: '1200.23', percentual: '48,01%' },
    { valor: '550.00', percentual: '22,00%' },
  ])
})

test('fecha em 100% mesmo quando as parcelas têm dízimas', () => {
  const resultado = distribuirDinheiro({
    receitas: '0.03', despesas: '0.01', reservado: '0.01', disponivel: '0.01', patrimonio: '0.02',
  })
  expect(resultado.segmentos).toMatchObject([
    { percentual: '33,34%' }, { percentual: '33,33%' }, { percentual: '33,33%' },
  ])
})

test('mantém valores negativos visíveis sem setores ou percentuais', async () => {
  mock.mockResolvedValueOnce({ saldos: { receitas:'100.00', despesas:'105.00', reservado:'5.00',
    disponivel:'-10.00', patrimonio:'-5.00' }, recentes:[], metas:[] })
  render(<MemoryRouter><Dashboard/></MemoryRouter>)
  expect(await screen.findByText(/O saldo disponível está negativo/)).toBeTruthy()
  const legenda = screen.getByRole('list', { name: 'Legenda da distribuição' })
  expect(legenda.textContent).toContain('-R$ 10,00')
  expect(legenda.textContent).not.toContain('%')
})

test('rejeita parcelas que não somam as receitas', () => {
  expect(distribuirDinheiro({
    receitas: '100.00', despesas: '25.00', reservado: '25.00', disponivel: '25.00', patrimonio: '50.00',
  }).estado).toBe('invalido')
})

test('erro por campo permanece ao editar outro campo', async () => {
  mock.mockRejectedValue(new ErroAPI('Corrija os campos indicados.', 400, { valor:['Valor inválido.'] }))
  render(<Formulario endpoint="transacoes/" sucesso="Salvo" concluir={() => {}}
    campos={[{nome:'valor',rotulo:'Valor'},{nome:'descricao',rotulo:'Descrição'}]}/>)
  fireEvent.click(screen.getByRole('button', {name:'Salvar'}))
  expect(await screen.findByText('Valor inválido.')).toBeTruthy()
  fireEvent.change(screen.getByLabelText('Descrição'), {target:{value:'Viagem'}})
  expect(screen.getByText('Valor inválido.')).toBeTruthy()
  fireEvent.change(screen.getByLabelText('Valor'), {target:{value:'10'}})
  expect(screen.queryByText('Valor inválido.')).toBeNull()
})

test('toast de sucesso começa a sair após quatro segundos', async () => {
  vi.useFakeTimers()
  function Avisar() {
    const aviso = useAviso()
    return <button onClick={() => aviso('Registro salvo.')}>Avisar</button>
  }
  render(<Avisos><Avisar/></Avisos>)
  fireEvent.click(screen.getByRole('button', {name:'Avisar'}))
  expect(screen.getByText('Registro salvo.')).toBeTruthy()
  await act(() => vi.advanceTimersByTimeAsync(3999))
  expect(screen.getByText('Registro salvo.')).toBeTruthy()
  await act(() => vi.advanceTimersByTimeAsync(181))
  expect(screen.queryByText('Registro salvo.')).toBeNull()
})

test('formata o valor máximo sem arredondamento de ponto flutuante', () => {
  expect(moeda('92233720368547758.07')).toBe('R$ 92.233.720.368.547.758,07')
})
