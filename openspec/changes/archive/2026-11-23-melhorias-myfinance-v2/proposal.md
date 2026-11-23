# Proposal

## Why

O MyFinance registra receitas e despesas, mas quem separa dinheiro para um objetivo ainda precisa controlar as reservas fora do sistema. A V2 integra metas e transferências internas ao histórico e mostra quanto está disponível e quanto está reservado.

## What Changes

- Gerenciar metas, acompanhar progresso, registrar aportes e retiradas e preservar o histórico ao encerrar metas.
- Acrescentar tipos de transação gerados por metas, protegê-los do CRUD convencional e aceitar descrição em branco nos lançamentos manuais.
- Atualizar o dashboard com saldos, patrimônio, transações recentes, cards de metas e gráfico de receitas e despesas.
- Localizar a interface em pt-BR, incluindo datas, calendários e valores. Modernizar a interface responsiva e respeitar a preferência por movimento reduzido.
- Migrar os registros existentes com preservação exata dos valores e verificar os fluxos novos e anteriores com testes.

## Capabilities

### New Capabilities

- `metas-financeiras` — ciclo de vida, aportes, retiradas, progresso e histórico por meta (RF10–RF12, RF15–RF16).
- `saldos-financeiros` — cálculo de disponível, reservado e patrimônio (RF14).
- `interface-myfinance` — pt-BR, identidade visual, animações acessíveis e responsividade (RF18, RNF01–RNF03).
- `integridade-financeira` — persistência decimal, migração, consistência das gravações e verificação automatizada (RNF04).

### Modified Capabilities

- `transacoes` — classificação, histórico, proteção dos registros gerados por metas e descrição opcional (RF13, RF17 e atualizações de RF05–RF08).
- `dashboard-financeiro` — atualização dos indicadores do RF09, transações recentes, gráfico e cards (RF19–RF21).

## Impact

A mudança afeta o app `transacoes`, introduz um app de metas e atualiza rotas, templates, localização, ativos estáticos e testes. Mantém Django Templates, Bootstrap 5 e SQLite, e inclui Chart.js servido localmente. As rotas, vínculos e regras de categorias do MVP continuam válidos.

A referência para os requisitos modificados é a change implementada `criar-mvp-myfinance`. Seus contratos ainda estão em deltas, pois o diretório de specs principais está vazio. A consolidação futura deve respeitar a ordem MVP → V2.
