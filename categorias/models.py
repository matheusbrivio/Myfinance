from django.db import models

class Categoria(models.Model):
    nome = models.CharField(max_length=100)
    descricao = models.CharField("descrição", max_length=500, blank=True)
    nome_normalizado = models.TextField(unique=True, editable=False)
    interna = models.BooleanField(default=False, editable=False)

    class Meta:
        ordering = ["nome", "pk"]
        constraints = [
            models.UniqueConstraint(fields=["interna"], condition=models.Q(interna=True),
                                    name="categoria_interna_unica"),
        ]

    def save(self, *, update_fields=None, **kwargs):
        if update_fields is None or "nome" in update_fields:
            self.nome_normalizado = self.nome.casefold()
            if update_fields is not None:
                update_fields = set(update_fields) | {"nome_normalizado"}
        super().save(update_fields=update_fields, **kwargs)

    def __str__(self):
        return self.nome
