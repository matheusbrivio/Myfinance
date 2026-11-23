# Dashboard financeiro

## ADDED Requirements

### Requirement: RF19 Exibir resumo financeiro

O sistema SHALL exibir saldo disponível, saldo reservado em metas, patrimônio total controlado, totais convencionais de receitas e despesas, transações recentes e resumo das metas.

#### Scenario: Resumo com dados

- **GIVEN** há receitas, despesas, aportes, retiradas e metas ativas
- **WHEN** o usuário abre o dashboard
- **THEN** os cinco indicadores batem com RF14 e a seção de transações exibe os cinco lançamentos mais recentes por data, com desempate por identificador decrescente

#### Scenario: Resumo sem dados e gravação rejeitada

- **GIVEN** não há registros ou um lançamento inválido foi rejeitado
- **WHEN** o usuário abre o dashboard
- **THEN** os indicadores refletem apenas os dados persistidos e as seções vazias exibem mensagem apropriada

### Requirement: RF20 Exibir gráfico de receitas e despesas

O sistema SHALL exibir gráfico doughnut com totais reais de receitas e despesas convencionais e oferecer os mesmos totais em texto. Quando ambos forem zero, mostrar estado vazio sem inventar fatias.

#### Scenario: Gráfico com movimentações de metas

- **GIVEN** há R$ 200,00 de receita, R$ 50,00 de despesa, R$ 40,00 em aportes e R$ 10,00 em retiradas
- **WHEN** o gráfico é renderizado
- **THEN** as fatias correspondem à proporção 200 para 50, e os rótulos exibem os valores exatos das duas classes convencionais

#### Scenario: Totais vazios ou falha de JavaScript

- **GIVEN** ambos os totais são zero ou o gráfico não pode ser inicializado
- **WHEN** o dashboard é carregado
- **THEN** os demais indicadores e os totais textuais continuam disponíveis e não aparecem fatias fictícias nem erro de página

### Requirement: RF21 Exibir cards de metas

O sistema SHALL exibir para metas ativas nome, objetivo, acumulado, barra, percentual, prazo restante, status e acesso rápido para aporte e retirada, conforme a elegibilidade da operação.

#### Scenario: Card e atalhos corretos

- **GIVEN** uma meta ativa tem saldo reservado positivo e há saldo disponível
- **WHEN** o usuário abre o dashboard
- **THEN** o card mostra valores e progresso do detalhe, e os atalhos abrem os formulários da própria meta

#### Scenario: Ação indisponível

- **GIVEN** a meta está arquivada ou a meta ativa não tem saldo reservado
- **WHEN** o usuário consulta o dashboard e tenta retirar pela URL direta
- **THEN** a arquivada fica fora dos cards ativos, o atalho fica indisponível na meta sem reserva e o backend rejeita a retirada indevida

## MODIFIED Requirements

### Requirement: RF09 Exibir e atualizar totais

O sistema SHALL exibir totais convencionais de receitas e despesas e os saldos e patrimônio definidos em RF14, com duas casas decimais e dados persistidos ao carregar o dashboard.

#### Scenario: Totais e saldo negativo

- **GIVEN** existem receitas de 100,10 e 50,20, uma despesa de 200,40 e nenhuma movimentação de meta
- **WHEN** o usuário abre o dashboard
- **THEN** receitas são R$ 150,30, despesas R$ 200,40, disponível e patrimônio −R$ 50,10 e reservado R$ 0,00

#### Scenario: Resumo sem transações

- **GIVEN** a base está vazia
- **WHEN** o dashboard é aberto
- **THEN** todos os indicadores financeiros exibem R$ 0,00

#### Scenario: Atualizar após cadastro, edição e exclusão

- **GIVEN** a base está vazia
- **WHEN** o usuário cadastra receita de R$ 100,00, edita para despesa de R$ 30,00 e a exclui, consultando o dashboard após cada operação
- **THEN** receitas, despesas e disponível passam por (100,00, 0,00, 100,00), (0,00, 30,00, −30,00) e (0,00, 0,00, 0,00)

#### Scenario: Operação inválida não altera totais

- **GIVEN** existe despesa de R$ 30,00
- **WHEN** o usuário tenta editá-la para valor zero
- **THEN** o envio é rejeitado e os indicadores continuam refletindo a despesa de R$ 30,00
