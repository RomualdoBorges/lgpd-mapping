# Modelo de Dados e Persistência

> **Documento:** Modelo lógico de banco de dados  
> **Status:** Draft  
> **Projeto:** LGPD Data Mapping Platform  
> **Banco recomendado:** PostgreSQL  
> **Documentos relacionados:** `00-PROJECT.md`, `01-ARCHITECTURE.md`, `02-DOMAIN.md`


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

## 1. Objetivo

Este documento define a estratégia inicial de persistência da plataforma, incluindo:

- tabelas principais;
- relacionamentos;
- chaves;
- constraints;
- enums;
- isolamento entre organizações;
- versionamento;
- auditoria;
- soft delete;
- arquivos;
- índices;
- decisões ainda pendentes.

Este documento descreve o modelo lógico.

A implementação final poderá sofrer pequenos ajustes conforme o ORM escolhido, desde que as regras descritas aqui sejam preservadas.

---

# 2. Banco de dados

Utilizar:

```text
PostgreSQL
```

O domínio possui forte natureza relacional e exige:

- integridade referencial;
- relacionamentos N:N;
- transações;
- consultas consolidadas;
- filtros;
- auditoria;
- versionamento;
- isolamento por organização.

---

# 3. Convenções

## 3.1 Identificadores

Utilizar:

```text
UUID
```

para entidades principais.

Exemplo:

```text
id UUID PRIMARY KEY
```

---

## 3.2 Datas

Utilizar timestamps com timezone.

Exemplo PostgreSQL:

```text
TIMESTAMPTZ
```

Campos padrão:

```text
created_at
updated_at
```

Quando houver exclusão lógica:

```text
deleted_at
```

---

## 3.3 Nomenclatura

Banco:

```text
snake_case
```

Exemplo:

```text
processing_activities
business_units
legal_bases
```

Código TypeScript:

```text
camelCase
```

Exemplo:

```text
processingActivity
businessUnit
legalBasis
```

---

# 4. Multi-tenancy

`organization_id` representa a fronteira principal de isolamento dos dados.

Entidades pertencentes ao cliente devem possuir:

```text
organization_id UUID NOT NULL
```

quando apropriado.

Exemplo:

```text
processing_activities.organization_id
systems.organization_id
suppliers.organization_id
business_units.organization_id
```

---

## 4.1 Regra crítica

Nunca utilizar somente:

```sql
WHERE id = :id
```

para acessar uma entidade pertencente a uma organização.

Preferir:

```sql
WHERE id = :id
AND organization_id = :organizationId
```

O ORM deve seguir o mesmo princípio.

---

# 5. Organizations

Tabela:

```text
organizations
```

Estrutura:

```text
id              UUID PK
name            VARCHAR NOT NULL
document        VARCHAR NULL
status          VARCHAR NOT NULL
created_at      TIMESTAMPTZ NOT NULL
updated_at      TIMESTAMPTZ NOT NULL
deleted_at      TIMESTAMPTZ NULL
```

Status:

```text
ACTIVE
INACTIVE
```

---

# 6. Business Units

Tabela:

```text
business_units
```

Estrutura:

```text
id              UUID PK
organization_id UUID FK -> organizations.id

name            VARCHAR NOT NULL
description     TEXT NULL
status          VARCHAR NOT NULL

created_at      TIMESTAMPTZ NOT NULL
updated_at      TIMESTAMPTZ NOT NULL
deleted_at      TIMESTAMPTZ NULL
```

Relacionamento:

```text
Organization 1:N BusinessUnit
```

Índice:

```text
INDEX organization_id
```

Possível constraint:

```text
UNIQUE (organization_id, name)
```

> Pendente de validação: organizações podem possuir áreas com nomes duplicados?

---

# 7. Users

Tabela:

```text
users
```

Estrutura inicial:

```text
id              UUID PK
name            VARCHAR NOT NULL
email           VARCHAR NOT NULL
status          VARCHAR NOT NULL

created_at      TIMESTAMPTZ NOT NULL
updated_at      TIMESTAMPTZ NOT NULL
deleted_at      TIMESTAMPTZ NULL
```

Status:

```text
ACTIVE
INACTIVE
```

User é identidade da plataforma; múltiplos vínculos independentes são aprovados em DEC-035. Utilizar Membership, sem limitar User a uma Organization.

---

# 8. Organization Memberships

