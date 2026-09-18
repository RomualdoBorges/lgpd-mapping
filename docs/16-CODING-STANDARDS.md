# Coding Standards

> **Documento:** Padrões de Código  
> **Status:** Draft  
> **Objetivo:** definir padrões obrigatórios para implementação por desenvolvedores humanos e agentes de IA, reduzindo inconsistências arquiteturais e facilitando manutenção, testes e revisão.


## Persistência e defesa tenant-aware aprovadas — 2026-09-18

DEC-044 (DBQ-001): Drizzle é o ORM/query builder aprovado. Queries ficam em repository/persistence; SQL específico é parametrizado, localizado e versionado. Migrations são revisáveis e reproduzíveis desde banco vazio. Não reduzir garantias PostgreSQL para acomodar o ORM.

DEC-045 (DBQ-008): validar relações/autorização na aplicação e garantir coerência tenant-bound por constraints PostgreSQL. Quando necessário, filhos e associações carregam organization_id NOT NULL, unicidades/FKs compostas e índices adequados; usar checks declarativos quando aplicáveis. FK somente por UUID não prova mesmo tenant. organization_id vem do contexto autorizado e não é campo livre para transferência. Preferir constraint declarativa simples a trigger equivalente.

DEC-046 (DBQ-009): RLS adicional nas tabelas tenant-bound, com contexto local à transação, todas as queries da operação no mesmo contexto, ausência de contexto negando acesso e nenhum tenant persistente na conexão. Considerar pooling. Runtime sem superuser/BYPASSRLS/propriedade das tabelas protegidas/alteração de policies; FORCE ROW LEVEL SECURITY quando adequado. Credencial de migration separada do runtime.

Defesa aprovada: Authentication → Membership → Permission → Scope → Repository tenant-aware → PostgreSQL constraints → PostgreSQL RLS. Nenhuma camada substitui outra. Scope de Business Unit continua na autorização da aplicação.

User, ExternalIdentity, Session e outras entidades globais não recebem organization_id artificial; sua proteção específica será definida posteriormente. Descoberta dos próprios Memberships exige caminho restrito, sem policy irrestrita. Estes detalhes não estão implementados nem decididos por exemplos deste documento.

Referências legadas a Prisma/Drizzle ou a RLS como alternativas pendentes são históricas: estas três questões estão decididas em DEC-044 a DEC-046. Políticas funcionais, autenticação e features posteriores continuam sujeitas às questões específicas. A topologia física de produção não é escolhida por este registro.

---

---

# 1. Princípios

O código deve priorizar:

```text
clareza

previsibilidade

segurança

testabilidade

baixo acoplamento

consistência

simplicidade
```

Evitar abstrações criadas apenas para parecerem arquiteturalmente sofisticadas.

---

# 2. Regra para agentes de IA

Antes de alterar código:

```text
1. Ler AGENTS.md

2. Ler docs/13-DECISIONS.md

3. Ler docs/12-OPEN-QUESTIONS.md

4. Ler documentação da feature

5. Ler arquivos relacionados existentes

6. Entender padrões já utilizados no módulo

7. Implementar a menor mudança necessária

8. Adicionar/atualizar testes

9. Executar validações

10. Revisar o diff
```

---

# 3. Regra de consistência

Código existente compatível com estas especificações deve ser seguido.

Não introduzir um segundo padrão sem necessidade.

Exemplo proibido:

```text
activities usa Repository Pattern

systems acessa ORM diretamente

suppliers cria outro padrão próprio
```

---

# 4. Linguagem

Código:

```text
English
```

Documentação funcional pode permanecer:

```text
Portuguese
```

---

# 5. Nomes de domínio

Utilizar nomes consistentes:

```text
ProcessingActivity

BusinessUnit

PersonalDataCategory

CollectionSource

ProcessingOperation

InternationalTransfer

LegalBasis

SecurityMeasure

RetentionPolicy

ComplianceCheck

ActivityVersion

AuditLog
```

Não criar sinônimos arbitrários.

Evitar:

```text
DataProcess

Treatment

ProcessData

LGPDProcess
```

quando o conceito oficial é:

```text
ProcessingActivity
```

---

# 6. TypeScript

