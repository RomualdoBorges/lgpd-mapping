# AI Development Guide

> **Documento:** Guia de Desenvolvimento Assistido por IA  
> **Status:** Draft  
> **Objetivo:** definir como agentes de IA devem analisar, planejar, implementar, testar e revisar alterações neste projeto sem inventar requisitos, resolver decisões de produto silenciosamente ou causar desvio arquitetural.


## Persistência e defesa tenant-aware aprovadas — 2026-09-18

DEC-044 (DBQ-001): Drizzle é o ORM/query builder aprovado. Queries ficam em repository/persistence; SQL específico é parametrizado, localizado e versionado. Migrations são revisáveis e reproduzíveis desde banco vazio. Não reduzir garantias PostgreSQL para acomodar o ORM.

DEC-045 (DBQ-008): validar relações/autorização na aplicação e garantir coerência tenant-bound por constraints PostgreSQL. Quando necessário, filhos e associações carregam organization_id NOT NULL, unicidades/FKs compostas e índices adequados; usar checks declarativos quando aplicáveis. FK somente por UUID não prova mesmo tenant. organization_id vem do contexto autorizado e não é campo livre para transferência. Preferir constraint declarativa simples a trigger equivalente.

DEC-046 (DBQ-009): RLS adicional nas tabelas tenant-bound, com contexto local à transação, todas as queries da operação no mesmo contexto, ausência de contexto negando acesso e nenhum tenant persistente na conexão. Considerar pooling. Runtime sem superuser/BYPASSRLS/propriedade das tabelas protegidas/alteração de policies; FORCE ROW LEVEL SECURITY quando adequado. Credencial de migration separada do runtime.

Defesa aprovada: Authentication → Membership → Permission → Scope → Repository tenant-aware → PostgreSQL constraints → PostgreSQL RLS. Nenhuma camada substitui outra. Scope de Business Unit continua na autorização da aplicação.

User, ExternalIdentity, Session e outras entidades globais não recebem organization_id artificial; sua proteção específica será definida posteriormente. Descoberta dos próprios Memberships exige caminho restrito, sem policy irrestrita. Estes detalhes não estão implementados nem decididos por exemplos deste documento.

Referências legadas a Prisma/Drizzle ou a RLS como alternativas pendentes são históricas: estas três questões estão decididas em DEC-044 a DEC-046. Políticas funcionais, autenticação e features posteriores continuam sujeitas às questões específicas. A topologia física de produção não é escolhida por este registro.

---

---

# 1. Objetivo

Este projeto foi estruturado para permitir desenvolvimento assistido por IA.

A IA pode auxiliar em:

```text
análise

planejamento

implementação

refatoração

testes

revisão

documentação

debugging

migrations

frontend

backend
```

Mas deve trabalhar dentro das decisões e especificações existentes.

---

# 2. Princípio fundamental

A IA não é a fonte dos requisitos.

A ordem é:

```text
Requirements
↓
Decisions
↓
Business Rules
↓
Architecture
↓
Implementation
```

Nunca:

```text
AI assumption
↓
implementation
↓
requirement invented afterward
```

---

# 3. Fonte de verdade

Antes de implementar qualquer funcionalidade, o agente deve consultar a documentação relevante.

Ordem principal:

```text
AGENTS.md

13-DECISIONS.md

12-OPEN-QUESTIONS.md

feature specification

05-BUSINESS-RULES.md

06-WORKFLOWS.md

02-DOMAIN.md

04-AUTHORIZATION.md

07-API.md

20-API-CONTRACTS.md

21-DATA-DICTIONARY.md

22-VALIDATION-RULES.md

03-DATABASE.md

08-FRONTEND.md

09-SECURITY.md

10-AUDIT.md

11-TESTING.md
```

Nem todos precisam ser relidos integralmente para toda tarefa.

O agente deve selecionar os documentos relacionados à mudança.

---

# 4. Precedência

Em caso de conflito, utilizar:

```text
13-DECISIONS.md
↓
05-BUSINESS-RULES.md
↓
06-WORKFLOWS.md
↓
02-DOMAIN.md
↓
04-AUTHORIZATION.md
↓
feature specification
↓
API / Database / Frontend specifications
↓
existing implementation
```

Se conflito relevante permanecer:

```text
STOP
```

e informar o conflito.

---

# 5. Open Questions

Antes de implementar uma regra estrutural, verificar:

```text
12-OPEN-QUESTIONS.md
```

---

# 6. OPEN não significa "escolha a melhor opção"

Se uma questão está:

```text
OPEN
```

o agente não deve transformá-la silenciosamente em decisão.

---

# 7. Exemplo

Existe:

```text
WFQ-004
```

perguntando se Activity se torna ACTIVE automaticamente após Gate ou exige aprovação humana.

Agente não pode simplesmente implementar:

```text
if compliance === COMPLETE:
    activity.status = ACTIVE
```

sem decisão.

---

# 8. Decision Required

Quando uma tarefa depende de questão crítica aberta:

```text
Decision Required
```

Formato recomendado:

```text
Decision Required: WFQ-004

A implementação desta transição depende da definição
sobre ativação automática ou aprovação humana.

Opções já identificadas:
A. ...
B. ...

Nenhuma decisão foi encontrada em 13-DECISIONS.md.
```

---

# 9. Não decidir silenciosamente

É proibido:

```text
choose one option because it is easier

choose common industry behavior

choose what framework usually does

choose what AI considers best
```

se a decisão altera produto/domínio.

