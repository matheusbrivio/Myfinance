from django.http import JsonResponse

from .http import envelope


class ErroAPI:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        return self.get_response(request)

    def process_exception(self, request, exc):
        if request.path.startswith("/api/"):
            import logging
            logging.getLogger(__name__).exception("Erro interno na API")
            return JsonResponse(envelope("interno", "Não foi possível concluir a solicitação."), status=500)
        return None
