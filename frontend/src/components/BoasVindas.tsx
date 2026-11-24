import { useRef, useState } from 'react'
import { ChartNoAxesCombined, Plus, Sparkles } from 'lucide-react'
import { api } from '../services/api'
import { useAtualizacao } from '../layouts/contexto'
import { Painel, botao, primario, useAviso } from './ui'

// Estado vazio do dashboard: carregar os dados de exemplo da apresentação ou começar do zero.
export function BoasVindas() {
  const { abrirNovaTransacao, recarregar } = useAtualizacao()
  const aviso = useAviso()
  const [carregando, setCarregando] = useState(false)
  // Guarda contra duplo clique antes do re-render (o segundo pedido voltaria 409).
  const emAndamento = useRef(false)
  async function carregarExemplo() {
    if (emAndamento.current) return
    emAndamento.current = true
    setCarregando(true)
    try {
      const criados = await api<{ transacoes: number; metas: number }>('exemplo/', { method: 'POST' })
      aviso('Dados de exemplo carregados.', 'sucesso', `${criados.transacoes} transações e ${criados.metas} metas`)
      recarregar()
    } catch (erro) {
      aviso(erro instanceof Error ? erro.message : 'Não foi possível carregar os dados de exemplo.', 'erro')
    } finally {
      emAndamento.current = false
      setCarregando(false)
    }
  }
  return <Painel className="vazio-dashboard">
    <span className="vazio-icone" aria-hidden><ChartNoAxesCombined size={36}/></span>
    <div className="min-w-0 flex-1">
      <h2 className="titulo-card">Comece registrando sua primeira receita</h2>
      <p className="mt-1 text-sm text-soft">Ou carregue três meses de dados de exemplo para ver os gráficos, os insights e as metas funcionando.</p>
    </div>
    <div className="flex flex-wrap gap-2">
      {/* aria-disabled em vez de disabled: o foco do teclado continua no botão durante o envio. */}
      <button type="button" className={primario + (carregando ? ' opacity-60' : '')} onClick={carregarExemplo}
        aria-disabled={carregando} aria-busy={carregando}>
        <Sparkles size={16} aria-hidden/>{carregando ? 'Carregando…' : 'Carregar dados de exemplo'}
      </button>
      <button type="button" className={botao} onClick={abrirNovaTransacao}><Plus size={16} aria-hidden/>Começar do zero</button>
    </div>
  </Painel>
}
