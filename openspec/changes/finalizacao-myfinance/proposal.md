# Proposal

## Why

A interface React já cobre categorias, transações, metas e o dashboard, e passou por um redesign visual completo. Para a apresentação do projeto ainda faltam quatro coisas: dados para demonstrar o sistema sem cadastro manual, leitura dos números por mês, uma síntese do mês em linguagem simples e o acabamento dos estados de carregamento, erro e vazio. Esta mudança registra o redesign já entregue e descreve a finalização.

## What Changes

### Já entregue no redesign (registro)

- Tema claro com vidro branco fosco (`.glass`), fonte Geist, grade de 12 colunas e barra superior única com menu segmentado.
- Fundo líquido (LiquidEther em modo claro) com camada de manchas, grade de pontos e granulado, e fallback estático no celular, com movimento reduzido ou sem WebGL2.
- Tela de introdução com os crachás 3D dos integrantes (Lanyard em three.js), fallback de imagens e lista acessível dos nomes.
- Botão "Segure para entrar" (SpecularButton com o hook `useSegurar`, compartilhado com o HoldButton de exclusão).
- Transição de descida da intro para o site e volta pela logo, com paralaxe no fundo.
- Animações com Motion: entradas, contagem dos números, rosca, barras, anéis, seletor de datas animado, confete, toasts e modais.

### Adicionado nesta finalização

- Dados de exemplo pela API e por um comando de terminal, criados pelos mesmos serviços das regras de saldo e meta.
- Dashboard por mês (`?mes=AAAA-MM`) com fluxos do mês, posição no fim do mês, distribuição do mês e seletor de mês.
- Insights do mês: até três frases calculadas a partir dos dados (variação por categoria, taxa de economia, projeção de meta e maior gasto).
- Exportação CSV das transações filtradas, filtro de busca por descrição e paleta de comandos (Ctrl+K).
- Acabamento: meta concluída com confete e aviso, esqueletos de carregamento, erro, 404 e estados vazios com ação.
- Acesso pela rede local para abrir no celular e manifest com ícones para a tela inicial.

## Capabilities

### New Capabilities

- `dados-exemplo` — criação controlada de dados de demonstração pela API e pelo terminal.
- `dashboard-mensal` — consultas de resumo e gráficos recortadas por mês e seletor de mês.
- `insights-financeiros` — frases de síntese do mês calculadas a partir das transações e metas.
- `exportacao-busca` — exportação CSV, filtro de busca e paleta de comandos.
- `acesso-local` — acesso pela rede local e manifest para a tela inicial do celular.

### Modified Capabilities

- `interface-myfinance` — redesign claro, introdução, transição, botão de segurar e acabamento dos estados.

## Impact

O backend ganha endpoints novos e parâmetros opcionais. Sem `mes`, `resumo/` e `graficos/` mantêm o contrato atual. `movimentar` passa a aceitar um instante opcional, usado só pela geração de dados de exemplo; o padrão continua sendo o momento atual e as validações de saldo não mudam. O frontend ganha a dependência `cmdk`. Não há mudança de modelo nem migração de dados.

A mudança `migracao-frontend-react` continua sendo a referência para os contratos da API e da interface React.
