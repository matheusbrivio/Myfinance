export function moeda(valor: string) {
  const [inteiro, fracao = '00'] = valor.replace(/^-/, '').split('.')
  return (valor.startsWith('-') ? '-R$ ' : 'R$ ') + inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + fracao
}
export function dataBR(valor: string) { return valor.split('-').reverse().join('/') }
export function dataISO(valor: string) {
  return /^\d{2}\/\d{2}\/\d{4}$/.test(valor) ? valor.split('/').reverse().join('-') : valor
}
export function valorAPI(valor: string) {
  const texto = valor.trim().replace(/^R\$\s*/, '')
  return /^[+-]?(?:\d+|\d{1,3}(?:\.\d{3})+),\d+$/.test(texto)
    ? texto.replaceAll('.', '').replace(',', '.') : texto
}
export const tipos = { receita: 'Receita', despesa: 'Despesa', aporte_meta: 'Aporte para meta', retirada_meta: 'Retirada da meta' }
export const instanteBR = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' })
