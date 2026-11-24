from django.db import transaction
from django.db.models.deletion import ProtectedError
from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from django.middleware.csrf import get_token
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect
from rest_framework import exceptions
from rest_framework.parsers import JSONParser
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from rest_framework.views import APIView

from categorias.models import Categoria
from metas.models import Meta
from metas.services import criar_meta_validada, encerrar, historico, movimentar
from transacoes.models import Transacao
from transacoes.saldos import saldos

from .exemplo import BaseComDados, popular_exemplo
from .http import Conflito, envelope, idempotente
from . import insights as regras_insights, mensal
from .projecoes import dinheiro, graficos, meta_json, reservas
from .serializers import (
    CONVENCIONAIS, CategoriaSerializer, FiltroSerializer, MetaSerializer,
    MovimentoSerializer, TransacaoSerializer,
)

PAGE_SIZE = 25


@method_decorator(csrf_protect, name="dispatch")
class JSONView(APIView):
    authentication_classes = []
    renderer_classes = [JSONRenderer]
    parser_classes = [JSONParser]


class CSRF(JSONView):
    def get(self, request):
        return Response({"token": get_token(request)})


class Inexistente(JSONView):
    def dispatch(self, request, *args, **kwargs):
        from django.http import JsonResponse
        return JsonResponse(envelope("nao_encontrado", "Recurso não encontrado."), status=404)


def paginar(queryset, pagina):
    inicio = (pagina - 1) * PAGE_SIZE
    total = queryset.count()
    if inicio and inicio >= total:
        raise exceptions.ValidationError({"pagina": "Página fora do intervalo."})
    return list(queryset[inicio:inicio + PAGE_SIZE]), total


class Recurso(JSONView):
    serializer = None
    exige_chave = False

    def queryset(self):
        raise NotImplementedError

    def filtros(self, request):
        filtro = FiltroSerializer(data={"pagina": request.query_params.get("pagina", 1)})
        filtro.is_valid(raise_exception=True)
        return self.queryset(), filtro.validated_data["pagina"]

    def representar(self, objetos):
        return self.serializer(objetos, many=True).data

    def get(self, request, pk=None):
        if pk is not None:
            return Response(self.representar([get_object_or_404(self.queryset(), pk=pk)])[0])
        queryset, pagina = self.filtros(request)
        objetos, total = paginar(queryset, pagina)
        return Response({"resultados": self.representar(objetos), "pagina": pagina, "total": total})

    def mutavel(self, pk):
        return get_object_or_404(self.queryset(), pk=pk)

    def gravar(self, request, objeto=None):
        serializer = self.serializer(objeto, data=request.data, partial=objeto is not None)
        serializer.is_valid(raise_exception=True)
        return serializer.save()

    def post(self, request, pk=None):
        if pk is not None:
            raise exceptions.MethodNotAllowed("POST")

        def criar():
            objeto = self.gravar(request)
            return self.representar([objeto])[0], 201

        dados, status = idempotente(
            request, criar, self.exige_chave or isinstance(request.data, dict) and "inicial" in request.data,
        )
        return Response(dados, status=status)

    @transaction.atomic
    def patch(self, request, pk=None):
        if pk is None:
            raise exceptions.MethodNotAllowed("PATCH")
        objeto = self.gravar(request, self.mutavel(pk))
        return Response(self.representar([objeto])[0])

    @transaction.atomic
    def delete(self, request, pk=None):
        if pk is None:
            raise exceptions.MethodNotAllowed("DELETE")
        try:
            self.mutavel(pk).delete()
        except ProtectedError:
            raise Conflito("Este registro possui transações vinculadas.")
        return Response(status=204)


class Categorias(Recurso):
    serializer = CategoriaSerializer

    def queryset(self):
        return Categoria.objects.filter(interna=False)


class Transacoes(Recurso):
    serializer = TransacaoSerializer
    exige_chave = True

    def queryset(self):
        return Transacao.objects.select_related("categoria")

    def mutavel(self, pk):
        return get_object_or_404(self.queryset(), pk=pk, tipo__in=CONVENCIONAIS)

    def filtros(self, request):
        filtro = FiltroSerializer(data=request.query_params)
        filtro.is_valid(raise_exception=True)
        dados = filtro.validated_data
        queryset = self.queryset()
        categoria = dados.get("categoria")
        if categoria == "sem_categoria":
            queryset = queryset.filter(categoria__isnull=True)
        elif categoria is not None:
            queryset = queryset.filter(categoria_id=categoria, categoria__interna=False)
        for entrada, lookup in (("tipo", "tipo"), ("data_inicio", "data__gte"), ("data_fim", "data__lte")):
            if entrada in dados:
                queryset = queryset.filter(**{lookup: dados[entrada]})
        return queryset, dados["pagina"]


