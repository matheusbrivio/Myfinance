# Proposal

## Why

O MyFinance já administra lançamentos e reservas em Django. Uma interface React pode melhorar a navegação e a leitura dos indicadores, enquanto a API fornece os mesmos resultados financeiros às telas novas e dá suporte à migração gradual.

## What Changes

- Disponibilizar operações e consultas por API REST em Django REST Framework, com contratos JSON e validações em português.
- Entregar uma interface React com TypeScript, Vite, Tailwind CSS, shadcn/ui, React Router, Recharts e Motion.
- Adicionar categoria opcional a lançamentos convencionais, filtros combináveis no histórico e gráficos de distribuição financeira e despesas por categoria.
- Migrar o dashboard, categorias, transações, metas e históricos, com navegação responsiva, notificações e acessibilidade.
- Validar equivalência com a interface Django antes da troca da entrada principal, preservando o SQLite e os registros existentes.

## Capabilities

### New Capabilities

- `api-financeira` — contratos REST, validação, erros, proteção das escritas e idempotência.
- `migracao-interface` — convivência temporária, preservação de dados, verificação de equivalência e troca reversível da interface.

### Modified Capabilities

- `transacoes` — categoria opcional para lançamentos convencionais, filtros combináveis e preservação do histórico de metas.
- `dashboard-financeiro` — indicadores e progresso existentes em React, dois gráficos e estados de carregamento, vazio e erro.
- `interface-myfinance` — composição React, navegação, formulários, notificações e identidade dark responsiva.

## Impact

A API reutiliza os modelos, validações e serviços Django. A relação de categoria passa a aceitar nulo em lançamentos convencionais e mantém a proteção de categorias vinculadas. As transferências de meta continuam com categoria interna e vínculo protegido. O projeto continua sem contas individuais.

O MVP arquivado fornece as specs principais de categorias, transações e dashboard. `melhorias-myfinance-v2` está implementada e ainda ativa no OpenSpec. Seus deltas servem de base para esta proposta. A consolidação canônica futura segue a ordem V2 → React.
