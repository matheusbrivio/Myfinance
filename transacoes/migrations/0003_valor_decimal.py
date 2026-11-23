from django.db import migrations, models

from transacoes.fields import ValorMonetarioField


def copiar_centavos(apps, schema_editor):
    tabela = schema_editor.quote_name(apps.get_model("transacoes", "Transacao")._meta.db_table)
    with schema_editor.connection.cursor() as cursor:
        cursor.execute(f"UPDATE {tabela} SET valor = valor_centavos")
        cursor.execute(f"SELECT COUNT(*) FROM {tabela} WHERE valor IS NULL OR valor != valor_centavos")
        if cursor.fetchone()[0]:
            raise RuntimeError("Divergência na migração dos valores monetários.")


class Migration(migrations.Migration):
    dependencies = [("transacoes", "0002_descricao_opcional")]

    operations = [
        migrations.AddField("transacao", "valor", ValorMonetarioField(null=True)),
        migrations.RunPython(copiar_centavos),
        migrations.RemoveConstraint("transacao", "transacao_valor_positivo"),
        migrations.RemoveField("transacao", "valor_centavos"),
        migrations.AlterField("transacao", "valor", ValorMonetarioField()),
        migrations.AddConstraint("transacao", models.CheckConstraint(
            condition=models.Q(valor__gt=0), name="transacao_valor_positivo",
        )),
    ]