Projeto deve utilizar:

```text
strict mode
```

quando tecnicamente viável desde o início.

---

# 7. `any`

Evitar:

```ts
const data: any = ...
```

Não utilizar `any` para contornar erro de tipagem.

Preferir:

```ts
unknown
```

quando o tipo realmente não é conhecido.

---

# 8. Type Assertions

Evitar:

```ts
value as SomeType
```

apenas para silenciar TypeScript.

Assertions devem possuir justificativa técnica clara.

---

# 9. Non-null Assertion

Evitar:

```ts
user!.id
```

Preferir validação explícita.

---

# 10. Tipos explícitos

Não é necessário declarar tipo quando TypeScript infere claramente.

Preferir:

```ts
const count = activities.length;
```

em vez de:

```ts
const count: number = activities.length;
```

---

# 11. Enums de domínio

Persistência deve utilizar códigos estáveis.

Exemplo:

```ts
type ProcessingOperationType =
  | 'USE'
  | 'UPDATE'
  | 'INTERNAL_TRANSFER'
  | 'EXTERNAL_TRANSFER'
  | 'INTERNATIONAL_TRANSFER'
  | 'DELETE';
```

A implementação concreta pode usar:

```text
union

enum

database enum
```

conforme decisões técnicas.

---

# 12. Labels

Nunca usar label visual como regra.

Errado:

```ts
if (operation === 'Transferência internacional') {
}
```

Correto:

```ts
if (operation === 'INTERNATIONAL_TRANSFER') {
}
```

---

# 13. Datas

Backend e banco devem trabalhar com timestamps consistentes.

Persistência:

```text
TIMESTAMPTZ
```

API:

```text
ISO 8601
```

Exemplo:

```text
2026-09-17T14:30:00.000Z
```

---

# 14. Timezone

Não persistir datas de evento importantes como strings locais ambíguas.

Evitar:

```text
17/09/2026 11:30
```

como formato interno.

Frontend é responsável pela apresentação localizada.

---

# 15. IDs

Entidades principais utilizam:

```text
UUID
```

conforme `DEC-004`.

---

# 16. UUID não é autorização

Nunca utilizar:

```text
"UUID é difícil de descobrir"
```

como controle de segurança.

Todo acesso continua exigindo:

```text
authentication

authorization

tenant scope
```

---

# 17. Naming — TypeScript

Classes/types:

```text
PascalCase
```

Exemplo:

```ts
ProcessingActivity
CreateProcessingActivity
ComplianceGateService
```

Variáveis/funções:

```text
camelCase
```

Exemplo:

```ts
processingActivity
organizationId
getProcessingActivity()
```

Constantes globais:

```text
UPPER_SNAKE_CASE
```

quando apropriado.

---

# 18. Naming — Database

Banco:

```text
snake_case
```

Exemplo:

```text
processing_activities

organization_id

business_unit_id

created_at
```

---

# 19. Naming — URLs

URLs:

```text
kebab-case
```

Exemplo:

```http
/api/v1/processing-activities
```

---

# 20. Naming — Files

Seguir convenção do framework.

Backend exemplo:

```text
create-processing-activity.use-case.ts

processing-activity.repository.ts

processing-activity.controller.ts
```

Frontend exemplo:

```text
ProcessingActivityForm.tsx

useProcessingActivity.ts

processingActivitySchema.ts
```

Não misturar padrões arbitrariamente.

---

# 21. Backend Architecture

Arquitetura:

```text
Modular Monolith
```

conforme `DEC-001`.

---

# 22. Módulos

Exemplo conceitual:

```text
src/
├── auth/
├── organizations/
├── users/
├── processing-activities/
├── systems/
├── suppliers/
├── compliance/
├── ropa/
├── dashboard/
├── audit/
└── files/
```

---

# 23. Boundaries

Cada módulo deve possuir ownership claro.

Evitar:

```text
processing-activities
```

acessando diretamente detalhes internos de:

```text
suppliers
```

sem contrato definido.

---

# 24. Dependências entre módulos

Preferir:

```text
public service/use case

explicit interface

domain identifier
```

em vez de acessar repositories internos de outro módulo arbitrariamente.

---

