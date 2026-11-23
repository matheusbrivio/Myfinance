from django import forms

from .models import Categoria


class CategoriaForm(forms.ModelForm):
    class Meta:
        model = Categoria
        fields = ["nome", "descricao"]
        widgets = {
            "nome": forms.TextInput(attrs={"class": "form-control"}),
            "descricao": forms.Textarea(attrs={"class": "form-control", "rows": 3}),
        }

    mensagem_duplicado = "Já existe uma categoria com esse nome."

    def clean_nome(self):
        nome = self.cleaned_data["nome"]
        if Categoria.objects.filter(nome_normalizado=nome.casefold()).exclude(
            pk=self.instance.pk
        ).exists():
            raise forms.ValidationError(self.mensagem_duplicado)
        return nome
