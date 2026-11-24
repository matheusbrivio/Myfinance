from django.urls import path, re_path

from transacoes.models import Transacao
from . import views

urlpatterns = [
    path("csrf/", views.CSRF.as_view()),
    path("resumo/", views.Resumo.as_view()),
    path("graficos/", views.Graficos.as_view()),
    path("exemplo/", views.Exemplo.as_view()),
    path("insights/", views.Insights.as_view()),
    path("categorias/", views.Categorias.as_view()),
    path("categorias/<int:pk>/", views.Categorias.as_view()),
    path("transacoes/", views.Transacoes.as_view()),
    # Antes de transacoes/<pk>/ por clareza (o conversor int já não casaria "exportar").
    path("transacoes/exportar/", views.ExportarTransacoes.as_view()),
    path("transacoes/<int:pk>/", views.Transacoes.as_view()),
    path("metas/", views.Metas.as_view()),
    path("metas/<int:pk>/", views.Metas.as_view()),
    path("metas/<int:pk>/aportes/", views.Movimento.as_view(tipo=Transacao.Tipo.APORTE_META)),
    path("metas/<int:pk>/retiradas/", views.Movimento.as_view(tipo=Transacao.Tipo.RETIRADA_META)),
    path("metas/<int:pk>/historico/", views.Historico.as_view()),
    re_path(r"^.*$", views.Inexistente.as_view()),
]
