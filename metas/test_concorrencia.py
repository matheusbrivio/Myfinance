import os
from pathlib import Path
import subprocess
import sys
from tempfile import TemporaryDirectory

from django.test import SimpleTestCase


class ConcorrenciaTests(SimpleTestCase):
    def test_duas_conexoes_disputam_o_mesmo_saldo(self):
        with TemporaryDirectory() as diretorio:
            subprocess.run(
                [sys.executable, "-c", """
from concurrent.futures import ThreadPoolExecutor
from datetime import date
from decimal import Decimal
from threading import Barrier
import os

import django
from django.conf import settings
settings.DATABASES["default"]["NAME"] = os.environ["MYFINANCE_TEST_DB"]
django.setup()

from django.core.exceptions import ValidationError
from django.core.management import call_command
from django.db import connections
from categorias.models import Categoria
from metas.models import Meta
from metas.services import movimentar
from transacoes.models import Transacao
from transacoes.saldos import saldos

call_command("migrate", verbosity=0)
data = date(2026, 12, 23)
categoria = Categoria.objects.create(nome="Casa")
Transacao.objects.create(tipo="receita", valor=100, data=data, categoria=categoria)
metas = [Meta.objects.create(nome=f"Meta {i}", objetivo=100, prazo=data) for i in range(2)]

def disputar(tipo, ids, valor):
    inicio = Barrier(2)

    def gravar(pk):
        try:
            inicio.wait(timeout=5)
            movimentar(pk, tipo, Decimal(valor))
        except ValidationError:
            return False
        else:
            return True
        finally:
            connections.close_all()

    with ThreadPoolExecutor(max_workers=2) as executor:
        assert sorted(executor.map(gravar, ids)) == [False, True]

disputar(Transacao.Tipo.APORTE_META, [meta.pk for meta in metas], "80")
assert saldos()["disponivel"] == 2000
meta = Meta.objects.get(movimentacoes__isnull=False)
movimentar(meta.pk, Transacao.Tipo.APORTE_META, Decimal("20"))
disputar(Transacao.Tipo.RETIRADA_META, [meta.pk, meta.pk], "80")
assert saldos()["reservado"] == 2000
assert Transacao.objects.filter(tipo=Transacao.Tipo.RETIRADA_META).count() == 1
"""],
                env=dict(os.environ, MYFINANCE_TEST_DB=str(Path(diretorio) / "concorrencia.sqlite3")),
                check=True, timeout=30,
            )
