# Release Checklist

> **Documento:** Checklist de Release  
> **Status:** Draft  
> **Objetivo:** definir os critérios mínimos técnicos, funcionais, de segurança e operacionais que devem ser verificados antes de uma versão da plataforma ser liberada para produção.


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

Uma versão não está pronta apenas porque:

```text
build passou

tela abriu

feature funciona localmente
```

Release exige verificar:

```text
requirements

decisions

database

security

tenant isolation

authorization

workflows

Compliance Gate

versioning

audit

files

exports

observability

backups

tests

deployment

rollback
```

---

# 2. Regra fundamental

Antes de produção:

```text
Specification
↓
Implementation
↓
Automated Tests
↓
Security Verification
↓
Deployment Verification
↓
Release
↓
Post-deployment Verification
```

---

# 3. Release Gate

Uma versão somente pode seguir para produção quando:

```text
P0 blockers = 0

critical security failures = 0

critical tenant isolation failures = 0

failed required migrations = 0

required E2E failures = 0
```

---

# 4. Release Classification

Sugestão:

```text
PATCH

MINOR

MAJOR
```

---

# 5. PATCH

Exemplos:

```text
bug fix

small UX correction

non-breaking internal improvement
```

---

# 6. MINOR

Exemplos:

```text
new backward-compatible feature

new endpoint

new Dashboard capability

new export option
```

---

# 7. MAJOR

Exemplos:

```text
breaking API changes

major workflow redesign

tenant model change

incompatible domain model change
```

---

# 8. Versioning Strategy

SemVer pode ser utilizado:

```text
MAJOR.MINOR.PATCH
```

se adotado pelo projeto.

---

# 9. Nova Open Question

Adicionar:

```text
RELQ-001
```

**Question:**

```text
O produto utilizará Semantic Versioning para releases?
```

**Priority:**

```text
LOW
```

---

# 10. Pre-release Documentation

Verificar:

```text
[ ] AGENTS.md atualizado

[ ] 13-DECISIONS.md atualizado

[ ] 12-OPEN-QUESTIONS.md atualizado

[ ] documentação da feature atualizada

[ ] API contracts atualizados

[ ] Data Dictionary atualizado

[ ] Validation Rules atualizadas

[ ] catalogs/seeds atualizados quando aplicável
```

---

# 11. Open Questions

Antes de release:

```text
[ ] nenhuma questão CRITICAL necessária para a feature permanece OPEN
```

Questões não relacionadas ao escopo do release podem continuar abertas.

---

# 12. Decisions

Toda decisão estrutural tomada durante implementação deve estar registrada em:

```text
13-DECISIONS.md
```

Não deixar decisão somente em:

```text
commit

PR

chat

comentário de código
```

---

# 13. Scope Verification

Comparar implementação com:

```text
14-IMPLEMENTATION-PLAN.md

15-BACKLOG.md

feature specifications
```

---

# 14. Scope Creep

Verificar:

```text
[ ] nenhuma feature não aprovada entrou silenciosamente

[ ] nenhuma interpretação jurídica foi adicionada por conveniência

[ ] nenhuma infraestrutura desnecessária foi introduzida
```

---

# 15. Build

Obrigatório:

```text
[ ] backend build passa

[ ] frontend build passa

[ ] TypeScript sem erros

[ ] lint passa

[ ] required formatting checks passam
```

---

# 16. Dependencies

Verificar:

```text
[ ] lockfile atualizado

[ ] nenhuma dependência inesperada

[ ] nenhuma dependência sem uso

[ ] vulnerabilidades críticas revisadas

[ ] versões compatíveis
```

---

# 17. Secrets

Obrigatório:

```text
[ ] nenhum secret commitado

[ ] nenhum token no frontend bundle

[ ] nenhum credential em Dockerfile

[ ] nenhum secret em logs

[ ] production secrets configurados externamente
```

---

# 18. Environment Variables

Verificar:

```text
[ ] `.env.example` atualizado

[ ] novas variáveis documentadas

[ ] variáveis obrigatórias validadas no startup

[ ] production values configurados

[ ] secrets não possuem defaults inseguros
```

---

# 19. Environment Isolation

Confirmar:

```text
[ ] TEST isolado

[ ] STAGING isolado quando existir

[ ] PRODUCTION isolado

[ ] databases separados

[ ] object storage separado

[ ] credentials separados
```

