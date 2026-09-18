# API Contracts

> **Documento:** Contratos e Convenções da API  
> **Status:** Draft  
> **Objetivo:** complementar `07-API.md` com contratos reutilizáveis e previsíveis para requests, responses, paginação, filtros, ordenação, erros, concorrência, arquivos e operações assíncronas.


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

User, ExternalIdentity, Session e outras entidades globais não recebem organization_id artificial; sua proteção específica será definida posteriormente. Descoberta dos próprios Memberships exige caminho restrito, sem policy irrestrita. Estes detalhes não estão implementados nem decididos por exemplos deste documento.

Referências legadas a Prisma/Drizzle ou a RLS como alternativas pendentes são históricas: estas três questões estão decididas em DEC-044 a DEC-046. Políticas funcionais, autenticação e features posteriores continuam sujeitas às questões específicas. A topologia física de produção não é escolhida por este registro.

---

---


---

# 1. Objetivo

Todos os endpoints REST devem seguir convenções comuns para:

```text
URLs

HTTP methods

request bodies

response bodies

pagination

filtering

sorting

dates

UUIDs

enums

errors

resource references

concurrency

files

exports

OpenAPI
```

---

# 2. Base URL

A API utiliza:

```text
/api/v1
```

conforme:

```text
DEC-002
```

Exemplo:

```http
GET /api/v1/processing-activities
```

---

# 3. Transporte

Formato principal:

```text
JSON
```

Content-Type:

```http
application/json
```

Uploads podem utilizar contrato específico definido posteriormente.

---

# 4. Naming JSON

Campos JSON devem utilizar:

```text
camelCase
```

Exemplo:

```json
{
  "businessUnitId": "...",
  "createdAt": "...",
  "complianceStatus": "PENDING"
}
```

---

# 5. Naming Database

Banco permanece:

```text
snake_case
```

Exemplo:

```text
business_unit_id

created_at

compliance_status
```

A camada de API não deve expor naming interno do banco.

---

# 6. UUID

IDs públicos de entidades principais:

```text
UUID
```

conforme:

```text
DEC-004
```

Exemplo:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

# 7. IDs como opaque identifiers

Cliente não deve extrair significado do UUID.

Não assumir:

```text
ordem

data

tenant

tipo
```

a partir do ID.

---

# 8. Organization ID

Aplicar:

```text
DEC-018
```

O tenant ativo deve ser derivado do:

```text
AuthenticatedContext
```

e não de um `organizationId` arbitrário enviado no body.

---

# 9. Exemplo proibido

```json
{
  "organizationId": "org-selected-by-client",
  "name": "Payroll"
}
```

quando `organizationId` estiver sendo usado como autoridade de tenant.

---

# 10. Organization Context

Se usuário puder pertencer a múltiplas Organizations, o mecanismo de seleção do contexto depende de:

```text
AUTHQ-006
```

O contrato final não deve ser inventado antes dessas decisões.

---

# 11. Timestamps

Formato:

```text
ISO 8601
```

Preferencialmente UTC.

Exemplo:

```json
{
  "createdAt": "2026-09-17T14:30:00.000Z"
}
```

---

# 12. Date-only

Quando conceito for apenas data:

```text
YYYY-MM-DD
```

Exemplo:

```json
{
  "effectiveDate": "2026-09-17"
}
```

Não converter date-only em timestamp arbitrariamente.

---

# 13. Null

Utilizar `null` quando campo explicitamente puder não possuir valor.

Exemplo:

```json
{
  "description": null
}
```

---

# 14. Campo ausente vs null

Para `PATCH`:

```text
field absent
→ do not change

field: null
→ clear field
```

somente quando o campo aceitar `null`.

---

# 15. Arrays

Coleções devem retornar:

```text
[]
```

quando vazias.

Não:

```text
null
```

---

# 16. Booleans

Utilizar:

```json
true
```

e:

```json
false
```

Não:

```text
"yes"

"no"

0

1
```

---

# 17. Enum Codes

API deve utilizar códigos estáveis.

Exemplo:

```json
{
  "status": "DRAFT"
}
```

Não utilizar label traduzida:

```json
{
  "status": "Rascunho"
}
```

---

# 18. Labels

Frontend é responsável por apresentar:

```text
DRAFT → Rascunho
```

---

# 19. Activity Status

Status finais dependem de:

```text
WFQ-001
```

Não adicionar valores não aprovados ao contrato final.

Conjunto atualmente proposto:

```text
DRAFT

MAPPING

PENDING_REVIEW

COMPLIANCE_PENDING

ACTIVE

UNDER_REVIEW

ARCHIVED
```

Este conjunto permanece sujeito à decisão correspondente.

---

# 20. Compliance Status

Conceito separado de Activity Status.

Aplicar:

```text
DEC-007
```

Valores:

```text
PENDING

COMPLETE

BLOCKED
```

