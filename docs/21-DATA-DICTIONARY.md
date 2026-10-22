# Data Dictionary

> **Documento:** Dicionário de Dados  
> **Status:** Draft  
> **Objetivo:** consolidar o significado funcional e técnico das principais entidades e campos da plataforma, servindo como referência comum para domínio, banco de dados, API, frontend, testes e desenvolvimento assistido por IA.


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

DEC-049: Role é catálogo global, sem organization_id, com code único e estável na plataforma. Membership/RoleAssignment preservam o contexto organizacional; scope e áreas pertencem à concessão. Isso não decide catálogo definitivo, ADMIN, OWN/PLATFORM, permissions, custom roles, administração pelo tenant, hierarquia ou autorização funcional. DBQ-005 permanece OPEN para outros catálogos.

Autorização no backend: identidade autenticada + Membership ativo no tenant solicitado + permission + scope + restrições do caso de uso. Não calcular o produto de todos os roles por todas as áreas. OWN, PLATFORM, ADMIN e PLATFORM_ADMIN não são aprovados por estas decisões.

| Papel | Leitura de Activities na primeira entrega | Leitura de ROPA na primeira entrega |
|---|---|---|
| COLLABORATOR | Business Units explicitamente autorizadas | Sem permissão inicial |
| MANAGER | Business Units explicitamente autorizadas | Mesmas Business Units |
| DPO | Organization do Membership | Organization do Membership |

A matriz trata apenas leitura. Escrita, Submit, aprovação, Gate e publicação continuam dependendo das questões respectivas. Dashboard, Systems e Suppliers permanecem fora da primeira entrega, sem exclusão implícita da V1.

OIDC com provedor gerenciado, fornecedor pendente (Auth0 somente candidato), User interno independente e sem união automática de identidades por e-mail. SSO corporativo será parte da V1 após a primeira entrega. Sessão server-side com cookie opaco; frontend não administra tokens. A sessão identifica User; cada request solicita Organization explicitamente e o backend valida autorização atual. Campos do body não transferem recursos entre tenants. A política temporal da Session está definida nas DEC-067/068 e o logout da Session atual na DEC-069.

DEC-067 mantém `expiresAt` como limite absoluto e adiciona conceitualmente `lastActivityAt` à Session para idle timeout. Impacto futuro: `last_activity_at TIMESTAMPTZ NOT NULL`, inicializado/backfilled por `created_at`. Não adicionar `absolute_expires_at`, refresh token, device ID, remember-me ou contador de renovação. DEC-068 veda sliding expiration; DEC-069 define revogação da Session atual no logout.

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

Este documento responde:

```text
O que cada entidade representa?

O que cada campo significa?

Qual campo é obrigatório?

Qual campo pode ser nulo?

Quem controla o campo?

O campo participa de versionamento?

O campo precisa de auditoria?

Existe alguma Open Question relacionada?
```

---

# 2. Regra de precedência

Este documento não substitui:

```text
13-DECISIONS.md

12-OPEN-QUESTIONS.md

05-BUSINESS-RULES.md

06-WORKFLOWS.md

02-DOMAIN.md
```

Se houver conflito:

```text
DECISIONS
↓
BUSINESS RULES
↓
WORKFLOWS
↓
DOMAIN
↓
DATA DICTIONARY
```

---

# 3. Status dos campos

Cada campo pode possuir:

```text
REQUIRED
OPTIONAL
CONDITIONAL
SYSTEM
OPEN
```

Significados:

```text
REQUIRED
obrigatório para existência válida naquele estágio

OPTIONAL
pode não possuir valor

CONDITIONAL
obrigatório dependendo de outra informação

SYSTEM
controlado pela aplicação

OPEN
depende de Open Question
```

---

# 4. Nullable ≠ Optional

Esses conceitos não são equivalentes.

Exemplo:

```text
campo ausente no PATCH
→ não alterar

campo = null
→ remover valor
```

quando `null` for permitido.

---

# 5. Campos técnicos comuns

Entidades persistidas normalmente possuem:

```text
id

organizationId

createdAt

updatedAt
```

quando aplicável.

---

# 6. `id`

```text
Type: UUID
Status: SYSTEM
Nullable: false
```

Significado:

```text
identificador técnico único da entidade
```

Regra:

```text
DEC-004
```

---

# 7. `organizationId`

```text
Type: UUID
Status: SYSTEM
Nullable: false
```

Significado:

```text
tenant proprietário do recurso
```

Regras:

```text
DEC-018
DEC-019
```

Não deve ser confiado ao request body como autoridade.

---

# 8. `createdAt`

```text
Type: TIMESTAMPTZ
Status: SYSTEM
Nullable: false
```

Significado:

```text
momento de criação do registro
```

---

# 9. `updatedAt`

```text
Type: TIMESTAMPTZ
Status: SYSTEM
Nullable: false
```

Significado:

```text
momento da última alteração persistida
```

Não utilizar automaticamente como:

```text
pendingSince
```

ou:

```text
lastReviewedAt
```

porque representam conceitos diferentes.

---

# 10. Organization

Representa:

```text
tenant organizacional da plataforma
```

É a principal fronteira de isolamento de dados.

---

## Campos

### `id`

```text
UUID
SYSTEM
```

---

### `name`

```text
Type: string
Status: REQUIRED
Nullable: false
```

Nome da organização.

Exemplo:

```text
Empresa Exemplo S.A.
```

---

### `status`

```text
Type: enum
Status: REQUIRED
Nullable: false
```

Possíveis conceitos:

```text
ACTIVE
INACTIVE
```

Comportamento de Organization inativa depende de:

```text
ORGQ-005
```

---

### `createdAt`

```text
TIMESTAMPTZ
SYSTEM
```

---

### `updatedAt`

```text
TIMESTAMPTZ
SYSTEM
```

---

# 11. BusinessUnit