---

# 10. Recomendações

Agente pode apresentar recomendação quando solicitado.

Deve separar:

```text
Current Decision

Open Question

Recommendation
```

---

# 11. Recommendation ≠ Decision

Uma recomendação somente vira decisão quando registrada em:

```text
13-DECISIONS.md
```

após aprovação.

---

# 12. Task Intake

Antes de alterar código, responder internamente:

```text
What is being requested?

Which module owns it?

Which use case is affected?

Which domain entities are affected?

Which decisions apply?

Which Open Questions apply?

Which permissions apply?

Which tenant boundary applies?

Which tests are required?
```

---

# 13. Classificar tarefa

Classificar como:

```text
BUG

FEATURE

REFACTOR

DATABASE

SECURITY

TEST

DOCUMENTATION

INFRASTRUCTURE
```

Pode possuir mais de uma categoria.

---

# 14. Scope

Definir claramente:

```text
in scope

out of scope
```

antes de grandes alterações.

---

# 15. Inspecionar antes de editar

Nunca assumir estrutura do código.

Primeiro:

```text
inspect repository
↓
find module
↓
find existing patterns
↓
find related tests
↓
understand dependencies
↓
plan modification
```

---

# 16. Search Before Create

Antes de criar:

```text
service

repository

DTO

hook

component

validator

utility

enum

type
```

buscar implementação existente equivalente.

---

# 17. Evitar duplicação

Não criar:

```text
ActivityStatus2

ActivityHelperNew

NewComplianceService

SystemServiceV2
```

apenas porque não encontrou rapidamente a implementação correta.

---

# 18. Existing Code

Código existente não possui precedência sobre decisão documentada.

Se código contradiz documentação:

```text
report discrepancy
```

antes de ampliar comportamento incorreto.

---

# 19. Smallest Safe Change

Preferir:

```text
small

focused

testable

reviewable
```

---

# 20. Não reescrever módulo inteiro

Se tarefa exige corrigir:

```text
one authorization bug
```

não reestruturar toda arquitetura do módulo sem necessidade.

---

# 21. Incremental Implementation

Fluxo recomendado:

```text
understand
↓
plan
↓
domain
↓
application
↓
infrastructure
↓
API
↓
frontend
↓
tests
↓
review
```

A ordem concreta pode variar por tarefa.

---

# 22. Vertical Slice

Quando possível implementar feature como slice funcional.

Exemplo:

```text
Create System

Domain
↓
Use Case
↓
Repository
↓
Endpoint
↓
Frontend
↓
Tests
```

---

# 23. Architecture

Aplicar:

```text
DEC-001
```

Arquitetura:

```text
Modular Monolith
```

---

# 24. Não criar microservice

Não separar módulo em serviço distribuído sem decisão arquitetural.

---

# 25. Module Ownership

Cada conceito deve possuir módulo responsável.

Exemplos:

```text
Processing Activity

Compliance

Systems

Suppliers

Organizations

Authorization

ROPA

Dashboard
```

---

# 26. Dependency Direction

Preferir:

```text
Presentation
↓
Application
↓
Domain
```

Infrastructure implementa interfaces necessárias.

---

# 27. Domain

Domain não deve depender de:

```text
React

HTTP

NestJS controller

Prisma-specific DTO

browser APIs
```

---

# 28. Controller

Controller deve ser fino.

Responsabilidades:

```text
receive request

extract validated input

invoke use case

map response
```

---

# 29. Controller não implementa regra

Evitar:

```ts
if (activity.status === "DRAFT" && activity.legalBases.length > 0) {
  // complex workflow...
}
```

dentro de controller.

---

# 30. Application Use Case

Representar intenção.

Exemplos:

```text
CreateProcessingActivity

UpdateProcessingActivity

SubmitProcessingActivity

RunComplianceGate

StartActivityRevision

CreateSystem

CompleteSystemMapping
```

---

# 31. Semantic Actions

Aplicar:

```text
DEC-030
```

Não permitir workflow por:

```http
PATCH /activities/{id}
{
  "status": "ACTIVE"
}
```

---

# 32. Repository

Repository deve respeitar tenant boundary.

Preferir contratos semanticamente seguros.

Exemplo:

```text
findByIdAndOrganizationId
```

ou abstração equivalente.

---

# 33. Tenant Context

Aplicar:

```text
DEC-018
```

Nunca confiar em:

```text
request.body.organizationId
```

para determinar tenant.

---

# 34. Cross-Tenant

Aplicar:

```text
DEC-019
```

Toda relação entre recursos tenant-bound deve validar Organization.

---

# 35. Tenant Checklist

Ao implementar recurso:

```text
Where does organizationId come from?

How is it filtered?

Can another tenant guess this ID?

Can this resource reference another tenant?

Does this query always scope tenant?

Does background processing preserve tenant?
```

---

# 36. Authorization

Backend é autoridade.

Frontend guards são UX.

---

# 37. Permission Check

Antes de mutation:

```text
authenticate

resolve tenant context

authorize action

validate resource scope

execute use case
```

---

# 38. IDOR

Sempre considerar:

```text
attacker knows valid UUID
```

UUID não é controle de acesso.

---

# 39. DTO

DTO representa contrato da API.

Não deve ser automaticamente:

```text
database entity
```

---

# 40. Mass Assignment

Nunca:

```ts
repository.update(id, request.body);
```

---

# 41. Explicit Mapping

Preferir:

```ts
{
  name: dto.name,
  description: dto.description,
}
```

ou mapper explícito equivalente.

---

# 42. Validation

Aplicar:

```text
22-VALIDATION-RULES.md
```

Separar:

```text
transport

field

draft

step

submit

workflow

compliance
```

---

# 43. Draft

Aplicar:

```text
DEC-028
```

Não exigir todos os campos finais para salvar Draft.

---

# 44. Compliance

Aplicar:

```text
DEC-006
```

Gate é estruturado.

Não implementar:

```text
isCompliant: boolean
```

como substituto.

---

# 45. Compliance Checks

Utilizar:

```text
LEGAL_BASIS

RETENTION

SECURITY_MEASURES

INTERNATIONAL_TRANSFER

SENSITIVE_DATA

MINOR_DATA
```

---

# 46. Compliance Results

Utilizar:

```text
PASS

FAIL

REVIEW_REQUIRED

NOT_APPLICABLE
```

---

# 47. Compliance Aggregate

Separado de ActivityStatus.

Aplicar:

```text
DEC-007
```

---

# 48. Legal Conclusions

Agente não deve inventar regra dizendo:

```text
this activity complies with LGPD

this retention period is legally correct

this security measure is sufficient

this transfer mechanism is valid
```

sem regra aprovada.

---

# 49. Sensitive Data

Aplicar:

```text
DEC-024
```

Não:

```text
sensitive
→ FAIL
```

automaticamente.

---

# 50. Minor Data

Mesma regra.

---

# 51. International Transfer

Aplicar:

```text
DEC-025
```

Não inferir por:

```text
foreign Supplier

foreign System

SaaS location
```

Transferência deve estar explicitamente registrada.

---

# 52. Systems

Aplicar:

```text
DEC-009
DEC-011
DEC-012
```

System é entidade reutilizável.

Quick Create cria entidade real.

---

# 53. Suppliers

Aplicar:

```text
DEC-010
DEC-011
DEC-012
```

---

# 54. Pending Mapping

Não inventar efeito de:

```text
PENDING
```

sobre Submit/Gate/ACTIVE enquanto questões correspondentes estiverem abertas.

---

# 55. ROPA

Aplicar:

```text
DEC-008
```

ROPA é:

```text
projection/read model
```

---

# 56. Não duplicar ROPA

Não criar tabela editável:

```text
ropa_entries
```

como segunda fonte da verdade sem decisão arquitetural.

---

# 57. Dashboard

Aplicar:

```text
DEC-021
DEC-022
```

Dashboard é read model.

Não criar:

```text
compliance score
```

---

# 58. Versioning

Aplicar:

```text
DEC-014
```

Alterações relevantes devem preservar histórico.

Detalhes dependem das decisões de versionamento.

---

# 59. Audit

Aplicar:

```text
DEC-015
DEC-016
```

```text
AuditLog
≠
ActivityVersion
```

---

# 60. AuditLog

É:

```text
append-only
```

Não implementar:

```text
UPDATE audit_log
```

como comportamento normal.

---

# 61. Files

Aplicar:

```text
DEC-017
```

Arquivos são privados.

---

# 62. File Access

Fluxo:

```text
authenticate
↓
tenant
↓
authorize
↓
retrieve/download
```

---

# 63. File Key

Não utilizar filename fornecido pelo usuário como storage key confiável.

---

# 64. Database

Banco:

```text
PostgreSQL
```

Aplicar:

```text
DEC-003
```

---

# 65. IDs

Aplicar:

```text
DEC-004
```

Usar:

```text
UUID
```

---

# 66. ORM

Drizzle está aprovado em DEC-044; DBQ-001 está DECIDED. Não introduzir segundo ORM nem reduzir garantias PostgreSQL para acomodar a ferramenta. Queries em repository/persistence; SQL específico parametrizado, localizado e versionado.

---

# 67. Migration

Toda mudança de schema:

```text
migration
```

---

# 68. Não usar schema push em produção

Aplicar:

```text
17-ENVIRONMENTS-AND-DEPLOYMENT.md
```

---

# 69. Destructive Migration

Antes de:

```text
DROP

DELETE

type conversion

rename
```

avaliar dados existentes.

---

# 70. Seed

Aplicar:

```text
23-SEED-AND-CATALOGS.md
```

---

# 71. Stable Codes

Não alterar arbitrariamente:

```text
enum codes

catalog codes

audit event codes

reason codes

error codes
```

---

# 72. Catalog Labels

Label pode mudar.

Code representa contrato.

---

# 73. Frontend

Aplicar:

```text
08-FRONTEND.md

25-UX-GUIDELINES.md
```

---

# 74. State Ownership

Separar:

```text
server state

form state

client UI state
```

---

# 75. TanStack Query

Utilizar para:

```text
server state
```

---

# 76. React Hook Form

Utilizar para:

```text
form state
```

---

# 77. Zustand

Utilizar somente quando existir estado de cliente compartilhado que realmente necessite store.

---

# 78. Não duplicar Server State

Evitar:

```text
TanStack Query data
↓
copy entire object to Zustand
```

sem necessidade.

---

# 79. Frontend Validation

Pode utilizar:

```text
Zod
```

para UX.

Backend continua autoritativo.

---

# 80. Conditional UI

Não apagar dados silenciosamente quando condição muda.

Aplicar decisão relacionada a:

```text
MWQ-001
```

---

# 81. Status UI

Não misturar:

```text
Activity Status

Compliance Status

Mapping Status
```

