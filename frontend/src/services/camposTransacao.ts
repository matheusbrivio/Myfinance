import type { Campo } from '../components/Formulario'

// Ordem do modal: tipo, valor em destaque, data e categoria lado a lado, descrição.
export function camposTransacao(categorias: { valor: string; rotulo: string }[]): Campo[] {
  return [
    { nome: 'tipo', rotulo: 'Tipo', tipo: 'segmento', obrigatorio: true,
      opcoes: [{ valor: 'receita', rotulo: 'Receita' }, { valor: 'despesa', rotulo: 'Despesa' }] },
    { nome: 'valor', rotulo: 'Valor', tipo: 'moeda', obrigatorio: true, destaque: true },
    { nome: 'data', rotulo: 'Data', tipo: 'data', obrigatorio: true, meia: true },
    { nome: 'categoria', rotulo: 'Categoria', tipo: 'select', meia: true, opcoes: [{ valor: '', rotulo: 'Sem categoria' }, ...categorias] },
    { nome: 'descricao', rotulo: 'Descrição' },
  ]
}
