# Design

## Context

Os apps `categorias` e `transacoes` estão registrados, com arquivos iniciais de modelos, views e testes. A configuração usa SQLite e descoberta de templates nos apps. A configuração de URLs expõe apenas a rota administrativa padrão. Os contratos funcionais estão nos deltas de `specs/`.

## Goals / Non-Goals

**Goals**

- Reutilizar os apps existentes e entregar os fluxos por formulários e páginas renderizadas no servidor.
- Manter a integridade dos vínculos e dos valores monetários persistidos.

**Non-Goals**

- Autenticação nas telas do MVP, rotas de API e integrações externas.

## Decisions

- **Categorias.** Usar `Categoria` no app `categorias`. Validar os limites em formulário e normalizar o nome com `casefold()` para uma chave interna com unicidade no banco. Preservar a grafia exibida e recalcular a chave ao editar. A restrição cobre gravações concorrentes. A comparação via collation padrão do SQLite foi considerada e tem cobertura limitada para caracteres fora de ASCII.
- **Transações.** Usar `Transacao` no app `transacoes` com uma chave estrangeira obrigatória para `Categoria` e `on_delete=PROTECT`. Tratar o bloqueio de exclusão na view de confirmação. A checagem na tela pode orientar o usuário, e a proteção da relação vale no momento da exclusão.
- **Precisão monetária.** Validar e apresentar o valor como decimal de duas casas. Persistir o equivalente em centavos inteiros na coluna do valor, com restrição de positividade, para preservar a exatidão no SQLite. Validar no backend o limite de representação do inteiro de 64 bits antes de salvar. A afinidade numérica do SQLite para um campo decimal foi considerada e permite representação aproximada.
- **Páginas e formulários.** Usar URLs nomeadas, formulários Django e um template base com Bootstrap 5 servido localmente. Validar toda submissão no servidor. Confirmar exclusões com POST protegido por CSRF e redirecionar às listas após gravações bem-sucedidas. Para datas iguais na listagem de transações, usar o identificador em ordem decrescente como desempate.
- **Dashboard.** Usar a página inicial para recalcular os totais a cada acesso, somando centavos inteiros e formatando receitas, despesas e saldo com duas casas. Acumular os totais em inteiros Python para comportar somas acima do limite inteiro de uma linha do SQLite. Totais persistidos foram considerados e exigiriam sincronização adicional a cada alteração.

## Risks / Trade-offs

- Dois cadastros concorrentes podem passar pela validação do formulário → tratar a violação de unicidade como erro de nome duplicado, preservando o registro já gravado.
- A soma no dashboard percorre as transações → ler somente tipo e valor em uma consulta e iterar os resultados para manter o uso de memória previsível.
- Uma categoria pode ganhar um vínculo após abrir a página de exclusão → tratar a proteção no envio e manter os registros.

## Verificação dos requisitos não funcionais

| Requisito | Cenário de sucesso | Condição de erro verificável |
| --- | --- | --- |
| Interface responsiva | Em viewport de 360 px e em desktop, abrir dashboard, listas, formulários e confirmações e acessar seus controles. | Reprovar se um campo ou ação ficar inacessível ou se a página exigir rolagem horizontal fora de um contêiner responsivo da tabela. |
| Persistência SQLite | Criar categoria e transação e verificar os registros após reiniciar o processo Django com o mesmo arquivo SQLite. | Reprovar se os dados desaparecerem ou a configuração ativa usar outro banco. |
| Validação no backend | Enviar formulário válido diretamente ao servidor e verificar a gravação. | Enviar cargas inválidas diretamente, sem validação do navegador, e verificar os erros e a ausência de alteração. |
| Acesso sem autenticação | Em sessão anônima, acessar e usar os fluxos de categorias, transações e dashboard. | Reprovar se alguma rota do MVP exigir login, redirecionar para login ou bloquear uma operação válida por ausência de conta. |
| Ausência de APIs externas | Com acesso externo bloqueado, executar os fluxos e carregar os estilos locais. | Reprovar se houver solicitação a API externa ou se o bloqueio impedir um fluxo ou o carregamento do Bootstrap. |

## Migration Plan

Criar e aplicar a migração inicial de categorias antes da migração inicial de transações. Verificar a aplicação em SQLite vazio. Em ambiente com dados do MVP, preservar uma cópia do banco antes da reversão de migrações que removem tabelas.
