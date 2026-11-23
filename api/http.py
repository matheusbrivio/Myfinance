from hashlib import sha256
import json
from uuid import UUID

from django.db import OperationalError, transaction
from django.http import JsonResponse
from rest_framework import exceptions
from rest_framework.views import exception_handler

from .models import Operacao


class Conflito(exceptions.APIException):
    status_code = 409
    default_code = "conflito"


def envelope(codigo, mensagem, campos=None):
    return {"erro": {"codigo": codigo, "mensagem": mensagem, "campos": campos or {}}}


def csrf_falhou(request, reason=""):
    if request.path.startswith("/api/"):
        return JsonResponse(envelope("csrf", "Não foi possível validar a origem ou o token CSRF."), status=403)
    from django.views.csrf import csrf_failure
    return csrf_failure(request, reason)


def api_exception_handler(exc, context):
    if isinstance(exc, OperationalError) and any(x in str(exc).lower() for x in ("locked", "busy")):
        return JsonResponse(envelope("ocupado", "Há outra operação em curso. Tente novamente."), status=503)
    resposta = exception_handler(exc, context)
    if resposta is None:
        return None
    if isinstance(exc, exceptions.ValidationError):
        dados = resposta.data if isinstance(resposta.data, dict) else {"non_field_errors": resposta.data}
        campos = {k: v if isinstance(v, list) else [v] for k, v in dados.items()}
        resposta.data = envelope("invalid", "Corrija os campos indicados.", campos)
    else:
        mensagens = {
            400: "A requisição é inválida.", 403: "Operação não permitida.",
            404: "Recurso não encontrado ou indisponível.", 405: "Método não permitido.",
            415: "Formato de requisição não suportado.",
        }
        mensagem = str(exc.detail) if isinstance(exc, Conflito) else mensagens.get(
            resposta.status_code, "Não foi possível concluir a solicitação."
        )
        resposta.data = envelope(getattr(exc, "default_code", "erro"), mensagem)
    return resposta


@transaction.atomic
def idempotente(request, operacao, obrigatoria=True):
    chave = request.headers.get("Idempotency-Key")
    if chave is None and not obrigatoria:
        return operacao()
    try:
        chave = UUID(chave or "")
    except ValueError:
        raise exceptions.ValidationError({"chave": "Informe uma chave de idempotência UUID válida."})
    canonico = json.dumps([request.method, request.path, request.data], sort_keys=True, ensure_ascii=False)
    assinatura = sha256(canonico.encode()).hexdigest()
    anterior = Operacao.objects.filter(pk=chave).first()
    if anterior:
        if anterior.assinatura != assinatura:
            raise Conflito("Esta chave já foi usada para outra operação.")
        return anterior.resposta, anterior.status
    dados, status = operacao()
    Operacao.objects.create(chave=chave, assinatura=assinatura, resposta=dados, status=status)
    return dados, status