`organization_users` representa conceitualmente Membership (nome físico final a definir no slice): id, organization_id, user_id, status e timestamps. Cada vínculo conecta um User a uma Organization; unicidade (organization_id, user_id). Não armazenar um único role escalar como modelo definitivo.

Concessões ficam em RoleAssignments vinculados ao Membership. Uma concessão associa Role e Scope ORGANIZATION ou BUSINESS_UNIT. O catálogo de permissões pertence ao Role; não aprova ADMIN ou PLATFORM_ADMIN.

# 9. RoleAssignments e Business Units

Para scope BUSINESS_UNIT, associar explicitamente as áreas à respectiva concessão, preservando seu alcance. Uma lista única de áreas do Membership não pode ser combinada indiscriminadamente com todos os roles. Cada área pertence à Organization do Membership; não assumir herança hierárquica.

ExternalIdentities e Sessions são relações do User. A aplicação não armazena senhas locais por esta decisão. Sessão server-side usa cookie opaco; campos e política detalhados ainda dependem de SECQ-004 e do fornecedor pendente em SECQ-001. Integridade composta e RLS foram aprovados em DEC-045 e DEC-046 (DBQ-008 e DBQ-009).

DEC-035 a DEC-038, DEC-040, DEC-042 e DEC-043 são a referência aprovada. Isto é modelo conceitual, não migration; Drizzle está aprovado em DEC-044.

---

# 10. Processing Activities

Tabela principal:

```text
processing_activities
```

Estrutura:

```text
id                  UUID PK

organization_id     UUID FK -> organizations.id
business_unit_id    UUID FK -> business_units.id

name                VARCHAR NOT NULL
description         TEXT NULL

status              VARCHAR NOT NULL
compliance_status   VARCHAR NOT NULL

current_version     INTEGER NOT NULL DEFAULT 1

created_by          UUID FK -> users.id

created_at          TIMESTAMPTZ NOT NULL
updated_at          TIMESTAMPTZ NOT NULL
deleted_at          TIMESTAMPTZ NULL
```

Status:

```text
DRAFT
MAPPING
PENDING_REVIEW
COMPLIANCE_PENDING
ACTIVE
UNDER_REVIEW
ARCHIVED
```

Compliance status:

```text
PENDING
COMPLETE
BLOCKED
```

Índices:

```text
organization_id
business_unit_id
status
compliance_status
updated_at
```

Índice composto recomendado:

```text
(organization_id, status)
```

---

# 11. Personal Data Categories

Tabela:

```text
personal_data_categories
```

Representa categorias reutilizáveis de dados pessoais.

Estrutura:

```text
id              UUID PK

organization_id UUID NULL

code            VARCHAR NOT NULL
name            VARCHAR NOT NULL
description     TEXT NULL

is_sensitive    BOOLEAN NOT NULL DEFAULT FALSE
is_minor_related BOOLEAN NOT NULL DEFAULT FALSE

is_system       BOOLEAN NOT NULL DEFAULT FALSE

created_at      TIMESTAMPTZ NOT NULL
updated_at      TIMESTAMPTZ NOT NULL
```

`organization_id = NULL` pode representar categorias padrão da plataforma.

Exemplo:

```text
IDENTIFICATION
FINANCIAL
HEALTH
BIOMETRIC
IMAGE_VOICE
MINOR_DATA
POLITICAL_OPINION
OTHER
```

---

# 12. Processing Activity Data Categories

Relacionamento N:N:

```text
processing_activity_data_categories
```

Estrutura:

```text
processing_activity_id UUID FK
data_category_id       UUID FK

created_at             TIMESTAMPTZ NOT NULL
```

Primary key composta ou unique:

```text
UNIQUE (
    processing_activity_id,
    data_category_id
)
```

---

# 13. Personal Data Items

> Estrutura preparada para evolução futura.

Tabela:

```text
personal_data_items
```

Exemplos:

```text
Nome
CPF
RG
E-mail
Telefone
Dados bancários
```

Estrutura:

```text
id              UUID PK

organization_id UUID NULL
category_id     UUID FK -> personal_data_categories.id

name            VARCHAR NOT NULL
description     TEXT NULL

is_system       BOOLEAN NOT NULL DEFAULT FALSE

created_at      TIMESTAMPTZ NOT NULL
updated_at      TIMESTAMPTZ NOT NULL
```

