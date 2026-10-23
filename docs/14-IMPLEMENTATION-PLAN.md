# Implementation Plan

> **Documento:** Plano de Implementação  
> **Status:** Draft  
> **Objetivo:** transformar as especificações funcionais e técnicas em uma ordem segura e incremental de desenvolvimento assistido por IA.


## S3.5 — resolução estrutural aprovada, implementação pendente

AUTHQ-015 → [DEC-070](13-DECISIONS.md#dec-070--s35-como-resolução-estrutural-de-concessões-do-membership-autorizado), aprovada em 2026-10-23, delimita a S3.5 como resolução estrutural de concessões após a S3.4. Permission matrix, Role → Permission e autorização funcional pertencem a etapa posterior; a autorização funcional não está concluída. Esta aprovação autoriza somente formalização documental.

Sequência: S3.4 (Membership e tenant autorizados) → S3.5 (contrato e resolução estrutural de grants) → etapa posterior (permission matrix e autorização funcional). A implementação da S3.5 ainda depende de autorização humana específica.

Prever contrato `ResolvedMembershipGrants`, resolver, repository, integração explícita e SQL incremental versionado para leitura mínima `SELECT (id, code) ON public.roles`, sem alteração de schema prevista, nova primitive ou expansão do bootstrap. Estado atual por request, filtros Organization/Membership, `withAuthorizedTenant()`/`withTenant()`, RLS/FORCE RLS e imutabilidade profunda são obrigatórios.

Os 17 critérios S3.5-AC-001 a S3.5-AC-017 da DEC-070 definem o aceite futuro. Itens amplos desta fase sobre permissions, /me e UI não integram S3.5. A conclusão estrutural não encerrará a autorização funcional ou as pendências correspondentes.

---

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

OIDC com provedor gerenciado, fornecedor pendente (Auth0 somente candidato), User interno independente e sem união automática de identidades por e-mail. SSO corporativo será parte da V1 após a primeira entrega. Sessão server-side com cookie opaco; frontend não administra tokens. A sessão identifica User; cada request solicita Organization explicitamente e o backend valida autorização atual. Campos do body não transferem recursos entre tenants. A política temporal da Session está definida nas DEC-067/068 e o logout da Session atual na DEC-069.

Seções de proposta legadas deste documento devem ser interpretadas sob estas decisões: não constituem aprovação de permissões de escrita, scopes adicionais, fornecedor, topologia do banco ou herança hierárquica. RLS foi aprovado posteriormente em DEC-046. Questões decididas continuam referenciadas para rastreabilidade; pendências parciais estão identificadas no registro central.


## Persistência e defesa tenant-aware aprovadas — 2026-09-18

DEC-044 (DBQ-001): Drizzle é o ORM/query builder aprovado. Queries ficam em repository/persistence; SQL específico é parametrizado, localizado e versionado. Migrations são revisáveis e reproduzíveis desde banco vazio. Não reduzir garantias PostgreSQL para acomodar o ORM.

DEC-045 (DBQ-008): validar relações/autorização na aplicação e garantir coerência tenant-bound por constraints PostgreSQL. Quando necessário, filhos e associações carregam organization_id NOT NULL, unicidades/FKs compostas e índices adequados; usar checks declarativos quando aplicáveis. FK somente por UUID não prova mesmo tenant. organization_id vem do contexto autorizado e não é campo livre para transferência. Preferir constraint declarativa simples a trigger equivalente.

DEC-046 (DBQ-009): RLS adicional nas tabelas tenant-bound, com contexto local à transação, todas as queries da operação no mesmo contexto, ausência de contexto negando acesso e nenhum tenant persistente na conexão. Considerar pooling. Runtime sem superuser/BYPASSRLS/propriedade das tabelas protegidas/alteração de policies; FORCE ROW LEVEL SECURITY quando adequado. Credencial de migration separada do runtime.

Defesa aprovada: Authentication → Membership → Permission → Scope → Repository tenant-aware → PostgreSQL constraints → PostgreSQL RLS. Nenhuma camada substitui outra. Scope de Business Unit continua na autorização da aplicação.

User, ExternalIdentity, Session e outras entidades globais não recebem organization_id artificial; sua proteção específica será definida posteriormente. Descoberta dos próprios Memberships exige caminho restrito, sem policy irrestrita. Estes detalhes não estão implementados nem decididos por exemplos deste documento.

Referências legadas a Prisma/Drizzle ou a RLS como alternativas pendentes são históricas: estas três questões estão decididas em DEC-044 a DEC-046. Políticas funcionais, autenticação e features posteriores continuam sujeitas às questões específicas. A topologia física de produção não é escolhida por este registro.

---

---


---

# 1. Objetivo

Este documento define:

```text
o que implementar

em qual ordem

quais dependências existem

quais decisões precisam estar resolvidas

quais entregáveis são esperados

quais testes são obrigatórios
```

O objetivo não é substituir:

```text
Business Rules

Domain

API

Database

Feature Specs
```

Este documento apenas organiza a implementação.

---

# 2. Documentos obrigatórios

Antes de iniciar qualquer fase:

```text
AGENTS.md

docs/00-PROJECT.md

docs/01-ARCHITECTURE.md

docs/02-DOMAIN.md

docs/03-DATABASE.md

docs/04-AUTHORIZATION.md

docs/05-BUSINESS-RULES.md

docs/06-WORKFLOWS.md

docs/07-API.md

docs/08-FRONTEND.md

docs/09-SECURITY.md

docs/10-AUDIT.md

docs/11-TESTING.md

docs/12-OPEN-QUESTIONS.md

docs/13-DECISIONS.md
```

e a feature correspondente em:

```text
docs/features/
```

---

# 3. Regra principal

Não implementar uma decisão estrutural ainda marcada como:

```text
OPEN
```

quando ela bloquear a fase.

---

# 4. Fluxo de trabalho

```text
Specification
      ↓
Open Questions
      ↓
Decisions
      ↓
Implementation Plan
      ↓
Task
      ↓
Code
      ↓
Tests
      ↓
Review
```

---

# 5. Estratégia

O desenvolvimento deve ser:

```text
incremental

vertical quando possível

testável

reversível

rastreável
```

---

# 6. Evitar

Não implementar todo:

```text
Database
```

primeiro, depois todo:

```text
Backend
```

e somente depois todo:

```text
Frontend
```

Preferir slices funcionais quando a fundação estiver pronta.

Exemplo:

```text
Create Activity

Database
+
Backend
+
API
+
Frontend
+
Tests
```

---

# 7. Fases

```text
Phase 0 — Foundation

Phase 1 — Authentication & Organizations

Phase 2 — Processing Activity Core

Phase 3 — Mapping Wizard

Phase 4 — Systems & Suppliers

Phase 5 — Compliance Gate

Phase 6 — Versioning & Audit

Phase 7 — ROPA

Phase 8 — Dashboard

Phase 9 — Hardening & Release
```

---

# 8. Dependências

```text
Foundation
    ↓
Authentication / Organizations
    ↓
Processing Activity
    ↓
Mapping Wizard
    ↓
Systems / Suppliers
    ↓
Compliance Gate
    ↓
Versioning / Audit
    ↓
ROPA
    ↓
Dashboard
    ↓
Hardening
```

Algumas fases podem evoluir parcialmente em paralelo.

---

# PHASE 0 — FOUNDATION

# 9. Objetivo

Criar a base técnica do projeto sem implementar regras funcionais ainda abertas.

---

# 10. Deliverables

```text
Frontend inicial

Backend inicial

PostgreSQL

estrutura modular

configuração de ambiente

lint

format

test runner

Docker local

health check

error handling base

logging base

CI inicial
```

---

# 11. Estrutura sugerida

```text
/
├── apps/
│   ├── web/
│   └── api/
├── docs/
├── packages/
├── AGENTS.md
└── ...
```

Essa estrutura é sugestão técnica.

Se o projeto já possuir estrutura diferente, não reorganizar automaticamente.

---

# 12. Frontend foundation

Stack prevista:

```text
React

TypeScript

Vite

Tailwind CSS

TanStack Query

Zustand

React Hook Form

Zod
```

---

# 13. Backend foundation

Stack prevista:

```text
NestJS

TypeScript

PostgreSQL
```

ORM aprovado: Drizzle (DBQ-001 / DEC-044). Persistência adota integridade composta e RLS (DEC-045/046). Listas legadas devem excluir questões já DECIDED.

---

# 14. Backend modules

Criar estrutura modular preparada para:

```text
auth

organizations

users

processing-activities

systems

suppliers

compliance

ropa

dashboard

audit

files
```

Não é necessário implementar todos os módulos nesta fase.

---

# 15. Health Check

Criar:

```http
GET /health
```

ou equivalente operacional.

---

# 16. Error Handling

Implementar envelope consistente.

Exemplo:

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Resource not found"
  }
}
```

Não expor:

```text
stack trace