A semântica exata de agregação ainda depende das Open Questions do Compliance Gate.

---

# 21. Compliance Check Status

Valores definidos conceitualmente:

```text
PASS

FAIL

REVIEW_REQUIRED

NOT_APPLICABLE
```

---

# 22. Processing Operation Codes

Aplicar:

```text
DEC-029
```

Valores:

```text
USE

UPDATE

INTERNAL_TRANSFER

EXTERNAL_TRANSFER

INTERNATIONAL_TRANSFER

DELETE
```

---

# 23. Success Response — Single Resource

Por padrão, recurso pode ser retornado diretamente:

```json
{
  "id": "...",
  "name": "Payroll",
  "status": "DRAFT",
  "createdAt": "...",
  "updatedAt": "..."
}
```

Evitar envelopes diferentes por módulo sem necessidade.

---

# 24. Envelope de recurso

Não alternar arbitrariamente entre:

```json
{
  "activity": {}
}
```

e:

```json
{
  "data": {}
}
```

e:

```json
{}
```

Definir um padrão consistente.

---

# 25. Decisão proposta

Para recursos únicos:

```text
resource directly
```

Para coleções:

```text
items + pagination
```

---

# 26. Nova Open Question

Adicionar:

```text
APIQ-011
```

**Question:**

```text
Responses de recurso único serão retornadas diretamente ou dentro de envelope `data`?
```

**Priority:**

```text
LOW
```

---

# 27. Collection Response

Formato proposto:

```json
{
  "items": [
    {
      "id": "...",
      "name": "Payroll"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 57,
    "totalPages": 3
  }
}
```

---

# 28. Paginação

Estratégia inicial proposta:

```text
page-based pagination
```

Parâmetros:

```text
page

pageSize
```

---

# 29. Exemplo

```http
GET /api/v1/processing-activities?page=2&pageSize=20
```

---

# 30. Defaults

Valores exatos devem ser centralizados.

Sugestão:

```text
page = 1

pageSize = 20
```

---

# 31. Limite máximo

API deve impor:

```text
maximum pageSize
```

para evitar queries sem limite.

Valor deve ser configurado/definido.

---

# 32. Nova Open Question

Adicionar:

```text
APIQ-012
```

**Question:**

```text
Qual pageSize padrão e máximo da API?
```

**Priority:**

```text
LOW
```

---

# 33. Cursor Pagination

Não introduzir cursor pagination inicialmente sem necessidade.

Pode ser considerada futuramente para:

```text
AuditLog

large activity histories
```

se volume justificar.

---

# 34. Empty Collection

Exemplo:

```json
{
  "items": [],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 0,
    "totalPages": 0
  }
}
```

---

# 35. Sorting

Parâmetros propostos:

```text
sortBy

sortOrder
```

---

# 36. Exemplo

```http
GET /api/v1/processing-activities?sortBy=updatedAt&sortOrder=desc
```

---

# 37. Sort Order

Valores:

```text
asc

desc
```

---

# 38. Sort Whitelist

Backend deve permitir apenas campos explicitamente suportados.

Não transformar `sortBy` diretamente em SQL/ORM field arbitrário.

---

# 39. Default Sorting

Cada collection endpoint deve possuir ordenação padrão determinística.

Exemplo possível:

```text
updatedAt DESC
```

A ordenação específica depende do recurso.

---

# 40. Tie Breaker

Quando necessário, incluir segundo critério estável.

Exemplo:

```text
updatedAt DESC

id DESC
```

---

# 41. Filtering

Filtros devem utilizar query parameters.

Exemplo:

```http
GET /api/v1/processing-activities?status=DRAFT
```

---

# 42. Multiple Filters

Exemplo:

```http
GET /api/v1/processing-activities?status=ACTIVE&businessUnitId=...
```

---

# 43. Multi-value Filters

Estratégia deve ser consistente.

Possibilidades:

```text
status=ACTIVE,DRAFT
```

ou:

```text
status=ACTIVE&status=DRAFT
```

---

# 44. Nova Open Question

Adicionar:

```text
APIQ-013
```

**Question:**

```text
Qual formato será utilizado para filtros com múltiplos valores?
```

**Priority:**

```text
LOW
```

---

# 45. Search

Busca textual deve utilizar parâmetro explícito.

Exemplo:

```http
GET /api/v1/systems?search=payroll
```

---

# 46. Search Semantics

Cada endpoint deve documentar quais campos participam da busca.

Não assumir busca global sobre todas as colunas.

---

# 47. Case Sensitivity

Comportamento deve ser consistente.

Para nomes, busca case-insensitive pode ser adequada.

Implementação depende do banco/índice.

---

# 48. Date Filters

Formato sugerido:

```text
createdFrom

createdTo
```

ou filtros específicos do recurso.

Evitar sintaxes excessivamente genéricas na V1.

---

# 49. Unknown Query Parameters

Backend deve decidir se:

```text
ignora
```

ou:

