# Design

## Context

| Área | Confirmado na árvore atual | Previsto nesta mudança |
| --- | --- | --- |
| Rotas e UI | `config/urls.py` liga templates Django para dashboard, categorias, transações e metas. Bootstrap, Chart.js e calendário pt-BR são servidos localmente. | Rotas React, componentes reutilizáveis, identidade dark, Recharts, Motion e toasts temporizados. |
| Categorias e transações | CRUD convencional com confirmação, nomes únicos sem distinção de caixa, descrição de transação opcional e FK de categoria obrigatória com PROTECT. A lista usa data e ID decrescentes, sem filtros. | Categoria nula apenas para lançamentos convencionais, filtros via API e preservação das regras restantes. |
| Metas | `metas/services.py` grava lançamento e movimentação vinculada atomicamente e valida disponível e reserva. Já existem aporte inicial, retirada, histórico, progresso e arquivamento com reserva zerada. | Adaptar serviços para consumo REST e React, incluindo idempotência nas criações. |
| Saldos | `transacoes/saldos.py` separa receitas, despesas, aportes e retiradas. O dashboard mostra cinco recentes, cards e gráfico atual de duas classes. | Reutilizar o cálculo, incluir agregados por classe e categoria e projetar todos os detalhes do card. |
| Especificações e testes | MVP arquivado, V2 ativa com 16/16 tarefas registradas. `manage.py test` passou com 27 testes. | API DRF, frontend React e novos cenários de contrato, interface e integração. |

As três specs principais são do MVP. Para alterações em transações, dashboard e interface, a referência funcional é a V2 implementada. Seu arquivamento futuro deve preceder o da migração React para que RF19–RF21 e RNF01–RNF03 tenham alvos canônicos. Isso permite planejar e aplicar a migração de forma independente da operação de arquivamento.

## Goals / Non-Goals

**Goals**

- Usar o Django como fonte das operações, validações, cálculos e agregações.
- Manter um SQLite compartilhado durante a convivência e medir equivalência funcional antes da troca.

**Non-Goals**

- Contas individuais, autenticação, isolamento multiusuário, integrações externas e substituição do SQLite.

## Decisions

### Contrato REST

Versionar sob `/api/v1/`. Usar serializadores DRF e uma camada de serviços compartilhada com a interface anterior. Extrair a validação comum de nomes, datas, valores e referências dos caminhos atuais onde necessário. Adaptar a criação de meta, que hoje recebe um formulário, para receber dados validados de ambos os canais.

| Caminho relativo | Métodos | Conteúdo |
| --- | --- | --- |
| `resumo/` | GET | Cinco indicadores, cinco transações recentes e cards de metas ativas com progresso completo e elegibilidade de ações. |
| `graficos/` | GET | Totais absolutos de receitas, despesas, aportes e retiradas e despesas convencionais agrupadas por ID de categoria ou nulo. Cada segmento inclui nome, valor e participação arredondada. |
| `categorias/`, `categorias/{id}/` | GET, POST na coleção, PATCH e DELETE no detalhe | ID, nome e descrição. Excluir categoria vinculada continua bloqueado. Categoria interna fica fora dos seletores e do CRUD. |
| `transacoes/`, `transacoes/{id}/` | GET, POST na coleção, PATCH e DELETE no detalhe | Descrição, valor, tipo, data, categoria nula ou identificada e indicação de ação permitida. GET inclui lançamentos de metas. |
| `metas/`, `metas/{id}/` | GET, POST na coleção, PATCH e DELETE no detalhe | Nome, descrição, objetivo, prazo, criação, progresso e estado. POST admite aporte inicial. DELETE remove quando não há histórico ou arquiva com saldo zero. |
| `metas/{id}/aportes/`, `metas/{id}/retiradas/` | POST | Valor e identificadores da movimentação e da transação gerada, com data e hora. |
| `metas/{id}/historico/` | GET | Tipo, valor, instante e reserva após cada movimentação, inclusive para meta arquivada. |
| `csrf/` | GET | Inicializa a proteção CSRF para escritas da SPA. |

Sucesso retorna o recurso ou coleção paginada com `resultados`, `pagina` e `total`. Erros seguem `{erro: {codigo, mensagem, campos}}`, com mensagens em pt-BR e lista de erros por campo. Usar 400 para entrada inválida, 403 para CSRF ou origem recusada, 404 para recurso ausente ou protegido do CRUD, 405 para método inválido, 409 para conflito de estado ou de chave e 503 para contenção recuperável. Erros inesperados retornam mensagem genérica e detalhes ficam nos logs. Respostas 204 não têm corpo.

Receber e transmitir dinheiro como texto decimal canônico de duas casas, com ponto no JSON. O React localiza a entrada e a apresentação sem converter valores exatos para ponto flutuante. Transmitir datas civis em ISO e instantes com fuso. Mostrar DD/MM/AAAA, moeda brasileira e calendários pt-BR, inclusive com navegador em inglês.

