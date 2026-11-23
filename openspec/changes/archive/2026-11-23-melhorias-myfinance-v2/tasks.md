# Tasks

## 1. Correções de bugs

- [x] 1.1 Corrigir a obrigatoriedade da descrição no modelo e no formulário convencional, aplicar a migração correspondente e renderizar “Sem descrição”. Testar cadastro e edição em branco, rejeição de 201 caracteres e preservação de descrições existentes (RF17).

## 2. Modelagem de metas e movimentações

- [x] 2.1 Implementar o campo monetário decimal de precisão fixa com armazenamento SQLite em centavos e a migração do valor legado. Testar ida e volta no ORM, preservação de IDs, valores, categorias e descrições, e casos de um centavo, máximo legado e totais acima desse máximo (RNF04).
- [x] 2.2 Criar os modelos e migrações de metas e movimentações, as escolhas de tipo e a categoria interna. Verificar objetivo positivo, vínculo único e protegido, categoria interna inacessível pelo CRUD e preservação de categorias e transações legadas (RF10, RF13, RNF04).
- [x] 2.3 Implementar o cadastro base, listagem, edição e confirmação de exclusão ou arquivamento de metas. Testar dados obrigatórios, data de criação, exclusão de meta sem histórico, arquivamento com reserva zerada e bloqueio com reserva positiva (RF10, RF16).

## 3. Aportes e retiradas

- [x] 3.1 Implementar os serviços de gravação atômica com leitura e validação de saldo sob bloqueio de escrita, os formulários e o aporte inicial no cadastro. Testar limites exatos, rejeições, rollback, data e hora e concorrência entre metas e na mesma meta (RF10–RF12, RNF04).
- [x] 3.2 Integrar os quatro tipos ao histórico geral e proteger lançamentos de metas das rotas de cadastro convencional, edição e exclusão direta. Cobrir requisições GET e POST indevidas e a operação normal dos fluxos legados (RF13).
- [x] 3.3 Exibir o histórico de cada meta com saldo após cada movimentação e permitir consulta após arquivamento. Testar ordem, renomeação da meta e preservação do histórico geral (RF16).

## 4. Cálculos financeiros

- [x] 4.1 Unificar a leitura dos saldos usados nas validações e nos indicadores, incluindo patrimônio e totais convencionais. Testar conciliação centavo a centavo após aporte, retirada e CRUD convencional, inclusive com disponível negativo (RF14).
- [x] 4.2 Implementar a projeção de progresso, prazo, aporte mensal e status no detalhe da meta. Testar dia do vencimento, dia seguinte, prazo curto, arredondamento, valor acima do objetivo e proteção contra objetivo zero (RF15).

## 5. Dashboard e gráficos

- [x] 5.1 Exibir indicadores, cinco lançamentos recentes e cards com progresso, prazo, status e ações elegíveis. Testar desempate da ordem, sincronização com o detalhe, estados vazios e devolução de saldo após retirada (RF19, RF21).
- [x] 5.2 Integrar Chart.js local com doughnut, valores convencionais, rótulos exatos e alternativa textual. Testar fatias com movimentações de metas, base vazia e falha de inicialização do JavaScript (RF20).

## 6. UI/UX e animações

- [x] 6.1 Localizar mensagens, entradas de data, calendário e valores em pt-BR. Testar datas inválidas, moeda agrupada e o seletor com navegador em inglês e com JavaScript desativado (RF18).
- [x] 6.2 Aplicar identidade visual e responsividade nos templates compartilhados, incluindo navegação, ícones, cards e modais. Verificar teclado e foco em 360, 768 e 1280 px, com conteúdo longo (RNF01, RNF03).
- [x] 6.3 Implementar feedback de ações e transições de botões, barras, gráfico e modais. Verificar estados de sucesso e erro e o comportamento com `prefers-reduced-motion` ativo e inativo (RNF02).

## 7. Testes automatizados

- [x] 7.1 Executar a suíte integrada de RF10–RF21 e RNF01–RNF04 junto às regressões do MVP. Verificar o fluxo completo de dados migrados, aporte inicial, retirada, encerramento e dashboard após reiniciar o Django, com SQLite em arquivo.
- [x] 7.2 Executar os cenários de navegador em Chromium e Firefox para localização, telas responsivas, navegação por teclado, movimento reduzido e funcionamento com rede externa bloqueada. Registrar o resultado de `manage.py check`, da suíte e da conferência de migração em cópia do banco.
