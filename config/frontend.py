from django.conf import settings
from django.http import FileResponse, Http404
from django.shortcuts import redirect
from django.views.static import serve

from transacoes.views import dashboard


DIST = settings.BASE_DIR / "frontend" / "dist"


def react(request, caminho=""):
    index = DIST / "index.html"
    if not index.is_file():
        raise Http404("O frontend React ainda não foi compilado.")
    return FileResponse(index.open("rb"), content_type="text/html")


def assets(request, path):
    return serve(request, path, document_root=DIST / "react-assets")


def entrada(request):
    if settings.MYFINANCE_REACT_DEFAULT and (DIST / "index.html").is_file():
        return redirect("/app/")
    return dashboard(request)