---

# 20. Database Migration

Antes do deploy:

```text
[ ] migration criada

[ ] migration revisada

[ ] migration testada em banco vazio

[ ] migration testada sobre schema anterior

[ ] rollback strategy conhecida

[ ] migration não depende de schema push
```

---

# 21. Destructive Migration

Se migration:

```text
drops column

changes type destructively

removes data

renames critical field
```

exige análise explícita.

---

# 22. Expand / Migrate / Contract

Para mudanças incompatíveis, preferir:

```text
Expand
↓
Migrate
↓
Deploy compatible code
↓
Contract
```

---

# 23. Migration Backup

Antes de migration de alto risco:

```text
[ ] backup disponível

[ ] restore procedure conhecida
```

---

# 24. Seed

Verificar:

```text
[ ] reference seed idempotente

[ ] stable codes preservados

[ ] nenhum catálogo histórico apagado

[ ] production seed não cria demo data

[ ] development seed protegido contra produção
```

---

# 25. Catalog Changes

Para qualquer mudança:

```text
[ ] code permanece semanticamente estável

[ ] label change revisada

[ ] inactive entries preservadas

[ ] historical impact analisado
```

---

# 26. Tenant Isolation

É release blocker.

Testar:

```text
Organization A
cannot read
Organization B
```

para todos os recursos tenant-bound.

---

# 27. Tenant Resources

Incluir pelo menos:

```text
BusinessUnit

Membership

ProcessingActivity

System

Supplier

ComplianceCheck

ActivityVersion

AuditLog

File

Notification
```

quando implementados.

---

# 28. Cross-Tenant References

Verificar:

```text
[ ] Activity A cannot reference Supplier B

[ ] Activity A cannot reference System B

[ ] Activity A cannot reference BusinessUnit B

[ ] foreign resource IDs do not leak existence
```

---

# 29. organizationId

Verificar:

```text
[ ] não confiado a request body

[ ] derivado do AuthenticatedContext

[ ] queries tenant-aware

[ ] jobs tenant-aware
```

---

# 30. Authorization

Para cada endpoint novo:

```text
[ ] authentication required when applicable

[ ] permission checked

[ ] scope checked

[ ] tenant checked

[ ] ownership/BU scope checked when applicable
```

---

# 31. IDOR

Testar acesso direto por ID.

Exemplo:

```text
User without access
↓
GET known resource UUID
↓
no data leak
```

---

# 32. Role Tests

Quando roles estiverem definidas:

```text
[ ] Collaborator

[ ] Manager

[ ] DPO

[ ] Admin if adopted
```

---

# 33. Multi-org

Se adotado:

```text
[ ] Organization switch tested

[ ] cache invalidation tested

[ ] permissions recalculated

[ ] no old tenant data flashes

[ ] Notifications isolated
```

---

# 34. Authentication

Verificar:

```text
[ ] login

[ ] logout

[ ] invalid session

[ ] expired session

[ ] disabled user

[ ] disabled membership

[ ] unauthorized Organization
```

---

# 35. Session Security

Conforme DEC-067/068/069, verificar:

```text
[ ] expiresAt fixo em createdAt + 12 horas
[ ] idle timeout de 30 minutos
[ ] lastActivityAt inicializado com createdAt
[ ] atividade somente por request autenticada válida
[ ] throttling de persistência de cinco minutos
[ ] nenhuma escrita periódica sem requests
[ ] sem sliding expiration ou refresh local
[ ] logout revoga antes de remover o cookie
[ ] logout responde 204
[ ] expiração absoluta e idle usam o mesmo 401 da DEC-061
```

Fornecedor OIDC e MFA permanecem em SECQ-001 e SECQ-003.

---

# 36. Processing Activity

Fluxo mínimo:

```text
[ ] create Draft

[ ] update Draft

[ ] resume mapping

[ ] complete Wizard

[ ] Submit

[ ] review when applicable

[ ] Compliance Gate

[ ] ACTIVE transition when applicable

[ ] revision

[ ] archive
```

Somente testar transições adotadas no workflow final.

---

# 37. Draft

Confirmar:

```text
[ ] Draft incompleto pode ser salvo

[ ] requisitos futuros não bloqueiam Draft

[ ] dados válidos não são perdidos
```

---

