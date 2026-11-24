// Anel de progresso âmbar de 128px com o percentual em serifa no centro.
export function AnelProgresso({ valor, texto, rotulo }: { valor: number; texto: string; rotulo: string }) {
  const raio = 56
  const volta = 2 * Math.PI * raio
  const fracao = Math.min(100, Math.max(0, valor)) / 100
  return <div className="anel" role="progressbar" aria-label={rotulo} aria-valuenow={valor} aria-valuemin={0} aria-valuemax={100}>
    <svg viewBox="0 0 128 128" width="128" height="128" aria-hidden>
      <circle cx="64" cy="64" r={raio} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="8"/>
      {fracao > 0 && <circle className="anel-progresso" cx="64" cy="64" r={raio} fill="none" stroke="var(--accent)" strokeWidth="8"
        strokeLinecap="round" strokeDasharray={volta} strokeDashoffset={volta * (1 - fracao)}/>}
    </svg>
    <span className="absolute inset-0 grid place-items-center serif text-[34px] leading-none text-text">{texto}</span>
  </div>
}
