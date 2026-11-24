# Acesso local

## Purpose

Permite abrir o site no celular pela rede local durante a apresentação, com ícone e cor certos na tela inicial.

## ADDED Requirements

### Requirement: Hosts da rede local por variável de ambiente

O sistema SHALL acrescentar a `ALLOWED_HOSTS` e às origens confiáveis os hosts informados em `MYFINANCE_HOSTS`, separados por vírgula. Sem a variável, o padrão SHALL continuar igual.

#### Scenario: Host extra

- **GIVEN** `MYFINANCE_HOSTS=192.168.0.10`
- **WHEN** o servidor recebe uma requisição para esse host
- **THEN** a requisição é aceita, e um host não listado continua recusado

#### Scenario: Sem a variável

- **GIVEN** `MYFINANCE_HOSTS` não está definida
- **WHEN** as configurações são carregadas
- **THEN** `ALLOWED_HOSTS` e as origens confiáveis são as mesmas de antes desta mudança

### Requirement: Manifest e ícones para a tela inicial

O sistema SHALL servir `manifest.webmanifest`, ícones de 192, 512 e maskable gerados a partir da logo, `theme-color` e `apple-touch-icon`, sem service worker.

#### Scenario: Adicionar à tela inicial

- **GIVEN** o site aberto no celular
- **WHEN** a página carrega
- **THEN** o manifest e os ícones respondem 200 e o documento declara `theme-color` e `apple-touch-icon`

### Requirement: Documentar o acesso pelo celular

O README SHALL explicar como iniciar o servidor com `runserver 0.0.0.0:8000`, como definir `MYFINANCE_HOSTS`, como descobrir o IP com `ipconfig` e que o celular precisa estar no mesmo Wi-Fi.

#### Scenario: Instruções no README

- **GIVEN** o README do projeto
- **WHEN** alguém procura o acesso pelo celular
- **THEN** encontra o comando `runserver 0.0.0.0:8000`, a variável `MYFINANCE_HOSTS` e o uso de `ipconfig`
