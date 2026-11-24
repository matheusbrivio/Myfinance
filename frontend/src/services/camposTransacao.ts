import type { Campo } from '../components/Formulario'

export function camposTransacao(categorias: { valor: string; rotulo: string }[]): Campo[] {
  return [
    { nome: 'descricao', rotulo: 'Descrição' },
    { nome: 'tipo', rotulo: 'Tipo', tipo: 'select', obrigatorio: true,
      opcoes: [{ valor: '', rotulo: 'Selecione um tipo' }, { valor: 'receita', rotulo: 'Receita' }, { valor: 'despesa', rotulo: 'Despesa' }] },
    { nome: 'valor', rotulo: 'Valor', tipo: 'moeda', obrigatorio: true },
    { nome: 'data', rotulo: 'Data', tipo: 'data', obrigatorio: true },
    { nome: 'categoria', rotulo: 'Categoria', tipo: 'select', opcoes: [{ valor: '', rotulo: 'Sem categoria' }, ...categorias] },
  ]
}
