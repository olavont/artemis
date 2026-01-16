# ARTEMIS - Regras e Convenções da Aplicação

## Visão Geral

Sistema de gestão de viaturas operacionais para órgãos governamentais, especificamente para agentes de trânsito. O sistema controla check-in/check-out de veículos, protocolos de empenho/devolução e gestão de itens de viatura.

---

## 1. Autenticação

### 1.1 Método de Login
- **Principal (Mobile/Web)**: Direct Access Grant (Login via Username/Password na interface do App)
- **Fluxo**: O frontend gerencia a troca de credenciais por tokens diretamente com o Keycloak.

### 1.2 Fluxo de Autenticação Detalhado
1. **Input**: Usuário insere credenciais na tela `Auth.tsx`.
2. **Token Exchange**: App faz POST `/token` para o Keycloak (Grant Type: `password`).
3. **User Info**: App faz GET `/userinfo` para validar token e pegar dados básicos.
4. **Enriquecimento (Uranus API)**: 
   - App consulta `/uranus/core/users/{username}` usando o token.
   - Headers: `X-Tenant` (Master Tenant) e `Authorization`.
   - **Objetivo**: Obter grupos e tenant de origem do usuário.
5. **Definição de Papel (Role)**:
   - Frontend analisa grupos retornados pelo Uranus.
   - Mapeia para roles da aplicação (`agente` ou `gestor`).
6. **Sincronização (Supabase)**:
   - App faz `upsert` na tabela `public.profiles`.
   - Atualiza: nome, matrícula, perfil (role), ativo e **tenant**.
7. **Sessão Local**:
   - Armazena `keycloak_user` (dados do usuário)
   - Armazena `keycloak_tokens` (access/refresh tokens)
   - Armazena `user_tenant`

### 1.3 Logout
- Remove dados do `localStorage`
- Redireciona para logout do Keycloak com `id_token_hint`
- Retorna para `/auth` após logout

### 1.4 Mapeamento de Grupos Uranus → Roles
Baseado na implementação em `Auth.tsx`:
```typescript
// 1. Busca grupos ativos do usuário na API Uranus
// 2. Verifica se algum grupo contém: 'administrador', 'supervisor', 'admin', ou 'gestor'
// 3. Mapeamento:
//    - Se encontrar algum dos acima → perfil = 'gestor'
//    - Caso contrário → perfil = 'agente'
// Nota: O perfil 'admin' atualmente não é atribuído automaticamente pelo login, 
// devendo ser gerido via banco se necessário, ou assumido como 'gestor' nas regras de negócio.
```

---

## 2. Perfis e Permissões

### 2.1 Tipos de Perfil (enum `perfil_usuario`)
- `admin`: Acesso total ao sistema
- `gestor`: Acesso de gestão (quase igual ao admin)
- `agente`: Acesso restrito (padrão para novos usuários)

### 2.2 Matriz de Permissões

| Recurso | Admin | Gestor | Agente |
|---------|-------|--------|--------|
| Ver viaturas | ✅ | ✅ | ✅ |
| Criar/Editar/Deletar viaturas | ✅ | ✅ | ❌ |
| Ver itens | ✅ | ✅ | ✅ |
| Gerenciar itens | ✅ | ✅ | ❌ |
| Ver todos os protocolos | ✅ | ✅ | ❌ |
| Ver próprios protocolos | ✅ | ✅ | ✅ |
| Criar protocolos | ✅ | ✅ | ✅ |
| Ver perfis de usuários | ✅ | ✅ | ❌ |
| Gerenciar perfis | ✅ | ❌ | ❌ |
| Ver logs de auditoria | ✅ | ✅ | ❌ |
| Ver dashboard completo | ✅ | ✅ | ❌ |

### 2.3 Função de Verificação de Permissão
```sql
-- Função usada nas RLS policies
CREATE FUNCTION public.is_admin_or_gestor(user_id uuid) RETURNS boolean
-- Retorna true se o usuário tem perfil 'admin' ou 'gestor' e está ativo
```

---

## 3. Estrutura do Banco de Dados

### 3.1 Tabelas Principais

