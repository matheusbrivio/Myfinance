# categorias Specification

## Purpose

Permite organizar receitas e despesas com categorias reutilizáveis e preserva os vínculos das transações.

## Requirements

### Requirement: RF01 Cadastrar categoria

O sistema SHALL cadastrar categorias com nome obrigatório de até 100 caracteres, único sem distinção de maiúsculas e minúsculas, e descrição opcional de até 500 caracteres.

#### Scenario: Cadastro válido

- **WHEN** o usuário envia um nome novo com 100 caracteres e uma descrição com 500 caracteres, ou deixa a descrição em branco
- **THEN** a categoria é persistida e aparece na listagem

#### Scenario: Campos inválidos

- **WHEN** o usuário envia nome ausente, vazio ou composto só por espaços, nome com 101 caracteres ou descrição com 501 caracteres, em envios separados
- **THEN** cada envio exibe erro no campo correspondente e nenhuma categoria é criada

#### Scenario: Nome duplicado

- **WHEN** já existe a categoria “Alimentação” e o usuário tenta cadastrar “ALIMENTAÇÃO”
- **THEN** o formulário exibe erro no nome e mantém apenas a categoria existente

### Requirement: RF02 Listar categorias

O sistema SHALL exibir o nome e a descrição de cada categoria e oferecer ações para editar e excluir o registro correspondente.

#### Scenario: Lista com registros

- **WHEN** o usuário abre a lista com categorias cadastradas
- **THEN** a página exibe cada nome e descrição e as ações de edição e exclusão da categoria correspondente

#### Scenario: Lista vazia

- **WHEN** o usuário abre a lista sem categorias cadastradas
- **THEN** a página responde com sucesso, informa que a lista está vazia e não exibe ações para registros inexistentes

### Requirement: RF03 Editar categoria

O sistema SHALL permitir editar nome e descrição com as validações do RF01, desconsiderando a própria categoria na verificação de duplicidade.

#### Scenario: Edição válida

- **WHEN** o usuário altera nome e descrição para valores válidos, inclusive quando só muda a capitalização do próprio nome
- **THEN** a listagem exibe os novos dados e as transações continuam vinculadas à mesma categoria

#### Scenario: Edição inválida

- **WHEN** o usuário envia cada valor inválido do RF01 ou usa um nome equivalente ao de outra categoria
- **THEN** o formulário exibe erro no campo correspondente e os dados persistidos permanecem iguais

#### Scenario: Categoria inexistente

- **WHEN** o usuário tenta editar uma categoria que não existe
- **THEN** o sistema responde com HTTP 404 e não altera registros

### Requirement: RF04 Excluir categoria

O sistema SHALL solicitar confirmação e excluir a categoria somente após confirmação e quando não houver transações vinculadas.

#### Scenario: Exclusão confirmada

- **WHEN** o usuário abre a confirmação para categoria sem vínculos e confirma
- **THEN** a abertura preserva a categoria e a confirmação a remove da listagem

#### Scenario: Exclusão cancelada

- **WHEN** o usuário cancela a confirmação
- **THEN** a categoria permanece disponível

#### Scenario: Categoria em uso

- **WHEN** o usuário confirma a exclusão de uma categoria vinculada a uma ou mais transações, inclusive quando o vínculo foi criado após abrir a confirmação
- **THEN** o sistema informa o impedimento e preserva a categoria e suas transações