Representa:

```text
área/unidade organizacional responsável ou relacionada às atividades de tratamento
```

Exemplos:

```text
Human Resources

Finance

Marketing

Legal

IT
```

---

## Campos

### `id`

```text
UUID
SYSTEM
```

---

### `organizationId`

```text
UUID
SYSTEM
```

---

### `name`

```text
Type: string
Status: REQUIRED
Nullable: false
```

Uniqueness depende de:

```text
ORGQ-001
```

---

### `parentId`

```text
Type: UUID
Status: OPEN
Nullable: true
```

Somente existir se hierarquia de BU for adotada.

Relacionado a:

```text
DQ-008
```

---

### `status`

```text
Type: enum
Status: REQUIRED
```

Possíveis:

```text
ACTIVE
INACTIVE
```

---

### `createdAt`

```text
TIMESTAMPTZ
SYSTEM
```

---

### `updatedAt`

```text
TIMESTAMPTZ
SYSTEM
```

---

# 12. User

Representa:

```text
identidade humana reconhecida pela plataforma
```

Não deve concentrar necessariamente roles e Organizations diretamente.

Isso depende do modelo de Membership.

---

## Campos

### `id`

```text
UUID
SYSTEM
```

---

### `externalIdentityId`

```text
Type: string
Status: CONDITIONAL
Nullable: true
```

Identificador no Identity Provider.

Depende da estratégia:

```text
AUTHQ-010
SECQ-001
```

---

### `email`

```text
Type: string
Status: REQUIRED
Nullable: false
```

Utilizado como identidade/apresentação conforme mecanismo de autenticação.

---

### `name`

```text
Type: string
Status: OPTIONAL
Nullable: true
```

Nome de apresentação.

---

### `status`

```text
Type: enum
Status: REQUIRED
```

Possíveis:

```text
ACTIVE
INACTIVE
```

---

# 13. OrganizationMembership

Representa:

```text
relação entre User e Organization
```

O Membership aprovado concentra o vínculo e possui concessões relacionadas (DEC-036 a DEC-038):

```text
roles

business unit scope

membership status
```

Decisão relacionada a:

```text
AUTHQ-005
AUTHQ-006
AUTHQ-007
AUTHQ-008
```

---

## Campos

### `id`

```text
UUID
SYSTEM
```

---

### `userId`

```text
UUID
REQUIRED
```

---

### `organizationId`

```text
UUID
REQUIRED
```

---

### `status`

```text
enum
REQUIRED
```

Possíveis:

```text
ACTIVE
INACTIVE
```

---

### `roleAssignments`

Relação / coleção aprovada: cada concessão pertence ao Membership e preserva Role + Scope (DEC-036 a DEC-038). Scope ORGANIZATION ou BUSINESS_UNIT; áreas explicitamente associadas à concessão, da mesma Organization. Não representar todas as áreas e todos os roles como listas independentes combinadas indiscriminadamente. OWN e PLATFORM permanecem sem aprovação.

Nomes físicos, constraints e mecanismos de integridade ainda dependem do slice e de DBQ-008/009.

---

# 14. ProcessingActivity

Representa:

```text
uma atividade de tratamento de dados pessoais executada pela organização
```

É o principal Aggregate Root do domínio.

---

## Campos

### `id`

```text
UUID
SYSTEM
```

---

### `organizationId`

```text
UUID
SYSTEM
```

---

### `name`

```text
Type: string
Status: REQUIRED
Nullable: false
```

Exemplo:

```text
Employee Payroll Processing
```

---

### `description`

```text
Type: text
Status: OPEN
Nullable: true
```

Obrigatoriedade depende de:

```text
PAQ-001
```

---

### `businessUnitId`

```text
Type: UUID
Status: REQUIRED / OPEN
```

Representa BU principal da Activity.

Detalhes dependem de:

```text
PAQ-003
```

---

### `responsibleUserId`

```text
Type: UUID
Status: OPEN
Nullable: true
```

Responsável funcional pela Activity.

Relacionado a:

```text
DQ-009
```

---

### `status`

```text
Type: enum
Status: SYSTEM
Nullable: false
```

Status de workflow.

Conjunto final depende de:

```text
WFQ-001
```

---

### `complianceStatus`

```text
Type: enum
Status: SYSTEM
Nullable: false
```

Separado de `status`.

Aplicar:

```text
DEC-007
```

Conceitos:

```text
PENDING
COMPLETE
BLOCKED
```

---

### `createdBy`

```text
Type: UUID
Status: SYSTEM
Nullable: false
```

Actor responsável pela criação.

---

### `createdAt`

```text
TIMESTAMPTZ
SYSTEM
```

---

### `updatedAt`

```text
TIMESTAMPTZ
SYSTEM
```

---

### `archivedAt`

```text
Type: TIMESTAMPTZ
Status: SYSTEM
Nullable: true
```

Somente preenchido se Activity for arquivada.

---

# 15. Purpose

Representa:

```text
finalidade declarada para a atividade de tratamento
```

Exemplos conceituais:

```text
Process employee payroll

Provide customer support

Manage recruitment process
```

Não representa base legal.

---

## Campos

### `id`

```text
UUID
SYSTEM
```

Se Purpose for entidade persistida.

---

### `activityId`

```text
UUID
REQUIRED
```

---

### `description`

```text
Type: text
Status: REQUIRED
Nullable: false
```

---

### Cardinalidade

Depende de:

```text
DQ-004
```

---

### Modelagem

Entidade própria vs estrutura interna depende de:

```text
DBQ-007
```

---

# 16. PersonalDataCategory

Representa:

```text
categoria de dados pessoais tratados
```

Exemplos iniciais do documento funcional:

```text
IDENTIFICATION

FINANCIAL

HEALTH

BIOMETRIC

IMAGE_VOICE

MINORS

POLITICAL_OPINION

OTHER
```

