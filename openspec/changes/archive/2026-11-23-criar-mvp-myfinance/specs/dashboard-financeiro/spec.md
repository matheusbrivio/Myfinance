# Dashboard financeiro

## Purpose

Mostra a situação financeira atual com base nas receitas e despesas registradas no MyFinance.

## ADDED Requirements

### Requirement: RF09 Exibir e atualizar totais

O sistema SHALL exibir a soma das receitas, a soma das despesas e a diferença entre elas, com duas casas decimais e usando as transações persistidas ao carregar o dashboard.

#### Scenario: Totais e saldo negativo

- **WHEN** existem receitas de 100,10 e 50,20 e uma despesa de 200,40
- **THEN** o dashboard exibe receitas de 150,30, despesas de 200,40 e saldo de -50,10

#### Scenario: Resumo sem transações

- **WHEN** o usuário abre o dashboard sem transações
- **THEN** o dashboard exibe 0,00 nos três totais

#### Scenario: Atualizar após cadastro, edição e exclusão

- **WHEN** partindo de uma base vazia, o usuário cadastra receita de 100,00, edita para despesa de 30,00 e depois exclui a transação, consultando o dashboard após cada operação
- **THEN** os totais de receitas, despesas e saldo são respectivamente 100,00, 0,00 e 100,00 após o cadastro, depois 0,00, 30,00 e -30,00 após a edição, e 0,00 nos três totais após a exclusão

#### Scenario: Operação inválida não altera totais

- **WHEN** o servidor rejeita a edição de uma despesa de 30,00 para valor zero
- **THEN** o dashboard continua apresentando os totais calculados com a despesa de 30,00
