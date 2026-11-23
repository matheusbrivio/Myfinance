# MyFinance

Projeto acadêmico de controle de finanças pessoais. O MyFinance permite cadastrar receitas e despesas, filtrar transações, organizar categorias e acompanhar metas com aportes, retiradas e histórico. O painel mostra a distribuição do dinheiro recebido entre saldo disponível, despesas convencionais e reserva atual em metas.

O frontend usa React, TypeScript, Vite, Tailwind CSS, shadcn/ui e Recharts. O backend usa Django, Django REST Framework e SQLite. A aplicação foi preparada para execução local e funciona sem contas individuais.

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

Abra [http://127.0.0.1:8000/](http://127.0.0.1:8000/). A migração cria um banco SQLite vazio. Para demonstrar o painel, cadastre uma receita, uma despesa e uma meta, depois faça um aporte.

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

O MVP e a V2 estão arquivados. A migração React tem as tarefas concluídas e ainda está na pasta de mudanças ativas. O gráfico atual de distribuição do dinheiro corresponde a uma revisão posterior da interface. A especificação da migração ainda descreve o desenho original dos gráficos.
