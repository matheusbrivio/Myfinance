from django import forms

from categorias.models import Categoria

from .inputs import DataLocalField, ValorField
from .models import Transacao


class TransacaoForm(forms.ModelForm):
    valor = ValorField()
    data = DataLocalField()
    tipo = forms.ChoiceField(
        choices=[("", "---------"), (Transacao.Tipo.RECEITA, "Receita"),
                 (Transacao.Tipo.DESPESA, "Despesa")],
        widget=forms.Select(attrs={"class": "form-select"}),
    )
    categoria = forms.ModelChoiceField(
        queryset=Categoria.objects.filter(interna=False),
        required=False, empty_label="Sem categoria",
        widget=forms.Select(attrs={"class": "form-select"}),
    )

    class Meta:
        model = Transacao
        fields = ["descricao", "valor", "tipo", "data", "categoria"]
        widgets = {"descricao": forms.TextInput(attrs={"class": "form-control"})}