```text
rejeita
```

query parameters desconhecidos.

---

# 50. Nova Open Question

Adicionar:

```text
APIQ-014
```

**Question:**

```text
Query parameters desconhecidos devem ser rejeitados ou ignorados?
```

**Priority:**

```text
LOW
```

---

# 51. POST

Utilizado normalmente para:

```text
create resource

semantic action

start asynchronous operation
```

---

# 52. Create Response

Criação bem-sucedida:

```text
201 Created
```

Pode retornar recurso criado.

---

# 53. Location Header

Pode retornar:

```http
Location: /api/v1/processing-activities/{id}
```

Opcional, mas desejável quando apropriado.

---

# 54. PUT

Não utilizar automaticamente.

PUT implica substituição completa do recurso.

Para este projeto, a maior parte das alterações tende a utilizar:

```text
PATCH
```

ou:

```text
semantic action
```

---

# 55. PATCH

Utilizado para alterações parciais permitidas.

Exemplo:

```http
PATCH /api/v1/processing-activities/{id}
```

```json
{
  "name": "Employee Payroll"
}
```

---

# 56. PATCH não altera workflow arbitrariamente

Aplicar:

```text
DEC-030
```

Proibido:

```json
{
  "status": "ACTIVE"
}
```

como mecanismo genérico para ativação.

---

# 57. Semantic Actions

Exemplos:

```http
POST /api/v1/processing-activities/{id}/submit

POST /api/v1/processing-activities/{id}/activate

POST /api/v1/processing-activities/{id}/archive

POST /api/v1/processing-activities/{id}/revisions

POST /api/v1/processing-activities/{id}/compliance/run
```

---

# 58. Semantic Action Response

Pode retornar recurso atualizado.

Exemplo:

```json
{
  "id": "...",
  "status": "PENDING_REVIEW",
  "updatedAt": "..."
}
```

---

# 59. DELETE

Hard delete deve ser utilizado com cautela.

Aplicar:

```text
DEC-020
```

Recursos históricos relevantes devem preferir:

```text
archive

deactivate
```

---

# 60. DELETE de Draft

Possibilidade depende de:

```text
WFQ-012
```

Não assumir antes da decisão.

---

# 61. 204 No Content

Pode ser utilizado quando operação não precisa retornar body.

Exemplo potencial:

```http
DELETE /api/v1/.../{id}
```

Resposta:

```text
204
```

---

# 62. Nested Resources

Subrecursos podem ser representados por:

```http
/api/v1/processing-activities/{activityId}/purposes

/api/v1/processing-activities/{activityId}/personal-data

/api/v1/processing-activities/{activityId}/subjects

/api/v1/processing-activities/{activityId}/collection-sources

/api/v1/processing-activities/{activityId}/operations

/api/v1/processing-activities/{activityId}/recipients

/api/v1/processing-activities/{activityId}/international-transfers

/api/v1/processing-activities/{activityId}/retention

/api/v1/processing-activities/{activityId}/security-measures

/api/v1/processing-activities/{activityId}/legal-bases
```

---

# 63. Nesting Depth

Evitar URLs profundamente aninhadas.

Preferir no máximo contexto necessário.

Evitar:

```text
/organizations/{org}/units/{unit}/activities/{activity}/operations/{operation}/systems/{system}
```

---

# 64. Tenant não precisa estar na URL

Como tenant vem do AuthenticatedContext, normalmente evitar:

```http
/api/v1/organizations/{organizationId}/processing-activities
```

quando `organizationId` apenas repete contexto autenticado.

---

# 65. Resource Reference

Quando recurso referencia outro:

```json
{
  "businessUnitId": "uuid"
}
```

é suficiente para comandos.

---

# 66. Read Response

Responses podem retornar representação resumida:

```json
{
  "businessUnit": {
    "id": "...",
    "name": "Human Resources"
  }
}
```

quando isso reduzir chamadas e for útil.

---

# 67. Evitar inconsistência

Não retornar em alguns endpoints:

```text
businessUnitId
```

e em outros somente:

```text
businessUnit
```

sem padrão.

---

# 68. Padrão sugerido

Quando útil:

```json
{
  "businessUnitId": "...",
  "businessUnit": {
    "id": "...",
    "name": "Human Resources"
  }
}
```

Mas duplicação deve ser avaliada.

---

# 69. Nova Open Question

Adicionar:

```text
APIQ-015
```

**Question:**

```text
Responses devem retornar apenas foreign-key IDs ou também resource summaries embutidos?
```

**Priority:**

```text
MEDIUM
```

Impacta:

```text
frontend requests

payload size

OpenAPI

read models
```

---

# 70. Resource Summary

Se adotado, criar contratos consistentes.

Exemplo:

```ts
interface ResourceSummary {
  id: string;
  name: string;
}
```

Não utilizar summary genérico para recursos que exigem atributos diferentes.

---

# 71. Allowed Actions

