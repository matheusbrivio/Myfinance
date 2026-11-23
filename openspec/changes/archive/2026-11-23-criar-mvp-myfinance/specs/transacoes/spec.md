# Transações

## Purpose

Registra receitas e despesas com valores monetários decimais e vínculo obrigatório a uma categoria existente.

## ADDED Requirements

### Requirement: RF05 Cadastrar transação

O sistema SHALL cadastrar transações com descrição obrigatória de até 200 caracteres, valor decimal obrigatório maior que zero com precisão de duas casas, tipo receita ou despesa, data válida e categoria existente, ambos obrigatórios. Uma categoria pode estar vinculada a várias transações.

#### Scenario: Cadastro válido

- **WHEN** o usuário cadastra uma receita e uma despesa na mesma categoria, com descrição de até 200 caracteres, datas válidas e valores 10 e 0,01
- **THEN** ambas são persistidas na categoria, com valores apresentados como 10,00 e 0,01

#### Scenario: Campos obrigatórios ausentes

- **WHEN** o usuário omite cada campo obrigatório em um envio separado ou envia descrição composta só por espaços
- **THEN** o servidor indica o campo correspondente e não cria transação

#### Scenario: Campos inválidos

- **WHEN** o usuário envia, separadamente, descrição com 201 caracteres, valor não numérico, zero, negativo ou com três casas decimais, tipo diferente de receita ou despesa, data inválida ou categoria inexistente
- **THEN** o servidor indica o campo inválido e não cria transação

### Requirement: RF06 Listar transações

O sistema SHALL exibir descrição, valor com duas casas decimais, tipo, data e categoria de cada transação, em ordem decrescente de data, com ações para editar e excluir.

#### Scenario: Listagem ordenada

- **WHEN** o usuário abre a lista após cadastrar transações com datas diferentes em ordem não cronológica
- **THEN** a lista exibe os cinco campos, da data mais recente à mais antiga, com ações para cada linha

#### Scenario: Lista vazia

- **WHEN** o usuário abre a lista sem transações cadastradas
- **THEN** a página responde com sucesso, indica a ausência de transações e não apresenta ações para registros inexistentes

### Requirement: RF07 Editar transação

O sistema SHALL permitir alterar descrição, valor, tipo, data e categoria de uma transação, aplicando as mesmas validações do RF05.

#### Scenario: Edição válida

- **WHEN** o usuário altera os cinco campos de uma transação para valores válidos, incluindo uma nova categoria existente
- **THEN** a listagem apresenta todos os novos dados na posição correspondente à nova data

#### Scenario: Edição inválida

- **WHEN** o usuário tenta salvar uma edição com qualquer campo ausente ou inválido conforme RF05
- **THEN** o servidor indica o campo correspondente e preserva todos os dados persistidos da transação

#### Scenario: Transação inexistente

- **WHEN** o usuário tenta editar uma transação inexistente
- **THEN** o sistema responde com HTTP 404 e não altera registros

### Requirement: RF08 Excluir transação

O sistema SHALL solicitar confirmação antes de excluir uma transação.

#### Scenario: Exclusão confirmada

- **WHEN** o usuário abre a confirmação e confirma a exclusão
- **THEN** a abertura preserva o registro e a confirmação remove apenas a transação selecionada

#### Scenario: Exclusão cancelada

- **WHEN** o usuário abre a confirmação e cancela
- **THEN** a transação continua na listagem

#### Scenario: Transação inexistente

- **WHEN** o usuário tenta confirmar a exclusão de uma transação já removida
- **THEN** o sistema responde com HTTP 404 e preserva os demais registros
