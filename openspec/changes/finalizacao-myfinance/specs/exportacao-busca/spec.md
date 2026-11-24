# Exportação e busca

## Purpose

Leva as transações filtradas para planilhas e acelera a navegação com busca e comandos pelo teclado.

## ADDED Requirements

### Requirement: Exportar transações em CSV

O sistema SHALL expor `GET /api/v1/transacoes/exportar/` com os mesmos filtros da listagem, devolvendo CSV com separador `;`, vírgula decimal, datas DD/MM/AAAA, UTF-8 com BOM e o nome `myfinance-transacoes-AAAA-MM-DD.csv`. A interface SHALL ter o botão "Exportar CSV" na barra de ferramentas de Transações, usando os filtros ativos.

#### Scenario: Exportar com filtros

- **GIVEN** há receitas e despesas de categorias diferentes
- **WHEN** o cliente exporta com `tipo=despesa`
- **THEN** o arquivo traz só as despesas, com cabeçalho, valores como `75,00` e datas como `23/11/2026`

#### Scenario: Formato para o Excel

- **GIVEN** qualquer exportação
- **WHEN** o arquivo é gerado
- **THEN** começa com o BOM UTF-8, separa colunas com `;` e vem com `Content-Disposition` de anexo chamado `myfinance-transacoes-` seguido da data de hoje

#### Scenario: Botão usa os filtros ativos

- **GIVEN** a lista de Transações está filtrada por despesas
- **WHEN** o usuário aciona "Exportar CSV"
- **THEN** o download usa os mesmos parâmetros de filtro da lista

### Requirement: Buscar transações por descrição

O sistema SHALL aceitar o filtro `busca` na listagem e na exportação, procurando na descrição sem diferenciar maiúsculas.

#### Scenario: Busca sem diferenciar maiúsculas

- **GIVEN** existe a transação "Aluguel de novembro"
- **WHEN** o cliente lista com `busca=ALUGUEL`
- **THEN** a transação aparece no resultado e as que não contêm o termo não aparecem

### Requirement: Paleta de comandos

O sistema SHALL abrir uma paleta de comandos com Ctrl+K (⌘K no Mac) e pelo botão "Buscar" da barra superior, com os grupos Ações (Nova transação, Nova meta, Nova categoria, Exportar CSV), Ir para (Dashboard, Transações, Categorias, Metas) e Transações (busca ao digitar, com debounce de 250 ms e até 8 resultados). Setas navegam, Enter executa, Esc fecha e o foco volta para onde estava.

#### Scenario: Abrir pelo teclado e navegar

- **GIVEN** o usuário está em qualquer página do app
- **WHEN** pressiona Ctrl+K, digita "Metas" e confirma com Enter
- **THEN** a paleta fecha e a página de metas abre

#### Scenario: Abrir pelo botão

- **GIVEN** o usuário está no app
- **WHEN** aciona o botão "Buscar" da barra superior
- **THEN** a paleta abre com o campo de busca em foco

#### Scenario: Buscar transações

- **GIVEN** existem transações com "mercado" na descrição
- **WHEN** o usuário digita "mercado" na paleta
- **THEN** depois da pausa de digitação aparecem até 8 transações correspondentes no grupo Transações

#### Scenario: Fechar com Esc

- **GIVEN** a paleta foi aberta a partir de um botão
- **WHEN** o usuário pressiona Esc
- **THEN** a paleta fecha e o foco volta para esse botão
