"""Recorte por mês do resumo e dos gráficos (`?mes=AAAA-MM`).

Fluxos (receitas, despesas, reservado líquido e sobra) consideram só o período do mês.
A posição (disponível, reservado e patrimônio) acumula tudo até o fim do período.
No mês atual o período vai até hoje.
"""
import calendar
import re
from collections import defaultdict
from datetime import date

from django.utils import timezone
from rest_framework import exceptions

from transacoes.models import Transacao
from transacoes.saldos import centavos

MENSAGEM = "Informe um mês no formato AAAA-MM, até o mês atual."


def hoje():
    return timezone.localdate()


def periodo(valor):
    """Converte 'AAAA-MM' em (início, fim); mês inválido ou futuro vira erro 400."""
    if not isinstance(valor, str) or not re.fullmatch(r"[0-9]{4}-[0-9]{2}", valor):
        raise exceptions.ValidationError({"mes": MENSAGEM})
    ano, mes = int(valor[:4]), int(valor[5:])
    if ano < 1 or not 1 <= mes <= 12:
        raise exceptions.ValidationError({"mes": MENSAGEM})
    atual = hoje()
    inicio = date(ano, mes, 1)
    if inicio > atual.replace(day=1):
        raise exceptions.ValidationError({"mes": MENSAGEM})
    fim = date(ano, mes, calendar.monthrange(ano, mes)[1])
    return inicio, min(fim, atual)


def periodo_da_requisicao(request):
    valor = request.query_params.get("mes")
    return None if valor is None else periodo(valor)


def _totais(queryset):
    totais = defaultdict(int)
    for tipo, valor in queryset.order_by().values_list("tipo", "valor").iterator():
        totais[tipo] += centavos(valor)
    return totais


def posicao(fim):
    """Disponível, reservado e patrimônio acumulados até `fim` (mesma regra de transacoes.saldos)."""
    t = _totais(Transacao.objects.filter(data__lte=fim))
    reservado = t[Transacao.Tipo.APORTE_META] - t[Transacao.Tipo.RETIRADA_META]
    patrimonio = t[Transacao.Tipo.RECEITA] - t[Transacao.Tipo.DESPESA]
    return {"reservado": reservado, "patrimonio": patrimonio, "disponivel": patrimonio - reservado}


def fluxos(inicio, fim):
    """Receitas, despesas, reservado líquido (aportes − retiradas) e sobra do período, em centavos."""
    t = _totais(Transacao.objects.filter(data__range=(inicio, fim)))
    receitas, despesas = t[Transacao.Tipo.RECEITA], t[Transacao.Tipo.DESPESA]
    reservado = t[Transacao.Tipo.APORTE_META] - t[Transacao.Tipo.RETIRADA_META]
    return {"receitas": receitas, "despesas": despesas, "reservado": reservado,
            "sobra": receitas - despesas - reservado, "retiradas": t[Transacao.Tipo.RETIRADA_META]}