API pode retornar capabilities contextuais.

Exemplo:

```json
{
  "allowedActions": [
    "EDIT",
    "SUBMIT",
    "ARCHIVE"
  ]
}
```

---

# 72. Benefício

Frontend não precisa duplicar toda regra de:

```text
role

scope

workflow

status
```

para habilitar botões.

Backend continua autoridade.

---

# 73. Allowed Actions não é autorização

Mesmo que response diga:

```text
ACTIVATE
```

endpoint ainda deve revalidar autorização e estado.

---

# 74. Nova Open Question

Adicionar:

```text
APIQ-016
```

**Question:**

```text
A API retornará `allowedActions` nos recursos principais?
```

**Priority:**

```text
MEDIUM
```

---

# 75. Suggested Allowed Action Codes

Possíveis códigos:

```text
EDIT

SUBMIT

REVIEW

RUN_COMPLIANCE

ACTIVATE

START_REVISION

ARCHIVE

EXPORT
```

Conjunto final depende do workflow.

---

# 76. Error Contract

Aplicar:

```text
19-ERROR-CATALOG.md
```

Formato:

```json
{
  "error": {
    "code": "PROCESSING_ACTIVITY_NOT_FOUND",
    "message": "Processing activity not found",
    "requestId": "req_123"
  }
}
```

---

# 77. Validation Error

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "requestId": "req_123",
    "details": [
      {
        "field": "name",
        "code": "REQUIRED"
      }
    ]
  }
}
```

---

# 78. Domain Validation Error

Exemplo:

```json
{
  "error": {
    "code": "ACTIVITY_SUBMIT_REQUIREMENTS_NOT_MET",
    "message": "Processing activity cannot be submitted",
    "requestId": "req_123",
    "details": {
      "issues": [
        {
          "code": "PURPOSE_REQUIRED",
          "section": "purpose"
        }
      ]
    }
  }
}
```

---

# 79. Security

`details` não pode revelar:

```text
cross-tenant resources

secrets

internal SQL

stack traces
```

---

# 80. Not Found

Exemplo:

```json
{
  "error": {
    "code": "PROCESSING_ACTIVITY_NOT_FOUND",
    "message": "Processing activity not found",
    "requestId": "req_123"
  }
}
```

---

# 81. Optimistic Concurrency

Estratégia ainda depende de:

```text
APIQ-004
```

Possibilidades:

```text
version field

updatedAt

ETag / If-Match
```

---

# 82. Não implementar silenciosamente

Até decisão:

```text
não inventar mecanismo diferente por módulo
```

---

# 83. Opção A — Version Field

Exemplo conceitual:

```json
{
  "name": "Updated name",
  "version": 7
}
```

Backend:

```text
current version != 7
↓
409 CONCURRENT_MODIFICATION
```

---

# 84. Opção B — ETag

Response:

```http
ETag: "activity-7"
```

Request:

```http
If-Match: "activity-7"
```

Falha:

```text
412 Precondition Failed
```

---

# 85. Opção C — updatedAt

Cliente envia timestamp conhecido.

É simples, mas possui semântica menos explícita que version counter.

---

# 86. ActivityVersion ≠ Concurrency Version

Não confundir:

```text
ActivityVersion
```

histórico funcional

com:

```text
optimistic concurrency version
```

controle técnico de escrita concorrente.

---

# 87. Idempotency

Depende de:

```text
APIQ-005

ERRQ-001
```

---

# 88. Idempotency Key

Pode ser considerada para operações como:

```text
large export request

external integration commands
```

Não é obrigatória para todos os POSTs.

---

# 89. Header possível

```http
Idempotency-Key: <opaque-value>
```

---

# 90. Bulk Operations

Fora do escopo inicial salvo necessidade explícita.

Relacionado a:

```text
APIQ-008
```

---

# 91. Files

Uploads seguem:

```text
09-SECURITY.md

17-ENVIRONMENTS-AND-DEPLOYMENT.md

19-ERROR-CATALOG.md
```

---

# 92. File Metadata

Contrato conceitual:

```json
{
  "id": "uuid",
  "originalName": "consent-v3.pdf",
  "contentType": "application/pdf",
  "size": 182733,
  "createdAt": "2026-09-17T14:30:00.000Z"
}
```

---

# 93. Não retornar

File response não deve retornar:

```text
storage secret

bucket credentials

internal filesystem path
```

---

# 94. Storage Key

Evitar expor storage key interna sem necessidade.

---

# 95. Download

Possibilidades:

```text
backend streaming

temporary signed URL
```

depende de:

```text
APIQ-007
```

---

# 96. File Download Authorization

Independentemente da estratégia:

```text
authenticate
↓
authorize
↓
tenant validation
↓
resource validation
↓
download
```

---

# 97. Upload Contract

Estratégia ainda aberta:

```text
multipart

presigned upload