A taxonomia definitiva deve ser validada antes do seed final.

---

## Campos

### `id`

```text
UUID
SYSTEM
```

---

### `code`

```text
Type: string
Status: REQUIRED
Nullable: false
```

Código estável.

Exemplo:

```text
HEALTH
```

---

### `label`

```text
Type: string
Status: REQUIRED
```

Label de apresentação.

Exemplo:

```text
Dados de saúde
```

---

### `isSensitive`

```text
Type: boolean
Status: REQUIRED
```

Indica classificação estrutural utilizada pelo sistema.

Não significa irregularidade.

---

### `status`

```text
Type: enum
Status: REQUIRED
```

Permite preservar categorias históricas desativadas.

---

# 17. PersonalDataItem

Representa, caso adotado:

```text
item específico dentro de uma categoria de dados pessoais
```

Exemplo:

```text
CPF

RG

Salary

Bank account
```

Granularidade depende de:

```text
DQ-001
```

---

## Campos possíveis

```text
id

categoryId

code

label

status
```

Não implementar até a granularidade ser decidida.

---

# 18. ActivityPersonalData

Representa:

```text
associação entre ProcessingActivity e dados pessoais tratados
```

Pode apontar para:

```text
PersonalDataCategory

PersonalDataItem
```

dependendo de `DQ-001`.

---

## Campos

```text
id

organizationId

activityId

personalDataCategoryId

personalDataItemId?
```

---

# 19. DataSubjectCategory

Representa:

```text
categoria de titulares cujos dados são tratados
```

Exemplos:

```text
Employees

Customers

Candidates

Suppliers' contacts

Children / Adolescents
```

Catálogo definitivo depende de:

```text
DQ-007
```

---

## Campos

### `id`

```text
UUID
SYSTEM
```

---

### `code`

```text
string
REQUIRED
```

---

### `label`

```text
string
REQUIRED
```

---

### `isMinor`

```text
boolean
REQUIRED
```

Permite identificar estruturalmente categorias envolvendo menores.

---

### `status`

```text
enum
REQUIRED
```

---

# 20. ActivityDataSubject

Representa:

```text
associação entre Activity e categoria de titulares
```

Campos:

```text
id

organizationId

activityId

dataSubjectCategoryId
```

---

# 21. CollectionSource

Representa:

```text
origem pela qual os dados pessoais entram na atividade de tratamento
```

Pode representar:

```text
document

system

direct collection

other source
```

---

## Campos

### `id`

```text
UUID
SYSTEM
```

---

### `organizationId`

```text
UUID
SYSTEM
```

---

### `activityId`

```text
UUID
REQUIRED
```

---

### `sourceType`

```text
Type: enum
Status: REQUIRED
```

Valores definitivos ainda devem acompanhar regras do Wizard.

---

### `isDocument`

```text
Type: boolean
Status: REQUIRED
```

Pode ser substituído por `sourceType` se redundante.

Não manter ambos sem necessidade.

---

### `documentType`

```text
Type: string
Status: CONDITIONAL
Nullable: true
```

---

### `documentModel`

```text
Type: string
Status: CONDITIONAL
Nullable: true
```

---

### `collectionMoment`

```text
Type: string
Status: CONDITIONAL
Nullable: true
```

---

### `systemId`

```text
Type: UUID
Status: CONDITIONAL
Nullable: true
```

---

### `collectedDirectlyFromSubject`

```text
Type: boolean
Status: CONDITIONAL
Nullable: true
```

---

### Cardinalidade

Quantidade de CollectionSources por Activity depende de:

```text
MWQ-004
```

---

# 22. ProcessingOperation

Representa:

```text
operação executada sobre os dados pessoais
```

---

## `type`

Códigos definidos por:

```text
DEC-029
```

```text
USE

UPDATE

INTERNAL_TRANSFER

EXTERNAL_TRANSFER

INTERNATIONAL_TRANSFER

DELETE
```

---

## Campos

### `id`

```text
UUID
SYSTEM
```

---

### `organizationId`

```text
UUID
SYSTEM
```

---

### `activityId`

```text
UUID
REQUIRED
```

---

### `type`

```text
enum
REQUIRED
```

---

### `systemId`

```text
UUID
CONDITIONAL
Nullable: true
```

Cardinalidade depende de:

```text
SYSQ-006
```

---

### `businessUnitId`

```text
UUID
OPTIONAL / CONDITIONAL
```

Pode representar área executora da operação.

Semântica final deve acompanhar modelo de domínio.

---

# 23. Recipient

Representa:

```text
destinatário dos dados pessoais
```

Pode ser:

```text
internal

external
```

e eventualmente relacionado a Supplier.

---

## Campos

### `id`

```text
UUID
SYSTEM
```

---

### `organizationId`

```text
UUID
SYSTEM
```

---

### `activityId`

```text
UUID
REQUIRED
```

---

### `type`

```text
enum
REQUIRED
```

Conceitos possíveis:

```text
INTERNAL

EXTERNAL
```

---

### `name`

```text
string
CONDITIONAL
```

---

### `businessUnitId`

```text
UUID
CONDITIONAL
```

Para recipient interno quando aplicável.

---

### `supplierId`

```text
UUID
CONDITIONAL
```

Para recipient externo associado a Supplier quando modelo final exigir.

Relacionado a:

```text
SUPQ-004
```

---

# 24. InternationalTransfer

Representa:

```text
transferência internacional explicitamente declarada
```

Aplicar:

```text
DEC-025
```

---

## Campos

### `id`

```text
UUID
SYSTEM
```

---

### `organizationId`

```text
UUID
SYSTEM
```

---

### `activityId`

```text
UUID
REQUIRED
```

---

### `destinationCountry`

```text
Type: string / country code
Status: REQUIRED
```

Formato definitivo deve ser definido no catálogo.

---

### `mechanism`

