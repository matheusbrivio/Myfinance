from django import template

register = template.Library()


@register.filter
def moeda(centavos):
    reais, fracao = divmod(abs(centavos), 100)
    sinal = "-" if centavos < 0 else ""
    inteiro = f"{reais:,}".replace(",", ".")
    return f"{sinal}R$ {inteiro},{fracao:02d}"


@register.filter
def moeda_decimal(valor):
    return moeda(int(valor * 100))