# 25. Shared

Não criar:

```text
shared/
```

como depósito genérico.

Um componente deve ir para shared apenas quando realmente for compartilhado e não pertencer claramente a um domínio.

---

# 26. Utils

Evitar:

```text
utils.ts
helpers.ts
common.ts
```

gigantes.

Preferir arquivos com propósito específico.

---

# 27. Controllers

Controllers devem ser finos.

Responsabilidades:

```text
receive request

extract validated input

invoke application use case

map response
```

---

# 28. Controller não contém regra de negócio

Errado:

```ts
@Post()
async create(@Body() dto: CreateActivityDto) {
  if (dto.hasSensitiveData) {
    // 40 lines of compliance logic
  }
}
```

A regra pertence à camada apropriada.

---

# 29. Use Cases

Operações importantes devem possuir intenção explícita.

Exemplos:

```text
CreateProcessingActivity

SubmitProcessingActivity

RunComplianceGate

ActivateProcessingActivity

StartActivityRevision

CompleteSystemMapping
```

---

# 30. Operações semânticas

Aplicar `DEC-030`.

Evitar:

```ts
updateActivity({
  status: 'ACTIVE',
});
```

Preferir:

```ts
activateProcessingActivity(...)
```

---

# 31. Domain Rules

Regras de domínio não devem depender de:

```text
React

HTTP

NestJS Request

Express

database-specific DTO
```

quando puderem ser expressas independentemente.

---

# 32. Repositories

Repository representa acesso necessário pelo domínio/aplicação.

Exemplo:

```ts
interface ProcessingActivityRepository {
  findById(...): Promise<ProcessingActivity | null>;
  save(...): Promise<void>;
}
```

---

# 33. Tenant-aware Repositories

Toda operação tenant-bound deve receber ou derivar contexto suficiente.

Exemplo conceitual:

```ts
findById({
  organizationId,
  activityId,
});
```

Evitar:

```ts
findById(activityId);
```

seguido de tenant validation tardia quando query tenant-scoped for possível.

---

# 34. Tenant Isolation

Aplicar:

```text
DEC-018
DEC-019
```

Tenant isolation deve existir desde a query.

---

# 35. Organization ID

Nunca confiar em:

```ts
dto.organizationId
```

como tenant da operação.

Utilizar:

```ts
authenticatedContext.organizationId
```

---

# 36. Cross-Tenant Association

Antes de criar relação:

```text
Activity → System

System → Supplier

Activity → Supplier

Activity → BusinessUnit
```

validar que os recursos pertencem ao mesmo tenant.

---

# 37. Authorization

Backend é autoridade.

Aplicar:

```text
DEC-005
```

---

# 38. Permission Checks

Preferir intenção semântica.

Exemplo:

```ts
authorization.require(
  context,
  'processing_activity:update',
  activity,
);
```

em vez de espalhar:

```ts
if (user.role === 'DPO') ...
```

---

# 39. Deny by Default

Ausência de permission deve resultar em acesso negado.

---

# 40. Scope

Permission e Scope são conceitos diferentes.

Exemplo:

```text
permission:
processing_activity:read

scope:
BUSINESS_UNIT
```

---

# 41. DTOs

DTO de entrada representa contrato HTTP.

Não utilizar DTO diretamente como entidade de domínio.

---

# 42. Mass Assignment

Nunca fazer:

```ts
Object.assign(entity, dto);
```

para entidades protegidas.

---

# 43. Mapping explícito

Preferir:

```ts
activity.rename(dto.name);
activity.changeBusinessUnit(dto.businessUnitId);
```

ou mapping controlado equivalente.

---

# 44. Campos protegidos

Campos como:

```text
organizationId

createdBy

status

complianceStatus

currentVersion
```

não devem ser alteráveis apenas porque apareceram no JSON.

---

# 45. Validation Layers

Separar:

```text
Transport Validation

Domain Validation

Workflow Validation

Compliance Validation
```

---

# 46. Transport Validation

Exemplos:

```text
UUID válido

string obrigatória

tamanho máximo

enum válido
```

---

# 47. Domain Validation

Exemplos:

```text
BusinessUnit pertence à Organization

System pertence ao mesmo tenant

Retention possui combinação estrutural válida
```

