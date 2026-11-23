from django.contrib import messages
from django.db import transaction
from django.shortcuts import get_object_or_404, redirect, render
from django.views.decorators.http import require_http_methods

from metas.models import Meta, MovimentacaoMeta
from metas.progresso import progresso

from .forms import TransacaoForm
from .models import Transacao
from .saldos import saldos, valor_reserva
from .templatetags.financeiro import moeda


def lista(request):
    return render(request, "myfinance/transacoes.html", {
        "titulo": "Transações",
        "transacoes": Transacao.objects.select_related("categoria"),
    })


@require_http_methods(["GET", "POST"])
def formulario(request, pk=None):
    convencionais = Transacao.objects.filter(tipo__in=[Transacao.Tipo.RECEITA, Transacao.Tipo.DESPESA])
    transacao = get_object_or_404(convencionais, pk=pk) if pk is not None else None
    form = TransacaoForm(request.POST if request.method == "POST" else None,
                          instance=transacao)
    if request.method == "POST" and form.is_valid():
        form.save()
        messages.success(request, "Transação salva.")
        return redirect("transacoes:lista")
    return render(request, "myfinance/formulario.html", {
        "titulo": "Editar transação" if transacao else "Nova transação",
        "form": form,
        "retorno": "transacoes:lista",
    })


@require_http_methods(["GET", "POST"])
def excluir(request, pk):
    transacao = get_object_or_404(
        Transacao, pk=pk, tipo__in=[Transacao.Tipo.RECEITA, Transacao.Tipo.DESPESA],
    )
    if request.method == "POST":
        transacao.delete()
        messages.success(request, "Transação excluída.")
        return redirect("transacoes:lista")
    return render(request, "myfinance/excluir.html", {
        "titulo": "Excluir transação",
        "objeto": transacao,
        "retorno": "transacoes:lista",
    })


def dashboard(request):
    with transaction.atomic():
        resumo = saldos()
        recentes = list(Transacao.objects.all()[:5])
        metas = list(Meta.objects.filter(arquivada_em__isnull=True))
        reservas = dict.fromkeys((meta.pk for meta in metas), 0)
        movimentos = MovimentacaoMeta.objects.filter(meta_id__in=reservas).values_list(
            "meta_id", "transacao__tipo", "transacao__valor",
        )
        for pk, tipo, valor in movimentos.iterator():
            reservas[pk] += valor_reserva(tipo, valor)
    receitas, despesas = resumo["receitas"], resumo["despesas"]
    escala = max(receitas, despesas, 1)
    return render(request, "myfinance/dashboard.html", {
        "titulo": "Visão geral",
        "resumo": resumo,
        "recentes": recentes,
        "cards": [(meta, progresso(meta, reservas[meta.pk])) for meta in metas],
        "grafico": {
            "proporcoes": [receitas / escala, despesas / escala],
            "valores": [moeda(receitas), moeda(despesas)],
        },
    })