---

# 82. Optimistic Updates

Não utilizar em ações críticas sem segurança.

Evitar para:

```text
Submit

Activate

Run Gate

Archive

Create Version
```

---

# 83. Loading / Error / Empty

Toda tela relevante deve possuir:

```text
loading

error

empty

success/content
```

---

# 84. Accessibility

Implementar fundamentos desde o início.

Não deixar acessibilidade exclusivamente para final do projeto.

---

# 85. API

Aplicar:

```text
DEC-002
```

Base:

```text
/api/v1
```

---

# 86. REST

Utilizar REST para recursos.

Workflow utiliza ações semânticas quando necessário.

---

# 87. API Errors

Aplicar:

```text
19-ERROR-CATALOG.md
```

Frontend não deve depender de:

```text
message string
```

---

# 88. API Contracts

Aplicar:

```text
20-API-CONTRACTS.md
```

---

# 89. Unknown Fields

Não decidir comportamento final enquanto:

```text
APIQ-018
```

estiver aberto.

Independentemente disso:

```text
mass assignment forbidden
```

---

# 90. Concurrency

Não inventar estratégia antes de:

```text
APIQ-004
```

---

# 91. Idempotency

Avaliar quando operação pode ser repetida por:

```text
network retry

double click

job retry
```

---

# 92. Background Jobs

Não introduzir fila automaticamente.

Primeiro perguntar:

```text
Does this really need async processing?
```

---

# 93. Redis

Não adicionar Redis apenas porque arquitetura futura menciona possibilidade.

---

# 94. BullMQ

Mesma regra.

---

# 95. Kafka

Não adicionar.

Arquitetura atual não necessita event streaming distribuído.

---

# 96. Notifications

Aplicar:

```text
24-NOTIFICATIONS.md
```

Notification não controla workflow.

---

# 97. Observability

Aplicar:

```text
18-OBSERVABILITY.md
```

---

# 98. Logs

Nunca registrar desnecessariamente:

```text
password

token

Authorization header

uploaded content

complete request body

sensitive mapping information
```

---

# 99. Request ID

Propagar quando arquitetura suportar.

---

# 100. Tests

Aplicar:

```text
11-TESTING.md
```

---

# 101. Regra de teste

Mudança de comportamento exige teste correspondente.

---

# 102. Bug Fix

Fluxo recomendado:

```text
reproduce bug
↓
create failing test
↓
fix
↓
test passes
↓
run regression
```

---

# 103. Domain Test

Regras de domínio devem possuir unit tests.

---

# 104. Repository Test

Queries tenant-aware devem possuir integration tests.

---

# 105. API Test

Endpoints devem cobrir:

```text
success

validation

authorization

tenant isolation

workflow conflict
```

---

# 106. Frontend Test

Componentes devem testar comportamento relevante, não detalhes internos.

---

# 107. E2E

Utilizar para fluxos críticos.

Não transformar todo cenário pequeno em E2E.

---

# 108. Security Tests

Prioridade alta:

```text
IDOR

cross-tenant

mass assignment

unauthorized transitions

file access
```

---

# 109. Test Data

Não usar dados reais.

---

# 110. Factories

Factories devem permitir construir cenários explicitamente.

Exemplo:

```text
Organization A

Organization B

Activity A

Supplier B
```

---

# 111. Multi-Tenant Regression

Qualquer novo recurso tenant-bound deve possuir pelo menos um teste negativo cross-tenant apropriado.

---

# 112. Self Review

Antes de concluir tarefa, agente deve revisar o próprio diff.

---

# 113. Diff Questions

Perguntar:

```text
Did I change more than necessary?

Did I invent a requirement?

Did I bypass an Open Question?

Did I break tenant isolation?

Did I weaken authorization?

Did I duplicate existing code?

Did I add unnecessary dependency?

Did I alter API unexpectedly?

Did I add a migration?

Did I add tests?

Did I update documentation if required?
```

---

# 114. Security Self Review

Perguntar:

```text
Can another tenant access this?

Can another user guess this ID?

Can client control organizationId?

Can client control protected status?

Can request body mass-assign fields?

Can file become public?

Can logs leak sensitive information?
```

---

# 115. Domain Self Review

Perguntar:

```text
Did I turn a recommendation into a rule?

Did I turn REVIEW_REQUIRED into PASS/FAIL?

Did I infer legal compliance?

Did I infer international transfer?

Did I destroy historical information?

Did I duplicate ROPA data?
```

---

# 116. Frontend Self Review

Perguntar:

```text
Loading state?

Error state?

Empty state?

Validation?

Accessibility?

Unauthorized state?

Server errors?

Unsaved input?

Conditional data?
```

---

# 117. Database Self Review

Perguntar:

```text
Migration safe?

Tenant index?

Foreign keys?

Cross-tenant integrity?

Historical references?

Unique race condition?

Rollback impact?
```

---

# 118. Test Execution

Antes de concluir:

```text
run relevant tests
```

Depois, quando razoável:

```text
run broader regression suite
```

---

# 119. Não afirmar teste executado sem executar

Se agente não conseguiu executar:

```text
Tests not executed
```

e explicar motivo.

---

# 120. Não afirmar build passou sem executar

Mesma regra.

---

# 121. Completion Report

Ao finalizar tarefa, resposta deve ser objetiva.

Formato recomendado:

```text
Implemented

Files Changed

Tests

Decisions / Assumptions

Open Issues
```

---

# 122. Example

