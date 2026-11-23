from decimal import Decimal, ROUND_HALF_UP

from django.utils import timezone

from transacoes.saldos import centavos


def progresso(meta, saldo, hoje=None):
    hoje = hoje or timezone.localdate()
    objetivo = centavos(meta.objetivo)
    restante = max(0, objetivo - saldo)
    diferenca = (meta.prazo - hoje).days
    dias = max(0, diferenca)
    percentual = Decimal(saldo * 100) / objetivo if objetivo else Decimal(0)
    percentual = percentual.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP).normalize()
    if restante == 0:
        status, mensal = "Concluída", 0
    elif diferenca < 0:
        status, mensal = "Vencida", None
    else:
        meses = max(1, (dias + 29) // 30)
        status, mensal = "Em andamento", (restante + meses - 1) // meses
    return {
        "acumulado": saldo, "restante": restante, "dias": dias, "mensal": mensal,
        "status": status, "percentual": format(percentual, "f").replace(".", ","),
        "barra": format(min(percentual, Decimal(100)), "f"),
    }
