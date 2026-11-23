import re
from decimal import Decimal

from django import forms

from .fields import MAX_VALOR


class ValorField(forms.DecimalField):
    def __init__(self, label="Valor", minimo="0.01", **kwargs):
        super().__init__(
            label=label, decimal_places=2, min_value=Decimal(minimo), max_value=MAX_VALOR,
            widget=forms.TextInput(attrs={"class": "form-control", "inputmode": "decimal"}),
            **kwargs,
        )

    def to_python(self, value):
        if isinstance(value, str) and value.strip():
            value = value.strip().removeprefix("R$").strip()
            if "," in value:
                if not re.fullmatch(r"[+-]?(?:[0-9]+|[0-9]{1,3}(?:\.[0-9]{3})+),[0-9]+", value):
                    raise forms.ValidationError("Informe um valor válido.")
                value = value.replace(".", "").replace(",", ".")
            elif not re.fullmatch(r"[+-]?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)", value):
                raise forms.ValidationError("Informe um valor válido.")
        return super().to_python(value)


class DataLocalField(forms.DateField):
    def __init__(self, label="Data"):
        super().__init__(
            label=label, input_formats=["%d/%m/%Y", "%Y-%m-%d"],
            widget=forms.DateInput(format="%d/%m/%Y", attrs={
                "class": "form-control", "placeholder": "DD/MM/AAAA",
                "data-calendario": "", "autocomplete": "off",
            }),
        )
