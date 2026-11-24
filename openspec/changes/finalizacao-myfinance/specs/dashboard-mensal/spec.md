# Dashboard mensal

## Purpose

Permite ler os indicadores e gráficos de um mês específico, mantendo o comportamento atual quando nenhum mês é informado.

## ADDED Requirements

### Requirement: Resumo e gráficos por mês

O sistema SHALL aceitar `mes=AAAA-MM` em `GET /api/v1/resumo/` e `GET /api/v1/graficos/`. Receitas, despesas e despesas por categoria SHALL considerar só o mês. Disponível, reservado e patrimônio SHALL acumular tudo até o último dia do mês, ou até hoje no mês atual. A distribuição SHALL dividir as receitas do mês entre despesas do mês, reservado líquido do mês (aportes menos retiradas) e sobra (receitas − despesas − reservado líquido), que pode ser negativa; sem receitas no mês, a lista de distribuição SHALL vir vazia. `recentes` SHALL trazer as cinco últimas transações do mês. Sem `mes`, a resposta SHALL continuar igual à atual.

#### Scenario: Sem o parâmetro

- **GIVEN** há transações em vários meses
- **WHEN** o cliente consulta `resumo/` e `graficos/` sem `mes`
- **THEN** as respostas são as mesmas de antes desta mudança, com os totais desde o início

#### Scenario: Transação no último dia do mês

- **GIVEN** há uma despesa em 31 de outubro e outra em 1º de novembro
- **WHEN** o cliente consulta `resumo/?mes=2026-10`
- **THEN** só a despesa de 31 de outubro entra nas despesas do mês, e a posição acumulada não inclui a de novembro

#### Scenario: Mês sem movimento

- **GIVEN** não há transações no mês consultado, mas há em meses anteriores
- **WHEN** o cliente consulta o mês
- **THEN** receitas e despesas do mês são zero, a distribuição vem vazia e a posição reflete o acumulado anterior

#### Scenario: Retirada de meta no mês

- **GIVEN** há aporte de R$ 100,00 e retirada de R$ 30,00 de meta no mesmo mês
- **WHEN** o cliente consulta o resumo do mês
- **THEN** o reservado líquido do mês na distribuição é R$ 70,00

#### Scenario: Sobra negativa

- **GIVEN** as despesas do mês superam as receitas do mês
- **WHEN** o cliente consulta o resumo do mês
- **THEN** a sobra do mês vem negativa e a interface usa o estado de distribuição negativa

#### Scenario: Recentes do mês

- **GIVEN** há seis transações no mês e outras em meses anteriores
- **WHEN** o cliente consulta o resumo do mês
- **THEN** `recentes` traz as cinco mais recentes do mês, sem transações de outros meses

#### Scenario: Mês inválido ou futuro

- **GIVEN** o parâmetro é `2026-13`, `texto` ou um mês posterior ao atual
- **WHEN** o cliente consulta `resumo/` ou `graficos/`
- **THEN** a resposta é 400 com mensagem clara

### Requirement: Seletor de mês no dashboard

O sistema SHALL exibir o seletor de mês na linha do rótulo do hero, guardar o mês na URL (`?mes=AAAA-MM`), impedir o avanço além do mês atual e oferecer setas "Mês anterior" e "Próximo mês" com `aria-label`, acionáveis pelo teclado. Ao trocar de mês, os dígitos que mudaram SHALL trocar com cross-fade (number subtle change).

#### Scenario: Voltar um mês

- **GIVEN** o usuário está no mês atual
- **WHEN** aciona "Mês anterior" com o teclado
- **THEN** a URL passa a ter o mês anterior, os números são os desse mês e "Próximo mês" fica disponível

#### Scenario: Não avançar além do mês atual

- **GIVEN** o usuário está no mês atual
- **WHEN** o seletor é exibido
- **THEN** "Próximo mês" está desabilitado
