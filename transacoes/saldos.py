from collections import defaultdict

from .models import Transacao


def centavos(valor):
    return int(valor * 100)


def valor_reserva(tipo, valor):
    return centavos(valor) if tipo == Transacao.Tipo.APORTE_META else -centavos(valor)


def saldos():
    totais = defaultdict(int)
    for tipo, valor in Transacao.objects.order_by().values_list("tipo", "valor").iterator():
        totais[tipo] += centavos(valor)
    receitas = totais[Transacao.Tipo.RECEITA]
    despesas = totais[Transacao.Tipo.DESPESA]
    reservado = totais[Transacao.Tipo.APORTE_META] - totais[Transacao.Tipo.RETIRADA_META]
    patrimonio = receitas - despesas
    return {
        "receitas": receitas, "despesas": despesas, "reservado": reservado,
        "patrimonio": patrimonio, "disponivel": patrimonio - reservado,
    }
