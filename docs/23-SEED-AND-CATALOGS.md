# Seed and Catalogs

> **Documento:** Seeds, Catálogos, Enums e Dados Iniciais  
> **Status:** Draft  
> **Objetivo:** definir como valores estruturados e dados de referência serão representados, inicializados, versionados e utilizados pela plataforma sem duplicação entre banco, backend e frontend.


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

# 1. Objetivo

A aplicação possui diversos valores estruturados:

```text
Processing Operations

Activity Statuses

Compliance Statuses

Compliance Check Types

Compliance Check Statuses

System Mapping Statuses

Supplier Mapping Statuses

Personal Data Categories

Data Subject Categories

Legal Bases

Retention Units

Countries

Roles

Audit Event Codes

Reason Codes
```

Esses valores não devem ser inventados separadamente em:

```text
database

backend

frontend

tests

seed

exports
```

---

# 2. Princípio fundamental

Cada conceito estruturado deve possuir:

```text
uma fonte autoritativa
```

Exemplo:

```text
HEALTH
```

é o código.

```text
Dados de saúde
```

é uma apresentação.

Nunca inverter:

```text
label → identifier
```

---

# 3. Stable Code

Catálogos devem utilizar códigos estáveis.

Exemplo:

```text
HEALTH
FINANCIAL
BIOMETRIC
```

Labels podem mudar.

Codes não devem mudar arbitrariamente.

---

# 4. Code vs Label

Exemplo:

```text
code:
HEALTH

label pt-BR:
Dados de saúde
```

API:

```json
{
  "code": "HEALTH"
}
```

Frontend:

```text
Dados de saúde
```

---

# 5. Não persistir label como identidade

Evitar relacionamentos baseados em:

```text
"Dados de saúde"
```

Preferir:

```text
HEALTH
```

ou ID de catálogo associado ao stable code.

---

# 6. Tipos de valores estruturados

Existem três categorias principais:

```text
Code Enum

Global Catalog

Tenant Catalog
```

---

# 7. Code Enum

Utilizar quando conjunto for:

```text
pequeno

estrutural

controlado pelo software

raramente alterado

não administrável pelo tenant
```

Exemplos:

```text
ProcessingOperationType

ComplianceCheckStatus

MappingStatus
```

---

# 8. Global Catalog

Utilizar quando valores possuírem:

```text
ID

code

label

metadata

status
```

e puderem evoluir sem alterar diretamente código de domínio.

Exemplos candidatos:

```text
PersonalDataCategory

DataSubjectCategory

LegalBasis

Country
```

Estratégia final depende de:

```text
DBQ-005
```

---

# 9. Tenant Catalog

Utilizar quando cada Organization puder possuir valores próprios.

Exemplos possíveis:

```text
SecurityMeasure

Purpose templates

custom personal data items
```

Somente implementar quando requisito permitir customização.

---

# 10. Não transformar tudo em tabela

Evitar tabelas como:

```text
activity_status

compliance_status

sort_order

mapping_status
```

apenas porque existem enums.

---

# 11. Não transformar tudo em enum

Também evitar enum rígido para conceitos que precisam de:

```text
labels

metadata

activation

future extension

localization
```

---

# 12. Decision Matrix

| Concept | Suggested Representation | Status |
|---|---|---|
| ProcessingOperationType | Code Enum | DECIDED |
| ComplianceCheckType | Code Enum | DECIDED |
| ComplianceCheckStatus | Code Enum | DECIDED |
| ComplianceStatus | Code Enum | DECIDED |
| MappingStatus | Code Enum | DECIDED |
| ActivityStatus | Code Enum | OPEN |
| Operational Status | Code Enum | Suggested |
| PersonalDataCategory | Catalog | OPEN |
| PersonalDataItem | Catalog | OPEN |
| DataSubjectCategory | Catalog | OPEN |
| LegalBasis | Catalog | OPEN |
| Country | Catalog | Suggested |
| RetentionUnit | Code Enum | Suggested |
| SecurityMeasure | Catalog/Tenant | OPEN |
| Roles | Code Enum / permission model | OPEN |

---

# 13. Processing Operation Types

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

# 14. Operation Labels

Labels pt-BR sugeridos:

