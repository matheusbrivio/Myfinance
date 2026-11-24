// jsdom não implementa matchMedia nem IntersectionObserver; a motion e o app exigem ambos.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false, media: query, onchange: null,
    addListener: () => {}, removeListener: () => {}, addEventListener: () => {}, removeEventListener: () => {},
    dispatchEvent: () => false,
  }) as MediaQueryList
}
if (typeof window !== 'undefined' && !('IntersectionObserver' in window)) {
  class IO {
    observe() {} unobserve() {} disconnect() {} takeRecords() { return [] }
  }
  Object.assign(window, { IntersectionObserver: IO })
  Object.assign(globalThis, { IntersectionObserver: IO })
}