class Metas(Recurso):
    serializer = MetaSerializer

    def queryset(self):
        return Meta.objects.all()

    def mutavel(self, pk):
        return get_object_or_404(self.queryset(), pk=pk, arquivada_em__isnull=True)

    def representar(self, objetos):
        reservas_metas = reservas(objetos)
        disponivel = saldos()["disponivel"]
        return [meta_json(meta, reservas_metas[meta.pk], disponivel) for meta in objetos]

    def gravar(self, request, objeto=None):
        if objeto is not None:
            return super().gravar(request, objeto)
        serializer = self.serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            return criar_meta_validada(**serializer.validated_data)
        except ValidationError as erro:
            raise exceptions.ValidationError({"inicial": erro.messages})

    @transaction.atomic
    def delete(self, request, pk=None):
        if pk is None:
            raise exceptions.MethodNotAllowed("DELETE")
        try:
            meta = encerrar(pk)
        except ValidationError as erro:
            raise Conflito(erro.messages[0])
        if meta is None:
            return Response(status=204)
        return Response(self.representar([meta])[0])


class Movimento(JSONView):
    tipo = None

    def post(self, request, pk):
        def criar():
            serializer = MovimentoSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            try:
                mov = movimentar(pk, self.tipo, serializer.validated_data["valor"])
            except ValidationError as erro:
                raise exceptions.ValidationError({"valor": erro.messages})
            return {
                "id": mov.pk, "transacao_id": mov.transacao_id, "tipo": mov.transacao.tipo,
                "valor": format(mov.transacao.valor, ".2f"), "instante": mov.transacao.instante.isoformat(),
            }, 201
        dados, status = idempotente(request, criar)
        return Response(dados, status=status)


class Historico(JSONView):
    def get(self, request, pk):
        itens, saldo = historico(get_object_or_404(Meta, pk=pk))
        return Response({"saldo": dinheiro(saldo), "resultados": [
            {"transacao_id": t.pk, "tipo": t.tipo, "valor": format(t.valor, ".2f"),
             "instante": t.instante.isoformat(), "saldo": dinheiro(acumulado)}
            for t, acumulado in itens
        ]})


class Resumo(JSONView):
    @transaction.atomic
    def get(self, request):
        periodo = mensal.periodo_da_requisicao(request)
        resumo = saldos()
        metas = list(Meta.objects.filter(arquivada_em__isnull=True))
        saldos_metas = reservas(metas)
        recentes = Transacao.objects.select_related("categoria")
        dados = {}
        if periodo:
            # Com ?mes: receitas e despesas do mês; disponível, reservado e patrimônio até o fim do mês.
            inicio, fim = periodo
            fluxo = mensal.fluxos(inicio, fim)
            posicao = mensal.posicao(fim)
            exibidos = posicao | {"receitas": fluxo["receitas"], "despesas": fluxo["despesas"]}
            recentes = recentes.filter(data__range=periodo)
            dados["mes"] = {"inicio": inicio.isoformat(), "fim": fim.isoformat()} | {
                campo: dinheiro(fluxo[campo]) for campo in ("receitas", "despesas", "reservado", "sobra")}
        else:
            exibidos = resumo
        return Response({
            "saldos": {nome: dinheiro(exibidos[nome]) for nome in resumo},
            "recentes": TransacaoSerializer(recentes[:5], many=True).data,
            "metas": [meta_json(meta, saldos_metas[meta.pk], resumo["disponivel"]) for meta in metas],
            # Base sem nenhuma transação: o dashboard oferece os dados de exemplo.
            "vazia": not Transacao.objects.exists(),
        } | dados)


class Graficos(JSONView):
    def get(self, request):
        periodo = mensal.periodo_da_requisicao(request)
        return Response(graficos(*periodo) if periodo else graficos())


class Exemplo(JSONView):
    """Carrega os dados de exemplo; só numa base sem transações."""

    def post(self, request):
        try:
            return Response(popular_exemplo(), status=201)
        except BaseComDados as erro:
            raise Conflito(str(erro))


class Insights(JSONView):
    """Até 3 frases do mês (ver api/insights.py). Sem `mes`, o mês atual."""

    def get(self, request):
        periodo = mensal.periodo_da_requisicao(request) or regras_insights.mes_atual()
        return Response(regras_insights.insights(*periodo))
