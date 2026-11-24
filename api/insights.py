"""Frases do "Resumo do mês", calculadas a partir das transações e metas.

As regras rodam em ordem de prioridade; a que não tiver dados é pulada, e a lista para em 3 itens.
Nada é inventado: sem dado suficiente, não há frase.
"""
from collections import defaultdict
from datetime import timedelta
from decimal import Decimal, ROUND_HALF_UP

from metas.models import Meta
from metas.services import historico
from transacoes.models import Transacao
from transacoes.saldos import centavos

from . import mensal

MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto",
         "setembro", "outubro", "novembro", "dezembro"]
MINIMO_CATEGORIA = 5000  # R$ 50,00 em centavos, nos dois meses
DIAS_PARADA = 45
JANELA_DIAS = 90


def reais(valor):
    """Centavos → 'R$ 1.234,56'."""
    sinal = "-" if valor < 0 else ""
    inteiro, fracao = divmod(abs(valor), 100)
    return f"{sinal}R$ {inteiro:,}".replace(",", ".") + f",{fracao:02d}"


def _percentual(parte, todo):
    return int((Decimal(parte) * 100 / todo).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def _mes_anterior(inicio, fim):
    """Mesmo recorte no mês anterior: se o período vai só até o dia 24 (mês atual), compara até o dia 24."""
    ultimo = inicio - timedelta(days=1)
    anterior_inicio = ultimo.replace(day=1)
    mes_completo = (fim + timedelta(days=1)).day == 1
    return anterior_inicio, ultimo if mes_completo else ultimo.replace(day=min(fim.day, ultimo.day))


def _despesas_por_categoria(inicio, fim):
    totais = defaultdict(int)
    nomes = {}
    for valor, categoria_id, nome in Transacao.objects.filter(
        tipo=Transacao.Tipo.DESPESA, data__range=(inicio, fim), categoria__isnull=False,
    ).values_list("valor", "categoria_id", "categoria__nome"):
        totais[categoria_id] += centavos(valor)
        nomes[categoria_id] = nome
    return totais, nomes


def variacao_categoria(inicio, fim):
    anterior_inicio, anterior_fim = _mes_anterior(inicio, fim)
    atuais, nomes = _despesas_por_categoria(inicio, fim)
    anteriores, _ = _despesas_por_categoria(anterior_inicio, anterior_fim)
    candidatas = []
    for categoria, atual in atuais.items():
        antes = anteriores.get(categoria, 0)
        if atual >= MINIMO_CATEGORIA and antes >= MINIMO_CATEGORIA:
            candidatas.append((_percentual(atual - antes, antes), nomes[categoria]))
    if not candidatas:
        return None
    variacao, nome = max(candidatas, key=lambda c: (abs(c[0]), c[1]))
    if variacao == 0:
        return None
    direcao = "mais" if variacao > 0 else "menos"
    return {"tipo": "variacao_categoria", "tom": "alerta" if variacao > 0 else "positivo",
            "texto": f"Você gastou {abs(variacao)}% a {direcao} com {nome} do que em {MESES[anterior_inicio.month - 1]}."}


def economia(inicio, fim):
    f = mensal.fluxos(inicio, fim)
    if f["receitas"] <= 0:
        return None
    # Sobra + reservado líquido = receitas − despesas. O tom vem do valor bruto, não do arredondado.
    guardado = f["receitas"] - f["despesas"]
    taxa = _percentual(guardado, f["receitas"])
    mes = MESES[inicio.month - 1]
    if guardado < 0:
        return {"tipo": "economia", "tom": "alerta",
                "texto": f"Você gastou {abs(taxa) or 1}% a mais do que recebeu em {mes}."}
    return {"tipo": "economia", "tom": "positivo", "texto": f"Você guardou {taxa}% do que recebeu em {mes}."}


def projecao_meta(hoje):
    for meta in Meta.objects.filter(arquivada_em__isnull=True).order_by("prazo", "pk"):
        itens, saldo = historico(meta)
        restante = centavos(meta.objetivo) - saldo
        aportes = [t for t, _ in itens if t.tipo == Transacao.Tipo.APORTE_META]
        if restante <= 0 or not aportes:
            continue
        parado = (hoje - max(t.data for t in aportes)).days
        if parado > DIAS_PARADA:
            return {"tipo": "meta", "tom": "alerta", "texto": f"A meta {meta.nome} está sem aportes há {parado} dias."}
        janela = hoje - timedelta(days=JANELA_DIAS)
        # Sem aporte há até 45 dias, há aporte dentro da janela de 90 dias: a média é positiva.
        media = Decimal(sum(centavos(t.valor) for t in aportes if t.data > janela)) / 3
        meses = int((Decimal(restante) / media).to_integral_value(rounding="ROUND_CEILING"))
        total = hoje.year * 12 + hoje.month - 1 + meses
        return {"tipo": "meta", "tom": "neutro",
                "texto": f"No ritmo atual, a meta {meta.nome} fecha em {MESES[total % 12]} de {total // 12}."}
    return None


def maior_gasto(inicio, fim):
    despesa = (Transacao.objects.filter(tipo=Transacao.Tipo.DESPESA, data__range=(inicio, fim))
               .select_related("categoria").order_by("-valor", "data", "pk").first())
    if despesa is None:
        return None
    nome = despesa.descricao or (despesa.categoria.nome if despesa.categoria else "uma despesa sem descrição")
    return {"tipo": "maior_gasto", "tom": "neutro",
            "texto": f"Seu maior gasto foi {nome} ({reais(centavos(despesa.valor))}), no dia {despesa.data.day}."}


def insights(inicio, fim, hoje=None):
    hoje = hoje or mensal.hoje()
    # A regra de meta fala do hoje (dias parada, projeção a partir de agora): só entra no mês atual.
    meta = projecao_meta(hoje) if fim == hoje else None
    itens = [variacao_categoria(inicio, fim), economia(inicio, fim), meta, maior_gasto(inicio, fim)]
    return [item for item in itens if item][:3]


def mes_atual(hoje=None):
    hoje = hoje or mensal.hoje()
    return hoje.replace(day=1), hoje

