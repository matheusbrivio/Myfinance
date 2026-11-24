"""Dados de exemplo para a apresentação.

Tudo é criado pelos mesmos caminhos do uso normal (serializers da API e serviços de metas),
em ordem cronológica: as validações de saldo disponível e de reserva valem como num uso real.
"""
import calendar
from datetime import date, datetime, time
from decimal import Decimal

from django.db import transaction
from django.utils import timezone

from categorias.models import Categoria
from metas.models import Meta, MovimentacaoMeta
from metas.services import criar_meta_validada, movimentar
from transacoes.models import Transacao

from .serializers import CategoriaSerializer, MetaSerializer, TransacaoSerializer

CATEGORIAS = [
    ("Moradia", "Aluguel e contas da casa"),
    ("Alimentação", "Mercado, feira e refeições"),
    ("Transporte", "Ônibus, aplicativo e combustível"),
    ("Lazer", "Cinema, shows e passeios"),
    ("Trabalho", "Estágio e trabalhos extras"),
    ("Estudos", "Cursos e livros"),
]

# (mês relativo a hoje, dia, descrição, valor, categoria). 0 = mês atual, -1 = mês passado.
RECEITAS = [
    (-2, 5, "Estágio", "2100.00", "Trabalho"),
    (-1, 5, "Estágio", "2100.00", "Trabalho"),
    (-1, 18, "Freela — site institucional", "650.00", "Trabalho"),
    (0, 5, "Estágio", "2100.00", "Trabalho"),
]
DESPESAS = [
    (-2, 10, "Aluguel", "750.00", "Moradia"),
    (-2, 15, "Conta de luz", "96.40", "Moradia"),
    (-2, 8, "Mercado do mês", "312.50", "Alimentação"),
    (-2, 22, "Feira e padaria", "145.80", "Alimentação"),
    (-2, 12, "Recarga do cartão de ônibus", "120.00", "Transporte"),
    (-2, 26, "Cinema", "89.90", "Lazer"),
    (-1, 10, "Aluguel", "750.00", "Moradia"),
    (-1, 15, "Conta de luz", "118.90", "Moradia"),
    (-1, 7, "Mercado do mês", "286.30", "Alimentação"),
    (-1, 21, "Feira e padaria", "198.70", "Alimentação"),
    (-1, 12, "Recarga do cartão de ônibus", "135.60", "Transporte"),
    (-1, 24, "Show com amigos", "210.00", "Lazer"),
    (-1, 3, "Curso online de Python", "79.90", "Estudos"),
    (0, 10, "Aluguel", "750.00", "Moradia"),
    (0, 15, "Conta de luz", "104.20", "Moradia"),
    (0, 7, "Mercado do mês", "341.20", "Alimentação"),
    (0, 20, "Feira e padaria", "256.90", "Alimentação"),
    (0, 12, "Recarga do cartão de ônibus", "98.40", "Transporte"),
    (0, 18, "Pizza no fim de semana", "64.00", "Lazer"),
    (0, 4, "Livro de algoritmos", "59.90", "Estudos"),
]
# Metas: uma em andamento com aportes regulares, uma concluída e uma recém-criada.
METAS = {
    "reserva": {"nome": "Reserva de emergência", "descricao": "Dois meses de gastos guardados.",
                "objetivo": "3000.00", "prazo_meses": 12},
    "viagem": {"nome": "Viagem de fim de ano", "descricao": "Passagens e hospedagem.",
               "objetivo": "800.00", "prazo_meses": 2},
}
APORTES = [
    (-2, 6, "reserva", "200.00"),
    (-2, 20, "viagem", "300.00"),
    (-1, 6, "reserva", "300.00"),
    (-1, 20, "viagem", "500.00"),
    (0, 6, "reserva", "200.00"),
]
META_NOVA = {"nome": "Notebook novo", "descricao": "Para os trabalhos da faculdade.",
             "objetivo": "4500.00", "prazo_meses": 18, "inicial": "120.00"}


class BaseComDados(Exception):
    """Os dados de exemplo só entram numa base sem transações."""


def base_vazia():
    return not Transacao.objects.exists()


def _criar_meta(nome, descricao, objetivo, prazo):
    serializer = MetaSerializer(data={"nome": nome, "descricao": descricao, "objetivo": objetivo, "prazo": prazo.isoformat()})
    serializer.is_valid(raise_exception=True)
    return criar_meta_validada(**serializer.validated_data)