---

# 48. Workflow Validation

Exemplo:

```text
ARCHIVED
```

não pode executar determinada transição.

---

# 49. Compliance Validation

Não misturar Compliance Gate com validação básica do formulário.

---

# 50. Draft

Aplicar `DEC-028`.

Não exigir completude total para:

```text
save draft
```

---

# 51. Error Codes

Erros esperados devem possuir códigos estáveis.

Exemplos:

```text
PROCESSING_ACTIVITY_NOT_FOUND

BUSINESS_UNIT_NOT_FOUND

BUSINESS_UNIT_NOT_ALLOWED

INVALID_ACTIVITY_TRANSITION

LEGAL_BASIS_REQUIRED

CROSS_TENANT_REFERENCE

CONCURRENT_MODIFICATION
```

---

# 52. Error Message

Mensagem é para humanos.

Código é para comportamento programático.

Frontend deve depender de:

```text
error.code
```

e não de comparação textual.

---

# 53. HTTP Status

Usar semântica HTTP consistente.

Exemplos gerais:

```text
200 OK

201 Created

204 No Content

400 Bad Request

401 Unauthorized

403 Forbidden

404 Not Found

409 Conflict

422 Unprocessable Entity
```

A escolha exata por erro deve permanecer consistente na API.

---

# 54. IDOR

Quando necessário para evitar exposição de existência cross-tenant, recurso fora do tenant pode ser tratado como:

```text
404
```

conforme política da API.

---

# 55. Transactions

Usar transação quando uma operação de negócio exige atomicidade.

Exemplo:

```text
Activate Activity
+
Create Version
+
Persist Gate State
+
Audit Event
```

quando o modelo final exigir que sejam atômicos.

---

# 56. Não exagerar transações

Não abrir transações longas envolvendo:

```text
HTTP externo

upload remoto lento

processamento demorado
```

sem necessidade.

---

# 57. Audit

Aplicar `DEC-015` e `DEC-016`.

---

# 58. Audit dentro da operação crítica

Quando evento de auditoria for obrigatório para uma mutação crítica, preferir consistência transacional quando tecnicamente apropriado.

---

# 59. Audit Metadata

Registrar somente o necessário.

Evitar snapshots gigantes no AuditLog quando `ActivityVersion` já possui essa responsabilidade.

---

# 60. Não logar secrets

Proibido registrar:

```text
password

access token

refresh token

session token

authorization header

database credentials

storage credentials
```

---

# 61. Logging

Logs devem ser estruturados.

Exemplo conceitual:

```json
{
  "event": "processing_activity_created",
  "activityId": "...",
  "organizationId": "...",
  "actorId": "..."
}
```

---

# 62. Dados sensíveis nos logs

Evitar incluir:

```text
document contents

consent PDFs

full ROPA

security descriptions

personal contact information

request body inteiro
```

---

# 63. Database

Utilizar:

```text
PostgreSQL
```

conforme `DEC-003`.

---

# 64. Foreign Keys

Utilizar integridade referencial sempre que apropriado.

---

# 65. Tenant-aware Constraints

Estratégia aprovada: validação da aplicação + constraints compostas (DEC-045 / DBQ-008) e RLS adicional (DEC-046 / DBQ-009). Carregar organization_id nos filhos/associações quando necessário para coerência dos dois lados; FK simples por UUID não garante mesmo tenant. Contexto transacional local, runtime restrito e migrations com credencial separada. RLS não substitui integridade referencial ou permission/scope.

---

# 66. Indexes

Criar índices baseados em queries reais.

Tenant-bound queries normalmente devem considerar:

```text
organization_id
```

---

# 67. Unique Constraints

Não criar uniqueness global para recurso tenant-bound sem necessidade.

Exemplo potencial:

```text
organization_id + normalized_name
```

somente quando regra correspondente estiver aprovada.

---

# 68. Migrations

Migration já aplicada não deve ser editada arbitrariamente.

Criar nova migration.

---

# 69. Migration Naming

Nome deve explicar alteração.

Exemplo:

```text
create_processing_activities

add_activity_compliance_status
```

---

# 70. Destructive Migrations