```text
USE
→ Uso

UPDATE
→ Modificação

INTERNAL_TRANSFER
→ Transferência interna

EXTERNAL_TRANSFER
→ Transferência externa

INTERNATIONAL_TRANSFER
→ Transferência internacional

DELETE
→ Exclusão
```

Labels são apresentação e podem ser ajustados sem alterar codes.

---

# 15. Compliance Check Types

Aplicar:

```text
DEC-006
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

# 16. Compliance Check Status

Valores:

```text
PASS

FAIL

REVIEW_REQUIRED

NOT_APPLICABLE
```

---

# 17. Compliance Aggregate Status

Valores:

```text
PENDING

COMPLETE

BLOCKED
```

Semântica exata de agregação permanece dependente das questões do Compliance Gate.

---

# 18. Mapping Status

Aplicar:

```text
DEC-011
```

Valores:

```text
PENDING

MAPPED
```

Utilizado inicialmente por:

```text
System

Supplier
```

---

# 19. Operational Status

Para recursos reutilizáveis como:

```text
System

Supplier

BusinessUnit
```

conceitos iniciais:

```text
ACTIVE

INACTIVE
```

Não confundir com:

```text
mappingStatus
```

---

# 20. Activity Status

Conjunto proposto:

```text
DRAFT

MAPPING

PENDING_REVIEW

COMPLIANCE_PENDING

ACTIVE

UNDER_REVIEW

ARCHIVED
```

Mas conjunto final depende de:

```text
WFQ-001
```

Portanto:

```text
não fechar enum de banco antes da decisão
```

---

# 21. Roles

Papéis funcionais inicialmente identificados:

```text
COLLABORATOR

MANAGER

DPO
```

Existe proposta:

```text
ADMIN
```

dependente de:

```text
AUTHQ-003
```

---

# 22. Platform Role

Possível:

```text
PLATFORM_ADMIN
```

depende de:

```text
AUTHQ-009
```

Não criar automaticamente.

---

# 23. Role Labels

Exemplo:

```text
COLLABORATOR
→ Colaborador

MANAGER
→ Gestor

DPO
→ DPO

ADMIN
→ Administrador
```

---

# 24. Role ≠ Permission

Não utilizar role diretamente em todo código:

```ts
if (role === 'DPO') {
  // ...
}
```

quando regra puder ser representada por permission semântica.

Preferir:

```text
role
↓
permissions
↓
authorization
```

conforme:

```text
04-AUTHORIZATION.md
```

---

# 25. Personal Data Categories

O documento funcional original identifica categorias como:

```text
Identification

Financial

Health

Biometrics

Image / Voice

Minors

Political Opinion

Other
```

---

# 26. Seed inicial candidato

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

---

# 27. Atenção — Minors

Existe uma questão conceitual:

```text
MINORS
```

pode representar:

```text
tipo de dado
```

ou:

```text
categoria de titular
```

No modelo atual, menores também são representados por:

```text
DataSubjectCategory.isMinor
```

Não duplicar sem decisão.

---

# 28. Nova Open Question

Adicionar:

```text
CATQ-001
```

**Question:**

```text
"Minors" deve existir como PersonalDataCategory ou apenas como característica/categoria de DataSubject?
```

**Priority:**

```text
HIGH
```

---

# 29. Sensitive Classification

Categorias sensíveis devem possuir metadata estruturada.

Exemplo:

```json
{
  "code": "HEALTH",
  "isSensitive": true
}
```

---

# 30. Não inferir pelo label

Errado:

```text
if label contains "saúde"
→ sensitive
```

Correto:

```text
category.isSensitive
```

---

# 31. Sensitive Categories

Quais categorias do catálogo serão marcadas:

```text
isSensitive = true
```

deve ser validado contra o modelo jurídico adotado.

Não inventar classificação além do catálogo aprovado.

---

# 32. Personal Data Item

Se:

```text
DQ-001
```

decidir granularidade por item, poderá existir catálogo como:

```text
CPF

RG

FULL_NAME

EMAIL

PHONE

ADDRESS

BANK_ACCOUNT

