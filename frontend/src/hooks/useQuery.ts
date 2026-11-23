import { useEffect, useState } from 'react'

export function useQuery<T>(chave: string, carregar: (signal: AbortSignal) => Promise<T>) {
  const [revisao, setRevisao] = useState(0)
  const token = chave + ':' + revisao
  const [resultado, setResultado] = useState<{ token: string; data?: T; error?: string }>()
  useEffect(() => {
    const controller = new AbortController()
    carregar(controller.signal).then(
      data => { if (!controller.signal.aborted) setResultado({ token, data }) },
      error => { if (!controller.signal.aborted) setResultado({ token, error: error.message }) },
    )
    return () => controller.abort()
    // A chave define a consulta e a revisão invalida a resposta.
  }, [token])
  const atual = resultado?.token === token ? resultado : undefined
  return { data: atual?.data, error: atual?.error, loading: !atual, reload: () => setRevisao(v => v + 1) }
}
