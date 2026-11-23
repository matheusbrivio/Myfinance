"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import include, path, re_path

from transacoes.views import dashboard
from api.views import Inexistente
from .frontend import assets, entrada, react

urlpatterns = [
    path("api/v1/", include("api.urls")),
    re_path(r"^api/.*$", Inexistente.as_view()),
    path("admin/", admin.site.urls),
    path("", entrada),
    path("django/", dashboard, name="dashboard"),
    path("react-assets/<path:path>", assets),
    re_path(r"^app/(?P<caminho>.*)$", react),
    path("categorias/", include("categorias.urls")),
    path("transacoes/", include("transacoes.urls")),
    path("metas/", include("metas.urls")),
]