```text
Type: enum/string
Status: CONDITIONAL
```

Requisitos dependem de:

```text
BRQ-003
```

---

### `recipientId`

```text
UUID
OPTIONAL / OPEN
```

Pode relacionar transferência ao destinatário específico.

---

### `supplierId`

```text
UUID
OPTIONAL / OPEN
```

Não inferir transferência pela existência deste campo.

---

# 25. RetentionPolicy

Representa:

```text
regra declarada de retenção dos dados da Activity
```

---

## Campos

### `id`

```text
UUID
SYSTEM
```

---

### `organizationId`

```text
UUID
SYSTEM
```

---

### `activityId`

```text
UUID
REQUIRED
```

---

### `duration`

```text
Type: integer
Status: REQUIRED / CONDITIONAL
```

---

### `unit`

```text
Type: enum
Status: REQUIRED / CONDITIONAL
```

Possíveis conceitos:

```text
DAYS

MONTHS

YEARS
```

Catálogo definitivo deve ser validado.

---

### `startEvent`

```text
Type: string / catalog reference
Status: REQUIRED / OPEN
```

Depende de:

```text
MWQ-005
```

---

### `notes`

```text
Type: text
Status: OPTIONAL
Nullable: true
```

---

### Granularidade

Uma política por Activity ou por conjunto de dados depende de:

```text
DQ-005
```

---

# 26. SecurityMeasure

Representa:

```text
medida de segurança declarada para proteção dos dados tratados
```

Não representa secret.

---

## Campos

### `id`

```text
UUID
SYSTEM
```

---

### `organizationId`

```text
UUID
SYSTEM
```

quando catálogo tenant-specific.

---

### `code`

```text
string
CONDITIONAL
```

Se catálogo estruturado existir.

---

### `name`

```text
string
REQUIRED
```

---

### `description`

```text
text
OPTIONAL
```

---

### `status`

```text
enum
CONDITIONAL
```

---

### Modelagem

Catálogo vs texto livre depende de:

```text
DQ-006
```

---

# 27. ActivitySecurityMeasure

Representa:

```text
associação entre Activity e SecurityMeasure
```

Campos conceituais:

```text
id

organizationId

activityId

securityMeasureId
```

Pode possuir descrição complementar caso modelo aprovado permita.

---

# 28. LegalBasis

Representa:

```text
base legal declarada para determinado tratamento
```

Não significa validação jurídica automática.

---

## Campos

### `id`

```text
UUID
SYSTEM
```

se bases forem entidades/catalog entries.

---

### `code`

```text
string
REQUIRED
```

Código estável.

---

### `label`

```text
string
REQUIRED
```

---

### `status`

```text
enum
REQUIRED
```

---

# 29. ActivityLegalBasis

Representa:

```text
aplicação de uma LegalBasis no contexto da Activity
```

---

## Campos

### `id`

```text
UUID
SYSTEM
```

---

### `organizationId`

```text
UUID
SYSTEM
```

---

### `activityId`

```text
UUID
REQUIRED
```

---

### `legalBasisId`

```text
UUID
REQUIRED
```

---

### `justification`

```text
text
CONDITIONAL
```

Especialmente relevante para cenários como legítimo interesse quando regra exigir.

---

### Associação

Pode ser por:

```text
Activity

Purpose

PersonalData grouping
```

dependendo de:

```text
DQ-003
```

---

### Cardinalidade

Depende de:

```text
DQ-002
```

---

# 30. ConsentDocument

Representa:

```text
documento/template/versionamento de consentimento relacionado à Activity
```

Aplicar:

```text
DEC-026
```

Não representa aceitação individual de um titular.

---

## Campos

### `id`

```text
UUID
SYSTEM
```

---

### `organizationId`

```text
UUID
SYSTEM
```

---

### `activityId`

```text
UUID
REQUIRED
```

---

### `fileId`

```text
UUID
REQUIRED
```

quando documento físico for anexado.

---

### `version`

```text
string
REQUIRED / CONDITIONAL
```

---

### `effectiveDate`

```text
date
REQUIRED / CONDITIONAL
```

---

### `method`

```text
string / enum
CONDITIONAL
```

Método de obtenção previsto.

---

### Modelagem

Entidade específica vs attachment tipado depende de:

```text
DBQ-006
```

---

# 31. System

Representa:

```text
sistema, ferramenta ou aplicação utilizada no fluxo de tratamento
```

É recurso reutilizável no tenant.

Aplicar:

```text
DEC-009
```

---

## Campos

### `id`

```text
UUID
SYSTEM
```

---

### `organizationId`

```text
UUID
SYSTEM
```

---

### `name`

```text
string
REQUIRED
```

Uniqueness depende de:

```text
SYSQ-010
```

---

### `description`

```text
text
OPTIONAL
```

---

### `type`

```text
string / enum
OPEN
```

Depende de:

```text
SYSQ-001
```

---

### `mappingStatus`

```text
enum
REQUIRED
```

Valores:

```text
PENDING

MAPPED
```

Aplicar:

```text
DEC-011
```

---

### `status`

```text
enum
REQUIRED
```

Valores:

```text
ACTIVE

INACTIVE
```

---

### `responsibleBusinessUnitId`

```text
UUID
OPEN
```

Depende de:

```text
SYSQ-003
```

---

### `mappingCompletedAt`

```text
TIMESTAMPTZ
OPEN
```

Pode ser necessário para rastrear conclusão.

---

### `pendingSince`

```text
TIMESTAMPTZ
OPEN
```

Importante para Dashboard.

Não utilizar `updatedAt` como substituto.

Relacionado a:

```text
DASHQ-007
DASHQ-008
```

---

# 32. System ↔ Activity

Relacionamento exato depende de:

```text
SYSQ-005
SYSQ-006
```

Pode ocorrer por:

```text
CollectionSource

ProcessingOperation
```

