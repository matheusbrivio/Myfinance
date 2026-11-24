import { createContext, useContext } from 'react'

// Enquanto a câmera "desce" entre intro e app, as entradas dos cards esperam a cena parar.
export const EmTransicaoContext = createContext(false)
export const useEmTransicao = () => useContext(EmTransicaoContext)
