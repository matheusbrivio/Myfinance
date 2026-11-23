from django.contrib import messages
from django.core.exceptions import ValidationError
from django.db import OperationalError, transaction
from django.shortcuts import get_object_or_404, redirect, render
from django.views.decorators.http import require_http_methods

from transacoes.models import Transacao

from .forms import MetaForm, MovimentacaoForm, NovaMetaForm
from .models import Meta
from .progresso import progresso
from .services import criar_meta, encerrar, historico, movimentar


def erro_concorrencia(exc):
    if "locked" not in str(exc).lower() and "busy" not in str(exc).lower():
        raise exc
    return "Há outra operação em curso. Tente novamente."


def lista(request):
    return render(request, "myfinance/metas.html", {
        "titulo": "Metas", "metas": Meta.objects.filter(arquivada_em__isnull=True),
        "arquivadas": Meta.objects.filter(arquivada_em__isnull=False),
    })


def detalhe(request, pk):
    meta = get_object_or_404(Meta, pk=pk)
    itens, saldo = historico(meta)
    return render(request, "myfinance/meta.html", {
        "titulo": meta.nome, "meta": meta, "historico": itens, "saldo": saldo,
        "progresso": progresso(meta, saldo),
    })


@require_http_methods(["GET", "POST"])
def formulario(request, pk=None):
    dados = request.POST if request.method == "POST" else None
    if pk is None:
        form = NovaMetaForm(dados)
        if request.method == "POST" and form.is_valid():
            try:
                meta = criar_meta(form)
            except ValidationError as exc:
                form.add_error("inicial", exc)
            except OperationalError as exc:
                form.add_error(None, erro_concorrencia(exc))
            else:
                messages.success(request, "Meta criada.")
                return redirect("metas:detalhe", pk=meta.pk)
    else:
        try:
            with transaction.atomic():
                meta = get_object_or_404(Meta, pk=pk, arquivada_em__isnull=True)
                form = MetaForm(dados, instance=meta)
                if request.method == "POST" and form.is_valid():
                    form.save()
                    messages.success(request, "Meta atualizada.")
                    return redirect("metas:detalhe", pk=pk)
        except OperationalError as exc:
            messages.error(request, erro_concorrencia(exc))
            return redirect("metas:detalhe", pk=pk)
    return render(request, "myfinance/formulario.html", {
        "titulo": "Editar meta" if pk is not None else "Nova meta",
        "form": form, "retorno": "metas:lista",
    })


@require_http_methods(["GET", "POST"])
def excluir(request, pk):
    meta = get_object_or_404(Meta, pk=pk, arquivada_em__isnull=True)
    itens, saldo = historico(meta)
    erro = "Retire o saldo reservado antes de encerrar a meta." if saldo else ""
    if request.method == "POST":
        try:
            encerrar(pk)
        except ValidationError as exc:
            erro = exc.messages[0]
        except OperationalError as exc:
            erro = erro_concorrencia(exc)
        else:
            messages.success(request, "Meta encerrada." if itens else "Meta excluída.")
            return redirect("metas:lista")
    return render(request, "myfinance/excluir.html", {
        "titulo": "Encerrar meta" if itens else "Excluir meta",
        "confirmacao": "Confirmar encerramento" if itens else "Confirmar exclusão",
        "pergunta": f"Confirma o encerramento de “{meta}”?" if itens else "",
        "objeto": meta, "erro": erro, "retorno": "metas:lista",
    })


@require_http_methods(["GET", "POST"])
def movimento(request, pk, tipo):
    meta = get_object_or_404(Meta, pk=pk, arquivada_em__isnull=True)
    form = MovimentacaoForm(request.POST if request.method == "POST" else None)
    if request.method == "POST" and form.is_valid():
        try:
            movimentar(pk, tipo, form.cleaned_data["valor"])
        except ValidationError as exc:
            form.add_error("valor", exc)
        except OperationalError as exc:
            form.add_error(None, erro_concorrencia(exc))
        else:
            messages.success(request, "Movimentação registrada.")
            return redirect("metas:detalhe", pk=pk)
    titulo = "Adicionar aporte" if tipo == Transacao.Tipo.APORTE_META else "Fazer retirada"
    return render(request, "myfinance/formulario.html", {
        "titulo": f"{titulo} · {meta}", "form": form, "retorno": "metas:lista",
    })