```text
Implemented
- Added tenant-safe System creation.
- Added Quick Create endpoint.
- New Systems start as PENDING.

Tests
- Unit: passed
- Integration: passed
- Cross-tenant test: passed

Open Issues
- SYSQ-002 remains open, so Complete Mapping was not implemented.
```

---

# 123. Não esconder trabalho incompleto

Se parte ficou bloqueada:

```text
report it
```

---

# 124. TODO

Não inserir:

```text
TODO
```

para requisito crítico sem mencionar na conclusão.

---

# 125. Temporary Workaround

Deve estar explicitamente identificado.

---

# 126. Documentation Update

Atualizar docs quando implementação:

```text
introduces approved decision

changes API contract

changes domain behavior

changes schema

changes workflow

adds catalog code

adds error code
```

---

# 127. Não editar Decision automaticamente

Se implementação descobrir necessidade de decisão:

```text
ask
```

Não escrever decisão como aprovada.

---

# 128. Decision Workflow

Quando usuário aprovar:

```text
Open Question
↓
Decision
↓
13-DECISIONS.md
↓
12-OPEN-QUESTIONS.md status update
↓
affected docs
↓
implementation
```

---

# 129. Decision Traceability

Decision deve referenciar:

```text
question ID

affected modules

date

consequences
```

---

# 130. New Open Question

Se surgir lacuna real:

```text
create stable question ID
```

e adicionar ao documento central.

---

# 131. Não criar Open Question desnecessária

Se comportamento já estiver claramente decidido:

```text
implement it
```

Não transformar toda escolha de código em decisão de produto.

---

# 132. Technical Choice

Agente pode tomar escolhas locais reversíveis quando não alterarem contrato.

Exemplos:

```text
private helper name

local variable name

small function extraction

test helper organization
```

---

# 133. Structural Choice

Exige decisão quando altera:

```text
domain model

workflow

security boundary

API contract

tenant model

data ownership

legal behavior

major infrastructure
```

---

# 134. Refactoring

Refactor deve preservar comportamento.

Se comportamento mudar:

```text
it is not only a refactor
```

---

# 135. Dependency Addition

Antes de instalar package:

```text
Can existing stack solve it?

Is package maintained?

Does it duplicate existing dependency?

What is bundle/runtime impact?

Is it necessary?
```

---

# 136. Framework Drift

Não introduzir:

```text
second state manager

second ORM

second HTTP framework

second validation framework
```

sem necessidade.

---

# 137. Premature Abstraction

Evitar construir plataforma genérica antes de existir padrão repetido.

---

# 138. Premature Optimization

Não adicionar:

```text
cache

queue

distributed lock

event streaming

materialized view
```

sem evidência de necessidade.

---

# 139. Performance

Quando houver problema:

```text
measure
↓
identify bottleneck
↓
optimize
↓
measure again
```

---

# 140. Security Fix

Não reduzir segurança para simplificar feature.

Exemplo proibido:

```text
remove organization filter because test is failing
```

---

# 141. Error Handling

Não engolir exception.

Errado:

```ts
try {
  ...
} catch {
  return null;
}
```

quando erro é relevante.

---

# 142. Error Translation

Infrastructure errors devem ser traduzidos quando necessário para códigos estáveis.

---

# 143. Logging Error

Registrar contexto técnico seguro.

Não duplicar stack em múltiplas camadas desnecessariamente.

---

# 144. Comments

Comentários devem explicar:

```text
why
```

não repetir:

```text
what code visibly does
```

---

# 145. Naming

Aplicar:

```text
16-CODING-STANDARDS.md
```

---

# 146. Language

Código:

```text
English
```

Documentação funcional:

```text
Portuguese
```

---

# 147. Avoid `any`

TypeScript:

```text
strict
```

Evitar:

```ts
any;
```

---

# 148. Type Assertions

Não usar:

```ts
as SomeType
```

apenas para silenciar incompatibilidade sem garantir runtime correctness.

---

# 149. Nullable

Aplicar:

```text
21-DATA-DICTIONARY.md
```

Não confundir:

```text
optional
```

com:

```text
nullable
```

---

# 150. Date Handling

API:

```text
ISO 8601
```

conforme contrato.

Banco:

```text
TIMESTAMPTZ
```

quando timestamp.

---

# 151. Money

Se futuramente existir valor monetário real no domínio, não usar float sem analisar precisão.

Não é requisito atual central.

---

# 152. API Client

Frontend deve centralizar comunicação HTTP.

Evitar `fetch` espalhado em componentes.

---

# 153. Query Keys

Devem refletir recurso/contexto.

Tenant-specific cache deve ser isolado.

---

# 154. Mutation Invalidation

Após mutation:

```text
invalidate/update relevant queries
```

sem invalidar toda aplicação desnecessariamente.

---

# 155. Dashboard Consistency

Se regra de Dashboard também existir no ROPA/domínio:

```text
share derivation
```

quando apropriado.

Não copiar fórmula.

---

# 156. Compliance Consistency

Compliance logic deve existir em módulo responsável.

Não duplicar checks em:

```text
frontend

Dashboard

ROPA exporter
```

---

# 157. Export

Export deve utilizar mesma semântica dos read models correspondentes.

---

# 158. Snapshot Consistency

Export histórico não deve misturar versões.

---

# 159. AI Prompt — Feature

Template recomendado:

