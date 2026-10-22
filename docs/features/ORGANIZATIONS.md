# Feature — Organizações e Estrutura Organizacional

> **Feature:** Organizations & Business Units  
> **Status:** Draft  
> **Módulo:** Access & Organization  
> **Documentos relacionados:** `00-PROJECT.md`, `01-ARCHITECTURE.md`, `02-DOMAIN.md`, `03-DATABASE.md`, `04-AUTHORIZATION.md`, `05-BUSINESS-RULES.md`, `07-API.md`, `09-SECURITY.md`, `12-OPEN-QUESTIONS.md`, `features/AUTH.md`


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

Seções de proposta legadas deste documento devem ser interpretadas sob estas decisões: não constituem aprovação de permissões de escrita, scopes adicionais, fornecedor, topologia do banco ou herança hierárquica. RLS foi aprovado posteriormente em DEC-046. Questões decididas continuam referenciadas para rastreabilidade; pendências parciais estão identificadas no registro central.


## Persistência e defesa tenant-aware aprovadas — 2026-09-18

DEC-044 (DBQ-001): Drizzle é o ORM/query builder aprovado. Queries ficam em repository/persistence; SQL específico é parametrizado, localizado e versionado. Migrations são revisáveis e reproduzíveis desde banco vazio. Não reduzir garantias PostgreSQL para acomodar o ORM.

DEC-045 (DBQ-008): validar relações/autorização na aplicação e garantir coerência tenant-bound por constraints PostgreSQL. Quando necessário, filhos e associações carregam organization_id NOT NULL, unicidades/FKs compostas e índices adequados; usar checks declarativos quando aplicáveis. FK somente por UUID não prova mesmo tenant. organization_id vem do contexto autorizado e não é campo livre para transferência. Preferir constraint declarativa simples a trigger equivalente.

DEC-046 (DBQ-009): RLS adicional nas tabelas tenant-bound, com contexto local à transação, todas as queries da operação no mesmo contexto, ausência de contexto negando acesso e nenhum tenant persistente na conexão. Considerar pooling. Runtime sem superuser/BYPASSRLS/propriedade das tabelas protegidas/alteração de policies; FORCE ROW LEVEL SECURITY quando adequado. Credencial de migration separada do runtime.

Defesa aprovada: Authentication → Membership → Permission → Scope → Repository tenant-aware → PostgreSQL constraints → PostgreSQL RLS. Nenhuma camada substitui outra. Scope de Business Unit continua na autorização da aplicação.

User, ExternalIdentity e Session são globais, sem organization_id artificial nem acesso runtime irrestrito. DEC-052 aprovou o bootstrap restrito: authenticatedUserId + requestedOrganizationId consulta somente a Membership própria ativa ou ausência; apenas então authorizedOrganizationId pode chegar a withTenant(), onde concessões/scopes são carregados sob RLS. DEC-054 transporta requestedOrganizationId pelo header `X-Organization-Id` em requests tenant-bound; cada request valida novamente o vínculo, sem Organization atual autoritativa na Session. DEC-062 separa `AuthenticatedIdentity` de `AuthorizedTenantContext`, que contém somente membershipId + authorizedOrganizationId. Pela DEC-065, header ausente ou estruturalmente inválido retorna 400 com código específico, enquanto Membership inexistente, inativa, pertencente a outro User ou Organization inexistente retorna uniformemente 403/`ORGANIZATION_ACCESS_DENIED`, sem revelar a causa. Na S3.2, a fundação PostgreSQL da DEC-056 foi implementada por `auth_private.resolve_membership`, com owner NOLOGIN dedicado, policy bootstrap separada sob FORCE RLS, retorno somente membershipId + organizationId e repository sem leitura direta de `memberships`. A S3.4 implementou o pipeline HTTP até `AuthorizedTenantContext` e abre `withTenant()` somente após resultado positivo; autorização por RoleAssignment/BusinessUnit ainda não foi implementada.

Referências legadas a Prisma/Drizzle ou a RLS como alternativas pendentes são históricas: estas três questões estão decididas em DEC-044 a DEC-046. Políticas funcionais, autenticação e features posteriores continuam sujeitas às questões específicas. A topologia física de produção não é escolhida por este registro.