A utilização dessa granularidade na V1 depende de decisão de produto.

---

# 14. Processing Activity Data Items

Caso dados específicos sejam utilizados:

```text
processing_activity_data_items
```

Estrutura:

```text
processing_activity_id UUID FK
personal_data_item_id  UUID FK

created_at             TIMESTAMPTZ NOT NULL
```

---

# 15. Collection Sources

Tabela:

```text
collection_sources
```

Estrutura:

```text
id                      UUID PK

organization_id         UUID FK
processing_activity_id  UUID FK

source_type             VARCHAR NOT NULL

document_type           VARCHAR NULL
collection_moment       VARCHAR NULL

system_id               UUID NULL FK -> systems.id

collected_from_subject  BOOLEAN NULL

description             TEXT NULL

created_at              TIMESTAMPTZ NOT NULL
updated_at              TIMESTAMPTZ NOT NULL
```

`source_type`:

```text
DOCUMENT
SYSTEM
FORM
OTHER
```

---

# 16. Document Types

Inicialmente podem ser representados por enum/código:

```text
RG
CPF
CNH
PASSPORT
PROOF_OF_ADDRESS
CV
CONTRACT
OTHER
```

Não criar tabela específica enquanto não existir necessidade de configuração dinâmica.

---

# 17. Systems

Tabela:

```text
systems
```

Estrutura:

```text
id              UUID PK

organization_id UUID FK -> organizations.id
supplier_id     UUID NULL FK -> suppliers.id

name            VARCHAR NOT NULL
description     TEXT NULL
type            VARCHAR NULL

status          VARCHAR NOT NULL
mapping_status  VARCHAR NOT NULL

created_at      TIMESTAMPTZ NOT NULL
updated_at      TIMESTAMPTZ NOT NULL
deleted_at      TIMESTAMPTZ NULL
```

Status:

```text
ACTIVE
INACTIVE
```

Mapping status:

```text
PENDING
MAPPED
```

Índices:

```text
organization_id
supplier_id
mapping_status
```

---

# 18. Suppliers

Tabela:

```text
suppliers
```

Estrutura:

```text
id              UUID PK

organization_id UUID FK -> organizations.id

name            VARCHAR NOT NULL
document        VARCHAR NULL
country_code    CHAR(2) NULL
contact         TEXT NULL

status          VARCHAR NOT NULL
mapping_status  VARCHAR NOT NULL

created_at      TIMESTAMPTZ NOT NULL
updated_at      TIMESTAMPTZ NOT NULL
deleted_at      TIMESTAMPTZ NULL
```

Status:

```text
ACTIVE
INACTIVE
```

Mapping status:

```text
PENDING
MAPPED
```

---

# 19. Processing Operations

Tabela:

```text
processing_operations
```

Estrutura:

```text
id                      UUID PK

organization_id         UUID FK
processing_activity_id  UUID FK

type                    VARCHAR NOT NULL

business_unit_id        UUID NULL FK
system_id               UUID NULL FK
supplier_id             UUID NULL FK

description             TEXT NULL

created_at              TIMESTAMPTZ NOT NULL
updated_at              TIMESTAMPTZ NOT NULL
```

Tipos:

```text
USE
UPDATE
INTERNAL_TRANSFER
EXTERNAL_TRANSFER
INTERNATIONAL_TRANSFER
DELETE
```

---

# 20. Data Subject Categories

Tabela:

```text
data_subject_categories
```

Estrutura:

```text
id              UUID PK

organization_id UUID NULL

code            VARCHAR NOT NULL
name            VARCHAR NOT NULL

is_minor        BOOLEAN NOT NULL DEFAULT FALSE
is_system       BOOLEAN NOT NULL DEFAULT FALSE

created_at      TIMESTAMPTZ NOT NULL
updated_at      TIMESTAMPTZ NOT NULL
```

Categorias padrão:

```text
COLLABORATOR
CANDIDATE
CUSTOMER
SUPPLIER
MINOR
OTHER
```

---

# 21. Processing Activity Subjects

Relacionamento:

```text
processing_activity_subjects
```

Estrutura:

```text
processing_activity_id UUID FK
subject_category_id    UUID FK

created_at             TIMESTAMPTZ NOT NULL
```

Constraint:

```text
UNIQUE (
    processing_activity_id,
    subject_category_id
)
```

---

# 22. Recipients

Tabela:

