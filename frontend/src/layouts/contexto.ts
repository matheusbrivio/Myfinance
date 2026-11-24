import { createContext, useContext } from 'react'

// `versao` muda quando algo é salvo fora da página atual (ex.: "Nova transação" na barra).
export const AtualizacaoContext = createContext<{ versao: number }>({ versao: 0 })
export const useAtualizacao = () => useContext(AtualizacaoContext)
