from collections import defaultdict
from decimal import Decimal, ROUND_HALF_UP

from metas.models import MovimentacaoMeta
from metas.progresso import progresso
from transacoes.models import Transacao
from transacoes.saldos import centavos, valor_reserva

from .serializers import MetaSerializer


def dinheiro(valor):
    sinal = "-" if valor < 0 else ""
    inteiro, fracao = divmod(abs(valor), 100)
    return f"{sinal}{inteiro}.{fracao:02d}"


def reservas(metas):
    valores = dict.fromkeys((meta.pk for meta in metas), 0)
    for pk, tipo, valor in MovimentacaoMeta.objects.filter(meta_id__in=valores).values_list(
        "meta_id", "transacao__tipo", "transacao__valor",
    ).iterator():
        valores[pk] += valor_reserva(tipo, valor)
    return valores


def meta_json(meta, saldo, disponivel):
    dados = dict(MetaSerializer(meta).data)
    projecao = progresso(meta, saldo)
    projecao["percentual"] = projecao["percentual"].replace(",", ".")
    for campo in ("acumulado", "restante", "mensal"):
        if projecao[campo] is not None:
            projecao[campo] = dinheiro(projecao[campo])
    dados["progresso"] = projecao
    dados["pode_aportar"] = not meta.arquivada_em and disponivel > 0
    dados["pode_retirar"] = not meta.arquivada_em and saldo > 0
    return dados


def segmentos(linhas):
    total = sum(valor for _, _, valor in linhas)
    if not total:
        return []
    return [
        {"id": id_, "nome": nome, "valor": dinheiro(valor),
         "percentual": str((Decimal(valor * 100) / total).quantize(Decimal(".01"), rounding=ROUND_HALF_UP)),
         "proporcao": valor / total}
        for id_, nome, valor in linhas
    ]


def graficos():
    totais = defaultdict(int)
    despesas = defaultdict(int)
    nomes = {}
    for tipo, valor, id_, nome in Transacao.objects.order_by().values_list(
        "tipo", "valor", "categoria_id", "categoria__nome",
    ).iterator():
        inteiro = centavos(valor)
        totais[tipo] += inteiro
        if tipo == Transacao.Tipo.DESPESA:
            despesas[id_] += inteiro
            nomes[id_] = nome or "Sem categoria"
    classes = [Transacao.Tipo.RECEITA, Transacao.Tipo.DESPESA, Transacao.Tipo.APORTE_META]
    return {
        "distribuicao": segmentos([(t.value, t.label, totais[t]) for t in classes]),
        "despesas_por_categoria": segmentos([
            (id_, nomes[id_], despesas[id_]) for id_ in sorted(despesas, key=lambda x: (x is None, x))
        ]),
        "retiradas": dinheiro(totais[Transacao.Tipo.RETIRADA_META]),
    }