```text
Implement STORY-XXX.

Before coding:
- read AGENTS.md;
- read docs/13-DECISIONS.md;
- read docs/12-OPEN-QUESTIONS.md;
- read the relevant feature specification;
- inspect existing implementation.

Do not resolve OPEN questions silently.

Implement the smallest complete vertical slice.

Requirements:
- preserve tenant isolation;
- backend is authoritative;
- add appropriate tests;
- update documentation only if contract changes.

At the end report:
- files changed;
- tests executed;
- decisions used;
- blockers/open questions.
```

---

# 160. AI Prompt — Bug Fix

```text
Fix the reported bug.

Before changing code:
1. reproduce or identify the failure;
2. inspect related tests;
3. identify the violated documented rule;
4. add a regression test when possible;
5. implement the smallest fix.

Do not change unrelated behavior.

Run relevant tests and report results.
```

---

# 161. AI Prompt — API

```text
Implement the API endpoint described in the specification.

Read:
- AGENTS.md
- 13-DECISIONS.md
- 12-OPEN-QUESTIONS.md
- 07-API.md
- 20-API-CONTRACTS.md
- 19-ERROR-CATALOG.md
- 22-VALIDATION-RULES.md
- relevant feature document

Requirements:
- derive organization from authenticated context;
- enforce authorization;
- prevent mass assignment;
- use stable error codes;
- preserve workflow semantics;
- add API and tenant-isolation tests.
```

---

# 162. AI Prompt — Database

```text
Implement the required database change.

Read:
- 03-DATABASE.md
- 21-DATA-DICTIONARY.md
- 23-SEED-AND-CATALOGS.md
- 13-DECISIONS.md
- 12-OPEN-QUESTIONS.md

Before migration:
- inspect current schema;
- inspect existing migrations;
- identify historical data impact;
- identify tenant integrity impact.

Do not perform destructive changes without explicit justification.

Add migration and integration tests.
```

---

# 163. AI Prompt — Frontend

```text
Implement the frontend for STORY-XXX.

Read:
- 08-FRONTEND.md
- 25-UX-GUIDELINES.md
- 20-API-CONTRACTS.md
- 22-VALIDATION-RULES.md
- relevant feature specification

Requirements:
- use existing components/patterns;
- keep server state in TanStack Query;
- use React Hook Form for form state;
- use Zod for UX validation when appropriate;
- backend remains authoritative;
- implement loading/error/empty states;
- respect permissions;
- add component tests.
```

---

# 164. AI Prompt — Security Review

```text
Review this change for security.

Focus on:
- tenant isolation;
- IDOR;
- authorization;
- mass assignment;
- file access;
- secrets;
- sensitive logging;
- session handling;
- cross-tenant references.

Report findings by severity.

Do not modify code until findings are understood unless explicitly asked.
```

---

# 165. AI Prompt — Release Review

```text
Review this release using:

docs/26-RELEASE-CHECKLIST.md

Report:

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

# 166. AI Prompt — Open Questions

```text
Review docs/12-OPEN-QUESTIONS.md.

Group unresolved questions by:

CRITICAL
HIGH
MEDIUM
LOW

For each CRITICAL question:
- explain what implementation it blocks;
- list documented options if available;
- identify affected documents/modules.

Do not decide the questions unless explicitly asked for a recommendation.
```

---

# 167. AI Prompt — Decision Application

Depois de uma decisão humana:

```text
Decision XYZ has been approved.

Update:
- docs/13-DECISIONS.md;
- the corresponding entry in docs/12-OPEN-QUESTIONS.md;
- all directly affected specifications.

Do not change unrelated decisions.

Report which documents were affected and why.
```

---

# 168. AI Prompt — Implementation Plan

```text
Plan STORY-XXX without coding yet.

Read the relevant documentation and inspect the repository.

Return:

Goal

Affected Modules

Affected Files

Domain Changes

Database Changes

API Changes

Frontend Changes

Authorization Impact

Tenant Impact

Tests

Open Questions

Implementation Order
```

---

# 169. Context Management

Em tarefas longas, agente deve preservar IDs importantes.

Exemplos:

```text
DEC-018

WFQ-004

SYSQ-007

APIQ-004
```

Não substituir por memória vaga.

---

# 170. Context Recovery

Se agente perder contexto:

```text
re-read source documents
```

Não reconstruir decisões por suposição.

---

# 171. Source Citation in Work

Ao justificar decisão de implementação, pode referenciar:

```text
DEC-018
BR-GLOBAL-001
INV-PA-003
WFQ-004
```

para manter rastreabilidade.

---

# 172. One Task at a Time

Preferir tarefas pequenas.

Exemplo melhor:

```text
Implement Create System
```

em vez de:

```text
Implement entire Systems module
```

---

# 173. Suggested Task Size

Uma tarefa ideal deve conseguir responder claramente:

```text
what changes?

why?

how do we test it?

what defines done?
```

---

# 174. Large Feature

Dividir:

```text
schema
↓
domain
↓
API
↓
frontend
↓
workflow integration
```

ou slices funcionais apropriados.

---

# 175. AI Parallel Work

Se múltiplos agentes trabalharem simultaneamente:

```text
avoid overlapping ownership
```

---

# 176. Parallel Tasks

Boas candidatas:

```text
independent feature tests

documentation

isolated frontend component

separate catalog implementation
```

---

# 177. Bad Parallel Tasks

Evitar dois agentes alterando simultaneamente:

```text
same migration

same domain entity

same workflow

same API contract
```

sem coordenação.

---

# 178. Merge Review

Depois de trabalho paralelo:

```text
review integration
```

especialmente:

```text
types