SQL

credentials

internal paths
```

---

# 17. Environment

Separar:

```text
development

test

production
```

e staging quando confirmado.

---

# 18. Secrets

Nunca versionar:

```text
passwords

JWT secrets

database credentials

storage credentials

API keys
```

---

# 19. Database migration

Estabelecer mecanismo de:

```text
migration

rollback strategy

seed
```

compatível com ORM escolhido.

---

# 20. Testing foundation

Configurar:

```text
unit

integration

frontend component

E2E
```

conforme `11-TESTING.md`.

---

# 21. CI

Pipeline mínimo:

```text
install

lint

typecheck

unit tests

build
```

Integration/E2E podem ser adicionados conforme infraestrutura necessária.

---

# 22. Bloqueadores Phase 0

DBQ-001, DBQ-008 e DBQ-009 estão DECIDED (DEC-044 a DEC-046); não bloqueiam mais a persistência. O bootstrap local de frontend/backend, TypeScript, lint/build e PostgreSQL pode começar sem decisões de Authentication ou Activity. TESTQ-011 está DECIDED em DEC-047: Vitest é o runner backend aprovado; INFRAQ-006 antes do pipeline específico de CI. Esses pontos não impedem bootstrap e smoke checks locais. A integração de autenticação e modelos de features continua dependente das questões específicas.

---

# 23. Definition of Done — Phase 0

```text
[ ] frontend executa