hybrid
```

Relacionada a:

```text
APIQ-007
```

---

# 98. Export

Export de ROPA deve possuir contrato previsível.

---

# 99. Export síncrono

Possível para arquivos pequenos:

```http
GET /api/v1/ropa/export?format=xlsx
```

Resposta:

```text
binary file
```

---

# 100. Export assíncrono

Possível quando processamento for maior:

```http
POST /api/v1/ropa/exports
```

Request:

```json
{
  "format": "XLSX",
  "filters": {}
}
```

Response:

```json
{
  "id": "...",
  "status": "PENDING",
  "format": "XLSX",
  "createdAt": "..."
}
```

---

# 101. Export Job Status

Possíveis:

```text
PENDING

PROCESSING

COMPLETED

FAILED

EXPIRED
```

Somente adotar se export assíncrono for decidido.

---

# 102. Consultar Export

```http
GET /api/v1/ropa/exports/{exportId}
```

Exemplo:

```json
{
  "id": "...",
  "status": "COMPLETED",
  "format": "XLSX",
  "createdAt": "...",
  "completedAt": "...",
  "file": {
    "id": "...",
    "originalName": "ropa.xlsx",
    "contentType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "size": 245671
  }
}
```

---

# 103. Export Failure

Consulta ao recurso pode retornar:

```text
200
```

com:

```json
{
  "status": "FAILED"
}
```

porque falha pertence ao estado do job.

---

# 104. Criar Export — falha técnica

Se API nem conseguir criar o job:

```text
500/503
```

com Error Contract normal.

---

# 105. Dashboard Contract

Dashboard deve utilizar endpoints agregados/read models.

Exemplo conceitual:

```http
GET /api/v1/dashboard/summary
```

---

# 106. Dashboard Response

Formato conceitual:

```json
{
  "mapping": {
    "completed": 0,
    "total": 0,
    "percentage": null
  },
  "pendingItems": {
    "total": 0,
    "old": 0
  },
  "sensitiveDataActivities": 0,
  "minorDataActivities": 0,
  "internationalTransferActivities": 0,
  "pendingSystems": 0,
  "pendingSuppliers": 0
}
```

As fórmulas dependem de:

```text
DASHQ-002

DASHQ-003

DASHQ-006

DASHQ-007
```

Não implementar os cálculos até decisão.

---

# 107. Percentage Zero Denominator

Se total for:

```text
0
```

não assumir automaticamente:

```text
0%

100%
```

Pode retornar:

```json
{
  "percentage": null
}
```

até semântica ser definida.

---

# 108. ROPA Contract

ROPA deve retornar projeção.

Não possuir endpoints como:

```http
POST /ropa
PATCH /ropa/{id}
```

para editar ROPA diretamente.

Aplicar:

```text
DEC-008
```

---

# 109. Compliance Contract

Endpoint:

```http
GET /api/v1/processing-activities/{id}/compliance
```

Response conceitual:

```json
{
  "status": "PENDING",
  "checks": [
    {
      "type": "LEGAL_BASIS",
      "status": "PASS",
      "reasonCode": null,
      "evaluatedAt": "..."
    },
    {
      "type": "SENSITIVE_DATA",
      "status": "REVIEW_REQUIRED",
      "reasonCode": "SENSITIVE_DATA_REVIEW_REQUIRED",
      "evaluatedAt": "..."
    }
  ]
}
```

---

# 110. Run Compliance

```http
POST /api/v1/processing-activities/{id}/compliance/run
```

---

# 111. Compliance Response

Deve retornar estado calculado pelo backend.

Frontend não deve calcular resultado definitivo.

---

# 112. Sensitive/Minor

Aplicar:

```text
DEC-024
```

Não retornar automaticamente:

```text
FAIL
```

apenas porque Activity contém dados sensíveis ou menores.

---

# 113. International Transfer

Aplicar:

```text
DEC-025
```

API não deve inferir transferência de:

```text
supplier.country

system hosting

SaaS
```

sem registro explícito de InternationalTransfer.

---

# 114. Quick Create

Systems/Suppliers criados dentro do Wizard continuam sendo recursos reais.

Aplicar:

```text
DEC-012
```

---

# 115. Quick Create System

Exemplo conceitual:

```http
POST /api/v1/systems
```

```json
{
  "name": "Payroll SaaS"
}
```

Response:

```json
{
  "id": "...",
  "name": "Payroll SaaS",
  "mappingStatus": "PENDING",
  "status": "ACTIVE"
}
```

---

# 116. Quick Create Supplier

```http
POST /api/v1/suppliers
```

```json
{
  "name": "Example Provider"
}
```

Response:

```json
{
  "id": "...",
  "name": "Example Provider",
  "mappingStatus": "PENDING",
  "status": "ACTIVE"
}
```

Permissões dependem de:

```text
SYSQ-011

