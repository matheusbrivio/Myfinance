# Design

## Context

O MVP implementado tem os apps `categorias` e `transacoes`, SQLite, Bootstrap 5 local e rotas públicas. `Transacao.valor_centavos` é um inteiro positivo de 64 bits, o formulário aceita ponto ou vírgula decimal, a categoria é obrigatória com exclusão protegida e os únicos tipos persistidos são `receita` e `despesa`. O dashboard soma os centavos em Python. A moeda atual omite símbolo e agrupamento, `LANGUAGE_CODE` é `en-us` e o seletor nativo de data segue o navegador. A descrição hoje é obrigatória no CRUD.

## Goals / Non-Goals

**Goals**

- Preservar as rotas, os dados legados e as operações convencionais de categorias e transações, com as mudanças explícitas dos deltas.
- Ter uma origem verificável para o valor de cada transferência e manter os cálculos exatos no SQLite.

**Non-Goals**

- Autenticação, APIs externas, recorrência de contribuições e transferência entre metas.

## Decisions

- **Representação monetária.** Expor `Decimal` em reais nos modelos por uma subclasse de `models.DecimalField` com `max_digits=19` e `decimal_places=2`, persistida em SQLite com tipo inteiro e codec explícito de centavos. Limitar cada valor a R$ 92.233.720.368.547.758,07, o máximo legado, e rejeitar excesso de precisão ou faixa. Configurar o campo para evitar o conversor aproximado de SQLite do Django e verificar leitura ORM, parâmetros de consulta e restrições por teste. O DecimalField padrão com afinidade numérica pode perder centavos no limite já aceito. Somar em inteiros Python e formatar no servidor, inclusive quando a soma exceder uma linha de SQLite.
- **Modelagem e categorias.** Criar `Meta` com dados cadastrais, objetivo, criação e arquivamento, e `MovimentacaoMeta` com FK protegida para meta e relação única protegida para a transação. Guardar valor, tipo e instante na transação que representa a movimentação, consultando a partir do vínculo único. Preservar os códigos persistidos `receita` e `despesa` e acrescentar `aporte_meta` e `retirada_meta`. Manter a FK obrigatória a categoria usando uma categoria interna identificada por marcador próprio para lançamentos de meta, criada com nome livre em caso de colisão, protegida e indisponível no CRUD convencional. Categorias existentes mantêm nomes, dados e comportamento. Limitar nomes de meta a 180 caracteres, para os prefixos e o nome caberem na descrição de 200 caracteres. Gravar o nome vigente na descrição, preservando-a em renomeações.
- **Operações e concorrência.** Criar a transação e a movimentação juntas em `transaction.atomic()`. No SQLite, iniciar as transações de escrita em modo `IMMEDIATE` e fazer a leitura e verificação de saldos dentro desse limite, antes da gravação. O bloqueio serializa também aportes a metas diferentes e as escritas convencionais. Tratar contenção como erro recuperável em português. Bloquear edição e exclusão de lançamentos gerados e confirmar operações destrutivas por POST com CSRF. Aportes sem saldo, retiradas além da reserva e falhas intermediárias preservam os registros. Lançamentos convencionais válidos podem produzir disponível negativo, como no MVP.
- **Ciclo da meta.** Aporte inicial vazio ou zero equivale a ausência de movimentação, e valor positivo usa a mesma operação de aporte dentro da criação da meta. Aporte inicial gravado passa a compor o histórico e o valor acumulado. Excluir fisicamente apenas meta sem movimentações. Encerrar com histórico requer reserva zerada e arquiva a meta para consulta. Metas concluídas ou vencidas continuam movimentáveis até o encerramento, respeitados os saldos.
- **Progresso e prazo.** Usar o dia civil em `America/Sao_Paulo`. Restante é o máximo entre zero e objetivo menos acumulado. Dias restantes são o máximo entre zero e prazo menos hoje. Uma meta que atingiu o objetivo fica concluída mesmo após o prazo, e uma incompleta vence no dia seguinte ao prazo. Aporte mensal em meta em andamento é o valor restante dividido pelo máximo entre um e o arredondamento para cima de dias restantes divididos por 30, com arredondamento para cima ao centavo. Exibir zero nas concluídas e indisponível nas vencidas incompletas. Exibir percentual com duas casas quando necessário e limitar a barra visual a 100%. Validar objetivo positivo na entrada e no banco.
- **Leitura de saldos e dashboard.** Projetar saldos e progresso do histórico persistido em uma leitura consistente, incluindo data e identificador para desempate e o saldo acumulado de cada meta por ordem de movimentação. O dashboard usa o mesmo cálculo do detalhe da meta e mostra cinco transações recentes. Servir Chart.js localmente, entregar os números via JSON seguro e formatar valores monetários textuais no servidor. O gráfico recebe proporções escaladas para visualização e usa rótulos monetários exatos, evitando depender de números JavaScript para valores de 64 bits.
- **Localização e interface.** Configurar Django para `pt-br` e centralizar formatação, labels e mensagens. Usar campos digitáveis com validação de DD/MM/AAAA e um calendário local com textos em português, pois o seletor nativo pode usar o idioma do navegador. Preservar a aceitação de ISO em submissões legadas. Usar recursos locais no template base, priorizar foco e acesso por teclado, aplicar `prefers-reduced-motion` ao CSS e desativar as animações de Chart.js via consulta à mesma preferência. Os fluxos críticos continuam acessíveis por páginas e formulários quando JavaScript estiver indisponível.

## Risks / Trade-offs

- SQLite tem um escritor por vez → manter operações curtas, responder a contenção com erro recuperável e testar com conexões distintas em banco de arquivo.
- Duplicar valor ou tipo entre tabelas favorece divergência → adotar o lançamento vinculado como fonte única e guardar o código de tipo na transação.
- A formatação localizada pode confundir ponto decimal com separador de milhar → interpretar agrupamento quando acompanhado de vírgula decimal e explicitar exemplos no formulário.
- A base canônica de specs está vazia → os deltas MODIFIED usam os nomes exatos do MVP implementado. O arquivamento da V2 depende da consolidação prévia do MVP com autorização separada.

## Migration Plan

1. Em cópia do SQLite, registrar contagens, IDs, tipos, datas, descrições, categorias e somas de centavos para comparação.
2. Acrescentar o novo esquema de metas, o marcador interno, as novas escolhas de tipo e a coluna monetária. Copiar os centavos existentes diretamente para a representação inteira do novo campo, com IDs e vínculos intactos. Ajustar a descrição para aceitar texto vazio.
3. Conferir contagens, vínculos e valores linha a linha, com limites de 64 bits e totais acima do limite de uma linha. Trocar a leitura para o novo campo e remover a coluna legada em etapa posterior à verificação.
4. Interromper em caso de divergência. Preservar cópia pré-migração. Uma reversão após uso da V2 precisa preservar um snapshot dos dados V2, pois o esquema do MVP não representa movimentações de metas.
