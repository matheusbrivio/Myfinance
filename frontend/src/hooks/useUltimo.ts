import { useState } from 'react'

// Mantém o último valor carregado enquanto a próxima consulta roda: os números trocam
// com cross-fade em vez de sumir e voltar girando.
export function useUltimo<T>(valor: T | undefined) {
  const [ultimo, setUltimo] = useState(valor)
  if (valor !== undefined && valor !== ultimo) setUltimo(valor)
  return valor ?? ultimo
}