contracts

migrations

imports

tests
```

---

# 179. Hallucination Prevention

Antes de implementar campo não documentado:

```text
search documentation
↓
search code
↓
search Open Questions
```

Se não existir:

```text
do not invent silently
```

---

# 180. Example Hallucination

Não adicionar automaticamente ao Supplier:

```text
riskScore

DPOContact

ISO27001Certified

privacyRating
```

porque "parecem úteis".

---

# 181. Another Example

Não adicionar automaticamente:

```text
Activity.priority
```

porque Dashboard poderia usar.

---

# 182. Schema Discipline

Cada coluna nova precisa responder:

```text
Which requirement needs this?
```

---

# 183. API Discipline

Cada endpoint novo precisa responder:

```text
Which use case needs this?
```

---

# 184. UI Discipline

Cada botão precisa responder:

```text
Which allowed action/use case does this trigger?
```

---

# 185. Infrastructure Discipline

Cada serviço novo precisa responder:

```text
Which operational requirement requires this?
```

---

# 186. Test Discipline

Cada regra crítica precisa responder:

```text
Which test proves it?
```

---

# 187. Documentation Discipline

Cada decisão precisa responder:

```text
Where is it recorded?
```

---

# 188. Definition of Ready — AI Task

Antes de iniciar implementação:

```text
[ ] task understood

[ ] scope understood

[ ] relevant docs read

[ ] decisions identified

[ ] Open Questions checked

[ ] repository inspected

[ ] affected modules identified

[ ] tenant impact identified

[ ] authorization impact identified

[ ] test strategy identified
```

---

# 189. Definition of Done — AI Task

Antes de declarar concluído:

```text
[ ] requested behavior implemented

[ ] no unrelated behavior changed

[ ] architecture respected

[ ] tenant isolation preserved

[ ] authorization preserved

[ ] validation implemented

[ ] errors use stable codes

[ ] tests added/updated

[ ] relevant tests executed

[ ] self-review completed

[ ] documentation updated when necessary

[ ] remaining blockers reported
```

---

# 190. Final Self-Check

Executar mentalmente:

```text
REQUIREMENTS
Did I implement only documented behavior?

DECISIONS
Did I respect approved decisions?

OPEN QUESTIONS
Did I silently resolve anything?

DOMAIN
Are invariants preserved?

TENANT
Can another Organization access it?

AUTHORIZATION
Can an unauthorized user execute it?

DATABASE
Is data integrity preserved?

HISTORY
Did I preserve historical information?

API
Did I preserve contracts?

FRONTEND
Are states handled?

SECURITY
Did I introduce exposure?

TESTS
Can I prove the behavior?

DOCS
Does documentation still match?
```

---

# 191. Stop Conditions

Agente deve parar antes de implementação quando encontrar:

```text
CRITICAL Open Question blocking task

contradictory approved decisions

unclear tenant ownership

unclear authorization boundary

destructive migration without approved behavior

legal conclusion required but not defined

workflow transition not defined
```

---

# 192. Continue Conditions

Agente pode continuar sem nova decisão quando:

```text
behavior is already documented

decision exists

choice is local and reversible

change does not alter product contract

tests clearly define expected behavior
```

---

# 193. Escalation Format

```text
BLOCKED

Reason:
WFQ-004 remains OPEN.

Impact:
Cannot determine whether successful Compliance Gate
automatically activates the Activity.

Required decision:
Choose automatic activation or explicit approval.

Unaffected work:
Validation and Compliance evaluation can still be implemented.
```

---

# 194. AI Communication

Preferir respostas:

```text
specific

traceable

actionable
```

Evitar:

```text
large generic explanations

unnecessary architecture proposals

unrequested rewrites
```

---

# 195. Do Not Fake Certainty

Quando não souber:

```text
state uncertainty
```

Quando não encontrou:

```text
state that it was not found
```

Quando não executou:

```text
state that it was not executed
```

---

# 196. Do Not Fake Completion

Nunca dizer:

```text
Done
```

se:

```text
tests failed

critical portion remains unimplemented

migration is missing

required decision is unresolved
```

---

# 197. Project Guardrails

Guardrails principais:

```text
Modular Monolith

REST /api/v1

PostgreSQL

UUID

Backend authority

Tenant isolation

Structured Compliance Gate

ActivityStatus != ComplianceStatus

ROPA as projection

Dashboard as read model

Systems/Suppliers as first-class entities

No real data subject records

Versioning

Append-only AuditLog

Private files

Semantic workflow actions

Draft can be incomplete
```

---

# 198. AI Quick Reference

```text
Before coding:
READ + INSPECT

Before deciding:
CHECK OPEN QUESTIONS

Before querying:
THINK TENANT

Before mutating:
CHECK AUTHORIZATION

Before changing status:
USE WORKFLOW

Before adding field:
FIND REQUIREMENT

Before adding dependency:
JUSTIFY IT

Before finishing:
TEST + REVIEW

Before saying done:
REPORT REAL STATUS
```

---

# 199. Recommended Development Cycle

```text
Backlog Story
↓
Check Open Questions
↓
Resolve required decisions
↓
Implementation Plan
↓
Small Vertical Slice
↓
Tests
↓
Self Review
↓
Code Review
↓
Integration
↓
Release Checklist
```

---

# 200. Project Documentation Flow

A documentação agora pode ser utilizada desta forma:

```text
00-PROJECT
        ↓
