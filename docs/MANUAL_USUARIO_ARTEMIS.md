# Manual do Usuário - ARTEMIS

## Sistema de Gestão de Viaturas Operacionais

**Versão:** 1.0  
**Data:** Janeiro 2026

---

## Sumário

1. [Introdução](#1-introdução)
2. [Acesso ao Sistema](#2-acesso-ao-sistema)
3. [Visão Geral da Interface](#3-visão-geral-da-interface)
4. [Dashboard](#4-dashboard)
5. [Gestão de Viaturas](#5-gestão-de-viaturas)
6. [Gestão de Itens](#6-gestão-de-itens)
7. [Check-In (Empenho)](#7-check-in-empenho)
8. [Check-Out (Devolução)](#8-check-out-devolução)
9. [Protocolos](#9-protocolos)
10. [Perfis de Acesso](#10-perfis-de-acesso)
11. [Perguntas Frequentes](#11-perguntas-frequentes)

---

## 1. Introdução

### 1.1 O que é o ARTEMIS?

O **ARTEMIS** é um sistema de gestão de viaturas operacionais desenvolvido para órgãos governamentais, especificamente para agentes de trânsito. O sistema permite:

- Controle completo do ciclo de vida das viaturas
- Registro de empenho (check-in) e devolução (check-out) de veículos
- Checklist detalhado de itens e condições do veículo
- Geração automática de protocolos
- Rastreamento de quilometragem e histórico de uso
- Registro fotográfico das condições do veículo

### 1.2 Requisitos do Sistema

- Navegador web moderno (Chrome, Firefox, Edge, Safari)
- Conexão com a internet
- Credenciais de acesso válidas (Uranus/Keycloak)

---

## 2. Acesso ao Sistema

### 2.1 Realizando Login

O ARTEMIS utiliza autenticação integrada com o sistema **Uranus (Keycloak)**. Não há cadastro manual de usuários.

**Passo a passo:**

1. Acesse a URL do sistema: `https://artemis.lovable.app`
2. Clique no botão **"Entrar com Uranus"**
3. Você será redirecionado para a página de login do Uranus
4. Informe suas credenciais institucionais (usuário e senha)
5. Após autenticação bem-sucedida, você será redirecionado ao Dashboard

> **Nota:** Seu perfil de acesso (Agente, Gestor ou Admin) é determinado automaticamente com base nos grupos do Uranus.

### 2.2 Logout

Para sair do sistema:

1. Clique no ícone de usuário no canto superior direito
2. Selecione **"Sair"**
3. Você será desconectado e redirecionado à tela de login

### 2.3 Mapeamento de Perfis

| Grupo Uranus | Perfil ARTEMIS |
|--------------|----------------|
| Administrador | Gestor |
| Supervisor | Gestor |
| Outros grupos | Agente |

---

## 3. Visão Geral da Interface

### 3.1 Menu de Navegação

O menu lateral permite acesso rápido a todas as funcionalidades:

| Ícone | Item | Descrição |
|-------|------|-----------|
| 🏠 | Dashboard | Visão geral e estatísticas |
| 🚗 | Viaturas | Cadastro e gestão de veículos |
| 📦 | Itens | Cadastro de itens/equipamentos |
| ✅ | Check-In | Registro de empenho de viatura |
| ↩️ | Check-Out | Registro de devolução |
| 📋 | Protocolos | Histórico de protocolos |

### 3.2 Área Principal

A área central exibe o conteúdo da funcionalidade selecionada, com:

- **Título da página**
- **Ações disponíveis** (botões de criar, editar, etc.)
- **Filtros e busca** (quando aplicável)
- **Listagem ou formulários**

---

## 4. Dashboard

### 4.1 Visão Geral

O Dashboard apresenta um resumo executivo do sistema:

- **Total de Viaturas:** Quantidade de veículos cadastrados
- **Viaturas Disponíveis:** Veículos prontos para uso
- **Viaturas Empenhadas:** Veículos em uso por agentes
- **Protocolos Ativos:** Empenhos em andamento

### 4.2 Estatísticas

Gráficos e indicadores mostram:

- Distribuição de status das viaturas
- Histórico de empenhos recentes
- Alertas de manutenção

---

## 5. Gestão de Viaturas

### 5.1 Visualizando Viaturas

1. Acesse **Viaturas** no menu lateral
2. Visualize a lista de veículos cadastrados
3. Use o campo de busca para filtrar por placa, prefixo ou modelo

### 5.2 Cadastrando Nova Viatura

> **Permissão necessária:** Gestor ou Admin

1. Clique no botão **"Nova Viatura"**
2. Preencha os dados obrigatórios:
   - **Placa:** Formato padrão (ABC-1234 ou ABC1D23)
   - **Prefixo:** Identificação interna
   - **Marca/Modelo:** Fabricante e modelo do veículo
3. Preencha os dados opcionais:
   - Ano de fabricação
   - Chassi/Renavam
   - Quilometragem inicial
   - Categoria/Tipo
   - Situação do licenciamento
4. Clique em **"Criar"**

### 5.3 Editando Viatura

> **Permissão necessária:** Gestor ou Admin

1. Localize a viatura na listagem
2. Clique no ícone de **edição** (lápis)
3. Modifique os campos desejados
4. Clique em **"Salvar"**

### 5.4 Status Operacional

As viaturas podem ter os seguintes status:

| Status | Descrição | Cor |
|--------|-----------|-----|
| Disponível | Pronta para uso | 🟢 Verde |
| Empenhada | Em uso por agente | 🟡 Amarelo |
| Manutenção | Em reparo/revisão | 🟠 Laranja |
| Inoperante | Fora de operação | 🔴 Vermelho |
| Acidentada | Envolvida em acidente | 🔴 Vermelho |
| Batida | Com avarias | 🔴 Vermelho |

---

## 6. Gestão de Itens

### 6.1 O que são Itens?

Itens são equipamentos, ferramentas, EPIs e acessórios que devem estar presentes nas viaturas durante o check-in e check-out.

### 6.2 Visualizando Itens

1. Acesse **Itens** no menu lateral
2. Visualize a lista de itens cadastrados
3. Filtre por nome, tipo ou categoria

### 6.3 Cadastrando Novo Item

> **Permissão necessária:** Gestor ou Admin

1. Clique em **"Novo Item"**
2. Preencha:
   - **Nome:** Descrição do item
   - **Tipo:** Equipamento, Ferramenta, EPI, Documento, Acessório, Outro
   - **Categoria:** Segurança, Sinalização, Mecânico, Elétrico, Comunicação, Outro
   - **Descrição:** Detalhes adicionais (opcional)
3. Clique em **"Criar"**

### 6.4 Tipos de Item

| Tipo | Exemplos |
|------|----------|
| Equipamento | Rádio comunicador, GPS |
| Ferramenta | Chave de roda, macaco |
| EPI | Colete refletivo, luvas |
| Documento | CRLV, Seguro |
| Acessório | Tapetes, suporte celular |

### 6.5 Categorias

| Categoria | Descrição |
|-----------|-----------|
| Segurança | Itens de proteção |
| Sinalização | Cones, triângulos |
| Mecânico | Ferramentas mecânicas |
| Elétrico | Equipamentos elétricos |
| Comunicação | Rádios, telefones |

---

## 7. Check-In (Empenho)

O Check-In é o processo de **retirada da viatura** pelo agente para uso operacional.

### 7.1 Iniciando um Check-In

1. Acesse **Check-In** no menu lateral
2. Visualize a lista de viaturas disponíveis
3. Clique na viatura desejada
4. Clique em **"Iniciar Check-In"**

### 7.2 Etapas do Check-In

#### Etapa 1: Dados Iniciais

- Confirme seus dados de identificação
- Verifique a data/hora do empenho
- O sistema captura sua localização (GPS)

#### Etapa 2: Estado Geral do Veículo

Avalie e registre:

- **Estado geral:** Bom, Regular ou Mau
- **Nível de combustível:** Percentual do tanque
- **Quilometragem atual:** Odômetro do veículo
- **Observações gerais:** Notas importantes

#### Etapa 3: Condições Mecânicas

Verifique e registre:

| Item | Status Possíveis |
|------|------------------|
| Freios | Em condições / Sem condições |
| Pneus | Em condições / Sem condições |
| Luzes | Em condições / Sem condições |
| Limpadores | Em condições / Sem condições |
| Nível de óleo | Normal / Baixo |
| Placa | Presente / Ausente |

> **Importante:** Se algum item estiver "Sem condições" ou ausente, é obrigatório adicionar uma observação.

#### Etapa 4: Itens do Veículo

Verifique a presença e condição dos itens:

- Marque a situação de cada item (Presente, Ausente, Incompleto)
- Informe quantidade quando aplicável
- Adicione observações para itens com problemas

#### Etapa 5: Registro Fotográfico

Tire fotos do veículo para documentação:

- **Obrigatórias:** Frente, traseira, laterais, painel
- **Opcionais:** Danos existentes, itens específicos

### 7.3 Finalizando o Check-In

1. Revise todas as informações
2. Confirme que os dados estão corretos
3. Clique em **"Finalizar Check-In"**
4. Um **protocolo de empenho** será gerado automaticamente

> **Resultado:** A viatura passa para status "Empenhada" e fica vinculada ao agente.

---

## 8. Check-Out (Devolução)

O Check-Out é o processo de **devolução da viatura** após o uso operacional.

### 8.1 Iniciando um Check-Out

1. Acesse **Check-Out** no menu lateral
2. Visualize seus protocolos ativos (viaturas empenhadas)
3. Clique no protocolo desejado
4. Clique em **"Realizar Devolução"**

### 8.2 Etapas do Check-Out

O processo é similar ao Check-In, com algumas diferenças:

#### Etapa 1: Dados da Devolução

- Confirme data/hora da devolução
- Localização é capturada automaticamente
- O sistema calcula o tempo total de empenho

#### Etapa 2: Estado do Veículo na Devolução

- Registre o estado geral atual
- Informe nível de combustível atual
- **Quilometragem deve ser maior ou igual** à do check-in

#### Etapa 3: Condições Mecânicas

- Reavalie todos os itens mecânicos
- Registre qualquer alteração desde o check-in
- Documente problemas ocorridos durante o uso

#### Etapa 4: Itens do Veículo

- Confirme presença/ausência de todos os itens
- Registre itens danificados ou perdidos
- Justifique alterações em relação ao check-in

#### Etapa 5: Fotos da Devolução

- Fotografe o veículo na devolução
- Documente novos danos (se houver)
- Registre o painel com quilometragem final

### 8.3 Finalizando o Check-Out

1. Revise todas as informações
2. Adicione observações finais se necessário
3. Clique em **"Finalizar Devolução"**
4. Um **protocolo de devolução** será gerado

> **Resultado:** A viatura retorna ao status "Disponível" (ou outro, conforme condição).

---

## 9. Protocolos

### 9.1 Tipos de Protocolo

| Tipo | Descrição | Formato |
|------|-----------|---------|
| Empenho | Registro de retirada | EMP-YYYYMMDD-XXXX |
| Devolução | Registro de retorno | DEV-YYYYMMDD-XXXX |

### 9.2 Visualizando Protocolos

1. Acesse **Protocolos** no menu lateral
2. Visualize a lista completa
3. Filtre por:
   - Status (Em andamento, Concluído, Cancelado)
   - Data
   - Viatura
   - Agente (apenas Gestor/Admin)

### 9.3 Detalhes do Protocolo

Clique em um protocolo para ver:

- Dados do agente responsável
- Informações da viatura
- Data/hora de empenho e devolução
- Checklist completo
- Fotos registradas
- Observações

### 9.4 Status do Protocolo

| Status | Descrição |
|--------|-----------|
| Em andamento | Viatura empenhada, aguardando devolução |
| Concluído | Ciclo completo (empenho + devolução) |
| Cancelado | Protocolo cancelado por Gestor/Admin |

---

## 10. Perfis de Acesso

### 10.1 Agente

O perfil básico de usuário operacional.

**Permissões:**

| Recurso | Ver | Criar | Editar | Excluir |
|---------|-----|-------|--------|---------|
| Viaturas | ✅ | ❌ | ❌ | ❌ |
| Itens | ✅ | ❌ | ❌ | ❌ |
| Check-In | ✅ Próprios | ✅ | ❌ | ❌ |
| Check-Out | ✅ Próprios | ✅ | ❌ | ❌ |
| Protocolos | ✅ Próprios | ❌ | ❌ | ❌ |

### 10.2 Gestor

Perfil de supervisão e gestão.

**Permissões:**

| Recurso | Ver | Criar | Editar | Excluir |
|---------|-----|-------|--------|---------|
| Viaturas | ✅ Todos | ✅ | ✅ | ✅ |
| Itens | ✅ Todos | ✅ | ✅ | ✅ |
| Check-In | ✅ Todos | ✅ | ✅ | ❌ |
| Check-Out | ✅ Todos | ✅ | ✅ | ❌ |
| Protocolos | ✅ Todos | ❌ | ✅ | ❌ |

### 10.3 Admin

Perfil com acesso total ao sistema.

**Permissões:** Todas as permissões do Gestor, mais:

- Gestão de usuários/perfis
- Acesso a logs de auditoria
- Configurações do sistema

---

## 11. Perguntas Frequentes

### 11.1 Login e Acesso

**P: Esqueci minha senha. O que fazer?**
R: O ARTEMIS utiliza autenticação Uranus. Entre em contato com o suporte de TI da sua instituição para redefinir a senha.

**P: Meu acesso foi bloqueado. Como proceder?**
R: Contate um Gestor ou Administrador do sistema para verificar seu status de acesso.

**P: Por que não consigo criar viaturas?**
R: Apenas usuários com perfil Gestor ou Admin podem cadastrar viaturas. Verifique seu perfil de acesso.

### 11.2 Check-In e Check-Out

**P: Não consigo finalizar o check-in. O que pode ser?**
R: Verifique se:
- Todos os campos obrigatórios estão preenchidos
- Itens com problemas possuem observações
- A quilometragem informada é válida

**P: A viatura que preciso não aparece na lista de check-in.**
R: A viatura pode estar:
- Empenhada por outro agente
- Em manutenção
- Com status "Inoperante"

**P: Preciso cancelar um empenho. É possível?**
R: Apenas Gestores ou Admins podem cancelar protocolos. Entre em contato com seu supervisor.

**P: A quilometragem do check-out está menor que a do check-in. Como resolver?**
R: Verifique se o valor informado está correto. A quilometragem de devolução deve ser igual ou maior que a de retirada.

### 11.3 Problemas Técnicos

**P: O sistema está lento. O que fazer?**
R: Verifique sua conexão com a internet. Se o problema persistir, tente:
- Limpar o cache do navegador
- Usar outro navegador
- Contatar o suporte técnico

**P: As fotos não estão sendo enviadas.**
R: Verifique:
- Permissão de câmera no navegador
- Tamanho das imagens (máximo recomendado: 5MB cada)
- Conexão com a internet

**P: Perdi a conexão durante o check-in. Perdi os dados?**
R: O sistema salva automaticamente o progresso em cada etapa. Ao reconectar, você pode continuar de onde parou.

---

## Suporte

Para dúvidas ou problemas não cobertos neste manual:

- **E-mail:** suporte@artemis.gov.br
- **Telefone:** (XX) XXXX-XXXX
- **Horário:** Segunda a Sexta, 8h às 18h

---

**© 2026 ARTEMIS - Sistema de Gestão de Viaturas Operacionais**

*Este manual é propriedade da instituição e seu conteúdo é confidencial.*