---

---


---

## 1. Objetivo

Esta feature representa as empresas clientes da plataforma e suas estruturas organizacionais.

A entidade:

```text
Organization
```

é a principal fronteira de isolamento de dados da aplicação.

Estrutura conceitual:

```text
Platform
├── Organization A
│   ├── Users
│   ├── Business Units
│   ├── Processing Activities
│   ├── Systems
│   ├── Suppliers
│   └── ROPA
│
└── Organization B
    ├── Users
    ├── Business Units
    ├── Processing Activities
    ├── Systems
    ├── Suppliers
    └── ROPA
```

Dados da Organization A nunca devem ser acessíveis pela Organization B sem uma funcionalidade explicitamente autorizada para isso.

---

# 2. Conceitos principais

Esta feature possui três conceitos centrais:

```text
Organization

Organization Membership

Business Unit
```

---

# 3. Organization

`Organization` representa uma empresa cliente da plataforma.

Exemplos:

```text
Empresa Alpha

Empresa Beta

Empresa Gamma
```

Uma organização constitui um:

```text
tenant
```

da aplicação.

---

# 4. Tenant

Tenant representa uma fronteira lógica de isolamento.

Na arquitetura atual:

```text
1 Organization
=
1 Tenant
```

Essa premissa deve ser confirmada em:

```text
PRODQ-001
```

---

# 5. Multi-tenancy

A arquitetura foi preparada para:

```text
Organization A
Organization B
Organization C
```

utilizando a mesma aplicação.

Isso não significa compartilhar dados entre elas.

Significa compartilhar infraestrutura mantendo isolamento lógico.

---

# 6. Regra crítica

Recursos tenant-bound devem pertencer a uma organização.

Exemplos:

```text
ProcessingActivity

BusinessUnit

System

Supplier

OrganizationMembership

AuditLog

ActivityVersion
```

direta ou indiretamente.

---

# 7. Organization ID

Entidades tenant-bound normalmente devem possuir:

```text
organization_id
```

ou relação equivalente capaz de determinar inequivocamente o tenant.

---

# 8. Organization ID não vem do usuário

Nunca confiar em:

```json
{
  "organizationId": "uuid"
}
```

enviado pelo frontend para determinar autorização.

A organização ativa deve vir de contexto autenticado e validado.

---

# 9. Exemplo incorreto

```ts
async createActivity(dto) {
  return repository.create({
    ...dto,
    organizationId: dto.organizationId,
  });
}
```

Isso permite que o cliente tente selecionar outro tenant.

---

# 10. Exemplo conceitual correto

```ts
async createActivity(
  context: AuthenticatedContext,
  dto: CreateActivityDto,
) {
  return repository.create({
    ...dto,
    organizationId: context.organizationId,
  });
}
```

A implementação final depende da arquitetura escolhida.

---

# 11. Organization entity

Campos conceituais:

```text
id

name

status

createdAt

updatedAt
```

Campos adicionais podem existir futuramente.

---

# 12. Status

Status sugeridos:

```text
ACTIVE

INACTIVE
```

O comportamento de organização inativa ainda precisa ser definido.

---

# 13. Campos comerciais

Não adicionar automaticamente:

```text
plan

billingStatus

subscriptionId

trialEndsAt
```

O modelo comercial ainda não faz parte do escopo funcional atual.

---

# 14. Branding e domínio próprio

Conforme DEC-032, são decisões distintas:

- PRODQ-003: branding por organização (logo e cores).
- PRODQ-004: domínio próprio por organização (customDomain).

Ambas permanecem OPEN. A separação não inclui nenhuma capacidade na V1; não adicionar esses campos automaticamente.

---

# 15. Organization Membership

Membership representa a relação:

```text
User
        ↕
Organization
```

Exemplo:

```text
João
↓
Empresa Alpha
↓
MANAGER
```

---

# 16. Por que Membership?

Não modelar simplesmente:

```text
users.organization_id
```

se o produto precisar permitir:

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

# 17. Modelo conceitual

