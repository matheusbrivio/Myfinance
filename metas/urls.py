from django.urls import path

from transacoes.models import Transacao

from . import views

app_name = "metas"
urlpatterns = [
    path("", views.lista, name="lista"),
    path("nova/", views.formulario, name="nova"),
    path("<int:pk>/", views.detalhe, name="detalhe"),
    path("<int:pk>/editar/", views.formulario, name="editar"),
    path("<int:pk>/excluir/", views.excluir, name="excluir"),
    path("<int:pk>/aportar/", views.movimento, {"tipo": Transacao.Tipo.APORTE_META}, name="aportar"),
    path("<int:pk>/retirar/", views.movimento, {"tipo": Transacao.Tipo.RETIRADA_META}, name="retirar"),
]