Evitar criar terceira relação genérica até decisão.

---

# 33. Supplier

Representa:

```text
fornecedor externo reutilizável dentro da Organization
```

Aplicar:

```text
DEC-010
```

---

## Campos

### `id`

```text
UUID
SYSTEM
```

---

### `organizationId`

```text
UUID
SYSTEM
```

---

### `name`

```text
string
REQUIRED
```

Uniqueness depende de:

```text
SUPQ-010
```

---

### `legalName`

```text
string
OPEN
```

---

### `tradeName`

```text
string
OPEN
```

---

### `taxIdentifier`

```text
string
OPEN
```

No Brasil pode representar CNPJ.

Depende de:

```text
SUPQ-001
```

---

### `country`

```text
country code
OPEN
```

Depende de:

```text
SUPQ-005
```

Não implica InternationalTransfer.

---

### `privacyRole`

```text
enum
OPEN
```

Não definir globalmente até:

```text
SUPQ-003
```

porque papel pode ser contextual por Activity.

---

### `description`

```text
text
OPTIONAL
```

---

### `mappingStatus`

```text
enum
REQUIRED
```

Valores:

```text
PENDING

MAPPED
```

---

### `status`

```text
enum
REQUIRED
```

Valores:

```text
ACTIVE

INACTIVE
```

---

### `pendingSince`

```text
TIMESTAMPTZ
OPEN
```

Relacionado a:

```text
DASHQ-007
DASHQ-008
```

---

# 34. SystemSupplier Relationship

Relacionamento entre:

```text
System
```

e:

```text
Supplier
```

depende de:

```text
SYSQ-004
```

Não assumir:

```text
1 System = 1 Supplier
```

---

# 35. ComplianceCheck

Representa:

```text
resultado estruturado de uma verificação do Compliance Gate
```

Aplicar:

```text
DEC-006
```

---

## Campos

### `id`

```text
UUID
SYSTEM
```

---

### `organizationId`

```text
UUID
SYSTEM
```

---

### `activityId`

```text
UUID
REQUIRED
```

---

### `type`

```text
enum
REQUIRED
```

Valores:

```text
LEGAL_BASIS

RETENTION

SECURITY_MEASURES

INTERNATIONAL_TRANSFER

SENSITIVE_DATA

MINOR_DATA
```

---

### `status`

```text
enum
REQUIRED
```

Valores:

```text
PASS

FAIL

REVIEW_REQUIRED

NOT_APPLICABLE
```

---

### `reasonCode`

```text
string
OPTIONAL
```

Código estável explicando resultado.

Exemplo:

```text
LEGAL_BASIS_MISSING
```

---

### `metadata`

```text
JSONB
OPTIONAL
```

Somente metadata estruturada necessária.

Não utilizar como depósito arbitrário.

---

### `evaluatedAt`

```text
TIMESTAMPTZ
REQUIRED
```

---

### `evaluatedBy`

```text
UUID / SYSTEM
CONDITIONAL
```

Pode representar:

```text
SYSTEM

human reviewer
```

Modelagem final depende de `CGQ-001`.

---

### `ruleVersion`

```text
string
OPEN
```

Relacionado a:

```text
CGQ-007
```

---

# 36. ComplianceRun

Entidade opcional para representar:

```text
uma execução completa do Compliance Gate
```

Depende de:

```text
CGQ-003
```

Se adotada, pode possuir:

```text
id

organizationId

activityId

activityVersionId?

status

startedAt

completedAt

triggeredBy

ruleVersion
```

Não implementar antes da decisão.

---

# 37. ActivityVersion

Representa:

```text
versão histórica imutável relevante da ProcessingActivity
```

Aplicar:

```text
DEC-014
DEC-015
```

---

## Campos

### `id`

```text
UUID
SYSTEM
```

---

### `organizationId`

```text
UUID
SYSTEM
```

---

### `activityId`

```text
UUID
REQUIRED
```

---

### `versionNumber`

```text
integer
REQUIRED
```

Semântica depende de:

```text
AUDQ-010
```

---

### `snapshot`

```text
JSONB / hybrid
OPEN
```

Estratégia depende de:

```text
DBQ-002
DBQ-003
```

---

### `createdBy`

```text
UUID
SYSTEM
```

---

### `createdAt`

```text
TIMESTAMPTZ
SYSTEM
```

---

### `publishedAt`

```text
TIMESTAMPTZ
OPEN
```

Pode existir caso conceito de versão publicada seja persistido explicitamente.

---

### `status`

```text
enum
OPEN
```

Pode ser necessário diferenciar:

```text
DRAFT_REVISION

PUBLISHED

REJECTED
```

Não criar até workflow/versioning final ser decidido.

---

# 38. Snapshot

Snapshot deve preservar interpretação histórica.

Pode precisar conter:

```text
Activity fields

BusinessUnit identity/name

Purposes

Personal Data

Subjects

Collection Sources

Operations

Systems

Suppliers

Recipients

Transfers

Retention

Security Measures

Legal Bases

Compliance state
```

Estratégia depende de:

```text
AUDQ-012
DBQ-002
DBQ-003
```

---

# 39. AuditLog

Representa:

```text
evento de auditoria de negócio
```

Aplicar:

```text
DEC-015
DEC-016
```

---

## Campos

### `id`

```text
UUID
SYSTEM
```

---

### `organizationId`

```text
UUID
SYSTEM
```

---

### `event`

```text
string
REQUIRED
```

Código estável.

Exemplo:

```text
PROCESSING_ACTIVITY_CREATED
```

---

### `actorType`

```text
enum
REQUIRED
```

Conceitos:

```text
USER

SYSTEM
```

---

### `actorId`

```text
UUID
CONDITIONAL
Nullable: true
```

Pode ser `null` para eventos puramente sistêmicos dependendo da modelagem.

---

### `resourceType`

```text
string
REQUIRED
```

