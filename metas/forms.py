from django import forms

from transacoes.inputs import DataLocalField, ValorField

from .models import Meta


class MetaForm(forms.ModelForm):
    objetivo = ValorField("Valor objetivo")
    prazo = DataLocalField("Data limite")

    class Meta:
        model = Meta
        fields = ["nome", "descricao", "objetivo", "prazo"]
        widgets = {
            "nome": forms.TextInput(attrs={"class": "form-control"}),
            "descricao": forms.Textarea(attrs={"class": "form-control", "rows": 3}),
        }


class NovaMetaForm(MetaForm):
    inicial = ValorField("Aporte inicial", minimo="0", required=False)


class MovimentacaoForm(forms.Form):
    valor = ValorField()
