# interface-myfinance Specification

## Purpose

Define os comportamentos de localização, navegação, responsividade e movimento das páginas do MyFinance.

## Requirements

### Requirement: RF18 Localizar em português brasileiro

O sistema SHALL apresentar menus, botões, formulários, erros e calendários em pt-BR. Exibir datas em DD/MM/AAAA e valores como R$ 1.234,56. Garantir entrada de data localizada e acessível mesmo se o seletor do navegador estiver indisponível.

#### Scenario: Localização independente do navegador

- **GIVEN** o navegador prefere inglês
- **WHEN** o usuário abre os formulários de transação e meta, seleciona ou digita 23/11/2026 e consulta uma transação de 1234,56
- **THEN** calendário, rótulos e botões aparecem em português e o registro mostra 23/11/2026 e R$ 1.234,56

#### Scenario: Entrada inválida com seletor indisponível

- **GIVEN** o calendário não está disponível e há um campo de data editável
- **WHEN** o usuário envia 31/02/2026 ou valor monetário malformado
- **THEN** o campo correspondente apresenta erro em português e a gravação é rejeitada

#### Scenario: Valor localizado

- **GIVEN** um formulário recebe R$ 1.234,56, 1234,56 ou o formato decimal com ponto aceito no MVP, em envios separados
- **WHEN** o servidor valida o valor
- **THEN** cada entrada equivalente é persistida como 1234,56 sem perda de centavos

### Requirement: RNF01 Aplicar identidade visual

O sistema SHALL manter os fluxos em Django Templates e Bootstrap 5 com hierarquia visual minimalista, paleta e tipografia consistentes, cards arredondados, sombras suaves, ícones acompanhantes e navegação comum.

#### Scenario: Componentes consistentes

- **GIVEN** o usuário abre dashboard, histórico e formulários
- **WHEN** ele navega entre páginas
- **THEN** a navegação mantém nomes e destinos e os componentes usam a mesma paleta, tipografia, ícones e tratamentos de cartão

#### Scenario: Ação inacessível

- **GIVEN** o usuário navega por teclado ou sem ícones visíveis
- **WHEN** procura uma ação de editar, excluir ou movimentar
- **THEN** a verificação falha se a ação depender apenas de ícone, cor ou ponteiro, ou se o foco ficar invisível

### Requirement: RNF02 Respeitar preferências de movimento

O sistema SHALL usar transições discretas em botões, hover, barras de progresso, entrada do gráfico e modais. Exibir confirmação visual ou erro para ações e desativar movimento decorativo sob prefers-reduced-motion.

#### Scenario: Feedback e transições

- **GIVEN** a preferência de movimento reduzido está desativada
- **WHEN** o usuário foca ou passa sobre um botão, abre e fecha um modal, carrega gráfico e barra e envia uma operação válida
- **THEN** as transições são suaves e a ação tem retorno visual legível

#### Scenario: Movimento reduzido e erro

- **GIVEN** prefers-reduced-motion está ativo
- **WHEN** a tela carrega, o usuário abre uma confirmação e envia um formulário inválido
- **THEN** a interface apresenta estados finais sem animações decorativas, mantém foco utilizável e exibe o erro

### Requirement: RNF03 Adaptar a interface à tela

O sistema SHALL manter navegação, cartões, gráfico, tabelas, formulários, ações e modais utilizáveis em computadores, tablets e smartphones.

#### Scenario: Viewports representativas

- **GIVEN** o navegador está em 360, 768 e 1280 px, em execuções separadas
- **WHEN** o usuário acessa dashboard, tabelas, formulários e confirmações
- **THEN** os controles são alcançáveis e os conteúdos se reorganizam, com rolagem horizontal limitada às tabelas quando necessário

#### Scenario: Conteúdo extenso

- **GIVEN** uma meta tem nome longo e o histórico tem valores e descrições longos
- **WHEN** a tela é testada a 360 px
- **THEN** a verificação falha se a página inteira rolar horizontalmente ou se controles ou valores ficarem cortados ou inacessíveis