SALARY
```

Essa lista não está aprovada.

Não usar como seed de produção ainda.

---

# 33. Custom Personal Data

Se Organization puder criar itens próprios, será necessário decidir:

```text
global catalog + tenant custom entries
```

---

# 34. Nova Open Question

Adicionar:

```text
CATQ-002
```

**Question:**

```text
Organizations poderão criar categorias/itens personalizados de dados pessoais?
```

**Priority:**

```text
MEDIUM
```

---

# 35. Data Subject Categories

O sistema precisa representar categorias de titulares.

Exemplos conceituais:

```text
EMPLOYEE

CUSTOMER

CANDIDATE

SUPPLIER_CONTACT

MINOR

OTHER
```

Lista ainda precisa ser validada.

---

# 36. Metadata

Cada categoria pode possuir:

```text
isMinor
```

Exemplo:

```json
{
  "code": "MINOR",
  "label": "Crianças e adolescentes",
  "isMinor": true
}
```

---

# 37. Open Question existente

Catálogo definitivo depende de:

```text
DQ-007
```

---

# 38. Custom Subject Categories

Nova decisão necessária caso tenant possa adicionar categorias.

---

# 39. Nova Open Question

Adicionar:

```text
DQ-007
```

**Question:**

```text
Organizations poderão criar categorias personalizadas de titulares?
```

**Priority:**

```text
MEDIUM
```

---

# 40. Legal Basis Catalog

Legal Basis deve utilizar catálogo estruturado.

Não armazenar apenas texto livre como:

```text
"consentimento"
```

---

# 41. Legal Basis Code

Cada base deve possuir:

```text
code

label

status
```

e eventualmente:

```text
metadata
```

---

# 42. Conteúdo jurídico

A lista definitiva de bases legais deve ser validada antes do seed de produção.

O agente não deve completar a lista por conhecimento geral sem decisão/documentação do projeto.

---

# 43. Consent Metadata

Catálogo pode identificar quando determinada base:

```text
mayRequireConsentDocument
```

somente se regra funcional aprovada justificar.

Não transformar interpretação jurídica em boolean automático sem decisão.

---

# 44. Legitimate Interest Metadata

Da mesma forma, não criar:

```text
requiresLIA = true
```

automaticamente até:

```text
BRQ-005
```

ser resolvida.

---

# 45. Legal Basis Cardinality

Não é responsabilidade do catálogo.

Depende de:

```text
DQ-002
DQ-003
```

---

# 46. Country Catalog

País deve possuir código estável.

Preferir padrão internacional reconhecido.

Formato conceitual:

```json
{
  "code": "BR",
  "name": "Brasil"
}
```

---

# 47. Country Code

Sugestão:

```text
ISO 3166-1 alpha-2
```

Exemplos:

```text
BR

US

DE

FR
```

---

# 48. Nova Open Question

Adicionar:

```text
CATQ-004
```

**Question:**

```text
Country utilizará ISO 3166-1 alpha-2 como código oficial?
```

**Priority:**

```text
LOW
```

---

# 49. Country Usage

Pode ser utilizado por:

```text
InternationalTransfer.destinationCountry

Supplier.country
```

Não significa que Supplier estrangeiro implique transferência.

Aplicar:

```text
DEC-025
```

---

# 50. Country Seed

Se catálogo completo for adotado, preferir dataset padronizado.

Não manter lista manual incompleta espalhada pelo código.

---

# 51. Retention Units

Valores candidatos:

```text
DAYS

MONTHS

YEARS
```

---

# 52. Possíveis extensões

Podem surgir:

```text
HOURS

WEEKS

INDEFINITE

UNTIL_EVENT
```

Não adicionar sem necessidade.

---

# 53. Nova Open Question

Adicionar:

```text
CATQ-005
```

**Question:**

```text
Quais unidades e formatos de retenção serão suportados na V1?
```

**Priority:**

```text
HIGH
```

Relacionado a:

```text
DQ-005
MWQ-005
```

---

# 54. Retention Start Event

Pode ser:

```text
free text

catalog

hybrid
```

Depende de:

```text
MWQ-005
```

---

# 55. Security Measures

Modelo depende de:

```text
DQ-006
```

Possibilidades:

```text
global catalog

tenant catalog

free text