# 38. Wizard

Verificar:

```text
[ ] forward navigation

[ ] backward navigation

[ ] conditional fields

[ ] validation by step

[ ] save

[ ] resume

[ ] Quick Create

[ ] review summary

[ ] Submit validation
```

---

# 39. Conditional Data

Testar comportamento definido para:

```text
MWQ-001
```

---

# 40. Personal Data

Verificar:

```text
[ ] catalog selection

[ ] duplicate prevention

[ ] sensitive metadata

[ ] no real subject records stored
```

---

# 41. Minors

Verificar:

```text
[ ] minor classification derived structurally

[ ] no automatic legal conclusion

[ ] Compliance behavior matches decisions
```

---

# 42. International Transfer

Verificar:

```text
[ ] transfer explicitly recorded

[ ] country validated

[ ] mechanism requirements applied

[ ] foreign Supplier does not automatically create transfer
```

---

# 43. Retention

Verificar:

```text
[ ] structure validated

[ ] Gate checks presence

[ ] system does not invent legal retention duration
```

---

# 44. Security Measures

Verificar:

```text
[ ] metadata can be recorded

[ ] Gate validates required structure

[ ] UI does not claim security certification
```

---

# 45. Legal Basis

Verificar:

```text
[ ] catalog used

[ ] cardinality matches decision

[ ] association matches decision

[ ] Gate checks presence

[ ] no default Legal Basis
```

---

# 46. Consent

Quando aplicável:

```text
[ ] document private

[ ] version captured

[ ] effective date handled

[ ] method handled

[ ] no individual acceptance records in V1
```

---

# 47. System

Verificar:

```text
[ ] create

[ ] Quick Create

[ ] PENDING

[ ] MAPPED

[ ] deactivate

[ ] historical references preserved

[ ] tenant isolation
```

---

# 48. Supplier

Verificar:

```text
[ ] create

[ ] Quick Create

[ ] PENDING

[ ] MAPPED

[ ] deactivate

[ ] historical references preserved

[ ] tenant isolation
```

---

# 49. Pending Resource Rules

Confirmar comportamento decidido para:

```text
SYSQ-007

SUPQ-006
```

---

# 50. Compliance Gate

Release blocker para fluxo principal.

Verificar todos os checks:

```text
LEGAL_BASIS

RETENTION

SECURITY_MEASURES

INTERNATIONAL_TRANSFER

SENSITIVE_DATA

MINOR_DATA
```

---

# 51. Compliance Statuses

Testar:

```text
PASS

FAIL

REVIEW_REQUIRED

NOT_APPLICABLE
```

---

# 52. Aggregate Compliance

Testar:

```text
PENDING

COMPLETE

BLOCKED
```

segundo regras decididas.

---

# 53. Legal Semantics

Verificar UI/API/export.

Não deve existir conclusão indevida como:

```text
LGPD compliant

legally approved

100% compliant
```

---

# 54. Compliance Reason Codes

Verificar:

```text
[ ] stable

[ ] documented

[ ] frontend mapping exists

[ ] unknown reason code does not break UI
```

---

# 55. Compliance Re-run

Se implementado:

```text
[ ] idempotent behavior understood

[ ] stale checks handled

[ ] audit behavior correct
```

---

# 56. Human Review

Se implementado:

```text
[ ] authorized reviewer

[ ] justification when required

[ ] tenant isolation

[ ] audit event

[ ] workflow transition
```

---

# 57. Versioning

Release blocker quando Activities publicadas puderem ser alteradas.

Verificar:

```text
[ ] relevant change creates/preserves history

[ ] historical version immutable

[ ] version numbering correct

[ ] published state preserved

[ ] revision behavior correct
```

---

# 58. Snapshot

Verificar histórico de:

```text
Activity

Purpose

Personal Data

Subjects

Sources

Operations

Systems

Suppliers

Recipients

Transfers

Retention

Security Measures

Legal Bases
```

conforme estratégia adotada.

---

# 59. Historical Names

Testar:

```text
System renamed
↓
historical version remains semantically correct
```

e equivalente para:

```text
Supplier

BusinessUnit

catalog labels
```

quando snapshot exigir.

---

# 60. AuditLog

Verificar:

```text
[ ] append-only

[ ] tenant-bound

[ ] actor recorded

[ ] stable event code

[ ] resource recorded

[ ] timestamp recorded

[ ] minimal metadata
```

