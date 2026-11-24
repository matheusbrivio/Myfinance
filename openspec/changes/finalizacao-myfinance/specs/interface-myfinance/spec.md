# Interface MyFinance

## ADDED Requirements

### Requirement: Redesign claro com introdução

O sistema SHALL abrir em uma introdução com os crachás dos integrantes, título acessível e o botão "Segure para entrar", e descer para o dashboard com transição; a logo do site SHALL voltar para a introdução. Com movimento reduzido ou sem WebGL, os crachás SHALL aparecer como imagens estáticas e a transição SHALL ser um crossfade curto.

#### Scenario: Entrar no site

- **GIVEN** o usuário está na introdução
- **WHEN** segura o botão por 1 segundo, com o ponteiro ou com Espaço
- **THEN** a tela desce para `/app/dashboard`, e soltar antes de 1 segundo não navega

### Requirement: Estados de carregamento, erro e vazio

O sistema SHALL mostrar esqueletos de vidro com pulso suave durante o carregamento do dashboard, das transações e das metas, mantendo `role="status"` e o texto "Carregando…" para leitor de tela. O erro SHALL ter ícone, mensagem e "Tentar novamente". A página 404 SHALL dizer "Esta página não existe" e ter botão para o dashboard. Os estados vazios de metas, categorias e transações SHALL ter uma frase e uma ação.

#### Scenario: Carregando

- **GIVEN** a API ainda não respondeu
- **WHEN** o usuário abre o dashboard
- **THEN** aparecem esqueletos de vidro e um elemento `role="status"` com "Carregando…"

#### Scenario: Erro

- **GIVEN** a API falha
- **WHEN** a página tenta carregar
- **THEN** aparece um alerta com ícone, a mensagem e o botão "Tentar novamente", que refaz a consulta

#### Scenario: Página inexistente

- **GIVEN** o usuário abre um endereço que não existe no app
- **WHEN** a página carrega
- **THEN** aparece "Esta página não existe" com um botão para o dashboard

#### Scenario: Lista vazia

- **GIVEN** não há metas
- **WHEN** o usuário abre Metas
- **THEN** a página mostra "Nenhuma meta ainda" com a ação "Criar meta"

### Requirement: Meta concluída

O sistema SHALL disparar o confete uma única vez por meta quando um aporte a leva a 100%, guardando o registro no `localStorage` com tratamento de falha, mostrar o aviso "Meta concluída! 🎉" e manter o card com borda e brilho âmbar.

#### Scenario: Aporte que conclui a meta

- **GIVEN** uma meta com 90% de progresso
- **WHEN** um aporte a leva a 100%
- **THEN** o aviso aparece, o confete dispara uma vez e o card fica com o brilho âmbar, e recarregar a página não repete o confete

### Requirement: Alinhamento na grade

O sistema SHALL manter os cards alinhados à grade de 12 colunas, sem rolagem horizontal, em 1440, 1024 e 390 px de largura.

#### Scenario: Larguras de referência

- **GIVEN** as páginas do app com dados
- **WHEN** são exibidas em 1440, 1024 e 390 px
- **THEN** não há rolagem horizontal e nenhum elemento passa da largura da janela