Mudanças destrutivas exigem atenção especial.

Exemplos:

```text
DROP COLUMN

DROP TABLE

ALTER TYPE

NOT NULL em tabela populada
```

---

# 71. Soft Delete / Inactivation

Aplicar `DEC-020`.

Não utilizar hard delete para destruir histórico relevante.

---

# 72. Query de inativos

Não esconder registros históricos necessários.

Diferenciar:

```text
selectable resources
```

de:

```text
historical references
```

---

# 73. Versioning

Aplicar:

```text
DEC-014
DEC-015
```

---

# 74. Histórico

Não permitir que alteração de nome de:

```text
System

Supplier
```

corrompa interpretação histórica de versão publicada.

Estratégia final depende das decisões de versionamento.

---

# 75. ROPA

Aplicar `DEC-008`.

ROPA não possui CRUD independente de dados de tratamento.

---

# 76. Dashboard

Aplicar `DEC-021`.

Dashboard não possui números manualmente persistidos como fonte da verdade.

---

# 77. Compliance

Aplicar:

```text
DEC-006
DEC-023
DEC-024
```

---

# 78. Proibição

Não criar:

```ts
activity.isLgpdCompliant = true;
```

como substituto do Compliance Gate.

---

# 79. Legal Logic

Agentes de IA não devem inventar conclusões jurídicas.

Exemplo proibido:

```ts
if (purpose === 'marketing') {
  legalBasis = 'CONSENT';
}
```

A base legal deve vir do mapeamento/regra explicitamente aprovada.

---

# 80. International Transfer

Aplicar `DEC-025`.

Não inferir transferência apenas de:

```text
Supplier.country

System.type

SaaS
```

---

# 81. Sensitive Data

Presença de dados sensíveis não deve produzir automaticamente:

```text
FAIL
```

---

# 82. Minor Data

Presença de menores não deve produzir automaticamente:

```text
FAIL
```

---

# 83. Frontend Architecture

Utilizar organização:

```text
feature-first
```

---

# 84. Exemplo

```text
src/
├── app/
├── features/
│   ├── auth/
│   ├── processing-activities/
│   ├── mapping-wizard/
│   ├── systems/
│   ├── suppliers/
│   ├── compliance/
│   ├── ropa/
│   └── dashboard/
├── components/
└── lib/
```

A estrutura exata pode acompanhar o projeto existente.

---

# 85. Componentes

Componentes devem possuir responsabilidade clara.

Evitar componentes com:

```text
1000+ linhas

fetch

domain logic

validation

modal

table

form

authorization

todos misturados
```

---

# 86. Server State

Utilizar:

```text
TanStack Query
```

para estado vindo da API.

---

# 87. Client State

Utilizar estado React ou Zustand apenas quando apropriado.

Não duplicar server state no Zustand sem necessidade.

---

# 88. Form State

Utilizar:

```text
React Hook Form
```

quando adequado.

---

# 89. Validation Frontend

Zod pode validar UX/estrutura.

Backend continua autoridade.

---

# 90. Query Keys

Query keys devem considerar tenant quando usuário puder trocar Organization.

Exemplo:

```ts
[
  'processing-activities',
  organizationId,
  filters,
]
```

---

# 91. Organization Switch

Ao trocar Organization:

```text
invalidate/remove tenant-specific cache
```

para evitar dados do tenant anterior na UI.

---

# 92. Loading

Toda operação assíncrona deve considerar:

```text
loading

success

empty

error
```

---

# 93. Dashboard Errors

Erro de API não pode virar:

```text
0 pendências
```

---

# 94. Mutations

Evitar optimistic update em operações críticas como:

```text
Activate Activity

Run Compliance Gate

Resolve Review

Publish Version
```

sem garantia suficiente.

---

# 95. Forms

Campos devem possuir:

```text
label

validation feedback

error association

accessible description
```

quando necessário.

---

# 96. Accessibility

Status não pode depender apenas de:

```text
green

yellow

red
```

Utilizar:

```text
icon

text

label
```

---

# 97. Modals

Não colocar fluxos longos dentro de modal quando página dedicada for mais apropriada.

Quick Create pode utilizar modal quando simples.

