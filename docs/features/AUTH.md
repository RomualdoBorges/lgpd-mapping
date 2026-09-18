# Feature — Autenticação

> **Feature:** Authentication  
> **Status:** Draft  
> **Módulo:** Access & Organization  
> **Documentos relacionados:** `00-PROJECT.md`, `01-ARCHITECTURE.md`, `04-AUTHORIZATION.md`, `07-API.md`, `09-SECURITY.md`, `12-OPEN-QUESTIONS.md`


## Modelo de Identity/Tenant aprovado — 2026-09-18

As decisões DEC-034 a DEC-043 aprovam o seguinte modelo conceitual (detalhes físicos ainda dependem das questões de banco):

```text
User → ExternalIdentities / Sessions
User 1:N Memberships N:1 Organization
Organization 1:N BusinessUnits
Membership 1:N RoleAssignments N:1 Role → Permissions
RoleAssignment → Scope ORGANIZATION ou BUSINESS_UNIT → áreas autorizadas
```

Cada Membership liga exatamente um User a uma Organization, sem duplicar o vínculo. Cada Business Unit pertence exatamente a uma Organization. RoleAssignments pertencem ao contexto do Membership; suas áreas devem pertencer à mesma Organization. Login não concede vínculo nem papel automaticamente.

Autorização no backend: identidade autenticada + Membership ativo no tenant solicitado + permission + scope + restrições do caso de uso. Não calcular o produto de todos os roles por todas as áreas. OWN, PLATFORM, ADMIN e PLATFORM_ADMIN não são aprovados por estas decisões.

| Papel | Leitura de Activities na primeira entrega | Leitura de ROPA na primeira entrega |
|---|---|---|
| COLLABORATOR | Business Units explicitamente autorizadas | Sem permissão inicial |
| MANAGER | Business Units explicitamente autorizadas | Mesmas Business Units |
| DPO | Organization do Membership | Organization do Membership |

A matriz trata apenas leitura. Escrita, Submit, aprovação, Gate e publicação continuam dependendo das questões respectivas. Dashboard, Systems e Suppliers permanecem fora da primeira entrega, sem exclusão implícita da V1.

OIDC com provedor gerenciado, fornecedor pendente (Auth0 somente candidato), User interno independente e sem união automática de identidades por e-mail. SSO corporativo será parte da V1 após a primeira entrega. Sessão server-side com cookie opaco; frontend não administra tokens. A sessão identifica User; cada request solicita Organization explicitamente e o backend valida autorização atual. Campos do body não transferem recursos entre tenants. Política detalhada de sessão continua em SECQ-004.

Seções de proposta legadas deste documento devem ser interpretadas sob estas decisões: não constituem aprovação de permissões de escrita, scopes adicionais, fornecedor, topologia do banco, RLS ou herança hierárquica. Questões decididas continuam referenciadas para rastreabilidade; pendências parciais estão identificadas no registro central.

---


---

## 1. Objetivo

Esta feature é responsável por identificar o usuário que está acessando a plataforma e estabelecer um contexto autenticado confiável para as demais funcionalidades.

A autenticação deve permitir que o backend determine:

```text
quem é o usuário

a quais organizações ele pertence

qual organização está ativa

quais papéis possui

quais áreas pode acessar
```

A autenticação não substitui autorização.

Fluxo conceitual:

```text
Authentication
      ↓
Authenticated User
      ↓
Organization Context
      ↓
Authorization
      ↓
Resource Access
```

---

# 2. Escopo

Esta feature contempla conceitualmente:

```text
login

logout

identificação do usuário

sessão

contexto autenticado

organização ativa

carregamento de permissões

recuperação do usuário atual
```

Dependendo da solução escolhida, também poderá contemplar:

```text
SSO

OIDC

MFA

convites

seleção de organização
```

Esses pontos possuem decisões abertas.

---

# 3. Fora do escopo

Autenticação não deve decidir diretamente:

```text
se usuário pode editar atividade

se usuário pode acessar ROPA

se usuário pode aprovar atividade

se usuário pode consultar auditoria
```

