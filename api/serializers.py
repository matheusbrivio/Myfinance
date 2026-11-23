from decimal import Decimal
import re

from rest_framework import serializers

from categorias.models import Categoria
from metas.models import Meta
from transacoes.fields import MAX_VALOR
from transacoes.models import Transacao


CONVENCIONAIS = (Transacao.Tipo.RECEITA, Transacao.Tipo.DESPESA)


class Valor(serializers.DecimalField):
    def __init__(self, minimo="0.01", **kwargs):
        super().__init__(max_digits=19, decimal_places=2, min_value=Decimal(minimo),
                         max_value=MAX_VALOR, **kwargs)

    def to_internal_value(self, value):
        if not isinstance(value, str) or not re.fullmatch(r"[0-9]+(?:\.[0-9]{1,2})?", value):
            raise serializers.ValidationError("Informe um valor com até duas casas decimais.")
        return super().to_internal_value(value)


class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ["id", "nome", "descricao"]

    def validate_nome(self, nome):
        categorias = Categoria.objects.filter(nome_normalizado=nome.casefold())
        if self.instance:
            categorias = categorias.exclude(pk=self.instance.pk)
        if categorias.exists():
            raise serializers.ValidationError("Já existe uma categoria com esse nome.")
        return nome


class TransacaoSerializer(serializers.ModelSerializer):
    valor = Valor()
    categoria = serializers.PrimaryKeyRelatedField(
        queryset=Categoria.objects.filter(interna=False), allow_null=True, required=False,
    )
    categoria_nome = serializers.CharField(source="categoria.nome", read_only=True, allow_null=True)
    convencional = serializers.BooleanField(read_only=True)

    class Meta:
        model = Transacao
        fields = ["id", "tipo", "descricao", "valor", "data", "categoria", "categoria_nome", "convencional"]

    def validate_tipo(self, tipo):
        if tipo not in CONVENCIONAIS:
            raise serializers.ValidationError("Selecione Receita ou Despesa.")
        return tipo


class MetaSerializer(serializers.ModelSerializer):
    objetivo = Valor()
    inicial = Valor(minimo="0", required=False, write_only=True)

    class Meta:
        model = Meta
        fields = ["id", "nome", "descricao", "objetivo", "prazo", "criada_em", "arquivada_em", "inicial"]
        read_only_fields = ["criada_em", "arquivada_em"]

    def validate_inicial(self, valor):
        if self.instance is not None:
            raise serializers.ValidationError("O aporte inicial só pode ser informado no cadastro.")
        return valor


class MovimentoSerializer(serializers.Serializer):
    valor = Valor()


class FiltroSerializer(serializers.Serializer):
    tipo = serializers.ChoiceField(choices=CONVENCIONAIS, required=False)
    categoria = serializers.CharField(required=False)
    data_inicio = serializers.DateField(required=False)
    data_fim = serializers.DateField(required=False)
    pagina = serializers.IntegerField(min_value=1, required=False, default=1)

    def validate_categoria(self, valor):
        if valor == "sem_categoria":
            return valor
        if len(valor) > 19 or not valor.isascii() or not valor.isdigit() or not 0 < int(valor) < 2**63:
            raise serializers.ValidationError("Informe uma categoria válida.")
        return int(valor)

    def validate(self, dados):
        inicio, fim = dados.get("data_inicio"), dados.get("data_fim")
        if inicio and fim and inicio > fim:
            raise serializers.ValidationError({"data_fim": "A data final deve ser igual ou posterior à inicial."})
        return dados
