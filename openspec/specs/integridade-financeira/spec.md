# integridade-financeira Specification

## Purpose

Garante a preservação de valores e vínculos no banco e a consistência das operações financeiras durante falhas e concorrência.

## Requirements

### Requirement: RNF04 Preservar integridade e precisão

O sistema SHALL usar DecimalField para valores monetários e migrações seguras no SQLite. Preservar dados preexistentes e centavos exatos. Gravar cada aporte ou retirada atomicamente com uma única transação vinculada e cobrir regras, concorrência, migração e regressões com testes automatizados.

#### Scenario: Migração conserva valores e referências

- **GIVEN** o SQLite do MVP contém receitas, despesas e categorias, incluindo valores de um centavo e do limite legado
- **WHEN** a migração é aplicada em uma cópia e os registros são relidos
- **THEN** IDs, datas, descrições, categorias e valores são mantidos e os totais coincidem centavo a centavo

#### Scenario: Falha na gravação ou migração

- **GIVEN** uma etapa falha entre a criação da transação e o vínculo da movimentação, ou a conferência de migração detecta divergência
- **WHEN** a operação é concluída com erro
- **THEN** a operação financeira é revertida sem linhas órfãs ou totais parciais e a migração divergente é interrompida sem descartar os dados legados

#### Scenario: Concorrência entre metas

- **GIVEN** há R$ 100,00 disponíveis e duas solicitações simultâneas de aporte de R$ 80,00 para metas diferentes
- **WHEN** ambas são processadas
- **THEN** apenas uma é confirmada, a outra recebe erro recuperável e o disponível fica em R$ 20,00

#### Scenario: Concorrência de retiradas

- **GIVEN** uma meta tem R$ 100,00 reservados e recebe duas solicitações simultâneas de retirada de R$ 80,00
- **WHEN** ambas são processadas
- **THEN** apenas uma é confirmada, o histórico contém uma retirada e a reserva fica em R$ 20,00

#### Scenario: Verificação automatizada

- **GIVEN** a suíte tem cenários para RF10–RF21, RNF01–RNF04 e regressões do MVP
- **WHEN** a suíte é executada com SQLite e o ambiente de interface previsto
- **THEN** os cenários válidos e inválidos são exercitados, e a verificação falha se houver perda de dados, duplicidade de transação, saldo incorreto ou falha de interface coberta