Essas decisões pertencem à autorização.

---

# 4. Princípio

Nenhuma informação de identidade fornecida diretamente pelo frontend deve ser considerada confiável sem validação.

Exemplo proibido:

```json
{
  "userId": "123",
  "role": "DPO",
  "organizationId": "456"
}
```

O cliente não pode escolher arbitrariamente sua identidade ou privilégios.

---

# 5. Usuário

Entidade relacionada:

```text
User
```

Campos conceituais:

```text
id

name

email

status

createdAt

updatedAt
```

Detalhes definitivos dependem do mecanismo de autenticação.

---

# 6. Identidade externa

Caso seja utilizado:

```text
OIDC
SSO
Identity Provider
```

o usuário poderá possuir identificador externo.

Exemplo:

```text
externalIdentityId
```

ou estrutura equivalente.

Não definir nome físico do campo antes da escolha do provedor.

---

# 7. Membership

A relação entre:

```text
User
```

e:

```text
Organization
```

deve ser representada explicitamente.

Modelo conceitual:

```text
User
  ↓
OrganizationMembership
  ↓
Organization
```

No banco atual, essa responsabilidade pode ser representada por:

```text
organization_users
```

---

# 8. Papel

Membership pode possuir:

```text
role
```

ou:

```text
roles
```

dependendo da decisão:

```text
AUTHQ-007
```

Papéis atualmente considerados:

```text
COLLABORATOR

MANAGER

DPO
```

Também existe proposta:

```text
ADMIN
```

---

# 9. Business Units

O usuário pode possuir escopo relacionado a:

```text
BusinessUnit
```

Exemplo:

```text
User
├── RH
└── Financeiro
```

A possibilidade de múltiplas áreas depende de:

```text
AUTHQ-008
```

---

# 10. Authenticated Context

Após autenticação, o backend deve conseguir construir contexto equivalente a:

```ts
type AuthenticatedContext = {
  userId: string;
  organizationId: string;
  roles: string[];
  businessUnitIds: string[];
};
```

Essa estrutura é conceitual.

Pode evoluir conforme decisões de autenticação e autorização.

---

# 11. Organization Context

Toda request relacionada a recursos tenant-bound precisa possuir uma organização ativa validada.

Exemplo:

```text
User
↓
Organization A
↓
Request
↓
Activity A
```

---

# 12. Multi-organização

Existe questão aberta:

```text
AUTHQ-006
```

sobre permitir:

```text
User
├── Organization A
├── Organization B
└── Organization C
```

Isso é especialmente relevante para:

```text
DPO as a Service
```

---

# 13. Organização única

Se cada usuário pertencer somente a uma organização:

```text
login
↓
organization determinada
↓
aplicação
```

não será necessário seletor de organização.

---

# 14. Múltiplas organizações

Se o usuário puder pertencer a várias:

```text
login
↓
memberships
↓
selecionar organização
↓
organization context
↓
aplicação
```

DEC-043 define sessão de identidade e Organization explícita por request, validada pelo backend. Apenas a representação HTTP concreta permanece para o slice.

---

# 15. Troca de organização

Multi-organização está aprovada por DEC-035:

```text
Organization A
↓
switch
↓
Organization B
```

deve reconstruir contexto de:

```text
roles

permissions

businessUnits

queries

cache
```

---

# 16. Cache no frontend

Ao trocar organização, dados da organização anterior não devem aparecer como se pertencessem à nova organização.

TanStack Query deve considerar tenant context nas query keys quando aplicável.

Exemplo conceitual:

```ts
[
  'processing-activities',
  organizationId,
  filters
]
```

---

# 17. Login

DEC-040 aprova autenticação delegada por OIDC usando provedor gerenciado. SECQ-001 permanece IN_ANALYSIS somente quanto ao fornecedor; Auth0 é candidato, não escolha. Login não concede vínculo ou papel automaticamente.

---

# 18. Login local

Alternativa histórica não selecionada para a primeira entrega (DEC-040):

```text
email
+
password
```

serão utilizados.