#### `profiles`
- Armazena dados dos usuários
- `id`: UUID do usuário (mesmo do Keycloak)
- `nome`: Nome completo
- `matricula`: Matrícula funcional
- `perfil`: Tipo de perfil (admin/gestor/agente)
- `ativo`: Se o usuário está ativo
- `tenant`: Tenant do Uranus

#### `viaturas`
- Cadastro de veículos
- `tenant`: Identificador do cliente/órgão (RLS)
- `status_operacional`: disponivel, em_uso, manutencao, inativa
- `situacao_licenciamento`: regular, irregular, vencida

#### `protocolos_empenho`
- Registro de retirada de viatura
- `tenant`: Identificador do cliente/órgão (RLS)
- `status`: em_andamento, finalizado, cancelado
- Contém dados de localização GPS

#### `protocolos_devolucao`
- Registro de devolução de viatura
- Vinculado ao `protocolo_empenho_id`

#### `checklists_veiculo`
- Checklist técnico do veículo
- Níveis de combustível, óleo, condições mecânicas

#### `checklist_itens`
- Itens verificados no checklist
- `situacao`: presente, incompleto, ausente

#### `itens_viatura`
- Catálogo de itens disponíveis
- `categoria`: seguranca, documentacao, acessorios, emergencia, etc.
- `tipo`: permanente, consumivel

#### `viatura_itens_config`
- Configuração de quais itens cada viatura deve ter
- `obrigatoriedade`: obrigatorio, recomendado, opcional

#### `fotos_checklist`
- Fotos tiradas durante check-in/check-out
- `tipo_foto`: frente, lateral_esquerda, lateral_direita, traseira, etc.

#### `audit_logs`
- Logs de auditoria automáticos
- Registra INSERT, UPDATE, DELETE em tabelas críticas

---

## 4. Validações de Itens

### 4.1 Status de Situação (enum `situacao_item`)
- `presente`: Item está presente e em condições
- `incompleto`: Item presente mas com problemas
- `ausente`: Item não encontrado

### 4.2 Regra de Observação Obrigatória
**Se o status for `incompleto` ou `ausente`, a observação é OBRIGATÓRIA.**

```typescript
// Validação no frontend
if (status === 'incompleto' || status === 'ausente') {
  if (!observacao || observacao.trim() === '') {
    // Mostrar erro - observação obrigatória
  }
}
```

---

## 5. Fluxo de Check-in/Check-out

### 5.1 Etapas do Check-in (Empenho)
1. **Step 1**: Dados iniciais (agente, local, km, GPS)
2. **Step 2**: Condições do veículo (combustível, óleo, mecânica)
3. **Step 3**: Verificação de itens/equipamentos
4. **Step 4**: Galeria de fotos (frente, laterais, traseira)
5. **Step 5**: Resumo e confirmação

### 5.2 Etapas do Check-out (Devolução)
Similar ao check-in, registrando estado de devolução.

### 5.3 Validação de Quilometragem
- KM atual deve ser >= KM anterior da viatura
- Validação no blur do campo

---

---

## 6. Row Level Security (RLS) & Multi-tenancy

### 6.1 Isolamento por Tenant
O sistema utiliza isolamento lógico de dados baseado na coluna `tenant`.
- **Regra**: Usuários só podem visualizar dados vinculados ao seu mesmo tenant.
- **Implementação**: Coluna `tenant` (text) em todas as tabelas principais.
- **Definição**: O tenant é definido no momento do login (sincronizado do Uranus) e salvo na tabela `profiles`.

### 6.2 Padrão de Políticas
- Usar função `get_my_tenant()` (ou lookup em profiles) para filtrar dados.
- Usar função `is_admin_or_gestor()` para verificar permissões de role dentro do tenant.
- Usar `auth.uid()` para verificar propriedade do registro.
- **NUNCA** referenciar a própria tabela dentro da policy recursivamente sem cuidado.

### 6.3 Exemplos de Políticas
```sql
-- Função helper
CREATE FUNCTION public.get_my_tenant() RETURNS text AS $$
  SELECT tenant FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE;

-- Policy Global de Tenant
CREATE POLICY "Isolamento por Tenant"
ON public.viaturas
USING (tenant = get_my_tenant());
```

---

## 7. Audit Logs