---

# 61. Audit Events

Fluxos críticos devem produzir AuditLog conforme:

```text
10-AUDIT.md
```

---

# 62. Audit Security

Verificar que metadata não contém desnecessariamente:

```text
secrets

file contents

request bodies

sensitive descriptions
```

---

# 63. ROPA

Verificar:

```text
[ ] read-only

[ ] derived from correct source/version

[ ] tenant scope

[ ] BU scope

[ ] filters

[ ] sensitive flag

[ ] minor flag

[ ] international transfer

[ ] compliance status
```

---

# 64. ROPA Version Consistency

Não permitir:

```text
Activity name from version 3
+
Legal Basis from version 4
+
Retention from current Draft
```

na mesma projeção histórica/publicada.

---

# 65. ROPA Export

Verificar:

```text
[ ] authorization

[ ] scope

[ ] filters

[ ] consistent snapshot

[ ] private file

[ ] expiration/retention when applicable

[ ] AuditLog if required
```

---

# 66. Dashboard

Verificar:

```text
[ ] formulas match decisions

[ ] authorized scope

[ ] sensitive activities

[ ] minor activities

[ ] international transfers

[ ] pending Systems

[ ] pending Suppliers

[ ] old pendencies
```

---

# 67. Dashboard Consistency

Dashboard e ROPA não devem possuir fórmulas contraditórias para o mesmo conceito.

---

# 68. Dashboard Legal Semantics

Não apresentar:

```text
Compliance Score
```

ou:

```text
Legal Risk Score
```

sem requisito/decisão específica.

---

# 69. Notifications

Se incluídas:

```text
[ ] correct recipient

[ ] tenant isolation

[ ] read/unread

[ ] deduplication

[ ] stale resource behavior

[ ] permission re-check on resource open
```

---

# 70. Notification Email

Se email existir:

```text
[ ] delivery outside critical transaction

[ ] minimal sensitive content

[ ] authenticated application link

[ ] retry behavior

[ ] failure observable
```

---

# 71. Files

Verificar:

```text
[ ] private storage

[ ] tenant ownership

[ ] authorization before download

[ ] allowed file types

[ ] size limit

[ ] generated storage keys

[ ] original filename safely handled
```

---

# 72. File Security

Quando adotado:

```text
[ ] malware scanning

[ ] rejected file behavior

[ ] temporary upload cleanup
```

---

# 73. Object Storage

Verificar:

```text
[ ] production bucket/container correct

[ ] public access disabled

[ ] credentials scoped

[ ] lifecycle configured when applicable
```

---

# 74. Export Files

Verificar:

```text
[ ] not publicly accessible

[ ] tenant-bound

[ ] authorization checked

[ ] cleanup policy applied
```

---

# 75. API

Verificar:

```text
[ ] `/api/v1`

[ ] documented endpoints

[ ] correct status codes

[ ] stable error codes

[ ] pagination

[ ] filters

[ ] validation

[ ] semantic workflow actions
```

---

# 76. API Breaking Changes

Verificar:

```text
[ ] no accidental contract break

[ ] frontend updated

[ ] OpenAPI updated when adopted

[ ] integrations considered
```

---

# 77. Error Handling

Verificar:

```text
[ ] no stack traces exposed

[ ] no SQL errors exposed

[ ] requestId available

[ ] cross-tenant existence concealed

[ ] frontend handles known codes
```

---

# 78. Concurrency

Quando estratégia estiver implementada:

```text
[ ] concurrent update detected

[ ] no silent overwrite

[ ] frontend recovery exists
```

---

# 79. Idempotency

Para operações que exigem:

```text
[ ] retries do not duplicate effects

[ ] exports do not duplicate unexpectedly

[ ] notification jobs do not duplicate

[ ] semantic actions behave as specified
```

---

# 80. Frontend

Verificar:

```text
[ ] routes

[ ] guards

[ ] loading states

[ ] empty states

[ ] error states

[ ] success feedback

[ ] validation

[ ] tenant switching

[ ] permissions

[ ] responsive behavior
```

---

# 81. Frontend Security

Verificar:

```text
[ ] no sensitive data in localStorage

[ ] no secrets in bundle

[ ] no hidden unauthorized data

[ ] no unsafe HTML rendering

[ ] no debug information in production
```