```text
User
  │
  ├──── OrganizationMembership ──── Organization A
  │
  └──── OrganizationMembership ──── Organization B
```

---

# 18. Banco

Tabela conceitual já prevista:

```text
organization_users
```

Ela representa membership.

Campos possíveis:

```text
id

organization_id

user_id

status

created_at

updated_at
```

Papéis podem estar nesta tabela ou em estrutura relacionada conforme decisão de autorização.

---

# 19. Membership Status

Valores sugeridos:

```text
ACTIVE

INACTIVE
```

Possivelmente:

```text
INVITED
```

dependendo do fluxo de convite.

Não consolidar antes da definição do fluxo de autenticação.

---

# 20. Unicidade

Uma combinação:

```text
organization_id
+
user_id
```

normalmente não deve possuir memberships duplicadas ativas.

A constraint definitiva depende do modelo final.

---

# 21. Usuário multi-organização

AUTHQ-006 foi decidida por DEC-035: User pode possuir Memberships simultâneos e independentes em múltiplas Organizations.

---

# 22. DPO as a Service

Cenário permitido por DEC-035:

```text
DPO User
├── Cliente A
├── Cliente B
└── Cliente C
```

Cada membership pode possuir permissões diferentes.

Exemplo:

```text
Cliente A → DPO

Cliente B → DPO

Cliente C → MANAGER
```

Os papéis e scopes são específicos de cada vínculo.

---

# 23. Roles por Organization

Role é concedido pelo Membership (DEC-036), não como propriedade global do User.

Exemplo incorreto para multi-organização:

```text
User.role = DPO
```

se o mesmo usuário puder possuir outro papel em outro tenant.

Preferir conceitualmente:

```text
User
↓
OrganizationMembership
↓
Role
```

---

# 24. Múltiplos roles

AUTHQ-007 foi decidida por DEC-037: Membership possui múltiplos RoleAssignments, cada um com seu scope preservado. As áreas explicitamente autorizadas pertencem à concessão; não combinar roles e áreas indiscriminadamente.

---

# 25. Organization Context

Após autenticação deve existir uma organização ativa.

Exemplo:

```text
Authenticated User

Organization A ← active

Organization B
```

Todas as operações tenant-bound passam a utilizar:

```text
Organization A
```

---

# 26. Troca de organização

Caso multi-organização seja permitida:

```text
Organization A
↓
Switch Organization
↓
Organization B
```

deve validar:

```text
User possui membership ACTIVE em B?
```

Se não:

```text
access denied
```

---

# 27. Segurança na troca

Nunca permitir:

```http
POST /switch-organization
```

com um UUID arbitrário sem validar membership.

---

# 28. Troca e permissions

Ao trocar organização:

```text
roles

permissions

businessUnits
```

devem ser recalculados.

---

# 29. Troca e frontend

Frontend deve atualizar:

```text
organization context

permissions

business units

server state
```

---

# 30. Cache

Cache tenant-bound deve considerar organização.

Exemplo:

```ts
[
  'activities',
  organizationId,
  filters
]
```

---

# 31. Business Unit

`BusinessUnit` representa área/departamento da organização.

Exemplos:

```text
Recursos Humanos

Financeiro

Marketing

Jurídico

Tecnologia

Comercial
```

---

# 32. Relação

```text
Organization
└── Business Units
```

Cada Business Unit pertence a exatamente uma organização.

---

# 33. Campos

Estrutura conceitual:

```text
id

organizationId

name

status

createdAt

updatedAt
```

---

# 34. Business Unit Status

Sugestão:

```text
ACTIVE

INACTIVE
```

Não apagar fisicamente áreas utilizadas historicamente.

---

# 35. Hierarquia

Questão:

```text
DQ-008
```

define se Business Units serão hierárquicas.

Opção simples:

```text
Organization
├── RH
├── Financeiro
└── Tecnologia
```

Opção hierárquica:

```text
Organization
└── Diretoria Administrativa
    ├── RH
    └── Financeiro
```

---

# 36. V1

Enquanto `DQ-008` estiver aberta, evitar implementar lógica complexa de árvore.

Uma estrutura plana é suficiente somente se aprovada como comportamento da V1.

Não introduzir:

```text
nested sets

closure tables

materialized paths
```

sem necessidade.

---

# 37. Nome da área

Nome deve ser obrigatório.

Exemplo:

```text
Recursos Humanos
```

---

# 38. Duplicidade

Deve ser decidido se uma organização pode possuir duas áreas com mesmo nome.

Recomendação inicial:

```text
nome único entre Business Units ativas da mesma organização
```

mas isso precisa ser confirmado caso hierarquia seja adotada.

---

# 39. Business Unit responsável

Toda ProcessingActivity deve possuir área responsável conforme regras atuais.

Exemplo:

```text
ProcessingActivity
↓
BusinessUnit
```

---

# 40. Regra crítica

Business Unit e ProcessingActivity precisam pertencer ao mesmo tenant.

Proibido:

```text
Activity Organization A
↓
BusinessUnit Organization B
```

---

# 41. Validação

Backend deve verificar a relação.

Não confiar apenas no UUID recebido.

---

# 42. Usuários e áreas

Usuários podem possuir acesso relacionado a Business Units.

Estrutura prevista:

```text
user_business_units
```

---

# 43. Relação conceitual

```text
OrganizationMembership
        ↓
BusinessUnit Access
```

ou estrutura equivalente.

---

# 44. Múltiplas áreas

Questão:

```text
AUTHQ-008
```

precisa definir se:

```text
User
↓
1 BusinessUnit
```

ou:

```text
User
↓
N BusinessUnits
```

---

# 45. Scope

Business Unit é importante para autorização.

Exemplo:

```text
MANAGER
+
BUSINESS_UNIT scope
```

pode permitir acesso somente às atividades da própria área.

---

# 46. Scope organizacional

DPO pode eventualmente possuir:

```text
ORGANIZATION
```

scope.

Isso depende da matriz definitiva de autorização.

---

# 47. Área inativa

Se uma área possuir atividades históricas:

```text
BusinessUnit
↓
INACTIVE
```

não deve apagar:

```text
ProcessingActivities

Versions

AuditLogs
```

---

# 48. Nova atividade

Área inativa não deve ser selecionável para novas atividades, salvo regra explícita em contrário.

---

# 49. Atividade existente

Se área for inativada e possuir atividade:

```text
ACTIVE
```

o comportamento precisa ser definido.

Possibilidades:

```text
atividade permanece ativa

atividade gera pendência

atividade precisa ser transferida
```

Não decidir silenciosamente.

---

# 50. Renomear área

Renomear:

```text
RH
```

para:

```text
Recursos Humanos
```

não deve alterar o significado histórico de versões já publicadas.

ActivityVersion deve preservar informação histórica necessária.

---

# 51. Remover área

Preferir:

```text
INACTIVE
```

ou estratégia equivalente.

Evitar delete físico quando houver referências.

---

# 52. Criar Organization

Quem pode criar uma organização depende do modelo comercial.

Possibilidades:

```text
PLATFORM_ADMIN

onboarding automatizado

operação interna
```

Não assumir que ADMIN da empresa pode criar novos tenants.

---

# 53. Organization Admin

Se:

```text
ADMIN
```

for aprovado, ele administra recursos dentro de sua organização.

Isso não significa:

```text
criar outras organizações
```

ou:

```text
acessar outros tenants
```

---

# 54. Platform Admin

`PLATFORM_ADMIN` é conceito diferente.

Possível escopo:

```text
Platform
```

Não deve ser confundido com:

```text
Organization ADMIN
```

---

# 55. Regra crítica

Nunca implementar:

```text
ADMIN
=
acesso global
```

por conveniência.

ADMIN deve permanecer tenant-bound.

---

# 56. Platform Admin Security

Caso exista:

```text
PLATFORM_ADMIN
```

deve possuir controles mais fortes.

Exemplos:

```text
MFA

auditoria

justificativa para acesso

restrições operacionais
```

Detalhes dependem de decisões futuras.

---

# 57. APIs — Organizations

Endpoints conceituais podem incluir:

```http
GET /api/v1/organizations
GET /api/v1/organizations/:id
```

A disponibilidade depende do modelo multi-organização.

---