hybrid
```

---

# 56. Não inventar checklist de segurança

Não criar automaticamente catálogo como:

```text
Encryption

MFA

Firewall

Backup

Antivirus
```

como requisitos jurídicos obrigatórios.

Podem futuramente ser opções de catálogo se aprovadas.

---

# 57. Collection Source Types

Wizard necessita códigos estruturados.

Conceitos iniciais:

```text
DOCUMENT

SYSTEM

OTHER
```

Mas modelo final deve acompanhar:

```text
MWQ-004
```

e regras de CollectionSource.

---

# 58. Nova Open Question

Adicionar:

```text
CATQ-006
```

**Question:**

```text
Qual será o catálogo definitivo de CollectionSourceType?
```

**Priority:**

```text
HIGH
```

---

# 59. Recipient Types

Conceitos iniciais:

```text
INTERNAL

EXTERNAL
```

---

# 60. Nova Open Question

Adicionar:

```text
CATQ-007
```

**Question:**

```text
RecipientType será somente INTERNAL/EXTERNAL ou terá categorias adicionais?
```

**Priority:**

```text
MEDIUM
```

---

# 61. International Transfer Mechanisms

O sistema precisa registrar mecanismo quando aplicável.

Catálogo definitivo depende de:

```text
BRQ-003
```

Não inventar enum jurídico antes da decisão.

---

# 62. Consent Method

Campo:

```text
ConsentDocument.method
```

pode exigir catálogo.

Exemplos não definitivos:

```text
DIGITAL

PAPER

OTHER
```

---

# 63. Nova Open Question

Adicionar:

```text
CATQ-008
```

**Question:**

```text
Consent method será catálogo estruturado, texto livre ou híbrido?
```

**Priority:**

```text
MEDIUM
```

---

# 64. Audit Event Codes

Audit events devem utilizar códigos estáveis.

Exemplos já previstos:

```text
PROCESSING_ACTIVITY_CREATED

PROCESSING_ACTIVITY_UPDATED

PROCESSING_ACTIVITY_SUBMITTED

PROCESSING_ACTIVITY_ACTIVATED

PROCESSING_ACTIVITY_ARCHIVED

ACTIVITY_REVISION_STARTED

SYSTEM_CREATED

SYSTEM_UPDATED

SYSTEM_MAPPING_COMPLETED

SYSTEM_DEACTIVATED

SUPPLIER_CREATED

SUPPLIER_UPDATED

SUPPLIER_MAPPING_COMPLETED

SUPPLIER_DEACTIVATED

COMPLIANCE_RUN_EXECUTED

ROPA_EXPORTED
```

---

# 65. Audit Events não são catálogo de banco

Podem ser constantes estáveis no código.

---

# 66. Reason Codes

Compliance e validação devem utilizar reason codes estáveis.

Exemplos:

```text
LEGAL_BASIS_MISSING

RETENTION_MISSING

SECURITY_MEASURES_MISSING

TRANSFER_MECHANISM_MISSING

SENSITIVE_DATA_REVIEW_REQUIRED

MINOR_DATA_REVIEW_REQUIRED
```

---

# 67. Reason Code ≠ Message

Code:

```text
LEGAL_BASIS_MISSING
```

Frontend:

```text
Base legal não informada.
```

---

# 68. Reason Codes versionados

Se comportamento do Gate mudar significativamente, considerar:

```text
ruleVersion
```

Relacionado a:

```text
CGQ-007
```

---

# 69. Seed Types

Separar:

```text
System Seed

Reference Seed

Development Seed

Test Fixture
```

---

# 70. System Seed

Contém dados indispensáveis ao funcionamento técnico.

Exemplo:

```text
global catalogs
```

quando aplicável.

---

# 71. Reference Seed

Contém valores funcionais padronizados.

Exemplos:

```text
countries

legal bases

personal data categories
```

quando aprovados.

---

# 72. Development Seed

Pode criar dados fictícios para desenvolvimento.

Exemplo:

```text
Example Organization

Example Business Units

Example Activities

Example Systems

Example Suppliers
```

---

# 73. Production Seed

Não deve criar:

```text
demo organization

demo users

fake customer activities

