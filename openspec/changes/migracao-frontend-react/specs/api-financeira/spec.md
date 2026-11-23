# API financeira

## Purpose

Disponibiliza consultas e operações financeiras com contratos JSON estáveis e validação no Django.

## ADDED Requirements

### Requirement: Operações REST e respostas JSON

O sistema SHALL expor resumo, agregados, CRUD de categorias e transações convencionais, gestão de metas, aportes, retiradas e histórico. Retornar JSON conforme o contrato, com erros em pt-BR, códigos HTTP adequados e associações de erro por campo.

#### Scenario: CRUD e consultas

- **GIVEN** existem dados válidos
- **WHEN** o cliente lista e consulta recursos, cria, edita e confirma exclusões permitidas
- **THEN** recebe 200 para consultas e atualizações, 201 para criação, 204 sem corpo para exclusão física e 200 com representação quando a meta for arquivada

#### Scenario: Erros previsíveis

- **GIVEN** o cliente envia JSON inválido, um campo inválido, usa método não suportado ou pede recurso inexistente
- **WHEN** a API processa cada requisição
- **THEN** retorna respectivamente 400, 400 com campo, 405 e 404 em JSON e sem rastreamento interno

#### Scenario: Regras de domínio

- **GIVEN** uma categoria está em uso ou uma meta tem reserva positiva
- **WHEN** o cliente tenta excluí-la ou encerrá-la
- **THEN** recebe 409 compreensível e os vínculos e dados permanecem íntegros

#### Scenario: Reutilizar regras financeiras

- **GIVEN** há transação de meta e saldo insuficiente para novo aporte
- **WHEN** o cliente tenta editar a transação pelo CRUD e enviar aporte acima do disponível
- **THEN** a edição é recusada e o aporte recebe erro associado ao valor, sem mudança em saldos e histórico

### Requirement: Proteger escritas e evitar duplicidade

O sistema SHALL aplicar CSRF às escritas originadas no navegador e restringir CORS às origens explicitamente autorizadas. Tornar repetíveis com a mesma chave as criações que podem gerar lançamento, incluindo aportes, retiradas e criação de meta com aporte inicial.

#### Scenario: Repetição após resposta perdida

- **GIVEN** um aporte válido foi gravado e o cliente perdeu a resposta
- **WHEN** repete a mesma operação e o mesmo corpo com a mesma chave, inclusive em solicitações concorrentes
- **THEN** há uma única movimentação e um único lançamento, e o resultado é recuperável com os mesmos identificadores

#### Scenario: Chave reutilizada com outro conteúdo

- **GIVEN** uma operação já foi gravada para a chave
- **WHEN** o cliente repete a chave com outro valor ou alvo
- **THEN** recebe 409 e nenhuma segunda gravação ocorre

#### Scenario: Origem ou token inválido

- **GIVEN** a origem não consta da lista permitida ou o token CSRF falta
- **WHEN** o navegador tenta executar uma operação de escrita
- **THEN** a requisição é recusada sem efeitos financeiros e sem expor detalhes internos
