from django.db import models


class Operacao(models.Model):
    chave = models.UUIDField(primary_key=True)
    assinatura = models.CharField(max_length=64)
    resposta = models.JSONField()
    status = models.PositiveSmallIntegerField()
