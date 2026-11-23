# Proposal

## Why

O MyFinance precisa de uma interface web para registrar receitas e despesas, organizá-las por categoria e acompanhar o saldo pessoal.

## What Changes

- Cadastrar, listar, editar e excluir categorias, com proteção para categorias em uso.
- Cadastrar, listar, editar e excluir transações, com validação no servidor e confirmação de exclusão.
- Exibir totais de receitas e despesas e o saldo atualizado no dashboard.
- Entregar páginas responsivas com Django Templates e Bootstrap 5, com persistência em SQLite. Autenticação e APIs externas ficam fora do escopo.

## Capabilities

### New Capabilities

- `categorias` — cadastro, listagem, edição e exclusão de categorias (RF01–RF04).
- `transacoes` — cadastro, listagem, edição e exclusão de transações (RF05–RF08).
- `dashboard-financeiro` — totais de receitas e despesas e cálculo do saldo (RF09).

### Modified Capabilities

## Impact

A mudança envolve os apps Django existentes `categorias` e `transacoes`, suas migrações e testes, a configuração de URLs e os templates da interface. O projeto já configura SQLite e descoberta de templates pelos apps. Bootstrap 5 será usado na interface web.