SUPQ-011
```

---

# 117. Mapping Completion

Não permitir:

```http
PATCH /systems/{id}
```

```json
{
  "mappingStatus": "MAPPED"
}
```

como simples mass assignment.

---

# 118. Semantic Action

Preferir:

```http
POST /api/v1/systems/{id}/complete-mapping
```

e:

```http
POST /api/v1/suppliers/{id}/complete-mapping
```

---

# 119. Mapping Requirements

Dependem de:

```text
SYSQ-002

SUPQ-002
```

---

# 120. `/me`

Endpoint:

```http
GET /api/v1/me
```

Deve retornar contexto necessário ao frontend.

---

# 121. Response conceitual

```json
{
  "user": {
    "id": "...",
    "name": "..."
  },
  "organization": {
    "id": "...",
    "name": "..."
  },
  "roles": [
    "DPO"
  ],
  "businessUnits": [
    {
      "id": "...",
      "name": "Privacy"
    }
  ]
}
```

Contrato final depende das decisões de membership/multi-org.

---

# 122. Permissions no `/me`

Pode retornar:

```json
{
  "permissions": [
    "processing_activity:read",
    "processing_activity:create"
  ]
}
```

se arquitetura de frontend se beneficiar.

---

# 123. Nova Open Question

Adicionar:

```text
APIQ-017
```

**Question:**

```text
`GET /me` retornará roles apenas, permissions calculadas, ou ambos?
```

**Priority:**

```text
MEDIUM
```

---

# 124. OpenAPI

API deve possuir documentação OpenAPI quando decisão correspondente for confirmada.

Relacionado a:

```text
APIQ-001
```

---

# 125. OpenAPI deve documentar

```text
paths

methods

request schemas

response schemas

error schemas

enums

authentication

pagination

filters

examples
```

---

# 126. OpenAPI não substitui docs de domínio

OpenAPI descreve contrato técnico.

Não substitui:

```text
Business Rules

Workflow

Authorization

Compliance rules
```

---

# 127. Schema Naming

Schemas devem possuir nomes semânticos.

Exemplos:

```text
CreateProcessingActivityRequest

ProcessingActivityResponse

ProcessingActivityListResponse

ApiErrorResponse

ValidationErrorResponse
```

---

# 128. DTO ≠ Database Model

Não gerar contrato público diretamente do ORM sem controle.

Evitar exposição acidental de:

```text
internal flags

deletedAt

organizationId

storage keys

security metadata
```

---

# 129. Response DTO

Responses devem ser explicitamente controladas.

---

# 130. Mass Assignment

Requests também devem aceitar somente campos previstos.

Aplicar:

```text
16-CODING-STANDARDS.md
```

---

# 131. Unknown Body Fields

DTO validation deve decidir se campos desconhecidos são:

```text
rejected
```

ou:

```text
stripped
```

---

# 132. Recomendação

Para segurança e previsibilidade:

```text
reject unknown write fields
```

é preferível.

Mas registrar decisão antes de depender desse comportamento globalmente.

---

# 133. Nova Open Question

Adicionar:

```text
APIQ-018
```

**Question:**

```text
Campos desconhecidos em request bodies devem ser rejeitados ou removidos silenciosamente?
```

**Priority:**

```text
MEDIUM
```

---

# 134. Sensitive Fields

Nunca aceitar por DTO genérico:

```text
organizationId

createdBy

updatedBy

complianceStatus

currentPublishedVersion

audit metadata
```

salvo endpoint específico com semântica aprovada.

---

# 135. API Versioning

Versão atual:

```text
v1
```

na URL.

---

# 136. Breaking Change

Exemplos:

```text
remove response field

rename error code

change enum meaning

change field type

change pagination contract
```

devem ser tratados como mudanças potencialmente breaking.

---

# 137. Additive Change

Adicionar campo opcional geralmente pode ser backward-compatible.

Consumidores devem evitar falhar por campos desconhecidos em responses.

---

# 138. Enum Evolution

Adicionar novo enum pode quebrar consumidores que assumem exhaustive switch.

Frontend deve possuir fallback seguro quando apropriado.

---

# 139. Deprecation

Se endpoint/campo for substituído:

```text
document

migrate consumers

remove only after controlled transition
```

---

# 140. Public API

API pública externa permanece:

```text
DEFERRED
```

conforme:

```text
APIQ-009
```

A `/api/v1` inicial é contrato da aplicação, não promessa de integração pública irrestrita.

---

# 141. Request Limits

Backend deve possuir limites para:

```text
JSON body size

file size

page size
```

Valores devem ser definidos por configuração/requisito.

---

# 142. Timeout

Requests long-running devem ser evitadas.

Operações demoradas podem migrar para jobs.

---

# 143. ROPA Export Threshold

Se export síncrono começar a exceder timeout aceitável:

```text
migrar para async job
```

sem alterar regras funcionais.

---

# 144. Cache Headers

Endpoints autenticados devem utilizar política de cache adequada.

Não permitir cache público de:

```text
ROPA