---

# 82. Accessibility

Verificar:

```text
[ ] labels

[ ] keyboard navigation

[ ] focus

[ ] error association

[ ] status not color-only

[ ] accessible dialogs

[ ] accessible tables
```

---

# 83. Browser Verification

Conforme:

```text
TESTQ-003
```

Testar browsers oficialmente suportados.

---

# 84. Unit Tests

```text
[ ] domain rules

[ ] validation

[ ] Compliance checks

[ ] authorization policies

[ ] mapping functions
```

---

# 85. Integration Tests

```text
[ ] repositories

[ ] database constraints

[ ] transactions

[ ] tenant isolation

[ ] AuditLog

[ ] versioning
```

---

# 86. API Tests

```text
[ ] happy paths

[ ] validation

[ ] authorization

[ ] cross-tenant

[ ] workflow conflicts

[ ] error contracts
```

---

# 87. Component Tests

```text
[ ] forms

[ ] validation

[ ] conditional fields

[ ] status rendering

[ ] error states
```

---

# 88. E2E

Fluxos críticos devem possuir E2E.

---

# 89. E2E Candidate — Main Flow

```text
login
↓
create Activity
↓
complete Wizard
↓
Submit
↓
review
↓
Compliance Gate
↓
ACTIVE
↓
ROPA
```

adaptado ao workflow final.

---

# 90. E2E Candidate — Sensitive Data

```text
create Activity
↓
select sensitive category
↓
complete mapping
↓
run Gate
↓
verify expected review behavior
```

---

# 91. E2E Candidate — International Transfer

```text
create Activity
↓
declare transfer
↓
enter destination
↓
complete required metadata
↓
run Gate
```

---

# 92. E2E Candidate — Quick Create

```text
Wizard
↓
Quick Create System
↓
System PENDING
↓
selected in Activity
↓
Dashboard reflects pending resource
```

conforme decisões de Dashboard.

---

# 93. E2E Candidate — Tenant Isolation

```text
Organization A creates Activity
↓
Organization B attempts direct access
↓
access denied/unavailable
```

---

# 94. Security Tests

Release blocker:

```text
[ ] IDOR

[ ] cross-tenant

[ ] mass assignment

[ ] unauthorized workflow action

[ ] unauthorized file access

[ ] invalid upload

[ ] rate limit where required
```

---

# 95. Dependency Security

Verificar vulnerabilidades conhecidas conforme pipeline adotado.

Não bloquear automaticamente por qualquer finding sem análise de severidade/exposição, exceto política definida.

---

# 96. Static Analysis

Quando disponível:

```text
[ ] lint

[ ] TypeScript

[ ] dependency scan

[ ] secret scan
```

---

# 97. Performance

Verificar fluxos principais.

Exemplos:

```text
Activity list

ROPA

Dashboard

catalogs

Wizard loading
```

---

# 98. N+1

Verificar especialmente:

```text
ROPA

Dashboard

Activity details

versions
```

---

# 99. Database Queries

Revisar:

```text
[ ] indexes

[ ] pagination

[ ] large joins

[ ] tenant filters

[ ] query plans for critical queries when necessary
```

---

# 100. Large Exports

Se export puder crescer:

```text
sync vs async
```

deve seguir:

```text
APIQ-006
```

---

# 101. Observability

Verificar:

```text
[ ] structured logs

[ ] requestId

[ ] error tracking

[ ] metrics

[ ] health checks

[ ] alerting where configured
```

---

# 102. Sensitive Logs

Confirmar ausência de:

```text
passwords

tokens

authorization headers

file contents

full request bodies

sensitive Activity content
```

---

# 103. Health Checks

Verificar:

```text
liveness

readiness
```

conforme:

```text
OBSQ-001
```

---

# 104. Deployment Metrics

Durante release observar:

```text
error rate

HTTP 5xx

latency

database errors

migration failures

job failures
```

---

# 105. Backup

Antes de produção:

```text
[ ] backup configured

[ ] schedule configured

[ ] retention configured

[ ] access restricted
```

---

# 106. Restore

Backup sem restore testado não é suficiente.

Verificar:

```text
[ ] restore procedure documented

[ ] restore tested according to operational policy
```

---

# 107. RPO / RTO

Devem acompanhar decisões:

```text
INFRAQ-009
INFRAQ-010
```

---

# 108. CI

Pipeline deve executar, conforme escopo:

```text
install
↓
lint
↓
typecheck
↓
unit tests
↓
integration tests
↓
build
↓
security checks
↓
artifact
```

---

# 109. Artifact

Artifact implantado deve ser o mesmo validado pelo pipeline.

Evitar:

```text
rebuild manually on production
```

---

# 110. Docker

Quando utilizado:

```text
[ ] image builds

[ ] production image starts

[ ] non-required development tools excluded

[ ] secrets not embedded

[ ] health behavior correct
```

---

# 111. Staging

Se STAGING existir:

```text
[ ] release deployed

[ ] migration tested

[ ] smoke tests pass

[ ] critical E2E passes
```

---

# 112. Production Deployment

Checklist:

```text
[ ] release approved

[ ] artifact identified

[ ] migration ready

[ ] backup status known

[ ] rollback known

[ ] environment configured

[ ] observability available
```

---

# 113. Deployment Strategy

Depende de:

```text
INFRAQ-011
```

Não exigir zero downtime sem decisão.

---

# 114. Rollback

Antes do deploy saber:

```text
How do we return to previous application version?
```

---

# 115. Database Rollback

Nem toda migration deve ser revertida automaticamente.

Algumas exigem:

```text
forward fix
```

---

# 116. Rollback Compatibility

Aplicação anterior deve ser considerada em migrations expand/contract.

---

# 117. Failed Deployment

Se aplicação nova falhar após migration:

```text
do not blindly reverse migration
```

Executar plano compatível com tipo de mudança.

---

# 118. Smoke Tests

Após deploy:

```text
[ ] application responds

[ ] authentication works

[ ] `/me` works

[ ] database accessible

[ ] tenant context works

[ ] Activity list loads

[ ] critical read endpoint works
```

---

# 119. Production Write Smoke

Se política permitir, testar ação controlada sem contaminar dados reais.

Preferir health/synthetic strategy aprovada.

---

# 120. Post-deployment

Observar período inicial para:

```text
error spikes

latency

database load

authentication failures

storage failures

job failures
```

---

# 121. Migration Verification

Confirmar:

```text
[ ] expected migration applied

[ ] schema version correct

[ ] seed correct
```

---

# 122. Cache

Se cache existir:

```text
[ ] invalidation behavior correct

[ ] old tenant data not served

[ ] new catalog values visible
```

---

# 123. Jobs

Se jobs existirem:

```text
[ ] scheduler running once as intended

[ ] tenant context correct

[ ] retries configured

[ ] no duplicate mass processing
```

---

# 124. Feature Flags

Não são requisito inicial.

Se introduzidas:

```text
[ ] default state documented

[ ] tenant behavior documented

[ ] cleanup plan exists
```

---

# 125. Nova Open Question

Adicionar:

```text
RELQ-002
```

**Question:**

```text
A V1 utilizará feature flags para releases graduais?
```

**Priority:**

```text
LOW
```

---

# 126. Rollout

Possíveis estratégias futuras:

```text
all-at-once

internal first

selected tenants

percentage rollout
```

Não implementar infraestrutura de rollout sem necessidade.

---

# 127. Database Compatibility Window

Em zero-downtime/multiple-instance deployments, schema precisa suportar versões coexistentes temporariamente.

Depende de infraestrutura escolhida.

---

# 128. Release Notes

Cada release deve possuir resumo.

Exemplo:

```text
Version

Date

Features

Fixes

Migrations

Operational Notes

Known Issues
```

---

# 129. Known Issues

Problemas conhecidos não críticos devem ser documentados.

---

# 130. Security Fixes

Não publicar detalhes exploráveis antes da correção estar implantada quando isso aumentar risco.

---

# 131. Rollback Trigger

Definir sinais operacionais que justificam rollback.

Exemplos:

```text
critical authentication failure

tenant isolation regression

persistent high 5xx

data corruption

migration incompatibility
```

---

# 132. Immediate Stop Conditions

Interromper rollout diante de:

```text
cross-tenant exposure

unauthorized file exposure

data corruption

authentication bypass

critical workflow corruption
```

---

# 133. Tenant Isolation Incident

Se houver evidência de vazamento cross-tenant:

```text
stop release
↓
contain
↓
investigate
↓
fix
↓
verify
```

Não tratar como bug visual comum.

---

# 134. Production Data

Nunca usar produção para experimentar migration destrutiva não testada.

---

# 135. Manual Database Changes

Evitar:

```text
manual ALTER TABLE
```

fora do processo de migration, salvo incidente operacional controlado.

Qualquer alteração emergencial deve ser reconciliada com migrations posteriormente.

---

# 136. Manual Catalog Changes

Evitar editar catálogo global diretamente no banco.

Utilizar migration/seed versionado.

---

# 137. Manual Status Changes

Não alterar:

```text
ProcessingActivity.status

ComplianceStatus
```

diretamente no banco como procedimento normal.

Usar workflow da aplicação.

---

# 138. Release Evidence

CI/CD deve manter evidência suficiente:

```text
commit

artifact version

test result

migration version

deployment time
```

---

# 139. Deployment Audit

Não confundir logs de deployment com:

```text
application AuditLog
```

---

# 140. Production Access

Acesso administrativo à infraestrutura deve seguir menor privilégio.

---

# 141. Production Debugging

Não habilitar debug detalhado globalmente apenas para investigar erro.

---

# 142. Data Repair

Se bug exigir correção de dados:

```text
script versioned

tenant-aware

dry-run when possible

backup

audit/operational record

post-validation
```

---

# 143. Data Repair Script

Nunca assumir:

```text
all organizations
```

sem filtro explícito.

---

# 144. Release Owner

Deve existir responsabilidade por aprovar execução do release.

Não necessariamente novo papel do produto.

---

# 145. Nova Open Question

Adicionar:

```text
RELQ-003
```

**Question:**

```text
Quem possui autoridade operacional para aprovar release em produção?
```

**Priority:**

```text
MEDIUM
```

---

# 146. Emergency Release

Hotfix pode reduzir algumas etapas não críticas.

Nunca ignorar:

```text
tenant isolation

security

migration safety

required tests
```

---

# 147. Hotfix

Fluxo mínimo:

```text
identify incident
↓
smallest safe fix
↓
targeted tests
↓
security/tenant regression
↓
build
↓
deploy
↓
verify
↓
merge/document
```

---

# 148. Release Checklist — Compact

```text
DOCUMENTATION

[ ] Decisions updated
[ ] Open Questions checked
[ ] Feature docs updated

CODE

[ ] Build
[ ] Lint
[ ] Typecheck
[ ] Tests

DATABASE

[ ] Migration reviewed
[ ] Migration tested
[ ] Seed tested
[ ] Backup considered

SECURITY

[ ] Tenant isolation
[ ] Authorization
[ ] IDOR
[ ] Secrets
[ ] Files

DOMAIN

[ ] Workflow
[ ] Compliance Gate
[ ] Versioning
[ ] Audit

READ MODELS

[ ] ROPA
[ ] Dashboard

FRONTEND

[ ] Loading
[ ] Errors
[ ] Validation
[ ] Accessibility

OPERATIONS

[ ] Logs
[ ] Metrics
[ ] Health
[ ] Backup
[ ] Rollback

DEPLOYMENT

[ ] Artifact
[ ] Environment
[ ] Migration
[ ] Smoke test
[ ] Post-deploy monitoring
```

---

# 149. P0 Release Blockers

Release não pode seguir com:

```text
cross-tenant data exposure

authentication bypass

authorization bypass

known critical data corruption

failed critical migration

broken Activity main flow

broken mandatory Compliance Gate

broken historical integrity when required

public private-file exposure

required E2E failing
```

---

# 150. P1 Findings

Normalmente devem ser corrigidos antes do release, salvo aceitação explícita.

Exemplos:

```text
major workflow bug

incorrect Dashboard calculation

incorrect ROPA projection

AuditLog missing critical event

important accessibility blocker

serious performance regression
```

---

# 151. P2/P3 Findings

Podem ser planejados posteriormente conforme impacto.

Não devem ser escondidos.

Registrar em backlog.

---

# 152. Open Questions adicionadas

Adicionar a:

```text
docs/12-OPEN-QUESTIONS.md
```

```text
RELQ-001
O produto utilizará Semantic Versioning para releases?
Priority: LOW

RELQ-002
A V1 utilizará feature flags para releases graduais?
Priority: LOW

RELQ-003
Quem possui autoridade operacional para aprovar release em produção?
Priority: MEDIUM
```