```text
recipients
```

Estrutura:

```text
id                      UUID PK

organization_id         UUID FK
processing_activity_id  UUID FK

type                    VARCHAR NOT NULL

business_unit_id        UUID NULL FK
supplier_id             UUID NULL FK

name                    VARCHAR NULL
description             TEXT NULL

created_at              TIMESTAMPTZ NOT NULL
updated_at              TIMESTAMPTZ NOT NULL
```

Tipos:

```text
INTERNAL
EXTERNAL_OPERATOR
PUBLIC_AUTHORITY
OTHER
```

---

# 23. International Transfers

Tabela:

```text
international_transfers
```

Estrutura:

```text
id                      UUID PK

organization_id         UUID FK
processing_activity_id  UUID FK

supplier_id             UUID NULL FK

destination_country     CHAR(2) NOT NULL

mechanism               VARCHAR NULL
status                  VARCHAR NOT NULL

notes                   TEXT NULL

created_at              TIMESTAMPTZ NOT NULL
updated_at              TIMESTAMPTZ NOT NULL
```

Status sugerido:

```text
PENDING
VALIDATED
BLOCKED
```

O conjunto definitivo de mecanismos jurídicos não deve ser inventado durante implementação.

---

# 24. Retention Policies

Tabela:

```text
retention_policies
```

Estrutura:

```text
id                      UUID PK

organization_id         UUID FK
processing_activity_id  UUID FK

duration                INTEGER NOT NULL
unit                    VARCHAR NOT NULL
start_event             TEXT NOT NULL
description             TEXT NULL

created_at              TIMESTAMPTZ NOT NULL
updated_at              TIMESTAMPTZ NOT NULL
```

Unidades:

```text
DAYS
MONTHS
YEARS
```

Inicialmente:

```text
ProcessingActivity 1:1 RetentionPolicy
```

Constraint:

```text
UNIQUE (processing_activity_id)
```

> Pendente: confirmar se diferentes dados da mesma atividade podem possuir retenções diferentes.

---

# 25. Security Measures

Tabela catálogo:

```text
security_measures
```

Estrutura:

```text
id              UUID PK

organization_id UUID NULL

code            VARCHAR NOT NULL
name            VARCHAR NOT NULL
description     TEXT NULL

is_system       BOOLEAN NOT NULL DEFAULT FALSE

created_at      TIMESTAMPTZ NOT NULL
updated_at      TIMESTAMPTZ NOT NULL
```

Medidas padrão:

```text
ENCRYPTION
PSEUDONYMIZATION
ACCESS_CONTROL
BACKUP
OTHER
```

---

# 26. Processing Activity Security Measures

Relacionamento N:N:

```text
processing_activity_security_measures
```

Estrutura:

```text
processing_activity_id UUID FK
security_measure_id    UUID FK

description            TEXT NULL

created_at             TIMESTAMPTZ NOT NULL
```

---

# 27. Legal Bases

A base legal pode inicialmente ser representada diretamente na relação com a atividade.

Tabela:

```text
processing_activity_legal_bases
```

Estrutura:

```text
id                      UUID PK

organization_id         UUID FK
processing_activity_id  UUID FK

type                    VARCHAR NOT NULL
justification           TEXT NULL

created_at              TIMESTAMPTZ NOT NULL
updated_at              TIMESTAMPTZ NOT NULL
```

Tipos iniciais:

```text
CONTRACT
LEGAL_OBLIGATION
LEGITIMATE_INTEREST
REGULAR_EXERCISE_OF_RIGHTS
LIFE_PROTECTION
HEALTH_PROTECTION
PUBLIC_INTEREST
CREDIT_PROTECTION
CONSENT
```

Regra:

```text
LEGITIMATE_INTEREST
        ↓
justification NOT NULL
```

Essa regra deve ser validada também na camada de aplicação.

---

# 28. Cardinalidade da base legal

O banco deve evitar uma constraint `UNIQUE(processing_activity_id)` até que seja resolvida a seguinte questão:

> Uma atividade pode possuir mais de uma base legal?

Enquanto a decisão não estiver fechada, o modelo deve permitir:

```text
ProcessingActivity 1:N LegalBasis
```

A aplicação pode impor temporariamente uma regra mais restritiva caso isso seja decidido em `05-BUSINESS-RULES.md`.

---

# 29. Consent Documents

Tabela:

```text
consent_documents
```

Estrutura:

```text
id                      UUID PK

organization_id         UUID FK
processing_activity_id  UUID FK

version                 VARCHAR NOT NULL
effective_date          DATE NOT NULL
collection_method       VARCHAR NOT NULL

file_id                 UUID FK -> files.id

created_at              TIMESTAMPTZ NOT NULL
created_by              UUID FK -> users.id
```

Collection methods:

```text
DIGITAL_FORM
SIGNED_PAPER
ELECTRONIC_ACCEPTANCE
OTHER
```

Constraint recomendada:

```text
UNIQUE (
    processing_activity_id,
    version
)
```

Versões antigas não devem ser sobrescritas.

---

# 30. Files

Tabela:

```text
files
```

Estrutura:

```text
id              UUID PK

organization_id UUID FK

storage_key     VARCHAR NOT NULL
original_name   VARCHAR NOT NULL
mime_type       VARCHAR NOT NULL
size_bytes      BIGINT NOT NULL

created_by      UUID FK -> users.id
created_at      TIMESTAMPTZ NOT NULL
deleted_at      TIMESTAMPTZ NULL
```

O conteúdo do arquivo deve permanecer no object storage.

O PostgreSQL armazena somente metadados e referência.

---

# 31. Compliance Checks

Tabela:

```text
compliance_checks
```

Estrutura:

```text
id                      UUID PK

organization_id         UUID FK
processing_activity_id  UUID FK

type                    VARCHAR NOT NULL
status                  VARCHAR NOT NULL
reason_code             VARCHAR NULL
details                 TEXT NULL

checked_at              TIMESTAMPTZ NOT NULL
```

Tipos iniciais:

```text
LEGAL_BASIS
RETENTION
SECURITY_MEASURES
INTERNATIONAL_TRANSFER
SENSITIVE_DATA
MINOR_DATA
```

Status:

```text
PASS
FAIL
REVIEW_REQUIRED
NOT_APPLICABLE
```

---

# 32. Resultado atual dos checks

É necessário decidir se `compliance_checks` representa:

### Opção A

Somente o estado atual.

ou:

### Opção B

Histórico de todas as execuções.

Recomendação:

Preservar execuções históricas quando houver valor de auditoria.

Uma possível estrutura futura:

```text
compliance_runs
    │
    └── compliance_checks
```

Exemplo:

```text
ComplianceRun #17
├── LEGAL_BASIS PASS
├── RETENTION PASS
├── SECURITY PASS
└── INTERNATIONAL_TRANSFER REVIEW_REQUIRED
```

Essa decisão será detalhada posteriormente.

---

# 33. Activity Versions

Tabela:

```text
activity_versions
```

Estrutura conceitual:

```text
id                      UUID PK

organization_id         UUID FK
processing_activity_id  UUID FK

version                 INTEGER NOT NULL

snapshot                JSONB NOT NULL

change_reason           TEXT NULL

created_by              UUID FK -> users.id
created_at              TIMESTAMPTZ NOT NULL
```

Constraint:

```text
UNIQUE (
    processing_activity_id,
    version
)
```

---

# 34. Estratégia de versionamento

Recomendação inicial:

Utilizar snapshots da representação relevante da atividade.

Exemplo:

```json
{
  "name": "Cadastro de currículos",
  "purpose": "...",
  "legalBases": [],
  "dataCategories": [],
  "recipients": [],
  "retention": {},
  "securityMeasures": []
}
```

Vantagens:

- reconstrução simples;
- independência da estrutura atual;
- facilidade para auditoria;
- comparação entre versões.

O snapshot não substitui as tabelas normalizadas utilizadas pela versão atual.

---

# 35. Audit Logs

Tabela:

```text
audit_logs
```

Estrutura:

```text
id              UUID PK

organization_id UUID FK

actor_id        UUID NULL FK -> users.id

action          VARCHAR NOT NULL

entity_type     VARCHAR NOT NULL
entity_id       UUID NULL

metadata        JSONB NULL

request_id      VARCHAR NULL

created_at      TIMESTAMPTZ NOT NULL
```

Exemplos de `action`:

```text
ACTIVITY_CREATED
ACTIVITY_UPDATED
ACTIVITY_SUBMITTED
ACTIVITY_ACTIVATED
ACTIVITY_ARCHIVED

COMPLIANCE_GATE_EXECUTED

SYSTEM_CREATED
SUPPLIER_CREATED
```