# 58. Criação de Organization

Possível endpoint administrativo:

```http
POST /api/v1/organizations
```

Não expor para usuários normais sem decisão de produto.

---

# 59. Atualização

Possível:

```http
PATCH /api/v1/organizations/:id
```

Somente campos explicitamente permitidos.

---

# 60. Não permitir troca de ID

Nunca permitir alteração de:

```text
organization.id
```

ou transferência arbitrária de recursos entre tenants.

---

# 61. API — Business Units

Endpoints:

```http
GET /api/v1/business-units

POST /api/v1/business-units

GET /api/v1/business-units/:id

PATCH /api/v1/business-units/:id
```

---

# 62. Listagem

```http
GET /api/v1/business-units
```

deve retornar somente áreas da organização ativa.

Não exigir que frontend envie `organizationId` para filtragem normal.

---

# 63. Criação

Request conceitual:

```json
{
  "name": "Recursos Humanos"
}
```

Backend adiciona:

```text
organizationId
```

a partir do contexto.

---

# 64. Response

Exemplo:

```json
{
  "data": {
    "id": "uuid",
    "name": "Recursos Humanos",
    "status": "ACTIVE"
  }
}
```

---

# 65. Inativação

Preferir operação semântica.

Exemplo:

```http
POST /api/v1/business-units/:id/archive
```

ou:

```http
POST /api/v1/business-units/:id/deactivate
```

O naming definitivo deve seguir convenção da API.

---

# 66. Membership API

Endpoints dependem do fluxo de usuários.

Possibilidades:

```http
GET /api/v1/users

POST /api/v1/users/invite

PATCH /api/v1/users/:id/membership
```

A modelagem definitiva pertence também à feature de usuários/autorização.

---

# 67. Organization Selector

Se usuário multi-organização:

```text
Header
└── Organization Selector
```

pode permitir troca de contexto.

---

# 68. Organization Selector UX

Exemplo:

```text
Empresa Alpha ▼

Empresa Alpha
Empresa Beta
Empresa Gamma
```

Mostrar apenas memberships autorizadas.

---

# 69. Business Unit Management

Tela administrativa pode possuir:

```text
Áreas

Nome
Status
Usuários
Atividades
Ações
```

---

# 70. Rota

Possível:

```text
/admin/business-units
```

A rota depende do papel ADMIN e da estratégia final de navegação.

---

# 71. Criar área

Interface:

```text
Nova área

Nome
[________________]

Cancelar
Criar
```

---

# 72. Editar área

Permitir alterações autorizadas como:

```text
nome
status
```

Campos finais dependem do domínio.

---

# 73. Confirmação de inativação

Antes de inativar área com dependências, UI deve informar impacto conhecido.

Exemplo:

```text
Esta área possui 14 atividades associadas.
```

O comportamento das atividades precisa seguir regra definida pelo backend.

---

# 74. Não calcular segurança no frontend

Frontend não deve assumir:

```ts
businessUnit.organizationId === currentOrganization.id
```

como única proteção.

Backend valida novamente.

---

# 75. ROPA

ROPA pertence à organização.

Consulta normal:

```text
Organization A
↓
ROPA A
```

Nunca:

```text
Organization A
↓
ROPA B
```

---

# 76. Dashboard

Dashboard também deve utilizar contexto de organização.

Métricas:

```text
activities

pending mappings

sensitive data

international transfers
```

devem ser calculadas somente para tenant autorizado.

---

# 77. Systems

System pertence à Organization.

Exemplo:

```text
Organization A
└── SAP
```

Mesmo nome pode existir em Organization B como entidade independente.

---

# 78. Suppliers

Supplier pertence à Organization.

Exemplo:

```text
Organization A
└── AWS

Organization B
└── AWS
```

Esses registros não precisam compartilhar o mesmo ID.

---

# 79. Catálogos globais

Alguns catálogos podem ser globais.

Exemplo:

```text
PersonalDataCategory
```

com:

```text
organizationId = NULL
isSystem = true
```

conforme modelo proposto.

---

# 80. Global não significa público

Mesmo recurso global deve ser exposto somente conforme regras da aplicação.

---

# 81. Customização de catálogo

