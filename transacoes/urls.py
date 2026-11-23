from django.urls import path

from . import views

app_name = "transacoes"
urlpatterns = [
    path("", views.lista, name="lista"),
    path("nova/", views.formulario, name="nova"),
    path("<int:pk>/editar/", views.formulario, name="editar"),
    path("<int:pk>/excluir/", views.excluir, name="excluir"),
]
