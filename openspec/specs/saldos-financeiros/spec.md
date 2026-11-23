# saldos-financeiros Specification

## Purpose

Calcula o dinheiro disponível, as reservas de metas e o patrimônio a partir do histórico financeiro persistido.

## Requirements

### Requirement: RF14 Calcular saldos e patrimônio

O sistema SHALL calcular disponível como receitas menos despesas menos aportes mais retiradas, reservado como aportes menos retiradas e patrimônio como disponível mais reservado. Recalcular após qualquer gravação financeira bem-sucedida, usando somente dados persistidos.

#### Scenario: Conciliar totais e transferências

- **GIVEN** há R$ 200,00 em receitas, R$ 50,00 em despesas, R$ 40,00 em aportes e R$ 10,00 em retiradas
- **WHEN** o dashboard é consultado
- **THEN** exibe R$ 120,00 disponíveis, R$ 30,00 reservados e R$ 150,00 de patrimônio, com receita e despesa convencionais de R$ 200,00 e R$ 50,00

#### Scenario: CRUD convencional altera patrimônio

- **GIVEN** há receitas, despesas e reservas registradas
- **WHEN** uma receita é editada para despesa ou um lançamento convencional é excluído
- **THEN** o disponível e o patrimônio refletem a operação, e a reserva permanece igual

#### Scenario: Operação rejeitada

- **GIVEN** há reserva e saldo disponível registrados
- **WHEN** um aporte superior ao disponível ou uma edição convencional inválida é rejeitada
- **THEN** os três totais continuam iguais e nenhum registro financeiro parcial é considerado

#### Scenario: Saldo disponível negativo

- **GIVEN** as despesas excedem as receitas após uma operação convencional válida
- **WHEN** o dashboard é consultado e tenta-se aportar R$ 0,01
- **THEN** o saldo negativo é exibido e o novo aporte é rejeitado
