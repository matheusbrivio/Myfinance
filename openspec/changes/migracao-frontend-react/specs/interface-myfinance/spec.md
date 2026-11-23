# Interface MyFinance

## ADDED Requirements

### Requirement: Navegar pela aplicação

O sistema SHALL apresentar dashboard, transações, categorias e metas com navegação cliente, seção ativa e acesso direto aos endereços, incluindo após recarregar a página.

#### Scenario: Navegação React

- **GIVEN** o usuário está no dashboard
- **WHEN** abre Transações, volta pelo navegador e acessa Metas
- **THEN** a seção ativa acompanha a URL e as trocas internas não recarregam o documento

#### Scenario: URL direta ou inválida

- **GIVEN** o usuário abre um endereço profundo válido ou inexistente
- **WHEN** o servidor entrega a entrada da aplicação
- **THEN** a rota válida carrega o conteúdo e a inválida oferece uma mensagem em português e retorno à navegação

### Requirement: Formulários e feedback de envio

O sistema SHALL oferecer formulários reutilizáveis com rótulos, obrigatoriedade, erros por campo, estado de envio e confirmação de exclusão. Bloquear reenvio enquanto a gravação estiver pendente e atualizar dados conforme o resultado confirmado pelo Django.

#### Scenario: Operação bem-sucedida

- **GIVEN** o formulário está válido
- **WHEN** o usuário salva, realiza aporte ou retirada ou confirma exclusão
- **THEN** o botão indica envio e evita novo disparo, e após sucesso os dados são reconsultados

#### Scenario: Erro de formulário persistente

- **GIVEN** a API rejeita um campo
- **WHEN** passam mais de quatro segundos e o usuário edita outro campo
- **THEN** o erro permanece junto ao campo inválido até que ele seja corrigido, sem descartar os outros dados

#### Scenario: Cancelar exclusão

- **GIVEN** a confirmação está aberta
- **WHEN** o usuário cancela
- **THEN** o registro continua disponível e nenhuma escrita é enviada

### Requirement: Notificar resultados de operações

O sistema SHALL usar toasts em pt-BR após cadastro, edição, exclusão, aporte e retirada. Encerrar automaticamente sucessos e avisos informativos em quatro segundos, com fechamento manual e transição. Manter erros críticos acessíveis até ação explícita.

#### Scenario: Fechar automaticamente após quatro segundos

- **GIVEN** uma operação é confirmada e seu toast aparece
- **WHEN** o relógio avança até pouco antes de quatro segundos e depois atinge quatro segundos
- **THEN** o toast ainda existe antes do prazo e inicia a saída quando o prazo vence

#### Scenario: Fechar manualmente ou revisar erro

- **GIVEN** há aviso informativo e uma mensagem de erro crítico
- **WHEN** o usuário fecha o aviso manualmente e aguarda mais de quatro segundos
- **THEN** o aviso sai e a mensagem crítica continua legível e dispensável manualmente

## MODIFIED Requirements

### Requirement: RNF01 Aplicar identidade visual

O sistema SHALL apresentar a interface React com identidade dark, fundo preto ou grafite, cards cinza-escuro, textos claros, bordas e sombras discretas e cantos arredondados. Usar azul, ciano e roxo em destaques e gráficos, verde para valores positivos e coral ou vermelho para negativos, com sinais e rótulos textuais.

#### Scenario: Componentes consistentes

- **GIVEN** a interface está disponível
- **WHEN** o usuário percorre dashboard, histórico e formulários
- **THEN** cabeçalho identifica aplicação e página, a navegação mantém seus destinos e paleta, ícones, espaçamento e tipografia são consistentes

#### Scenario: Ação inacessível

- **GIVEN** o usuário navega por teclado ou sem ícones
- **WHEN** procura ação de editar, excluir ou movimentar
- **THEN** a verificação falha se a ação depender apenas de ícone, cor ou ponteiro ou se o foco ficar invisível

### Requirement: RNF02 Respeitar preferências de movimento

O sistema SHALL usar transições discretas em cards, hover, páginas, modais, gráficos, barras e saída de toasts. Preservar os estados finais e o feedback e desativar movimento decorativo sob prefers-reduced-motion.

#### Scenario: Feedback e transições

- **GIVEN** a preferência de movimento reduzido está desativada
- **WHEN** o usuário navega, abre e fecha modal, atualiza gráfico e barra e confirma uma operação
- **THEN** há transições discretas e o feedback permanece legível

#### Scenario: Movimento reduzido e erro

- **GIVEN** prefers-reduced-motion está ativo
- **WHEN** a tela carrega, o usuário abre confirmação e envia formulário inválido
- **THEN** a interface apresenta estados finais sem movimento decorativo, mantém foco e exibe o erro

### Requirement: RNF03 Adaptar a interface à tela

O sistema SHALL adaptar sidebar, navegação, cards, gráficos, tabelas, formulários e modais para smartphone, tablet e desktop, sem rolagem horizontal indevida.

#### Scenario: Viewports representativas

- **GIVEN** o navegador usa 360, 768 ou 1280 px
- **WHEN** o usuário navega, filtra transações e abre o dashboard e formulários
- **THEN** a navegação se adapta, os cards se reorganizam, os gráficos cabem e ações e campos são acessíveis

#### Scenario: Conteúdo extenso

- **GIVEN** há nomes longos e valores grandes
- **WHEN** a página é testada a 360 px
- **THEN** a rolagem horizontal fica limitada às tabelas que precisem dela, e o teste falha se controles ou valores ficarem inacessíveis
