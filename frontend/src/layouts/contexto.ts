import { createContext, useContext } from 'react'

// `versao` muda quando algo é salvo fora da página atual (ex.: "Nova transação" na barra).
// `abrirNovaTransacao` e `recarregar` deixam as páginas usarem o modal e a atualização da barra.
export const AtualizacaoContext = createContext<{ versao: number; abrirNovaTransacao: () => void; recarregar: () => void }>({
  versao: 0, abrirNovaTransacao: () => {}, recarregar: () => {},
})
export const useAtualizacao = () => useContext(AtualizacaoContext)