### Escrita, concorrência e filtragem

- Para POST que cria transações, metas com aporte inicial, aportes ou retiradas, enviar `Idempotency-Key`. Criar registro único de chave com método, alvo, corpo canônico e resposta dentro da mesma transação da operação. Repetição equivalente devolve a resposta registrada. Reutilização divergente retorna 409. Manter a mesma chave em nova tentativa após resposta ambígua. Preservar a validação sob bloqueio de escrita SQLite usada em metas.
- Preferir mesma origem em produção e proxy do Vite em desenvolvimento. Quando origens distintas forem necessárias, usar listas explícitas para CORS e origens confiáveis CSRF, sem curingas. Aplicar proteção CSRF a métodos inseguros mesmo sem contas ou sessões autenticadas. Compartilhar cookie e cabeçalho CSRF conforme configuração Django. API pública no contexto da aplicação sem contas individuais.
- Alterar a FK com `null=True, blank=True` e manter PROTECT. Criar restrição que exige categoria nos tipos de meta. Omissão no POST equivale a nulo, omissão no PATCH preserva o vínculo, e nulo explícito remove a categoria de um lançamento convencional. Adaptar também formulário e template legados para ler e gravar nulos durante a convivência.
- Aceitar `tipo=receita|despesa`, `categoria=<id>|sem_categoria`, `data_inicio`, `data_fim` e `pagina`. Tipo e categoria omitidos equivalem a Todas e Todas as categorias. Aplicar condições em conjunto e datas inclusivas. Filtros de receita e despesa excluem movimentações de meta. A lista geral continua exibindo os quatro tipos. Filtrar antes de paginar e ordenar por data e ID decrescentes. Usar query string React como fonte dos filtros e redefinir a página ao alterar critérios.

### Frontend e cálculo

- Usar Vite, React e TypeScript com `components/`, `pages/`, `layouts/`, `services/`, `hooks/`, `types/` e `styles/`. Centralizar acesso HTTP, envelope de erro, invalidação após mutações e formatação. Tailwind define tokens de cor, tipografia, espaçamento e responsividade. shadcn/ui fornece componentes reutilizáveis de formulário, diálogo e toast.
- React Router gerencia as páginas e o filtro na URL. Sidebar desktop, navegação compacta em telas pequenas e indicação da seção ativa. Usar a descrição visual fornecida como referência de direção dark. Nenhuma imagem de referência estava disponível nesta solicitação.
- Calcular proporções no backend com centavos inteiros e um denominador por gráfico. Distribuição financeira usa receitas + despesas + aportes em magnitude absoluta. Mostrar retiradas em indicador separado. Despesas por categoria usa apenas a soma das despesas convencionais e inclui o agrupamento nulo. O Recharts recebe proporções para geometria e os valores exatos em texto para legenda e tooltip. Percentuais arredondados podem somar 99,99% ou 100,01% e os valores brutos permanecem disponíveis. Preservar RF14 e RF15 e usar o progresso individual devolvido pelo backend.
- Exibir carregamento, vazio e erro separadamente. Após mutação confirmada, invalidar as consultas afetadas de lista, resumo, gráficos, detalhe e histórico. Exibir valores textuais também quando a visualização gráfica falhar.
- Motion e CSS controlam entrada, hover, rotas, modais, barras, atualização de gráficos e saída de toasts. Começar saída automática dos avisos e sucessos em 4.000 ms, oferecer fechamento manual, manter erro de campo no campo até correção e erro crítico até dispensa. Aplicar prefers-reduced-motion também às animações do Recharts, preservando foco e mensagens.

## Risks / Trade-offs

- Dois frontends podem divergir → compartilhar serviços e executar equivalência dos fluxos com a mesma base.
- Reenvio após timeout pode duplicar transferência → validar idempotência concorrente e persistência atômica, incluindo rollback de falhas intermediárias.
- Valores muito grandes podem perder precisão em JavaScript → exibir strings exatas e usar somente proporções nos cálculos visuais.
- Schemas de V2 e React podem conflitar ao consolidar → revisar deltas na ordem MVP arquivado, V2 e React.

## Migration Plan

1. Criar backup consistente e testar a migração da FK e idempotência em cópia do SQLite. Comparar linhas, relações e totais, validar chaves estrangeiras e registrar a linha de base.
2. Implantar API e compatibilidade dos templates com a FK nula. Servir React sob rota separada e reservar o prefixo da API para JSON, inclusive em URLs inválidas.
3. Verificar integração, acessibilidade, estados de falha, navegação direta e equivalência. Depois da validação, apontar a entrada principal para React e manter rota de retorno à interface anterior pelo período de transição.
4. Em falha após a troca, reverter o roteamento para os templates compatíveis e manter o schema aditivo. Evitar reverter a FK enquanto houver valores nulos e usar o backup pré-migração para recuperação controlada, preservando gravações posteriores.
