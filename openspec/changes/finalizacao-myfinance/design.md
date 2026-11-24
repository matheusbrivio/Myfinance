# Design

## Context

| Área | Confirmado na árvore atual | Previsto nesta mudança |
| --- | --- | --- |
| Saldos | `transacoes/saldos.py` soma todas as transações por tipo; `resumo/` e `graficos/` usam esse total desde o início. | Recorte por mês: fluxos do mês e posição acumulada até o fim do mês, sem alterar o cálculo atual sem `mes`. |
| Metas | `metas/services.movimentar` grava aporte ou retirada com a data de hoje e valida disponível e reserva. | Instante opcional para dados de exemplo, com as mesmas validações. |
| Transações | Listagem paginada com filtros de tipo, categoria e período. | Filtro `busca` e exportação CSV com os mesmos filtros. |
| Frontend | React com redesign claro, intro, transição e animações com Motion. | Seletor de mês, card de insights, estado vazio com dados de exemplo, paleta Ctrl+K e acabamento dos estados. |

## Goals / Non-Goals

**Goals**

- Demonstrar o sistema com dados realistas criados pelas regras existentes.
- Ler os números por mês sem mudar o comportamento atual dos endpoints.
- Explicar o mês em frases curtas, sem inventar dados quando faltar informação.

**Non-Goals**

- Contas de usuário, autenticação, service worker ou instalação como PWA.
- Mudança nas regras de saldo, reserva e progresso de metas.

## Decisions

### Capacidades novas em vez de deltas

O recorte mensal, a exportação e a busca acrescentam comportamento sem alterar os requisitos atuais de `dashboard-financeiro`, `transacoes` e `metas-financeiras`: sem os parâmetros novos, as respostas continuam iguais. Por isso ficam em capacidades novas, e só `interface-myfinance` recebe requisitos adicionais. Os requisitos novos seguem o formato sem numeração RF/RNF das mudanças mais recentes.

### Instante das movimentações de meta

`movimentar` aceita `instante` opcional apenas como parâmetro de Python. O endpoint de aportes e retiradas e o `MovimentoSerializer` não expõem esse campo: pela API, o instante continua sendo o momento da gravação.

### Recorte por mês

`mes=AAAA-MM` define o intervalo `[primeiro dia, último dia]`. Fluxos (receitas, despesas, por categoria) usam só transações do intervalo. A posição (disponível, reservado, patrimônio) acumula tudo até o último dia do mês, ou até hoje no mês atual. A distribuição do mês divide as receitas do mês entre despesas do mês, reservado líquido do mês (aportes − retiradas) e sobra; a sobra pode ser negativa. Mês inválido ou futuro devolve 400.

### Insights

Cada regra é uma função pura sobre as transações e metas, aplicada em ordem de prioridade; regras sem dados suficientes são puladas e a lista é cortada em três itens. Valores em pt-BR e meses por extenso.

### Dados de exemplo

`popular_exemplo(hoje)` usa os serializers e serviços existentes (categorias, transações, `criar_meta_validada` e `movimentar`) em ordem cronológica, de modo que a validação de saldo disponível acontece como num uso real. O endpoint recusa com 409 se já houver transações; o comando aceita `--limpar`.

### Exportação

CSV com `;`, vírgula decimal, datas DD/MM/AAAA e UTF-8 com BOM. A rota `transacoes/exportar/` fica antes de `transacoes/<pk>/` e reaproveita os filtros da listagem.

### Acesso pela rede local

`ALLOWED_HOSTS` e `CSRF_TRUSTED_ORIGINS` recebem hosts extras da variável `MYFINANCE_HOSTS`; sem ela, o padrão continua igual. O manifest e os ícones são servidos pelo Django sob `/react-assets/`.

## Risks / Trade-offs

- O recorte mensal soma em Python, como o cálculo atual. Com o volume de um uso pessoal isso é suficiente.
- A projeção de meta usa a média de aportes dos últimos 90 dias e não prevê retiradas futuras.
- Com o servidor em `0.0.0.0` (etapa G), qualquer aparelho do mesmo Wi-Fi alcança a API, que não tem autenticação desde o MVP. O endpoint de exemplo só age numa base sem transações e exige o token CSRF, então o pior caso é popular uma base vazia. O acesso pela rede local é só para a apresentação e depende de `MYFINANCE_HOSTS`.