def _somar_meses(dia, meses):
    total = dia.year * 12 + dia.month - 1 + meses
    return date(total // 12, total % 12 + 1, 1)


def _data(hoje, mes, dia):
    inicio = _somar_meses(hoje, mes)
    ultimo = calendar.monthrange(inicio.year, inicio.month)[1]
    data = inicio.replace(day=min(dia, ultimo))
    # No mês atual nada fica depois de hoje.
    return min(data, hoje)


def _prazo(hoje, meses):
    inicio = _somar_meses(hoje, meses)
    return inicio.replace(day=min(hoje.day, calendar.monthrange(inicio.year, inicio.month)[1]))


def _instante(data):
    return timezone.make_aware(datetime.combine(data, time(12, 0)))


def _categoria(nome, descricao):
    existente = Categoria.objects.filter(nome_normalizado=nome.casefold(), interna=False).first()
    if existente:
        return existente
    serializer = CategoriaSerializer(data={"nome": nome, "descricao": descricao})
    serializer.is_valid(raise_exception=True)
    return serializer.save()


def _lancar(tipo, data, descricao, valor, categoria):
    serializer = TransacaoSerializer(data={
        "tipo": tipo, "data": data.isoformat(), "descricao": descricao, "valor": valor, "categoria": categoria.pk,
    })
    serializer.is_valid(raise_exception=True)
    return serializer.save()


@transaction.atomic
def popular_exemplo(hoje=None):
    # A checagem fica dentro da transação: um segundo pedido simultâneo não duplica os dados.
    if not base_vazia():
        raise BaseComDados("Os dados de exemplo só podem ser carregados quando ainda não há transações.")
    hoje = hoje or timezone.localdate()
    categorias = {nome: _categoria(nome, descricao) for nome, descricao in CATEGORIAS}
    eventos = []  # (data, ordem, ação): receitas antes de despesas e aportes no mesmo dia.
    for mes, dia, descricao, valor, categoria in RECEITAS:
        eventos.append((_data(hoje, mes, dia), 0, ("receita", descricao, valor, categoria)))
    for mes, dia, descricao, valor, categoria in DESPESAS:
        eventos.append((_data(hoje, mes, dia), 1, ("despesa", descricao, valor, categoria)))
    for mes, dia, chave, valor in APORTES:
        eventos.append((_data(hoje, mes, dia), 2, ("aporte", chave, valor, None)))
    eventos.sort(key=lambda e: (e[0], e[1]))

    metas = {}
    for data, _, (acao, primeiro, valor, categoria) in eventos:
        if acao == "aporte":
            if primeiro not in metas:
                dados = METAS[primeiro]
                meta = _criar_meta(dados["nome"], dados["descricao"], dados["objetivo"], _prazo(hoje, dados["prazo_meses"]))
                # `criada_em` é auto_now_add, sem caminho na API: só esta data é ajustada direto,
                # para a meta não "nascer" depois dos próprios aportes. Nenhuma regra usa esse campo.
                Meta.objects.filter(pk=meta.pk).update(criada_em=_instante(data))
                metas[primeiro] = meta
            movimentar(metas[primeiro].pk, Transacao.Tipo.APORTE_META, Decimal(valor), instante=_instante(data))
        else:
            _lancar(acao, data, primeiro, valor, categorias[categoria])

    # Recém-criada: um aporte pequeno hoje.
    nova = _criar_meta(META_NOVA["nome"], META_NOVA["descricao"], META_NOVA["objetivo"], _prazo(hoje, META_NOVA["prazo_meses"]))
    movimentar(nova.pk, Transacao.Tipo.APORTE_META, Decimal(META_NOVA["inicial"]), instante=_instante(hoje))
    metas["nova"] = nova
    return {"categorias": len(categorias), "transacoes": Transacao.objects.count(), "metas": len(metas)}


@transaction.atomic
def limpar_base():
    """Apaga tudo o que o usuário cadastrou (só pelo terminal, para preparar a demonstração)."""
    MovimentacaoMeta.objects.all().delete()
    Transacao.objects.all().delete()
    Meta.objects.all().delete()
    Categoria.objects.all().delete()