01-ARCHITECTURE
        ↓
02-DOMAIN
        ↓
03-DATABASE
        ↓
04-AUTHORIZATION
        ↓
05-BUSINESS-RULES
        ↓
06-WORKFLOWS
        ↓
07-API
        ↓
08-FRONTEND
        ↓
09-SECURITY
        ↓
10-AUDIT
        ↓
11-TESTING
        ↓
12-OPEN-QUESTIONS
        ↕
13-DECISIONS
        ↓
14-IMPLEMENTATION-PLAN
        ↓
15-BACKLOG
        ↓
16-CODING-STANDARDS
        ↓
17-ENVIRONMENTS-AND-DEPLOYMENT
        ↓
18-OBSERVABILITY
        ↓
19-ERROR-CATALOG
        ↓
20-API-CONTRACTS
        ↓
21-DATA-DICTIONARY
        ↓
22-VALIDATION-RULES
        ↓
23-SEED-AND-CATALOGS
        ↓
24-NOTIFICATIONS
        ↓
25-UX-GUIDELINES
        ↓
26-RELEASE-CHECKLIST
        ↓
27-AI-DEVELOPMENT-GUIDE
```

Complementados por:

```text
docs/features/*
```

e:

```text
AGENTS.md
```

na raiz.

---

# 201. Documentos de Feature

```text
features/AUTH.md

features/ORGANIZATIONS.md

features/PROCESSING-ACTIVITY.md

features/MAPPING-WIZARD.md

features/COMPLIANCE-GATE.md

features/ROPA.md

features/SYSTEMS.md

features/SUPPLIERS.md

features/DASHBOARD.md
```

---

# 202. Estrutura final de documentação

```text
/
├── AGENTS.md
│
└── docs/
    ├── 00-PROJECT.md
    ├── 01-ARCHITECTURE.md
    ├── 02-DOMAIN.md
    ├── 03-DATABASE.md
    ├── 04-AUTHORIZATION.md
    ├── 05-BUSINESS-RULES.md
    ├── 06-WORKFLOWS.md
    ├── 07-API.md
    ├── 08-FRONTEND.md
    ├── 09-SECURITY.md
    ├── 10-AUDIT.md
    ├── 11-TESTING.md
    ├── 12-OPEN-QUESTIONS.md
    ├── 13-DECISIONS.md
    ├── 14-IMPLEMENTATION-PLAN.md
    ├── 15-BACKLOG.md
    ├── 16-CODING-STANDARDS.md
    ├── 17-ENVIRONMENTS-AND-DEPLOYMENT.md
    ├── 18-OBSERVABILITY.md
    ├── 19-ERROR-CATALOG.md
    ├── 20-API-CONTRACTS.md
    ├── 21-DATA-DICTIONARY.md
    ├── 22-VALIDATION-RULES.md
    ├── 23-SEED-AND-CATALOGS.md
    ├── 24-NOTIFICATIONS.md
    ├── 25-UX-GUIDELINES.md
    ├── 26-RELEASE-CHECKLIST.md
    ├── 27-AI-DEVELOPMENT-GUIDE.md
    │
    └── features/
        ├── AUTH.md
        ├── ORGANIZATIONS.md
        ├── PROCESSING-ACTIVITY.md
        ├── MAPPING-WIZARD.md
        ├── COMPLIANCE-GATE.md
        ├── ROPA.md
        ├── SYSTEMS.md
        ├── SUPPLIERS.md
        └── DASHBOARD.md
```

---

# 203. Quantidade

Estrutura planejada:

```text
28 documentos numerados

9 documentos de Feature

1 AGENTS.md
```

Total:

```text
38 arquivos de documentação
```

---

# 204. Próxima etapa do projeto

Com este documento, encerra-se a criação estrutural planejada da documentação.

O próximo passo não deve ser criar novos documentos indefinidamente.

A sequência recomendada agora é:

```text
docs/12-OPEN-QUESTIONS.md
↓
resolver questões CRITICAL
↓
registrar decisões em docs/13-DECISIONS.md
↓
atualizar documentos afetados
↓
marcar Stories desbloqueadas como READY
↓
iniciar implementação
```

---

# 205. Ordem recomendada das decisões

Priorizar:

```text
1. Tenant model

2. Authentication/session

3. Roles and authorization scope

4. Activity final statuses

5. Submit workflow

6. Review/approval workflow

7. Compliance aggregation

8. REVIEW_REQUIRED handling

9. Activity versioning

10. Core domain cardinalities

11. System/Supplier mapping rules

12. ROPA semantics

13. Dashboard formulas

14. Infrastructure choices
```

---

# 206. Primeiro marco de implementação

Depois das decisões críticas, o primeiro marco deve buscar:

```text
Application starts
↓
Authentication works
↓
Organization context works
↓
Tenant isolation works
↓
User permissions work
↓
Processing Activity Draft can be created
```

Depois:

```text
Wizard
↓
Compliance
↓
ROPA
↓
Dashboard
```

---

# 207. Regra final para agentes

A função do agente é:

```text
understand
↓
implement
↓
verify
```

e não:

```text
assume
↓
invent
↓
hide uncertainty
```

Quando a documentação possuir resposta:

```text
follow it
```

Quando possuir uma decisão:

```text
respect it
```

Quando possuir uma Open Question:

```text
do not silently answer it
```

Quando encontrar uma lacuna real:

```text
make it explicit
```

Esse comportamento é parte da arquitetura do projeto tanto quanto o código.