[ ] backend executa

[ ] PostgreSQL executa

[ ] migrations funcionam

[ ] health check funciona

[ ] configuração por ambiente funciona

[ ] secrets não estão versionados

[ ] lint funciona

[ ] typecheck funciona

[ ] testes base funcionam

[ ] build funciona

[ ] CI executa

[ ] estrutura modular criada
```

---

# PHASE 1 — AUTHENTICATION & ORGANIZATIONS

# 24. Objetivo

Estabelecer:

```text
quem é o usuário

em qual Organization está

quais roles possui

quais Business Units pode acessar
```

antes de implementar dados tenant-bound.

---

# 25. Dependências

```text
Phase 0
```

---

# 26. Bloqueadores

Resolver antes da implementação definitiva:

```text
PRODQ-001

AUTHQ-005

AUTHQ-006

AUTHQ-007

AUTHQ-008

SECQ-001

SECQ-002
```

Também avaliar:

```text
AUTHQ-010
SECQ-003
SECQ-004 (DECIDED — DEC-067, DEC-068 e DEC-069)
```

---

# 27. Database

Entidades esperadas:

```text
organizations

business_units

users

organization_users

user_business_units
```

dependendo das decisões finais.

---

## Política temporal da Session aprovada

Implementação futura conforme DEC-067/068/069: `expiresAt = createdAt + 12 horas`; `lastActivityAt = createdAt`; idle timeout de 30 minutos; persistência de atividade somente por request autenticada válida, com throttling de cinco minutos e sem atualização periódica; nenhuma extensão automática de `expiresAt` ou endpoint local de refresh; logout da Session atual com revogação confirmada antes da remoção do cookie e resposta 204. A evolução exige migration e adaptação das primitives restritas, sem DML direto do runtime.

## Tenant Request Context implementado

A S3.4 implementa as DEC-052/054/056/062/065: depois da autenticação da Session, valida `X-Organization-Id`, chama exclusivamente o bootstrap restrito de Membership e cria `AuthorizedTenantContext` somente no resultado positivo. O boundary abre `withTenant()` com `authorizedOrganizationId`; header ausente/inválido e autorização negativa seguem os contratos 400/403 aprovados. RoleAssignments, roles, scopes e Business Units integram a S3.5 estrutural aprovada em DEC-070, ainda não implementada; permission matrix e autorização funcional ficam para etapa posterior.

# 28. Authentication

Implementar mecanismo definido em:

```text
SECQ-001
```

---

# 29. Authenticated Context

Backend deve produzir contexto conceitual:

```ts
{
  userId,
  organizationId,
  roles,
  businessUnitIds
}
```

conforme decisões finais.

---

# 30. /me

Implementar:

```http
GET /api/v1/me
```

para bootstrap do frontend.

---

# 31. Organization Context

Se multi-org for aprovado:

```text
login
↓
organizations disponíveis
↓
seleção
↓
active organization
↓
roles/scopes recalculados
```

---

# 32. Authorization foundation

Implementar permissions semânticas.

Evitar checks espalhados como:

```ts
if (user.role === 'DPO')
```

quando uma permission específica for mais apropriada.

---

# 33. Tenant isolation

Criar padrão obrigatório para repositories/use cases tenant-bound.

---

# 34. Cross-tenant tests

Criar testes desde esta fase.

Não deixar tenant isolation para hardening.

---

# 35. Organizations UI

Quando permitido:

```text
Organization context

Business Units

Users/Memberships
```

conforme escopo V1.

---

# 36. Definition of Done — Phase 1

```text
[ ] autenticação funciona

[ ] sessão funciona

[ ] /me funciona

[ ] Organization context funciona

[ ] roles funcionam

[ ] Business Unit scope funciona

[ ] backend authorization existe

[ ] frontend route guards existem

[ ] tenant isolation implementado

[ ] cross-tenant tests passam

[ ] disabled user tratado

[ ] disabled membership tratado

[ ] audit de eventos críticos implementado quando definido
```

---

# PHASE 2 — PROCESSING ACTIVITY CORE

# 37. Objetivo

Criar o agregado central:

```text
ProcessingActivity
```

sem depender ainda da experiência completa do Wizard.

---

# 38. Dependências

```text
Phase 1
```

---

# 39. Bloqueadores principais

Resolver:

```text
DQ-001

DQ-002

DQ-003

DQ-004

DQ-005

DQ-009

WFQ-001

PAQ-006
```

Algumas podem ser adiadas apenas se o slice implementado não depender delas.

---

# 40. Database

Implementar estruturas aprovadas para:

```text
processing_activities