default passwords
```

---

# 74. Test Fixtures

Testes devem utilizar factories/fixtures próprias.

Não depender do development seed para funcionar.

---

# 75. Idempotency

Seeds estruturais devem ser idempotentes.

Executar duas vezes:

```text
seed
seed
```

não deve duplicar catálogo.

---

# 76. Upsert

Pode utilizar:

```text
stable code
```

como chave lógica para sincronização de catálogos.

Exemplo conceitual:

```text
upsert where code = HEALTH
```

---

# 77. Seed não deve apagar automaticamente

Se valor sair da lista atual:

```text
não DELETE automaticamente
```

porque histórico pode referenciá-lo.

Preferir:

```text
status = INACTIVE
```

quando aplicável.

---

# 78. Catalog Lifecycle

Estados sugeridos:

```text
ACTIVE

INACTIVE
```

---

# 79. Inactive Catalog Entry

Pode continuar aparecendo em:

```text
historical Activity

ActivityVersion

ROPA historical view
```

---

# 80. New Mapping

Item inativo normalmente não deve estar disponível para nova seleção.

---

# 81. Catalog Renaming

Alterar label:

```text
allowed
```

quando significado permanecer o mesmo.

---

# 82. Code Renaming

Alterar code:

```text
avoid
```

Pode quebrar:

```text
API

database

exports

tests

audit

historical snapshots
```

---

# 83. Semantic Change

Se significado mudar substancialmente:

```text
create new code
↓
inactivate old code
```

em vez de reutilizar code antigo.

---

# 84. Catalog Versioning

Não é necessário criar versão formal para todo catálogo.

Mas mudanças devem ser rastreáveis via:

```text
migration

seed change

Git history
```

e AuditLog se catálogo for tenant-editable.

---

# 85. Global Catalog Modification

Mudança global deve ocorrer via:

```text
versioned migration/seed
```

não por usuário comum.

---

# 86. Tenant Catalog Modification

Se customização for permitida:

```text
authorization

audit

tenant isolation

inactive lifecycle
```

são obrigatórios.

---

# 87. Localization

Stable code não contém idioma.

Correto:

```text
HEALTH
```

Não:

```text
DADOS_SAUDE
```

quando code for contrato técnico internacionalizado.

---

# 88. Translation Strategy

Labels podem inicialmente existir:

```text
pt-BR
```

porque produto é voltado ao contexto brasileiro.

Estratégia de i18n permanece responsabilidade do frontend/produto.

---

# 89. Seed Labels

Pode existir label inicial no banco quando necessário.

Mas frontend não deve depender de hardcoded duplicado se catálogo for servido pela API.

---

# 90. Catalog API

Catálogos persistidos podem possuir endpoint:

```http
GET /api/v1/catalogs/personal-data-categories
```

ou endpoints específicos.

Estrutura definitiva deve evitar endpoint genérico excessivo.

---

# 91. Possível estrutura

```http
GET /api/v1/personal-data-categories

GET /api/v1/data-subject-categories

GET /api/v1/legal-bases

GET /api/v1/countries
```

---

# 92. Read-only Global Catalogs

Frontend normalmente possui apenas:

```text
READ
```

para catálogos globais.

---

# 93. Catalog Response

Exemplo:

```json
{
  "items": [
    {
      "code": "HEALTH",
      "label": "Dados de saúde",
      "isSensitive": true
    }
  ]
}
```

---

# 94. Catalog ID vs Code

Se catálogo persistido possuir UUID:

```text
id
```

pode ser usado em foreign keys.

Mas:

```text
code
```

continua sendo identificador semântico estável.

---

# 95. Nova Open Question

Adicionar:

```text
CATQ-009
```

**Question:**

```text
APIs de catálogo usarão UUID, stable code ou ambos como identificadores externos?
```

**Priority:**

```text
MEDIUM
```

---

# 96. Enum Source

Enums de código devem possuir definição autoritativa no backend/domain.

Frontend deve evitar duplicação manual quando possível.

Relacionado a:

```text
APIQ-019
```

---

# 97. OpenAPI

Se tipos forem gerados:

```text
backend enum
↓
OpenAPI
↓
frontend generated types
```

é fluxo preferível.

---

# 98. Database Enum

Não utilizar PostgreSQL ENUM automaticamente para todo enum de aplicação.

Considerar impacto em:

```text
migration