Se organizações puderem criar categorias próprias:

```text
global category
+
organization category
```

devem ser distinguidas.

Isso não deve permitir alterar categoria global para todas as organizações.

---

# 82. Audit

Eventos sugeridos:

```text
ORGANIZATION_CREATED

ORGANIZATION_UPDATED

ORGANIZATION_STATUS_CHANGED

BUSINESS_UNIT_CREATED

BUSINESS_UNIT_UPDATED

BUSINESS_UNIT_ARCHIVED

USER_ORGANIZATION_MEMBERSHIP_CREATED

USER_ORGANIZATION_MEMBERSHIP_DISABLED
```

A lista deve acompanhar funcionalidades realmente implementadas.

---

# 83. Business Unit Created

Exemplo de metadata:

```json
{
  "businessUnitId": "uuid",
  "name": "Recursos Humanos"
}
```

---

# 84. Business Unit Updated

Pode registrar:

```json
{
  "changedFields": [
    "name"
  ]
}
```

Não registrar objeto inteiro sem necessidade.

---

# 85. Membership change

Alterações de membership são relevantes para segurança.

Devem ser auditadas.

Exemplo:

```text
usuário ganhou acesso à Organization A
```

---

# 86. Organization switch

Não é obrigatório tratar toda troca normal de organização como Business Audit Log.

Pode ser Security/Application Log se houver requisito.

Não gerar volume de auditoria sem necessidade.

---

# 87. Tenant isolation tests

Esta feature exige testes fortes.

Fixture:

```text
Organization A
├── User A
├── RH A
└── Activity A

Organization B
├── User B
├── RH B
└── Activity B
```

---

# 88. Business Unit read test

```text
Given:
User A

When:
GET BusinessUnit B

Then:
BusinessUnit B não é retornada
```

---

# 89. Business Unit update test

```text
Given:
User A

When:
PATCH BusinessUnit B

Then:
operação é rejeitada

And:
BusinessUnit B permanece inalterada
```

---

# 90. Activity relation test

```text
Given:
Activity A

When:
tenta associar BusinessUnit B

Then:
operação é rejeitada
```

---

# 91. System relation test

```text
Given:
Organization A

When:
Activity A referencia System B

Then:
operação é rejeitada
```

---

# 92. Supplier relation test

```text
Given:
Organization A

When:
Activity A referencia Supplier B

Then:
operação é rejeitada
```

---

# 93. Membership test

```text
Given:
User A não pertence à Organization B

When:
tenta selecionar Organization B

Then:
acesso é negado
```

---

# 94. Membership disabled test

```text
Given:
User possui membership em Organization A

And:
membership = INACTIVE

When:
tenta acessar Organization A

Then:
acesso é negado
```

---

# 95. Role isolation test

Caso roles pertençam ao membership:

```text
User

Organization A → DPO

Organization B → COLLABORATOR
```

Ao acessar B, usuário não pode herdar:

```text
DPO
```

de A.

---

# 96. Business Unit scope test

```text
Manager
↓
RH
```

não deve acessar atividade:

```text
Financeiro
```

quando permission scope for `BUSINESS_UNIT`.

---

# 97. Repository tests

Repositories tenant-bound devem possuir testes garantindo filtros de organização.

Especial atenção a:

```text
findById

findMany

update

delete

exists
```

---

# 98. Queries indiretas

Tenant isolation também se aplica a joins.

Exemplo:

```text
Activity
↓
Recipient
↓
Supplier
```

Não permitir que joins exponham dados de outro tenant.

---

# 99. Database Integrity

Além da autorização da aplicação, avaliar proteção no banco.

Questão:

```text
DBQ-008
```

Opções:

```text
application validation

composite foreign keys

RLS

combinação
```

---

# 100. Row Level Security

PostgreSQL RLS é uma possível camada adicional.

Questão:

```text
DBQ-009
```

Ainda está aberta.

Não implementar sem definir estratégia de contexto da conexão/transação.

---

# 101. RLS não substitui autorização

Mesmo com RLS:

```text
application authorization
```

continua necessária.

RLS protege linhas.

Não resolve sozinho regras como:

```text
MANAGER pode aprovar?
```

---

# 102. Composite Foreign Keys

Pode ser considerada estrutura como:

```text
(activity.organization_id, supplier_id)
```

referenciando recurso do mesmo tenant.

A implementação precisa considerar suporte do ORM escolhido.

---

# 103. Defense in Depth

Modelo ideal pode combinar:

```text
Authenticated Context

Authorization

Tenant-aware Repository

Database Constraints

RLS opcional
```

conforme complexidade aceitável.

---

# 104. Performance

Filtros frequentes por:

```text
organization_id
```

devem possuir índices adequados.

---

# 105. Index

Exemplo conceitual:

```sql
CREATE INDEX ...
ON processing_activities (organization_id);
```

Detalhes físicos pertencem às migrations.

---

# 106. Unique constraints tenant-aware

Quando unicidade for por organização:

```text
organization_id
+
field
```

deve fazer parte da constraint.

Exemplo possível:

```text
organization_id + system.name
```

caso nome de sistema seja definido como único dentro do tenant.

---

# 107. Não criar unicidade global acidental

Errado:

```text
UNIQUE(system.name)
```

se:

```text
Organization A → SAP

Organization B → SAP
```

for permitido.

---

# 108. Importação futura

Integrações futuras devem sempre resolver:

```text
qual Organization?
```

antes de persistir recursos tenant-bound.

---

# 109. Jobs

Jobs assíncronos também precisam carregar contexto do tenant.

Exemplo:

```json
{
  "organizationId": "uuid",
  "exportId": "uuid"
}
```

Worker deve validar o contexto apropriado.

---

# 110. Audit Job

Evento produzido por worker também precisa manter:

```text
organizationId
```

---

# 111. Storage

Object Storage deve utilizar organização na estratégia lógica de segregação.

Exemplo conceitual:

```text
organizations/{organizationId}/...
```

Não confiar somente no path para autorização.

---

# 112. Signed URL

Caso URLs assinadas sejam utilizadas:

```text
tenant
permission
file ownership
```

devem ser validados antes da geração.

---

# 113. Observabilidade

Logs técnicos podem possuir:

```text
organizationId
```

quando necessário para investigação.

Não registrar informações pessoais desnecessárias.

---

# 114. Frontend error

Se usuário tentar acessar recurso inexistente ou de outro tenant:

```text
Recurso não encontrado
```

pode ser exibido.

Não informar:

```text
"Esse recurso pertence à Empresa B"
```

Pela DEC-066, o mesmo contrato 404 deve ser apresentado para recurso inexistente, de outro tenant ou fora do scope de visibilidade dentro do tenant autorizado. Somente recurso legitimamente visível com ação não autorizada retorna 403/`FORBIDDEN`. Conhecer o UUID não altera essa política.

---

# 115. Organization Name

Nome da organização pode aparecer no layout.

Exemplo:

```text
Empresa Alpha
```

para deixar contexto explícito ao usuário.

Isso é especialmente importante em cenário multi-organização.

---

# 116. Context Awareness

Em DPO as a Service, evitar que usuário execute ação acreditando estar em outro cliente.

Interface deve deixar organização atual claramente identificável.

---

# 117. Operações críticas

Se houver risco relevante, operações administrativas podem mostrar organização atual na confirmação.

Exemplo:

```text
Você está arquivando esta atividade em:

Empresa Alpha
```

Não é obrigatório para toda operação.

---

# 118. Open Questions

Questões diretamente relacionadas:

```text
PRODQ-001 — aplicação multi-tenant?

AUTHQ-006 — DPO as a Service multi-organização?

AUTHQ-003 — ADMIN?

AUTHQ-006 — usuário multi-organização?

AUTHQ-007 — múltiplos roles?

AUTHQ-008 — múltiplas áreas?

DQ-008 — hierarquia de Business Units?

DQ-009 — responsável pela atividade?

DBQ-008 — integridade entre tenants?

DBQ-009 — PostgreSQL RLS?

AUTHQ-009 — PLATFORM_ADMIN?
```

---

# 119. Nova questão — ORGQ-001

**Status:** OPEN  
**Priority:** MEDIUM