---

# 98. Confirmation

Ações destrutivas ou de workflow relevante podem exigir confirmação conforme UX definida.

Exemplos:

```text
Archive

Deactivate

Discard Revision
```

---

# 99. API Client

Centralizar configuração HTTP.

Evitar chamadas:

```ts
fetch(...)
```

espalhadas arbitrariamente por componentes.

---

# 100. API Types

Tipos de API devem possuir estratégia consistente.

Não copiar manualmente o mesmo contrato em dezenas de locais.

---

# 101. OpenAPI

Backend deve manter contrato OpenAPI quando definido em `07-API.md`.

---

# 102. Security no Frontend

Nunca armazenar secrets da aplicação no bundle.

Variáveis frontend são públicas para o navegador.

---

# 103. Files

Uploads devem seguir `09-SECURITY.md`.

---

# 104. File IDs

Frontend deve trabalhar com identificadores de arquivo autorizados.

Não depender de URL pública permanente.

---

# 105. Signed URLs

Quando utilizadas, devem ser:

```text
short-lived

authorized

resource-scoped
```

---

# 106. Testing

Aplicar `11-TESTING.md`.

---

# 107. Unit Tests

Priorizar regras puras.

Exemplo:

```text
Compliance evaluator

workflow transition

domain validation

aggregation
```

---

# 108. Integration Tests

Usar para:

```text
database

repositories

transactions

tenant isolation

API behavior
```

---

# 109. Banco real em integração

Quando comportamento depende de PostgreSQL, preferir PostgreSQL real de teste.

Não assumir que SQLite reproduz:

```text
constraints

JSONB

transactions

Postgres types
```

---

# 110. E2E

Reservar para fluxos críticos.

Exemplo:

```text
Create Activity
↓
Wizard
↓
Submit
↓
Gate
↓
Activate
```

---

# 111. Cross-Tenant Tests

Obrigatórios em recursos tenant-bound.

Padrão:

```text
Organization A

Organization B
```

Tentar acessar recurso de B autenticado em A.

---

# 112. Authorization Tests

Para ação relevante, testar:

```text
allowed

denied

wrong scope

wrong tenant
```

---

# 113. Regression Tests

Bug corrigido deve receber teste quando tecnicamente razoável.

---

# 114. Test Naming

Nome deve explicar comportamento.

Preferir:

```ts
it('rejects a system from another organization')
```

em vez de:

```ts
it('test system validation')
```

---

# 115. Arrange / Act / Assert

Testes devem manter estrutura clara:

```text
Arrange

Act

Assert
```

sem necessidade de comentários quando código já for evidente.

---

# 116. Fixtures

Criar fixtures/factories reutilizáveis.

Exemplo:

```text
Organization A

Organization B

Collaborator

Manager

DPO

Business Unit A

Business Unit B
```

---

# 117. Mocking

Não mockar a própria regra que está sendo testada.

---

# 118. External Services

Mocks/fakes são adequados para:

```text
email

object storage

external identity provider
```

quando o teste não for especificamente de integração com o serviço.

---

# 119. Comments

Comentários devem explicar:

```text
why
```

e não repetir:

```text
what
```

---

# 120. Comentário ruim

```ts
// Increment version
version++;
```

---

# 121. Comentário útil

```ts
// Keep the published version unchanged while a revision is under review.
```

---

# 122. TODO

TODO deve possuir contexto.

Preferir:

```ts
// TODO(WFQ-008): define which version ROPA exposes during an active revision.
```

em vez de:

```ts
// TODO fix later
```

---

# 123. Open Questions no código

Quando implementação parcial depender de decisão futura, referenciar ID quando apropriado.

Exemplo:

```ts
// TODO(SYSQ-007): define whether pending systems block activation.
```

---

# 124. Não implementar TODO estrutural silenciosamente

Se questão bloquear comportamento correto, Story deve permanecer:

```text
BLOCKED
```

em vez de código temporário arbitrário.

---

# 125. Dead Code

Não manter código morto “para usar depois”.

Git já preserva histórico.

---

# 126. Feature Flags

Não adicionar sistema de feature flags sem necessidade real.

---

# 127. Generic Abstractions