adding values

rollback

portability

testing
```

---

# 99. Nova Open Question

Adicionar:

```text
CATQ-010
```

**Question:**

```text
Enums estruturais serão PostgreSQL ENUM, CHECK constraints ou strings validadas pela aplicação?
```

**Priority:**

```text
MEDIUM
```

Relacionado a:

```text
DBQ-001
```

---

# 100. Seed Execution

Fluxo recomendado:

```text
database migration
↓
structural/reference seed
↓
application startup
```

Não executar seed completo automaticamente em toda inicialização da aplicação.

---

# 101. Production Deployment

Seed/migration deve ser etapa controlada do release.

Aplicar:

```text
17-ENVIRONMENTS-AND-DEPLOYMENT.md
```

---

# 102. Seed Failure

Se seed estrutural falhar:

```text
deployment should fail
```

antes de considerar release saudável.

---

# 103. Transaction

Seeds relacionados podem executar em transaction quando suportado e seguro.

---

# 104. Development Seed Command

Projeto deve possuir comando conceitual:

```text
db:seed:dev
```

---

# 105. Reference Seed Command

Projeto pode possuir:

```text
db:seed
```

para valores estruturais aprovados.

Nomes exatos dependem do package manager/tooling.

---

# 106. Reset Database

Somente ambientes locais/test.

Comando destrutivo nunca deve ser reutilizado automaticamente em produção.

---

# 107. Environment Guard

Scripts destrutivos devem recusar execução quando:

```text
APP_ENV = production
```

ou mecanismo equivalente.

---

# 108. Development Dataset

Development seed deve ser pequeno.

Exemplo conceitual:

```text
1 Organization

3 Business Units

3 Users

3 Activities

2 Systems

2 Suppliers
```

Quantidade é ilustrativa, não requisito.

---

# 109. Development Scenarios

Fixtures devem representar:

```text
Draft Activity

Activity with sensitive data

Activity with minors

Activity with international transfer

Pending System

Mapped System

Pending Supplier

Mapped Supplier
```

---

# 110. Não usar dados reais

Development/Test seeds não devem conter:

```text
real customer names

real employee information

real ROPA

real legal documents

production exports
```

---

# 111. Test Factories

Factories devem permitir:

```text
organization A

organization B

users with different roles

cross-tenant resources

activity statuses

compliance statuses
```

para testes de segurança.

---

# 112. Deterministic Tests

Test fixtures devem ser previsíveis.

Evitar depender de:

```text
current production catalog state
```

sem fixture controlada.

---

# 113. Catalog Cache

Catálogos pequenos podem futuramente ser cacheados.

Não introduzir Redis apenas por isso.

Aplicar:

```text
INFRAQ-003
```

---

# 114. Frontend Cache

TanStack Query pode cachear catálogos.

Query key deve considerar contexto quando catálogo for tenant-specific.

---

# 115. Global Catalog Query

Exemplo:

```text
['personal-data-categories']
```

se realmente global.

---

# 116. Tenant Catalog Query

Exemplo:

```text
['security-measures', organizationId]
```

se tenant-specific.

---

# 117. Organization Switch

Ao trocar Organization:

```text
tenant-specific catalog cache
```

deve ser invalidado/isolado.

---

# 118. Catalog Sorting

Frontend não deve assumir ordem de inserção.

Catálogo pode possuir:

```text
displayOrder
```

se ordem funcional for necessária.

---

# 119. Nova Open Question

Adicionar:

```text
CATQ-011
```

**Question:**

```text
Catálogos configuráveis terão `displayOrder` persistido?
```

**Priority:**

```text
LOW
```

---

# 120. OTHER

Categorias com:

```text
OTHER
```

podem exigir descrição complementar.

Exemplo:

```text
category = OTHER
↓
otherDescription required
```

---

# 121. Nova Open Question

Adicionar:

```text
CATQ-012
```

**Question:**

```text
Seleções `OTHER` exigirão descrição textual obrigatória?
```

**Priority:**

```text
MEDIUM
```

---

# 122. Catalog Metadata

Evitar metadata genérica sem contrato.

Preferir campos explícitos:

```text
isSensitive

