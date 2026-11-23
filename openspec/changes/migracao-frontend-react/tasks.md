# Tasks

## 1. Inspecionar a arquitetura Django atual e as changes OpenSpec

- [x] 1.1 Rever a linha de base documentada no design, verificar alterações desde a proposta e executar a suíte Django existente. Confirmar quais rotas, regras e contratos da V2 serão reutilizados e registrar qualquer divergência antes da implementação.

## 2. Planejar os contratos da API REST

- [x] 2.1 Fechar esquemas de entrada, saída, erro, filtros e paginação de `/api/v1/` com exemplos JSON. Conferir datas, valores exatos, semântica de categoria omitida e nula, status HTTP e comportamento das chaves de idempotência.

## 3. Implementar e testar os endpoints Django REST Framework

- [x] 3.1 Criar migração da FK opcional e das restrições mantendo os vínculos existentes. Testar em snapshot SQLite com categoria protegida, valores-limite, nulos convencionais e movimentações já vinculadas, e adaptar os templates legados.
- [x] 3.2 Implementar serializadores e endpoints de categorias, transações, metas, movimentações, histórico, resumo e agregados reaproveitando serviços Django. Testar CRUD, conflitos, classificação e cálculos, retenção de histórico e contrato JSON.
- [x] 3.3 Configurar CSRF, origens permitidas e idempotência atômica. Testar origem e token inválidos, resposta perdida, pedidos concorrentes, alteração de corpo com a mesma chave e falha intermediária sem registros órfãos.

## 4. Criar o projeto React e TypeScript com Vite

- [x] 4.1 Criar aplicação em rota separada e configurar build, proxy local e cliente HTTP tipado. Verificar build e uma leitura da API em ambiente de desenvolvimento.

## 5. Configurar Tailwind CSS e componentes visuais

- [x] 5.1 Definir tokens dark e integrar shadcn/ui com os componentes necessários. Verificar consistência visual, contraste e estados de foco dos componentes básicos.

## 6. Criar layout dark, navegação e componentes reutilizáveis

- [x] 6.1 Montar cabeçalho, sidebar adaptável e rotas React com seção ativa. Testar links internos, voltar, recarregar URL profunda e rota inexistente.
- [x] 6.2 Criar formulários, diálogos e estados reutilizáveis. Testar rótulos, campos obrigatórios, bloqueio durante envio, confirmação e cancelamento.

## 7. Migrar a dashboard

- [x] 7.1 Consumir resumo, indicadores, recentes e cards com todos os dados de progresso. Testar renderização com dados, atraso, erro recuperável e base vazia.

## 8. Migrar categorias e transações

- [x] 8.1 Ligar CRUD à API e mostrar Sem categoria e Sem descrição. Testar gravar, editar e remover categoria de lançamento convencional, proteger categorias em uso e manter lançamentos de metas somente para consulta.

## 9. Migrar metas, aportes e retiradas

- [x] 9.1 Ligar lista, detalhes, formulários, histórico, ações financeiras e encerramento à API. Testar atualização de progresso após aporte, retirada, conflito de saldo e consulta da meta arquivada.

## 10. Implementar filtros

- [x] 10.1 Aplicar filtros e paginação no backend e refletir seus valores na URL React. Testar receitas e despesas por categoria, categoria nula, datas inclusivas, combinação, limpeza, navegação e resultados vazios.

## 11. Implementar gráficos financeiros

- [x] 11.1 Renderizar doughnuts Recharts com valores, percentuais, tooltips, cores estáveis e retiradas separadas. Testar denominadores, categoria nula, estado vazio, falha gráfica e atualização após gravação.

## 12. Implementar notificações e animações

- [x] 12.1 Aplicar toasts e transições com Motion e CSS. Testar início da saída em 4.000 ms, dispensa manual, persistência de erros e prefers-reduced-motion em cards, modais, gráficos e barras.

## 13. Validar responsividade e internacionalização

- [x] 13.1 Verificar 360, 768 e 1280 px com teclado e nomes longos, e testar moeda, data, calendário, labels, tooltips e mensagens em pt-BR com navegador em inglês.

## 14. Executar testes integrados

- [x] 14.1 Executar testes DRF, de componentes e de navegador com backend real e SQLite de teste. Verificar o fluxo de transação sem categoria, filtros, gráfico atualizado, meta atualizada, erro de campo e notificações.

## 15. Validar a equivalência funcional com a aplicação anterior

- [x] 15.1 Comparar operações, registros, vínculos e saldos nas duas interfaces, em cópia do SQLite, incluindo categorias, CRUD, aportes, retiradas e históricos. Verificar que a troca e a reversão de rotas mantêm acesso aos registros gravados após a migração.
- [x] 15.2 Após os testes de equivalência, habilitar React na entrada principal e verificar a rota de retorno aos templates e a separação entre rotas SPA e API.
