from pathlib import Path
from tempfile import TemporaryDirectory
import os
import sqlite3
import subprocess
import sys

from django.test import SimpleTestCase


class MigracaoMonetariaTests(SimpleTestCase):
    def test_preserva_linhas_do_mvp(self):
        with TemporaryDirectory() as diretorio:
            caminho = Path(diretorio) / "legado.sqlite3"

            def migrar(*alvo):
                subprocess.run(
                    [sys.executable, "-c", """
import os, sys, django
from django.conf import settings
settings.DATABASES['default']['NAME'] = os.environ['MYFINANCE_TEST_DB']
django.setup()
from django.core.management import call_command
call_command('migrate', *sys.argv[1:], verbosity=0)
""", *alvo],
                    env=dict(os.environ, MYFINANCE_TEST_DB=str(caminho)), check=True,
                )

            migrar("transacoes", "0001_initial")
            with closing(sqlite3.connect(caminho)) as sql, sql:
                sql.execute(
                    "INSERT INTO categorias_categoria (id, nome, descricao, nome_normalizado) VALUES (7, 'Casa', '', 'casa')"
                )
                for pk, valor in enumerate([1, 9223372036854775807, 9223372036854775807], 1):
                    sql.execute(
                        "INSERT INTO transacoes_transacao VALUES (?, 'Legado', ?, 'receita', '2026-11-23', 7)",
                        (pk, valor),
                    )
            migrar()
            with closing(sqlite3.connect(caminho)) as sql:
                linhas = sql.execute(
                    "SELECT id, descricao, valor, tipo, data, categoria_id FROM transacoes_transacao ORDER BY id"
                ).fetchall()
            self.assertEqual(linhas, [
                (1, "Legado", 1, "receita", "2026-11-23", 7),
                (2, "Legado", 9223372036854775807, "receita", "2026-11-23", 7),
                (3, "Legado", 9223372036854775807, "receita", "2026-11-23", 7),
            ])
            self.assertEqual(sum(linha[2] for linha in linhas), 18446744073709551615)
from contextlib import closing