isMinor

status

displayOrder
```

em vez de:

```json
{
  "metadata": {
    "whatever": true
  }
}
```

---

# 123. Seed Ownership

Cada catálogo deve possuir owner técnico claro.

Exemplo:

```text
ProcessingOperationType
→ Processing Activity domain

ComplianceCheckType
→ Compliance module

LegalBasis
→ Compliance/domain catalog

Country
→ Shared reference catalog
```

---

# 124. Seed Review

Mudanças em catálogo jurídico ou de compliance devem receber revisão apropriada.

Agente de IA não deve adicionar valor por conveniência de implementação.

---

# 125. Catalog Removal

Nunca remover valor histórico sem análise de referências.

Fluxo:

```text
search references
↓
assess historical impact
↓
inactivate
↓
migrate only if necessary
```

---

# 126. Catalog Merge

Se duas categorias forem consideradas duplicadas:

```text
do not simply rename both to same code
```

É necessário plano de migração.

---

# 127. Default Selection

Evitar valores pré-selecionados em campos juridicamente relevantes.

Exemplo:

```text
Legal Basis
```

não deve possuir default apenas para acelerar formulário.

---

# 128. Safe Defaults

Defaults técnicos podem existir quando sem ambiguidade.

Exemplo:

```text
System.mappingStatus = PENDING
```

em Quick Create.

---

# 129. Unsafe Defaults

Evitar:

```text
LegalBasis = CONSENT

InternationalTransfer = false

SensitiveData = false
```

quando usuário ainda não respondeu e `false` significaria conclusão funcional.

---

# 130. Unknown vs False

Quando informação ainda não foi respondida:

```text
UNKNOWN
```

ou ausência pode ser semanticamente diferente de:

```text
false
```

---

# 131. Seed Migration

Mudança de seed deve ser compatível com registros existentes.

Exemplo:

```text
rename label
```

é simples.

Mas:

```text
change stable code
```

exige migração.

---

# 132. Catalog Snapshot

ActivityVersion pode precisar preservar:

```text
code

label at the time

relevant metadata
```

Relacionado a:

```text
AUDQ-012
```

---

# 133. ROPA Export

Exports históricos não devem mudar retroativamente apenas porque label atual do catálogo mudou, quando snapshot histórico for exigido.

---

# 134. API Validation

API deve rejeitar códigos inexistentes/inativos para novos registros.

Exemplo:

```text
INVALID_PERSONAL_DATA_CATEGORY
```

---

# 135. UI Rendering

Frontend deve tratar código desconhecido de forma segura.

Exemplo:

```text
UNKNOWN_CODE
```

não deve quebrar tela inteira.

Pode exibir fallback técnico controlado.

---

# 136. Catalog Tests

Testar:

```text
seed idempotency

unique stable codes

active/inactive behavior

API catalog responses

invalid code rejection

historical inactive references

tenant isolation for tenant catalogs
```

---

# 137. Seed Tests

CI deve conseguir:

```text
create empty database
↓
run migrations
↓
run reference seed
↓
run reference seed again
↓
verify no duplicates
```

---

# 138. Production Safety Test

Scripts de development seed devem possuir proteção contra produção.

---

# 139. Open Questions adicionadas

Adicionar a:

```text
docs/12-OPEN-QUESTIONS.md
```

```text
CATQ-001
"Minors" deve existir como PersonalDataCategory ou apenas como característica/categoria de DataSubject?
Priority: HIGH

CATQ-002
Organizations poderão criar categorias/itens personalizados de dados pessoais?
Priority: MEDIUM

DQ-007
Organizations poderão criar categorias personalizadas de titulares?
Priority: MEDIUM

CATQ-004
Country utilizará ISO 3166-1 alpha-2?
Priority: LOW

CATQ-005
Quais unidades e formatos de retenção serão suportados na V1?
Priority: HIGH

CATQ-006
Qual será o catálogo definitivo de CollectionSourceType?
Priority: HIGH

CATQ-007
RecipientType será somente INTERNAL/EXTERNAL?
Priority: MEDIUM

CATQ-008
Consent method será catálogo, texto livre ou híbrido?
Priority: MEDIUM

