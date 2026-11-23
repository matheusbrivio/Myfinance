# Dashboard financeiro

## ADDED Requirements

### Requirement: Despesas convencionais por categoria

O sistema SHALL exibir gráfico circular com despesas convencionais agrupadas por categoria, incluindo Sem categoria. Mostrar percentual e nome na legenda ou gráfico, valor absoluto no tooltip, cores estáveis por categoria e estado vazio quando a soma for zero.

#### Scenario: Distribuição por categoria e nulos

- **GIVEN** há despesas de R$ 75,00 em Casa e R$ 25,00 sem categoria, além de aporte de R$ 20,00
- **WHEN** o gráfico é exibido
- **THEN** Casa mostra 75%, Sem categoria mostra 25%, e os tooltips informam R$ 75,00 e R$ 25,00

#### Scenario: Sem despesas

- **GIVEN** há apenas receitas, aportes ou retiradas, ou a base está vazia
- **WHEN** o gráfico de despesas carrega
- **THEN** aparece um estado vazio em português, sem percentuais indefinidos

## MODIFIED Requirements

### Requirement: RF19 Exibir resumo financeiro

O sistema SHALL exibir dados da API para saldo disponível, saldo reservado, patrimônio total, receitas e despesas convencionais, cinco transações recentes e resumo de metas. Apresentar estados de carregamento, erro recuperável e ausência de dados.

#### Scenario: Resumo com dados

- **GIVEN** há lançamentos dos quatro tipos e metas ativas no SQLite
- **WHEN** a API responde ao carregamento do dashboard
- **THEN** os cinco indicadores coincidem com RF14 e os cinco lançamentos recentes usam ordem decrescente de data e identificador

#### Scenario: Resumo sem dados e gravação rejeitada

- **GIVEN** a base está vazia ou uma operação inválida foi rejeitada
- **WHEN** o dashboard recebe a resposta da API
- **THEN** os indicadores refletem exclusivamente dados persistidos e as seções vazias exibem mensagens adequadas

#### Scenario: Carregamento e erro

- **GIVEN** a resposta demora e depois falha
- **WHEN** o usuário abre o dashboard
- **THEN** vê estado de carregamento e depois erro em português com opção de tentar novamente, sem apresentar falha como saldo zero

### Requirement: RF20 Exibir gráfico de receitas e despesas

O sistema SHALL exibir um gráfico doughnut de distribuição de receitas, despesas e aportes, com legenda de valores e percentuais. Usar a soma dos valores absolutos dessas três classes como denominador. Mostrar retiradas separadamente e identificar a visualização como distribuição de movimentações.

#### Scenario: Gráfico com movimentações de metas

- **GIVEN** há R$ 200,00 de receita, R$ 50,00 de despesa, R$ 150,00 de aportes e R$ 10,00 de retiradas
- **WHEN** o gráfico é exibido
- **THEN** as fatias mostram 50%, 12,5% e 37,5%, respectivamente, com valores exatos, e as retiradas aparecem separadas da legenda das fatias

#### Scenario: Totais vazios ou falha de JavaScript

- **GIVEN** os três totais são zero ou a visualização gráfica falha após carregar a interface
- **WHEN** o dashboard apresenta os dados
- **THEN** a base vazia mostra estado apropriado e, se o gráfico falhar, os totais textuais disponíveis e indicadores continuam legíveis

#### Scenario: Atualizar após nova transação

- **GIVEN** o gráfico mostra R$ 100,00 em receitas e R$ 100,00 em despesas
- **WHEN** uma nova despesa de R$ 100,00 é confirmada pela API e o usuário abre o dashboard
- **THEN** os dados são reconsultados e as fatias passam a aproximadamente 33,33% de receitas e 66,67% de despesas

### Requirement: RF21 Exibir cards de metas

O sistema SHALL exibir nome, objetivo, valor reservado, percentual, barra animada, data limite, dias restantes, aporte mensal e status por meta ativa. Oferecer acesso ao histórico e às ações elegíveis de aporte e retirada. Usar o objetivo individual para calcular o percentual.

#### Scenario: Card e atalhos corretos

- **GIVEN** uma meta ativa de R$ 100,00 tem R$ 25,00 reservados e há saldo disponível
- **WHEN** o usuário abre o card e confirma aporte de R$ 25,00 pela API
- **THEN** o card e o detalhe passam a mostrar R$ 50,00 e 50%, com prazo, aporte mensal e status conciliados e vínculo para o histórico

#### Scenario: Ação indisponível

- **GIVEN** há uma meta arquivada e outra ativa sem reserva
- **WHEN** o usuário abre o dashboard e tenta retirar da meta ativa via API
- **THEN** a arquivada fica fora dos cards ativos, a retirada aparece indisponível no card sem reserva e a API rejeita a tentativa