Exemplo:

```text
PROCESSING_ACTIVITY
```

---

### `resourceId`

```text
UUID
REQUIRED
```

---

### `metadata`

```text
JSONB
OPTIONAL
```

Metadata mínima necessária.

Não utilizar para armazenar documento completo.

---

### `createdAt`

```text
TIMESTAMPTZ
SYSTEM
```

AuditLog não deve ser atualizado posteriormente.

---

# 40. File

Representa:

```text
metadata de arquivo privado armazenado fora do banco
```

---

## Campos

### `id`

```text
UUID
SYSTEM
```

---

### `organizationId`

```text
UUID
SYSTEM
```

---

### `originalName`

```text
string
REQUIRED
```

---

### `storageKey`

```text
string
SYSTEM
```

Não expor ao frontend sem necessidade.

---

### `contentType`

```text
string
REQUIRED
```

---

### `size`

```text
integer
REQUIRED
```

Bytes.

---

### `status`

```text
enum
SYSTEM
```

Pode futuramente representar:

```text
PENDING

AVAILABLE

REJECTED
```

dependendo da estratégia de upload/scanning.

---

### `createdBy`

```text
UUID
SYSTEM
```

---

### `createdAt`

```text
TIMESTAMPTZ
SYSTEM
```

---

# 41. ROPA

ROPA não é entidade editável.

Aplicar:

```text
DEC-008
```

Representa:

```text
projection/read model
```

derivada de Activities e seus relacionamentos.

---

# 42. Campos conceituais do ROPA

Pode projetar:

```text
activityId

activityName

businessUnit

purposes

personalData

dataSubjects

collectionSources

operations

systems

suppliers

recipients

internationalTransfers

retention

securityMeasures

legalBases

sensitiveDataFlag

minorDataFlag

complianceStatus

activityVersion

lastUpdatedAt
```

Granularidade depende de:

```text
ROPAQ-001
```

---

# 43. Dashboard

Dashboard também não é entidade de domínio editável.

Aplicar:

```text
DEC-021
```

É:

```text
read model
```

---

# 44. Dashboard Fields

Conceitos:

```text
mappingCompletion

pendingItems

oldPendingItems

sensitiveDataActivities

minorDataActivities

internationalTransferActivities

pendingSystems

pendingSuppliers
```

Fórmulas dependem de:

```text
DASHQ-002
DASHQ-003
DASHQ-006
DASHQ-007
DASHQ-010
DASHQ-011
```

---

# 45. Campos derivados

Campos derivados não devem possuir segunda fonte da verdade.

Exemplos:

```text
hasSensitiveData

hasMinorData

hasInternationalTransfer

mappingPercentage
```

Preferir derivar de dados estruturados quando possível.

---

# 46. `hasSensitiveData`

Derivado de:

```text
Activity Personal Data
↓
PersonalDataCategory.isSensitive
```

Não precisa ser boolean manual se query/read model puder calcular corretamente.

---

# 47. `hasMinorData`

Derivado de:

```text
Activity Data Subjects
↓
DataSubjectCategory.isMinor
```

Não inferir de texto livre.

---

# 48. `hasInternationalTransfer`

Derivado da existência explícita de:

```text
InternationalTransfer
```

Não derivar de:

```text
Supplier.country
System.type
```

---

# 49. Status vs Mapping Status

Não misturar:

```text
System.status
```

com:

```text
System.mappingStatus
```

Exemplo:

```text
status = ACTIVE
mappingStatus = PENDING
```

é válido.

O mesmo vale para Supplier.

---

# 50. Activity Status vs Compliance Status

Também são conceitos independentes.

Exemplo:

```text
activity.status = PENDING_REVIEW

activity.complianceStatus = PENDING
```

---

# 51. Campo versionado

Dados que alteram significado histórico da Activity devem ser considerados no snapshot/versionamento.

Exemplos:

```text
name

business unit

purpose

personal data

subjects

sources

operations

recipients

transfers

retention

security measures

legal bases
```

---

# 52. Dados de catálogo e versão

Quando Activity histórica referencia catálogo mutável, snapshot deve preservar significado histórico.

Exemplo:

```text
System name changed
```

não deve fazer versão antiga parecer ter utilizado nome novo se isso comprometer o histórico.

Relacionado a:

```text
AUDQ-012
```

---

# 53. Campos auditáveis

Nem toda alteração de coluna precisa gerar evento de AuditLog próprio.

AuditLog deve registrar eventos semanticamente relevantes.

Exemplo:

```text
ACTIVITY_CREATED

ACTIVITY_SUBMITTED

ACTIVITY_ACTIVATED

ACTIVITY_ARCHIVED

REVISION_STARTED

SYSTEM_CREATED

SYSTEM_MAPPING_COMPLETED

SUPPLIER_CREATED

ROPA_EXPORTED
```

---

# 54. Campos sensíveis da própria plataforma

Embora o sistema não armazene registros reais dos titulares, alguns dados internos podem ser sensíveis operacionalmente.

Exemplos:

```text
security measure descriptions

legal basis justification

supplier relationships

system inventory

ROPA exports

consent documents
```

Devem seguir:

```text
09-SECURITY.md
```

---

# 55. Dados proibidos no domínio de mapeamento

Aplicar:

```text
DEC-013
```

Não armazenar registros individuais como:

```text
customer CPF

employee health record

subject name

subject address

subject biometric template

subject consent acceptance
```

---

# 56. Exemplo correto

Registrar:

```text
PersonalDataCategory = IDENTIFICATION
```

ou, se granularidade for aprovada:

```text
PersonalDataItem = CPF
```

---

# 57. Exemplo incorreto

```json
{
  "cpf": "123.456.789-00"
}
```

---

# 58. Tenant-bound Entities

Devem possuir isolamento por Organization:

```text
BusinessUnit

OrganizationMembership

ProcessingActivity

CollectionSource

ProcessingOperation

Recipient

InternationalTransfer

RetentionPolicy

ActivityLegalBasis

ConsentDocument

System

Supplier

ComplianceCheck

ActivityVersion

AuditLog

File
```

e demais recursos organizacionais persistidos.

---

# 59. Global Catalogs

Alguns catálogos podem futuramente ser globais:

```text
LegalBasis

PersonalDataCategory

DataSubjectCategory

Country

RetentionUnit
```

Estratégia depende de:

```text
DBQ-005
```

---

# 60. Global Catalog Rule

Mesmo catálogo global não deve permitir que tenant altere definição para todos os outros tenants sem mecanismo administrativo explícito.

---

# 61. Stable Codes

Catálogos estruturados devem possuir:

```text
stable code
```

Exemplo:

```text
HEALTH
```

Label pode mudar:

```text
Dados de saúde
```

Código não deve mudar arbitrariamente.

---

# 62. Country

Se país for estruturado, preferir código estável internacional.

Exemplo conceitual:

```text
BR

US

DE
```

Não depender apenas do label.

---

# 63. Money

Nenhum campo monetário central foi identificado como requisito atual do domínio.

Não adicionar:

```text
contractValue

supplierCost

processingCost
```

sem requisito.

---

# 64. Contacts

Contatos de Suppliers permanecem:

```text
DEFERRED
```

conforme:

```text
SUPQ-013
```

Não criar tabela de contatos na V1 sem decisão nova.

---

# 65. Tags

Tags para ProcessingActivity dependem de:

```text
PAQ-005
```

Não implementar automaticamente.

---

# 66. Clone Metadata

Clone de Activity depende de:

```text
PAQ-004
```

Não adicionar campos específicos antes da decisão.

---

# 67. Review Fields

Campos como:

```text
reviewedBy

reviewedAt

approvedBy

approvedAt

rejectedBy

rejectedAt
```

dependem do workflow final:

```text
WFQ-003
AUTHQ-002
WFQ-004
WFQ-009
```

Não criar todos preventivamente.

---

# 68. Published Version

Campos como:

```text
publishedVersionId

currentRevisionId
```

dependem de:

```text
WFQ-007
WFQ-008
AUDQ-013
```

---

# 69. Pending Since

Dashboard necessita semântica de pendência temporal.

Não usar:

```text
updatedAt
```

automaticamente.

Pode ser necessário campo explícito:

```text
pendingSince
```

ou derivação por evento/audit.

Depende de:

```text
DASHQ-007
```

---

# 70. Last Updated

ROPA possui conceito de:

```text
last updated
```

Semântica depende de:

```text
ROPAQ-003
```

Pode significar:

```text
Activity updatedAt

published version date

last relevant mapping change
```

Não decidir silenciosamente.

---

# 71. Field Ownership

Campos devem possuir owner claro.

Exemplo:

```text
ProcessingActivity.name
→ Activity domain

ComplianceCheck.status
→ Compliance engine/reviewer

ActivityVersion.versionNumber
→ Versioning module

AuditLog.createdAt
→ Audit infrastructure

File.storageKey
→ File infrastructure
```

---

# 72. Frontend-owned Fields

Frontend não é fonte autoritativa para campos de domínio.

Pode controlar apenas estado transitório de UI:

```text
current wizard step

modal open

temporary unsaved input

table UI state
```

---

# 73. Server-owned Fields

Exemplos:

```text
id

organizationId

status transitions

complianceStatus

createdBy

createdAt

updatedAt

versionNumber

audit timestamps
```

---

# 74. Default Values

Defaults de negócio devem estar no backend/database conforme responsabilidade.

Frontend não deve ser única fonte de defaults importantes.

---

# 75. Boolean Defaults

Não utilizar:

```text
false
```

quando semanticamente significa:

```text
unknown
```

Exemplo:

```text
collectedDirectlyFromSubject
```

pode exigir:

```text
true
false
null
```

se ainda não respondido em Draft.

---

# 76. Draft Nullability

Como Draft pode ser incompleto:

```text
DEC-028
```

campos obrigatórios para Submit podem continuar `null` durante Draft.

---

# 77. Database NOT NULL

Não assumir que:

```text
required for ACTIVE
```

significa:

```text
database NOT NULL
```

na tabela principal.

Validação pode depender do estágio do workflow.

---

# 78. Exemplo

Legal Basis é obrigatória para conclusão do Gate.

Mas Activity Draft pode ainda não possuir Legal Basis.

Logo:

```text
absence is valid during Draft
```

---

# 79. Structural Constraints

Banco deve garantir invariantes independentes do workflow quando possível.

Exemplos:

```text
UUID references

same-tenant relationships where enforceable

valid enum values

unique technical identifiers
```

---

# 80. Workflow Constraints

Regras como:

```text
Activity cannot become ACTIVE without Compliance COMPLETE
```

pertencem principalmente ao domínio/aplicação.

---

# 81. Compliance Constraints

Regras como:

```text
Legal Basis missing
→ ComplianceCheck FAIL
```

pertencem ao Compliance Gate.

---

# 82. Data Dictionary Change Process

Quando campo novo for necessário:

```text
Requirement
↓
Check Open Questions
↓
Decision if structural
↓
Update Domain
↓
Update Data Dictionary
↓
Update Database
↓
Update API
↓
Update Frontend
↓
Update Tests
```

---

# 83. Prohibited Field Creation

Agentes não devem criar campos “úteis” sem requisito.

Exemplos:

```text
riskScore

complianceScore

aiConfidence

supplierRisk

legalApproved

isLgpdCompliant

estimatedFine

dataValue
```

---

# 84. Prohibited Generic Metadata

Evitar:

```text
metadata JSONB
```

como substituto de modelagem para campos conhecidos.

JSONB deve possuir finalidade clara.