Dashboard

Activities

Suppliers

Systems

Files
```

---

# 145. Sensitive Download

Downloads privados devem evitar caching público inadequado.

---

# 146. Security Headers

Headers gerais pertencem principalmente à infraestrutura/security layer.

Consultar:

```text
09-SECURITY.md
```

---

# 147. Correlation

Responses de erro devem possuir:

```text
requestId
```

quando disponível.

Pode também existir:

```http
X-Request-Id
```

em responses de sucesso.

---

# 148. API Logging

Não registrar automaticamente:

```text
request body

response body
```

Aplicar:

```text
18-OBSERVABILITY.md
```

---

# 149. Audit

Nem toda request gera AuditLog.

Eventos auditáveis seguem:

```text
10-AUDIT.md
```

---

# 150. Exemplo — Create Activity

Request:

```http
POST /api/v1/processing-activities
Content-Type: application/json
```

```json
{
  "name": "Employee Payroll",
  "businessUnitId": "uuid"
}
```

Response:

```text
201 Created
```

```json
{
  "id": "uuid",
  "name": "Employee Payroll",
  "businessUnitId": "uuid",
  "status": "DRAFT",
  "complianceStatus": "PENDING",
  "createdAt": "2026-09-17T14:30:00.000Z",
  "updatedAt": "2026-09-17T14:30:00.000Z"
}
```

Campos mínimos finais dependem de:

```text
PAQ-001

DQ-009