Isso exigirá regras adicionais para:

```text
password hashing

password reset

verification

brute force protection

MFA
```

---

# 19. SSO/OIDC

Caso aprovado:

```text
Browser
↓
Identity Provider
↓
Authentication
↓
Callback
↓
Application Session
```

A aplicação não deve armazenar password corporativo nesse cenário.

---

# 20. SSO corporativo

O documento funcional prevê possibilidade de:

```text
e-mail corporativo
```

e:

```text
SSO quando disponível
```

A implementação definitiva depende da infraestrutura dos clientes.

---

# 21. Microsoft Entra ID

É um candidato possível para ambientes corporativos Microsoft.

Não assumir:

```text
Microsoft Entra ID
```

como provedor definitivo antes da decisão:

```text
SECQ-001
```

---

# 22. Keycloak

Também pode ser utilizado como Identity Provider próprio.

É alternativa arquitetural, não decisão atual.

---

# 23. Auth0

Também é alternativa possível.

Não adicionar SDK antes da decisão.

---

# 24. Sessão

SECQ-002 foi decidida por DEC-042: sessão server-side com cookie opaco. Frontend não administra tokens; backend consulta autorização atual. Expiração, renovação e revogação detalhadas permanecem em SECQ-004. APIQ-002 está integralmente coberta pelo transporte escolhido.

---

# 25. Tokens

Se JWT for utilizado, tokens não devem conter informação excessiva.

Claims podem incluir identificadores necessários.

Não armazenar informações sensíveis desnecessárias dentro do token.

---

# 26. Roles no token

Se roles forem colocados no token, considerar problema de:

```text
stale permissions
```

Exemplo:

```text
User = MANAGER
↓
token emitido
↓
Admin remove MANAGER
↓
token antigo continua dizendo MANAGER
```

A estratégia deve considerar revogação/expiração/refresh.

---

# 27. Cookies

Se autenticação utilizar cookies:

```text
HttpOnly
Secure
SameSite
```

devem ser configurados adequadamente ao ambiente.

---

# 28. LocalStorage

Não escolher automaticamente:

```text
localStorage
```

para tokens.

A estratégia deve ser definida em conjunto com o mecanismo de autenticação.

---

# 29. Logout

A aplicação deve possuir operação de logout.

Conceitualmente:

```text
User
↓
Logout
↓
Session invalidated
↓
Frontend authenticated state cleared
```

---

# 30. Logout e frontend

Após logout:

```text
server state

user context

organization context

local sensitive state
```

devem ser limpos.

---

# 31. Endpoint `/me`

A API deve fornecer endpoint equivalente a:

```http
GET /api/v1/me
```

Objetivo:

```text
obter identidade atual

organization context

roles

permissions

businessUnits
```

---

# 32. Exemplo conceitual

```json
{
  "data": {
    "id": "uuid",
    "name": "João Silva",
    "email": "joao@empresa.com",
    "organization": {
      "id": "uuid",
      "name": "Empresa Alpha"
    },
    "roles": [
      "MANAGER"
    ],
    "permissions": [
      "processing_activity:read",
      "processing_activity:create",
      "processing_activity:update"
    ],
    "businessUnits": [
      {
        "id": "uuid",
        "name": "Recursos Humanos"
      }
    ]
  }
}
```

O contrato definitivo depende das decisões de autorização.

---

# 33. `/me` não recebe userId

Errado:

```http
GET /api/v1/me?userId=123
```

O usuário deve ser identificado pela sessão/token validado.

---

# 34. Bootstrap

Fluxo inicial do frontend:

```text
Application Start
↓
Authentication Check
↓
GET /me
↓
Authenticated Context
↓
Application
```

---

# 35. Estado de autenticação

Frontend deve conseguir representar:

```text
loading

authenticated

unauthenticated

error
```

---

# 36. Protected Routes

Rotas autenticadas devem exigir sessão válida.

Exemplo:

```text
/dashboard

/activities

/ropa

/systems

/suppliers
```

---

# 37. Route Guard

Frontend pode utilizar guard para UX.

