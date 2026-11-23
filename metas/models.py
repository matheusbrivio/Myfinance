from django.db import models

from transacoes.fields import ValorMonetarioField


class Meta(models.Model):
    nome = models.CharField(max_length=180)
    descricao = models.TextField("descrição", blank=True)
    objetivo = ValorMonetarioField("valor objetivo")
    prazo = models.DateField("data limite")
    criada_em = models.DateTimeField(auto_now_add=True)
    arquivada_em = models.DateTimeField(null=True, blank=True, editable=False)

    class Meta:
        ordering = ["prazo", "pk"]
        constraints = [
            models.CheckConstraint(condition=models.Q(objetivo__gt=0), name="meta_objetivo_positivo"),
        ]

    def __str__(self):
        return self.nome


class MovimentacaoMeta(models.Model):
    meta = models.ForeignKey(Meta, on_delete=models.PROTECT, related_name="movimentacoes")
    transacao = models.OneToOneField("transacoes.Transacao", on_delete=models.PROTECT)
