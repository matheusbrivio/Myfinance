# Migração da interface

## Purpose

Mantém os fluxos acessíveis durante a adoção gradual da interface React e verifica a preservação do banco financeiro.

## ADDED Requirements

### Requirement: Validar convivência e equivalência

O sistema SHALL manter a interface Django operante durante a validação da interface React sobre o mesmo SQLite. Trocar a entrada principal depois de verificar os fluxos e permitir voltar à interface anterior usando os dados atuais.

#### Scenario: Paridade de operações

- **GIVEN** as duas interfaces estão disponíveis e compartilham o banco
- **WHEN** o usuário cria e edita registros e faz um aporte por uma interface e consulta a outra
- **THEN** categorias, transações, metas, históricos e saldos refletem os mesmos registros conforme as regras Django

#### Scenario: Validação incompleta ou falha

- **GIVEN** há falha de build ou de equivalência na nova interface
- **WHEN** avalia-se a troca ou executa-se o retorno após a troca
- **THEN** a interface Django continua ou volta a ser acessível com o banco atual e com os registros gravados durante a convivência

### Requirement: Preservar dados existentes

O sistema SHALL aplicar migração aditiva e verificada no SQLite, preservando identificadores, valores exatos, datas, vínculos, categorias, metas e movimentações preexistentes.

#### Scenario: Preservação em banco com histórico

- **GIVEN** há uma cópia do SQLite da V2 com dados convencionais e de metas
- **WHEN** a migração é aplicada e ambos os frontends consultam a cópia
- **THEN** os registros e vínculos anteriores coincidem linha a linha, os saldos são iguais e novos lançamentos convencionais podem ter categoria nula

#### Scenario: Divergência na conferência

- **GIVEN** a comparação identifica perda de registro, quebra de vínculo ou mudança de centavos
- **WHEN** a validação de implantação é executada
- **THEN** a troca de interface é interrompida e a cópia de origem permanece utilizável