Exemplo:

```tsx
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>
```

Mas o backend continua responsável por segurança real.

---

# 38. Permission Guard

Frontend também pode esconder recursos.

Exemplo:

```tsx
<Can permission="processing_activity:create">
  <NewActivityButton />
</Can>
```

Isso é conveniência visual.

Não é controle de segurança suficiente.

---

# 39. Backend authorization

Mesmo que botão esteja oculto:

```text
POST /processing-activities
```

deve verificar permission novamente.

---

# 40. 401

Quando não houver autenticação válida:

```text
401 Unauthorized
```

Frontend deve tratar adequadamente.

---

# 41. Sessão expirada

Fluxo:

```text
API
↓
401
↓
auth state invalidated
↓
login
```

Comportamento de refresh depende da solução escolhida.

---

# 42. 403

Quando usuário está autenticado, mas não possui permissão:

```text
403 Forbidden
```

quando a política permitir revelar existência do recurso.

---

# 43. Cross-tenant

Para tentativa de recurso de outro tenant, preferir comportamento que não revele existência.

Conforme regras gerais:

```text
404 NOT_FOUND
```

quando apropriado.

---

# 44. Usuário inativo

Usuário:

```text
DISABLED
```

não deve conseguir iniciar novas sessões.

Sessões existentes precisam seguir política de revogação definida pela solução de autenticação.

---

# 45. Membership inativa

Mesmo que usuário continue válido globalmente:

```text
Membership Organization A = disabled
```

deve impedir acesso à Organization A.

---

# 46. Organization inativa

Comportamento ainda precisa ser definido.

Possibilidades:

```text
bloquear login/contexto

somente leitura

acesso administrativo
```

Não assumir regra definitiva.

---

# 47. Convite

Fluxo proposto:

```text
Admin
↓
Invite User
↓
email
↓
User accepts
↓
membership created/activated
```

Detalhes dependem da autenticação escolhida.

---

# 48. Convite existente

Se usuário já existir em outra organização e multi-organização for permitido:

```text
não duplicar User
```

Criar nova:

```text
OrganizationMembership
```

quando apropriado.

---

# 49. E-mail

E-mail pode funcionar como identificador visual/login.

Não assumir que será chave primária.

Utilizar:

```text
UUID
```

para identificação interna.

---

# 50. Normalização de e-mail

Se e-mail for utilizado como identificador:

```text
trim
normalização adequada
unicidade conforme modelo
```

devem ser tratados.

A regra de unicidade depende do modelo de identidade.

---

# 51. MFA

MFA depende de:

```text
SECQ-003
```

Se autenticação for delegada a IdP, preferir que MFA seja gerenciado pelo provedor quando apropriado.

---

# 52. Password

Se login local não for adotado, não criar:

```text
password_hash
```

sem necessidade.

---

# 53. Password Reset

Só implementar se autenticação local for escolhida.

Caso SSO:

```text
password reset
```

pertence ao Identity Provider.

---

# 54. Account Lockout

Também depende do mecanismo de autenticação.

Não duplicar controles já fornecidos pelo IdP sem necessidade.

---

# 55. Audit

Eventos de autenticação podem incluir:

```text
LOGIN_SUCCEEDED

LOGIN_FAILED

LOGOUT
```

Mas sua persistência definitiva depende da separação entre:

```text
Security Logs
```

e:

```text
Business Audit Logs
```

---

# 56. Alteração de role

Deve gerar evento de auditoria.

Exemplo:

```text
USER_ROLE_CHANGED
```

---

# 57. Alteração de Business Unit

Evento:

```text
USER_BUSINESS_UNIT_CHANGED
```

---

# 58. Desativação

Evento:

```text
USER_DISABLED
```

---

# 59. Security Logs

Tentativas como:

```text
login inválido repetido

token inválido

cross-tenant probing

authorization abuse
```

podem ser registradas em Security Logs.

Estratégia definitiva permanece aberta.

---

# 60. Rate Limiting

Endpoints de autenticação expostos diretamente pela aplicação devem considerar rate limiting.