CATQ-009
APIs de catálogo usarão UUID, stable code ou ambos?
Priority: MEDIUM

CATQ-010
Enums serão PostgreSQL ENUM, CHECK constraints ou strings validadas pela aplicação?
Priority: MEDIUM

CATQ-011
Catálogos configuráveis terão displayOrder?
Priority: LOW

CATQ-012
Seleções OTHER exigirão descrição textual obrigatória?
Priority: MEDIUM
```

---

# 140. Questões existentes relacionadas

```text
DBQ-001
DBQ-005

DQ-001
DQ-005
DQ-006
DQ-007

AUTHQ-003
AUTHQ-009

BRQ-003
BRQ-004
BRQ-005

MWQ-005

SYSQ-001

SUPQ-003
SUPQ-005

CGQ-007

APIQ-019

AUDQ-012
```

---

# 141. AI Rules

Antes de adicionar enum/catalog entry:

```text
1. Search existing catalog
2. Check stable codes
3. Read this document
4. Check Open Questions
5. Check Decisions
6. Determine enum vs catalog
7. Determine global vs tenant
8. Determine historical impact
9. Add migration/seed if required
10. Add tests
```

---

# 142. AI Stop Condition

Se valor depender de:

```text
legal interpretation

workflow decision

catalog taxonomy decision

tenant customization decision
```

não resolvida:

```text
STOP
```

e apresentar:

```text
Decision Required
```

---

# 143. Prohibited Patterns

Não fazer:

```text
hardcode labels as identifiers

duplicate enum definitions everywhere

seed production demo users

seed real customer data

delete catalog values referenced historically

change stable codes casually

infer sensitive status from label

infer minor status from label

infer international transfer from country

default Legal Basis

invent security requirements

invent legal basis catalog

create Redis only for catalogs

run destructive seed in production

use development seed in integration tests as hidden dependency
```

---

# 144. Acceptance Criteria

Este documento estará aplicado quando:

```text
[ ] stable codes definidos

[ ] enum vs catalog definido por conceito

[ ] global vs tenant catalog definido

[ ] ProcessingOperation codes centralizados

[ ] Compliance codes centralizados

[ ] MappingStatus centralizado

[ ] ActivityStatus aguarda decisão final

[ ] PersonalDataCategory taxonomy validada

[ ] DataSubjectCategory taxonomy validada

[ ] LegalBasis catalog validado

[ ] Retention units definidas

[ ] Country strategy definida

[ ] seeds idempotentes

[ ] inactive lifecycle implementado

[ ] development seed separado

[ ] test fixtures separadas

[ ] production seed seguro

[ ] catalog tests implementados
```

---

# 145. Definition of Done

```text
[ ] Open Questions críticas de catálogo resolvidas

[ ] catálogos aprovados documentados

[ ] stable codes congelados para V1

[ ] migrations criadas

[ ] reference seeds criados

[ ] development seeds criados

[ ] production guards criados

[ ] idempotency testada

[ ] API de catálogos implementada quando necessária

[ ] frontend consome códigos estáveis

[ ] labels centralizados

[ ] historical references preservadas

[ ] ActivityVersion snapshot strategy considera catálogos
```

---

# 146. Regra final

Valores de catálogo são parte do contrato do produto.

Portanto:

```text
code
```

não é apenas detalhe de implementação.

Ele pode aparecer em:

```text
database

API

AuditLog

ActivityVersion

ROPA

exports

tests

integrations futuras
```

A regra é:

```text
stable code
↓
single meaning
↓
multiple presentations
```

Nunca:

```text
multiple hardcoded labels
↓
multiple interpretations
```

---

# 147. Próximo documento

O próximo documento é:

```text
docs/24-NOTIFICATIONS.md
```

Ele deve definir:

```text
notification events

recipients

channels

in-app notifications

email notifications

pending reviews

old pendencies

system/supplier mapping pendencies

activity review events

compliance review events

deduplication

read/unread state

notification preferences

background jobs

audit boundaries

tenant isolation

V1 vs future scope
```

O objetivo será separar claramente:

```text
Dashboard monitoring
```

de:

```text
user notifications
```

sem introduzir filas, Redis ou serviços externos antes de existir necessidade aprovada.