from django.db import models

from .fields import ValorMonetarioField

class Transacao(models.Model):
    class Tipo(models.TextChoices):
        RECEITA = "receita", "Receita"
        DESPESA = "despesa", "Despesa"
        APORTE_META = "aporte_meta", "Aporte para meta"
        RETIRADA_META = "retirada_meta", "Retirada de meta"

    descricao = models.CharField("descrição", max_length=200, blank=True)
    valor = ValorMonetarioField()
    tipo = models.CharField(max_length=13, choices=Tipo.choices)
    data = models.DateField()
    instante = models.DateTimeField(null=True, blank=True, editable=False)
    categoria = models.ForeignKey("categorias.Categoria", on_delete=models.PROTECT, null=True, blank=True)

    class Meta:
        ordering = ["-data", "-pk"]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(tipo__in=["receita", "despesa"]) | models.Q(categoria__isnull=False),
                name="transacao_meta_exige_categoria",
            ),
            models.CheckConstraint(condition=models.Q(valor__gt=0),
                                   name="transacao_valor_positivo"),
            models.CheckConstraint(condition=models.Q(tipo__in=[
                "receita", "despesa", "aporte_meta", "retirada_meta",
            ]),
                                   name="transacao_tipo_valido"),
        ]

    def __str__(self):
        return self.descricao or "Sem descrição"

    @property
    def convencional(self):
        return self.tipo in (self.Tipo.RECEITA, self.Tipo.DESPESA)
