from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import models

MAX_VALOR = Decimal("92233720368547758.07")


class ValorMonetarioField(models.DecimalField):
    """Decimal em reais no ORM, centavos inteiros no SQLite."""

    def __init__(self, *args, max_digits=19, decimal_places=2, **kwargs):
        super().__init__(*args, max_digits=max_digits, decimal_places=decimal_places, **kwargs)

    def get_internal_type(self):
        return "BigIntegerField"

    def get_db_prep_value(self, value, connection, prepared=False):
        value = self.to_python(value)
        if value is None:
            return None
        if abs(value) > MAX_VALOR:
            raise ValidationError("O valor excede o limite monetário.")
        if value.as_tuple().exponent < -2:
            raise ValidationError("Informe um valor com até duas casas decimais.")
        return int(value * 100)

    def from_db_value(self, value, expression, connection):
        return None if value is None else Decimal(value).scaleb(-2)
