import os
from pathlib import Path
import subprocess
import sys
from tempfile import TemporaryDirectory

from django.test import SimpleTestCase


class IdempotenciaConcorrenteTest(SimpleTestCase):
    def test_mesma_chave_em_duas_conexoes_sqlite(self):
        with TemporaryDirectory() as pasta:
            subprocess.run([sys.executable, "-c", """
from concurrent.futures import ThreadPoolExecutor
from datetime import date
from threading import Barrier
from uuid import uuid4
import os
import django
from django.conf import settings
settings.DATABASES["default"]["NAME"] = os.environ["MYFINANCE_TEST_DB"]
django.setup()
from django.core.management import call_command
from django.db import connections
from django.test import Client
from metas.models import Meta, MovimentacaoMeta
from transacoes.models import Transacao

call_command("migrate", verbosity=0)
Transacao.objects.create(tipo="receita", valor=100, data=date(2026, 11, 23))
meta = Meta.objects.create(nome="Viagem", objetivo=100, prazo=date(2027, 12, 31))
chave = str(uuid4())
inicio = Barrier(2)
def enviar(_):
    try:
        cliente = Client(HTTP_HOST="localhost", enforce_csrf_checks=True)
        token = cliente.get("/api/v1/csrf/").json()["token"]
        inicio.wait(timeout=5)
        r = cliente.post(f"/api/v1/metas/{meta.pk}/aportes/", {"valor": "80.00"},
                         "application/json", HTTP_IDEMPOTENCY_KEY=chave, HTTP_X_CSRFTOKEN=token)
        assert r.status_code == 201, r.content
        return r.json()
    finally:
        connections.close_all()
with ThreadPoolExecutor(max_workers=2) as executor:
    a, b = executor.map(enviar, range(2))
assert a == b and MovimentacaoMeta.objects.count() == 1
"""], env=dict(os.environ, MYFINANCE_TEST_DB=str(Path(pasta) / "api.sqlite3")),
                check=True, timeout=30)
