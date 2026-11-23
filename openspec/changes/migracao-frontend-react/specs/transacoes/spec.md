# Transações

## ADDED Requirements

### Requirement: Filtrar o histórico geral

O sistema SHALL aplicar no backend filtros combináveis por tipo convencional, categoria e intervalo inclusivo de datas. Manter filtros na URL e entre páginas de resultados, permitir limpá-los e tratar resultados vazios e filtros inválidos.

#### Scenario: Despesas por categoria

- **GIVEN** Casa tem receita e despesa e existem despesas em outra categoria
- **WHEN** seleciona-se Despesas e Casa
- **THEN** aparecem apenas despesas convencionais de Casa

#### Scenario: Receitas por categoria

- **GIVEN** Casa tem receita e despesa, e outra categoria tem receita
- **WHEN** seleciona-se Receitas e Casa
- **THEN** aparecem somente receitas convencionais de Casa

#### Scenario: Combinar filtros e paginar

- **GIVEN** existem registros antes, dentro e depois do intervalo e mais de uma página de correspondências
- **WHEN** seleciona-se Despesas, Sem categoria e as duas datas, navega-se entre páginas e volta-se pelo histórico do navegador
- **THEN** aparecem somente despesas de categoria nula no intervalo, incluindo datas limite, e a seleção é restaurada pela URL

#### Scenario: Todas as categorias e limpar

- **GIVEN** há um filtro ativo e existem registros com categoria, sem categoria e de metas
- **WHEN** o usuário usa limpar filtros
- **THEN** a lista volta ao tipo Todas e a Todas as categorias, inclui os quatro tipos e retorna à primeira página

#### Scenario: Resultado vazio ou intervalo inválido

- **GIVEN** o usuário escolhe uma combinação sem registros ou envia data inválida ou início posterior ao fim
- **WHEN** aplica o filtro
- **THEN** a combinação válida mostra mensagem de lista vazia, e a inválida recebe erro em português com status 400

## MODIFIED Requirements

### Requirement: RF05 Cadastrar transação

O sistema SHALL cadastrar transações convencionais com descrição opcional de até 200 caracteres, valor decimal obrigatório positivo de até duas casas, tipo receita ou despesa e data válida obrigatória. Categoria é opcional e, quando informada, deve existir e estar disponível no CRUD convencional.

#### Scenario: Cadastro válido

- **GIVEN** uma categoria existente está disponível
- **WHEN** o usuário cadastra uma receita e uma despesa nela com descrições de até 200 caracteres ou vazias, datas válidas e valores 10 e 0,01
- **THEN** ambas são persistidas com os valores de R$ 10,00 e R$ 0,01

#### Scenario: Campos obrigatórios ausentes

- **GIVEN** os dados convencionais são válidos
- **WHEN** omitem-se valor, tipo ou data em requisições distintas
- **THEN** o backend aponta o campo e não cria transação

#### Scenario: Campos inválidos

- **GIVEN** os demais campos são válidos
- **WHEN** enviam-se separadamente descrição de 201 caracteres, valor não numérico, zero, negativo ou com três casas, tipo inválido, data inválida ou categoria inexistente ou interna
- **THEN** cada erro é associado ao campo e nenhuma transação é criada

#### Scenario: Cadastro sem categoria

- **GIVEN** o formulário está em português e o saldo é conhecido
- **WHEN** o usuário mantém a opção Sem categoria e envia uma receita de R$ 10,00 ou omite a categoria na criação via API
- **THEN** grava-se categoria nula, o histórico exibe Sem categoria e a receita aumenta saldo e total convencional em R$ 10,00

### Requirement: RF06 Listar transações

O sistema SHALL exibir descrição, valor, tipo, data e categoria em ordem decrescente de data, com identificador decrescente no desempate. Mostrar Sem categoria para valores nulos, Sem descrição para descrições vazias e ações de edição e exclusão apenas em lançamentos convencionais.

#### Scenario: Listagem ordenada

- **GIVEN** há lançamentos convencionais e de meta em datas diferentes ou iguais
- **WHEN** o histórico é aberto
- **THEN** exibe os cinco campos em ordem de data e identificador decrescentes, preserva os tipos de meta e oferece ações somente nas linhas convencionais

#### Scenario: Lista vazia

- **GIVEN** não há transações
- **WHEN** o usuário abre o histórico
- **THEN** é exibida uma mensagem em português, sem linhas ou ações por registro

### Requirement: RF07 Editar transação

O sistema SHALL permitir alterar descrição, valor, tipo, data e categoria de transações convencionais, incluindo limpar a categoria. Aplicar RF05 e proteger as transações geradas por metas conforme RF13.

#### Scenario: Edição válida

- **GIVEN** existe uma transação convencional
- **WHEN** o usuário altera os cinco campos, seleciona outra categoria e depois remove o vínculo
- **THEN** o histórico mostra os novos dados na posição da nova data e depois exibe Sem categoria

#### Scenario: Edição inválida

- **GIVEN** existe uma transação convencional
- **WHEN** o usuário envia um campo obrigatório ausente ou inválido conforme RF05
- **THEN** a API identifica o erro e preserva os dados gravados

#### Scenario: Transação inexistente

- **GIVEN** o identificador não corresponde a um registro
- **WHEN** o usuário tenta editar
- **THEN** a API responde 404 e não altera dados