purposes

personal_data_categories

personal_data_items

data_subject_categories

collection_sources

processing_operations

recipients

retention

security_measures

legal_bases

international_transfers
```

somente conforme decisões finais.

---

# 41. Activity creation

Implementar:

```http
POST /api/v1/processing-activities
```

com criação mínima.

---

# 42. Draft

Aplicar:

```text
DEC-028
```

Activity DRAFT pode permanecer incompleta.

---

# 43. Activity list

Implementar:

```http
GET /api/v1/processing-activities
```

com:

```text
pagination

search

status

business unit

authorization scope
```

quando aplicável.

---

# 44. Activity detail

```http
GET /api/v1/processing-activities/:id
```

---

# 45. Activity update

```http
PATCH /api/v1/processing-activities/:id
```

somente para campos editáveis.

---

# 46. Protected fields

Não permitir mass-assignment de:

```text
organizationId

status

complianceStatus

currentVersion

createdBy
```

---

# 47. Personal Data Catalog

Implementar catálogo conforme:

```text
DQ-001
```

---

# 48. Data Subjects

Representar categorias de titulares.

Exemplo:

```text
employees

customers

candidates

minors
```

conforme catálogo aprovado.

---

# 49. Purposes

Implementar somente após:

```text
DQ-004
```

---

# 50. Legal Basis

Implementar estrutura definitiva somente após:

```text
DQ-002

DQ-003
```

---

# 51. Retention

Implementar estrutura definitiva após:

```text
DQ-005
```

---

# 52. Operations

Códigos definidos por:

```text
DEC-029
```

---

# 53. International Transfer

Não inferir automaticamente.

Aplicar:

```text
DEC-025
```

---

# 54. UI

Criar inicialmente:

```text
Activities List

Create Activity

Activity Detail
```

---

# 55. Tests

Obrigatórios:

```text
create

read

update

validation

permissions

business unit scope

cross-tenant

mass-assignment

pagination

filters
```

---

# 56. Definition of Done — Phase 2

```text
[ ] Activity aggregate implementado

[ ] create funciona

[ ] draft funciona

[ ] list funciona

[ ] detail funciona

[ ] update funciona

[ ] tenant isolation funciona

[ ] permissions funcionam

[ ] catálogos necessários existem

[ ] invariantes principais testadas

[ ] cross-tenant tests passam

[ ] mass-assignment tests passam

[ ] frontend básico funciona
```

---

# PHASE 3 — MAPPING WIZARD

# 57. Objetivo

Transformar a edição da Activity em experiência guiada.

---

# 58. Dependências

```text
Phase 2
```

---

# 59. Bloqueadores

Resolver principalmente:

```text
MWQ-001

MWQ-004

PAQ-006

FEQ-003

FEQ-006
```

e decisões de domínio das etapas.

---

# 60. Wizard Shell

Implementar:

```text
step navigation

progress

save

continue

back

resume

validation summary
```

---

# 61. Steps

Ordem conceitual:

```text
1. Identification

2. Purpose

3. Personal Data

4. Data Subjects

5. Collection

6. Processing Operations

7. Recipients

8. International Transfer

9. Retention

10. Security

11. Legal Basis

12. Review
```

---

# 62. Persistência

Aplicar:

```text
DEC-027
```

Wizard opera diretamente sobre:

```text
ProcessingActivity
+
subresources
```

---

# 63. Conditional Logic

Exemplo:

```text
International Transfer selected?
        ↓ yes
Show transfer details
```

---

# 64. Dados condicionais antigos

Não implementar política definitiva antes de:

```text
MWQ-001
```

---

# 65. Validation

Separar:

```text
field validation

step validation

save validation

submit validation

compliance validation
```

---

# 66. Resume

Implementar comportamento após:

```text
MWQ-002
```

---

# 67. Submit

Operação semântica:

```http
POST /api/v1/processing-activities/:id/submit
```

ou contrato final equivalente.

---

# 68. Submit não é PATCH

Aplicar:

```text
DEC-030
```

---

# 69. Error navigation

Se Submit retornar erros:

```text
campo

step

errorCode
```

frontend deve conseguir levar usuário à correção.

---

# 70. Tests

Cobrir:

```text
save draft

resume

navigation

conditional steps

validation

sensitive data

minor data

international transfer

legal basis branches

submit

authorization

cross-tenant

network error

concurrency
```

---

# 71. Definition of Done — Phase 3

```text
[ ] Wizard Shell implementado

[ ] etapas implementadas

[ ] persistência progressiva funciona

[ ] conditional logic funciona

[ ] save funciona

[ ] resume funciona

[ ] validation funciona

[ ] submit funciona

[ ] erros levam à etapa correta

[ ] authorization funciona

[ ] cross-tenant tests passam