Especialmente:

```text
login

password reset

invite acceptance
```

Se autenticação for delegada, parte dessa proteção pode pertencer ao IdP.

---

# 61. CSRF

Se autenticação utilizar cookies, avaliar proteção contra:

```text
CSRF
```

de acordo com arquitetura final.

---

# 62. CORS

Configuração deve ser explícita.

Não utilizar:

```text
Access-Control-Allow-Origin: *
```

com credenciais em produção.

---

# 63. Redirects

Callbacks de autenticação não devem aceitar redirects arbitrários sem validação.

Evitar:

```text
open redirect
```

---

# 64. Frontend structure

Estrutura sugerida:

```text
src/features/auth/
├── api/
├── components/
├── hooks/
├── routes/
├── schemas/
├── types/
└── utils/
```

---

# 65. Componentes possíveis

```text
LoginPage

ProtectedRoute

OrganizationSelector

UserMenu

AccessDeniedPage
```

Alguns dependem das decisões de produto.

---

# 66. Hook

Pode existir:

```ts
useAuth()
```

expondo conceitualmente:

```ts
{
  user,
  organization,
  permissions,
  businessUnits,
  isAuthenticated,
  isLoading
}
```

---

# 67. Permission Hook

Pode existir:

```ts
usePermission(
  'processing_activity:create'
)
```

para UX.

Não substituir backend authorization.

---

# 68. Organization Switcher

Só implementar se:

```text
AUTHQ-006 = múltiplas organizações
```

---

# 69. Query invalidation

Após troca de organização:

```text
queries tenant-bound
```

devem ser invalidadas/removidas de forma segura.

---

# 70. Zustand

Se necessário, Zustand pode manter estado estritamente de cliente como:

```text
organization selecionada
```

dependendo da estratégia final.

Não armazenar duplicação completa do `/me` se TanStack Query já for responsável por esse server state.

---

# 71. Backend structure

Estrutura conceitual:

```text
modules/auth/
├── domain/
├── application/
├── infrastructure/
└── presentation/
```

Dependendo da implementação real, identidade e usuários podem pertencer a módulos separados:

```text
auth

users

organizations
```

---

# 72. Auth module

Responsabilidades:

```text
validar autenticação

resolver identidade

construir authenticated context

login/logout quando aplicável
```

---

# 73. Users module

Responsabilidades:

```text
perfil do usuário

status

membership

roles

business units
```

---

# 74. Organizations module

Responsabilidades:

```text
organization

membership context

organization selection
```

---

# 75. Guards

Backend pode utilizar guards/middleware para autenticação.

Exemplo conceitual:

```text
AuthenticationGuard
```

Depois:

```text
AuthorizationGuard
```

ou mecanismo equivalente.

---

# 76. Ordem

Fluxo recomendado:

```text
Request
↓
Authentication
↓
Organization Context
↓
Authorization
↓
Use Case
```

---

# 77. Não colocar regra de negócio no Auth Guard

Guard não deve decidir:

```text
atividade pode ser ativada?
```

Essa regra pertence ao domínio/workflow.

---

# 78. Tests

Autenticação deve possuir testes para:

```text
request autenticada

request não autenticada

sessão inválida

usuário inativo

membership inválida

organization context

permissions carregadas
```

---

# 79. Multi-tenant test

Caso multi-organização seja adotado:

```text
User
├── Organization A
└── Organization B
```

trocar para B deve produzir contexto somente de B.

---

# 80. Membership test

```text
Given:
User pertence apenas à Organization A

When:
tenta selecionar Organization B

Then:
acesso é rejeitado
```

---

# 81. Disabled user test

```text
Given:
User.status = DISABLED

When:
tenta autenticar/acessar sessão

Then:
acesso é negado
```

---

# 82. Disabled membership test

```text
Given:
User ativo

And:
membership Organization A desativada

When:
tenta acessar Organization A

Then:
acesso é negado
```

---

# 83. `/me` test

```text
Given:
usuário autenticado

When:
GET /api/v1/me

Then:
retorna contexto do usuário atual
```

