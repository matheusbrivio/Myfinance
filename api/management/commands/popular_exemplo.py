from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from api.exemplo import BaseComDados, limpar_base, popular_exemplo


class Command(BaseCommand):
    help = "Cria categorias, transações dos 3 últimos meses e metas de exemplo para a demonstração."

    def add_arguments(self, parser):
        parser.add_argument("--limpar", action="store_true",
                            help="Apaga transações, metas e categorias antes de criar os dados de exemplo.")

    def handle(self, *args, limpar=False, **options):
        # Limpar e popular na mesma transação: se algo falhar, a base volta como estava.
        try:
            with transaction.atomic():
                if limpar:
                    limpar_base()
                criados = popular_exemplo()
        except BaseComDados:
            raise CommandError("A base já tem transações. Use --limpar para apagar tudo e recriar os dados de exemplo.")
        self.stdout.write(self.style.SUCCESS(
            f"Dados de exemplo criados: {criados['categorias']} categorias, "
            f"{criados['transacoes']} transações e {criados['metas']} metas."
        ))