---

# 36. AuditLog não deve ser alterado

Registros de auditoria devem ser tratados como append-only.

Não oferecer operações comuns de:

```text
UPDATE audit_log
DELETE audit_log
```

A política definitiva de retenção dos logs ainda precisa ser definida.

---

# 37. Purpose

O documento funcional define finalidade como informação obrigatória da atividade.

Existem duas possibilidades de modelagem.

### Modelo simples

Adicionar:

```text
purpose TEXT
```

em:

```text
processing_activities
```

### Modelo estruturado

Criar:

```text
processing_activity_purposes
```

permitindo múltiplas finalidades.

Como a cardinalidade ainda não foi definida, a decisão deve permanecer explícita.

Recomendação para produto com evolução de data mapping:

```text
ProcessingActivity 1:N Purpose
```

Tabela proposta:

```text
processing_activity_purposes
```

```text
id                      UUID PK
organization_id         UUID FK
processing_activity_id  UUID FK

description             TEXT NOT NULL

created_at              TIMESTAMPTZ NOT NULL
updated_at              TIMESTAMPTZ NOT NULL
```

---

# 38. Modelo relacional simplificado

```text
organizations
      │
      ├──────── business_units
      │
      ├──────── organization_users ───── users
      │               │
      │               └──── user_business_units
      │
      ├──────── systems ───── suppliers
      │
      └──────── processing_activities
                       │
                       ├──── collection_sources
                       │
                       ├──── processing_operations
                       │
                       ├──── recipients
                       │
                       ├──── international_transfers
                       │
                       ├──── retention_policies
                       │
                       ├──── processing_activity_legal_bases
                       │
                       ├──── processing_activity_purposes
                       │
                       ├──── consent_documents
                       │
                       ├──── compliance_checks
                       │
                       └──── activity_versions
```

Relações N:N:

```text
processing_activities
      │
      ├── processing_activity_data_categories
      │             ↓
      │    personal_data_categories
      │
      ├── processing_activity_subjects
      │             ↓
      │    data_subject_categories
      │
      └── processing_activity_security_measures
                    ↓
             security_measures
```

---

# 39. Integridade multi-tenant

Existe um risco importante:

```text
ProcessingActivity.organization_id = A

BusinessUnit.organization_id = B
```

Uma FK simples não impede necessariamente esse tipo de associação inválida.

A aplicação valida a relação e o PostgreSQL também garante o mesmo tenant por constraints compostas quando aplicável (DEC-045). RLS adicional protege linhas, sem substituir essas constraints (DEC-046).

Exemplos:

```text
activity.organizationId
==
businessUnit.organizationId
```

```text
activity.organizationId
==
supplier.organizationId
```

```text
activity.organizationId
==
system.organizationId
```

A estratégia pode utilizar:

- validação na aplicação;
- constraints compostas;
- ambos.

Para regras críticas, preferir defesa em profundidade quando não gerar complexidade excessiva.

---

# 40. Transações

Operações que alteram múltiplas entidades relacionadas devem utilizar transação.

Exemplo:

```text
Atualizar atividade
        +
atualizar base legal
        +
gerar ActivityVersion
        +
registrar AuditLog
```

Quando essas operações fizerem parte da mesma unidade lógica, devem ser atomicamente consistentes.

---

# 41. Soft Delete

Recomendação inicial:

Utilizar:

```text
deleted_at
```

para entidades cujo histórico seja relevante.

Exemplos:

```text
organizations
business_units
users
processing_activities
systems
suppliers
files
```

Evitar exclusão física sem necessidade.

---

# 42. Soft Delete não substitui status

Exemplo:

```text
ProcessingActivity.status = ARCHIVED
```

não significa necessariamente:

```text
deleted_at != NULL
```

`ARCHIVED` é um estado de negócio.

`deleted_at` é uma estratégia técnica de exclusão lógica.

Os conceitos não devem ser confundidos.

---

# 43. Cascades

Não utilizar `ON DELETE CASCADE` indiscriminadamente.

Especialmente evitar cascades que possam apagar:

```text
activity_versions
audit_logs
historical records
```

A estratégia de cascade deve ser analisada relacionamento por relacionamento.

---

# 44. Índices iniciais

Criar índices para campos frequentemente utilizados em filtros e joins.

Principais:

```text
organization_id
business_unit_id
processing_activity_id
supplier_id
system_id
status
compliance_status
created_at
updated_at
```

Exemplos:

```text
processing_activities (
    organization_id,
    status
)

processing_activities (
    organization_id,
    business_unit_id
)

processing_activities (
    organization_id,
    compliance_status
)
```

Não criar índices indiscriminadamente antes de existir necessidade.

---

# 45. ROPA

Não criar inicialmente:

```text
ropa
```

como tabela independente contendo cópia das informações das atividades.

O ROPA deve ser derivado através de consultas.

Exemplo conceitual:

```text
processing_activities
JOIN
business_units
JOIN
legal_bases
JOIN
data_categories
JOIN
subjects
JOIN
recipients
JOIN
retention
...
```

---

# 46. Evolução de performance do ROPA

Se consultas futuras se tornarem caras, considerar:

```text
database view
```

depois:

```text
materialized view
```

e somente posteriormente:

```text
read model dedicado
```

Não implementar otimização antecipada.

---

# 47. Dashboard

O dashboard também deve inicialmente utilizar consultas derivadas do modelo existente.

Exemplos:

```text
COUNT activities

GROUP BY business_unit

GROUP BY compliance_status

WHERE sensitive_data = true

WHERE international_transfer exists
```

Não criar tabelas de estatísticas antes de existir necessidade concreta.

---

# 48. JSONB

JSONB deve ser utilizado quando o dado for naturalmente flexível ou histórico.

Bom uso:

```text
activity_versions.snapshot

audit_logs.metadata
```

Evitar usar JSONB para substituir relacionamentos centrais do domínio.

Exemplo a evitar:

```text
processing_activity.data = {
    "systems": [],
    "suppliers": [],
    "legalBases": []
}
```

quando esses conceitos precisam ser consultados e relacionados.

---

# 49. Dados pessoais reais

A plataforma de V1 não deve armazenar dados pessoais reais dos titulares apenas para realizar o mapeamento.

Exemplo:

Não armazenar:

```text
João da Silva
CPF 123...
```

quando o objetivo é apenas registrar:

```text
Categoria: Identificação
Dado: CPF
Titular: Cliente
```

A aplicação gerencia **metadados sobre tratamentos**, não uma cópia das bases pessoais do cliente.

---

# 50. Dados de exemplo

Uploads de documentos previstos no wizard devem ser modelos/referências sem dados pessoais reais quando essa for a regra definida pelo produto.

A aplicação não deve incentivar upload desnecessário de documentos contendo dados reais de titulares.

---

# 51. Migrations

Toda alteração estrutural deve ser realizada através de migration versionada.

Não realizar alterações manuais em produção sem migration correspondente.

Cada migration deve ser:

- versionada;
- reproduzível;
- revisável;
- compatível com o processo de deployment.

---

# 52. Seeds

Dados padrão podem ser inseridos através de seed.

Exemplos:

```text
PersonalDataCategories

DataSubjectCategories

SecurityMeasures
```

Seeds não devem criar automaticamente organizações ou usuários de produção.

---

# 53. Enums: banco ou aplicação

A decisão entre:

```text
PostgreSQL ENUM
```

e:

```text
VARCHAR + validação na aplicação
```

deve considerar a frequência esperada de evolução.

Para valores de negócio que podem crescer, `VARCHAR` com validação centralizada pode oferecer maior flexibilidade.

Não misturar estratégias arbitrariamente.

---

# 54. Campos de auditoria

Entidades relevantes devem possuir, quando aplicável:

```text
created_at
updated_at
created_by
updated_by
```

A necessidade de `updated_by` em todas as tabelas deve ser avaliada em conjunto com `AuditLog`.

Evitar duplicação sem propósito.

---

# 55. Concorrência

Atualizações relevantes devem considerar concorrência entre usuários.

Possível estratégia:

```text
optimistic locking
```

utilizando:

```text
version
```

ou:

```text
updated_at
```

Exemplo:

Usuário A abre atividade.

Usuário B altera a atividade.

Usuário A tenta salvar versão antiga.

O sistema não deve sobrescrever silenciosamente a alteração de B.

A estratégia definitiva deve ser definida antes da implementação de edição concorrente.

---

# 56. Backup

O banco de produção deverá possuir política de backup.

Ainda precisam ser definidos:

```text
frequência
retenção
RPO
RTO
criptografia
teste de restauração
```

Esses pontos pertencem às decisões de infraestrutura/segurança.

---

# 57. Diagrama conceitual completo

```text
┌──────────────────────┐
│    organizations     │
└──────────┬───────────┘
           │
           ├────────────────────────────────┐
           │                                │
           ▼                                ▼
┌──────────────────────┐          ┌──────────────────┐
│    business_units    │          │ organization_users│
└──────────┬───────────┘          └─────────┬────────┘
           │                                │
           │                                ▼
           │                         ┌──────────────┐
           │                         │    users     │
           │                         └──────────────┘
           │
           ▼
┌──────────────────────────────┐
│    processing_activities     │
└──────────────┬───────────────┘
               │
       ┌───────┼────────────────────────────────────┐
       │       │            │            │          │
       ▼       ▼            ▼            ▼          ▼
 collection  operations  recipients  retention   legal_bases
 sources                              policies
       │
       │
       ├──────── systems ───────── suppliers
       │
       └─────────────────────────────────────────────

processing_activities
       │
       ├── data categories
       ├── data subjects
       ├── security measures
       ├── international transfers
       ├── consent documents
       ├── compliance checks
       └── activity versions
```

---

# 58. Questões abertas

Os IDs abaixo são os canônicos de [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md). Os antigos IDs locais desta seção foram reconciliados no registro de aliases por origem desse documento; não devem ser usados como identificadores globais. Nenhuma alternativa foi aprovada nesta reconciliação.

### DBQ-001 — ORM

Drizzle aprovado em DEC-044; DBQ-001 está DECIDED.

### DBQ-005 — Catálogos globais

Categorias de dados serão globais, por organização ou ambos?

### DQ-001 — Granularidade dos dados pessoais

A V1 terá dados pessoais específicos além das categorias?

### DQ-004 — Cardinalidade de finalidade

Uma atividade pode possuir múltiplas finalidades?

### DQ-002 — Cardinalidade da base legal

Uma atividade pode possuir múltiplas bases legais?

### DQ-005 — Granularidade da retenção

A retenção ocorre por atividade, finalidade ou categoria de dados?

### CGQ-003 — ComplianceRun

Compliance Checks manterão histórico de todas as execuções?

### DQ-010 — Alteração relevante

Quais alterações geram `ActivityVersion`?

### DBQ-004 — Soft Delete

Qual será a política definitiva de soft delete?

### APIQ-004 — Concurrency

Qual controle de concorrência será utilizado? Avaliar optimistic locking como alternativa, sem assumir sua adoção.

### AUTHQ-006 — Multi-organization

Usuários podem pertencer a múltiplas organizações?

### AUTHQ-007 — Múltiplos roles

Usuários podem possuir múltiplos papéis dentro da mesma organização?

### DBQ-009 — RLS

RLS adicional aprovado em DEC-046; DBQ-009 está DECIDED. Não substitui autorização funcional ou integridade referencial.

Questões relacionadas: DQ-003 (associação da base legal), PAQ-007 (alterações não relevantes), DBQ-009 (RLS como defesa adicional) e DBQ-008 (integridade cross-tenant). Elas mantêm seus registros próprios.

---

# 59. Regras para agentes de IA

Ao alterar o banco:

1. consultar `02-DOMAIN.md`;
2. consultar este documento;
3. consultar `05-BUSINESS-RULES.md`;
4. verificar `12-OPEN-QUESTIONS.md`;
5. criar migration;
6. preservar isolamento por organização;
7. preservar histórico;
8. atualizar documentação quando necessário.

Não fazer:

- criar tabelas sem necessidade de domínio;
- armazenar relacionamentos importantes em JSON arbitrariamente;
- remover histórico por cascade;
- adicionar colunas duplicando informações deriváveis sem justificativa;
- armazenar arquivos diretamente no PostgreSQL;
- criar tabela ROPA duplicando as atividades;
- remover `organization_id` de entidades multi-tenant;
- assumir cardinalidades marcadas como pendentes;
- alterar schema de produção manualmente;
- inventar campos jurídicos não especificados.

---

# 60. Próximo documento

As regras sobre:

```text
quem pode visualizar
quem pode criar
quem pode editar
quem pode revisar
quem pode aprovar
quem pode administrar
```

serão especificadas em:

`04-AUTHORIZATION.md`