# Metas financeiras

## Purpose

Permite acompanhar objetivos financeiros e manter um histórico auditável das reservas por meta.

## ADDED Requirements

### Requirement: RF10 Gerenciar metas

O sistema SHALL permitir cadastrar, listar, editar e excluir metas sem movimentações. Cada meta tem nome obrigatório, descrição opcional, objetivo positivo, data limite obrigatória, instante de criação automático e aporte inicial opcional registrado conforme RF11. A edição abrange nome, descrição, objetivo e prazo. O detalhe exibe o progresso.

#### Scenario: Cadastro, edição, listagem e exclusão

- **GIVEN** há saldo disponível de R$ 100,00
- **WHEN** são criadas uma meta com aporte inicial de R$ 25,00 e outra sem aporte, a segunda é editada e sua exclusão é confirmada
- **THEN** a primeira aparece com data de criação e reserva de R$ 25,00, e a segunda reflete a edição antes de ser removida

#### Scenario: Campos inválidos

- **GIVEN** um cadastro ou edição tem nome vazio, objetivo zero ou negativo, ou prazo ausente ou inválido
- **WHEN** o formulário é enviado
- **THEN** o erro é associado ao campo e nenhuma alteração é gravada

#### Scenario: Aporte inicial inválido

- **GIVEN** há R$ 100,00 disponíveis
- **WHEN** o usuário cria uma meta com aporte inicial superior a R$ 100,00, negativo ou com mais de duas casas
- **THEN** o erro é exibido e nenhuma meta ou transação é criada

### Requirement: RF11 Aportar para uma meta

O sistema SHALL registrar em uma operação atômica o aporte positivo de até duas casas, limitado ao saldo global disponível, e a transação APORTE_META com descrição “Aporte para meta — [Nome da Meta]”. Registrar valor e instante, reduzir o saldo disponível, aumentar a reserva e atualizar o dashboard.

#### Scenario: Aporte no limite disponível

- **GIVEN** a meta aberta possui R$ 20,00 reservados e há R$ 80,00 disponíveis
- **WHEN** o usuário aporta R$ 80,00
- **THEN** é criada uma única movimentação com data e hora e a transação correspondente, e o dashboard exibe R$ 0,00 disponíveis e R$ 100,00 reservados

#### Scenario: Saldo insuficiente ou valor inválido

- **GIVEN** há R$ 80,00 disponíveis
- **WHEN** o usuário tenta aportar R$ 80,01, zero, um valor negativo ou com mais de duas casas, separadamente
- **THEN** cada envio é rejeitado sem alterar saldos, histórico ou transações

#### Scenario: Meta encerrada

- **GIVEN** a meta está arquivada
- **WHEN** o usuário envia um aporte diretamente à rota
- **THEN** o sistema rejeita a operação e preserva os registros

### Requirement: RF12 Retirar de uma meta

O sistema SHALL registrar em uma operação atômica retirada positiva de até duas casas, limitada à reserva da meta, e a transação RETIRADA_META com descrição “Retirada da meta — [Nome da Meta]”. Registrar valor e instante, reduzir a reserva e devolver o valor ao saldo disponível.

#### Scenario: Retirada integral

- **GIVEN** a meta possui R$ 75,00 reservados
- **WHEN** o usuário retira R$ 75,00
- **THEN** a reserva vai a zero, o disponível aumenta R$ 75,00 e o histórico contém a retirada e sua referência

#### Scenario: Retirada inválida

- **GIVEN** a meta possui R$ 75,00 reservados
- **WHEN** o usuário solicita R$ 75,01, zero, número negativo ou mais de duas casas, separadamente
- **THEN** cada operação é rejeitada e os registros e totais permanecem iguais

### Requirement: RF15 Exibir progresso

O sistema SHALL exibir objetivo, acumulado, restante, percentual, dias restantes, aporte mensal necessário e status. Calcular percentual por reserva dividida pelo objetivo vezes 100. Classificar como concluída quando a reserva atingir o objetivo, vencida após a data limite quando houver valor faltante e em andamento nos demais casos.

#### Scenario: Progresso em andamento

- **GIVEN** a meta tem prazo em 60 dias, objetivo de R$ 100,00 e reserva de R$ 30,00
- **WHEN** o usuário abre o detalhe
- **THEN** vê R$ 70,00 restantes, 30% concluídos, 60 dias restantes e R$ 35,00 de aporte mensal em dois períodos de 30 dias

#### Scenario: Objetivo ultrapassado

- **GIVEN** o objetivo é de R$ 100,00 e a reserva é de R$ 120,00
- **WHEN** o usuário consulta a meta
- **THEN** o percentual mostra 120%, a barra para em 100%, os valores restantes e mensais são zero e o status é concluída

#### Scenario: Prazo vencido com saldo faltante

- **GIVEN** hoje é posterior ao prazo e a reserva é inferior ao objetivo
- **WHEN** o progresso é exibido
- **THEN** o status é vencida, os dias restantes são zero e o aporte mensal aparece como indisponível

#### Scenario: Objetivo inválido

- **GIVEN** uma atualização tenta gravar objetivo zero
- **WHEN** o envio é processado
- **THEN** a alteração é rejeitada antes do cálculo do percentual

### Requirement: RF16 Preservar histórico e encerrar metas

O sistema SHALL exibir tipo, valor, data e hora e saldo após cada movimentação. Apagar apenas metas sem histórico após confirmação. Arquivar, após confirmação, metas com histórico e reserva zerada, mantendo o detalhe e as transações acessíveis. Bloquear encerramento com reserva positiva.

#### Scenario: Saldo evolui e histórico permanece

- **GIVEN** uma meta recebeu R$ 40,00 e depois teve retirada de R$ 40,00
- **WHEN** o encerramento é confirmado
- **THEN** a meta sai da lista ativa e seus históricos por meta e geral continuam acessíveis, com saldos sucessivos de R$ 40,00 e R$ 0,00

#### Scenario: Encerramento bloqueado

- **GIVEN** uma meta com histórico ainda tem R$ 40,00 reservados
- **WHEN** o usuário tenta excluí-la ou encerrá-la
- **THEN** o sistema informa que a reserva deve ser retirada primeiro e mantém histórico, meta e saldos

#### Scenario: Movimentação após encerramento

- **GIVEN** a meta está arquivada
- **WHEN** o usuário tenta editá-la ou fazer uma retirada pela URL direta
- **THEN** o servidor rejeita a operação e o histórico permanece consultável
