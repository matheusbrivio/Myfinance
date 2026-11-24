from django.core.exceptions import ValidationError
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone

from categorias.models import Categoria
from transacoes.fields import MAX_VALOR
from transacoes.models import Transacao
from transacoes.saldos import centavos, saldos, valor_reserva

from .models import Meta, MovimentacaoMeta


def historico(meta):
    saldo = 0
    itens = []
    for item in meta.movimentacoes.select_related("transacao").order_by(
        "transacao__instante", "transacao_id"
    ):
        saldo += valor_reserva(item.transacao.tipo, item.transacao.valor)
        itens.append((item.transacao, saldo))
    return itens, saldo


def _categoria_interna():
    categoria = Categoria.objects.filter(interna=True).first()
    if categoria:
        return categoria
    nome = "Movimentações de metas"
    candidato = nome
    sufixo = 2
    while Categoria.objects.filter(nome_normalizado=candidato.casefold()).exists():
        candidato = f"{nome} ({sufixo})"
        sufixo += 1
    return Categoria.objects.create(nome=candidato, interna=True)


@transaction.atomic
def movimentar(meta_id, tipo, valor, instante=None):
    """`instante` só é informado pelos dados de exemplo; o padrão é agora. As validações não mudam."""
    meta = get_object_or_404(Meta, pk=meta_id)
    if meta.arquivada_em:
        raise ValidationError("Esta meta está arquivada.")
    if not valor.is_finite() or not 0 < valor <= MAX_VALOR or valor.as_tuple().exponent < -2:
        raise ValidationError("Informe um valor positivo com até duas casas decimais.")
    if tipo == Transacao.Tipo.APORTE_META:
        if centavos(valor) > saldos()["disponivel"]:
            raise ValidationError("O aporte excede o saldo disponível.")
        prefixo = "Aporte para meta"
    elif tipo == Transacao.Tipo.RETIRADA_META:
        if centavos(valor) > historico(meta)[1]:
            raise ValidationError("A retirada excede o saldo reservado.")
        prefixo = "Retirada da meta"
    else:
        raise ValidationError("Tipo de movimentação inválido.")
    instante = instante or timezone.now()
    transacao = Transacao.objects.create(
        descricao=f"{prefixo} — {meta.nome}", tipo=tipo, valor=valor, instante=instante,
        data=timezone.localdate(instante), categoria=_categoria_interna(),
    )
    return MovimentacaoMeta.objects.create(meta=meta, transacao=transacao)


@transaction.atomic
def criar_meta(form):
    return criar_meta_validada(**form.cleaned_data)


@transaction.atomic
def criar_meta_validada(inicial=None, **dados):
    meta = Meta.objects.create(**dados)
    if inicial:
        movimentar(meta.pk, Transacao.Tipo.APORTE_META, inicial)
    return meta


@transaction.atomic
def encerrar(meta_id):
    meta = get_object_or_404(Meta, pk=meta_id, arquivada_em__isnull=True)
    itens, saldo = historico(meta)
    if saldo:
        raise ValidationError("Retire o saldo reservado antes de encerrar a meta.")
    if itens:
        meta.arquivada_em = timezone.now()
        meta.save(update_fields=["arquivada_em"])
        return meta
    meta.delete()
    return None