[ ] E2E do Wizard passa
```

---

# PHASE 4 — SYSTEMS & SUPPLIERS

# 72. Objetivo

Implementar catálogos reutilizáveis utilizados pelo Mapping Wizard.

---

# 73. Dependências

```text
Phase 3
```

Parte desta fase pode começar durante Phase 3.

---

# 74. Bloqueadores — Systems

Resolver:

```text
SYSQ-002

SYSQ-004

SYSQ-005

SYSQ-006

SYSQ-007

SYSQ-011
```

conforme partes implementadas.

---

# 75. Bloqueadores — Suppliers

Resolver:

```text
SUPQ-002

SUPQ-003

SUPQ-004

SUPQ-006

SUPQ-011
```

---

# 76. Systems

Implementar:

```text
list

create

detail

update

mappingStatus

inactivate

associations

quick create
```

---

# 77. Suppliers

Implementar:

```text
list

create

detail

update

mappingStatus

inactivate

associations

quick create
```

---

# 78. Quick Create

Aplicar:

```text
DEC-012
```

Quick Create gera entidade persistente.

---

# 79. Mapping Status

Aplicar:

```text
DEC-011
```

mas critérios de MAPPED precisam estar decididos.

---

# 80. Complete Mapping

Se status depender de validação:

```text
complete-mapping
```

deve ser operação backend controlada.

---

# 81. Inactive

Não remover referências históricas.

Aplicar:

```text
DEC-020
```

---

# 82. Wizard integration

Selectors devem permitir:

```text
search

select

quick create
```

conforme permission.

---

# 83. Tests

Systems:

```text
CRUD

mapping status

quick create

permissions

cross-tenant

associations

inactive

history
```

Suppliers:

```text
CRUD

mapping status

quick create

permissions

cross-tenant

System association

Recipient association

inactive

history
```

---

# 84. Definition of Done — Phase 4

```text
[ ] Systems implementados

[ ] Suppliers implementados

[ ] Quick Create funciona

[ ] mappingStatus funciona

[ ] critérios de MAPPED validados no backend

[ ] associations funcionam

[ ] tenant isolation funciona

[ ] inactive preserva histórico

[ ] Wizard integrado

[ ] testes cross-tenant passam

[ ] E2E crítico passa
```

---

# PHASE 5 — COMPLIANCE GATE

# 85. Objetivo

Implementar verificações estruturadas antes da ativação/publicação conforme workflow final.

---

# 86. Dependências

```text
Phase 2

Phase 3

Phase 4 quando System/Supplier afetarem Gate
```

---

# 87. Bloqueadores

Resolver:

```text
BRQ-001

BRQ-002

BRQ-003

BRQ-004

BRQ-005

BRQ-007

WFQ-004

WFQ-005

WFQ-006

CGQ-001

CGQ-002

CGQ-003

CGQ-004

CGQ-005
```

e:

```text
SYSQ-007

SUPQ-006
```

se integrarem o Gate.

---

# 88. Checks

Implementar avaliadores para:

```text
LEGAL_BASIS

RETENTION

SECURITY_MEASURES

INTERNATIONAL_TRANSFER

SENSITIVE_DATA

MINOR_DATA
```

---

# 89. Estrutura

Exemplo:

```text
ComplianceGateService
        ↓
Check Evaluators
        ↓
Compliance Result
        ↓
Persistence
```

---

# 90. Status

Checks:

```text
PASS

FAIL

REVIEW_REQUIRED

NOT_APPLICABLE
```

Aggregate:

```text
PENDING

COMPLETE

BLOCKED
```

---

# 91. Reason Codes

Criar códigos estáveis.

Exemplo:

```text
LEGAL_BASIS_MISSING

RETENTION_MISSING

SECURITY_MEASURES_MISSING

TRANSFER_REVIEW_REQUIRED
```

---

# 92. Não usar mensagem como regra

Frontend não deve depender de:

```text
"Base legal não informada"
```

para descobrir comportamento.

Usar:

```text
reasonCode
```

---

# 93. API

Possível:

```http
GET /api/v1/processing-activities/:id/compliance
```

```http
POST /api/v1/processing-activities/:id/compliance/run
```

conforme decisão final.

---

# 94. Human Review

Implementar somente após:

```text
CGQ-001

WFQ-005
```

---

# 95. Activation

Implementar somente após:

```text
BRQ-006

WFQ-004
```

---

# 96. Regra

Activity não pode se tornar:

```text
ACTIVE
```

sem atender condição de Gate definida pelo produto.

---

# 97. UI

Criar:

```text
Compliance Summary

Check Cards

Reason

Correction Link

Review Action

Run Gate
```

conforme permissões.

---

# 98. Tests

Cobrir individualmente cada check.

Também:

```text
aggregation

review required

blocked

version

authorization

cross-tenant

concurrency

technical errors

audit
```

---

# 99. Definition of Done — Phase 5

```text
[ ] checks implementados

[ ] reason codes definidos

[ ] aggregation implementada

[ ] Gate API implementada

[ ] Gate UI implementada

[ ] human review implementada quando aplicável

[ ] activation integrada