### 7.1 Trigger de Auditoria
- Todas as tabelas críticas têm trigger `audit_trigger_function`
- Registra automaticamente INSERT, UPDATE, DELETE
- Captura `user_id` de:
  1. `auth.uid()` (usuários Supabase)
  2. `id` da tabela profiles (para Keycloak)
  3. `agente_responsavel_id` dos protocolos

### 7.2 Dados Registrados
- `user_id` e `user_name`
- `action`: INSERT, UPDATE, DELETE
- `table_name`: Nome da tabela
- `old_data` e `new_data`: Dados em JSONB

---

## 8. Storage

### 8.1 Buckets
- `vehicle-photos`: Fotos de veículos (público)
- `fotos-checklist`: Fotos dos checklists (público)

### 8.2 Convenção de Nomes de Arquivos
```
{protocolo_id}/{tipo_foto}_{timestamp}.{extensao}
```

---

## 9. Edge Functions

### 9.1 `keycloak-callback` (Legado/Web)
- Originalmente processava callback do Keycloak
- *No fluxo Mobile atual, essa lógica foi migrada para `Auth.tsx` + `proxy-data` (ou upsert direto se permitido)*

### 9.2 `proxy-data`
- Proxy para operações de dados
- Verifica permissões baseadas em role
- Actions: get_viaturas, get_protocolos, get_dashboard_stats, etc.

---

## 10. Convenções de Código

### 10.1 Componentes
- Usar shadcn/ui como base
- Componentes em `src/components/`
- UI primitivos em `src/components/ui/`
- Componentes de feature em subpastas (ex: `checkin/`, `checkout/`)

### 10.2 Estilização
- **SEMPRE** usar tokens semânticos do Tailwind
- Cores definidas em `index.css` como variáveis CSS HSL
- **NUNCA** usar cores hardcoded nos componentes
- Usar classes como `bg-primary`, `text-muted-foreground`, etc.

### 10.3 Tipagem
- Types do Supabase em `src/integrations/supabase/types.ts`
- **NÃO** editar manualmente - gerado automaticamente
- Enums disponíveis em `Constants.public.Enums`

### 10.4 Hooks
- Hooks customizados em `src/hooks/`
- `useProxyData`: Hook para comunicação com edge function proxy

---

## 11. Variáveis de Ambiente e Secrets

### 11.1 Secrets Configurados no Supabase
- `KEYCLOAK_BASE_URL`: URL base do Keycloak
- `KEYCLOAK_REALM`: Realm do Keycloak
- `KEYCLOAK_CLIENT_ID`: Client ID
- `KEYCLOAK_CLIENT_SECRET`: Client Secret
- `URANUS_API_URL`: URL da API Uranus
- `URANUS_TENANT`: Tenant do Uranus
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

### 11.2 Importante
- **NUNCA** usar variáveis `VITE_*` no código
- Secrets são acessíveis apenas em Edge Functions via `Deno.env.get()`

---

## 12. Segurança

### 12.1 Regras Críticas
- Roles **DEVEM** estar em tabela separada (nunca em profiles/users)
- **NUNCA** verificar admin status via localStorage (pode ser manipulado)
- Sempre validar permissões no servidor (Edge Functions + RLS)
- Dados sensíveis de veículos são visíveis para staff autorizado (decisão de negócio)

### 12.2 Prevenção de Ataques
- RLS em todas as tabelas com dados sensíveis
- Funções `SECURITY DEFINER` para queries privilegiadas
- Validação de tokens em cada request

---

## 13. Fluxo de Dados

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│ Edge Func   │────▶│  Supabase   │
│   (React)   │◀────│ (proxy-data)│◀────│  (Postgres) │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │
       │                   ▼
       │            ┌─────────────┐
       └───────────▶│  Keycloak   │
                    │  (Uranus)   │
                    └─────────────┘
```

---

## 14. Mensagens e Labels

### 14.1 Idioma
- Interface em **Português (Brasil)**
- Mensagens de erro amigáveis
- Labels descritivos

### 14.2 Termos do Domínio
- **Viatura**: Veículo operacional
- **Empenho**: Retirada/uso da viatura
- **Devolução**: Retorno da viatura
- **Checklist**: Verificação de itens
- **Protocolo**: Documento de controle

---

*Documento gerado automaticamente. Última atualização: Janeiro 2026*