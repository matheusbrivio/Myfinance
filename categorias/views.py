from django.contrib import messages
from django.db import IntegrityError, transaction
from django.db.models.deletion import ProtectedError
from django.shortcuts import get_object_or_404, redirect, render
from django.views.decorators.http import require_http_methods

from .forms import CategoriaForm
from .models import Categoria


def lista(request):
    return render(request, "myfinance/categorias.html", {
        "titulo": "Categorias",
        "categorias": Categoria.objects.filter(interna=False),
    })


@require_http_methods(["GET", "POST"])
def formulario(request, pk=None):
    categoria = get_object_or_404(Categoria, pk=pk, interna=False) if pk is not None else None
    form = CategoriaForm(request.POST if request.method == "POST" else None,
                         instance=categoria)
    if request.method == "POST" and form.is_valid():
        try:
            with transaction.atomic():
                form.save()
        except IntegrityError:
            nome = form.cleaned_data["nome"]
            if not Categoria.objects.filter(nome_normalizado=nome.casefold()).exclude(
                pk=form.instance.pk
            ).exists():
                raise
            form.add_error("nome", form.mensagem_duplicado)
        else:
            messages.success(request, "Categoria salva.")
            return redirect("categorias:lista")
    return render(request, "myfinance/formulario.html", {
        "titulo": "Editar categoria" if categoria else "Nova categoria",
        "form": form,
        "retorno": "categorias:lista",
    })


@require_http_methods(["GET", "POST"])
def excluir(request, pk):
    categoria = get_object_or_404(Categoria, pk=pk, interna=False)
    erro = ""
    if request.method == "POST":
        try:
            categoria.delete()
        except ProtectedError:
            erro = "Esta categoria possui transações vinculadas."
        else:
            messages.success(request, "Categoria excluída.")
            return redirect("categorias:lista")
    return render(request, "myfinance/excluir.html", {
        "titulo": "Excluir categoria",
        "objeto": categoria,
        "erro": erro,
        "retorno": "categorias:lista",
    })
