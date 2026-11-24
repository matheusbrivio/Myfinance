// Testa o suporte a WebGL uma vez só: criar um contexto custa dezenas de milissegundos,
// e a intro testava duas vezes (fundo e crachás) bem na hora em que a tela abre.
let cache: { webgl: boolean; webgl2: boolean } | undefined

export function suporteWebGL() {
  if (cache) return cache
  cache = { webgl: false, webgl2: false }
  if (typeof WebGLRenderingContext === 'undefined') return cache
  try {
    const gl2 = document.createElement('canvas').getContext('webgl2')
    const gl = gl2 ?? document.createElement('canvas').getContext('webgl')
    cache = { webgl: !!gl, webgl2: !!gl2 }
    // Libera o contexto de teste na hora, em vez de esperar o coletor de lixo.
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
  } catch { /* sem WebGL */ }
  return cache
}