Business Unit possui nome único dentro da organização?

Exemplo:

```text
Organization A
├── Financeiro
└── Financeiro
```

é permitido?

A resposta pode depender de hierarquia.

---

# 120. Nova questão — ORGQ-002

**Status:** OPEN  
**Priority:** HIGH

O que acontece quando Business Unit com atividades ACTIVE é inativada?

Possibilidades:

```text
atividades continuam ativas

atividades recebem pendência

inativação é bloqueada

atividades precisam ser transferidas
```

---

# 121. Nova questão — ORGQ-003

**Status:** OPEN  
**Priority:** MEDIUM

Quem pode criar/inativar Business Units?

Possibilidades:

```text
ADMIN

DPO

PLATFORM_ADMIN
```

A resposta deve ser incorporada à matriz de autorização.

---

# 122. Nova questão — ORGQ-004

**Status:** OPEN  
**Priority:** HIGH

Como uma nova Organization é criada?

```text
PLATFORM_ADMIN

onboarding interno

self-service

integração comercial
```

---

# 123. Nova questão — ORGQ-005

**Status:** OPEN  
**Priority:** HIGH

O que acontece quando uma Organization inteira é inativada?

Definir:

```text
login

sessões existentes

acesso read-only

jobs

exports

retenção

arquivos
```

---

# 124. Critérios de aceite

```text
AC-ORG-001

Given:
usuário autenticado na Organization A

When:
lista Business Units

Then:
somente Business Units da Organization A são retornadas
```

```text
AC-ORG-002

Given:
usuário da Organization A

When:
tenta acessar BusinessUnit da Organization B

Then:
o recurso não é exposto
```

```text
AC-ORG-003

Given:
usuário autorizado

When:
cria Business Unit

Then:
Business Unit pertence automaticamente à organização ativa
```

```text
AC-ORG-004

Given:
Activity da Organization A

When:
é enviada BusinessUnit da Organization B

Then:
associação é rejeitada
```

```text
AC-ORG-005

Given:
membership inativa

When:
usuário tenta acessar a organização

Then:
acesso é negado
```

```text
AC-ORG-006

Given:
Business Unit histórica

When:
é inativada

Then:
seus registros históricos não são apagados
```

---

# 125. Checklist de implementação

Antes de implementar recurso tenant-bound:

```text
[ ] possui organizationId direta ou indiretamente?

[ ] contexto vem da autenticação?

[ ] query filtra tenant?

[ ] relações validam tenant?

[ ] autorização possui scope?

[ ] índices consideram organizationId?

[ ] unique constraints consideram tenant?

[ ] cache considera tenant?

[ ] audit possui organizationId?

[ ] storage considera tenant?

[ ] testes cross-tenant existem?
```

---

# 126. Definition of Done

A feature Organizations é considerada pronta quando:

```text
[ ] Organization model definido

[ ] Membership model definido

[ ] Business Unit model definido

[ ] organização ativa resolvida

[ ] tenant isolation aplicado

[ ] Business Unit CRUD necessário

[ ] permissions implementadas

[ ] memberships protegidas

[ ] cross-tenant relationships protegidas

[ ] audit implementado

[ ] testes de integração

[ ] testes cross-tenant

[ ] frontend administrativo quando aplicável

[ ] documentação atualizada
```

---

# 127. Regra final

`Organization` não é apenas um campo de cadastro.

É uma:

```text
security boundary
```

do sistema.

Toda feature nova deve responder:

```text
Esse recurso pertence a qual organização?

Como o tenant é determinado?

Como impedimos acesso de outro tenant?

As relações também respeitam o tenant?

O cache respeita o tenant?

A auditoria registra o tenant?
```

Se essas perguntas não tiverem resposta, a feature ainda não está pronta para ambiente multi-tenant.

---

# 128. Próxima feature

O próximo documento recomendado é:

`docs/features/PROCESSING-ACTIVITY.md`

Ele especificará a entidade central da plataforma:

```text
atividade de tratamento

dados pessoais

titulares

finalidades

status

área responsável

ciclo de vida

relações com sistemas e fornecedores

preparação para ROPA

versionamento
```