[ ] authorization implementada

[ ] audit implementado

[ ] cross-tenant tests passam

[ ] testes de cada regra passam

[ ] E2E Gate passa
```

---

# PHASE 6 — VERSIONING & AUDIT

# 100. Objetivo

Garantir rastreabilidade histórica.

---

# 101. Dependências

```text
Phase 2

Phase 5
```

Partes de AuditLog devem existir antes desta fase.

Esta fase consolida a implementação completa.

---

# 102. Bloqueadores

Resolver:

```text
WFQ-007

WFQ-008

PAQ-007

DBQ-002

DBQ-003

AUDQ-010

AUDQ-012

AUDQ-013
```

---

# 103. ActivityVersion

Implementar estratégia definida:

```text
snapshot

versioned tables

hybrid
```

---

# 104. Version number

Se aprovado:

```text
Activity
├── v1
├── v2
└── v3
```

---

# 105. Published version

Precisa existir conceito claro de:

```text
current published version
```

quando nova revisão estiver em andamento.

---

# 106. Revision

Fluxo conceitual:

```text
ACTIVE v1
↓
Start Revision
↓
UNDER_REVIEW v2
↓
Review
↓
Gate
↓
Publish
↓
ACTIVE v2
```

somente após workflow aprovado.

---

# 107. AuditLog

Garantir eventos para ações relevantes.

---

# 108. Eventos

Exemplos:

```text
ACTIVITY_CREATED

ACTIVITY_SUBMITTED

ACTIVITY_REVIEW_STARTED

ACTIVITY_ACTIVATED

ACTIVITY_ARCHIVED

ACTIVITY_VERSION_CREATED

COMPLIANCE_GATE_RUN

SYSTEM_CREATED

SUPPLIER_CREATED

ROPA_EXPORTED
```

---

# 109. Append-only

Aplicar:

```text
DEC-016
```

---

# 110. Histórico

Criar UI quando aplicável:

```text
Activity
↓
History
```

---

# 111. Diff

Somente implementar se:

```text
AUDQ-009
```

for aprovado para V1.

---

# 112. Tests

Cobrir:

```text
version creation

published version

revision

rejected version

audit event

snapshot consistency

historical System

historical Supplier

concurrency
```

---

# 113. Definition of Done — Phase 6

```text
[ ] estratégia de versionamento implementada

[ ] versões não são sobrescritas

[ ] published version funciona

[ ] revisão funciona

[ ] snapshots são consistentes

[ ] Systems históricos preservados

[ ] Suppliers históricos preservados

[ ] AuditLog append-only

[ ] eventos críticos auditados

[ ] histórico consultável

[ ] testes de versionamento passam
```

---

# PHASE 7 — ROPA

# 114. Objetivo

Gerar automaticamente ROPA a partir das Activities.

---

# 115. Dependências

```text
Phase 5

Phase 6
```

---

# 116. Bloqueadores

Resolver:

```text
ROPAQ-001

ROPAQ-002

ROPAQ-003

WFQ-008

AUDQ-012
```

Para export:

```text
ROPAQ-004

ROPAQ-005

ROPAQ-008

APIQ-006
```

---

# 117. Projection

Aplicar:

```text
DEC-008
```

ROPA não é tabela manual independente.

---

# 118. Read Model

Implementar query service capaz de produzir:

```text
Activity

Purpose

Personal Data

Subjects

Sources

Operations

Systems

Recipients

Suppliers

Transfers

Retention

Security

Legal Basis

Compliance

Version
```

conforme modelo final.

---

# 119. API

```http
GET /api/v1/ropa
```

---

# 120. Filters

Possíveis:

```text
businessUnitId

complianceStatus

hasSensitiveData

hasMinorData

hasInternationalTransfer

search
```

---

# 121. UI

Criar:

```text
ROPA List

Filters

Detail

Compliance Status

Version
```

---

# 122. Read-only

ROPA não deve possuir edição independente.

Correção:

```text
ROPA
↓
Activity
↓
Revision/Edit
```

---

# 123. Export

Implementar:

```text
PDF

XLSX
```

conforme requisito original.

---

# 124. Export backend

Não depender de:

```text
HTML table → browser export
```

como fonte oficial.

---

# 125. Snapshot

Export deve usar conjunto consistente conforme:

```text
ROPAQ-008
```

---

# 126. Audit

Export deve gerar evento conforme decisão de auditoria.

---

# 127. Security

Arquivo exportado:

```text
private

authorized

tenant scoped
```

---

# 128. Tests

Cobrir:

```text
projection

filters

tenant

scope

version

sensitive

minors

international

compliance

pagination

export

export permission

export audit

historical consistency
```

---

# 129. Definition of Done — Phase 7

```text
[ ] ROPA projection funciona

[ ] versão correta é utilizada

[ ] filtros funcionam

[ ] authorization funciona

[ ] tenant isolation funciona

[ ] frontend funciona

[ ] PDF funciona

[ ] XLSX funciona