---

# 153. Questões existentes especialmente relevantes

```text
SECQ-001
SECQ-002
SECQ-003
SECQ-004 (DECIDED — DEC-067, DEC-068 e DEC-069)
SECQ-005
DBQ-009

DBQ-001
DBQ-002
DBQ-003
DBQ-004
DBQ-008

APIQ-004
APIQ-005
APIQ-006
APIQ-007

WFQ-001
WFQ-004
WFQ-005
WFQ-007
WFQ-008

CGQ-001
CGQ-003
CGQ-004
CGQ-005
CGQ-007

AUDQ-001
AUDQ-010
AUDQ-012
AUDQ-013

TESTQ-001
TESTQ-002
TESTQ-003
TESTQ-005
TESTQ-006
TESTQ-007

INFRAQ-001
INFRAQ-005
INFRAQ-006
INFRAQ-007
INFRAQ-009
INFRAQ-010
INFRAQ-011

OBSQ-001
OBSQ-002
OBSQ-004
OBSQ-007
OBSQ-008
```

---

# 154. AI Release Review

Quando agente de IA for solicitado a revisar release:

```text
1. Read AGENTS.md
2. Read 13-DECISIONS.md
3. Read 12-OPEN-QUESTIONS.md
4. Identify release scope
5. Identify changed modules
6. Review applicable feature docs
7. Review migrations
8. Review authorization
9. Review tenant isolation
10. Review tests
11. Review deployment impact
12. Report blockers separately
```

---

# 155. AI Review Output

Formato recomendado:

```text
Release Status

P0 Blockers

P1 Findings

P2 Findings

Open Decisions

Migration Risks

Security Risks

Missing Tests

Deployment Notes
```

---

# 156. AI não aprova decisão humana

Agente pode informar:

```text
checklist satisfied

automated checks passing

known blockers
```

Mas aprovação organizacional do release pertence ao processo humano definido pelo projeto.

---

# 157. AI Prohibited Release Behavior

Não:

```text
ignore failing tests

silently resolve CRITICAL Open Question

create production credentials

disable tenant checks to fix test

skip migration because local DB works

change catalog stable codes casually

remove historical data to simplify migration

mark release ready despite known P0

hide security findings
```

---

# 158. Release Definition of Ready

Release está pronto para validação final quando:

```text
[ ] implementation complete

[ ] documentation updated

[ ] migrations ready

[ ] automated tests passing

[ ] security tests passing

[ ] critical E2E passing

[ ] deployment artifact created

[ ] rollback understood
```

---

# 159. Release Definition of Done

Release está concluído quando:

```text
[ ] production deployment completed

[ ] migrations successfully applied

[ ] application healthy

[ ] smoke tests passed

[ ] authentication verified

[ ] tenant isolation sanity check passed

[ ] critical flows operational

[ ] observability shows no critical regression

[ ] release version recorded

[ ] release notes recorded

[ ] known issues documented
```

---

# 160. Regra final

Release não significa:

```text
"terminamos de programar"
```

Release significa:

```text
the intended functionality
+
the intended security boundaries
+
the intended data model
+
the intended workflow
+
the intended operational safeguards
```

foram verificados em conjunto.

Para esta plataforma, qualquer falha em:

```text
tenant isolation

authorization

historical integrity

Compliance Gate integrity

private file protection
```

deve ser tratada como risco de release e não apenas como defeito isolado.

---

# 161. Próximo documento

O próximo documento é:

```text
docs/27-AI-DEVELOPMENT-GUIDE.md
```

Ele será o último documento estrutural planejado desta sequência.

Deve consolidar como utilizar agentes de IA no projeto:

```text
required reading order

how to receive a task

how to inspect existing code

how to handle Open Questions

how to use Decisions

how to plan changes

how to implement incrementally

how to modify database safely

how to create APIs

how to implement frontend

how to write tests

how to review its own changes

how to report blockers

how to avoid hallucinated requirements

how to avoid architectural drift

how to finish a task

prompt templates
```

Depois dele, o próximo passo recomendado será:

```text
resolver as Open Questions críticas
↓
registrar as respostas em 13-DECISIONS.md
↓
atualizar documentos afetados
↓
iniciar implementação
```
