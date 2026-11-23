# API MyFinance v1

Base `/api/v1/`. Datas civis usam AAAA-MM-DD e valores monetários usam texto com duas casas e ponto decimal.

| Recurso | Métodos |
| --- | --- |
| `csrf/` | GET |
| `resumo/`, `graficos/` | GET |
| `categorias/`, `transacoes/`, `metas/` | GET, POST |
| `categorias/{id}/`, `transacoes/{id}/`, `metas/{id}/` | GET, PATCH, DELETE |
| `metas/{id}/historico/` | GET |
| `metas/{id}/aportes/`, `metas/{id}/retiradas/` | POST |

Exemplo de criação de transação, com `Idempotency-Key` e `X-CSRFToken`:

```json
{"tipo":"despesa","descricao":"Mercado","valor":"52.90","data":"2026-11-23","categoria":null}
```

Resposta 201:

```json
{"id":7,"tipo":"despesa","descricao":"Mercado","valor":"52.90","data":"2026-11-23","categoria":null,"categoria_nome":null,"convencional":true}
```

No POST, categoria omitida equivale a nulo. No PATCH, omissão mantém a categoria e nulo remove o vínculo. Categorias recebem nome e descrição. Metas recebem nome, descrição, objetivo e prazo, e aceitam inicial no POST. Aportes e retiradas recebem `{"valor":"20.00"}`.

Listas usam `{"resultados":[],"pagina":1,"total":0}`. Transações aceitam `tipo=receita|despesa`, `categoria=<id>|sem_categoria`, `data_inicio`, `data_fim` e `pagina`. Datas são inclusivas e a maior data e o maior ID vêm primeiro.

Exemplo de erro 400:

```json
{"erro":{"codigo":"invalid","mensagem":"Corrija os campos indicados.","campos":{"valor":["O aporte excede o saldo disponível."]}}}
```

Consultas e edições retornam 200, criações 201, exclusões físicas 204 sem corpo e arquivamento de meta 200 com a meta. Usar 403 para CSRF ou origem, 404 para recursos indisponíveis, 405 para método, 409 para conflito e 503 para contenção.

Reutilize a mesma chave ao repetir um POST financeiro cujo resultado seja incerto. Uma chave já usada com corpo ou alvo divergente retorna 409. O Django valida as regras financeiras. O sistema é uma aplicação sem contas individuais.