[ ] export é protegido

[ ] export é auditado conforme decisão

[ ] testes passam
```

---

# PHASE 8 — DASHBOARD

# 130. Objetivo

Criar visão consolidada para acompanhamento do mapeamento.

---

# 131. Dependências

```text
Phase 4

Phase 5

Phase 6
```

ROPA não é necessariamente dependência técnica, mas deve compartilhar conceitos.

---

# 132. Bloqueadores

Resolver:

```text
DASHQ-001

DASHQ-002

DASHQ-003

DASHQ-006

DASHQ-007

DASHQ-010

DASHQ-011
```

---

# 133. Summary

Implementar métricas aprovadas:

```text
mapping percentage

Compliance pending

Compliance blocked

sensitive data

minor data

international transfers

Systems pending

Suppliers pending
```

---

# 134. Pendências

Implementar read model de pendências após:

```text
DASHQ-006

DASHQ-007
```

---

# 135. Old Pendencies

Implementar threshold após:

```text
DASHQ-008
```

---

# 136. Drill-down

Cards devem levar a recursos filtrados.

---

# 137. Consistência

Dashboard e ROPA devem compartilhar conceitos como:

```text
hasSensitiveData

hasMinorData

hasInternationalTransfer
```

---

# 138. API

Estratégia inicial possível:

```http
GET /api/v1/dashboard/summary
```

```http
GET /api/v1/dashboard/pending-items
```

dependendo de decisão técnica.

---

# 139. UI

Criar:

```text
Metric Cards

Mapping Progress

Pending Items

Filters

Drill-down
```

---

# 140. Performance

Validar queries agregadas.

Não introduzir Redis automaticamente.

---

# 141. Tests

Cobrir:

```text
metrics

formula

scope

tenant

sensitive

minors

international

systems pending

suppliers pending

pending age

archived

version

drill-down

error != zero
```

---

# 142. Definition of Done — Phase 8

```text
[ ] métricas definidas

[ ] fórmulas implementadas

[ ] tenant scope funciona

[ ] authorization scope funciona

[ ] cards implementados

[ ] pendências implementadas

[ ] drill-down funciona

[ ] versão correta é considerada

[ ] error states implementados

[ ] performance validada

[ ] testes passam
```

---

# PHASE 9 — HARDENING & RELEASE

# 143. Objetivo

Preparar produto para ambiente real.

---

# 144. Security Review

Revisar:

```text
authentication

authorization

tenant isolation

IDOR

mass assignment

uploads

CORS

CSRF

XSS

rate limiting

secrets

logging

exports

signed URLs
```

---

# 145. Tenant isolation review

Executar revisão específica em:

```text
repositories

joins

exports

dashboard

ROPA

audit

files

jobs

cache
```

---

# 146. Authorization review

Validar todas as operações semânticas.

---

# 147. Upload review

Validar:

```text
MIME

size

extension

authorization

storage

download

malware strategy
```

---

# 148. Database review

Validar:

```text
indexes

foreign keys

unique constraints

tenant indexes

migration safety

backup
```

---

# 149. Performance

Validar principalmente:

```text
Activities List

Wizard

ROPA

Dashboard

Exports
```

---

# 150. Observability

Definir:

```text
structured logs

error tracking

metrics

health

readiness
```

---

# 151. Backup

Antes de produção, resolver:

```text
INFRAQ-007
```

---

# 152. Restore

Backup sem teste de restore não deve ser considerado suficiente.

---

# 153. E2E Release Suite

Fluxos mínimos:

```text
Login

Select Organization

Create Activity

Complete Wizard

Submit

Review

Compliance Gate

Activate

Start Revision

Publish Revision

ROPA

ROPA Export

Dashboard

System Quick Create

Supplier Quick Create
```

conforme workflow final.

---

# 154. Cross-tenant release suite

Criar cenários explícitos:

```text
Organization A
Organization B
```

e tentar:

```text
read

update

delete

associate

export

download

dashboard access
```

entre tenants.

Todos devem falhar adequadamente.

---

# 155. Accessibility

Executar revisão dos principais fluxos:

```text
keyboard

labels

focus

validation

contrast

status not color-only
```

---

# 156. Browser Support

Resolver:

```text
TESTQ-003
```

antes da homologação final.

---

# 157. Production Configuration

Validar:

```text
production secrets

database

storage

TLS

domain

CORS

session cookies

logging

backups

monitoring
```

---

# 158. Definition of Done — Phase 9

```text
[ ] security review concluído

[ ] authorization review concluído

[ ] tenant isolation review concluído

[ ] IDOR tests passam

[ ] mass-assignment tests passam

[ ] upload security validada

[ ] export security validada

[ ] database indexes revisados

[ ] backup configurado

[ ] restore testado

[ ] observability configurada

[ ] production config validada

[ ] E2E release suite passa

[ ] cross-tenant suite passa

[ ] accessibility revisada

[ ] performance validada

[ ] documentação atualizada
```

---

# 159. Ordem de implementação resumida

```text
0. Foundation
       ↓