Evitar abstração prematura como:

```text
GenericCrudService<T>

GenericRepository<T>

UniversalForm<T>

BaseEntityService
```

quando regras dos módulos são diferentes.

---

# 128. CRUD não é domínio

Mesmo entidades aparentemente simples podem possuir:

```text
tenant

authorization

audit

status

history
```

Não assumir CRUD genérico automaticamente.

---

# 129. Dependency Injection

Utilizar DI do NestJS de maneira previsível.

Evitar Service Locator ou acesso global a dependências.

---

# 130. Circular Dependencies

Evitar dependências circulares entre módulos.

Não utilizar:

```text
forwardRef
```

como solução padrão para arquitetura mal separada.

---

# 131. Events

Eventos internos podem ser utilizados quando trouxerem desacoplamento real.

Não introduzir Event Bus apenas por padrão arquitetural.

---

# 132. Queues

Aplicar somente quando necessário.

Possíveis casos:

```text
large export

email

long-running processing
```

---

# 133. Redis

Não introduzir Redis apenas para cache prematuro.

---

# 134. Cache

Se utilizado, cache deve possuir:

```text
tenant-aware key

invalidation strategy

authorization-safe behavior
```

---

# 135. Background Jobs

Job tenant-bound deve carregar explicitamente:

```text
organizationId

actor/context quando necessário
```

e nunca depender de tenant global.

---

# 136. Concurrency

Operações relevantes devem tratar concorrência conforme decisão da API.

Possíveis estratégias:

```text
version

updatedAt

ETag
```

Não implementar arbitrariamente antes da decisão correspondente.

---

# 137. Imports

Preferir imports previsíveis.

Evitar caminhos excessivamente frágeis:

```ts
../../../../../../something
```

Configurar aliases quando fizer sentido.

---

# 138. Barrel Files

Usar com moderação.

Evitar barrels que criem:

```text
circular dependency

imports implícitos

tree-shaking confuso
```

---

# 139. Functions

Funções devem possuir responsabilidade clara.

Se função exige dezenas de parâmetros, avaliar modelagem.

---

# 140. Boolean Parameters

Evitar:

```ts
updateActivity(activity, true, false, true);
```

Preferir objeto nomeado:

```ts
updateActivity(activity, {
  validateWorkflow: true,
  createVersion: false,
});
```

---

# 141. Magic Values

Evitar:

```ts
if (days > 30)
```

quando `30` possui significado de negócio não documentado.

Usar regra/configuração aprovada.

---

# 142. Magic Strings

Evitar:

```ts
if (status === 'pending-review-required')
```

espalhado pelo código.

Centralizar códigos de domínio.

---

# 143. Security Measures

Não guardar:

```text
password

secret

API key

private key
```

como `SecurityMeasure`.

SecurityMeasure representa descrição/metadado de controle, não secret.

---

# 144. Supplier Contacts

Não adicionar dados pessoais de contatos de Supplier sem requisito.

Aplicar minimização.

---

# 145. Personal Data

Aplicar `DEC-013`.

A plataforma não deve armazenar registros reais dos titulares.

---

# 146. Consent

Aplicar `DEC-026`.

Não implementar:

```text
individual consent acceptance
```

na V1.

---

# 147. Compliance Labels

Proibido usar automaticamente:

```text
LGPD compliant

100% compliant

certified

legally approved
```

para `ComplianceStatus.COMPLETE`.

---

# 148. Code Review

Revisão deve verificar pelo menos:

```text
business rules

architecture

authorization

tenant isolation

mass assignment

validation

transactions

audit

error handling

security

tests
```

---

# 149. Review antes de refactor

Quando agente de IA for solicitado a revisar:

```text
identificar problemas primeiro
```

antes de alterar código automaticamente.

---

# 150. Diff Size

Preferir PRs/diffs pequenos.

Uma Story grande deve ser dividida em Tasks.

---

# 151. Refactoring

Não misturar refactoring amplo com feature não relacionada.

---

# 152. Boy Scout Rule

Pequenas melhorias locais são aceitáveis quando:

```text
seguras

óbvias

testadas

não aumentam significativamente o escopo
```

---

# 153. Git Branches

Convenção sugerida:

