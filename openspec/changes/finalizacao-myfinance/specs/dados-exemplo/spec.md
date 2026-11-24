# Dados de exemplo

## Purpose

Prepara uma base de demonstração realista sem cadastro manual, usando as mesmas regras de saldo e de metas do uso normal.

## ADDED Requirements

### Requirement: Popular a base com dados de exemplo

O sistema SHALL criar 6 categorias (Moradia, Alimentação, Transporte, Lazer, Trabalho, Estudos), reaproveitando a que já existir com o mesmo nome; transações dos três últimos meses relativas à data atual, com receitas mensais de estágio, um freela eventual e despesas variadas; e 3 metas (uma em andamento com aportes regulares, uma recém-criada com pouco progresso e uma concluída). Tudo SHALL passar pelos serializers e serviços existentes, em ordem cronológica. Cada mês SHALL fechar com sobra positiva (receitas − despesas − reservado líquido) e o total de despesas do mês anterior SHALL ser diferente do atual. A base é considerada vazia quando não há transações.

#### Scenario: Base vazia

- **GIVEN** não há transações
- **WHEN** o cliente envia `POST /api/v1/exemplo/`
- **THEN** a resposta é 201, os saldos de `resumo/` conciliam com as transações criadas e há uma meta com 100% de progresso

#### Scenario: Base com dados

- **GIVEN** já existe ao menos uma transação
- **WHEN** o cliente envia `POST /api/v1/exemplo/`
- **THEN** a resposta é 409 com mensagem clara e nenhum registro é criado

#### Scenario: Regras de meta continuam valendo

- **GIVEN** um aporte de exemplo excederia o saldo disponível naquele ponto da sequência
- **WHEN** os dados de exemplo são criados
- **THEN** o serviço de metas recusa o aporte e nenhum registro é criado

### Requirement: Comando de terminal para a demonstração

O sistema SHALL oferecer `python manage.py popular_exemplo`, com `--limpar` para apagar transações, metas e categorias antes de popular.

#### Scenario: Recriar a base

- **GIVEN** a base tem dados
- **WHEN** o operador executa `popular_exemplo --limpar`
- **THEN** os dados anteriores são removidos e a base de exemplo é criada do zero

#### Scenario: Base com dados sem limpar

- **GIVEN** a base tem transações
- **WHEN** o operador executa `popular_exemplo` sem `--limpar`
- **THEN** o comando termina com erro pedindo `--limpar` e nada é alterado

### Requirement: Oferecer os dados de exemplo no dashboard vazio

O sistema SHALL mostrar, no estado vazio do dashboard, um card de vidro com "Carregar dados de exemplo" (popula a base, mostra um aviso e recarrega) e "Começar do zero" (abre a nova transação).

#### Scenario: Carregar pelo dashboard

- **GIVEN** não há transações
- **WHEN** o usuário aciona "Carregar dados de exemplo"
- **THEN** um aviso confirma a criação e o dashboard passa a mostrar os dados

#### Scenario: Começar do zero

- **GIVEN** o dashboard está no estado vazio
- **WHEN** o usuário aciona "Começar do zero"
- **THEN** o modal de nova transação abre
