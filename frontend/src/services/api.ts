import type { Lista } from '../types/financeiro'

export class ErroAPI extends Error {
  constructor(message: string, public status = 0, public campos: Record<string, string[]> = {}) {
    super(message)
  }
}

let token: string | undefined
export async function api<T>(path: string, options: { method?: string; body?: unknown; key?: string; signal?: AbortSignal } = {}): Promise<T> {
  const { method = 'GET', body, key, signal } = options
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (method !== 'GET') {
    token ||= (await api<{ token: string }>('csrf/')).token
    headers['X-CSRFToken'] = token
    headers['Content-Type'] = 'application/json'
    if (key) headers['Idempotency-Key'] = key
  }
  let response: Response
  try {
    response = await fetch('/api/v1/' + path, { method, headers, signal, credentials: 'same-origin',
      body: body === undefined ? undefined : JSON.stringify(body) })
  } catch (error) {
    if (signal?.aborted) throw error
    throw new ErroAPI('Não foi possível conectar. Tente novamente.')
  }
  if (response.status === 204) return undefined as T
  const data = await response.json().catch(() => null)
  if (!response.ok || data === null) {
    if (response.status === 403) token = undefined
    throw new ErroAPI(data?.erro?.mensagem || 'Não foi possível concluir a solicitação.',
      response.status, data?.erro?.campos || {})
  }
  return data as T
}

export async function todas<T>(path: string, signal?: AbortSignal): Promise<T[]> {
  const resultados: T[] = []
  for (let pagina = 1; ; pagina++) {
    const lista = await api<Lista<T>>(path + '?pagina=' + pagina, { signal })
    resultados.push(...lista.resultados)
    if (!lista.resultados.length || resultados.length >= lista.total) return resultados
  }
}