PAQ-003
```

---

# 151. Exemplo — List Activities

```http
GET /api/v1/processing-activities?page=1&pageSize=20&sortBy=updatedAt&sortOrder=desc
```

Response:

```json
{
  "items": [
    {
      "id": "uuid",
      "name": "Employee Payroll",
      "status": "DRAFT",
      "complianceStatus": "PENDING",
      "updatedAt": "2026-09-17T14:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 1,
    "totalPages": 1
  }
}
```

---

# 152. Exemplo — Invalid Transition

```http
POST /api/v1/processing-activities/{id}/activate
```

Response:

```text
422 Unprocessable Entity
```

```json
{
  "error": {
    "code": "ACTIVITY_ACTIVATION_REQUIREMENTS_NOT_MET",
    "message": "Processing activity cannot be activated",
    "requestId": "req_123",
    "details": {
      "issues": [
        {
          "code": "LEGAL_BASIS_REQUIRED",
          "section": "legalBasis"
        }
      ]
    }
  }
}
```

---

# 153. Exemplo — Concurrent Update

Response:

```text
409 Conflict
```

```json
{
  "error": {
    "code": "CONCURRENT_MODIFICATION",
    "message": "The resource was modified by another operation",
    "requestId": "req_123"
  }
}
```

---

# 154. Exemplo — Cross-Tenant

Request autenticada em:

```text
Organization A
```

para ID pertencente à:

```text
Organization B
```

Response:

```text
404
```

```json
{
  "error": {
    "code": "PROCESSING_ACTIVITY_NOT_FOUND",
    "message": "Processing activity not found",
    "requestId": "req_123"
  }
}
```

Sem revelar:

```text
Organization B

resource name

resource owner
```

---

# 155. Contratos compartilhados

Backend deve centralizar contratos reutilizáveis quando adequado.

Exemplos:

```text
PaginationQuery

PaginationMeta

ApiErrorResponse

ValidationIssue

ResourceSummary

FileMetadata

SortOrder
```

---

# 156. Evitar Generic API Excessiva

Não criar abstração que force todos os recursos a terem:

```text
name

description

status

pagination

CRUD
```

se domínio não exigir.

---

# 157. Contract Tests

Integration/API tests devem validar contratos críticos.

---

# 158. Testar

```text
status code

response shape

enum values

pagination metadata

error code

tenant isolation

unknown fields behavior

concurrency

authorization
```

---

# 159. OpenAPI Contract Tests

Se OpenAPI for adotado:

```text
implementation
```

e:

```text
documented schema
```

devem permanecer alinhados.

---

# 160. Frontend Types

Evitar manter contratos manualmente divergentes.

Possibilidades futuras:

```text
generated types from OpenAPI

shared schema package
```

---

# 161. Nova Open Question

Adicionar:

```text
APIQ-019
```

**Question:**

```text
Tipos frontend da API serão gerados a partir de OpenAPI ou mantidos manualmente?
```

**Priority:**

```text
MEDIUM
```

---

# 162. Recomendação arquitetural

Se OpenAPI for fonte técnica confiável:

```text
OpenAPI
↓
generated API types
↓
frontend client
```

reduz divergência.

Mas decisão deve considerar tooling e fluxo da equipe.

---

# 163. API Client

Frontend deve centralizar:

```text
base URL

authentication transport

error parsing

requestId

network handling
```

---

# 164. Feature API Modules

Exemplo:

```text
features/
└── processing-activities/
    └── api/
        ├── createProcessingActivity.ts
        ├── getProcessingActivity.ts
        ├── listProcessingActivities.ts
        └── submitProcessingActivity.ts
```

Estrutura exata pode variar.

---

# 165. Prohibited Patterns

Não fazer:

```text
organizationId trusted from request body

status changed through generic PATCH

database model exposed directly

different error shape per endpoint

translated enum as API contract

unbounded list endpoints

arbitrary sort field passed to ORM

cross-tenant resource existence leaked

stack trace returned

storage key exposed unnecessarily

public file URL by default

ROPA editable through CRUD

frontend deciding Compliance Gate result

Dashboard formulas duplicated in frontend

different pagination format per feature

unknown write fields accepted through mass assignment
```

---

# 166. Open Questions adicionadas

Adicionar a:

```text
docs/12-OPEN-QUESTIONS.md
```

```text
APIQ-011
Single-resource response direto ou envelope `data`?
Priority: LOW

APIQ-012
Qual pageSize padrão e máximo?
Priority: LOW

APIQ-013
Qual formato para filtros multi-value?
Priority: LOW

APIQ-014
Query params desconhecidos serão rejeitados ou ignorados?
Priority: LOW

APIQ-015
Responses retornam somente IDs ou também resource summaries?
Priority: MEDIUM

APIQ-016
Recursos principais retornarão `allowedActions`?
Priority: MEDIUM

APIQ-017
`GET /me` retorna roles, permissions ou ambos?
Priority: MEDIUM

APIQ-018
Campos desconhecidos no body serão rejeitados ou removidos?
Priority: MEDIUM

APIQ-019
Frontend API types serão gerados por OpenAPI ou mantidos manualmente?
Priority: MEDIUM
```

---

# 167. Decisions que este documento respeita

```text
DEC-002
REST /api/v1

DEC-004
UUID

DEC-005
Backend authority

DEC-006
Structured Compliance Gate

DEC-007
ActivityStatus separado de ComplianceStatus

DEC-008
ROPA como projection/read model

DEC-012
Quick Create persiste recurso real

DEC-018
organizationId vem do contexto autenticado

DEC-019
cross-tenant references proibidas

DEC-020
preservação histórica

DEC-024
sensitive/minor não implica FAIL automático

DEC-025
international transfer explícita

DEC-028
Draft pode ser incompleto

DEC-029
operation codes estáveis

DEC-030
workflow por semantic actions
```

---

# 168. Acceptance Criteria

Este documento estará aplicado quando:

```text
[ ] /api/v1 utilizado

[ ] JSON usa camelCase

[ ] UUIDs consistentes

[ ] timestamps consistentes

[ ] enums usam códigos estáveis

[ ] collection response padronizado

[ ] paginação padronizada

[ ] sorting possui whitelist

[ ] filtros possuem contratos documentados

[ ] semantic actions usadas para workflow

[ ] error contract padronizado

[ ] tenant não é confiado ao body

[ ] resource references são tenant-safe

[ ] file metadata padronizado

[ ] export contract definido

[ ] concurrency strategy definida antes de implementação divergente

[ ] OpenAPI acompanha implementação

[ ] contract tests existem
```

---

# 169. Definition of Done

```text
[ ] contratos base implementados

[ ] pagination DTO implementado

[ ] sorting validation implementada

[ ] filter conventions implementadas

[ ] ApiErrorResponse implementado

[ ] timestamps padronizados

[ ] enums centralizados

[ ] semantic actions implementadas

[ ] tenant-safe resource lookup implementado

[ ] concurrency definida

[ ] file contract definido

[ ] export contract definido

[ ] /me contract definido

[ ] OpenAPI configurado

[ ] frontend client alinhado

[ ] API integration tests passando
```

---

# 170. Regra final

A API deve ser previsível o suficiente para que um desenvolvedor ou agente de IA consiga antecipar o contrato de um novo endpoint sem inventar um padrão novo.

Regra:

```text
same concept
↓
same contract
```

e:

```text
business action
↓
semantic endpoint
```

e nunca:

```text
generic CRUD
↓
bypass domain/workflow rules
```

---

# 171. Próximo documento

O próximo documento recomendado é:

```text
docs/21-DATA-DICTIONARY.md
```

Ele deve consolidar o significado de cada entidade e campo importante do sistema:

```text
ProcessingActivity

BusinessUnit

Purpose

PersonalDataCategory

CollectionSource

ProcessingOperation

DataSubjectCategory

Recipient

InternationalTransfer

RetentionPolicy

SecurityMeasure

LegalBasis

ConsentDocument

System

Supplier

ComplianceCheck

ActivityVersion

AuditLog
```

Para cada campo:

```text
name

type

required?

nullable?

business meaning

source

validation

versioned?

audited?

sensitive?

open question dependency
```

Isso cria uma referência única entre domínio, banco, API, frontend e IA antes da implementação do schema definitivo.