1. Auth + Organization
       ↓
2. Processing Activity
       ↓
3. Mapping Wizard
       ↓
4. Systems + Suppliers
       ↓
5. Compliance Gate
       ↓
6. Versioning + Audit
       ↓
7. ROPA
       ↓
8. Dashboard
       ↓
9. Hardening
```

---

# 160. Primeiros slices recomendados

Após Foundation:

```text
SLICE-001
Authentication

SLICE-002
Authenticated Context

SLICE-003
Organization

SLICE-004
Business Unit

SLICE-005
Authorization

SLICE-006
Create Processing Activity

SLICE-007
List Processing Activities

SLICE-008
Processing Activity Detail

SLICE-009
Edit Draft

SLICE-010
Personal Data Mapping

SLICE-011
Data Subjects

SLICE-012
Collection Source

SLICE-013
Processing Operations

SLICE-014
Recipients

SLICE-015
International Transfer

SLICE-016
Retention

SLICE-017
Security Measures

SLICE-018
Legal Basis

SLICE-019
Wizard Review

SLICE-020
Submit Activity
```

---

# 161. Regra para geração de tarefas por IA

Não solicitar simplesmente:

```text
"Implemente o projeto."
```

Preferir:

```text
"Implemente SLICE-006 — Create Processing Activity."
```

---

# 162. Contexto da tarefa

Prompt para agente deve indicar:

```text
Feature

Slice

Related docs

Acceptance criteria

Open Questions

Expected tests
```

---

# 163. Exemplo

```text
Implement SLICE-006 — Create Processing Activity.

Read first:
- AGENTS.md
- docs/00-PROJECT.md
- docs/02-DOMAIN.md
- docs/03-DATABASE.md
- docs/04-AUTHORIZATION.md
- docs/05-BUSINESS-RULES.md
- docs/07-API.md
- docs/12-OPEN-QUESTIONS.md
- docs/13-DECISIONS.md
- docs/features/PROCESSING-ACTIVITY.md

Requirements:
- create a ProcessingActivity as DRAFT
- organizationId must come from AuthenticatedContext
- validate BusinessUnit belongs to same tenant
- do not allow client to set status/complianceStatus
- create audit event when applicable
- implement integration tests
- implement cross-tenant test

If a CRITICAL OPEN question blocks implementation,
do not invent the answer.
Report the Decision Required.
```

---

# 164. Regra de commits

Idealmente cada slice deve produzir mudança pequena e revisável.

Exemplo:

```text
feat(processing-activity): create draft activity
```

Evitar commits como:

```text
implement everything
```

---

# 165. Definition of Done por Slice

Todo slice deve verificar:

```text
[ ] specification followed

[ ] no unresolved structural decision invented

[ ] domain rules implemented

[ ] authorization implemented

[ ] tenant isolation implemented

[ ] validation implemented

[ ] API contract respected

[ ] error codes stable

[ ] audit implemented when required

[ ] tests added

[ ] existing tests pass

[ ] typecheck passes

[ ] lint passes

[ ] documentation updated if behavior changed
```

---

# 166. Regra de revisão por IA

Após implementação, solicitar uma revisão separada:

```text
Review this implementation against the project specifications.

Do not refactor first.

Identify:
- business rule violations
- authorization issues
- tenant isolation issues
- missing validation
- API contract violations
- missing audit
- missing tests
- undocumented decisions
```

---

# 167. Prioridade de revisão

Classificar findings como:

```text
CRITICAL

HIGH

MEDIUM

LOW
```

---

# 168. Critical Findings

Considerar crítico especialmente:

```text
cross-tenant data leak

authorization bypass

incorrect Gate behavior

history destruction

secret exposure

unprotected private file

workflow bypass
```

---

# 169. Regra sobre Open Questions

O Implementation Plan não transforma:

```text
Recommendation
```

em:

```text
Decision
```

Sempre consultar:

```text
12-OPEN-QUESTIONS.md
```

e:

```text
13-DECISIONS.md
```

---

# 170. Regra final

O projeto deve evoluir:

```text
Specification
↓
Decision
↓
Small Slice
↓
Implementation
↓
Tests
↓
Review
↓
Next Slice
```

e não:

```text
Prompt gigante
↓
IA implementa aplicação inteira
↓
regras implícitas
↓
difícil revisar
```

O objetivo do plano é permitir desenvolvimento assistido por IA mantendo:

```text
controle arquitetural

rastreabilidade

segurança

consistência de domínio

qualidade de código

capacidade de revisão
```

---

# 171. Próximo documento

O próximo documento recomendado é:

```text
docs/15-BACKLOG.md
```

Ele deve transformar as fases e slices deste plano em backlog executável, contendo:

```text
Epic

Story

Task

Dependencies

Priority

Related Docs

Blocked By

Acceptance Criteria

Tests

Status
```

A partir dele, cada item poderá ser entregue individualmente para um agente de IA implementar.
