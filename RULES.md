# ARTEMIS - Regras e Convenções da Aplicação

## Visão Geral

Sistema de gestão de viaturas operacionais para órgãos governamentais, especificamente para agentes de trânsito. O sistema controla check-in/check-out de veículos, protocolos de empenho/devolução e gestão de itens de viatura.

---

## 1. Autenticação

### 1.1 Método de Login
- **Único método aceito**: Login via Keycloak/Uranus (SSO)
- Login por email/senha está **desabilitado**
- O botão "Entrar com conta Uranus" redireciona para o Keycloak

### 1.2 Fluxo de Autenticação
1. Usuário clica em "Entrar com conta Uranus"
2. Redirecionado para Keycloak (`account.des.aureaphigital.com:8443`)
3. Após autenticação, callback em `/auth/callback`
4. Edge function `keycloak-callback` processa o token e cria/atualiza perfil
5. Tokens armazenados em `localStorage`:
   - `keycloak_user`: Dados do usuário
   - `keycloak_tokens`: Tokens de acesso

### 1.3 Logout
- Remove dados do `localStorage`
- Redireciona para logout do Keycloak com `id_token_hint`
- Retorna para `/auth` após logout

### 1.4 Mapeamento de Grupos Uranus → Roles
```typescript
// Grupos do Uranus são mapeados para roles da aplicação:
// - Grupos com "admin" → 'admin'
// - Grupos com "gestor" → 'gestor'
// - Demais usuários → 'agente'
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
- `status_operacional`: disponivel, em_uso, manutencao, inativa
- `situacao_licenciamento`: regular, irregular, vencida

#### `protocolos_empenho`
- Registro de retirada de viatura
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

## 6. Row Level Security (RLS)

### 6.1 Padrão de Políticas
- Usar função `is_admin_or_gestor()` para verificar permissões elevadas
- Usar `auth.uid()` para verificar propriedade do registro
- **NUNCA** referenciar a própria tabela dentro da policy (evita recursão infinita)

### 6.2 Exemplos de Políticas

```sql
-- Agentes só veem próprios protocolos
CREATE POLICY "Usuários podem ver próprios protocolos"
ON public.protocolos_empenho FOR SELECT
USING (
  auth.uid() = agente_responsavel_id 
  OR is_admin_or_gestor(auth.uid())
);

-- Apenas admin/gestor podem gerenciar viaturas
CREATE POLICY "Admin/Gestor pode inserir viaturas"
ON public.viaturas FOR INSERT
WITH CHECK (is_admin_or_gestor(auth.uid()));
```

---

## 7. Auditoria

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

### 9.1 `keycloak-callback`
- Processa callback do Keycloak
- Troca code por tokens
- Busca grupos do Uranus
- Mapeia grupos para roles
- Cria/atualiza perfil no Supabase

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