---

# 84. `/me` tenant test

Garantir que `/me` não exponha memberships ou dados não permitidos conforme política final.

---

# 85. Logout test

```text
Given:
sessão válida

When:
logout

Then:
sessão não pode continuar sendo utilizada
```

quando a estratégia de sessão permitir revogação imediata.

---

# 86. Role change test

```text
Given:
User possui COLLABORATOR

When:
Admin autorizado altera para MANAGER

Then:
mudança é persistida

And:
USER_ROLE_CHANGED é auditado
```

Detalhes dependem da aprovação do papel ADMIN.

---

# 87. Security test

Tentar enviar:

```json
{
  "roles": ["ADMIN"]
}
```

em endpoint de perfil comum não deve elevar privilégios.

---

# 88. Mass assignment

Usuário não deve conseguir modificar:

```text
roles

permissions

organization

businessUnits
```

por endpoint não autorizado.

---

# 89. Open Questions

Questões principais relacionadas:

```text
AUTHQ-003 — ADMIN existe?

AUTHQ-006 — usuário multi-organização?

AUTHQ-007 — múltiplos roles?

AUTHQ-008 — múltiplas áreas?

AUTHQ-010 — SSO na V1?

SECQ-001 — mecanismo de autenticação?

SECQ-001 — Identity Provider?

SECQ-003 — MFA?

SECQ-002 — estratégia de sessão?

APIQ-020 — organização ativa?

TESTQ-008 — autenticação E2E?
```

---

# 90. Questões bloqueadoras

Antes de implementar autenticação definitiva, resolver pelo menos:

```text
[x] SECQ-001 — mecanismo OIDC gerenciado (DEC-040); fornecedor ainda pendente.

[x] SECQ-002 — sessão server-side com cookie opaco (DEC-042).

[ ] AUTHQ-006 — multi-organização?

[ ] AUTHQ-007 — múltiplos roles?

[ ] AUTHQ-008 — múltiplas Business Units?
```

Se SSO/OIDC:

```text
[ ] SECQ-001 — qual Identity Provider?
```

---

# 91. Critérios de aceite mínimos

```text
AC-AUTH-001

Given:
request sem autenticação

When:
acessa endpoint protegido

Then:
recebe 401
```

```text
AC-AUTH-002

Given:
usuário autenticado

When:
GET /api/v1/me

Then:
recebe seu contexto autenticado
```

```text
AC-AUTH-003

Given:
usuário da Organization A

When:
tenta utilizar contexto da Organization B sem membership

Then:
acesso é negado
```

```text
AC-AUTH-004

Given:
usuário desativado

When:
tenta utilizar a plataforma

Then:
acesso é negado conforme estratégia de sessão
```

```text
AC-AUTH-005

Given:
usuário autenticado sem determinada permission

When:
chama endpoint protegido por essa permission

Then:
backend rejeita a operação
```

---

# 92. Definition of Done

A feature de autenticação somente estará concluída quando:

```text
[ ] mecanismo de autenticação definido

[ ] authenticated context implementado

[ ] organization context implementado

[ ] `/me` implementado

[ ] logout implementado quando aplicável

[ ] usuário inativo tratado

[ ] membership validada

[ ] tenant isolation garantido

[ ] integração com authorization

[ ] secrets protegidos

[ ] logs seguros

[ ] auditoria definida

[ ] testes unitários necessários

[ ] testes de integração

[ ] testes E2E críticos

[ ] documentação atualizada
```

---

# 93. Regra final

Authentication responde:

```text
Quem é você?
```

Organization Context responde:

```text
Em qual organização você está atuando?
```

Authorization responde:

```text
O que você pode fazer?
```

Business Rules respondem:

```text
Essa operação é válida neste momento?
```

Essas responsabilidades não devem ser misturadas.

---

# 94. Próxima feature

O próximo documento recomendado é:

`docs/features/ORGANIZATIONS.md`

Ele deve especificar:

```text
organizações

multi-tenancy

membership

Business Units

configurações organizacionais

isolamento entre clientes
```