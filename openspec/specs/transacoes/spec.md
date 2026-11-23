# transacoes Specification

## Purpose

Registra receitas e despesas com valores monetários decimais e vínculo obrigatório a uma categoria existente.

## Requirements

### Requirement: RF05 Cadastrar transação

O sistema SHALL cadastrar transações convencionais com descrição opcional de até 200 caracteres, valor decimal obrigatório maior que zero de até duas casas, tipo receita ou despesa, data válida obrigatória e categoria existente obrigatória. Uma categoria pode estar vinculada a várias transações.

#### Scenario: Cadastro válido

- **GIVEN** uma categoria existente está disponível
- **WHEN** o usuário cadastra uma receita e uma despesa na mesma categoria, com descrição de até 200 caracteres ou vazia, datas válidas e valores 10 e 0,01
- **THEN** ambas são persistidas na categoria, com valores apresentados como R$ 10,00 e R$ 0,01

#### Scenario: Campos obrigatórios ausentes

- **GIVEN** os dados convencionais são válidos
- **WHEN** o usuário omite valor, tipo, data ou categoria em envios separados
- **THEN** o servidor indica o campo e não cria a transação

#### Scenario: Campos inválidos

- **GIVEN** os demais campos são válidos
- **WHEN** o usuário envia separadamente descrição com 201 caracteres, valor não numérico, zero, negativo ou com três casas, tipo diferente de receita ou despesa, data inválida ou categoria inexistente
- **THEN** o servidor indica o campo inválido e não cria transação

### Requirement: RF06 Listar transações

O sistema SHALL exibir descrição, valor com duas casas, tipo, data e categoria das transações, em ordem decrescente de data. Oferecer edição e exclusão para lançamentos convencionais.

#### Scenario: Listagem ordenada

- **GIVEN** há lançamentos convencionais e gerados por metas em datas diferentes, gravados fora da ordem cronológica
- **WHEN** o usuário abre o histórico
- **THEN** os cinco campos são exibidos da data mais recente à mais antiga, com ações somente nas linhas convencionais

#### Scenario: Lista vazia

- **GIVEN** não há transações
- **WHEN** o usuário abre o histórico geral
- **THEN** a página informa a ausência de transações e não apresenta ações por registro

### Requirement: RF07 Editar transação

O sistema SHALL permitir alterar descrição, valor, tipo, data e categoria de uma transação convencional, aplicando as validações do RF05. Proteger transações geradas por metas conforme RF13.

#### Scenario: Edição válida

- **GIVEN** uma transação convencional existe
- **WHEN** o usuário altera os cinco campos para valores válidos incluindo nova categoria existente
- **THEN** a listagem exibe os novos dados na posição da nova data

#### Scenario: Edição inválida

- **GIVEN** uma transação convencional existe
- **WHEN** o usuário envia campo obrigatório ausente ou campo inválido conforme RF05
- **THEN** o servidor indica o erro e preserva todos os dados persistidos

#### Scenario: Transação inexistente

- **GIVEN** o identificador não corresponde a uma transação
- **WHEN** o usuário tenta editar
- **THEN** o sistema responde HTTP 404 e não altera registros

### Requirement: RF08 Excluir transação

O sistema SHALL solicitar confirmação antes de excluir transação convencional e proteger as transações de metas conforme RF13.

#### Scenario: Exclusão confirmada

- **GIVEN** existe uma transação convencional
- **WHEN** o usuário abre a confirmação e depois confirma
- **THEN** a abertura preserva o registro e a confirmação remove apenas o selecionado

#### Scenario: Exclusão cancelada

- **GIVEN** a confirmação está aberta para lançamento convencional
- **WHEN** o usuário cancela
- **THEN** a transação continua na listagem

#### Scenario: Transação inexistente

- **GIVEN** a transação já foi removida
- **WHEN** o usuário tenta confirmar a exclusão
- **THEN** o sistema responde HTTP 404 e preserva os demais registros

### Requirement: RF13 Classificar e proteger transações

O sistema SHALL distinguir RECEITA, DESPESA, APORTE_META e RETIRADA_META no histórico geral. Excluir aportes e retiradas dos totais convencionais. Restringir a criação dos tipos de meta às operações de metas e impedir sua edição ou exclusão no CRUD convencional, inclusive por URL direta.

#### Scenario: Histórico com quatro tipos

- **GIVEN** existem um lançamento de cada tipo
- **WHEN** o usuário abre o histórico geral e consulta os totais convencionais
- **THEN** os quatro tipos são identificáveis, e somente RECEITA e DESPESA compõem seus respectivos totais

#### Scenario: Tipo interno enviado ao CRUD

- **GIVEN** o usuário abre um cadastro ou edição convencional
- **WHEN** envia APORTE_META ou RETIRADA_META diretamente no formulário
- **THEN** o campo tipo apresenta erro e nenhuma transação de meta é criada nem alterada

#### Scenario: Alterar lançamento de meta

- **GIVEN** existe uma transação gerada por meta
- **WHEN** o usuário tenta editar ou excluir pela URL convencional, em GET ou POST
- **THEN** a operação é recusada, as ações não aparecem no histórico e a transação e sua movimentação permanecem iguais

### Requirement: RF17 Tornar descrição opcional

O sistema SHALL aceitar ausência de descrição em cadastro e edição convencionais e apresentar “Sem descrição” quando a descrição estiver vazia. Preservar descrições e transações existentes.

#### Scenario: Cadastro vazio e edição para vazio

- **GIVEN** há uma categoria válida e uma transação convencional com descrição
- **WHEN** o usuário cadastra uma transação sem descrição e apaga a descrição da anterior
- **THEN** ambas aparecem como “Sem descrição” e os demais dados se mantêm

#### Scenario: Descrição longa

- **GIVEN** uma descrição informada tem 201 caracteres
- **WHEN** o usuário tenta gravar uma transação convencional
- **THEN** o formulário rejeita o campo e a gravação não ocorre

#### Scenario: Preservar dados

- **GIVEN** existem transações com descrições preenchidas no banco do MVP
- **WHEN** a migração é aplicada e a lista é aberta
- **THEN** as descrições anteriores são exibidas como gravadas
