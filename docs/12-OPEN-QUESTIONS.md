# Open Questions & Decisions

> **Documento:** Questões em Aberto e Decisões Arquiteturais  
> **Status:** Living Document  
> **Objetivo:** centralizar decisões pendentes que afetam domínio, banco, API, frontend, segurança, workflow e implementação assistida por IA.

## ProcessingActivity — fronteira aprovada sem encerramento de Questions

[DEC-073](13-DECISIONS.md#dec-073--processingactivity-persistência-mínima-e-leitura-d1) APPROVED em 2026-10-28 aprova apenas a primeira identidade persistente de seis campos, área responsável obrigatória no mesmo tenant, visibilidade D1 exclusivamente por essa área e futura leitura em snapshot REPEATABLE READ tenant-bound. Não aprova áreas participantes, owner individual, workflow, versões ou ROPA.

PAQ-001, PAQ-003, DQ-009, VALQ-002, WFQ-001/007/008/015, DBQ-002, AUDQ-013 e ROPAQ-001/002 permanecem OPEN, sem alteração do texto ou estado das questões canônicas. PAQ-003 não é decidida pela escolha limitada de área responsável; VALQ-002 permanece aberta para limites futuros, sem limite máximo adicional de nome neste recorte. Nenhuma outra questão é encerrada. A localização atual de nome/área não decide sua relação definitiva com versões. A aprovação é normativa; persistência/consulta ainda não implementadas.

---

# 1. Objetivo

Este documento é a fonte central para decisões ainda não fechadas do projeto.

Qualquer questão marcada como:

```text
OPEN
```

não deve ser decidida silenciosamente durante a implementação.

Agentes de IA devem consultar este documento antes de implementar funcionalidades relacionadas.

---

# 2. Status possíveis

```text
OPEN
IN_ANALYSIS
DECIDED
DEFERRED
CANCELLED
```

---

# 3. Prioridades

```text
CRITICAL
HIGH
MEDIUM
LOW
```

---

# 4. Regra de decisão

Questões:

```text
CRITICAL
```

devem ser resolvidas antes da implementação da parte estrutural afetada.

Questões:

```text
HIGH
```

devem preferencialmente ser resolvidas antes da feature correspondente.

Questões:

```text
MEDIUM
LOW
```

podem permanecer abertas se a implementação atual não depender delas.

---

# 5. Registro de decisão

Quando uma questão for resolvida, atualizar:

```text
Status

Decision

Rationale

Impact

Decision Date
```

Modelo:

```markdown
## XXXQ-001 — Título

**Status:** DECIDED  
**Priority:** HIGH

### Question

...

### Decision

...

### Rationale

...

### Impact

...

### Decision Date

YYYY-MM-DD
```

---

# Registro de IDs canônicos e aliases por origem

Reconciliação documental do primeiro lote: 2026-09-18. Este registro corrige referências; não resolve questões de produto, segurança ou arquitetura. Status e prioridades dos registros existentes permanecem inalterados. DQ-010 foi incorporada a partir de uma questão já documentada no domínio.

O ID canônico é o identificador da entrada neste documento. Um alias legado é identificado pelo conjunto **documento + seção/assunto + ID antigo**. Não interpretar DBQ-002, por exemplo, como alias global: ele continua sendo a questão canônica ActivityVersion, embora tenha sido usado para catálogos na seção 58 do documento de banco.

Aliases servem para interpretar referências históricas. Novas referências devem usar o ID canônico. Questões relacionadas que não sejam equivalentes não são encerradas nem fundidas automaticamente.

| Origem da referência antiga | ID antigo | ID canônico | Assunto reconciliado | Feature/entrega cuja decisão é afetada |
|---|---|---|---|---|
| `03-DATABASE.md`, seção 58 | DBQ-001 | DBQ-001 | ORM | Foundation / persistência |
| `03-DATABASE.md`, seção 58 | DBQ-002 | DBQ-005 | Catálogos globais | Schema / catálogos |
| `03-DATABASE.md`, seção 58 | DBQ-003 | DQ-001 | Granularidade dos dados pessoais | Schema / wizard / ROPA |
| `03-DATABASE.md`, seção 58 | DBQ-004 | DQ-004 | Cardinalidade de finalidade | Schema / atividade / wizard / ROPA |
| `03-DATABASE.md`, seção 58 | DBQ-005 | DQ-002 | Cardinalidade da base legal | Schema / wizard / Gate / ROPA |
| `03-DATABASE.md`, seção 58 | DBQ-006 | DQ-005 | Granularidade da retenção | Schema / wizard / Gate / ROPA |
| `03-DATABASE.md`, seção 58 | DBQ-007 | CGQ-003 | ComplianceRun | Schema / Gate / histórico |
| `03-DATABASE.md`, seção 58 | DBQ-008 | DQ-010 | Alteração relevante | Atividade / versionamento / auditoria |
| `03-DATABASE.md`, seção 58 | DBQ-009 | DBQ-004 | Soft Delete | Schema / exclusão / histórico |
| `03-DATABASE.md`, seção 58 | DBQ-010 | APIQ-004 | Concurrency | Edição concorrente / API / persistência |
| `03-DATABASE.md`, seção 58 | DBQ-011 | AUTHQ-006 | Multi-organization | Autenticação / organizações / schema |
| `03-DATABASE.md`, seção 58 | DBQ-012 | AUTHQ-007 | Múltiplos roles | Membership / autorização / schema |
| `03-DATABASE.md`, seção 58 | DBQ-013 | DBQ-009 | RLS | Tenant isolation / persistência |
| `AGENTS.md`, seção 108, concorrência | DBQ-004 | APIQ-004 | Controle de concorrência | Edição concorrente / API / persistência |
| `AGENTS.md`, seção 110, soft delete | DBQ-003 | DBQ-004 | Política de soft delete | Schema / exclusão / histórico |
| `features/ORGANIZATIONS.md`, seção 118, ADMIN | AUTHQ-005 | AUTHQ-003 | Existência de ADMIN na V1 | Organizações / autorização |
| `features/ORGANIZATIONS.md`, seção 118, PLATFORM_ADMIN | SECQ-006 | AUTHQ-009 | Existência de PLATFORM_ADMIN | Administração global / autorização |

### Uso dos metadados de bloqueio

**Affected Delivery** identifica a feature ou entrega afetada. **Blocks** descreve a implementação dependente da decisão. Esses campos não significam que todo o projeto esteja bloqueado. As listas das seções 26 a 31 continuam identificando as dependências por área. A primeira entrega utilizável foi aprovada; exclusões desse recorte não são exclusões implícitas da V1. Questões DECIDED nas listas históricas não são bloqueios pendentes. Questões IN_ANALYSIS podem ter decisão parcial, explicitada em Decision e Remaining Question.

O primeiro lote foi ampliado pela reconciliação completa registrada ao final deste documento. O histórico por origem permanece válido; consultar também os aliases globais e as pendências de revisão humana.

---

# 6. Questões críticas

As seguintes questões possuem impacto estrutural relevante e devem receber prioridade:

```text
PRODQ-001
PAQ-006
AUTHQ-006
AUTHQ-007
AUTHQ-008

DQ-002
DQ-003
DQ-004
DQ-005

BRQ-006
BRQ-007

WFQ-003
WFQ-004
WFQ-005
WFQ-006
WFQ-007
WFQ-008

CGQ-001
CGQ-003
CGQ-004
CGQ-005

SYSQ-002
SYSQ-005
SYSQ-007
SYSQ-011

SUPQ-002
SUPQ-003
SUPQ-004
SUPQ-006
SUPQ-011

DASHQ-002
DASHQ-003
DASHQ-006
DASHQ-007
DASHQ-010
DASHQ-011
```

---

# 7. Produto

## PRODQ-001 — Multi-tenancy

**Status:** DECIDED  
**Priority:** CRITICAL  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [13-DECISIONS.md](13-DECISIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [15-BACKLOG.md](15-BACKLOG.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md), [ORGANIZATIONS.md](features/ORGANIZATIONS.md), [SYSTEMS.md](features/SYSTEMS.md)  
**Affected Delivery:** Produto / escopo V1  
**Blocks:** Decisão registrada; não bloqueia mais por esta questão.

### Question

O produto será definitivamente:

```text
multi-tenant SaaS
```

com:

```text
1 Organization = 1 Tenant
```

?

### Current Architecture

A arquitetura atual já está preparada para:

```text
Organization
↓
Tenant Boundary
```

com `organizationId` presente nos recursos aplicáveis.

### Impact

Afeta:

```text
database

authorization

authentication

queries

indexes

cache

storage

jobs

audit

exports

testing
```

---

### Alias global: PRODQ-002 → AUTHQ-006

Usuário em múltiplas organizações; conservar o contexto DPO as a Service. Status e prioridade são somente os da questão canônica.

---

### Decision

DEC-034: SaaS multi-tenant. Cada Organization é um tenant independente; Business Unit não é tenant. Esta decisão não escolhe a topologia física do banco nem RLS.

### Rationale

Aprovação expressa do usuário para Foundation → Identity/Tenant.

### Impact

Modelo estrutural e documentos afetados harmonizados; não autoriza implementação nesta etapa.

### Decision Date

2026-09-18


# 8. Domínio

## DQ-001 — Granularidade dos dados pessoais

**Status:** OPEN  
**Priority:** HIGH  
**Affected Documents:** [02-DOMAIN.md](02-DOMAIN.md), [03-DATABASE.md](03-DATABASE.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [15-BACKLOG.md](15-BACKLOG.md), [19-ERROR-CATALOG.md](19-ERROR-CATALOG.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md), [22-VALIDATION-RULES.md](22-VALIDATION-RULES.md), [23-SEED-AND-CATALOGS.md](23-SEED-AND-CATALOGS.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md), [MAPPING-WIZARD.md](features/MAPPING-WIZARD.md), [PROCESSING-ACTIVITY.md](features/PROCESSING-ACTIVITY.md)  
**Affected Delivery:** Domínio / schema / atividade / wizard  
**Blocks:** implementar a decisão «Granularidade dos dados pessoais» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

O mapeamento registra apenas:

```text
PersonalDataCategory
```

ou também:

```text
PersonalDataItem
```

?

Exemplo:

```text
Categoria:
Identificação

Itens:
CPF
RG
Nome
Data de nascimento
```

---

## DQ-002 — Cardinalidade da base legal

**Status:** OPEN  
**Priority:** CRITICAL  
**Affected Documents:** [02-DOMAIN.md](02-DOMAIN.md), [03-DATABASE.md](03-DATABASE.md), [05-BUSINESS-RULES.md](05-BUSINESS-RULES.md), [07-API.md](07-API.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [15-BACKLOG.md](15-BACKLOG.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md), [22-VALIDATION-RULES.md](22-VALIDATION-RULES.md), [23-SEED-AND-CATALOGS.md](23-SEED-AND-CATALOGS.md), [COMPLIANCE-GATE.md](features/COMPLIANCE-GATE.md), [MAPPING-WIZARD.md](features/MAPPING-WIZARD.md), [PROCESSING-ACTIVITY.md](features/PROCESSING-ACTIVITY.md), [ROPA.md](features/ROPA.md)  
**Affected Delivery:** Domínio / schema / atividade / wizard  
**Blocks:** implementar a decisão «Cardinalidade da base legal» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Uma Activity pode possuir:

```text
1 LegalBasis
```

ou:

```text
N LegalBases
```

?

---

## DQ-003 — Associação da base legal

**Status:** OPEN  
**Priority:** CRITICAL  
**Affected Documents:** [03-DATABASE.md](03-DATABASE.md), [05-BUSINESS-RULES.md](05-BUSINESS-RULES.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [15-BACKLOG.md](15-BACKLOG.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md), [22-VALIDATION-RULES.md](22-VALIDATION-RULES.md), [23-SEED-AND-CATALOGS.md](23-SEED-AND-CATALOGS.md), [COMPLIANCE-GATE.md](features/COMPLIANCE-GATE.md), [MAPPING-WIZARD.md](features/MAPPING-WIZARD.md), [PROCESSING-ACTIVITY.md](features/PROCESSING-ACTIVITY.md), [ROPA.md](features/ROPA.md)  
**Affected Delivery:** Domínio / schema / atividade / wizard  
**Blocks:** implementar a decisão «Associação da base legal» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

LegalBasis pertence a:

```text
Activity
```

ou:

```text
Purpose
```

ou:

```text
PersonalDataCategory
```

ou combinação?

### Impact

Afeta diretamente:

```text
Domain

Database

Wizard

Compliance Gate

ROPA

API
```

---

## DQ-004 — Cardinalidade de finalidade

**Status:** OPEN  
**Priority:** CRITICAL  
**Affected Documents:** [AGENTS.md](../AGENTS.md), [02-DOMAIN.md](02-DOMAIN.md), [03-DATABASE.md](03-DATABASE.md), [05-BUSINESS-RULES.md](05-BUSINESS-RULES.md), [07-API.md](07-API.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [15-BACKLOG.md](15-BACKLOG.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md), [22-VALIDATION-RULES.md](22-VALIDATION-RULES.md), [MAPPING-WIZARD.md](features/MAPPING-WIZARD.md), [PROCESSING-ACTIVITY.md](features/PROCESSING-ACTIVITY.md), [ROPA.md](features/ROPA.md)  
**Affected Delivery:** Domínio / schema / atividade / wizard  
**Blocks:** implementar a decisão «Cardinalidade de finalidade» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Uma Activity possui:

```text
1 Purpose
```

ou:

```text
N Purposes
```

?

---

## DQ-005 — Granularidade da retenção

**Status:** OPEN  
**Priority:** CRITICAL  
**Affected Documents:** [02-DOMAIN.md](02-DOMAIN.md), [03-DATABASE.md](03-DATABASE.md), [05-BUSINESS-RULES.md](05-BUSINESS-RULES.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [15-BACKLOG.md](15-BACKLOG.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md), [22-VALIDATION-RULES.md](22-VALIDATION-RULES.md), [23-SEED-AND-CATALOGS.md](23-SEED-AND-CATALOGS.md), [COMPLIANCE-GATE.md](features/COMPLIANCE-GATE.md), [MAPPING-WIZARD.md](features/MAPPING-WIZARD.md), [PROCESSING-ACTIVITY.md](features/PROCESSING-ACTIVITY.md), [ROPA.md](features/ROPA.md)  
**Affected Delivery:** Domínio / schema / atividade / wizard  
**Blocks:** implementar a decisão «Granularidade da retenção» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

RetentionPolicy pertence a:

```text
Activity
```

ou:

```text
Purpose
```

ou:

```text
PersonalDataCategory
```

?

---

## DQ-006 — Catálogo de medidas de segurança

**Status:** OPEN  
**Priority:** HIGH  
**Affected Documents:** [02-DOMAIN.md](02-DOMAIN.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [15-BACKLOG.md](15-BACKLOG.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md), [22-VALIDATION-RULES.md](22-VALIDATION-RULES.md), [23-SEED-AND-CATALOGS.md](23-SEED-AND-CATALOGS.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md), [COMPLIANCE-GATE.md](features/COMPLIANCE-GATE.md), [MAPPING-WIZARD.md](features/MAPPING-WIZARD.md)  
**Affected Delivery:** Domínio / schema / atividade / wizard  
**Blocks:** implementar a decisão «Catálogo de medidas de segurança» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

SecurityMeasures serão:

```text
catálogo global

catálogo por Organization

texto livre

modelo híbrido
```

?

---

## DQ-007 — Categorias de titulares

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md), [23-SEED-AND-CATALOGS.md](23-SEED-AND-CATALOGS.md)  
**Affected Delivery:** Domínio / schema / atividade / wizard  
**Blocks:** implementar a decisão «Categorias de titulares» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

DataSubjectCategories serão:

```text
catálogo fixo

configuráveis por Organization

modelo híbrido
```

?

---

## DQ-008 — Hierarquia de Business Units

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [02-DOMAIN.md](02-DOMAIN.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [15-BACKLOG.md](15-BACKLOG.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md), [ORGANIZATIONS.md](features/ORGANIZATIONS.md)  
**Affected Delivery:** Domínio / schema / atividade / wizard  
**Blocks:** implementar a decisão «Hierarquia de Business Units» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

BusinessUnit terá:

```text
estrutura plana
```

ou:

```text
hierarquia pai/filho
```

?

---

## DQ-009 — Responsável pela Activity

**Status:** OPEN  
**Priority:** HIGH  
**Affected Documents:** [02-DOMAIN.md](02-DOMAIN.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [20-API-CONTRACTS.md](20-API-CONTRACTS.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md), [22-VALIDATION-RULES.md](22-VALIDATION-RULES.md), [ORGANIZATIONS.md](features/ORGANIZATIONS.md), [PROCESSING-ACTIVITY.md](features/PROCESSING-ACTIVITY.md)  
**Affected Delivery:** Domínio / schema / atividade / wizard  
**Blocks:** implementar a decisão «Responsável pela Activity» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

ProcessingActivity precisa possuir:

```text
responsibleUserId
```

além de:

```text
businessUnitId
```

?

---


### Contexto consolidado

Origem: DQ-009.

### Question

Activity possui responsável individual?

Relacionado:

```text
DQ-009
```

---

## DQ-010 — Alteração relevante

**Status:** OPEN  
**Priority:** HIGH  
**Affected Documents:** [02-DOMAIN.md](02-DOMAIN.md), [03-DATABASE.md](03-DATABASE.md), [05-BUSINESS-RULES.md](05-BUSINESS-RULES.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md), [PROCESSING-ACTIVITY.md](features/PROCESSING-ACTIVITY.md)  
**Affected Delivery:** Domínio / schema / atividade / wizard  
**Blocks:** implementar a decisão «Alteração relevante» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica  

### Question

Quais mudanças devem gerar `ActivityVersion`?

Exemplos para análise, sem constituir critérios já aprovados: finalidade, base legal, destinatário, retenção, dados tratados e transferência internacional.

### Rationale for registration

Questão já existente em `02-DOMAIN.md`, com impacto alto, e ausente do registro central. A prioridade HIGH organiza a triagem desse impacto; não aprova regra de versionamento. PAQ-007 permanece relacionada, pois trata especificamente de alterações não relevantes.

---

# 9. Authentication & Authorization

### Alias global: AUTHQ-001 → WFQ-003

Responsável por revisão; mesma decisão de WFQ-003. Status e prioridade são somente os da questão canônica.

---

## AUTHQ-002 — Responsável por aprovação

**Status:** OPEN  
**Priority:** HIGH  
**Affected Documents:** [02-DOMAIN.md](02-DOMAIN.md), [04-AUTHORIZATION.md](04-AUTHORIZATION.md), [05-BUSINESS-RULES.md](05-BUSINESS-RULES.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md), [24-NOTIFICATIONS.md](24-NOTIFICATIONS.md), [25-UX-GUIDELINES.md](25-UX-GUIDELINES.md), [COMPLIANCE-GATE.md](features/COMPLIANCE-GATE.md), [PROCESSING-ACTIVITY.md](features/PROCESSING-ACTIVITY.md)  
**Affected Delivery:** Authentication / Organizations / Authorization  
**Blocks:** implementar a decisão «Responsável por aprovação» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Quem pode aprovar uma Activity para ativação?

---

## AUTHQ-003 — Admin

**Status:** OPEN  
**Priority:** HIGH  
**Affected Documents:** [04-AUTHORIZATION.md](04-AUTHORIZATION.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [15-BACKLOG.md](15-BACKLOG.md), [23-SEED-AND-CATALOGS.md](23-SEED-AND-CATALOGS.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md), [AUTH.md](features/AUTH.md), [ORGANIZATIONS.md](features/ORGANIZATIONS.md)  
**Affected Delivery:** Authentication / Organizations / Authorization  
**Blocks:** implementar a decisão «Admin» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

O papel:

```text
ADMIN
```

existirá oficialmente na V1?

---

## AUTHQ-004 — Visibilidade por papel

**Status:** IN_ANALYSIS  
**Priority:** HIGH  
**Affected Documents:** [04-AUTHORIZATION.md](04-AUTHORIZATION.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [15-BACKLOG.md](15-BACKLOG.md), [DASHBOARD.md](features/DASHBOARD.md), [ROPA.md](features/ROPA.md), [SUPPLIERS.md](features/SUPPLIERS.md), [SYSTEMS.md](features/SYSTEMS.md)  
**Affected Delivery:** Authentication / Organizations / Authorization  
**Blocks:** Somente a política de leitura de Dashboard, Systems e Suppliers ainda não decidida.

### Question

Qual escopo de leitura de:

```text
Activities

ROPA

Dashboard

Systems

Suppliers
```

cada papel possui?

---

### Decision

DEC-039: Somente para a primeira entrega: COLLABORATOR lê Activities das Business Units autorizadas e não possui inicialmente leitura do ROPA; MANAGER lê Activities e ROPA das Business Units autorizadas; DPO lê Activities e ROPA de toda a Organization do Membership. Não inferir edição, Submit, aprovação, Gate ou publicação. Dashboard, Systems e Suppliers permanecem pendentes; esta matriz não é exclusão dessas features da V1.

### Rationale

Aprovação expressa do usuário para Foundation → Identity/Tenant.

### Impact

Modelo estrutural e documentos afetados harmonizados; não autoriza implementação nesta etapa.

### Decision Date

2026-09-18

### Remaining Question

Qual a política de leitura de Dashboard, Systems e Suppliers quando entrarem em suas entregas?


## AUTHQ-005 — Membership

**Status:** DECIDED  
**Priority:** HIGH  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [15-BACKLOG.md](15-BACKLOG.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md)  
**Affected Delivery:** Authentication / Organizations / Authorization  
**Blocks:** Decisão registrada; não bloqueia mais por esta questão.

### Question

Role pertence:

```text
ao User
```

ou:

```text
ao OrganizationMembership
```

?

### Recommendation

Arquitetura atual assume:

```text
Role pertence ao Membership
```

para suportar multi-organização.

---

### Decision

DEC-036: Roles são concedidos através do Membership e não se propagam entre organizações. Isso não aprova PLATFORM_ADMIN.

### Rationale

Aprovação expressa do usuário para Foundation → Identity/Tenant.

### Impact

Modelo estrutural e documentos afetados harmonizados; não autoriza implementação nesta etapa.

### Decision Date

2026-09-18


## AUTHQ-006 — Multi-organization

**Status:** DECIDED  
**Priority:** CRITICAL  
**Affected Documents:** [03-DATABASE.md](03-DATABASE.md), [04-AUTHORIZATION.md](04-AUTHORIZATION.md), [09-SECURITY.md](09-SECURITY.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [13-DECISIONS.md](13-DECISIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [15-BACKLOG.md](15-BACKLOG.md), [20-API-CONTRACTS.md](20-API-CONTRACTS.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md), [24-NOTIFICATIONS.md](24-NOTIFICATIONS.md), [25-UX-GUIDELINES.md](25-UX-GUIDELINES.md), [AUTH.md](features/AUTH.md), [ORGANIZATIONS.md](features/ORGANIZATIONS.md)  
**Affected Delivery:** Authentication / Organizations / Authorization  
**Blocks:** Decisão registrada; não bloqueia mais por esta questão.

### Question

Usuário pode possuir memberships simultâneos em múltiplas Organizations?

---


### Contexto consolidado

Origem: AUTHQ-006.

### Question

Um mesmo usuário pode participar de:

```text
N Organizations
```

?

### Context

Esse cenário é especialmente relevante para:

```text
DPO as a Service
```

---

### Decision

DEC-035: User é uma identidade da plataforma e pode possuir Memberships em múltiplas Organizations. Os vínculos são independentes: papéis e desativação de um vínculo não se propagam para outro.

### Rationale

Aprovação expressa do usuário para Foundation → Identity/Tenant.

### Impact

Modelo estrutural e documentos afetados harmonizados; não autoriza implementação nesta etapa.

### Decision Date

2026-09-18


## AUTHQ-007 — Múltiplos roles

**Status:** DECIDED  
**Priority:** CRITICAL  
**Affected Documents:** [03-DATABASE.md](03-DATABASE.md), [04-AUTHORIZATION.md](04-AUTHORIZATION.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [15-BACKLOG.md](15-BACKLOG.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md), [AUTH.md](features/AUTH.md), [ORGANIZATIONS.md](features/ORGANIZATIONS.md)  
**Affected Delivery:** Authentication / Organizations / Authorization  
**Blocks:** Decisão registrada; não bloqueia mais por esta questão.

### Question

Membership possui:

```text
1 Role
```

ou:

```text
N Roles
```

?

---

### Decision

DEC-037: Um Membership pode possuir múltiplos RoleAssignments. Cada concessão preserva seu scope; não combinar indiscriminadamente todos os roles com todas as Business Units.

### Rationale

Aprovação expressa do usuário para Foundation → Identity/Tenant.

### Impact

Modelo estrutural e documentos afetados harmonizados; não autoriza implementação nesta etapa.

### Decision Date

2026-09-18


## AUTHQ-008 — Múltiplas Business Units

**Status:** DECIDED  
**Priority:** CRITICAL  
**Affected Documents:** [04-AUTHORIZATION.md](04-AUTHORIZATION.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [15-BACKLOG.md](15-BACKLOG.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md), [AUTH.md](features/AUTH.md), [ORGANIZATIONS.md](features/ORGANIZATIONS.md), [SYSTEMS.md](features/SYSTEMS.md)  
**Affected Delivery:** Authentication / Organizations / Authorization  
**Blocks:** Decisão registrada; não bloqueia mais por esta questão.

### Question

Usuário pode possuir acesso a:

```text
N BusinessUnits
```

dentro da mesma Organization?

---

### Decision

DEC-038: Acesso a múltiplas Business Units deve ser explicitamente concedido no contexto do Membership e de cada RoleAssignment. Scope ORGANIZATION alcança a organização inteira. Não assumir herança automática pela hierarquia. OWN e PLATFORM não estão aprovados.

### Rationale

Aprovação expressa do usuário para Foundation → Identity/Tenant.

### Impact

Modelo estrutural e documentos afetados harmonizados; não autoriza implementação nesta etapa.

### Decision Date

2026-09-18


## AUTHQ-009 — Platform Admin

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [09-SECURITY.md](09-SECURITY.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [23-SEED-AND-CATALOGS.md](23-SEED-AND-CATALOGS.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md), [ORGANIZATIONS.md](features/ORGANIZATIONS.md)  
**Affected Delivery:** Authentication / Organizations / Authorization  
**Blocks:** implementar a decisão «Platform Admin» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Existirá papel global:

```text
PLATFORM_ADMIN
```

fora dos tenants?

---

## AUTHQ-010 — SSO

**Status:** DECIDED  
**Priority:** HIGH  
**Affected Documents:** [04-AUTHORIZATION.md](04-AUTHORIZATION.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [15-BACKLOG.md](15-BACKLOG.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md), [AUTH.md](features/AUTH.md)  
**Affected Delivery:** Authentication / Organizations / Authorization  
**Blocks:** Decisão registrada; não bloqueia mais por esta questão.

### Question

SSO é requisito:

```text
V1
```

ou evolução futura?

---

### Decision

DEC-041: SSO corporativo não é requisito da primeira entrega, mas deverá fazer parte da V1 posteriormente. Preparar a arquitetura sem implementar configuração completa de SSO agora.

### Rationale

Aprovação expressa do usuário para Foundation → Identity/Tenant.

### Impact

Modelo estrutural e documentos afetados harmonizados; não autoriza implementação nesta etapa.

### Decision Date

2026-09-18


# 10. Authentication / Security

## SECQ-001 — Estratégia de autenticação

**Status:** IN_ANALYSIS  
**Priority:** CRITICAL  
**Affected Documents:** [07-API.md](07-API.md), [09-SECURITY.md](09-SECURITY.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [15-BACKLOG.md](15-BACKLOG.md), [17-ENVIRONMENTS-AND-DEPLOYMENT.md](17-ENVIRONMENTS-AND-DEPLOYMENT.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md), [26-RELEASE-CHECKLIST.md](26-RELEASE-CHECKLIST.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md), [AUTH.md](features/AUTH.md)  
**Affected Delivery:** Segurança / Authentication / uploads  
**Blocks:** Escolha do fornecedor gerenciado antes da integração OIDC concreta.

### Question

Qual mecanismo será usado?

Possibilidades:

```text
OIDC

Microsoft Entra ID

Keycloak

Auth0

autenticação local
```

---

### Decision

DEC-040: Autenticação delegada por OIDC com provedor gerenciado. O fornecedor ainda não foi escolhido; Auth0 é somente candidato. User interno é independente do fornecedor; vincular identidades externas conforme protocolo/provedor, sem união automática por e-mail. Login bem-sucedido não concede Membership ou papel.

### Rationale

Aprovação expressa do usuário para Foundation → Identity/Tenant.

### Impact

Modelo estrutural e documentos afetados harmonizados; não autoriza implementação nesta etapa.

### Decision Date

2026-09-18

### Remaining Question

Qual fornecedor gerenciado OIDC será contratado/utilizado? Auth0 permanece somente candidato.

### Delimitação do D1 — DEC-050

User, ExternalIdentity, Membership e as concessões necessárias são provisionados de forma controlada antes do login. A autenticação resolve o User pela combinação validada issuer + subject da ExternalIdentity existente; login não cria User, Membership, RoleAssignment ou Organization, não concede BusinessUnit e não associa identidades por e-mail. Signup público, fluxo completo de convites, account linking self-service e merge automático de contas ficam fora deste Slice.

Esta delimitação responde ao comportamento de provisionamento no login, sem escolher fornecedor OIDC ou resolver política de nome/e-mail/claims, lifecycle de Session ou proteção/bootstrap das tabelas globais. SECQ-001 continua IN_ANALYSIS, com prioridade CRITICAL, quanto ao fornecedor gerenciado.

### Identidade externa e perfil no D1 — DEC-051

ExternalIdentity é vinculada ao User global e identificada por issuer + subject, com unicidade global desse par; uma identidade externa não pode pertencer a dois Users. Campos mínimos conceituais: id, userId, issuer, subject, createdAt e updatedAt, se coerente com o padrão estrutural existente, sem autorização de schema/migration.

Nome/e-mail do User vêm do provisionamento controlado da DEC-050. name, email e email_verified externos não são autoridade de identidade ou autorização: não associar/fundir Users por e-mail, alterar vínculo por mudança de e-mail ou conceder acesso por esses claims. Não sincronizar name/email automaticamente no login; ausência desses claims não impede autenticação de ExternalIdentity previamente provisionada e válida. Mudança de e-mail no IdP não altera User ou vínculo.

O modelo pode permitir várias ExternalIdentities por User, mas criação self-service de identidade adicional, account linking, merge de contas, fluxo de segunda identidade e política administrativa definitiva ficam fora do Slice 3. Provider, MFA, lifecycle de User/Session, armazenamento de tokens do IdP, proteção/bootstrap global, onboarding definitivo e atualização administrativa de perfil continuam pendentes. SECQ-001 permanece IN_ANALYSIS/CRITICAL quanto ao fornecedor.

### Delimitação de persistência global — DEC-057

ExternalIdentity e Session permanecem globais e sem RLS tenant. Runtime não recebe grants diretos nessas tabelas nem SELECT em users. O acesso ocorre somente pelos quatro primitives SECURITY DEFINER de retorno mínimo pertencentes à role NOLOGIN dedicada `lgpd_auth_persistence`.

Runtime e migrator não são membros dessa role. Bootstrap administrativo, migration estrutural, provisionamento privilegiado pós-migration e runtime são etapas separadas.

Essa delimitação não escolhe provider OIDC, política temporal de Session, MFA ou mecanismos HTTP. O algoritmo de digest foi definido posteriormente pela DEC-058. SECQ-001 permanece IN_ANALYSIS/CRITICAL exclusivamente quanto ao fornecedor gerenciado.


## SECQ-002 — Sessão

**Status:** DECIDED  
**Priority:** CRITICAL  
**Affected Documents:** [09-SECURITY.md](09-SECURITY.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [15-BACKLOG.md](15-BACKLOG.md), [17-ENVIRONMENTS-AND-DEPLOYMENT.md](17-ENVIRONMENTS-AND-DEPLOYMENT.md), [26-RELEASE-CHECKLIST.md](26-RELEASE-CHECKLIST.md), [AUTH.md](features/AUTH.md)  
**Affected Delivery:** Segurança / Authentication / uploads  
**Blocks:** Decisão registrada; não bloqueia mais por esta questão.

### Question

Estratégia:

```text
secure cookie session

JWT em HttpOnly Cookie

access + refresh token

ou outra
```

?

---

### Decision

DEC-042: Sessão server-side com cookie opaco. Frontend não administra tokens de autenticação. Backend consulta autorização atual, sem roles/memberships congelados na sessão. DEC-053 define lifecycle estrutural, DEC-055 define cookie e baseline CSRF, e DEC-059 fixa os perfis: `lgpd_session` sem `Secure` para desenvolvimento/teste HTTP e `__Host-lgpd_session` com `Secure` para produção HTTPS; ambos usam `HttpOnly`, `SameSite=Lax`, `Path=/` e nenhum `Domain`. DEC-061 uniformiza em 401/`AUTHENTICATION_REQUIRED` as falhas de autenticação em endpoints protegidos, mantendo a causa somente interna e limpando apenas cookie presente que não autentica. Os detalhes ainda não cobertos permanecem em SECQ-004.

### Rationale

Aprovação expressa do usuário para Foundation → Identity/Tenant.

### Impact

Modelo estrutural e documentos afetados harmonizados; não autoriza implementação nesta etapa.

### Decision Date

2026-09-18


## SECQ-003 — MFA

**Status:** OPEN  
**Priority:** HIGH  
**Affected Documents:** [09-SECURITY.md](09-SECURITY.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [26-RELEASE-CHECKLIST.md](26-RELEASE-CHECKLIST.md), [AUTH.md](features/AUTH.md)  
**Affected Delivery:** Segurança / Authentication / uploads  
**Blocks:** implementar a decisão «MFA» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

MFA será obrigatório?

Se autenticação for delegada, será responsabilidade do IdP?

---

## SECQ-004 — Session expiration

**Status:** DECIDED
**Priority:** HIGH  
**Affected Documents:** [03-DATABASE.md](03-DATABASE.md), [07-API.md](07-API.md), [09-SECURITY.md](09-SECURITY.md), [11-TESTING.md](11-TESTING.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [13-DECISIONS.md](13-DECISIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md), [26-RELEASE-CHECKLIST.md](26-RELEASE-CHECKLIST.md), [AUTH.md](features/AUTH.md)
**Affected Delivery:** Segurança / Authentication / uploads  
**Blocks:** nenhum bloqueio pendente nesta questão; aplicar DEC-067, DEC-068 e DEC-069

### Question

Qual política de:

```text
expiration

refresh

revocation
```

?

### Decision

DEC-067 define duração absoluta padrão de 12 horas, idle timeout de 30 minutos e `lastActivityAt` persistido por request autenticada válida com throttling de cinco minutos, sem atualização periódica. DEC-068 proíbe sliding expiration, extensão automática de `expiresAt`, renovação da mesma Session e refresh local. DEC-069 define logout da Session atual com revogação server-side antes da remoção do cookie e resposta 204.

### Rationale

Limitar Sessions abandonadas e absolutas, separar Session local do lifecycle do IdP e garantir logout efetivo sem DML direto do runtime.

### Decision Date

2026-10-02

---

### Delimitação — DEC-053

Session global vinculada ao User, com segredo opaco imprevisível armazenado somente por representação não reversível; expiração absoluta, suporte a inatividade, múltiplas sessões, revogação da sessão atual no logout e capacidade futura de revogação geral estão aprovados. DEC-058 define `tokenDigest = SHA-256(sessionSecret)`, calculado pelo backend, sem persistir o segredo bruto e sem introduzir HMAC, Argon2 ou novo secret operacional nesta etapa. Quantidade de bytes, encoding e geração concreta do segredo permanecem adiados.

## SECQ-005 — Upload malware scanning

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [09-SECURITY.md](09-SECURITY.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [15-BACKLOG.md](15-BACKLOG.md), [17-ENVIRONMENTS-AND-DEPLOYMENT.md](17-ENVIRONMENTS-AND-DEPLOYMENT.md), [22-VALIDATION-RULES.md](22-VALIDATION-RULES.md), [26-RELEASE-CHECKLIST.md](26-RELEASE-CHECKLIST.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md), [MAPPING-WIZARD.md](features/MAPPING-WIZARD.md)  
**Affected Delivery:** Segurança / Authentication / uploads  
**Blocks:** implementar a decisão «Upload malware scanning» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Uploads precisam passar por:

```text
antivirus / malware scanning
```

na V1?

---

### Alias global: SECQ-006 → DBQ-009

Adoção de PostgreSQL RLS como defesa adicional; mesma decisão de DBQ-009. Status e prioridade são somente os da questão canônica.

---

# 11. Business Rules

## BRQ-001 — Dados sensíveis

**Status:** OPEN  
**Priority:** HIGH  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [13-DECISIONS.md](13-DECISIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [15-BACKLOG.md](15-BACKLOG.md), [22-VALIDATION-RULES.md](22-VALIDATION-RULES.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md)  
**Affected Delivery:** Business Rules / Processing Activity / Compliance Gate  
**Blocks:** implementar a decisão «Dados sensíveis» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

A presença de dado sensível exige obrigatoriamente:

```text
avaliação RIPD/DPIA
```

ou apenas avaliação sobre necessidade?

---

## BRQ-002 — Menores

**Status:** OPEN  
**Priority:** HIGH  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [13-DECISIONS.md](13-DECISIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [15-BACKLOG.md](15-BACKLOG.md), [22-VALIDATION-RULES.md](22-VALIDATION-RULES.md)  
**Affected Delivery:** Business Rules / Processing Activity / Compliance Gate  
**Blocks:** implementar a decisão «Menores» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Atividade envolvendo menores exige obrigatoriamente RIPD/DPIA?

---

## BRQ-003 — Transferência internacional

**Status:** OPEN  
**Priority:** HIGH  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [15-BACKLOG.md](15-BACKLOG.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md), [22-VALIDATION-RULES.md](22-VALIDATION-RULES.md), [23-SEED-AND-CATALOGS.md](23-SEED-AND-CATALOGS.md)  
**Affected Delivery:** Business Rules / Processing Activity / Compliance Gate  
**Blocks:** implementar a decisão «Transferência internacional» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Qual informação mínima precisa estar registrada para considerar a etapa de transferência internacional preenchida?

---

## BRQ-004 — Consentimento

**Status:** OPEN  
**Priority:** HIGH  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [22-VALIDATION-RULES.md](22-VALIDATION-RULES.md), [23-SEED-AND-CATALOGS.md](23-SEED-AND-CATALOGS.md)  
**Affected Delivery:** Business Rules / Processing Activity / Compliance Gate  
**Blocks:** implementar a decisão «Consentimento» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Quando base legal exigir consentimento, quais campos/documentos são obrigatórios?

---

## BRQ-005 — Legítimo interesse

**Status:** OPEN  
**Priority:** HIGH  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [22-VALIDATION-RULES.md](22-VALIDATION-RULES.md), [23-SEED-AND-CATALOGS.md](23-SEED-AND-CATALOGS.md)  
**Affected Delivery:** Business Rules / Processing Activity / Compliance Gate  
**Blocks:** implementar a decisão «Legítimo interesse» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Além de:

```text
justification
```

será exigido LIA na V1?

---

## BRQ-006 — Aprovação

**Status:** OPEN  
**Priority:** CRITICAL  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [15-BACKLOG.md](15-BACKLOG.md), [22-VALIDATION-RULES.md](22-VALIDATION-RULES.md), [25-UX-GUIDELINES.md](25-UX-GUIDELINES.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md)  
**Affected Delivery:** Business Rules / Processing Activity / Compliance Gate  
**Blocks:** implementar a decisão «Aprovação» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Existe aprovação humana obrigatória antes de:

```text
ACTIVE
```

?

---

## BRQ-007 — BLOCKED

**Status:** OPEN  
**Priority:** CRITICAL  
**Affected Documents:** [05-BUSINESS-RULES.md](05-BUSINESS-RULES.md), [06-WORKFLOWS.md](06-WORKFLOWS.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [15-BACKLOG.md](15-BACKLOG.md), [22-VALIDATION-RULES.md](22-VALIDATION-RULES.md), [COMPLIANCE-GATE.md](features/COMPLIANCE-GATE.md)  
**Affected Delivery:** Business Rules / Processing Activity / Compliance Gate  
**Blocks:** implementar a decisão «BLOCKED» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Quais condições tornam:

```text
ComplianceStatus = BLOCKED
```

?

---

## BRQ-008 — Archive

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md)  
**Affected Delivery:** Business Rules / Processing Activity / Compliance Gate  
**Blocks:** implementar a decisão «Archive» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Quais regras permitem arquivar Activity?

---

## BRQ-009 — Revisão periódica

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [24-NOTIFICATIONS.md](24-NOTIFICATIONS.md)  
**Affected Delivery:** Business Rules / Processing Activity / Compliance Gate  
**Blocks:** implementar a decisão «Revisão periódica» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Activities precisam de revisão periódica obrigatória?

Exemplo:

```text
6 meses

12 meses

configurável
```

---

## BRQ-010 — Novo System/Supplier

**Status:** OPEN  
**Priority:** HIGH  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md), [DASHBOARD.md](features/DASHBOARD.md), [SUPPLIERS.md](features/SUPPLIERS.md), [SYSTEMS.md](features/SYSTEMS.md)  
**Affected Delivery:** Business Rules / Processing Activity / Compliance Gate  
**Blocks:** implementar a decisão «Novo System/Supplier» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Qual o efeito de:

```text
System PENDING

Supplier PENDING
```

sobre Activity?

Relacionado:

```text
SYSQ-007

SUPQ-006
```

---

# 12. Workflow

## WFQ-001 — Status definitivos

**Status:** OPEN  
**Priority:** HIGH  
**Affected Documents:** [06-WORKFLOWS.md](06-WORKFLOWS.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [13-DECISIONS.md](13-DECISIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [15-BACKLOG.md](15-BACKLOG.md), [20-API-CONTRACTS.md](20-API-CONTRACTS.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md), [22-VALIDATION-RULES.md](22-VALIDATION-RULES.md), [23-SEED-AND-CATALOGS.md](23-SEED-AND-CATALOGS.md), [26-RELEASE-CHECKLIST.md](26-RELEASE-CHECKLIST.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md), [MAPPING-WIZARD.md](features/MAPPING-WIZARD.md), [PROCESSING-ACTIVITY.md](features/PROCESSING-ACTIVITY.md)  
**Affected Delivery:** Workflow / revisão / ativação / versionamento  
**Blocks:** implementar a decisão «Status definitivos» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Confirmar estados:

```text
DRAFT

MAPPING

PENDING_REVIEW

COMPLIANCE_PENDING

ACTIVE

UNDER_REVIEW

ARCHIVED
```

---

## WFQ-002 — Submit

**Status:** OPEN  
**Priority:** HIGH  
**Affected Documents:** [06-WORKFLOWS.md](06-WORKFLOWS.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [15-BACKLOG.md](15-BACKLOG.md), [22-VALIDATION-RULES.md](22-VALIDATION-RULES.md), [24-NOTIFICATIONS.md](24-NOTIFICATIONS.md), [MAPPING-WIZARD.md](features/MAPPING-WIZARD.md), [PROCESSING-ACTIVITY.md](features/PROCESSING-ACTIVITY.md)  
**Affected Delivery:** Workflow / revisão / ativação / versionamento  
**Blocks:** implementar a decisão «Submit» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Submit leva Activity para:

```text
PENDING_REVIEW
```

ou diretamente:

```text
COMPLIANCE_PENDING
```

?

---

## WFQ-003 — Reviewer

**Status:** OPEN  
**Priority:** CRITICAL  
**Affected Documents:** [06-WORKFLOWS.md](06-WORKFLOWS.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md), [24-NOTIFICATIONS.md](24-NOTIFICATIONS.md), [25-UX-GUIDELINES.md](25-UX-GUIDELINES.md), [COMPLIANCE-GATE.md](features/COMPLIANCE-GATE.md), [PROCESSING-ACTIVITY.md](features/PROCESSING-ACTIVITY.md)  
**Affected Delivery:** Workflow / revisão / ativação / versionamento  
**Blocks:** implementar a decisão «Reviewer» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Quem executa revisão?

---


### Contexto consolidado

Origem: WFQ-003.

### Question

Quem pode revisar uma Activity?

```text
Manager

DPO

ambos

papel específico
```

---

## WFQ-004 — Ativação após Gate

**Status:** OPEN  
**Priority:** CRITICAL  
**Affected Documents:** [06-WORKFLOWS.md](06-WORKFLOWS.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [15-BACKLOG.md](15-BACKLOG.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md), [22-VALIDATION-RULES.md](22-VALIDATION-RULES.md), [25-UX-GUIDELINES.md](25-UX-GUIDELINES.md), [26-RELEASE-CHECKLIST.md](26-RELEASE-CHECKLIST.md), [27-AI-DEVELOPMENT-GUIDE.md](27-AI-DEVELOPMENT-GUIDE.md), [COMPLIANCE-GATE.md](features/COMPLIANCE-GATE.md), [PROCESSING-ACTIVITY.md](features/PROCESSING-ACTIVITY.md)  
**Affected Delivery:** Workflow / revisão / ativação / versionamento  
**Blocks:** implementar a decisão «Ativação após Gate» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Quando Gate vira:

```text
COMPLETE
```

Activity:

```text
vira ACTIVE automaticamente
```

ou:

```text
aguarda aprovação humana
```

?

---

## WFQ-005 — REVIEW_REQUIRED

**Status:** OPEN  
**Priority:** CRITICAL  
**Affected Documents:** [AGENTS.md](../AGENTS.md), [06-WORKFLOWS.md](06-WORKFLOWS.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [15-BACKLOG.md](15-BACKLOG.md), [22-VALIDATION-RULES.md](22-VALIDATION-RULES.md), [24-NOTIFICATIONS.md](24-NOTIFICATIONS.md), [26-RELEASE-CHECKLIST.md](26-RELEASE-CHECKLIST.md), [COMPLIANCE-GATE.md](features/COMPLIANCE-GATE.md), [PROCESSING-ACTIVITY.md](features/PROCESSING-ACTIVITY.md)  
**Affected Delivery:** Workflow / revisão / ativação / versionamento  
**Blocks:** implementar a decisão «REVIEW_REQUIRED» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Quem pode resolver:

```text
REVIEW_REQUIRED
```

e qual é o resultado dessa resolução?

---

## WFQ-006 — BLOCKED

**Status:** OPEN  
**Priority:** CRITICAL  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [15-BACKLOG.md](15-BACKLOG.md), [22-VALIDATION-RULES.md](22-VALIDATION-RULES.md), [COMPLIANCE-GATE.md](features/COMPLIANCE-GATE.md), [PROCESSING-ACTIVITY.md](features/PROCESSING-ACTIVITY.md), [SUPPLIERS.md](features/SUPPLIERS.md), [SYSTEMS.md](features/SYSTEMS.md)  
**Affected Delivery:** Workflow / revisão / ativação / versionamento  
**Blocks:** implementar a decisão «BLOCKED» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Qual transição ocorre quando Gate resulta em condição bloqueante?

---

## WFQ-007 — Alteração de ACTIVE

**Status:** OPEN  
**Priority:** CRITICAL  
**Affected Documents:** [06-WORKFLOWS.md](06-WORKFLOWS.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [13-DECISIONS.md](13-DECISIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [15-BACKLOG.md](15-BACKLOG.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md), [22-VALIDATION-RULES.md](22-VALIDATION-RULES.md), [25-UX-GUIDELINES.md](25-UX-GUIDELINES.md), [26-RELEASE-CHECKLIST.md](26-RELEASE-CHECKLIST.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md), [COMPLIANCE-GATE.md](features/COMPLIANCE-GATE.md), [MAPPING-WIZARD.md](features/MAPPING-WIZARD.md), [PROCESSING-ACTIVITY.md](features/PROCESSING-ACTIVITY.md)  
**Affected Delivery:** Workflow / revisão / ativação / versionamento  
**Blocks:** implementar a decisão «Alteração de ACTIVE» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Editar Activity ACTIVE:

```text
altera diretamente
```

ou:

```text
cria nova revisão/version
```

?

### Recommendation

Arquitetura atual favorece:

```text
nova revisão/version
```

---

## WFQ-008 — Versão publicada durante revisão

**Status:** OPEN  
**Priority:** CRITICAL  
**Affected Documents:** [06-WORKFLOWS.md](06-WORKFLOWS.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [15-BACKLOG.md](15-BACKLOG.md), [16-CODING-STANDARDS.md](16-CODING-STANDARDS.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md), [25-UX-GUIDELINES.md](25-UX-GUIDELINES.md), [26-RELEASE-CHECKLIST.md](26-RELEASE-CHECKLIST.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md), [COMPLIANCE-GATE.md](features/COMPLIANCE-GATE.md), [DASHBOARD.md](features/DASHBOARD.md), [PROCESSING-ACTIVITY.md](features/PROCESSING-ACTIVITY.md), [ROPA.md](features/ROPA.md)  
**Affected Delivery:** Workflow / revisão / ativação / versionamento  
**Blocks:** implementar a decisão «Versão publicada durante revisão» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Durante:

```text
v1 ACTIVE
v2 UNDER_REVIEW
```

o sistema continua considerando:

```text
v1
```

como versão publicada?

---

## WFQ-009 — Rejeição

**Status:** OPEN  
**Priority:** HIGH  
**Affected Documents:** [06-WORKFLOWS.md](06-WORKFLOWS.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md), [24-NOTIFICATIONS.md](24-NOTIFICATIONS.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md), [PROCESSING-ACTIVITY.md](features/PROCESSING-ACTIVITY.md)  
**Affected Delivery:** Workflow / revisão / ativação / versionamento  
**Blocks:** implementar a decisão «Rejeição» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Existe operação explícita:

```text
REJECT
```

?

Para qual status retorna?

---

## WFQ-010 — Cancelar revisão

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md)  
**Affected Delivery:** Workflow / revisão / ativação / versionamento  
**Blocks:** implementar a decisão «Cancelar revisão» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Usuário pode abandonar uma nova revisão e manter versão anterior?

---

## WFQ-011 — Reativação

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [06-WORKFLOWS.md](06-WORKFLOWS.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [PROCESSING-ACTIVITY.md](features/PROCESSING-ACTIVITY.md)  
**Affected Delivery:** Workflow / revisão / ativação / versionamento  
**Blocks:** implementar a decisão «Reativação» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Activity ARCHIVED pode ser reativada?

---

## WFQ-012 — Delete de Draft

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [20-API-CONTRACTS.md](20-API-CONTRACTS.md), [PROCESSING-ACTIVITY.md](features/PROCESSING-ACTIVITY.md)  
**Affected Delivery:** Workflow / revisão / ativação / versionamento  
**Blocks:** implementar a decisão «Delete de Draft» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Activity DRAFT nunca publicada pode ser deletada fisicamente?

---

# 13. Processing Activity

## PAQ-001 — Description

**Status:** OPEN  
**Priority:** LOW  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [20-API-CONTRACTS.md](20-API-CONTRACTS.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md), [22-VALIDATION-RULES.md](22-VALIDATION-RULES.md), [MAPPING-WIZARD.md](features/MAPPING-WIZARD.md), [PROCESSING-ACTIVITY.md](features/PROCESSING-ACTIVITY.md)  
**Affected Delivery:** Processing Activity  
**Blocks:** implementar a decisão «Description» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

`description` é obrigatória?

---

### Alias global: PAQ-002 → DQ-009

Responsável individual pela atividade; mesma decisão de DQ-009. Status e prioridade são somente os da questão canônica.

---

## PAQ-003 — Áreas participantes

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [02-DOMAIN.md](02-DOMAIN.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [20-API-CONTRACTS.md](20-API-CONTRACTS.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md), [22-VALIDATION-RULES.md](22-VALIDATION-RULES.md), [PROCESSING-ACTIVITY.md](features/PROCESSING-ACTIVITY.md)  
**Affected Delivery:** Processing Activity  
**Blocks:** implementar a decisão «Áreas participantes» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Além da área responsável, Activity pode possuir:

```text
participatingBusinessUnits[]
```

?

---

## PAQ-004 — Clone

**Status:** OPEN  
**Priority:** LOW  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md), [PROCESSING-ACTIVITY.md](features/PROCESSING-ACTIVITY.md)  
**Affected Delivery:** Processing Activity  
**Blocks:** implementar a decisão «Clone» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

V1 precisa:

```text
Duplicar Activity
```

?

---

## PAQ-005 — Tags

**Status:** OPEN  
**Priority:** LOW  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md), [PROCESSING-ACTIVITY.md](features/PROCESSING-ACTIVITY.md)  
**Affected Delivery:** Processing Activity  
**Blocks:** implementar a decisão «Tags» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Activities precisam de tags?

---

## PAQ-006 — Submit vs Gate

**Status:** OPEN  
**Priority:** CRITICAL  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [15-BACKLOG.md](15-BACKLOG.md), [22-VALIDATION-RULES.md](22-VALIDATION-RULES.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md), [COMPLIANCE-GATE.md](features/COMPLIANCE-GATE.md), [MAPPING-WIZARD.md](features/MAPPING-WIZARD.md), [PROCESSING-ACTIVITY.md](features/PROCESSING-ACTIVITY.md)  
**Affected Delivery:** Processing Activity  
**Blocks:** implementar a decisão «Submit vs Gate» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Quais campos são:

```text
obrigatórios para Submit
```

e quais são:

```text
avaliados somente pelo Compliance Gate
```

?

### Priority Rationale

Em 2026-09-18, o usuário confirmou CRITICAL após consolidar VALQ-003. A lista exata de requisitos de Submit é necessária para implementar validação e workflow. VALQ-003 permanece alias, sem segunda decisão. Draft incompleto e fundação técnica não são automaticamente bloqueados.

---

## PAQ-007 — Alterações não relevantes

**Status:** OPEN  
**Priority:** HIGH  
**Affected Documents:** [03-DATABASE.md](03-DATABASE.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [13-DECISIONS.md](13-DECISIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [15-BACKLOG.md](15-BACKLOG.md), [22-VALIDATION-RULES.md](22-VALIDATION-RULES.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md), [PROCESSING-ACTIVITY.md](features/PROCESSING-ACTIVITY.md)  
**Affected Delivery:** Processing Activity  
**Blocks:** implementar a decisão «Alterações não relevantes» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Mudança não relevante em Activity ACTIVE exige nova versão?

Exemplo:

```text
correção ortográfica
```

---

# 14. Mapping Wizard

## MWQ-001 — Dados condicionais antigos

**Status:** OPEN  
**Priority:** HIGH  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [15-BACKLOG.md](15-BACKLOG.md), [22-VALIDATION-RULES.md](22-VALIDATION-RULES.md), [25-UX-GUIDELINES.md](25-UX-GUIDELINES.md), [26-RELEASE-CHECKLIST.md](26-RELEASE-CHECKLIST.md), [27-AI-DEVELOPMENT-GUIDE.md](27-AI-DEVELOPMENT-GUIDE.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md), [MAPPING-WIZARD.md](features/MAPPING-WIZARD.md)  
**Affected Delivery:** Mapping Wizard  
**Blocks:** implementar a decisão «Dados condicionais antigos» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Quando resposta faz uma etapa condicional deixar de ser aplicável, os dados anteriormente preenchidos devem ser:

```text
deletados

inativados

mantidos sem efeito

preservados apenas no histórico
```

?

---

## MWQ-002 — Resume

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [15-BACKLOG.md](15-BACKLOG.md), [22-VALIDATION-RULES.md](22-VALIDATION-RULES.md), [25-UX-GUIDELINES.md](25-UX-GUIDELINES.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md), [MAPPING-WIZARD.md](features/MAPPING-WIZARD.md)  
**Affected Delivery:** Mapping Wizard  
**Blocks:** implementar a decisão «Resume» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Ao retomar Wizard:

```text
abrir última etapa visitada
```

ou:

```text
primeira etapa incompleta
```

?

---

## MWQ-003 — Progress

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [15-BACKLOG.md](15-BACKLOG.md), [22-VALIDATION-RULES.md](22-VALIDATION-RULES.md), [25-UX-GUIDELINES.md](25-UX-GUIDELINES.md), [MAPPING-WIZARD.md](features/MAPPING-WIZARD.md)  
**Affected Delivery:** Mapping Wizard  
**Blocks:** implementar a decisão «Progress» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Percentual/progresso do Wizard será calculado:

```text
frontend

backend

ambos com backend autoritativo
```

?

---

## MWQ-004 — Múltiplas fontes

**Status:** OPEN  
**Priority:** HIGH  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [15-BACKLOG.md](15-BACKLOG.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md), [22-VALIDATION-RULES.md](22-VALIDATION-RULES.md), [23-SEED-AND-CATALOGS.md](23-SEED-AND-CATALOGS.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md), [MAPPING-WIZARD.md](features/MAPPING-WIZARD.md)  
**Affected Delivery:** Mapping Wizard  
**Blocks:** implementar a decisão «Múltiplas fontes» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Activity pode possuir múltiplas:

```text
CollectionSources
```

?

---

## MWQ-005 — Start Event de retenção

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [15-BACKLOG.md](15-BACKLOG.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md), [22-VALIDATION-RULES.md](22-VALIDATION-RULES.md), [23-SEED-AND-CATALOGS.md](23-SEED-AND-CATALOGS.md), [MAPPING-WIZARD.md](features/MAPPING-WIZARD.md)  
**Affected Delivery:** Mapping Wizard  
**Blocks:** implementar a decisão «Start Event de retenção» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

`RetentionPolicy.startEvent` será:

```text
texto livre

catálogo

modelo híbrido
```

?

---

# 15. Compliance Gate

## CGQ-001 — Resolução de REVIEW_REQUIRED

**Status:** OPEN  
**Priority:** CRITICAL  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [15-BACKLOG.md](15-BACKLOG.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md), [22-VALIDATION-RULES.md](22-VALIDATION-RULES.md), [24-NOTIFICATIONS.md](24-NOTIFICATIONS.md), [25-UX-GUIDELINES.md](25-UX-GUIDELINES.md), [26-RELEASE-CHECKLIST.md](26-RELEASE-CHECKLIST.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md), [COMPLIANCE-GATE.md](features/COMPLIANCE-GATE.md)  
**Affected Delivery:** Compliance Gate  
**Blocks:** implementar a decisão «Resolução de REVIEW_REQUIRED» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Como:

```text
REVIEW_REQUIRED
```

é resolvido?

Possibilidades:

```text
status muda para PASS

permanece REVIEW_REQUIRED + resolvedAt

gera decisão separada

novo check substitui o anterior
```

---

## CGQ-002 — Justificativa

**Status:** OPEN  
**Priority:** HIGH  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [15-BACKLOG.md](15-BACKLOG.md), [19-ERROR-CATALOG.md](19-ERROR-CATALOG.md), [22-VALIDATION-RULES.md](22-VALIDATION-RULES.md), [25-UX-GUIDELINES.md](25-UX-GUIDELINES.md), [COMPLIANCE-GATE.md](features/COMPLIANCE-GATE.md)  
**Affected Delivery:** Compliance Gate  
**Blocks:** implementar a decisão «Justificativa» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Resolver revisão exige:

```text
justification
```

obrigatória?

---

## CGQ-003 — ComplianceRun

**Status:** OPEN  
**Priority:** CRITICAL  
**Affected Documents:** [03-DATABASE.md](03-DATABASE.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [15-BACKLOG.md](15-BACKLOG.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md), [26-RELEASE-CHECKLIST.md](26-RELEASE-CHECKLIST.md), [COMPLIANCE-GATE.md](features/COMPLIANCE-GATE.md), [ROPA.md](features/ROPA.md)  
**Affected Delivery:** Compliance Gate  
**Blocks:** implementar a decisão «ComplianceRun» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Cada execução gera:

```text
ComplianceRun
```

imutável?

Ou checks representam apenas estado atual?

---

## CGQ-004 — Reexecução

**Status:** OPEN  
**Priority:** CRITICAL  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [22-VALIDATION-RULES.md](22-VALIDATION-RULES.md), [25-UX-GUIDELINES.md](25-UX-GUIDELINES.md), [26-RELEASE-CHECKLIST.md](26-RELEASE-CHECKLIST.md), [COMPLIANCE-GATE.md](features/COMPLIANCE-GATE.md)  
**Affected Delivery:** Compliance Gate  
**Blocks:** implementar a decisão «Reexecução» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Após mudança relevante:

```text
Gate reexecuta automaticamente
```

ou:

```text
Gate é invalidado e exige nova execução
```

?

---

## CGQ-005 — Snapshot

**Status:** OPEN  
**Priority:** CRITICAL  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [15-BACKLOG.md](15-BACKLOG.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md), [22-VALIDATION-RULES.md](22-VALIDATION-RULES.md), [26-RELEASE-CHECKLIST.md](26-RELEASE-CHECKLIST.md), [COMPLIANCE-GATE.md](features/COMPLIANCE-GATE.md), [ROPA.md](features/ROPA.md)  
**Affected Delivery:** Compliance Gate  
**Blocks:** implementar a decisão «Snapshot» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Gate avalia:

```text
live state
```

ou:

```text
ActivityVersion/snapshot identificável
```

?

### Recommendation

Preferir versão/snapshot identificável.

---

## CGQ-006 — Configurabilidade

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md), [COMPLIANCE-GATE.md](features/COMPLIANCE-GATE.md)  
**Affected Delivery:** Compliance Gate  
**Blocks:** implementar a decisão «Configurabilidade» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Gate será:

```text
fixo
```

ou configurável por Organization?

---

## CGQ-007 — Rule Version

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md), [23-SEED-AND-CATALOGS.md](23-SEED-AND-CATALOGS.md), [26-RELEASE-CHECKLIST.md](26-RELEASE-CHECKLIST.md), [COMPLIANCE-GATE.md](features/COMPLIANCE-GATE.md)  
**Affected Delivery:** Compliance Gate  
**Blocks:** implementar a decisão «Rule Version» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

ComplianceRun registra:

```text
ruleVersion
```

?

---

# 16. ROPA

## ROPAQ-001 — Granularidade

**Status:** OPEN  
**Priority:** HIGH  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [15-BACKLOG.md](15-BACKLOG.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md), [ROPA.md](features/ROPA.md), [SUPPLIERS.md](features/SUPPLIERS.md)  
**Affected Delivery:** ROPA / exportação  
**Blocks:** implementar a decisão «Granularidade» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Uma linha representa:

```text
Activity

Activity + Purpose

Activity + Purpose + LegalBasis
```

ou outra granularidade?

---

## ROPAQ-002 — Status incluídos

**Status:** OPEN  
**Priority:** HIGH  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [15-BACKLOG.md](15-BACKLOG.md), [DASHBOARD.md](features/DASHBOARD.md), [ROPA.md](features/ROPA.md)  
**Affected Delivery:** ROPA / exportação  
**Blocks:** implementar a decisão «Status incluídos» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Quais Activities aparecem no ROPA oficial?

Proposta inicial:

```text
ACTIVE
```

---

## ROPAQ-003 — Última atualização

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [15-BACKLOG.md](15-BACKLOG.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md), [DASHBOARD.md](features/DASHBOARD.md), [ROPA.md](features/ROPA.md)  
**Affected Delivery:** ROPA / exportação  
**Blocks:** implementar a decisão «Última atualização» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Representa:

```text
updatedAt

publishedAt

approvedAt
```

?

---

## ROPAQ-004 — Export com filtros

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [15-BACKLOG.md](15-BACKLOG.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md), [ROPA.md](features/ROPA.md)  
**Affected Delivery:** ROPA / exportação  
**Blocks:** implementar a decisão «Export com filtros» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Exportação:

```text
sempre completa

respeita filtros

permite ambos
```

?

---

## ROPAQ-005 — Arquivo exportado

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [15-BACKLOG.md](15-BACKLOG.md), [17-ENVIRONMENTS-AND-DEPLOYMENT.md](17-ENVIRONMENTS-AND-DEPLOYMENT.md), [18-OBSERVABILITY.md](18-OBSERVABILITY.md), [ROPA.md](features/ROPA.md)  
**Affected Delivery:** ROPA / exportação  
**Blocks:** implementar a decisão «Arquivo exportado» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Export será:

```text
streamed
```

ou armazenado temporariamente?

Se armazenado:

```text
por quanto tempo?
```

---

## ROPAQ-006 — Audit de leitura

**Status:** OPEN  
**Priority:** LOW  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md), [ROPA.md](features/ROPA.md)  
**Affected Delivery:** ROPA / exportação  
**Blocks:** implementar a decisão «Audit de leitura» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Visualização do ROPA gera AuditLog?

---

## ROPAQ-007 — Histórico

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [ROPA.md](features/ROPA.md)  
**Affected Delivery:** ROPA / exportação  
**Blocks:** implementar a decisão «Histórico» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

V1 precisa consultar ROPA histórico por data?

---

## ROPAQ-008 — Snapshot do export

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [15-BACKLOG.md](15-BACKLOG.md), [19-ERROR-CATALOG.md](19-ERROR-CATALOG.md), [ROPA.md](features/ROPA.md)  
**Affected Delivery:** ROPA / exportação  
**Blocks:** implementar a decisão «Snapshot do export» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Export precisa representar snapshot consistente do momento da geração?

### Recommendation

Sim, especialmente para relatório oficial.

---

# 17. Systems

## SYSQ-001 — Classificação

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md), [23-SEED-AND-CATALOGS.md](23-SEED-AND-CATALOGS.md), [SYSTEMS.md](features/SYSTEMS.md)  
**Affected Delivery:** Systems  
**Blocks:** implementar a decisão «Classificação» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

System precisa de classificação?

Possibilidades:

```text
INTERNAL

EXTERNAL

SAAS

ON_PREMISE

OTHER
```

---

## SYSQ-002 — Critérios para MAPPED

**Status:** OPEN  
**Priority:** CRITICAL  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [13-DECISIONS.md](13-DECISIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [15-BACKLOG.md](15-BACKLOG.md), [19-ERROR-CATALOG.md](19-ERROR-CATALOG.md), [20-API-CONTRACTS.md](20-API-CONTRACTS.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md), [22-VALIDATION-RULES.md](22-VALIDATION-RULES.md), [27-AI-DEVELOPMENT-GUIDE.md](27-AI-DEVELOPMENT-GUIDE.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md), [DASHBOARD.md](features/DASHBOARD.md), [SYSTEMS.md](features/SYSTEMS.md)  
**Affected Delivery:** Systems  
**Blocks:** implementar a decisão «Critérios para MAPPED» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Quais informações tornam:

```text
System.mappingStatus = MAPPED
```

?

---

## SYSQ-003 — Área responsável

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md), [SYSTEMS.md](features/SYSTEMS.md)  
**Affected Delivery:** Systems  
**Blocks:** implementar a decisão «Área responsável» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

System possui:

```text
responsibleBusinessUnitId
```

?

Qual semântica?

---

## SYSQ-004 — Supplier

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [15-BACKLOG.md](15-BACKLOG.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md), [SUPPLIERS.md](features/SUPPLIERS.md), [SYSTEMS.md](features/SYSTEMS.md)  
**Affected Delivery:** Systems  
**Blocks:** implementar a decisão «Supplier» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Qual cardinalidade:

```text
System ↔ Supplier
```

?

---

## SYSQ-005 — Activity ↔ System

**Status:** OPEN  
**Priority:** CRITICAL  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [15-BACKLOG.md](15-BACKLOG.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md), [22-VALIDATION-RULES.md](22-VALIDATION-RULES.md), [SYSTEMS.md](features/SYSTEMS.md)  
**Affected Delivery:** Systems  
**Blocks:** implementar a decisão «Activity ↔ System» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

A associação ocorre:

```text
somente pelo contexto

diretamente

ou por ambos
```

?

---

## SYSQ-006 — Operation ↔ System

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [15-BACKLOG.md](15-BACKLOG.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md), [22-VALIDATION-RULES.md](22-VALIDATION-RULES.md), [SYSTEMS.md](features/SYSTEMS.md)  
**Affected Delivery:** Systems  
**Blocks:** implementar a decisão «Operation ↔ System» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Uma ProcessingOperation utiliza:

```text
1 System
```

ou:

```text
N Systems
```

?

---

## SYSQ-007 — System PENDING

**Status:** OPEN  
**Priority:** CRITICAL  
**Affected Documents:** [05-BUSINESS-RULES.md](05-BUSINESS-RULES.md), [06-WORKFLOWS.md](06-WORKFLOWS.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [13-DECISIONS.md](13-DECISIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [15-BACKLOG.md](15-BACKLOG.md), [16-CODING-STANDARDS.md](16-CODING-STANDARDS.md), [19-ERROR-CATALOG.md](19-ERROR-CATALOG.md), [22-VALIDATION-RULES.md](22-VALIDATION-RULES.md), [24-NOTIFICATIONS.md](24-NOTIFICATIONS.md), [26-RELEASE-CHECKLIST.md](26-RELEASE-CHECKLIST.md), [27-AI-DEVELOPMENT-GUIDE.md](27-AI-DEVELOPMENT-GUIDE.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md), [DASHBOARD.md](features/DASHBOARD.md), [SUPPLIERS.md](features/SUPPLIERS.md), [SYSTEMS.md](features/SYSTEMS.md)  
**Affected Delivery:** Systems  
**Blocks:** implementar a decisão «System PENDING» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

System PENDING:

```text
bloqueia Submit

bloqueia Gate

bloqueia ACTIVE

gera REVIEW_REQUIRED

gera warning
```

?

---

### Alias global: SYSQ-008 → DASHQ-008

Antiguidade deste recurso e eventual limiar específico são definidos exclusivamente em DASHQ-008, conforme DEC-033. Alias sem Status ou Priority próprios.

---

## SYSQ-009 — Delete

**Status:** OPEN  
**Priority:** LOW  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md), [SYSTEMS.md](features/SYSTEMS.md)  
**Affected Delivery:** Systems  
**Blocks:** implementar a decisão «Delete» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

System nunca utilizado pode ser deletado fisicamente?

---

## SYSQ-010 — Unicidade

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [19-ERROR-CATALOG.md](19-ERROR-CATALOG.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md), [22-VALIDATION-RULES.md](22-VALIDATION-RULES.md), [SYSTEMS.md](features/SYSTEMS.md)  
**Affected Delivery:** Systems  
**Blocks:** implementar a decisão «Unicidade» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Nome do System deve ser único dentro da Organization?

---

## SYSQ-011 — Quick Create

**Status:** OPEN  
**Priority:** CRITICAL  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [15-BACKLOG.md](15-BACKLOG.md), [20-API-CONTRACTS.md](20-API-CONTRACTS.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md), [SYSTEMS.md](features/SYSTEMS.md)  
**Affected Delivery:** Systems  
**Blocks:** implementar a decisão «Quick Create» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Quem pode executar Quick Create de System?

---

## SYSQ-012 — Versionamento

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [SYSTEMS.md](features/SYSTEMS.md)  
**Affected Delivery:** Systems  
**Blocks:** implementar a decisão «Versionamento» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

System precisa de versionamento próprio?

---

## SYSQ-013 — Merge

**Status:** DEFERRED  
**Priority:** LOW  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [SYSTEMS.md](features/SYSTEMS.md)  
**Affected Delivery:** Systems  
**Blocks:** implementar a decisão «Merge» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Será necessário merge de Systems duplicados?

---

# 18. Suppliers

## SUPQ-001 — Dados empresariais

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md), [SUPPLIERS.md](features/SUPPLIERS.md)  
**Affected Delivery:** Suppliers  
**Blocks:** implementar a decisão «Dados empresariais» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Supplier precisa armazenar:

```text
legalName

tradeName

CNPJ/document identifier
```

?

---

## SUPQ-002 — Critérios para MAPPED

**Status:** OPEN  
**Priority:** CRITICAL  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [13-DECISIONS.md](13-DECISIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [15-BACKLOG.md](15-BACKLOG.md), [19-ERROR-CATALOG.md](19-ERROR-CATALOG.md), [20-API-CONTRACTS.md](20-API-CONTRACTS.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md), [22-VALIDATION-RULES.md](22-VALIDATION-RULES.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md), [DASHBOARD.md](features/DASHBOARD.md), [SUPPLIERS.md](features/SUPPLIERS.md)  
**Affected Delivery:** Suppliers  
**Blocks:** implementar a decisão «Critérios para MAPPED» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Quais informações tornam:

```text
Supplier.mappingStatus = MAPPED
```

?

---

## SUPQ-003 — Papel de privacidade

**Status:** OPEN  
**Priority:** CRITICAL  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [15-BACKLOG.md](15-BACKLOG.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md), [22-VALIDATION-RULES.md](22-VALIDATION-RULES.md), [23-SEED-AND-CATALOGS.md](23-SEED-AND-CATALOGS.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md), [SUPPLIERS.md](features/SUPPLIERS.md)  
**Affected Delivery:** Suppliers  
**Blocks:** implementar a decisão «Papel de privacidade» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Supplier possui papel:

```text
OPERATOR

CONTROLLER

JOINT_CONTROLLER

OTHER
```

globalmente ou por Activity?

---

## SUPQ-004 — Activity ↔ Supplier

**Status:** OPEN  
**Priority:** CRITICAL  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [15-BACKLOG.md](15-BACKLOG.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md), [22-VALIDATION-RULES.md](22-VALIDATION-RULES.md), [SUPPLIERS.md](features/SUPPLIERS.md)  
**Affected Delivery:** Suppliers  
**Blocks:** implementar a decisão «Activity ↔ Supplier» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Associação ocorre:

```text
diretamente

por Recipient/System/Operation

ou ambos
```

?

---

## SUPQ-005 — País

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md), [23-SEED-AND-CATALOGS.md](23-SEED-AND-CATALOGS.md), [SUPPLIERS.md](features/SUPPLIERS.md)  
**Affected Delivery:** Suppliers  
**Blocks:** implementar a decisão «País» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Supplier possui `country`?

---

## SUPQ-006 — Supplier PENDING

**Status:** OPEN  
**Priority:** CRITICAL  
**Affected Documents:** [05-BUSINESS-RULES.md](05-BUSINESS-RULES.md), [06-WORKFLOWS.md](06-WORKFLOWS.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [13-DECISIONS.md](13-DECISIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [19-ERROR-CATALOG.md](19-ERROR-CATALOG.md), [22-VALIDATION-RULES.md](22-VALIDATION-RULES.md), [24-NOTIFICATIONS.md](24-NOTIFICATIONS.md), [26-RELEASE-CHECKLIST.md](26-RELEASE-CHECKLIST.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md), [DASHBOARD.md](features/DASHBOARD.md), [SUPPLIERS.md](features/SUPPLIERS.md), [SYSTEMS.md](features/SYSTEMS.md)  
**Affected Delivery:** Suppliers  
**Blocks:** implementar a decisão «Supplier PENDING» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Supplier PENDING:

```text
bloqueia Submit

bloqueia Gate

bloqueia ACTIVE

gera REVIEW_REQUIRED

gera warning
```

?

---

### Alias global: SUPQ-007 → DASHQ-008

Antiguidade deste recurso e eventual limiar específico são definidos exclusivamente em DASHQ-008, conforme DEC-033. Alias sem Status ou Priority próprios.

---

## SUPQ-008 — Delete

**Status:** OPEN  
**Priority:** LOW  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md), [SUPPLIERS.md](features/SUPPLIERS.md)  
**Affected Delivery:** Suppliers  
**Blocks:** implementar a decisão «Delete» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Supplier nunca utilizado pode ser deletado?

---

## SUPQ-009 — Inativação com Activity ACTIVE

**Status:** OPEN  
**Priority:** HIGH  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [15-BACKLOG.md](15-BACKLOG.md), [19-ERROR-CATALOG.md](19-ERROR-CATALOG.md), [22-VALIDATION-RULES.md](22-VALIDATION-RULES.md), [SUPPLIERS.md](features/SUPPLIERS.md)  
**Affected Delivery:** Suppliers  
**Blocks:** implementar a decisão «Inativação com Activity ACTIVE» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

O que ocorre quando Supplier é inativado enquanto Activities ACTIVE ainda o utilizam?

---

## SUPQ-010 — Unicidade

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [19-ERROR-CATALOG.md](19-ERROR-CATALOG.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md), [22-VALIDATION-RULES.md](22-VALIDATION-RULES.md), [SUPPLIERS.md](features/SUPPLIERS.md)  
**Affected Delivery:** Suppliers  
**Blocks:** implementar a decisão «Unicidade» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Supplier deve possuir nome único dentro da Organization?

---

## SUPQ-011 — Quick Create

**Status:** OPEN  
**Priority:** CRITICAL  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [15-BACKLOG.md](15-BACKLOG.md), [20-API-CONTRACTS.md](20-API-CONTRACTS.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md), [SUPPLIERS.md](features/SUPPLIERS.md)  
**Affected Delivery:** Suppliers  
**Blocks:** implementar a decisão «Quick Create» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Quem pode criar Supplier pelo Wizard?

---

## SUPQ-012 — Versionamento

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [SUPPLIERS.md](features/SUPPLIERS.md)  
**Affected Delivery:** Suppliers  
**Blocks:** implementar a decisão «Versionamento» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Supplier precisa de versionamento próprio?

---

## SUPQ-013 — Contatos

**Status:** DEFERRED  
**Priority:** LOW  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md), [SUPPLIERS.md](features/SUPPLIERS.md)  
**Affected Delivery:** Suppliers  
**Blocks:** implementar a decisão «Contatos» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

V1 precisa armazenar contatos do fornecedor?

---

## SUPQ-014 — Merge

**Status:** DEFERRED  
**Priority:** LOW  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [SUPPLIERS.md](features/SUPPLIERS.md)  
**Affected Delivery:** Suppliers  
**Blocks:** implementar a decisão «Merge» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Será necessário merge de Suppliers duplicados?

---

# 19. Dashboard

## DASHQ-001 — Público

**Status:** OPEN  
**Priority:** HIGH  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [15-BACKLOG.md](15-BACKLOG.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md), [DASHBOARD.md](features/DASHBOARD.md)  
**Affected Delivery:** Dashboard  
**Blocks:** implementar a decisão «Público» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Dashboard é exclusivo para:

```text
DPO
```

ou também:

```text
Manager

Collaborator

Admin
```

?

---

## DASHQ-002 — Percentual

**Status:** OPEN  
**Priority:** CRITICAL  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [15-BACKLOG.md](15-BACKLOG.md), [20-API-CONTRACTS.md](20-API-CONTRACTS.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md), [25-UX-GUIDELINES.md](25-UX-GUIDELINES.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md), [DASHBOARD.md](features/DASHBOARD.md)  
**Affected Delivery:** Dashboard  
**Blocks:** implementar a decisão «Percentual» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Qual fórmula define:

```text
% de mapeamento concluído
```

?

---

## DASHQ-003 — Universo

**Status:** OPEN  
**Priority:** CRITICAL  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [15-BACKLOG.md](15-BACKLOG.md), [20-API-CONTRACTS.md](20-API-CONTRACTS.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md), [25-UX-GUIDELINES.md](25-UX-GUIDELINES.md), [DASHBOARD.md](features/DASHBOARD.md)  
**Affected Delivery:** Dashboard  
**Blocks:** implementar a decisão «Universo» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Quais Activities entram no denominador?

---

## DASHQ-004 — PENDING vs BLOCKED

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md), [DASHBOARD.md](features/DASHBOARD.md)  
**Affected Delivery:** Dashboard  
**Blocks:** implementar a decisão «PENDING vs BLOCKED» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Dashboard mostra:

```text
PENDING
```

e:

```text
BLOCKED
```

separadamente?

---

## DASHQ-005 — Transferência em revisão

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [DASHBOARD.md](features/DASHBOARD.md)  
**Affected Delivery:** Dashboard  
**Blocks:** implementar a decisão «Transferência em revisão» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Mostrar indicador específico para transferências internacionais aguardando revisão?

---

## DASHQ-006 — Definição de pendência

**Status:** OPEN  
**Priority:** CRITICAL  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [15-BACKLOG.md](15-BACKLOG.md), [20-API-CONTRACTS.md](20-API-CONTRACTS.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md), [24-NOTIFICATIONS.md](24-NOTIFICATIONS.md), [25-UX-GUIDELINES.md](25-UX-GUIDELINES.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md), [DASHBOARD.md](features/DASHBOARD.md)  
**Affected Delivery:** Dashboard  
**Blocks:** implementar a decisão «Definição de pendência» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Quais estados/entidades constituem uma pendência?

---

## DASHQ-007 — Pending Since

**Status:** OPEN  
**Priority:** CRITICAL  
**Affected Documents:** [06-WORKFLOWS.md](06-WORKFLOWS.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [13-DECISIONS.md](13-DECISIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [15-BACKLOG.md](15-BACKLOG.md), [20-API-CONTRACTS.md](20-API-CONTRACTS.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md), [24-NOTIFICATIONS.md](24-NOTIFICATIONS.md), [25-UX-GUIDELINES.md](25-UX-GUIDELINES.md), [DASHBOARD.md](features/DASHBOARD.md), [SUPPLIERS.md](features/SUPPLIERS.md), [SYSTEMS.md](features/SYSTEMS.md)  
**Affected Delivery:** Dashboard  
**Blocks:** implementar a decisão «Pending Since» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Como determinar:

```text
pendingSince
```

?

---

## DASHQ-008 — Política de antiguidade de pendências

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [06-WORKFLOWS.md](06-WORKFLOWS.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [13-DECISIONS.md](13-DECISIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [15-BACKLOG.md](15-BACKLOG.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md), [24-NOTIFICATIONS.md](24-NOTIFICATIONS.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md), [DASHBOARD.md](features/DASHBOARD.md), [SUPPLIERS.md](features/SUPPLIERS.md), [SYSTEMS.md](features/SYSTEMS.md)  
**Affected Delivery:** Dashboard  
**Blocks:** implementar a decisão «Pendência antiga» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Qual política define quando uma pendência é antiga? Os limiares serão comuns ou diferentes por tipo de recurso (atividades, sistemas e fornecedores)? Serão fixos ou configuráveis por organização?

Nenhum valor de dias está definido. SYSQ-008 e SUPQ-007 são aliases para este registro, pois a possibilidade de limiares diferentes por recurso é decidida aqui, sem decisões paralelas.

### Dependencies

DASHQ-007 determina quando a contagem começa. Não usar updatedAt como início implícito da pendência.

### Delimitação aprovada

DEC-033 centraliza antiguidade neste registro. Disparo de alerta/notificação é decidido separadamente em WFQ-013. Classificar uma pendência como antiga não implica notificação automática.

---

## DASHQ-009 — Filtro temporal

**Status:** OPEN  
**Priority:** LOW  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [DASHBOARD.md](features/DASHBOARD.md)  
**Affected Delivery:** Dashboard  
**Blocks:** implementar a decisão «Filtro temporal» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Dashboard V1 precisa de filtro temporal?

---

## DASHQ-010 — Archived

**Status:** OPEN  
**Priority:** CRITICAL  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [15-BACKLOG.md](15-BACKLOG.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md), [DASHBOARD.md](features/DASHBOARD.md)  
**Affected Delivery:** Dashboard  
**Blocks:** implementar a decisão «Archived» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Activities ARCHIVED entram em quais indicadores?

---

## DASHQ-011 — Versão em revisão

**Status:** OPEN  
**Priority:** CRITICAL  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [15-BACKLOG.md](15-BACKLOG.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md), [DASHBOARD.md](features/DASHBOARD.md)  
**Affected Delivery:** Dashboard  
**Blocks:** implementar a decisão «Versão em revisão» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Qual versão é utilizada para indicadores de conteúdo durante:

```text
UNDER_REVIEW
```

?

---

## DASHQ-012 — Audit

**Status:** OPEN  
**Priority:** LOW  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [DASHBOARD.md](features/DASHBOARD.md)  
**Affected Delivery:** Dashboard  
**Blocks:** implementar a decisão «Audit» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Visualizar Dashboard gera AuditLog?

---

## DASHQ-013 — Endpoints

**Status:** OPEN  
**Priority:** LOW  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [DASHBOARD.md](features/DASHBOARD.md)  
**Affected Delivery:** Dashboard  
**Blocks:** implementar a decisão «Endpoints» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Usar:

```text
endpoint agregado
```

ou endpoints independentes?

---

# 20. Database

## DBQ-001 — ORM

**Status:** DECIDED  
**Priority:** HIGH  
**Affected Documents:** [AGENTS.md](../AGENTS.md), [03-DATABASE.md](03-DATABASE.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [15-BACKLOG.md](15-BACKLOG.md), [23-SEED-AND-CATALOGS.md](23-SEED-AND-CATALOGS.md), [26-RELEASE-CHECKLIST.md](26-RELEASE-CHECKLIST.md), [27-AI-DEVELOPMENT-GUIDE.md](27-AI-DEVELOPMENT-GUIDE.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md)  
**Affected Delivery:** Database / migrations / persistência  
**Blocks:** Decisão registrada; não bloqueia mais por esta questão.

### Question

Utilizar:

```text
Prisma
```

ou:

```text
Drizzle
```

?

---

### Decision

DEC-044: Adotar Drizzle como ORM/query builder. PostgreSQL é a fonte das garantias estruturais: não simplificar constraints, índices ou policies para acomodar o ORM. SQL PostgreSQL específico pode ser usado quando necessário, parametrizado, localizado e versionado. Migrations são versionadas, revisáveis e reproduzíveis desde banco vazio. Queries ficam encapsuladas em repository/persistence.

### Rationale

Aprovação expressa do usuário no lote estrutural de persistência Identity/Tenant.

### Impact

Banco, arquitetura, segurança, testes e plano de implementação harmonizados. Não autoriza implementação nesta etapa.

### Decision Date

2026-09-18


## DBQ-002 — ActivityVersion

**Status:** OPEN  
**Priority:** HIGH  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [13-DECISIONS.md](13-DECISIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [15-BACKLOG.md](15-BACKLOG.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md), [26-RELEASE-CHECKLIST.md](26-RELEASE-CHECKLIST.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md)  
**Affected Delivery:** Database / migrations / persistência  
**Blocks:** implementar a decisão «ActivityVersion» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Versão será armazenada como:

```text
snapshot JSONB

tabelas versionadas

modelo híbrido
```

?

---

## DBQ-003 — Snapshot

**Status:** OPEN  
**Priority:** HIGH  
**Affected Documents:** [10-AUDIT.md](10-AUDIT.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [13-DECISIONS.md](13-DECISIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [15-BACKLOG.md](15-BACKLOG.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md), [26-RELEASE-CHECKLIST.md](26-RELEASE-CHECKLIST.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md)  
**Affected Delivery:** Database / migrations / persistência  
**Blocks:** implementar a decisão «Snapshot» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Quais relações precisam estar presentes no snapshot da Activity?

---

## DBQ-004 — Soft Delete

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [AGENTS.md](../AGENTS.md), [03-DATABASE.md](03-DATABASE.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [13-DECISIONS.md](13-DECISIONS.md), [22-VALIDATION-RULES.md](22-VALIDATION-RULES.md), [26-RELEASE-CHECKLIST.md](26-RELEASE-CHECKLIST.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md)  
**Affected Delivery:** Database / migrations / persistência  
**Blocks:** implementar a decisão «Soft Delete» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Quais entidades utilizarão:

```text
deletedAt
```

?

---

## DBQ-005 — Catálogos globais

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [03-DATABASE.md](03-DATABASE.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md), [23-SEED-AND-CATALOGS.md](23-SEED-AND-CATALOGS.md)  
**Affected Delivery:** Database / migrations / persistência  
**Blocks:** implementar a decisão «Catálogos globais» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Quais catálogos terão:

```text
organization_id = NULL
```

como dados globais do sistema?

### Cobertura parcial aprovada

DEC-049 responde exclusivamente à parte relativa a Role: catálogo global, sem organization_id, com code globalmente único e estável. O vínculo tenant e scope/BusinessUnits permanecem na concessão via Membership/RoleAssignment. A questão permanece OPEN, com prioridade MEDIUM, para os demais catálogos; a decisão não aprova catálogo definitivo de roles ou permissões.

---

## DBQ-006 — ConsentDocument

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md)  
**Affected Delivery:** Database / migrations / persistência  
**Blocks:** implementar a decisão «ConsentDocument» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Documento de consentimento possui entidade própria ou Attachment tipado?

---

## DBQ-007 — Purpose

**Status:** OPEN  
**Priority:** HIGH  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md)  
**Affected Delivery:** Database / migrations / persistência  
**Blocks:** implementar a decisão «Purpose» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Purpose será entidade/tabela própria?

Depende de:

```text
DQ-004
```

---

## DBQ-008 — Integridade cross-tenant

**Status:** DECIDED  
**Priority:** HIGH  
**Affected Documents:** [03-DATABASE.md](03-DATABASE.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [13-DECISIONS.md](13-DECISIONS.md), [16-CODING-STANDARDS.md](16-CODING-STANDARDS.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md), [26-RELEASE-CHECKLIST.md](26-RELEASE-CHECKLIST.md), [ORGANIZATIONS.md](features/ORGANIZATIONS.md), [SUPPLIERS.md](features/SUPPLIERS.md), [SYSTEMS.md](features/SYSTEMS.md)  
**Affected Delivery:** Database / migrations / persistência  
**Blocks:** Decisão registrada; não bloqueia mais por esta questão.

### Question

Garantia de integridade será:

```text
application validation

composite foreign keys

RLS

combinação
```

?

---

### Decision

DEC-045: Aplicação valida relações e autorização para erros compreensíveis; PostgreSQL também impede estruturalmente relações tenant-bound entre Organizations. Carregar organization_id em filhos e associações quando necessário à coerência. Utilizar, quando aplicável, organization_id NOT NULL, unicidades e FKs compostas, índices apropriados e checks declarativos. FK simples por UUID não basta quando é preciso garantir mesmo tenant. organization_id vem do contexto autorizado e não move recursos livremente entre tenants. Não usar triggers quando constraint declarativa simples representar a mesma invariante.

### Rationale

Aprovação expressa do usuário no lote estrutural de persistência Identity/Tenant.

### Impact

Banco, arquitetura, segurança, testes e plano de implementação harmonizados. Não autoriza implementação nesta etapa.

### Decision Date

2026-09-18


## DBQ-009 — RLS

**Status:** DECIDED  
**Priority:** MEDIUM  
**Affected Documents:** [03-DATABASE.md](03-DATABASE.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [13-DECISIONS.md](13-DECISIONS.md), [16-CODING-STANDARDS.md](16-CODING-STANDARDS.md), [26-RELEASE-CHECKLIST.md](26-RELEASE-CHECKLIST.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md), [ORGANIZATIONS.md](features/ORGANIZATIONS.md), [SUPPLIERS.md](features/SUPPLIERS.md), [SYSTEMS.md](features/SYSTEMS.md)  
**Affected Delivery:** Database / migrations / persistência  
**Blocks:** Decisão registrada; não bloqueia mais por esta questão.

### Question

PostgreSQL Row Level Security será utilizado?

---


### Contexto consolidado

Origem: DBQ-009.

### Question

Utilizar:

```text
Row Level Security
```

como defesa adicional de multi-tenancy?

---

### Decision

DEC-046: Adotar PostgreSQL RLS como defesa adicional nas tabelas tenant-bound. Não substitui Membership, Permission, Scope, filtros tenant-aware, constraints ou regras de negócio; autorização funcional permanece na aplicação. Contexto da Organization é local à transação; ausência de contexto nega acesso. Todas as queries tenant-bound da operação usam o mesmo contexto transacional. Não persistir tenant na conexão; considerar pooling. Runtime não é superuser, não possui BYPASSRLS, não é proprietário das tabelas protegidas nem altera policies; FORCE ROW LEVEL SECURITY quando adequado ao modelo aprovado. Migrations utilizam credencial separada. Entidades globais não recebem organization_id artificial. Proteção de User, ExternalIdentity e Session será definida posteriormente. Descoberta dos próprios Memberships exige tratamento específico e restrito, sem policy irrestrita.

### Rationale

Aprovação expressa do usuário no lote estrutural de persistência Identity/Tenant.

### Impact

Banco, arquitetura, segurança, testes e plano de implementação harmonizados. Não autoriza implementação nesta etapa.

### Decision Date

2026-09-18

### Complemento — DEC-052

O bootstrap de Membership anterior ao contexto tenant ocorre apenas por operação restrita ao User autenticado e à Organization solicitada; o resultado é a Membership própria ativa ou ausência, sem enumeração ou leitura irrestrita. Apenas após confirmação o backend usa withTenant(authorizedOrganizationId), mantendo RLS/FORCE RLS e runtime restrito; concessões e áreas são carregadas no tenant autorizado. DEC-045/046 não foram alteradas.

### Complemento — DEC-056

O mecanismo aprovado é função PostgreSQL SECURITY DEFINER de retorno mínimo, com owner NOLOGIN dedicado sujeito a FORCE RLS, policy SELECT de bootstrap exclusiva dessa role e policy tenant normal de `memberships` limitada às roles tenant pertinentes, evitando OR que amplie runtime. Na S3.2, role, função, grants e policies foram implementados por provisionamento administrativo separado das migrations. `auth_private.resolve_membership` retorna somente membershipId + organizationId para a Membership ativa do par exato User + Organization; o repository usa exclusivamente essa primitive. Runtime recebe EXECUTE específico, não é membro da role dedicada e conserva grants tenant normais sob RLS. Isso implementa apenas a fundação PostgreSQL: authenticatedUserId ainda deve ser produzido pelo backend após Session válida, e a Organization solicitada continua sem autoridade até resultado positivo no futuro pipeline HTTP. O estado e a prioridade desta questão não mudam.

### Complemento — DEC-057

ExternalIdentity e Session não recebem RLS tenant porque são entidades globais e não possuem organization_id. Sua proteção PostgreSQL utiliza runtime sem grants diretos, primitives SECURITY DEFINER restritos, owner NOLOGIN dedicado e retornos mínimos.

Isso não reduz nem substitui RLS/FORCE RLS nas tabelas tenant-bound e não altera DEC-046 ou DEC-056.


# 21. API

## APIQ-001 — OpenAPI

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [20-API-CONTRACTS.md](20-API-CONTRACTS.md)  
**Affected Delivery:** API / contratos / frontend  
**Blocks:** implementar a decisão «OpenAPI» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

OpenAPI será contrato obrigatório desde a V1?

---

## APIQ-002 — Auth transport

**Status:** DECIDED  
**Priority:** HIGH  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md)  
**Affected Delivery:** API / contratos / frontend  
**Blocks:** Transporte respondido por DEC-042; não bloqueia mais.

### Question

Como credenciais/sessão serão transportadas?

Depende de `SECQ-001/002`.

---

### Decision

DEC-042: transporte de sessão por cookie opaco; frontend não administra tokens de autenticação. DEC-055 define propriedades do cookie e baseline CSRF; DEC-059 fixa `lgpd_session` para desenvolvimento/teste HTTP e `__Host-lgpd_session` para produção HTTPS, sem nome arbitrariamente configurável. DEC-061 define resposta pública uniforme 401/`AUTHENTICATION_REQUIRED`, causas internas seguras e remoção do cookie presente incapaz de autenticar somente em endpoints protegidos. Detalhes pendentes de lifecycle permanecem em SECQ-004.

### Rationale

Cobertura integral pela escolha expressa do usuário em SECQ-002.

### Impact

Frontend e backend utilizam sessão server-side; não criar decisão duplicada de transporte.

### Decision Date

2026-09-18


## APIQ-003 — PATCH

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md)  
**Affected Delivery:** API / contratos / frontend  
**Blocks:** implementar a decisão «PATCH» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Updates usarão:

```text
PATCH parcial
```

ou operações mais semânticas por contexto?

---

## APIQ-004 — Concurrency

**Status:** OPEN  
**Priority:** HIGH  
**Affected Documents:** [AGENTS.md](../AGENTS.md), [03-DATABASE.md](03-DATABASE.md), [07-API.md](07-API.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [15-BACKLOG.md](15-BACKLOG.md), [19-ERROR-CATALOG.md](19-ERROR-CATALOG.md), [20-API-CONTRACTS.md](20-API-CONTRACTS.md), [22-VALIDATION-RULES.md](22-VALIDATION-RULES.md), [25-UX-GUIDELINES.md](25-UX-GUIDELINES.md), [26-RELEASE-CHECKLIST.md](26-RELEASE-CHECKLIST.md), [27-AI-DEVELOPMENT-GUIDE.md](27-AI-DEVELOPMENT-GUIDE.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md), [MAPPING-WIZARD.md](features/MAPPING-WIZARD.md), [PROCESSING-ACTIVITY.md](features/PROCESSING-ACTIVITY.md), [SUPPLIERS.md](features/SUPPLIERS.md), [SYSTEMS.md](features/SYSTEMS.md)  
**Affected Delivery:** API / contratos / frontend  
**Blocks:** implementar a decisão «Concurrency» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Controle de concorrência utilizará:

```text
version

updatedAt

ETag

ou outro
```

?

---

## APIQ-005 — Idempotency

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [20-API-CONTRACTS.md](20-API-CONTRACTS.md), [26-RELEASE-CHECKLIST.md](26-RELEASE-CHECKLIST.md)  
**Affected Delivery:** API / contratos / frontend  
**Blocks:** implementar a decisão «Idempotency» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Quais POSTs críticos exigem:

```text
Idempotency-Key
```

?

---

## APIQ-006 — Export

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [07-API.md](07-API.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [15-BACKLOG.md](15-BACKLOG.md), [17-ENVIRONMENTS-AND-DEPLOYMENT.md](17-ENVIRONMENTS-AND-DEPLOYMENT.md), [26-RELEASE-CHECKLIST.md](26-RELEASE-CHECKLIST.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md), [ROPA.md](features/ROPA.md)  
**Affected Delivery:** API / contratos / frontend  
**Blocks:** implementar a decisão «Export» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Exports serão:

```text
síncronos

assíncronos
```

?

---

## APIQ-007 — Upload

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [07-API.md](07-API.md), [08-FRONTEND.md](08-FRONTEND.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [15-BACKLOG.md](15-BACKLOG.md), [17-ENVIRONMENTS-AND-DEPLOYMENT.md](17-ENVIRONMENTS-AND-DEPLOYMENT.md), [20-API-CONTRACTS.md](20-API-CONTRACTS.md), [26-RELEASE-CHECKLIST.md](26-RELEASE-CHECKLIST.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md), [MAPPING-WIZARD.md](features/MAPPING-WIZARD.md)  
**Affected Delivery:** API / contratos / frontend  
**Blocks:** implementar a decisão «Upload» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Upload será:

```text
multipart via backend

presigned URL

modelo híbrido
```

?

---

## APIQ-008 — Bulk operations

**Status:** OPEN  
**Priority:** LOW  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [20-API-CONTRACTS.md](20-API-CONTRACTS.md), [25-UX-GUIDELINES.md](25-UX-GUIDELINES.md)  
**Affected Delivery:** API / contratos / frontend  
**Blocks:** implementar a decisão «Bulk operations» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

V1 precisa de operações em massa?

---

## APIQ-009 — API pública

**Status:** DEFERRED  
**Priority:** LOW  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [20-API-CONTRACTS.md](20-API-CONTRACTS.md)  
**Affected Delivery:** API / contratos / frontend  
**Blocks:** implementar a decisão «API pública» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Existirá API pública para clientes externos?

---

## APIQ-010 — Gate automático

**Status:** OPEN  
**Priority:** HIGH  
**Affected Documents:** [07-API.md](07-API.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md), [COMPLIANCE-GATE.md](features/COMPLIANCE-GATE.md)  
**Affected Delivery:** API / contratos / frontend  
**Blocks:** implementar a decisão «Gate automático» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Compliance Gate executa:

```text
automaticamente no Submit
```

ou via:

```text
POST /compliance/run
```

?

Relacionado:

```text
CGQ-004
```

---

# 22. Frontend

## FEQ-001 — Component library

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [08-FRONTEND.md](08-FRONTEND.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [25-UX-GUIDELINES.md](25-UX-GUIDELINES.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md)  
**Affected Delivery:** Frontend / UX  
**Blocks:** implementar a decisão «Component library» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Será utilizada biblioteca de componentes?

### Aprovação limitada — DEC-071

[DEC-071](13-DECISIONS.md#dec-071--escolhas-técnicas-e-escopo-do-primeiro-frontend-shell), aprovada em 2026-10-23: componentes próprios e HTML semântico exclusivamente para o primeiro shell. O status permanece OPEN para a escolha global de biblioteca de componentes; esta aprovação limitada não seleciona shadcn/ui, Radix ou outra biblioteca para todo o produto. FEQ-002 e FEQ-010 permanecem OPEN. Registro documental somente, sem implementação.

---

## FEQ-002 — Design System

**Status:** OPEN  
**Priority:** LOW  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [25-UX-GUIDELINES.md](25-UX-GUIDELINES.md)  
**Affected Delivery:** Frontend / UX  
**Blocks:** implementar a decisão «Design System» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Existe Design System corporativo?

---

## FEQ-003 — Autosave

**Status:** OPEN  
**Priority:** HIGH  
**Affected Documents:** [08-FRONTEND.md](08-FRONTEND.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [25-UX-GUIDELINES.md](25-UX-GUIDELINES.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md), [MAPPING-WIZARD.md](features/MAPPING-WIZARD.md)  
**Affected Delivery:** Frontend / UX  
**Blocks:** implementar a decisão «Autosave» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Wizard terá:

```text
autosave
```

ou salvamento explícito?

---

## FEQ-004 — URL por etapa

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [25-UX-GUIDELINES.md](25-UX-GUIDELINES.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md)  
**Affected Delivery:** Frontend / UX  
**Blocks:** implementar a decisão «URL por etapa» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Cada etapa do Wizard possui URL própria?

Exemplo:

```text
/activities/:id/map/retention
```

---

## FEQ-005 — Quick Create UX

**Status:** OPEN  
**Priority:** HIGH  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [25-UX-GUIDELINES.md](25-UX-GUIDELINES.md), [SUPPLIERS.md](features/SUPPLIERS.md), [SYSTEMS.md](features/SYSTEMS.md)  
**Affected Delivery:** Frontend / UX  
**Blocks:** implementar a decisão «Quick Create UX» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Quick Create de Systems/Suppliers será:

```text
modal

drawer

inline
```

?

---

## FEQ-006 — Unsaved changes

**Status:** OPEN  
**Priority:** HIGH  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [25-UX-GUIDELINES.md](25-UX-GUIDELINES.md)  
**Affected Delivery:** Frontend / UX  
**Blocks:** implementar a decisão «Unsaved changes» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Como tratar navegação com campos não salvos?

---

## FEQ-007 — Mobile

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [08-FRONTEND.md](08-FRONTEND.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [25-UX-GUIDELINES.md](25-UX-GUIDELINES.md), [MAPPING-WIZARD.md](features/MAPPING-WIZARD.md)  
**Affected Delivery:** Frontend / UX  
**Blocks:** implementar a decisão «Mobile» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Qual nível de suporte mobile é exigido?

---

## FEQ-008 — Accessibility target

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [25-UX-GUIDELINES.md](25-UX-GUIDELINES.md)  
**Affected Delivery:** Frontend / UX  
**Blocks:** implementar a decisão «Accessibility target» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Existe target formal:

```text
WCAG 2.1 AA
```

ou equivalente?

---

## FEQ-009 — Export UX

**Status:** OPEN  
**Priority:** LOW  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [25-UX-GUIDELINES.md](25-UX-GUIDELINES.md), [ROPA.md](features/ROPA.md)  
**Affected Delivery:** Frontend / UX  
**Blocks:** implementar a decisão «Export UX» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Como apresentar export síncrono/assíncrono ao usuário?

---

# 23. Audit & Versioning

## AUDQ-001 — Retenção do AuditLog

**Status:** OPEN  
**Priority:** HIGH  
**Affected Documents:** [09-SECURITY.md](09-SECURITY.md), [10-AUDIT.md](10-AUDIT.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [18-OBSERVABILITY.md](18-OBSERVABILITY.md), [26-RELEASE-CHECKLIST.md](26-RELEASE-CHECKLIST.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md)  
**Affected Delivery:** Audit / Versioning  
**Blocks:** implementar a decisão «Retenção do AuditLog» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Por quanto tempo AuditLog será mantido?

---

## AUDQ-002 — Metadata

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md)  
**Affected Delivery:** Audit / Versioning  
**Blocks:** implementar a decisão «Metadata» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Qual limite/formato permitido em:

```text
AuditLog.metadata
```

?

---

## AUDQ-003 — IP

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [10-AUDIT.md](10-AUDIT.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md)  
**Affected Delivery:** Audit / Versioning  
**Blocks:** implementar a decisão «IP» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

AuditLog armazenará IP?

---

## AUDQ-004 — User Agent

**Status:** OPEN  
**Priority:** LOW  
**Affected Documents:** [10-AUDIT.md](10-AUDIT.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md)  
**Affected Delivery:** Audit / Versioning  
**Blocks:** implementar a decisão «User Agent» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

AuditLog armazenará User-Agent?

---

## AUDQ-005 — Audit de leitura

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [09-SECURITY.md](09-SECURITY.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md)  
**Affected Delivery:** Audit / Versioning  
**Blocks:** implementar a decisão «Audit de leitura» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Quais leituras sensíveis precisam ser auditadas?

---

## AUDQ-006 — Export

**Status:** OPEN  
**Priority:** HIGH  
**Affected Documents:** [10-AUDIT.md](10-AUDIT.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md)  
**Affected Delivery:** Audit / Versioning  
**Blocks:** implementar a decisão «Export» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Confirmar audit obrigatório para exportação de ROPA.

---

## AUDQ-007 — Download

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [10-AUDIT.md](10-AUDIT.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md)  
**Affected Delivery:** Audit / Versioning  
**Blocks:** implementar a decisão «Download» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Download de Attachment/ROPA exportado gera AuditLog?

---

## AUDQ-008 — Snapshot size

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md)  
**Affected Delivery:** Audit / Versioning  
**Blocks:** implementar a decisão «Snapshot size» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Existe limite para snapshot JSONB de ActivityVersion?

---

## AUDQ-009 — Diff

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [08-FRONTEND.md](08-FRONTEND.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md)  
**Affected Delivery:** Audit / Versioning  
**Blocks:** implementar a decisão «Diff» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Sistema precisa apresentar diff entre versões na V1?

---

## AUDQ-010 — Version numbering

**Status:** OPEN  
**Priority:** HIGH  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md), [26-RELEASE-CHECKLIST.md](26-RELEASE-CHECKLIST.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md)  
**Affected Delivery:** Audit / Versioning  
**Blocks:** implementar a decisão «Version numbering» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Versões usam:

```text
1, 2, 3...
```

por Activity?

---

## AUDQ-011 — Versão rejeitada

**Status:** OPEN  
**Priority:** HIGH  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md)  
**Affected Delivery:** Audit / Versioning  
**Blocks:** implementar a decisão «Versão rejeitada» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Versão rejeitada permanece no histórico?

### Recommendation

Sim.

---

## AUDQ-012 — Relação com entidades externas

**Status:** OPEN  
**Priority:** HIGH  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md), [23-SEED-AND-CATALOGS.md](23-SEED-AND-CATALOGS.md), [26-RELEASE-CHECKLIST.md](26-RELEASE-CHECKLIST.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md), [COMPLIANCE-GATE.md](features/COMPLIANCE-GATE.md), [PROCESSING-ACTIVITY.md](features/PROCESSING-ACTIVITY.md), [ROPA.md](features/ROPA.md), [SUPPLIERS.md](features/SUPPLIERS.md), [SYSTEMS.md](features/SYSTEMS.md)  
**Affected Delivery:** Audit / Versioning  
**Blocks:** implementar a decisão «Relação com entidades externas» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Snapshots preservam nomes/metadata de:

```text
Systems

Suppliers

BusinessUnits
```

para reconstrução histórica?

---

## AUDQ-013 — Criação da primeira versão

**Status:** OPEN  
**Priority:** HIGH  
**Affected Documents:** [10-AUDIT.md](10-AUDIT.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [13-DECISIONS.md](13-DECISIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [15-BACKLOG.md](15-BACKLOG.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md), [26-RELEASE-CHECKLIST.md](26-RELEASE-CHECKLIST.md), [COMPLIANCE-GATE.md](features/COMPLIANCE-GATE.md), [PROCESSING-ACTIVITY.md](features/PROCESSING-ACTIVITY.md), [ROPA.md](features/ROPA.md)  
**Affected Delivery:** Audit / Versioning  
**Blocks:** implementar a decisão «Criação da primeira versão» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

ActivityVersion é criada:

```text
desde o DRAFT
```

ou apenas na:

```text
primeira publicação/submissão
```

?

---

# 24. Testing

## TESTQ-001 — Database de integração

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [11-TESTING.md](11-TESTING.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [26-RELEASE-CHECKLIST.md](26-RELEASE-CHECKLIST.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md)  
**Affected Delivery:** Testing / CI / homologação  
**Blocks:** implementar a decisão «Database de integração» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

CI utilizará PostgreSQL real via container?

### Recommendation

Sim.

---

## TESTQ-002 — E2E browser

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [26-RELEASE-CHECKLIST.md](26-RELEASE-CHECKLIST.md)  
**Affected Delivery:** Testing / CI / homologação  
**Blocks:** implementar a decisão «E2E browser» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Confirmar:

```text
Playwright
```

para E2E.

---

## TESTQ-003 — Browsers

**Status:** OPEN  
**Priority:** LOW  
**Affected Documents:** [11-TESTING.md](11-TESTING.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [26-RELEASE-CHECKLIST.md](26-RELEASE-CHECKLIST.md)  
**Affected Delivery:** Testing / CI / homologação  
**Blocks:** implementar a decisão «Browsers» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Quais browsers precisam ser suportados?

---

## TESTQ-004 — Coverage

**Status:** OPEN  
**Priority:** LOW  
**Affected Documents:** [11-TESTING.md](11-TESTING.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md)  
**Affected Delivery:** Testing / CI / homologação  
**Blocks:** implementar a decisão «Coverage» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Existe threshold formal de coverage?

---

## TESTQ-005 — Security tests

**Status:** OPEN  
**Priority:** HIGH  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [26-RELEASE-CHECKLIST.md](26-RELEASE-CHECKLIST.md)  
**Affected Delivery:** Testing / CI / homologação  
**Blocks:** implementar a decisão «Security tests» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Quais testes de segurança serão obrigatórios no CI?

---

## TESTQ-006 — Tenant tests

**Status:** OPEN  
**Priority:** HIGH  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [26-RELEASE-CHECKLIST.md](26-RELEASE-CHECKLIST.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md)  
**Affected Delivery:** Testing / CI / homologação  
**Blocks:** implementar a decisão «Tenant tests» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Testes cross-tenant serão obrigatórios para todo repository/use case tenant-bound?

### Recommendation

Sim.

---

## TESTQ-007 — E2E critical flows

**Status:** OPEN  
**Priority:** HIGH  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [26-RELEASE-CHECKLIST.md](26-RELEASE-CHECKLIST.md)  
**Affected Delivery:** Testing / CI / homologação  
**Blocks:** implementar a decisão «E2E critical flows» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Quais fluxos são bloqueadores de release?

Proposta:

```text
login

create Activity

Wizard

Submit

Compliance Gate

Activate

ROPA

tenant isolation
```

---

## TESTQ-008 — IdP em testes

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [11-TESTING.md](11-TESTING.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [AUTH.md](features/AUTH.md)  
**Affected Delivery:** Testing / CI / homologação  
**Blocks:** implementar a decisão «IdP em testes» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Como autenticação externa será simulada/testada?

---

# 25. Infraestrutura

## INFRAQ-001 — Cloud

**Status:** OPEN  
**Priority:** HIGH  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [15-BACKLOG.md](15-BACKLOG.md), [17-ENVIRONMENTS-AND-DEPLOYMENT.md](17-ENVIRONMENTS-AND-DEPLOYMENT.md), [26-RELEASE-CHECKLIST.md](26-RELEASE-CHECKLIST.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md)  
**Affected Delivery:** Environments / Deployment / operação  
**Blocks:** implementar a decisão «Cloud» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Qual ambiente:

```text
Azure

AWS

GCP

on-premise

outro
```

?

---

## INFRAQ-002 — Object Storage

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [09-SECURITY.md](09-SECURITY.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [15-BACKLOG.md](15-BACKLOG.md), [17-ENVIRONMENTS-AND-DEPLOYMENT.md](17-ENVIRONMENTS-AND-DEPLOYMENT.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md), [MAPPING-WIZARD.md](features/MAPPING-WIZARD.md)  
**Affected Delivery:** Environments / Deployment / operação  
**Blocks:** implementar a decisão «Object Storage» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Produção utilizará:

```text
S3

Azure Blob

MinIO

outro
```

?

---

## INFRAQ-003 — Redis

**Status:** OPEN  
**Priority:** LOW  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [17-ENVIRONMENTS-AND-DEPLOYMENT.md](17-ENVIRONMENTS-AND-DEPLOYMENT.md), [23-SEED-AND-CATALOGS.md](23-SEED-AND-CATALOGS.md), [24-NOTIFICATIONS.md](24-NOTIFICATIONS.md)  
**Affected Delivery:** Environments / Deployment / operação  
**Blocks:** implementar a decisão «Redis» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Redis será necessário na V1?

Não adicionar sem caso de uso.

---

## INFRAQ-004 — Queue

**Status:** OPEN  
**Priority:** LOW  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [17-ENVIRONMENTS-AND-DEPLOYMENT.md](17-ENVIRONMENTS-AND-DEPLOYMENT.md), [24-NOTIFICATIONS.md](24-NOTIFICATIONS.md)  
**Affected Delivery:** Environments / Deployment / operação  
**Blocks:** implementar a decisão «Queue» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

BullMQ/queue será necessário na V1?

Depende principalmente de:

```text
exports

notifications

jobs
```

---

## INFRAQ-005 — Environments

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [15-BACKLOG.md](15-BACKLOG.md), [17-ENVIRONMENTS-AND-DEPLOYMENT.md](17-ENVIRONMENTS-AND-DEPLOYMENT.md), [26-RELEASE-CHECKLIST.md](26-RELEASE-CHECKLIST.md)  
**Affected Delivery:** Environments / Deployment / operação  
**Blocks:** implementar a decisão «Environments» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Ambientes oficiais:

```text
dev

staging

production
```

?

---

## INFRAQ-006 — CI/CD

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [17-ENVIRONMENTS-AND-DEPLOYMENT.md](17-ENVIRONMENTS-AND-DEPLOYMENT.md), [26-RELEASE-CHECKLIST.md](26-RELEASE-CHECKLIST.md)  
**Affected Delivery:** Environments / Deployment / operação  
**Blocks:** implementar a decisão «CI/CD» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Qual plataforma executará CI/CD?

---

## INFRAQ-007 — Backup

**Status:** OPEN  
**Priority:** HIGH  
**Affected Documents:** [09-SECURITY.md](09-SECURITY.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [15-BACKLOG.md](15-BACKLOG.md), [17-ENVIRONMENTS-AND-DEPLOYMENT.md](17-ENVIRONMENTS-AND-DEPLOYMENT.md), [26-RELEASE-CHECKLIST.md](26-RELEASE-CHECKLIST.md)  
**Affected Delivery:** Environments / Deployment / operação  
**Blocks:** implementar a decisão «Backup» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Quais requisitos de:

```text
backup

restore

RPO

RTO
```

?

---

## INFRAQ-008 — Observability

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [15-BACKLOG.md](15-BACKLOG.md), [17-ENVIRONMENTS-AND-DEPLOYMENT.md](17-ENVIRONMENTS-AND-DEPLOYMENT.md)  
**Affected Delivery:** Environments / Deployment / operação  
**Blocks:** implementar a decisão «Observability» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Quais ferramentas serão utilizadas para:

```text
logs

metrics

tracing

error tracking
```

?

---

# 26. Decisões que bloqueiam Database Schema

Resolver antes de estabilizar schema:

```text
PRODQ-001

AUTHQ-006
AUTHQ-007
AUTHQ-008

DQ-001
DQ-002
DQ-003
DQ-004
DQ-005

MWQ-004

CGQ-003
CGQ-005

SYSQ-004
SYSQ-005
SYSQ-006

SUPQ-003
SUPQ-004

DBQ-002
DBQ-003
DBQ-008
```

---

# 27. Decisões que bloqueiam Workflow

```text
BRQ-006
BRQ-007

WFQ-001
WFQ-002
WFQ-003
WFQ-004
WFQ-005
WFQ-006
WFQ-007
WFQ-008

PAQ-006

SYSQ-007

SUPQ-006

CGQ-001
CGQ-004
```

---

# 28. Decisões que bloqueiam Authentication

```text
AUTHQ-005
AUTHQ-006
AUTHQ-007
AUTHQ-008
AUTHQ-010

SECQ-001
SECQ-002
SECQ-003
SECQ-004
```

---

# 29. Decisões que bloqueiam Compliance Gate

```text
DQ-002
DQ-003
DQ-005
DQ-006

BRQ-001
BRQ-002
BRQ-003
BRQ-004
BRQ-005
BRQ-007

CGQ-001
CGQ-002
CGQ-003
CGQ-004
CGQ-005

SYSQ-007
SUPQ-006
```

---

# 30. Decisões que bloqueiam ROPA

```text
DQ-002
DQ-003
DQ-004
DQ-005

WFQ-008

ROPAQ-001
ROPAQ-002
ROPAQ-003

AUDQ-012
AUDQ-013
```

---

# 31. Decisões que bloqueiam Dashboard

```text
DASHQ-001
DASHQ-002
DASHQ-003
DASHQ-006
DASHQ-007
DASHQ-010
DASHQ-011

SYSQ-002
SUPQ-002

WFQ-008
```

---

# 32. Decisões que podem ser adiadas

Podem permanecer `DEFERRED` sem bloquear MVP, salvo mudança de escopo:

```text
SYSQ-013 — merge Systems

SUPQ-013 — contatos de Supplier

SUPQ-014 — merge Suppliers

APIQ-009 — API pública

PAQ-004 — clone

PAQ-005 — tags

DASHQ-009 — filtro temporal

DASHQ-012 — audit Dashboard

DASHQ-013 — estratégia de endpoint
```

---

# 33. Ordem recomendada de decisão

Antes de começar implementação estrutural, resolver aproximadamente nesta ordem:

```text
1. Multi-tenancy

2. Authentication

3. Membership / Roles / Business Units

4. Purpose

5. Personal Data granularity

6. Legal Basis cardinality

7. Legal Basis association

8. Retention granularity

9. Activity workflow

10. Review / Approval

11. Versioning

12. Compliance Gate aggregation

13. REVIEW_REQUIRED

14. System mapping

15. Supplier mapping

16. ROPA projection

17. Dashboard formulas

18. Export

19. Infrastructure
```

---

# 34. Definition of Ready — Backend

Uma feature está pronta para implementação backend quando:

```text
[ ] entidades necessárias definidas

[ ] cardinalidades definidas

[ ] invariantes definidas

[ ] tenant boundary definida

[ ] permissions definidas

[ ] workflow definido

[ ] validações definidas

[ ] operações semânticas definidas

[ ] questões CRITICAL relacionadas resolvidas
```

---

# 35. Definition of Ready — Database

```text
[ ] entidades definidas

[ ] cardinalidades definidas

[ ] tenant strategy definida

[ ] versioning strategy definida

[ ] soft delete definido

[ ] integridade cross-tenant definida

[ ] catálogos globais definidos

[ ] questões estruturais resolvidas
```

---

# 36. Definition of Ready — Frontend

```text
[ ] fluxo definido

[ ] campos definidos

[ ] conditional rules definidas

[ ] permissions definidas

[ ] error codes relevantes definidos

[ ] estados loading/error/empty definidos

[ ] API necessária especificada

[ ] questões críticas de UX resolvidas
```

---

# 37. Definition of Ready — Compliance

```text
[ ] checks definidos

[ ] condições de aplicação definidas

[ ] PASS definido

[ ] FAIL definido

[ ] REVIEW_REQUIRED definido

[ ] NOT_APPLICABLE definido

[ ] BLOCKED definido

[ ] reviewer definido

[ ] resolução humana definida

[ ] versionamento do Gate definido
```

---

# 38. Regra para implementação assistida por IA

Antes de implementar uma feature, o agente deve:

```text
1. Ler AGENTS.md

2. Ler 00-PROJECT.md

3. Ler documentos relacionados à feature

4. Ler 12-OPEN-QUESTIONS.md

5. Identificar questões OPEN relacionadas

6. Separar:
   - decisões já aprovadas
   - decisões abertas
   - detalhes puramente técnicos

7. Não resolver silenciosamente decisões de produto/domínio/compliance

8. Implementar somente comportamento suportado pelas decisões existentes
```

---

# 39. Pergunta obrigatória da IA

Quando uma questão `CRITICAL` aberta impedir implementação correta, o agente deve interromper a parte afetada e apresentar:

```text
Decision Required

ID:
DQ-XXX

Question:
...

Why it matters:
...

Options:
A)
B)
C)

Affected:
Database
API
Frontend
Tests
```

---

# 40. O que a IA pode decidir

A IA pode tomar decisões locais de implementação quando não alterarem:

```text
regra de negócio

modelo jurídico

cardinalidade

workflow

authorization

tenant boundary

contrato funcional
```

Exemplos:

```text
nome de variável local

extração de função

organização interna de arquivo

uso de helper

refatoração equivalente

detalhes de implementação de teste
```

---

# 41. O que a IA não pode decidir sozinha

```text
quem aprova Activity

qual base legal é correta

quando RIPD é obrigatório

quando Gate está COMPLETE

quando Activity vira ACTIVE

quem pode ver toda a Organization

se Supplier é operador

se System PENDING bloqueia Activity

se Supplier PENDING bloqueia Activity

qual prazo de retenção é juridicamente correto

qual mecanismo de transferência internacional é adequado
```

---

# 42. Regra sobre recomendações

Documentos podem conter:

```text
Recommendation
```

Uma recomendação não equivale a:

```text
Decision
```

enquanto:

```text
Status != DECIDED
```

---

# 43. Regra sobre implementação existente

Se código existente contradizer decisão documentada:

```text
não assumir automaticamente que o código está correto
```

Seguir ordem de precedência definida no:

```text
AGENTS.md
```

---

# 44. Manutenção

Sempre que surgir nova dúvida estrutural durante desenvolvimento:

```text
1. criar ID

2. adicionar neste documento

3. definir prioridade

4. referenciar feature relacionada

5. evitar decisão silenciosa

6. após decisão, atualizar documentos afetados
```

---

# 45. Checklist para fechar uma questão

Antes de mudar para:

```text
DECIDED
```

confirmar:

```text
[ ] pergunta compreendida

[ ] decisão registrada

[ ] justificativa registrada

[ ] impactos identificados

[ ] documentos relacionados atualizados

[ ] schema atualizado se necessário

[ ] API atualizada se necessário

[ ] frontend atualizado se necessário

[ ] testes atualizados se necessário
```

---

# 46. Regra final

Este documento deve impedir que o projeto evolua por decisões implícitas.

Princípio:

```text
Se muda o comportamento do produto,
a decisão precisa estar explícita.
```

Especialmente para:

```text
LGPD

workflow

compliance

authorization

multi-tenancy

versionamento

auditoria
```

A implementação assistida por IA deve partir de:

```text
decisões explícitas
+
regras rastreáveis
+
contratos claros
```

e não de suposições do agente.

---

# 47. Próximo passo

Com a documentação estrutural e as features iniciais especificadas, o próximo documento recomendado é:

```text
docs/13-DECISIONS.md
```

Ele deve registrar somente decisões efetivamente aprovadas, separando-as das perguntas existentes neste arquivo.

Estrutura recomendada:

```text
Decision ID

Status

Context

Decision

Rationale

Consequences

Affected Documents

Decision Date
```

O fluxo passa a ser:

```text
12-OPEN-QUESTIONS.md
        ↓
discussão
        ↓
decisão aprovada
        ↓
13-DECISIONS.md
        ↓
atualização das especificações afetadas
        ↓
implementação
```
# Questões incorporadas na reconciliação completa

Registros incorporados em 2026-09-18. OPEN é preservação/triagem de questão ainda sem decisão registrada, não aprovação de nenhuma alternativa. Para prioridades sem valor explícito, impacto alto/muito alto é HIGH, médio/baixo-médio é MEDIUM e baixo é LOW; impactos mistos usam o maior. PRODQ-003 tem prioridade provisória MEDIUM e está listado para revisão humana.

## APIQ-011 — Single-resource response direto ou envelope `data`?

**Status:** DECIDED
**Priority:** LOW  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [20-API-CONTRACTS.md](20-API-CONTRACTS.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md)  
**Affected Delivery:** API / contratos / frontend  
**Blocks:** nenhum bloqueio pendente para o formato da resposta individual de ProcessingActivity; aplicar DEC-074. Esta decisão não aprova formatos de outros recursos ou coleções.

### Question

Single-resource response direto ou envelope `data`?

### Decision

[DEC-074](13-DECISIONS.md#dec-074--p4-contrato-http-de-leitura-individual-de-processingactivity) APPROVED em 2026-10-28: adotar envelope `data` para `GET /api/v1/processing-activities/:id`, com somente os seis campos públicos aprovados. P.4 aprovada para implementação, ainda não implementada. O recorte não resolve paginação, filtros, allowedActions, /me, workflow, versões ou ROPA; todas as demais Questions preservam seus estados.

---

## APIQ-012 — Qual pageSize padrão e máximo?

**Status:** OPEN  
**Priority:** LOW  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [20-API-CONTRACTS.md](20-API-CONTRACTS.md)  
**Affected Delivery:** API / contratos / frontend  
**Blocks:** decisões fora da listagem mínima aprovada pela DEC-075; nenhum bloqueio pendente deste ponto para o contrato específico dessa listagem.

### Question

Qual pageSize padrão e máximo?

### Decisão parcial aprovada — listagem mínima de ProcessingActivity

[DEC-075](13-DECISIONS.md#dec-075--slice-007-listagem-estrutural-mínima-de-processingactivity) APPROVED em 2026-10-28 resolve este ponto somente para `GET /api/v1/processing-activities`. Defaults page=1 e pageSize=20; máximo pageSize=100; inteiros positivos, sem zero/negativos/frações/valores não numéricos ou parâmetros repetidos/ambíguos. Sem total. Ordenação fixa createdAt DESC, id DESC. Status OPEN preservado para os demais endpoints; não há resolução global implícita. A listagem ainda não foi implementada.

---

## APIQ-013 — Qual formato para filtros multi-value?

**Status:** OPEN  
**Priority:** LOW  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [20-API-CONTRACTS.md](20-API-CONTRACTS.md)  
**Affected Delivery:** API / contratos / frontend  
**Blocks:** implementar a decisão «Qual formato para filtros multi-value?» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Qual formato para filtros multi-value?

---

## APIQ-014 — Query params desconhecidos serão rejeitados ou ignorados?

**Status:** OPEN  
**Priority:** LOW  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [20-API-CONTRACTS.md](20-API-CONTRACTS.md)  
**Affected Delivery:** API / contratos / frontend  
**Blocks:** decisões fora da listagem mínima aprovada pela DEC-075; nenhum bloqueio pendente deste ponto para o contrato específico dessa listagem.

### Question

Query params desconhecidos serão rejeitados ou ignorados?

### Decisão parcial aprovada — listagem mínima de ProcessingActivity

[DEC-075](13-DECISIONS.md#dec-075--slice-007-listagem-estrutural-mínima-de-processingactivity) APPROVED em 2026-10-28 resolve este ponto somente para `GET /api/v1/processing-activities`. Aceitar somente page e pageSize; rejeitar qualquer query parameter desconhecido com 400. Rejeitar também repetições e ambiguidades. Isso não altera a política de query da P.4 individual ou de outros endpoints. Status OPEN preservado para os demais endpoints; não há resolução global implícita. A listagem ainda não foi implementada.

---

## APIQ-015 — Responses retornam somente IDs ou também resource summaries?

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [20-API-CONTRACTS.md](20-API-CONTRACTS.md)  
**Affected Delivery:** API / contratos / frontend  
**Blocks:** implementar a decisão «Responses retornam somente IDs ou também resource summaries?» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Responses retornam somente IDs ou também resource summaries?

---

## APIQ-016 — Recursos principais retornarão `allowedActions`?

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [08-FRONTEND.md](08-FRONTEND.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [20-API-CONTRACTS.md](20-API-CONTRACTS.md), [24-NOTIFICATIONS.md](24-NOTIFICATIONS.md), [25-UX-GUIDELINES.md](25-UX-GUIDELINES.md), [MAPPING-WIZARD.md](features/MAPPING-WIZARD.md), [PROCESSING-ACTIVITY.md](features/PROCESSING-ACTIVITY.md)  
**Affected Delivery:** API / contratos / frontend  
**Blocks:** implementar a decisão «Recursos principais retornarão `allowedActions`?» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Recursos principais retornarão `allowedActions`?

---

## APIQ-017 — `GET /me` retorna roles, permissions ou ambos?

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [20-API-CONTRACTS.md](20-API-CONTRACTS.md)  
**Affected Delivery:** API / contratos / frontend  
**Blocks:** implementar a decisão «`GET /me` retorna roles, permissions ou ambos?» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

`GET /me` retorna roles, permissions ou ambos?

---

## APIQ-018 — Campos desconhecidos no body serão rejeitados ou removidos?

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [20-API-CONTRACTS.md](20-API-CONTRACTS.md), [22-VALIDATION-RULES.md](22-VALIDATION-RULES.md), [27-AI-DEVELOPMENT-GUIDE.md](27-AI-DEVELOPMENT-GUIDE.md)  
**Affected Delivery:** API / contratos / frontend  
**Blocks:** implementar a decisão «Campos desconhecidos no body serão rejeitados ou removidos?» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Campos desconhecidos no body serão rejeitados ou removidos?

---

## APIQ-019 — Frontend API types serão gerados por OpenAPI ou mantidos manualmente?

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [07-API.md](07-API.md), [11-TESTING.md](11-TESTING.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [20-API-CONTRACTS.md](20-API-CONTRACTS.md), [23-SEED-AND-CATALOGS.md](23-SEED-AND-CATALOGS.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md)  
**Affected Delivery:** API / contratos / frontend  
**Blocks:** implementar a decisão «Frontend API types serão gerados por OpenAPI ou mantidos manualmente?» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Frontend API types serão gerados por OpenAPI ou mantidos manualmente?

---

## APIQ-020 — Representação da organização ativa

**Status:** DECIDED  
**Priority:** HIGH  
**Affected Documents:** [07-API.md](07-API.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [AUTH.md](features/AUTH.md)  
**Affected Delivery:** API / contratos / frontend  
**Blocks:** Decisão registrada; não bloqueia mais por esta questão.

### Question

Como a organização ativa será representada e validada para usuários multi-organização: sessão, token, header validado ou rota?

### Nota de reconciliação

Distinta do transporte de credenciais/sessão em APIQ-002.

---

### Decision

DEC-043: A sessão identifica User. Cada request identifica explicitamente a Organization pretendida, apenas como solicitação de contexto. Backend valida Membership ativo, permission e scope antes do caso de uso, além das restrições específicas aplicáveis. Recursos não mudam de tenant por campos enviados no body. A forma HTTP concreta permanece para o slice.

### Rationale

Aprovação expressa do usuário para Foundation → Identity/Tenant.

### Impact

Modelo estrutural e documentos afetados harmonizados; não autoriza implementação nesta etapa.

### Decision Date

2026-09-18

### Complemento — DEC-052

A Organization informada em cada request é apenas requestedOrganizationId. Validar restritamente a Membership própria ativa do User autenticado nessa Organization antes de estabelecer authorizedOrganizationId e chamar withTenant(). Ausência/inatividade não autoriza tenant; troca de Organization exige nova validação e não herda contexto anterior. Session não congela concessões/scopes. A S3.2 implementou a primitive PostgreSQL restrita definida pela DEC-056. A S3.3 implementou a resolução HTTP da Session e `AuthenticatedIdentity`; a S3.4 implementou o transporte por `X-Organization-Id`, o bootstrap de Membership e a composição de `AuthorizedTenantContext` antes de `withTenant()`. A fronteira estrutural da S3.5 foi aprovada em AUTHQ-015 → DEC-070: resolução de RoleAssignments, roles, scopes e áreas explícitas, implementada e auditada no escopo estrutural. Permission matrix e autorização funcional permanecem para etapa posterior. APIQ-020 permanece DECIDED por DEC-043.

### Complemento — DEC-054

Requests tenant-bound usam `X-Organization-Id` como requestedOrganizationId e são rejeitados se o header faltar. Endpoints globais de autenticação/contexto anteriores ao tenant não o exigem. Não há seleção implícita da última Organization nem autoridade tenant armazenada na Session; cada request, inclusive concorrente, é validado independentemente.

### Complemento — DEC-062

Após resolução positiva de `resolve_membership()`, a S3.4 produz `AuthorizedTenantContext` separado de `AuthenticatedIdentity`, contendo somente `membershipId` e `authorizedOrganizationId`. O valor solicitado em `X-Organization-Id` não se torna autorizado por cópia direta; os dois campos vêm do resultado positivo do bootstrap. Identidade, requestedOrganizationId, roles, permissions, Business Units e objetos HTTP/banco não pertencem ao contexto tenant.

### Complemento — DEC-065

O contrato HTTP da S3.4 usa 400/`ORGANIZATION_CONTEXT_REQUIRED` para header ausente, 400/`INVALID_ORGANIZATION_CONTEXT` para UUID inválido ou múltiplos valores e uma resposta uniforme 403/`ORGANIZATION_ACCESS_DENIED` para Membership inexistente, inativa, pertencente a outro User ou Organization inexistente. Nenhuma dessas negativas produz contexto autorizado. APIQ-020 permanece DECIDED; a DEC-065 não trata da autorização posterior de recursos tenant-bound.

### Complemento — DEC-066

Depois de criado `AuthorizedTenantContext`, recurso inexistente, cross-tenant ou fora do scope de visibilidade usa o mesmo contrato 404 no endpoint. Recurso legitimamente visível cuja ação seja negada usa 403/`FORBIDDEN`. Esta rastreabilidade não altera o estado ou a prioridade de APIQ-020.


## APIQ-021 — Granularidade da API do wizard

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [07-API.md](07-API.md), [08-FRONTEND.md](08-FRONTEND.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [MAPPING-WIZARD.md](features/MAPPING-WIZARD.md)  
**Affected Delivery:** API / contratos / frontend  
**Blocks:** implementar a decisão «Granularidade da API do wizard» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

O wizard salvará sub-recursos individualmente ou payload agregado por etapa?

### Nota de reconciliação

Relacionada a PATCH em APIQ-003; são decisões distintas.

---

## AUDQ-014 — Restauração de versão

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [10-AUDIT.md](10-AUDIT.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md)  
**Affected Delivery:** Audit / Versioning  
**Blocks:** implementar a decisão «Restauração de versão» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

A V1 permitirá restaurar versão anterior?

---

## AUDQ-015 — Armazenamento de eventos de segurança

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [10-AUDIT.md](10-AUDIT.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md)  
**Affected Delivery:** Audit / Versioning  
**Blocks:** implementar a decisão «Armazenamento de eventos de segurança» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Eventos de segurança terão armazenamento separado de Audit Logs?

---

## AUDQ-016 — Retenção de versões históricas

**Status:** OPEN  
**Priority:** HIGH  
**Affected Documents:** [10-AUDIT.md](10-AUDIT.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md)  
**Affected Delivery:** Audit / Versioning  
**Blocks:** implementar a decisão «Retenção de versões históricas» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Por quanto tempo manter versões históricas das atividades?

### Nota de reconciliação

Distinta da retenção de AuditLog (AUDQ-001).

---

## AUDQ-017 — Snapshot do ator de auditoria

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [10-AUDIT.md](10-AUDIT.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md)  
**Affected Delivery:** Audit / Versioning  
**Blocks:** implementar a decisão «Snapshot do ator de auditoria» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Preservar actorName/actorEmail no momento do evento ou apenas actorId?

---

## AUDQ-018 — Valores before/after na auditoria

**Status:** OPEN  
**Priority:** HIGH  
**Affected Documents:** [10-AUDIT.md](10-AUDIT.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md)  
**Affected Delivery:** Audit / Versioning  
**Blocks:** implementar a decisão «Valores before/after na auditoria» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Quais eventos precisam armazenar valores before e after?

### Nota de reconciliação

Distinta do formato/limite de metadata (AUDQ-002).

---

## AUTHQ-011 — Edição de atividade pelo DPO

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [04-AUTHORIZATION.md](04-AUTHORIZATION.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md)  
**Affected Delivery:** Authentication / Organizations / Authorization  
**Blocks:** implementar a decisão «Edição de atividade pelo DPO» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

O DPO possui somente revisão/aprovação ou também pode editar diretamente uma atividade?

---

## AUTHQ-012 — Campos permitidos no cadastro rápido

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [04-AUTHORIZATION.md](04-AUTHORIZATION.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md)  
**Affected Delivery:** Authentication / Organizations / Authorization  
**Blocks:** implementar a decisão «Campos permitidos no cadastro rápido» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Quais campos um colaborador pode preencher no Quick Create de System e Supplier?

### Nota de reconciliação

Não equivale às permissões de executar Quick Create (SYSQ-011/SUPQ-011).

---

## AUTHQ-013 — Permissão de arquivamento

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [06-WORKFLOWS.md](06-WORKFLOWS.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [PROCESSING-ACTIVITY.md](features/PROCESSING-ACTIVITY.md)  
**Affected Delivery:** Authentication / Organizations / Authorization  
**Blocks:** implementar a decisão «Permissão de arquivamento» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Quem pode arquivar uma atividade e com qual scope?

### Nota de reconciliação

Relacionada à matriz AUTHQ-004 e às regras BRQ-008; não determina condições de arquivamento.

---

## AUTHQ-014 — Papéis e escopo de leitura da auditoria

**Status:** OPEN  
**Priority:** HIGH  
**Affected Documents:** [10-AUDIT.md](10-AUDIT.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md)  
**Affected Delivery:** Authentication / Organizations / Authorization  
**Blocks:** implementar a decisão «Papéis e escopo de leitura da auditoria» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Quais papéis podem consultar Audit Logs? Manager poderá consultar somente a própria área?

### Nota de reconciliação

Consolida as duas perguntas locais de permission + scope da leitura de auditoria.

---

## AUTHQ-015 — Fronteira estrutural da S3.5 e contrato de concessões

**Status:** DECIDED
**Priority:** HIGH
**Affected Documents:** [03-DATABASE.md](03-DATABASE.md), [04-AUTHORIZATION.md](04-AUTHORIZATION.md), [09-SECURITY.md](09-SECURITY.md), [11-TESTING.md](11-TESTING.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [13-DECISIONS.md](13-DECISIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md), [AUTH.md](features/AUTH.md), [ORGANIZATIONS.md](features/ORGANIZATIONS.md)
**Affected Delivery:** S3.5 — fundação estrutural de autorização
**Blocks:** nenhum bloqueio documental pendente nesta questão; aplicar DEC-070. A formalização inicial não autorizou implementação; autorizações posteriores permitiram a entrega estrutural, agora concluída.

### Question

A S3.5 deve limitar-se à resolução atual das concessões do Membership autorizado pela S3.4, preservando individualmente Role, scope e Business Units de cada RoleAssignment, sem implementar permission matrix, Role → Permission ou autorização funcional?

A decisão abrange contrato interno, resolução por request, isolamento Organization/Membership sob RLS, leitura runtime mínima de Role e comportamento conservador para grants vazios ou inválidos.

### Decision

DEC-070 (APPROVED): adotar a Alternativa A, grants estruturais. `ResolvedMembershipGrants` contém `membershipId`, `authorizedOrganizationId` e `grants[]`; cada grant preserva `roleAssignmentId`, `roleCode`, `scope` e `businessUnitIds[]`. Resolver após S3.4, com estado atual por request, contexto explícito e imutabilidade profunda. Ausência de grants retorna coleção vazia; BUSINESS_UNIT sem áreas mantém alcance vazio; scope desconhecido/inconsistência falha fechado e falha de persistência não retorna sucesso vazio.

A leitura runtime de `public.roles`, implementada pela migration `0003_role_read_privilege.sql`, limita-se a SELECT nas colunas `id` e `code`, por SQL incremental versionado, sem escrita, nova primitive privilegiada ou ampliação do bootstrap. Os 17 critérios S3.5-AC-001 a S3.5-AC-017 estão registrados integralmente na DEC-070 e foram auditados como ATENDIDOS no escopo estrutural. Commits e resultados reportados estão no [registro de encerramento](14-IMPLEMENTATION-PLAN.md#encerramento-documental-da-s35); nenhum teste foi reexecutado neste encerramento.

### Rationale

Aprovação humana expressa da fronteira estrutural, preservando DEC-035/036/037/038/049/052/056/062 e a autorização funcional obrigatória das entregas posteriores.

### Impact

A aprovação original autorizou exclusivamente formalização documental. Autorizações humanas posteriores permitiram implementar S3.5.1 a S3.5.4; resolução estrutural concluída e auditada. Este encerramento não executa código, SQL, migrations ou testes. Não altera outras Decisions/Open Questions, nem resolve permissions, ADMIN/PLATFORM_ADMIN, workflow, GET /me ou frontend. DEC-039 permanece válida para leitura funcional do D1.

### Decision Date

2026-10-23

---

## AUTHQ-016 — Política funcional mínima de leitura D1 sobre grants estruturais

**Status:** DECIDED
**Priority:** HIGH
**Affected Documents:** [04-AUTHORIZATION.md](04-AUTHORIZATION.md), [11-TESTING.md](11-TESTING.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [13-DECISIONS.md](13-DECISIONS.md), [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), [AUTH.md](features/AUTH.md)
**Affected Delivery:** AUTH-F.1 — política interna de leitura D1
**Blocks:** nenhum bloqueio de decisão deste recorte; aplicar DEC-072. A implementação exige autorização específica posterior e não reabre a S3.5 estrutural.

### Question

Aprovar o mapeamento de `processing_activity:read` e `ropa:read` somente para COLLABORATOR/BUSINESS_UNIT, MANAGER/BUSINESS_UNIT e DPO/ORGANIZATION, com demais combinações sem alcance D1, avaliação por grant e união apenas de alcances aplicáveis à mesma operação, Membership e Organization?

### Decision

[DEC-072](13-DECISIONS.md#dec-072--auth-f1-política-funcional-mínima-de-leitura-d1) está APPROVED, com aprovação humana em 2026-10-23. Aprova contratos explícitos de entrada/alcance/alvo confiável, resultado vazio sem acesso, falha integral para inconsistências, propagação de erros e política imutável sem I/O. Ver a decisão para matriz, exemplos e 15 critérios aprovados, ainda não executados.

Pontos aprovados expressamente: as três combinações exatas, sem promoção de scope; demais combinações estruturalmente válidas sem leitura D1; semântica de união por operação/contexto; repetições idênticas idempotentes e assignments contraditórios inválidos; descriptor mínimo do alvo e nenhum alcance representado por BUSINESS_UNIT vazio. A comparação das áreas de assignments repetidos usa semântica de conjunto; diferenças apenas de ordem ou repetição dos mesmos IDs não são contradição. Cada grant BUSINESS_UNIT vazio contribui com alcance vazio; o agregado é vazio somente quando nenhum grant produz alcance aplicável. Não alterar cadastro ou resolução estrutural para impor essa política.

### Rationale

DEC-039 já define leitura D1; DEC-037/038 preservam cada concessão e seu scope. AUTHQ-004 permanece IN_ANALYSIS apenas para leitura remanescente; esta questão não encerra essa pendência e não redefine revisão, aprovação ou edição.

### Impact

Finalização documental da política aprovada; implementação não iniciada. Não autoriza código, endpoints, SQL, migrations, alteração da DEC-070 ou novos contratos HTTP. DEC-066 permanece aplicável à futura integração. AUTHQ-015 continua DECIDED. Somente AUTHQ-016 muda de OPEN para DECIDED; todas as demais Questions preservam seus estados.

### Proposal Date

2026-10-23


### Decision Date

2026-10-23

---

## BRQ-011 — Bloqueio externo de sistemas na V1

**Status:** DECIDED  
**Priority:** HIGH  
**Affected Documents:** [05-BUSINESS-RULES.md](05-BUSINESS-RULES.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [13-DECISIONS.md](13-DECISIONS.md)  
**Affected Delivery:** Business Rules / Processing Activity / Compliance Gate  
**Blocks:** nenhum bloqueio documental pendente para esta questão; cumprir a decisão registrada

### Question

A V1 bloqueará tecnicamente a entrada em produção de sistemas externos ou apenas registrará pendências na plataforma?

### Decision

DEC-031: A V1 registra e acompanha pendências internamente; não bloqueia tecnicamente a entrada em produção de sistemas externos. O efeito de PENDING sobre Submit, Gate e ACTIVE permanece aberto em SYSQ-007 e SUPQ-006.

### Rationale

Decisão expressamente confirmada pelo usuário para encerrar o saneamento documental.

### Impact

Atualizar especificações de domínio, regras e workflow afetadas sem ampliar o escopo V1.

### Decision Date

2026-09-18

---

## CATQ-001 — "Minors" deve existir como PersonalDataCategory ou apenas como característica/categoria de DataSubject?

**Status:** OPEN  
**Priority:** HIGH  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [23-SEED-AND-CATALOGS.md](23-SEED-AND-CATALOGS.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md)  
**Affected Delivery:** Seed / Catalogs / schema / wizard  
**Blocks:** implementar a decisão «"Minors" deve existir como PersonalDataCategory ou apenas como característica/categoria de DataSubject?» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

"Minors" deve existir como PersonalDataCategory ou apenas como característica/categoria de DataSubject?

---

## CATQ-002 — Organizations poderão criar categorias/itens personalizados de dados pessoais?

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [23-SEED-AND-CATALOGS.md](23-SEED-AND-CATALOGS.md)  
**Affected Delivery:** Seed / Catalogs / schema / wizard  
**Blocks:** implementar a decisão «Organizations poderão criar categorias/itens personalizados de dados pessoais?» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Organizations poderão criar categorias/itens personalizados de dados pessoais?

---

## CATQ-004 — Country utilizará ISO 3166-1 alpha-2?

**Status:** OPEN  
**Priority:** LOW  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [23-SEED-AND-CATALOGS.md](23-SEED-AND-CATALOGS.md)  
**Affected Delivery:** Seed / Catalogs / schema / wizard  
**Blocks:** implementar a decisão «Country utilizará ISO 3166-1 alpha-2?» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Country utilizará ISO 3166-1 alpha-2?

---

## CATQ-005 — Quais unidades e formatos de retenção serão suportados na V1?

**Status:** OPEN  
**Priority:** HIGH  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [23-SEED-AND-CATALOGS.md](23-SEED-AND-CATALOGS.md)  
**Affected Delivery:** Seed / Catalogs / schema / wizard  
**Blocks:** implementar a decisão «Quais unidades e formatos de retenção serão suportados na V1?» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Quais unidades e formatos de retenção serão suportados na V1?

---

## CATQ-006 — Qual será o catálogo definitivo de CollectionSourceType?

**Status:** OPEN  
**Priority:** HIGH  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [23-SEED-AND-CATALOGS.md](23-SEED-AND-CATALOGS.md)  
**Affected Delivery:** Seed / Catalogs / schema / wizard  
**Blocks:** implementar a decisão «Qual será o catálogo definitivo de CollectionSourceType?» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Qual será o catálogo definitivo de CollectionSourceType?

---

## CATQ-007 — RecipientType será somente INTERNAL/EXTERNAL?

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [23-SEED-AND-CATALOGS.md](23-SEED-AND-CATALOGS.md)  
**Affected Delivery:** Seed / Catalogs / schema / wizard  
**Blocks:** implementar a decisão «RecipientType será somente INTERNAL/EXTERNAL?» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

RecipientType será somente INTERNAL/EXTERNAL?

---

## CATQ-008 — Consent method será catálogo, texto livre ou híbrido?

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [23-SEED-AND-CATALOGS.md](23-SEED-AND-CATALOGS.md)  
**Affected Delivery:** Seed / Catalogs / schema / wizard  
**Blocks:** implementar a decisão «Consent method será catálogo, texto livre ou híbrido?» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Consent method será catálogo, texto livre ou híbrido?

---

## CATQ-009 — APIs de catálogo usarão UUID, stable code ou ambos?

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [23-SEED-AND-CATALOGS.md](23-SEED-AND-CATALOGS.md)  
**Affected Delivery:** Seed / Catalogs / schema / wizard  
**Blocks:** implementar a decisão «APIs de catálogo usarão UUID, stable code ou ambos?» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

APIs de catálogo usarão UUID, stable code ou ambos?

---

## CATQ-010 — Enums serão PostgreSQL ENUM, CHECK constraints ou strings validadas pela aplicação?

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [23-SEED-AND-CATALOGS.md](23-SEED-AND-CATALOGS.md)  
**Affected Delivery:** Seed / Catalogs / schema / wizard  
**Blocks:** implementar a decisão «Enums serão PostgreSQL ENUM, CHECK constraints ou strings validadas pela aplicação?» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Enums serão PostgreSQL ENUM, CHECK constraints ou strings validadas pela aplicação?

---

## CATQ-011 — Catálogos configuráveis terão displayOrder?

**Status:** OPEN  
**Priority:** LOW  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [23-SEED-AND-CATALOGS.md](23-SEED-AND-CATALOGS.md)  
**Affected Delivery:** Seed / Catalogs / schema / wizard  
**Blocks:** implementar a decisão «Catálogos configuráveis terão displayOrder?» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Catálogos configuráveis terão displayOrder?

---

## CATQ-012 — Seleções OTHER exigirão descrição textual obrigatória?

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [23-SEED-AND-CATALOGS.md](23-SEED-AND-CATALOGS.md), [25-UX-GUIDELINES.md](25-UX-GUIDELINES.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md)  
**Affected Delivery:** Seed / Catalogs / schema / wizard  
**Blocks:** implementar a decisão «Seleções OTHER exigirão descrição textual obrigatória?» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Seleções OTHER exigirão descrição textual obrigatória?

---

## DQ-011 — Consentimento individual na V1

**Status:** DECIDED  
**Priority:** HIGH  
**Affected Documents:** [02-DOMAIN.md](02-DOMAIN.md), [05-BUSINESS-RULES.md](05-BUSINESS-RULES.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [MAPPING-WIZARD.md](features/MAPPING-WIZARD.md), [PROCESSING-ACTIVITY.md](features/PROCESSING-ACTIVITY.md)  
**Affected Delivery:** Domínio / schema / atividade / wizard  
**Blocks:** nenhum bloqueio documental pendente para esta questão; cumprir a decisão registrada

### Question

O sistema armazenará apenas termos e versões ou também consentimentos individuais dos titulares?

### Decision

DEC-026: A V1 pode registrar documentos e metadados de consentimento, mas não aceites individuais de titulares. DEC-026 responde integralmente ao escopo V1 desta questão.

### Rationale

Decisão expressamente confirmada pelo usuário para encerrar o saneamento documental.

### Impact

Atualizar especificações de domínio, regras e workflow afetadas sem ampliar o escopo V1.

### Decision Date

2026-09-18

---

## ERRQ-001 — Operações semânticas repetidas devem ser idempotentes ou retornar conflito quando o recurso já estiver no estado solicitado?

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [19-ERROR-CATALOG.md](19-ERROR-CATALOG.md), [20-API-CONTRACTS.md](20-API-CONTRACTS.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md)  
**Affected Delivery:** API / Error Catalog / frontend  
**Blocks:** implementar a decisão «Operações semânticas repetidas devem ser idempotentes ou retornar conflito quando o recurso já estiver no estado solicitado?» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Operações semânticas repetidas devem ser idempotentes ou retornar conflito quando o recurso já estiver no estado solicitado?

---

## ERRQ-002 — A API utilizará:

**Status:** DECIDED
**Priority:** MEDIUM
**Affected Documents:** [07-API.md](07-API.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [13-DECISIONS.md](13-DECISIONS.md), [19-ERROR-CATALOG.md](19-ERROR-CATALOG.md), [20-API-CONTRACTS.md](20-API-CONTRACTS.md)
**Affected Delivery:** API / Error Catalog / frontend
**Blocks:** nenhum bloqueio pendente nesta questão; aplicar DEC-063

### Question

A API utilizará:

```text
400
```

para transport validation e:

```text
422
```

para domain/business validation?

### Decision

DEC-063: usar 400 para falhas estruturais ou de transporte e 422 para violações de domínio, negócio ou workflow. 401, 403, 404, 409 e 500 permanecem reservados aos seus contratos específicos.

### Rationale

Separar requests estruturalmente inválidas de requests válidas que não satisfazem regras semânticas, sem reclassificar autenticação, autorização, inexistência, conflito ou falha interna.

### Decision Date

2026-10-02

---

## ERRQ-003 — As mensagens retornadas pelo backend serão:

**Status:** DECIDED
**Priority:** LOW
**Affected Documents:** [07-API.md](07-API.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [13-DECISIONS.md](13-DECISIONS.md), [19-ERROR-CATALOG.md](19-ERROR-CATALOG.md), [20-API-CONTRACTS.md](20-API-CONTRACTS.md)
**Affected Delivery:** API / Error Catalog / frontend
**Blocks:** nenhum bloqueio pendente nesta questão; aplicar DEC-064

### Question

As mensagens retornadas pelo backend serão:

```text
English
```

com tradução no frontend por `error.code`

ou:

```text
Portuguese
```

diretamente pela API?

### Decision

DEC-064: mensagens públicas da API em português; `error.code` estável, em inglês e `UPPER_SNAKE_CASE`; frontend depende do código, não da mensagem. Detalhes técnicos e internos não são expostos.

### Rationale

Alinhar a API ao público inicial e à DEC-061, preservando códigos independentes do idioma e evolução futura da tradução no frontend.

### Decision Date

2026-10-02

---

## ERRQ-004 — Qual política será utilizada para diferenciar:

**Status:** DECIDED
**Priority:** MEDIUM  
**Affected Documents:** [07-API.md](07-API.md), [09-SECURITY.md](09-SECURITY.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [13-DECISIONS.md](13-DECISIONS.md), [19-ERROR-CATALOG.md](19-ERROR-CATALOG.md), [20-API-CONTRACTS.md](20-API-CONTRACTS.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md), [AUTH.md](features/AUTH.md), [ORGANIZATIONS.md](features/ORGANIZATIONS.md)
**Affected Delivery:** API / Error Catalog / frontend  
**Blocks:** nenhum bloqueio pendente nesta questão; aplicar DEC-066

### Question

Qual política será utilizada para diferenciar:

```text
403
```

e:

```text
404
```

em recursos fora do scope do usuário, mas dentro da mesma Organization?

### Decision

DEC-066: depois de criado `AuthorizedTenantContext`, retornar 404 quando o usuário não puder confirmar a existência do recurso, tornando indistinguíveis recurso inexistente, cross-tenant e fora do scope de visibilidade. Retornar 403/`FORBIDDEN` somente quando o recurso for legitimamente visível, mas a ação não for autorizada.

### Rationale

Impedir enumeração cross-tenant e IDOR sem confundir falta de visibilidade com negação de uma ação sobre recurso conhecido legitimamente.

### Decision Date

2026-10-02

---

## FEQ-010 — Origem do design visual

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [08-FRONTEND.md](08-FRONTEND.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md)  
**Affected Delivery:** Frontend / UX  
**Blocks:** implementar a decisão «Origem do design visual» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Existe design visual/Figma oficial ou o frontend deverá construir o design system inicial?

---

## FEQ-012 — Idiomas da V1

**Status:** OPEN  
**Priority:** LOW  
**Affected Documents:** [08-FRONTEND.md](08-FRONTEND.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md)  
**Affected Delivery:** Frontend / UX  
**Blocks:** implementar a decisão «Idiomas da V1» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

A aplicação será exclusivamente pt-BR na V1?

---

## FEQ-013 — Solução de roteamento

**Status:** DECIDED
**Priority:** LOW  
**Affected Documents:** [08-FRONTEND.md](08-FRONTEND.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md)  
**Affected Delivery:** Frontend / UX  
**Blocks:** nenhum bloqueio de escolha de roteador; aplicar DEC-071. A implementação da base frontend permanece pendente.

### Question

Qual solução de roteamento será utilizada no frontend?

### Decision

[DEC-071](13-DECISIONS.md#dec-071--escolhas-técnicas-e-escopo-do-primeiro-frontend-shell) (APPROVED): React Router em modo declarativo para a base frontend. O primeiro shell terá rota `/` e fallback para NotFoundPage; esta escolha não aprova rotas de módulos indisponíveis nem autenticação/autorização frontend.

### Rationale

Solução declarativa para a navegação da base React/Vite, sem exigir modo framework. React Router era apenas sugestão no registro anterior; a aprovação humana expressa agora decide a escolha.

### Impact

Implementação posterior no frontend, sem alteração do backend ou de contratos públicos. Nenhuma dependência foi instalada neste registro.

### Decision Date

2026-10-23

---

## FEQ-014 — Configuração de colunas do ROPA

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [08-FRONTEND.md](08-FRONTEND.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md)  
**Affected Delivery:** Frontend / UX  
**Blocks:** implementar a decisão «Configuração de colunas do ROPA» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

A tabela ROPA terá colunas fixas ou configuráveis?

---

## FEQ-015 — Seletor de organização

**Status:** OPEN  
**Priority:** HIGH  
**Affected Documents:** [08-FRONTEND.md](08-FRONTEND.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md)  
**Affected Delivery:** Frontend / UX  
**Blocks:** implementar a decisão «Seletor de organização» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Será necessário seletor de organização no frontend?

### Nota de reconciliação

Relacionada ao suporte multi-organização AUTHQ-006 e ao contexto ativo APIQ-020.

---

## INFRAQ-009 — RPO de produção

**Status:** OPEN  
**Priority:** HIGH  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [17-ENVIRONMENTS-AND-DEPLOYMENT.md](17-ENVIRONMENTS-AND-DEPLOYMENT.md), [26-RELEASE-CHECKLIST.md](26-RELEASE-CHECKLIST.md)  
**Affected Delivery:** Environments / Deployment / operação  
**Blocks:** implementar a decisão «RPO de produção» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Qual RPO esperado para produção?

---

## INFRAQ-010 — RTO de produção

**Status:** OPEN  
**Priority:** HIGH  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [17-ENVIRONMENTS-AND-DEPLOYMENT.md](17-ENVIRONMENTS-AND-DEPLOYMENT.md), [26-RELEASE-CHECKLIST.md](26-RELEASE-CHECKLIST.md)  
**Affected Delivery:** Environments / Deployment / operação  
**Blocks:** implementar a decisão «RTO de produção» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Qual RTO esperado para produção?

---

## INFRAQ-011 — Zero downtime

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [17-ENVIRONMENTS-AND-DEPLOYMENT.md](17-ENVIRONMENTS-AND-DEPLOYMENT.md), [26-RELEASE-CHECKLIST.md](26-RELEASE-CHECKLIST.md)  
**Affected Delivery:** Environments / Deployment / operação  
**Blocks:** implementar a decisão «Zero downtime» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

O deploy de produção exige zero downtime?

---

## INFRAQ-012 — Staging permanente

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [17-ENVIRONMENTS-AND-DEPLOYMENT.md](17-ENVIRONMENTS-AND-DEPLOYMENT.md)  
**Affected Delivery:** Environments / Deployment / operação  
**Blocks:** implementar a decisão «Staging permanente» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Será necessário ambiente STAGING permanente?

---

## INFRAQ-013 — Retenção de arquivos e exports

**Status:** OPEN  
**Priority:** HIGH  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [17-ENVIRONMENTS-AND-DEPLOYMENT.md](17-ENVIRONMENTS-AND-DEPLOYMENT.md), [18-OBSERVABILITY.md](18-OBSERVABILITY.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md)  
**Affected Delivery:** Environments / Deployment / operação  
**Blocks:** implementar a decisão «Retenção de arquivos e exports» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Qual política de retenção dos arquivos e exports armazenados no object storage?

---

## NOTIFQ-001 — Qual será a política de deduplicação de Notifications?

**Status:** OPEN  
**Priority:** HIGH  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [24-NOTIFICATIONS.md](24-NOTIFICATIONS.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md)  
**Affected Delivery:** Notifications  
**Blocks:** implementar a decisão «Qual será a política de deduplicação de Notifications?» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Qual será a política de deduplicação de Notifications?

---

## NOTIFQ-002 — Por quanto tempo Notifications serão mantidas?

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [24-NOTIFICATIONS.md](24-NOTIFICATIONS.md)  
**Affected Delivery:** Notifications  
**Blocks:** implementar a decisão «Por quanto tempo Notifications serão mantidas?» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Por quanto tempo Notifications serão mantidas?

---

## NOTIFQ-003 — Unread count será endpoint próprio ou parte do `/me`?

**Status:** OPEN  
**Priority:** LOW  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [24-NOTIFICATIONS.md](24-NOTIFICATIONS.md)  
**Affected Delivery:** Notifications  
**Blocks:** implementar a decisão «Unread count será endpoint próprio ou parte do `/me`?» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Unread count será endpoint próprio ou parte do `/me`?

---

## NOTIFQ-004 — Usuários multi-org verão Notifications somente da Organization ativa ou inbox global?

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [24-NOTIFICATIONS.md](24-NOTIFICATIONS.md)  
**Affected Delivery:** Notifications  
**Blocks:** implementar a decisão «Usuários multi-org verão Notifications somente da Organization ativa ou inbox global?» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Usuários multi-org verão Notifications somente da Organization ativa ou inbox global?

---

## NOTIFQ-005 — V1 terá email notifications ou somente in-app?

**Status:** OPEN  
**Priority:** HIGH  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [24-NOTIFICATIONS.md](24-NOTIFICATIONS.md), [25-UX-GUIDELINES.md](25-UX-GUIDELINES.md)  
**Affected Delivery:** Notifications  
**Blocks:** implementar a decisão «V1 terá email notifications ou somente in-app?» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

V1 terá email notifications ou somente in-app?

---

## NOTIFQ-006 — Usuários poderão configurar preferências de Notification na V1?

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [24-NOTIFICATIONS.md](24-NOTIFICATIONS.md)  
**Affected Delivery:** Notifications  
**Blocks:** implementar a decisão «Usuários poderão configurar preferências de Notification na V1?» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Usuários poderão configurar preferências de Notification na V1?

---

## NOTIFQ-007 — Notifications críticas precisam de garantia transacional/outbox na V1?

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [24-NOTIFICATIONS.md](24-NOTIFICATIONS.md)  
**Affected Delivery:** Notifications  
**Blocks:** implementar a decisão «Notifications críticas precisam de garantia transacional/outbox na V1?» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Notifications críticas precisam de garantia transacional/outbox na V1?

---

## NOTIFQ-008 — Notifications da V1 precisam de atualização em tempo real?

**Status:** OPEN  
**Priority:** LOW  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [24-NOTIFICATIONS.md](24-NOTIFICATIONS.md), [25-UX-GUIDELINES.md](25-UX-GUIDELINES.md)  
**Affected Delivery:** Notifications  
**Blocks:** implementar a decisão «Notifications da V1 precisam de atualização em tempo real?» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Notifications da V1 precisam de atualização em tempo real?

---

## NOTIFQ-009 — Notification precisa armazenar actionCode?

**Status:** OPEN  
**Priority:** LOW  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [24-NOTIFICATIONS.md](24-NOTIFICATIONS.md), [25-UX-GUIDELINES.md](25-UX-GUIDELINES.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md)  
**Affected Delivery:** Notifications  
**Blocks:** implementar a decisão «Notification precisa armazenar actionCode?» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Notification precisa armazenar actionCode?

---

## OBSQ-001 — Quais dependências devem participar do readiness check?

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [18-OBSERVABILITY.md](18-OBSERVABILITY.md), [26-RELEASE-CHECKLIST.md](26-RELEASE-CHECKLIST.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md)  
**Affected Delivery:** Observability / operação  
**Blocks:** implementar a decisão «Quais dependências devem participar do readiness check?» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Quais dependências devem participar do readiness check?

---

## OBSQ-002 — Quais SLIs/SLOs serão adotados para a V1?

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [18-OBSERVABILITY.md](18-OBSERVABILITY.md), [26-RELEASE-CHECKLIST.md](26-RELEASE-CHECKLIST.md)  
**Affected Delivery:** Observability / operação  
**Blocks:** implementar a decisão «Quais SLIs/SLOs serão adotados para a V1?» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Quais SLIs/SLOs serão adotados para a V1?

---

## OBSQ-003 — IP de origem deve ser armazenado nos logs técnicos e/ou eventos de segurança?

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [18-OBSERVABILITY.md](18-OBSERVABILITY.md)  
**Affected Delivery:** Observability / operação  
**Blocks:** implementar a decisão «IP de origem deve ser armazenado nos logs técnicos e/ou eventos de segurança?» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

IP de origem deve ser armazenado nos logs técnicos e/ou eventos de segurança?

---

## OBSQ-004 — Qual será a retenção dos Application Logs e Security Logs?

**Status:** OPEN  
**Priority:** HIGH  
**Affected Documents:** [09-SECURITY.md](09-SECURITY.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [18-OBSERVABILITY.md](18-OBSERVABILITY.md), [26-RELEASE-CHECKLIST.md](26-RELEASE-CHECKLIST.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md)  
**Affected Delivery:** Observability / operação  
**Blocks:** implementar a decisão «Qual será a retenção dos Application Logs e Security Logs?» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Qual será a retenção dos Application Logs e Security Logs?

---

## OBSQ-005 — Qual threshold inicial deve classificar uma request como lenta?

**Status:** OPEN  
**Priority:** LOW  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [18-OBSERVABILITY.md](18-OBSERVABILITY.md)  
**Affected Delivery:** Observability / operação  
**Blocks:** implementar a decisão «Qual threshold inicial deve classificar uma request como lenta?» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Qual threshold inicial deve classificar uma request como lenta?

---

## OBSQ-006 — Por quanto tempo métricas, traces e eventos de error tracking devem ser mantidos?

**Status:** OPEN  
**Priority:** LOW  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [18-OBSERVABILITY.md](18-OBSERVABILITY.md)  
**Affected Delivery:** Observability / operação  
**Blocks:** implementar a decisão «Por quanto tempo métricas, traces e eventos de error tracking devem ser mantidos?» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Por quanto tempo métricas, traces e eventos de error tracking devem ser mantidos?

---

## OBSQ-007 — Qual stack de observabilidade será utilizada em produção?

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [18-OBSERVABILITY.md](18-OBSERVABILITY.md), [26-RELEASE-CHECKLIST.md](26-RELEASE-CHECKLIST.md)  
**Affected Delivery:** Observability / operação  
**Blocks:** implementar a decisão «Qual stack de observabilidade será utilizada em produção?» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Qual stack de observabilidade será utilizada em produção?

---

## OBSQ-008 — Qual canal receberá alertas operacionais de produção?

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [18-OBSERVABILITY.md](18-OBSERVABILITY.md), [26-RELEASE-CHECKLIST.md](26-RELEASE-CHECKLIST.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md)  
**Affected Delivery:** Observability / operação  
**Blocks:** implementar a decisão «Qual canal receberá alertas operacionais de produção?» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Qual canal receberá alertas operacionais de produção?

---

## ORGQ-001 — Business Unit possui nome único dentro da organização?

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [19-ERROR-CATALOG.md](19-ERROR-CATALOG.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md), [ORGANIZATIONS.md](features/ORGANIZATIONS.md)  
**Affected Delivery:** Organizations / Business Units  
**Blocks:** implementar a decisão «Business Unit possui nome único dentro da organização?» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

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

## ORGQ-002 — O que acontece quando Business Unit com atividades ACTIVE é inativada?

**Status:** OPEN  
**Priority:** HIGH  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [ORGANIZATIONS.md](features/ORGANIZATIONS.md)  
**Affected Delivery:** Organizations / Business Units  
**Blocks:** implementar a decisão «O que acontece quando Business Unit com atividades ACTIVE é inativada?» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

O que acontece quando Business Unit com atividades ACTIVE é inativada?

Possibilidades:

```text
atividades continuam ativas

atividades recebem pendência

inativação é bloqueada

atividades precisam ser transferidas
```

---

## ORGQ-003 — Quem pode criar/inativar Business Units?

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [ORGANIZATIONS.md](features/ORGANIZATIONS.md)  
**Affected Delivery:** Organizations / Business Units  
**Blocks:** implementar a decisão «Quem pode criar/inativar Business Units?» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Quem pode criar/inativar Business Units?

Possibilidades:

```text
ADMIN

DPO

PLATFORM_ADMIN
```

A resposta deve ser incorporada à matriz de autorização.

---

## ORGQ-004 — Como uma nova Organization é criada?

**Status:** OPEN  
**Priority:** HIGH  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [ORGANIZATIONS.md](features/ORGANIZATIONS.md)  
**Affected Delivery:** Organizations / Business Units  
**Blocks:** implementar a decisão «Como uma nova Organization é criada?» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Como uma nova Organization é criada?

```text
PLATFORM_ADMIN

onboarding interno

self-service

integração comercial
```

### Delimitação do D1 — DEC-050

O login não cria Organization. No D1, User, ExternalIdentity, Membership e as concessões necessárias existem antes do login por provisionamento controlado. DEC-050 não define quem cria Organization nem o mecanismo operacional desse provisionamento; ORGQ-004 permanece OPEN, com prioridade HIGH, para essas decisões.

---

## ORGQ-005 — O que acontece quando uma Organization inteira é inativada?

**Status:** OPEN  
**Priority:** HIGH  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [19-ERROR-CATALOG.md](19-ERROR-CATALOG.md), [21-DATA-DICTIONARY.md](21-DATA-DICTIONARY.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md), [ORGANIZATIONS.md](features/ORGANIZATIONS.md)  
**Affected Delivery:** Organizations / Business Units  
**Blocks:** implementar a decisão «O que acontece quando uma Organization inteira é inativada?» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

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

## PRODQ-003 — Branding por organização

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [13-DECISIONS.md](13-DECISIONS.md), [ORGANIZATIONS.md](features/ORGANIZATIONS.md)  
**Affected Delivery:** Produto / escopo V1  
**Blocks:** implementar a decisão «Branding» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

O produto oferecerá branding por organização (logo e cores)? Qual é o escopo e em qual entrega será considerado?

### Delimitação aprovada

DEC-032 separa branding de domínio próprio, registrado em PRODQ-004. Nenhuma capacidade foi incluída na V1. MEDIUM permanece a prioridade de triagem existente; a separação não aprova a funcionalidade.

---

## RELQ-001 — O produto utilizará Semantic Versioning para releases?

**Status:** OPEN  
**Priority:** LOW  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [26-RELEASE-CHECKLIST.md](26-RELEASE-CHECKLIST.md)  
**Affected Delivery:** Release / operação  
**Blocks:** implementar a decisão «O produto utilizará Semantic Versioning para releases?» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

O produto utilizará Semantic Versioning para releases?

---

## RELQ-002 — A V1 utilizará feature flags para releases graduais?

**Status:** OPEN  
**Priority:** LOW  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [26-RELEASE-CHECKLIST.md](26-RELEASE-CHECKLIST.md)  
**Affected Delivery:** Release / operação  
**Blocks:** implementar a decisão «A V1 utilizará feature flags para releases graduais?» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

A V1 utilizará feature flags para releases graduais?

---

## RELQ-003 — Quem possui autoridade operacional para aprovar release em produção?

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [26-RELEASE-CHECKLIST.md](26-RELEASE-CHECKLIST.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md)  
**Affected Delivery:** Release / operação  
**Blocks:** implementar a decisão «Quem possui autoridade operacional para aprovar release em produção?» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Quem possui autoridade operacional para aprovar release em produção?

---

## SECQ-007 — Formatos de upload permitidos

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [09-SECURITY.md](09-SECURITY.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [MAPPING-WIZARD.md](features/MAPPING-WIZARD.md)  
**Affected Delivery:** Segurança / Authentication / uploads  
**Blocks:** implementar a decisão «Formatos de upload permitidos» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Quais formatos de arquivo serão aceitos em uploads?

---

## SECQ-014 — Criptografia de campos

**Status:** OPEN  
**Priority:** HIGH  
**Affected Documents:** [09-SECURITY.md](09-SECURITY.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md)  
**Affected Delivery:** Segurança / Authentication / uploads  
**Blocks:** implementar a decisão «Criptografia de campos» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Existe requisito para field-level encryption?

---

## SECQ-016 — Gravação de sessão

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [09-SECURITY.md](09-SECURITY.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md)  
**Affected Delivery:** Segurança / Authentication / uploads  
**Blocks:** implementar a decisão «Gravação de sessão» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Alguma ferramenta de gravação de sessão será utilizada?

---

## SECQ-018 — Controles de administração global

**Status:** OPEN  
**Priority:** CRITICAL  
**Affected Documents:** [09-SECURITY.md](09-SECURITY.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md)  
**Affected Delivery:** Segurança / Authentication / uploads  
**Blocks:** implementar a decisão «Controles de administração global» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Quais controles adicionais serão exigidos caso exista acesso administrativo global?

### Nota de reconciliação

Existência do papel global permanece em AUTHQ-009; não pressupor sua aprovação.

---

## TESTQ-010 — Volume esperado

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [11-TESTING.md](11-TESTING.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md)  
**Affected Delivery:** Testing / CI / homologação  
**Blocks:** implementar a decisão «Volume esperado» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Qual volume esperado de organizações, usuários, atividades, sistemas e fornecedores?

---

## TESTQ-011 — Runner de testes backend

**Status:** DECIDED
**Priority:** MEDIUM  
**Affected Documents:** [11-TESTING.md](11-TESTING.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md)  
**Affected Delivery:** Testing / CI / homologação  
**Blocks:** Decisão registrada; não bloqueia mais por esta questão.

### Question

Confirmar Vitest também como runner do backend?

### Nota de reconciliação

Não constitui escolha de novo framework.

### Decision

[DEC-047](13-DECISIONS.md) — Vitest será o runner de testes do backend (alternativa A).

### Rationale

Aprovação expressa do usuário das recomendações analisadas, sem ampliação do escopo.

### Impact

Configuração futura do runner backend, respeitando NestJS, ESM/NodeNext e TypeScript. Não implementa Vitest nem escolhe ferramentas de frontend/E2E.

### Decision Date

2026-09-18

---

## TESTQ-012 — Isolamento e reset entre testes

**Status:** DECIDED
**Priority:** MEDIUM  
**Affected Documents:** [11-TESTING.md](11-TESTING.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md)  
**Affected Delivery:** Testing / CI / homologação  
**Blocks:** Decisão registrada; não bloqueia mais por esta questão.

### Question

Qual estratégia será utilizada entre testes: rollback de transação, truncate ou recriação?

### Decision

[DEC-048](13-DECISIONS.md) — Adotar estratégia híbrida de isolamento/reset dos testes de persistência (alternativa D).

- Banco exclusivo de testes por execução.
- Migrations reais para preparar o schema.
- Limpeza dos dados entre testes de integração quando apropriado.
- Transações reais da aplicação nas suites que validam persistência, RLS, pool, commit e rollback.
- Recriação do banco/schema quando a suite precisar validar migrations ou alterações estruturais.
- Rollback externo por teste somente quando não esconder o comportamento validado.
- Inicialmente, testes de integração que compartilham o mesmo banco executam serialmente.
- Operações destinadas a validar RLS utilizam a role runtime restrita.
- Credenciais de migration/preparação não podem mascarar testes de segurança.
- A infraestrutura impede explicitamente limpeza acidental de bancos que não sejam exclusivos de teste.
- SQLite não substitui PostgreSQL nos testes de comportamento específico do PostgreSQL.

### Rationale

Aprovação expressa do usuário das recomendações analisadas, sem ampliação do escopo.

### Impact

Infraestrutura futura de integração PostgreSQL, constraints compostas, RLS, transações e pool. Os dez cenários de isolamento/integridade derivados de DEC-045 e DEC-046 continuam obrigatórios; o requisito adicional de scope de Business Unit da DEC-046 também permanece preservado.

### Decision Date

2026-09-18

---

## TESTQ-013 — Frequência de E2E no CI

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [11-TESTING.md](11-TESTING.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md)  
**Affected Delivery:** Testing / CI / homologação  
**Blocks:** implementar a decisão «Frequência de E2E no CI» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Playwright será executado em todo PR, na main ou antes do deploy?

---

## TESTQ-014 — Object storage em testes

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [11-TESTING.md](11-TESTING.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md)  
**Affected Delivery:** Testing / CI / homologação  
**Blocks:** implementar a decisão «Object storage em testes» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Como object storage será representado em testes: MinIO, mock ou serviço real de teste?

---

## UXQ-001 — Qual terminologia oficial será exibida para ProcessingActivity: "Atividade de tratamento", "Atividade de tratamento de dados" ou outra?

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [25-UX-GUIDELINES.md](25-UX-GUIDELINES.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md)  
**Affected Delivery:** Frontend / UX  
**Blocks:** implementar a decisão «Qual terminologia oficial será exibida para ProcessingActivity: "Atividade de tratamento", "Atividade de tratamento de dados" ou outra?» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Qual terminologia oficial será exibida para ProcessingActivity: "Atividade de tratamento", "Atividade de tratamento de dados" ou outra?

---

## UXQ-002 — Wizard terá navegação livre entre etapas concluídas ou somente sequencial?

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [25-UX-GUIDELINES.md](25-UX-GUIDELINES.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md)  
**Affected Delivery:** Frontend / UX  
**Blocks:** implementar a decisão «Wizard terá navegação livre entre etapas concluídas ou somente sequencial?» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Wizard terá navegação livre entre etapas concluídas ou somente sequencial?

---

## UXQ-003 — A aplicação terá página dedicada de Notifications ou apenas dropdown no header na V1?

**Status:** OPEN  
**Priority:** LOW  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [25-UX-GUIDELINES.md](25-UX-GUIDELINES.md)  
**Affected Delivery:** Frontend / UX  
**Blocks:** implementar a decisão «A aplicação terá página dedicada de Notifications ou apenas dropdown no header na V1?» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

A aplicação terá página dedicada de Notifications ou apenas dropdown no header na V1?

---

## UXQ-004 — Quais ações destrutivas exigirão confirmação explícita?

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [25-UX-GUIDELINES.md](25-UX-GUIDELINES.md)  
**Affected Delivery:** Frontend / UX  
**Blocks:** implementar a decisão «Quais ações destrutivas exigirão confirmação explícita?» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Quais ações destrutivas exigirão confirmação explícita?

---

## UXQ-006 — A V1 exibirá percentual visual de progresso do Wizard?

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [25-UX-GUIDELINES.md](25-UX-GUIDELINES.md)  
**Affected Delivery:** Frontend / UX  
**Blocks:** implementar a decisão «A V1 exibirá percentual visual de progresso do Wizard?» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

A V1 exibirá percentual visual de progresso do Wizard?

---

## UXQ-007 — Qual será o comportamento visual para Activities ACTIVE que possuem uma revisão em andamento?

**Status:** OPEN  
**Priority:** HIGH  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [25-UX-GUIDELINES.md](25-UX-GUIDELINES.md)  
**Affected Delivery:** Frontend / UX  
**Blocks:** implementar a decisão «Qual será o comportamento visual para Activities ACTIVE que possuem uma revisão em andamento?» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Qual será o comportamento visual para Activities ACTIVE que possuem uma revisão em andamento?

---

## VALQ-001 — Strings opcionais vazias serão normalizadas para null?

**Status:** OPEN  
**Priority:** LOW  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [22-VALIDATION-RULES.md](22-VALIDATION-RULES.md)  
**Affected Delivery:** Validation Rules / API / formulários  
**Blocks:** implementar a decisão «Strings opcionais vazias serão normalizadas para null?» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Strings opcionais vazias serão normalizadas para null?

---

## VALQ-002 — Quais limites máximos serão adotados para name, description e justification?

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [22-VALIDATION-RULES.md](22-VALIDATION-RULES.md)  
**Affected Delivery:** Validation Rules / API / formulários  
**Blocks:** implementar a decisão «Quais limites máximos serão adotados para name, description e justification?» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Quais limites máximos serão adotados para name, description e justification?

---

## VALQ-004 — Qual tamanho máximo permitido por tipo de upload?

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [09-SECURITY.md](09-SECURITY.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [22-VALIDATION-RULES.md](22-VALIDATION-RULES.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md), [MAPPING-WIZARD.md](features/MAPPING-WIZARD.md)  
**Affected Delivery:** Validation Rules / API / formulários  
**Blocks:** implementar a decisão «Qual tamanho máximo permitido por tipo de upload?» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Qual tamanho máximo permitido por tipo de upload?

---

## WFQ-013 — Disparo de alertas/notificações de pendência

**Status:** OPEN  
**Priority:** LOW  
**Affected Documents:** [05-BUSINESS-RULES.md](05-BUSINESS-RULES.md), [06-WORKFLOWS.md](06-WORKFLOWS.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [13-DECISIONS.md](13-DECISIONS.md), [24-NOTIFICATIONS.md](24-NOTIFICATIONS.md), [28-PRE-IMPLEMENTATION-CHECKLIST.md](28-PRE-IMPLEMENTATION-CHECKLIST.md), [DASHBOARD.md](features/DASHBOARD.md), [SUPPLIERS.md](features/SUPPLIERS.md), [SYSTEMS.md](features/SYSTEMS.md)  
**Affected Delivery:** Workflow / revisão / ativação / versionamento  
**Blocks:** implementar a decisão «Prazo para alerta de pendência» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Quando a permanência em estado pendente deve disparar alerta/notificação? Qual política de disparo deve ser adotada, inclusive eventual prazo em dias?

Nenhum valor de dias está definido. Este registro não define a classificação de pendência antiga nem implica que o limiar de notificação seja igual ao de antiguidade.

### Dependencies

DASHQ-007 determina quando a contagem começa. DASHQ-008 centraliza a política de antiguidade. Regras de deduplicação e lembretes permanecem nos registros próprios de Notifications.

### Delimitação aprovada

DEC-033 separa a política de disparo de alertas/notificações da política de antiguidade.

---

## WFQ-014 — Cancelamento de draft

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [06-WORKFLOWS.md](06-WORKFLOWS.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [PROCESSING-ACTIVITY.md](features/PROCESSING-ACTIVITY.md)  
**Affected Delivery:** Workflow / revisão / ativação / versionamento  
**Blocks:** implementar a decisão «Cancelamento de draft» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

Um draft pode ser cancelado? É necessário estado CANCELLED ou soft delete é suficiente?

### Nota de reconciliação

Distinta da exclusão física de draft (WFQ-012) e do abandono de revisão (WFQ-010).

---

## WFQ-015 — Separação de versão publicada e draft

**Status:** OPEN  
**Priority:** HIGH  
**Affected Documents:** [10-AUDIT.md](10-AUDIT.md), [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [PROCESSING-ACTIVITY.md](features/PROCESSING-ACTIVITY.md)  
**Affected Delivery:** Workflow / revisão / ativação / versionamento  
**Blocks:** implementar a decisão «Separação de versão publicada e draft» descrita em Question, quando incluído na entrega; não bloqueia automaticamente a fundação técnica

### Question

É necessário separar explicitamente publishedVersion e draftVersion?

### Nota de reconciliação

Distinta do momento de criação da primeira versão (AUDQ-013).

---


# Aliases globais consolidados

Não possuem Status próprio nem contam como questão OPEN. Aliases com ID que também é canônico só podem existir no registro **por origem**, nunca nesta tabela global.

| Alias | ID canônico | Motivo |
|---|---|---|
| AUTHQ-001 | WFQ-003 | Responsável por revisão; mesma decisão de WFQ-003. |
| CATQ-003 | DQ-007 | Configuração de categorias de titulares por organização já é alternativa em DQ-007. |
| FEQ-011 | FEQ-007 | Nível de suporte mobile já registrado em FEQ-007. |
| PAQ-002 | DQ-009 | Responsável individual pela atividade; mesma decisão de DQ-009. |
| PRODQ-002 | AUTHQ-006 | Usuário em múltiplas organizações; conservar o contexto DPO as a Service. |
| SECQ-006 | DBQ-009 | Adoção de PostgreSQL RLS como defesa adicional; mesma decisão de DBQ-009. |
| SECQ-008 | VALQ-004 | Limites de tamanho de upload; manter a variação por tipo em VALQ-004. |
| SECQ-009 | SECQ-005 | Malware scanning na V1 já registrado em SECQ-005. |
| SECQ-010 | INFRAQ-002 | Escolha do object storage já registrada em INFRAQ-002. |
| SECQ-011 | AUDQ-001 | Retenção de AuditLog já registrada em AUDQ-001. |
| SECQ-012 | OBSQ-004 | Retenção de logs técnicos contemplada por OBSQ-004. |
| SECQ-013 | INFRAQ-007 | Política de backup já registrada em INFRAQ-007; RPO/RTO relacionados em INFRAQ-009/010. |
| SECQ-015 | AUDQ-005 | Política de auditoria de leitura; downloads continuam em AUDQ-007 como questão relacionada. |
| TESTQ-009 | APIQ-019 | Geração dos tipos de frontend por OpenAPI já registrada em APIQ-019. |
| UXQ-005 | MWQ-001 | Tratamento dos dados condicionais antigos já registrado em MWQ-001. |
| VALQ-003 | PAQ-006 | Lista de requisitos de submit já é parte explícita de PAQ-006; conservar a comparação com Gate. |
| SYSQ-008 | DASHQ-008 | Antiguidade de sistemas centralizada; limiares por recurso continuam abertos na questão canônica. |
| SUPQ-007 | DASHQ-008 | Antiguidade de fornecedores centralizada; limiares por recurso continuam abertos na questão canônica. |

# Migrações adicionais por origem

O significado canônico existente prevalece. A tabela interpreta somente a referência antiga no documento indicado; o ID antigo continua disponível com seu significado canônico quando houver colisão. IDs locais divididos apontam explicitamente às duas perguntas, sem fundi-las.

| Documento de origem | ID antigo | ID canônico/novo | Motivo |
|---|---|---|---|
| `docs/02-DOMAIN.md` | DQ-003 | DQ-004 | Colisão do catálogo local com o significado canônico; preservar a pergunta local como referência à decisão correspondente. |
| `docs/02-DOMAIN.md` | DQ-004 | DQ-005 | Colisão do catálogo local com o significado canônico; preservar a pergunta local como referência à decisão correspondente. |
| `docs/02-DOMAIN.md` | DQ-005 | DQ-006 | Colisão do catálogo local com o significado canônico; preservar a pergunta local como referência à decisão correspondente. |
| `docs/02-DOMAIN.md` | DQ-006 | DQ-011 | Colisão do catálogo local com o significado canônico; preservar a pergunta local como referência à decisão correspondente. |
| `docs/02-DOMAIN.md` | DQ-007 | DQ-008 | Colisão do catálogo local com o significado canônico; preservar a pergunta local como referência à decisão correspondente. |
| `docs/02-DOMAIN.md` | DQ-008 | DQ-009 / PAQ-003 | Colisão do catálogo local com o significado canônico; preservar a pergunta local como referência à decisão correspondente. |
| `docs/02-DOMAIN.md` | DQ-009 | AUTHQ-002 | Colisão do catálogo local com o significado canônico; preservar a pergunta local como referência à decisão correspondente. |
| `docs/04-AUTHORIZATION.md` | AUTHQ-001 | AUTHQ-002 | Colisão do catálogo local com o significado canônico; preservar a pergunta local como referência à decisão correspondente. |
| `docs/04-AUTHORIZATION.md` | AUTHQ-002 | AUTHQ-011 | Colisão do catálogo local com o significado canônico; preservar a pergunta local como referência à decisão correspondente. |
| `docs/04-AUTHORIZATION.md` | AUTHQ-003 | AUTHQ-002 | Colisão do catálogo local com o significado canônico; preservar a pergunta local como referência à decisão correspondente. |
| `docs/04-AUTHORIZATION.md` | AUTHQ-005 | AUTHQ-003 | Colisão do catálogo local com o significado canônico; preservar a pergunta local como referência à decisão correspondente. |
| `docs/04-AUTHORIZATION.md` | AUTHQ-009 | AUTHQ-012 | Colisão do catálogo local com o significado canônico; preservar a pergunta local como referência à decisão correspondente. |
| `docs/05-BUSINESS-RULES.md` | BRQ-001 | DQ-004 | Colisão do catálogo local com o significado canônico; preservar a pergunta local como referência à decisão correspondente. |
| `docs/05-BUSINESS-RULES.md` | BRQ-002 | DQ-002 | Colisão do catálogo local com o significado canônico; preservar a pergunta local como referência à decisão correspondente. |
| `docs/05-BUSINESS-RULES.md` | BRQ-003 | DQ-003 | Colisão do catálogo local com o significado canônico; preservar a pergunta local como referência à decisão correspondente. |
| `docs/05-BUSINESS-RULES.md` | BRQ-004 | DQ-005 | Colisão do catálogo local com o significado canônico; preservar a pergunta local como referência à decisão correspondente. |
| `docs/05-BUSINESS-RULES.md` | BRQ-005 | DQ-010 | Colisão do catálogo local com o significado canônico; preservar a pergunta local como referência à decisão correspondente. |
| `docs/05-BUSINESS-RULES.md` | BRQ-006 | AUTHQ-002 | Colisão do catálogo local com o significado canônico; preservar a pergunta local como referência à decisão correspondente. |
| `docs/05-BUSINESS-RULES.md` | BRQ-008 | WFQ-013 | Colisão do catálogo local com o significado canônico; preservar a pergunta local como referência à decisão correspondente. |
| `docs/05-BUSINESS-RULES.md` | BRQ-009 | BRQ-011 | Colisão do catálogo local com o significado canônico; preservar a pergunta local como referência à decisão correspondente. |
| `docs/05-BUSINESS-RULES.md` | BRQ-010 | DQ-011 | Colisão do catálogo local com o significado canônico; preservar a pergunta local como referência à decisão correspondente. |
| `docs/06-WORKFLOWS.md` | WFQ-006 | BRQ-007 | Colisão do catálogo local com o significado canônico; preservar a pergunta local como referência à decisão correspondente. |
| `docs/06-WORKFLOWS.md` | WFQ-009 | AUTHQ-013 | Colisão do catálogo local com o significado canônico; preservar a pergunta local como referência à decisão correspondente. |
| `docs/06-WORKFLOWS.md` | WFQ-010 | WFQ-011 | Colisão do catálogo local com o significado canônico; preservar a pergunta local como referência à decisão correspondente. |
| `docs/06-WORKFLOWS.md` | WFQ-011 | WFQ-009 | Colisão do catálogo local com o significado canônico; preservar a pergunta local como referência à decisão correspondente. |
| `docs/06-WORKFLOWS.md` | WFQ-012 | WFQ-014 | Colisão do catálogo local com o significado canônico; preservar a pergunta local como referência à decisão correspondente. |
| `docs/07-API.md` | APIQ-001 | SECQ-001 | Colisão do catálogo local com o significado canônico; preservar a pergunta local como referência à decisão correspondente. |
| `docs/07-API.md` | APIQ-002 | APIQ-020 | Colisão do catálogo local com o significado canônico; preservar a pergunta local como referência à decisão correspondente. |
| `docs/07-API.md` | APIQ-003 | APIQ-021 | Colisão do catálogo local com o significado canônico; preservar a pergunta local como referência à decisão correspondente. |
| `docs/07-API.md` | APIQ-005 | APIQ-007 | Colisão do catálogo local com o significado canônico; preservar a pergunta local como referência à decisão correspondente. |
| `docs/07-API.md` | APIQ-007 | APIQ-019 | Colisão do catálogo local com o significado canônico; preservar a pergunta local como referência à decisão correspondente. |
| `docs/07-API.md` | APIQ-008 | DQ-004 | Colisão do catálogo local com o significado canônico; preservar a pergunta local como referência à decisão correspondente. |
| `docs/07-API.md` | APIQ-009 | DQ-002 | Colisão do catálogo local com o significado canônico; preservar a pergunta local como referência à decisão correspondente. |
| `docs/08-FRONTEND.md` | FEQ-002 | FEQ-013 | Colisão do catálogo local com o significado canônico; preservar a pergunta local como referência à decisão correspondente. |
| `docs/08-FRONTEND.md` | FEQ-004 | APIQ-021 | Colisão do catálogo local com o significado canônico; preservar a pergunta local como referência à decisão correspondente. |
| `docs/08-FRONTEND.md` | FEQ-005 | APIQ-016 | Colisão do catálogo local com o significado canônico; preservar a pergunta local como referência à decisão correspondente. |
| `docs/08-FRONTEND.md` | FEQ-006 | FEQ-014 | Colisão do catálogo local com o significado canônico; preservar a pergunta local como referência à decisão correspondente. |
| `docs/08-FRONTEND.md` | FEQ-007 | AUDQ-009 | Colisão do catálogo local com o significado canônico; preservar a pergunta local como referência à decisão correspondente. |
| `docs/08-FRONTEND.md` | FEQ-008 | FEQ-015 | Colisão do catálogo local com o significado canônico; preservar a pergunta local como referência à decisão correspondente. |
| `docs/08-FRONTEND.md` | FEQ-009 | APIQ-007 | Colisão do catálogo local com o significado canônico; preservar a pergunta local como referência à decisão correspondente. |
| `docs/09-SECURITY.md` | SECQ-002 | SECQ-001 | Colisão do catálogo local com o significado canônico; preservar a pergunta local como referência à decisão correspondente. |
| `docs/09-SECURITY.md` | SECQ-004 | SECQ-002 | Colisão do catálogo local com o significado canônico; preservar a pergunta local como referência à decisão correspondente. |
| `docs/09-SECURITY.md` | SECQ-005 | AUTHQ-006 | Colisão do catálogo local com o significado canônico; preservar a pergunta local como referência à decisão correspondente. |
| `docs/09-SECURITY.md` | SECQ-006 | AUTHQ-009 / SECQ-018 | Colisão do catálogo local com o significado canônico; preservar a pergunta local como referência à decisão correspondente. |
| `docs/10-AUDIT.md` | AUDQ-002 | AUDQ-016 | Colisão do catálogo local com o significado canônico; preservar a pergunta local como referência à decisão correspondente. |
| `docs/10-AUDIT.md` | AUDQ-003 | AUTHQ-014 | Colisão do catálogo local com o significado canônico; preservar a pergunta local como referência à decisão correspondente. |
| `docs/10-AUDIT.md` | AUDQ-004 | AUTHQ-014 | Colisão do catálogo local com o significado canônico; preservar a pergunta local como referência à decisão correspondente. |
| `docs/10-AUDIT.md` | AUDQ-005 | AUDQ-007 | Colisão do catálogo local com o significado canônico; preservar a pergunta local como referência à decisão correspondente. |
| `docs/10-AUDIT.md` | AUDQ-007 | AUDQ-003 | Colisão do catálogo local com o significado canônico; preservar a pergunta local como referência à decisão correspondente. |
| `docs/10-AUDIT.md` | AUDQ-008 | AUDQ-004 | Colisão do catálogo local com o significado canônico; preservar a pergunta local como referência à decisão correspondente. |
| `docs/10-AUDIT.md` | AUDQ-009 | AUDQ-017 | Colisão do catálogo local com o significado canônico; preservar a pergunta local como referência à decisão correspondente. |
| `docs/10-AUDIT.md` | AUDQ-010 | AUDQ-018 | Colisão do catálogo local com o significado canônico; preservar a pergunta local como referência à decisão correspondente. |
| `docs/10-AUDIT.md` | AUDQ-011 | DBQ-003 | Colisão do catálogo local com o significado canônico; preservar a pergunta local como referência à decisão correspondente. |
| `docs/10-AUDIT.md` | AUDQ-012 | AUDQ-013 | Colisão do catálogo local com o significado canônico; preservar a pergunta local como referência à decisão correspondente. |
| `docs/10-AUDIT.md` | AUDQ-013 | WFQ-015 | Colisão do catálogo local com o significado canônico; preservar a pergunta local como referência à decisão correspondente. |
| `docs/11-TESTING.md` | TESTQ-001 | TESTQ-011 | Colisão do catálogo local com o significado canônico; preservar a pergunta local como referência à decisão correspondente. |
| `docs/11-TESTING.md` | TESTQ-002 | TESTQ-001 | Colisão do catálogo local com o significado canônico; preservar a pergunta local como referência à decisão correspondente. |
| `docs/11-TESTING.md` | TESTQ-003 | TESTQ-012 | Colisão do catálogo local com o significado canônico; preservar a pergunta local como referência à decisão correspondente. |
| `docs/11-TESTING.md` | TESTQ-004 | TESTQ-013 | Colisão do catálogo local com o significado canônico; preservar a pergunta local como referência à decisão correspondente. |
| `docs/11-TESTING.md` | TESTQ-005 | TESTQ-004 | Colisão do catálogo local com o significado canônico; preservar a pergunta local como referência à decisão correspondente. |
| `docs/11-TESTING.md` | TESTQ-006 | TESTQ-003 | Colisão do catálogo local com o significado canônico; preservar a pergunta local como referência à decisão correspondente. |
| `docs/11-TESTING.md` | TESTQ-007 | TESTQ-014 | Colisão do catálogo local com o significado canônico; preservar a pergunta local como referência à decisão correspondente. |

## Referências incorretas corrigidas

Linhas referem-se à documentação anterior à reconciliação. Cada linha é uma ocorrência; migrações dos catálogos locais e aliases globais são contabilizados separadamente.

| Origem histórica | ID antigo | ID canônico/novo | Motivo |
|---|---|---|---|
| `docs/17-ENVIRONMENTS-AND-DEPLOYMENT.md`, linha 2483 | AUDQ-010 | INFRAQ-013 | Corrigir referência pelo assunto explícito da seção; o significado central prevalece. |
| `docs/18-OBSERVABILITY.md`, linha 1306 | AUDQ-009 | AUDQ-001 | Corrigir referência pelo assunto explícito da seção; o significado central prevalece. |
| `docs/features/AUTH.md`, linha 541 | SECQ-004 | SECQ-002 | Corrigir referência pelo assunto explícito da seção; o significado central prevalece. |
| `docs/features/AUTH.md`, linha 1587 | AUTHQ-005 | AUTHQ-003 | Corrigir referência pelo assunto explícito da seção; o significado central prevalece. |
| `docs/features/AUTH.md`, linha 1599 | SECQ-002 | SECQ-001 | Corrigir referência pelo assunto explícito da seção; o significado central prevalece. |
| `docs/features/AUTH.md`, linha 1603 | SECQ-004 | SECQ-002 | Corrigir referência pelo assunto explícito da seção; o significado central prevalece. |
| `docs/features/AUTH.md`, linha 1605 | APIQ-002 | APIQ-020 | Corrigir referência pelo assunto explícito da seção; o significado central prevalece. |
| `docs/features/AUTH.md`, linha 1619 | SECQ-004 | SECQ-002 | Corrigir referência pelo assunto explícito da seção; o significado central prevalece. |
| `docs/features/AUTH.md`, linha 1631 | SECQ-002 | SECQ-001 | Corrigir referência pelo assunto explícito da seção; o significado central prevalece. |
| `docs/features/AUTH.md`, seção 21, Microsoft Entra ID | SECQ-002 | SECQ-001 | Referência residual corrigida no lote Identity/Tenant: escolha de provedor é SECQ-001; SECQ-002 continua sendo sessão. |
| `docs/features/COMPLIANCE-GATE.md`, linha 3000 | BRQ-006 | AUTHQ-002 | Corrigir referência pelo assunto explícito da seção; o significado central prevalece. |
| `docs/features/MAPPING-WIZARD.md`, linha 1032 | APIQ-005 | APIQ-007 | Corrigir referência pelo assunto explícito da seção; o significado central prevalece. |
| `docs/features/MAPPING-WIZARD.md`, linha 2812 | DQ-007 | DQ-011 | Corrigir referência pelo assunto explícito da seção; o significado central prevalece. |
| `docs/features/MAPPING-WIZARD.md`, linha 2820 | APIQ-003 | APIQ-021 | Corrigir referência pelo assunto explícito da seção; o significado central prevalece. |
| `docs/features/MAPPING-WIZARD.md`, linha 2824 | APIQ-005 | APIQ-007 | Corrigir referência pelo assunto explícito da seção; o significado central prevalece. |
| `docs/features/MAPPING-WIZARD.md`, linha 2828 | FEQ-004 | APIQ-016 | Corrigir referência pelo assunto explícito da seção; o significado central prevalece. |
| `docs/features/PROCESSING-ACTIVITY.md`, linha 1302 | DQ-007 | DQ-011 | Corrigir referência pelo assunto explícito da seção; o significado central prevalece. |
| `docs/features/PROCESSING-ACTIVITY.md`, linha 1554 | AUDQ-012 | WFQ-015 | Corrigir referência pelo assunto explícito da seção; o significado central prevalece. |
| `docs/features/PROCESSING-ACTIVITY.md`, linha 1692 | FEQ-004 | APIQ-016 | Corrigir referência pelo assunto explícito da seção; o significado central prevalece. |
| `docs/features/PROCESSING-ACTIVITY.md`, linha 2646 | DQ-007 | DQ-011 | Corrigir referência pelo assunto explícito da seção; o significado central prevalece. |
| `docs/features/PROCESSING-ACTIVITY.md`, linha 2652 | AUTHQ-001 | AUTHQ-002 | Corrigir referência pelo assunto explícito da seção; o significado central prevalece. |
| `docs/features/PROCESSING-ACTIVITY.md`, linha 2668 | WFQ-009 | AUTHQ-013 | Corrigir referência pelo assunto explícito da seção; o significado central prevalece. |
| `docs/features/PROCESSING-ACTIVITY.md`, linha 2670 | WFQ-010 | WFQ-011 | Corrigir referência pelo assunto explícito da seção; o significado central prevalece. |
| `docs/features/PROCESSING-ACTIVITY.md`, linha 2672 | WFQ-011 | WFQ-009 | Corrigir referência pelo assunto explícito da seção; o significado central prevalece. |
| `docs/features/PROCESSING-ACTIVITY.md`, linha 2674 | WFQ-012 | WFQ-014 | Corrigir referência pelo assunto explícito da seção; o significado central prevalece. |
| `docs/features/PROCESSING-ACTIVITY.md`, linha 2678 | FEQ-004 | APIQ-016 | Corrigir referência pelo assunto explícito da seção; o significado central prevalece. |
| `docs/features/COMPLIANCE-GATE.md`, linha seção 176 | AUTHQ-001 | AUTHQ-002 / WFQ-003 | Corrigir referência pelo assunto explícito da seção; o significado central prevalece. |

# Encerramento do saneamento por decisões do usuário

Em 2026-09-18, o usuário confirmou:

- PRODQ-003 passa a tratar somente branding; domínio próprio foi desmembrado em PRODQ-004. Ambas permanecem OPEN, sem inclusão na V1 (DEC-032).
- DASHQ-008 centraliza antiguidade e a pergunta sobre limiares diferentes por recurso. SYSQ-008 e SUPQ-007 viram aliases, sem Status próprio. WFQ-013 trata exclusivamente disparo de alertas/notificações, preservando DASHQ-007 como dependência temporal (DEC-033).
- DQ-011 passa a DECIDED por cobertura integral da V1 pela DEC-026, cujo texto não foi alterado.
- BRQ-011 passa a DECIDED pela DEC-031, exclusivamente sobre controle interno na V1. DEC-011 trata do estado de mapeamento e não responde ao bloqueio externo. SYSQ-007 e SUPQ-006 permanecem OPEN.
- PAQ-006 passa de HIGH a CRITICAL. VALQ-003 continua alias, sem segunda questão.

Diferenças históricas de prioridade dos espelhos anteriores ao saneamento são rastreabilidade, não prioridades concorrentes vigentes. Os registros centrais e seus espelhos explícitos usam os valores atuais. Templates XXXQ-001 são exemplos e não entram nas contagens.

### Migração de escopo por origem

| Origem histórica | Referência antiga | Referências atuais | Motivo |
|---|---|---|---|
| features/ORGANIZATIONS.md, seção White Label | PRODQ-003 para logo, cores e customDomain | PRODQ-003 (branding) / PRODQ-004 (domínio) | Separação aprovada em DEC-032; sem inclusão na V1. |


# Questão desmembrada por decisão do usuário

## PRODQ-004 — Domínio próprio por organização

**Status:** OPEN  
**Priority:** MEDIUM  
**Affected Documents:** [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), [13-DECISIONS.md](13-DECISIONS.md), [ORGANIZATIONS.md](features/ORGANIZATIONS.md)  
**Affected Delivery:** Produto / Organizations / Authentication / Deployment  
**Blocks:** implementar suporte a domínio próprio, quando incluído em uma entrega

### Question

O produto oferecerá domínio próprio por organização? Qual é o escopo e em qual entrega será considerado?

### Delimitação aprovada

DEC-032 separa esta questão de PRODQ-003 (logo e cores). Nenhuma capacidade foi incluída na V1. MEDIUM preserva a prioridade de triagem do registro de origem; não constitui inclusão funcional.

### Source

Desmembramento do antigo PRODQ-003, White Label em features/ORGANIZATIONS.md, autorizado em 2026-09-18.

---


# Aprovação de Foundation → Identity/Tenant — 2026-09-18

DEC-034 a DEC-043 registram o lote aprovado. PRODQ-001, AUTHQ-005/006/007/008/010, SECQ-002 e APIQ-020 passam a DECIDED. APIQ-002 também passa a DECIDED por cobertura integral do transporte explicitamente aprovado em DEC-042; não há segunda decisão.

AUTHQ-004 permanece IN_ANALYSIS apenas para a política de leitura dos recursos fora da primeira entrega; a matriz de Activities/ROPA dessa entrega está decidida em DEC-039. SECQ-001 permanece IN_ANALYSIS apenas para o fornecedor gerenciado; o mecanismo OIDC está decidido em DEC-040. Prioridades e aliases foram preservados.

Listas históricas de bloqueios devem filtrar Status e Remaining Question: referências a IDs decididos são rastreabilidade, não bloqueios ainda abertos. OWN, PLATFORM, ADMIN e PLATFORM_ADMIN não foram aprovados. Nenhuma decisão deste lote aprova edição, Submit, Gate, aprovação ou publicação.


# Aprovação da persistência de Identity/Tenant — 2026-09-18

DBQ-001, DBQ-008 e DBQ-009 passam a DECIDED por DEC-044, DEC-045 e DEC-046. Prioridades, IDs e aliases permanecem preservados. Nenhuma outra questão é encerrada por este lote. Desenho de proteção de entidades globais e descoberta restrita dos próprios Memberships permanece pendente antes dos caminhos correspondentes; não é autorização para policies irrestritas.
