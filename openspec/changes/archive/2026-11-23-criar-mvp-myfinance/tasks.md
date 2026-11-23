# Tasks

## 1. Base da interface

- [x] 1.1 Criar o template base, incluir Bootstrap 5 localmente e ligar a navegação às telas do MVP. Verificar que o CSS carrega localmente e que a navegação renderiza nas páginas integradas.

## 2. Categorias

- [x] 2.1 Criar `Categoria` e sua migração inicial, com chave de nome normalizada e única. Verificar a migração em SQLite e testar a duplicidade sem distinção de maiúsculas e minúsculas.
- [x] 2.2 Implementar cadastro, listagem e edição com URLs, views, formulários e templates Django. Cobrir RF01–RF03 com testes de envios válidos e inválidos, limites de tamanho, nome duplicado, lista vazia e edição de registro inexistente.

## 3. Transações e exclusão de categorias

- [x] 3.1 Criar `Transacao` e sua migração com relação obrigatória e protegida, tipo e valor monetário positivo em centavos. Testar a precisão, a proteção da relação e a restrição de valor positivo no SQLite.
- [x] 3.2 Implementar cadastro, listagem e edição de transações com validação no servidor. Testar RF05–RF07, incluindo campos obrigatórios, valores inválidos, categoria inexistente, ordem decrescente por data e lista vazia.
- [x] 3.3 Implementar confirmações e exclusão por POST para categorias e transações. Testar RF04 e RF08, incluindo cancelamento, categoria em uso, vínculo criado após abrir a confirmação e transação já excluída.

## 4. Dashboard

- [x] 4.1 Implementar a página inicial com totais calculados sobre as transações persistidas. Testar RF09 com saldo negativo, base vazia, atualização após as três operações de escrita e preservação dos totais após edição inválida.

## 5. Verificação integrada

- [x] 5.1 Executar `python manage.py check` e `python manage.py test` e verificar os cenários não funcionais de `design.md`, incluindo navegação anônima, responsividade, persistência após reinício e funcionamento com acesso externo bloqueado.
