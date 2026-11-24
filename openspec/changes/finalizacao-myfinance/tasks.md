# Tasks

## 1. Registro no OpenSpec

- [x] 1.1 Registrar o redesign e a finalização em proposal, design, specs e tasks, no formato das mudanças existentes, e validar a mudança em modo estrito.
- [ ] 1.2 Decidir sobre o arquivamento de `migracao-frontend-react` (tarefas concluídas): arquivar somente depois de `openspec validate --strict` passar.

## 2. Dados de exemplo

- [x] 2.1 Implementar `popular_exemplo()` com 6 categorias, 3 meses de transações relativas a hoje e 3 metas (uma concluída), pelos serializers e serviços existentes; expor `POST /api/v1/exemplo/` (409 com dados) e o comando `popular_exemplo --limpar`; card no estado vazio do dashboard. Testar saldos consistentes, recusa com 409 e o comando com `--limpar`.

## 3. Dashboard por mês

- [x] 3.1 Aceitar `?mes=AAAA-MM` em `resumo/` e `graficos/` com fluxos do mês, posição no fim do mês, distribuição do mês e recentes do mês; 400 para mês inválido ou futuro. Seletor de mês acessível com o mês na URL. Testar último dia do mês, mês sem movimento e retirada de meta.

## 4. Insights do mês

- [x] 4.1 Implementar `GET /api/v1/insights/?mes=AAAA-MM` com as regras de variação por categoria, taxa de economia, projeção de meta e maior gasto, em ordem de prioridade e com no máximo três itens; card "Resumo do mês" no dashboard. Testar cada regra, inclusive quando ela não aparece.

## 5. Exportar CSV e busca rápida

- [x] 5.1 Implementar `GET /api/v1/transacoes/exportar/` com os filtros da listagem e o filtro `busca`; botão "Exportar CSV" e paleta de comandos Ctrl+K com ações, navegação e busca de transações. Testar conteúdo e formato do CSV, o filtro `busca` e a paleta no navegador.

## 6. Acabamento

- [ ] 6.1 (Pendente: adiado para depois da apresentação.) Meta concluída com confete único e aviso; esqueletos de carregamento; erro e 404 no mesmo estilo; estados vazios com ação; revisão da grade em 1440, 1024 e 390 px.

## 7. Acesso pelo celular

- [ ] 7.1 (Pendente: adiado para depois da apresentação.) Hosts extras por `MYFINANCE_HOSTS` sem afrouxar o padrão, manifest com ícones, `theme-color` e `apple-touch-icon` servidos pelo Django, e documentação no README.

## 8. Fechamento

- [ ] 8.1 Atualizar o README (funcionalidades novas, dados de exemplo pelo botão e pelo comando, acesso pelo celular, atalho Ctrl+K e seção "Redesign" na tabela de etapas do OpenSpec com links para esta mudança).
- [ ] 8.2 Marcar as tarefas, rodar `openspec validate --all --strict` e arquivar a mudança.
- [ ] 8.3 Rodar `npm ci`, `migrate` num banco novo, `npm run build`, `npm test`, `manage.py test`, `tests/browser/react.test.cjs`, `tests/browser/myfinance.test.cjs` e `openspec validate --all --strict`.
