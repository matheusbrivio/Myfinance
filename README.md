# MyFinance

Projeto acadêmico de controle de finanças pessoais. O MyFinance permite cadastrar receitas e despesas, filtrar transações, organizar categorias e acompanhar metas com aportes, retiradas e histórico.

O frontend usa React, TypeScript, Vite, Tailwind CSS, Motion, Recharts e three.js. O backend usa Django, Django REST Framework e SQLite. A aplicação foi preparada para execução local e funciona sem contas individuais.

## Funcionalidades

- **Visual redesenhado:** tema claro com cartões de vidro fosco, fundo de fluido animado, fonte Geist e grade de 12 colunas. A barra superior tem menu segmentado, e no celular o menu fica no rodapé.
- **Introdução:** tela inicial com os crachás 3D dos integrantes, que podem ser puxados e virados. Para entrar, segure o botão "Segure para entrar" por 1 segundo, com o mouse ou com a tecla Espaço. A tela desce para o site com uma transição, e a logo da barra volta para a introdução.
- **Dashboard por mês:** saldo disponível, receitas, despesas, reservado em metas e patrimônio do mês escolhido no seletor ‹ mês ›. Também mostra a distribuição das receitas do mês, as despesas por categoria, as metas e as transações recentes.
- **Resumo do mês:** até três frases calculadas a partir dos dados: variação de gastos por categoria, quanto foi guardado, previsão de conclusão de uma meta e maior gasto do mês.
- **Transações:** filtros por tipo, categoria e período, aplicados ao mudar, com seletor de datas animado. O botão "Exportar CSV" baixa a lista filtrada num arquivo que abre direto no Excel.
- **Dados de exemplo:** no dashboard vazio, um botão carrega três meses de dados para demonstração (veja [Dados de exemplo](#dados-de-exemplo)).
- **Categorias e metas:** cadastro, edição e exclusão. Para excluir, é preciso segurar o botão, o que evita exclusões por engano. As metas têm aportes, retiradas, histórico e progresso em anel.
- **Busca rápida:** `Ctrl+K` (`⌘K` no Mac) ou o botão "Buscar" abrem uma paleta com ações, atalhos para as páginas e busca de transações pela descrição.
- **Acessibilidade:** navegação pelo teclado, textos para leitor de tela e respeito à preferência por movimento reduzido. Com o movimento reduzido ou sem WebGL, as animações 3D dão lugar a imagens estáticas.

## Como executar a partir de um clone

### Pré-requisitos

- Python 3.12 com pip e suporte a ambientes virtuais.
- Node.js 26 com npm.

As dependências do backend estão no [`requirements.txt`](requirements.txt). Para o frontend, o `npm ci` instala as versões registradas no [`package-lock.json`](frontend/package-lock.json).

Execute os comandos na raiz do repositório.

**Windows (PowerShell)**

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe manage.py migrate
npm.cmd --prefix frontend ci
npm.cmd --prefix frontend run build
.\.venv\Scripts\python.exe manage.py runserver
```

**Linux ou macOS**

```bash
python3.12 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python manage.py migrate
npm --prefix frontend ci
npm --prefix frontend run build
.venv/bin/python manage.py runserver
```

Abra [http://127.0.0.1:8000/](http://127.0.0.1:8000/). A migração cria um banco SQLite vazio.

### Dados de exemplo

Para a demonstração, carregue três meses de dados de exemplo (6 categorias, receitas, despesas e 3 metas, sendo uma concluída). Os dados são criados pelas mesmas regras de saldo e de metas do uso normal.

- **Pelo site:** no dashboard vazio, clique em "Carregar dados de exemplo". O botão só aparece enquanto não há nenhuma transação.
- **Pelo terminal:** `.\.venv\Scripts\python.exe manage.py popular_exemplo`. Para apagar tudo e recriar os dados, use `--limpar`. Esse comando apaga todas as transações, metas e categorias.

## Testes

No PowerShell, com as dependências instaladas, execute:

```powershell
.\.venv\Scripts\python.exe manage.py test
npm.cmd --prefix frontend test
openspec.cmd validate --all --strict
```

Os dois primeiros comandos verificam o backend e o frontend. O último exige a CLI OpenSpec instalada e valida as especificações e as mudanças ativas. Consulte também o [guia do frontend](docs/frontend.md) e o [contrato da API](docs/api-v1.md).

## Como usei o OpenSpec

Usei o OpenSpec para registrar o que seria entregue, orientar a implementação e manter o histórico das decisões. Cada mudança registra a motivação e o escopo em `proposal.md`, as decisões técnicas em `design.md`, os requisitos e cenários verificáveis em `specs/` e o progresso em `tasks.md`.

1. **Propor** — usei `$openspec-propose <mudança>` para criar os artefatos antes de implementar.
2. **Aplicar** — usei `$openspec-apply-change <mudança>` para implementar e verificar as tarefas previstas.
3. **Validar** — usei `openspec validate <mudança> --strict` para verificar a estrutura e a consistência dos artefatos.
4. **Arquivar** — usei `$openspec-archive-change <mudança>` para sincronizar os requisitos com [as especificações principais](openspec/specs/) e guardar os artefatos concluídos no histórico.

| Etapa | Evidência no repositório |
| --- | --- |
| MVP com categorias, transações e dashboard Django | [Proposta](openspec/changes/archive/2026-11-23-criar-mvp-myfinance/proposal.md) · [Tarefas](openspec/changes/archive/2026-11-23-criar-mvp-myfinance/tasks.md) |
| V2 com metas, aportes, retiradas e histórico | [Proposta](openspec/changes/archive/2026-11-23-melhorias-myfinance-v2/proposal.md) · [Tarefas](openspec/changes/archive/2026-11-23-melhorias-myfinance-v2/tasks.md) |
| Migração para React com API REST | [Proposta](openspec/changes/migracao-frontend-react/proposal.md) · [Tarefas](openspec/changes/migracao-frontend-react/tasks.md) |
| Redesign e finalização (tema claro, introdução, dados de exemplo, dashboard por mês, insights, exportação e busca) | [Proposta](openspec/changes/finalizacao-myfinance/proposal.md) · [Design](openspec/changes/finalizacao-myfinance/design.md) · [Tarefas](openspec/changes/finalizacao-myfinance/tasks.md) |

O MVP e a V2 estão arquivados. A migração React e o redesign estão na pasta de mudanças ativas. O redesign tem pendentes o acabamento dos estados de tela e o acesso pelo celular (etapas F e G do [tasks.md](openspec/changes/finalizacao-myfinance/tasks.md)). O gráfico atual de distribuição do dinheiro corresponde a uma revisão posterior da interface. A especificação da migração ainda descreve o desenho original dos gráficos.

## Ferramentas e uso de IA

- **OpenSpec:** registro de cada mudança antes da implementação (proposta, design, requisitos com cenários verificáveis e tarefas), como descrito na seção anterior.
- **Claude e Claude Code:** assistentes de IA usados para planejar as etapas, escrever e revisar o código, criar os testes e rodar as verificações. Cada etapa passou por build, testes automatizados e revisão antes do commit, e as decisões ficaram registradas nos artefatos do OpenSpec.
- **React Bits:** biblioteca de componentes visuais usada como base. Os crachás 3D da introdução (componente Lanyard) vieram dela e foram adaptados para TypeScript.
- **transitions.dev:** referência para as transições e animações da interface.

## Integrantes

- Eduardo Rafael da Silva Suarez
- Matheus Brivio
- Murillo Muller
