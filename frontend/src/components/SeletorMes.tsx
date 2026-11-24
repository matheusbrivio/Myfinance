import { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

/** 'AAAA-MM' de uma data no fuso de São Paulo (o mesmo do backend, que recusa meses futuros). */
export function chaveMes(data = new Date()) {
  const partes = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit' }).formatToParts(data)
  const valor = (tipo: string) => partes.find(p => p.type === tipo)?.value ?? ''
  return `${valor('year')}-${valor('month')}`
}
const chaveLocal = (data: Date) => `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`
/** Soma meses a uma chave 'AAAA-MM'. */
export function somarMes(chave: string, meses: number) {
  const [ano, mes] = chave.split('-').map(Number)
  return chaveLocal(new Date(ano, mes - 1 + meses, 1))
}
/** 'novembro de 2026'. */
export function nomeMes(chave: string) {
  const [ano, mes] = chave.split('-').map(Number)
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(ano, mes - 1, 1))
}
/** Chave válida e não futura; senão, o mês atual. */
export function mesValido(valor: string | null, atual = chaveMes()) {
  return valor && /^\d{4}-(0[1-9]|1[0-2])$/.test(valor) && valor <= atual ? valor : atual
}

// ‹ novembro de 2026 › — não deixa avançar além do mês atual.
export function SeletorMes({ mes, mudar, atual = chaveMes() }: { mes: string; mudar: (mes: string) => void; atual?: string }) {
  const noAtual = mes >= atual
  const anterior = useRef<HTMLButtonElement>(null)
  // Ao chegar no mês atual, "Próximo mês" desabilita: o foco passa para "Mês anterior" em vez de cair no body.
  const avancar = () => {
    const novo = somarMes(mes, 1)
    if (novo >= atual) anterior.current?.focus()
    mudar(novo)
  }
  return <div className="seletor-mes" role="group" aria-label="Mês do dashboard">
    <button ref={anterior} type="button" className="seletor-mes-seta" aria-label="Mês anterior" onClick={() => mudar(somarMes(mes, -1))}>
      <ChevronLeft size={16} aria-hidden/>
    </button>
    <span className="seletor-mes-nome" aria-live="polite">{nomeMes(mes)}</span>
    <button type="button" className="seletor-mes-seta" aria-label="Próximo mês" disabled={noAtual} onClick={avancar}>
      <ChevronRight size={16} aria-hidden/>
    </button>
  </div>
}
