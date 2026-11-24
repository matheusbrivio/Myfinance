# Insights financeiros

## Purpose

Resume o mês em até três frases calculadas a partir das transações e metas, sem inventar dados.

## ADDED Requirements

### Requirement: Frases do mês por prioridade

O sistema SHALL expor `GET /api/v1/insights/?mes=AAAA-MM` (sem `mes`, o mês atual) com uma lista de até três itens `{tipo, tom, texto}`, nesta ordem de prioridade, pulando a regra que não tiver dados:

1. `variacao_categoria`: entre as categorias com pelo menos R$ 50,00 de despesas no mês e no mês anterior, a de maior variação percentual absoluta, arredondada para inteiro. Aumento tem tom `alerta`; redução, tom `positivo`; variação de 0% é pulada.
2. `economia`: com receitas no mês, a taxa (receitas − despesas) / receitas, que equivale a sobra mais reservado líquido sobre as receitas, arredondada para inteiro. Taxa negativa tem tom `alerta`; as demais, `positivo`.
3. `meta`: a primeira meta ativa e não concluída, por prazo, que tenha aportes. Sem aporte há mais de 45 dias: tom `alerta`, com os dias parados. Caso contrário, a média mensal dos aportes dos últimos 90 dias projeta o mês de conclusão, com tom `neutro`.
4. `maior_gasto`: a maior despesa do mês, com descrição, valor e dia, tom `neutro`.

Valores SHALL usar o formato brasileiro e os meses SHALL aparecer por extenso.

#### Scenario: Aumento numa categoria

- **GIVEN** Alimentação teve R$ 100,00 de despesas em outubro e R$ 123,00 em novembro
- **WHEN** o cliente consulta `insights/?mes=2026-11`
- **THEN** o primeiro item é `{tipo: variacao_categoria, tom: alerta, texto: "Você gastou 23% a mais com Alimentação do que em outubro."}`

#### Scenario: Redução numa categoria

- **GIVEN** Lazer teve R$ 200,00 em outubro e R$ 50,00 em novembro, e é a maior variação
- **WHEN** o cliente consulta os insights de novembro
- **THEN** o item diz "Você gastou 75% a menos com Lazer do que em outubro." com tom `positivo`

#### Scenario: Categoria abaixo do mínimo

- **GIVEN** nenhuma categoria tem ao menos R$ 50,00 nos dois meses e não há receitas no mês
- **WHEN** o cliente consulta os insights
- **THEN** não aparecem os itens `variacao_categoria` nem `economia`

#### Scenario: Taxa de economia

- **GIVEN** novembro tem R$ 1.000,00 de receitas e R$ 820,00 de despesas
- **WHEN** o cliente consulta os insights de novembro
- **THEN** há o item "Você guardou 18% do que recebeu em novembro." com tom `positivo`

#### Scenario: Economia negativa

- **GIVEN** novembro tem R$ 1.000,00 de receitas e R$ 1.120,00 de despesas
- **WHEN** o cliente consulta os insights
- **THEN** há o item "Você gastou 12% a mais do que recebeu em novembro." com tom `alerta`

#### Scenario: Projeção de meta

- **GIVEN** a meta "Notebook novo" tem R$ 1.000,00 restantes e R$ 600,00 em aportes nos últimos 90 dias, o último há 10 dias, e hoje é novembro de 2026
- **WHEN** o cliente consulta os insights
- **THEN** há o item "No ritmo atual, a meta Notebook novo fecha em abril de 2027." com tom `neutro`

#### Scenario: Meta parada

- **GIVEN** o último aporte da meta "Viagem" foi há 52 dias
- **WHEN** o cliente consulta os insights
- **THEN** há o item "A meta Viagem está sem aportes há 52 dias." com tom `alerta`

#### Scenario: Meta concluída ou sem aportes

- **GIVEN** as metas ativas estão concluídas ou nunca receberam aporte
- **WHEN** o cliente consulta os insights
- **THEN** não aparece item do tipo `meta`

#### Scenario: Maior gasto

- **GIVEN** a maior despesa de novembro é "Aluguel", de R$ 750,00, no dia 10
- **WHEN** o cliente consulta os insights de novembro
- **THEN** há o item "Seu maior gasto foi Aluguel (R$ 750,00), no dia 10." com tom `neutro`

#### Scenario: Limite e ordem

- **GIVEN** as quatro regras têm dados
- **WHEN** o cliente consulta os insights
- **THEN** a lista tem três itens, nos tipos `variacao_categoria`, `economia` e `meta`, nessa ordem

#### Scenario: Mês inválido

- **GIVEN** o parâmetro `mes` é inválido ou está no futuro
- **WHEN** o cliente consulta os insights
- **THEN** a resposta é 400 com mensagem clara

### Requirement: Card Resumo do mês

O sistema SHALL exibir o card "Resumo do mês" na primeira linha do dashboard, ao lado do hero; a Distribuição SHALL descer para a linha de "Por categoria". Cada frase SHALL ter um ícone de 32px (verde para `positivo`, âmbar para `alerta`, neutro para `neutro`), e as frases SHALL entrar em cascata, exceto com movimento reduzido.

#### Scenario: Frases no card

- **GIVEN** a API devolve dois insights
- **WHEN** o usuário abre o dashboard
- **THEN** o card "Resumo do mês" lista as duas frases na ordem recebida, cada uma com o ícone do seu tom

#### Scenario: Sem frases

- **GIVEN** nenhuma regra tem dados
- **WHEN** o usuário abre o dashboard
- **THEN** o card informa que ainda não há dados suficientes para o resumo