---

# 85. JSONB permitido

Casos potenciais:

```text
AuditLog.metadata

ComplianceCheck.metadata

ActivityVersion.snapshot
```

com contratos e responsabilidades definidos.

---

# 86. Data Dictionary Matrix

Resumo:

| Entity | Tenant-bound | Version Relevant | Audit Relevant |
|---|---|---|---|
| Organization | Tenant root | No | Yes |
| BusinessUnit | Yes | Snapshot reference | Yes |
| User | No / identity | No | Yes |
| OrganizationMembership | Yes | No | Yes |
| ProcessingActivity | Yes | Yes | Yes |
| Purpose | Yes | Yes | Through Activity |
| PersonalDataCategory | Catalog | Snapshot reference | Catalog changes |
| DataSubjectCategory | Catalog | Snapshot reference | Catalog changes |
| CollectionSource | Yes | Yes | Through Activity |
| ProcessingOperation | Yes | Yes | Through Activity |
| Recipient | Yes | Yes | Through Activity |
| InternationalTransfer | Yes | Yes | Through Activity |
| RetentionPolicy | Yes | Yes | Through Activity |
| SecurityMeasure | Catalog/Tenant | Yes | Through Activity |
| LegalBasis | Catalog | Snapshot reference | Catalog changes |
| ConsentDocument | Yes | Yes | Yes |
| System | Yes | Snapshot reference | Yes |
| Supplier | Yes | Snapshot reference | Yes |
| ComplianceCheck | Yes | Yes | Yes |
| ActivityVersion | Yes | Immutable | Yes |
| AuditLog | Yes | No | Is audit |
| File | Yes | Reference | Yes |
| ROPA | Projection | Derived | Export audit |
| Dashboard | Projection | Derived | Optional read audit |

---

# 87. Open Questions críticas para schema

Antes de fechar schema definitivo, resolver principalmente:

```text
PRODQ-001

AUTHQ-005
AUTHQ-006
AUTHQ-007
AUTHQ-008

DQ-001
DQ-002
DQ-003
DQ-004
DQ-005
DQ-006
DQ-008
DQ-009

WFQ-001
WFQ-007
WFQ-008

DBQ-002
DBQ-003
DBQ-005
DBQ-006
DBQ-007
DBQ-008

SYSQ-002
SYSQ-004
SYSQ-005
SYSQ-006

SUPQ-001
SUPQ-002
SUPQ-003
SUPQ-004

CGQ-003
CGQ-005
CGQ-007
```

---

# 88. Regra para implementação do schema

Se campo estiver marcado:

```text
OPEN
```

e alterar significativamente estrutura do banco:

```text
STOP
```

Consultar:

```text
12-OPEN-QUESTIONS.md
```

Não selecionar opção silenciosamente.

---

# 89. Checklist para nova entidade

Antes de criar entidade:

```text
[ ] possui responsabilidade de domínio clara

[ ] não duplica entidade existente

[ ] tenant ownership definido

[ ] ID definido

[ ] lifecycle definido

[ ] status definido se necessário

[ ] relacionamentos definidos

[ ] versioning considerado

[ ] audit considerado

[ ] authorization considerado

[ ] API considerada

[ ] Open Questions verificadas
```

---

# 90. Checklist para novo campo

```text
[ ] significado claro

[ ] tipo definido

[ ] nullable definido

[ ] required stage definido

[ ] source of truth definido

[ ] owner definido

[ ] tenant implications consideradas

[ ] versioning considerado

[ ] audit considerado

[ ] API exposure considerada

[ ] sensitive data considerado

[ ] validation definida

[ ] Open Question verificada
```

---

# 91. Acceptance Criteria

Este documento estará aplicado quando:

```text
[ ] entidades principais possuem significado definido

[ ] campos principais possuem semântica definida

[ ] UUIDs consistentes

[ ] tenant ownership definido

[ ] Draft nullability considerada

[ ] workflow requirements não são confundidos com NOT NULL

[ ] derived fields possuem source of truth

[ ] Activity versioning está considerado

[ ] System/Supplier histórico está considerado

[ ] ComplianceCheck está estruturado

[ ] ROPA permanece projection

[ ] Dashboard permanece projection

[ ] dados reais dos titulares não são armazenados

[ ] campos OPEN não são implementados arbitrariamente
```

---

# 92. Definition of Done

O Data Dictionary pode ser considerado estável para implementação quando:

```text
[ ] Open Questions críticas de domínio resolvidas

[ ] cardinalidades definidas

[ ] catálogo de dados pessoais definido

[ ] catálogo de titulares definido

[ ] legal basis cardinality definida

[ ] purpose cardinality definida

[ ] retention granularity definida

[ ] System relationships definidos

[ ] Supplier relationships definidos

[ ] versioning strategy definida

[ ] schema alinhado com 03-DATABASE.md

[ ] API alinhada com 20-API-CONTRACTS.md

[ ] validation rules documentadas
```

---

# 93. Regra final

O Data Dictionary é a referência para responder:

```text
"What does this field mean?"
```

e não apenas:

```text
"What database type does this column use?"
```

O schema deve representar conceitos do domínio, não conveniências momentâneas da interface.

Quando houver dúvida entre:

```text
inventar um campo
```

e:

```text
consultar a especificação
```

a regra é:

```text
consultar a especificação
↓
verificar Open Question
↓
registrar Decision se necessário
↓
somente então implementar
```

---

# 94. Próximo documento

O próximo documento é:

```text
docs/22-VALIDATION-RULES.md
```

Ele deve consolidar:

```text
transport validation

field validation

draft validation

wizard validation

submit validation

workflow validation

compliance validation

cross-tenant validation

conditional validation

file validation

validation error codes

frontend/backend responsibilities
```

O objetivo será impedir que cada formulário, endpoint ou agente implemente regras de validação diferentes para o mesmo campo.