```text
feature/STORY-019-create-processing-activity

fix/STORY-XXX-description

chore/TASK-XXX-description
```

Pode ser adaptada ao fluxo do projeto.

---

# 154. Commits

Preferir commits descritivos.

Exemplo:

```text
feat(activity): create processing activity draft
```

```text
test(activity): add cross-tenant creation tests
```

---

# 155. Não colocar IDs sensíveis em commit

Não incluir:

```text
tokens

credentials

customer data

private URLs
```

em mensagens ou arquivos.

---

# 156. Pre-Commit Checklist

```text
[ ] lint

[ ] typecheck

[ ] relevant tests

[ ] no secrets

[ ] no accidental debug logs

[ ] no unrelated files

[ ] migrations reviewed
```

---

# 157. Debugging

Remover antes do merge:

```ts
console.log(...)
debugger;
```

salvo logging intencional.

---

# 158. Feature Definition of Done

Código da feature deve atender:

```text
[ ] specification

[ ] decisions

[ ] business rules

[ ] domain boundaries

[ ] authorization

[ ] tenant isolation

[ ] validation

[ ] audit

[ ] tests

[ ] error handling

[ ] security requirements
```

---

# 159. Prohibited Patterns

Evitar explicitamente:

```text
business logic in React components

business logic in controllers

client-provided organizationId as authority

role checks scattered everywhere

mass assignment

hardcoded legal conclusions

hardcoded compliance certification

cross-tenant lookup without scope

public file URLs by default

secrets in logs

real data subjects stored by mapping feature

Activity history overwritten

ROPA as second editable source

Dashboard numbers manually maintained

one giant service for the entire application

GenericCrudService for every domain

microservices without approved requirement

Redis without demonstrated need

Kafka without demonstrated need

premature distributed architecture
```

---

# 160. Quando quebrar uma regra

Uma regra deste documento pode ser alterada quando houver razão técnica ou de produto válida.

Não quebrar silenciosamente.

Fluxo:

```text
Need identified
↓
Open Question / Technical Decision
↓
Decision
↓
Update docs
↓
Implementation
```

---

# 161. Checklist para agentes antes de gerar código

```text
[ ] sei qual Story/Task estou implementando

[ ] li AGENTS.md

[ ] li a feature spec

[ ] consultei Open Questions

[ ] consultei Decisions

[ ] dependências estão concluídas

[ ] item não está BLOCKED

[ ] entendi tenant scope

[ ] entendi permissions

[ ] entendi business rules

[ ] sei quais testes criar
```

---

# 162. Checklist depois de gerar código

```text
[ ] implementei somente o escopo solicitado

[ ] não inventei decisão estrutural

[ ] não criei acesso cross-tenant

[ ] não confiei em authorization frontend

[ ] não permiti mass assignment

[ ] erros possuem códigos adequados

[ ] audit foi considerado

[ ] testes foram adicionados

[ ] testes passam

[ ] lint passa

[ ] typecheck passa

[ ] build passa

[ ] diff foi revisado
```

---

# 163. Ordem de prioridade quando houver conflito

Seguir:

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
07-API.md
↓
03-DATABASE.md
↓
08-FRONTEND.md
↓
Feature Specification
↓
Existing Implementation
```

Se conflito relevante permanecer:

```text
não escolher silenciosamente
```

Registrar:

```text
Decision Required
```

---

# 164. Objetivo final

O código deve permitir que diferentes desenvolvedores e agentes de IA produzam implementações que pareçam ter sido feitas pela mesma equipe.

Os principais critérios são:

```text
consistência

segurança

clareza

rastreabilidade

testabilidade

manutenibilidade
```

---

# 165. Próximo documento

O próximo documento recomendado é:

```text
docs/17-ENVIRONMENTS-AND-DEPLOYMENT.md
```

Ele deve definir:

```text
local development

Docker

environment variables

development

test

staging

production

PostgreSQL

object storage

Redis quando necessário

migrations

seed

build

deploy

health checks

backups

rollback

CI/CD

secrets

observability
```

Esse documento evita que a infraestrutura e o processo de deploy sejam definidos de forma diferente por cada agente durante o desenvolvimento.