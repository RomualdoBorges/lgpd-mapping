# Product Backlog

> **Documento:** Backlog Técnico e Funcional  
> **Status:** Draft  
> **Objetivo:** transformar o plano de implementação em itens pequenos, rastreáveis e executáveis por desenvolvedores ou agentes de IA.


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

Este documento organiza o desenvolvimento em:

```text
Epic
↓
Story
↓
Task
```

Cada item deve possuir contexto suficiente para ser implementado sem exigir que o agente interprete sozinho decisões estruturais do produto.

---

# 2. Documentos obrigatórios

Antes de executar qualquer item:

```text
AGENTS.md

docs/00-PROJECT.md

docs/12-OPEN-QUESTIONS.md

docs/13-DECISIONS.md

docs/14-IMPLEMENTATION-PLAN.md
```

Além dos documentos específicos indicados no próprio item.

---

# 3. Status

Utilizar:

```text
BACKLOG

BLOCKED

READY

IN_PROGRESS

IN_REVIEW

DONE

CANCELLED
```

---

# 4. Prioridade

Utilizar:

```text
P0 — Critical

P1 — High

P2 — Medium

P3 — Low
```

---

# 5. Regra para READY

Um item só pode assumir:

```text
READY
```

quando:

```text
[ ] dependências concluídas

[ ] decisões CRITICAL necessárias resolvidas

[ ] acceptance criteria definidos

[ ] documentação relacionada disponível

[ ] comportamento esperado suficientemente definido
```

---

# 6. Regra para BLOCKED

Usar:

```text
BLOCKED
```

quando uma Open Question impedir implementação correta.

Exemplo:

```text
Blocked By:

SECQ-001
SECQ-002
```

---

# 7. Identificadores

Epics:

```text
EPIC-00
EPIC-01
...
```

Stories:

```text
STORY-001
STORY-002
...
```

Tasks:

```text
TASK-001
TASK-002
...
```

Os IDs são permanentes.

---

# 8. Estrutura de Story

```markdown
## STORY-XXX — Nome

**Epic:** EPIC-XX  
**Priority:** P1  
**Status:** BACKLOG

### Objective

...

### Dependencies

...

### Blocked By

...

### Related Docs

...

### Acceptance Criteria

- [ ] ...

### Tests

- [ ] ...
```

---

# 9. Visão geral

```text
EPIC-00 — Foundation

EPIC-01 — Authentication

EPIC-02 — Organizations & Authorization

EPIC-03 — Processing Activities

EPIC-04 — Mapping Wizard

EPIC-05 — Systems

EPIC-06 — Suppliers

EPIC-07 — Compliance Gate

EPIC-08 — Versioning & Audit

EPIC-09 — ROPA

EPIC-10 — Dashboard

EPIC-11 — Security & Hardening

EPIC-12 — Release
```

---

# EPIC-00 — FOUNDATION

# 10. Objetivo

Criar fundação técnica necessária para os módulos do produto.

---

## STORY-001 — Inicializar Frontend

**Epic:** EPIC-00  
**Priority:** P0  
**Status:** BACKLOG

### Objective

Criar aplicação frontend base.

### Stack

```text
React
TypeScript
Vite
Tailwind CSS
```

### Related Docs

```text
01-ARCHITECTURE.md
08-FRONTEND.md
14-IMPLEMENTATION-PLAN.md
```

### Acceptance Criteria

```text
[ ] aplicação executa localmente

[ ] TypeScript configurado

[ ] Vite configurado

[ ] Tailwind configurado

[ ] estrutura feature-first preparada

[ ] lint funciona

[ ] typecheck funciona

[ ] build funciona
```

---

## STORY-002 — Inicializar Backend

**Epic:** EPIC-00  
**Priority:** P0  
**Status:** BACKLOG

### Objective

Criar aplicação backend base.

### Stack

```text
NestJS
TypeScript
```

### Related Docs

```text
01-ARCHITECTURE.md
07-API.md
14-IMPLEMENTATION-PLAN.md
```

### Acceptance Criteria

```text
[ ] aplicação executa

[ ] estrutura modular preparada

[ ] configuration module criado

[ ] validation pipeline criado

[ ] global error handling criado

[ ] logging base criado

[ ] lint funciona

[ ] typecheck funciona

[ ] build funciona
```

---

## STORY-003 — Configurar PostgreSQL

**Epic:** EPIC-00  
**Priority:** P0  
**Status:** BLOCKED

### Blocked By

```text
DBQ-001
```

### Objective

Configurar banco PostgreSQL e ORM aprovado.

### Acceptance Criteria

```text
[ ] PostgreSQL local disponível

[ ] ORM configurado

[ ] migrations funcionando

[ ] migration inicial criada

[ ] seed mechanism criado

[ ] test database suportado
```

---

## STORY-004 — Configurar Docker Local

**Epic:** EPIC-00  
**Priority:** P1  
**Status:** BACKLOG

### Acceptance Criteria

```text
[ ] PostgreSQL executa via Docker

[ ] configuração local documentada

[ ] volumes configurados

[ ] healthcheck do banco configurado

[ ] secrets locais fora do Git
```

---

## STORY-005 — Implementar Health Check

**Epic:** EPIC-00  
**Priority:** P1  
**Status:** BACKLOG

### API

```http
GET /health
```

### Acceptance Criteria

```text
[ ] endpoint responde

[ ] não exige autenticação

[ ] não expõe informações sensíveis

[ ] pode ser utilizado por infraestrutura
```

---

## STORY-006 — Padronizar API Errors

**Epic:** EPIC-00  
**Priority:** P1  
**Status:** BACKLOG

### Acceptance Criteria

Formato consistente semelhante a:

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Resource not found"
  }
}
```

```text
[ ] error codes estáveis

[ ] validation errors estruturados

[ ] stack trace não exposto

[ ] SQL não exposto

[ ] detalhes internos não expostos
```

---

## STORY-007 — Configurar Test Infrastructure

**Epic:** EPIC-00  
**Priority:** P0  
**Status:** BACKLOG

### Related Docs

```text
11-TESTING.md
```

### Acceptance Criteria

```text
[ ] unit tests configurados

[ ] backend integration tests preparados

[ ] frontend component tests preparados

[ ] E2E preparado

[ ] comandos documentados
```

---

## STORY-008 — Configurar CI

**Epic:** EPIC-00  
**Priority:** P1  
**Status:** BACKLOG

### Pipeline mínimo

```text
install
↓
lint
↓
typecheck
↓
test
↓
build
```

### Acceptance Criteria

```text
[ ] pipeline executa automaticamente

[ ] falha de lint bloqueia pipeline

[ ] falha de typecheck bloqueia pipeline

[ ] falha de teste bloqueia pipeline

[ ] falha de build bloqueia pipeline
```

---

# EPIC-01 — AUTHENTICATION

## STORY-009 — Implementar Authentication Provider

**Epic:** EPIC-01  
**Priority:** P0  
**Status:** BLOCKED

### Blocked By

```text
SECQ-001
SECQ-002
AUTHQ-010
```

### Related Docs

```text
09-SECURITY.md
features/AUTH.md
```

### Objective

Implementar mecanismo de autenticação aprovado.

### Acceptance Criteria

```text
[ ] login funciona

[ ] sessão é criada com segurança

[ ] logout funciona

[ ] sessão inválida é rejeitada

[ ] usuário desativado não autentica

[ ] secrets protegidos
```

---

## STORY-010 — Criar Authenticated Context

**Epic:** EPIC-01  
**Priority:** P0  
**Status:** BLOCKED

### Dependencies

```text
STORY-009
```

### Blocked By

```text
AUTHQ-005
AUTHQ-006
AUTHQ-007
AUTHQ-008
```

### Objective

Disponibilizar ao backend contexto confiável semelhante a:

```ts
{
  userId,
  organizationId,
  roles,
  businessUnitIds
}
```

### Acceptance Criteria

```text
[ ] userId vem da sessão

[ ] organizationId não vem do body como autoridade

[ ] roles são carregados no backend

[ ] Business Unit scope é carregado

[ ] contexto não pode ser falsificado pelo cliente
```

---

## STORY-011 — Implementar `/me`

**Epic:** EPIC-01  
**Priority:** P1  
**Status:** BLOCKED

### Dependencies

```text
STORY-010
```

### API

```http
GET /api/v1/me
```

### Acceptance Criteria

```text
[ ] retorna usuário autenticado

[ ] retorna contexto de Organization

[ ] retorna roles

[ ] retorna permissions necessárias

[ ] retorna Business Units acessíveis quando aplicável

[ ] não expõe dados internos desnecessários
```

---

## STORY-012 — Implementar Logout

**Epic:** EPIC-01  
**Priority:** P1  
**Status:** BLOCKED

### Dependencies

```text
STORY-009
```

### Acceptance Criteria

```text
[ ] sessão é invalidada

[ ] frontend limpa estado autenticado

[ ] queries privadas são removidas/invalidadas

[ ] rota protegida não permanece acessível
```

---

# EPIC-02 — ORGANIZATIONS & AUTHORIZATION

## STORY-013 — Criar Organization

**Epic:** EPIC-02  
**Priority:** P0  
**Status:** BLOCKED

### Blocked By

```text
PRODQ-001
```

### Related Docs

```text
features/ORGANIZATIONS.md
04-AUTHORIZATION.md
```

### Acceptance Criteria

```text
[ ] Organization representa tenant

[ ] possui UUID

[ ] possui status

[ ] timestamps armazenados

[ ] comportamento de criação segue decisão de onboarding
```

---

## STORY-014 — Criar Business Units

**Epic:** EPIC-02  
**Priority:** P0  
**Status:** BACKLOG

### Dependencies

```text
STORY-013
```

### Blocked By

```text
DQ-008
```

somente se hierarquia fizer parte da implementação inicial.

### Acceptance Criteria

```text
[ ] Business Unit pertence a Organization

[ ] cross-tenant association impossível

[ ] status suportado

[ ] histórico preservado quando inativada
```

---

## STORY-015 — Implementar Organization Membership

**Epic:** EPIC-02  
**Priority:** P0  
**Status:** BLOCKED

### Blocked By

```text
AUTHQ-005
AUTHQ-006
AUTHQ-007
```

### Acceptance Criteria

```text
[ ] membership relaciona User e Organization

[ ] roles seguem decisão aprovada

[ ] membership inativa remove acesso

[ ] histórico não é destruído
```

---

## STORY-016 — Implementar Business Unit Scope

**Epic:** EPIC-02  
**Priority:** P0  
**Status:** BLOCKED

### Blocked By

```text
AUTHQ-008
```

### Acceptance Criteria

```text
[ ] scope calculado no backend

[ ] usuário não pode ampliar scope via request

[ ] queries respeitam scope

[ ] cross-BU tests implementados
```

---

## STORY-017 — Implementar Permission System

**Epic:** EPIC-02  
**Priority:** P0  
**Status:** BLOCKED

### Dependencies

```text
STORY-015
```

### Blocked By

```text
AUTHQ-003
AUTHQ-004
```

### Objective

Implementar autorização baseada em:

```text
Permission
+
Scope
```

### Acceptance Criteria

```text
[ ] deny by default

[ ] backend é autoridade

[ ] permissions semânticas

[ ] OWN/BU/ORG conforme decisão

[ ] frontend não é mecanismo de segurança
```

---

## STORY-018 — Implementar Tenant Isolation Base

**Epic:** EPIC-02  
**Priority:** P0  
**Status:** BACKLOG

### Related Decisions

```text
DEC-018
DEC-019
```

### Acceptance Criteria

```text
[ ] organizationId derivado do contexto

[ ] repository queries tenant-scoped

[ ] cross-tenant resource retorna comportamento seguro

[ ] joins não vazam dados

[ ] testes Organization A vs Organization B
```

---

# EPIC-03 — PROCESSING ACTIVITIES

## STORY-019 — Criar Processing Activity Draft

**Epic:** EPIC-03  
**Priority:** P0  
**Status:** BACKLOG

### Dependencies

```text
STORY-018
```

### Related Docs

```text
features/PROCESSING-ACTIVITY.md
```

### API

```http
POST /api/v1/processing-activities
```

### Acceptance Criteria

```text
[ ] cria Activity como DRAFT

[ ] draft pode estar incompleto

[ ] organizationId vem do AuthenticatedContext

[ ] Business Unit pertence ao mesmo tenant

[ ] cliente não define status arbitrariamente

[ ] cliente não define complianceStatus

[ ] createdBy vem do contexto

[ ] audit quando aplicável
```

---

## STORY-020 — Listar Processing Activities

**Epic:** EPIC-03  
**Priority:** P0  
**Status:** BACKLOG

### API

```http
GET /api/v1/processing-activities
```

### Acceptance Criteria

```text
[ ] paginação server-side

[ ] search

[ ] filtro por status

[ ] filtro por Business Unit

[ ] authorization scope

[ ] tenant isolation
```

---

## STORY-021 — Visualizar Processing Activity

**Epic:** EPIC-03  
**Priority:** P0  
**Status:** BACKLOG

### API

```http
GET /api/v1/processing-activities/:id
```

### Acceptance Criteria

```text
[ ] retorna Activity autorizada

[ ] retorna subresources necessários

[ ] cross-tenant ID não vaza existência

[ ] allowedActions pode ser retornado se estratégia aprovada
```

---

## STORY-022 — Editar Draft

**Epic:** EPIC-03  
**Priority:** P0  
**Status:** BACKLOG

### API

```http
PATCH /api/v1/processing-activities/:id
```

### Acceptance Criteria

```text
[ ] somente campos permitidos

[ ] status protegido

[ ] complianceStatus protegido

[ ] organizationId protegido

[ ] validation aplicada

[ ] concurrency tratada conforme APIQ-004
```

---

## STORY-023 — Implementar Purposes

**Epic:** EPIC-03  
**Priority:** P0  
**Status:** BLOCKED

### Blocked By

```text
DQ-004
```

### Acceptance Criteria

```text
[ ] cardinalidade segue decisão

[ ] tenant isolation

[ ] Activity association validada

[ ] API definida

[ ] testes implementados
```

---

## STORY-024 — Implementar Personal Data Mapping

**Epic:** EPIC-03  
**Priority:** P0  
**Status:** BLOCKED

### Blocked By

```text
DQ-001
```

### Acceptance Criteria

```text
[ ] categorias suportadas

[ ] itens suportados se aprovados

[ ] sensitive flag derivada do catálogo

[ ] nenhum dado real de titular armazenado
```

---

## STORY-025 — Implementar Data Subject Categories

**Epic:** EPIC-03  
**Priority:** P0  
**Status:** BACKLOG

### Acceptance Criteria

```text
[ ] múltiplas categorias quando permitido

[ ] menores identificáveis

[ ] menores não tratados como irregularidade automática

[ ] tenant/catalog strategy respeitada
```

---

## STORY-026 — Implementar Collection Sources

**Epic:** EPIC-03  
**Priority:** P0  
**Status:** BLOCKED

### Blocked By

```text
MWQ-004
```

### Acceptance Criteria

```text
[ ] documento suportado

[ ] fonte não documental suportada

[ ] coleta direta do titular representável

[ ] System associável quando aplicável

[ ] múltiplas fontes conforme decisão
```

---

## STORY-027 — Implementar Processing Operations

**Epic:** EPIC-03  
**Priority:** P0  
**Status:** BACKLOG

### Codes

```text
USE
UPDATE
INTERNAL_TRANSFER
EXTERNAL_TRANSFER
INTERNATIONAL_TRANSFER
DELETE
```

### Acceptance Criteria

```text
[ ] códigos estáveis

[ ] labels não são identificadores

[ ] contexto da operação persistido

[ ] tenant isolation aplicada
```

---

## STORY-028 — Implementar Recipients

**Epic:** EPIC-03  
**Priority:** P1  
**Status:** BACKLOG

### Acceptance Criteria

```text
[ ] recipients relacionáveis à Activity

[ ] tipos suportados conforme domínio

[ ] Supplier associável quando aplicável

[ ] tenant isolation
```

---

## STORY-029 — Implementar International Transfers

**Epic:** EPIC-03  
**Priority:** P0  
**Status:** BACKLOG

### Related Decision

```text
DEC-025
```

### Acceptance Criteria

```text
[ ] transferência explicitamente registrada

[ ] destination country suportado

[ ] não inferida por Supplier/System

[ ] mecanismo registrável quando definido

[ ] não escolher mecanismo jurídico automaticamente
```

---

## STORY-030 — Implementar Retention

**Epic:** EPIC-03  
**Priority:** P0  
**Status:** BLOCKED

### Blocked By

```text
DQ-005
MWQ-005
```

### Acceptance Criteria

```text
[ ] duration

[ ] unit

[ ] startEvent

[ ] granularidade conforme decisão

[ ] backend não decide prazo juridicamente correto
```

---

## STORY-031 — Implementar Security Measures

**Epic:** EPIC-03  
**Priority:** P0  
**Status:** BLOCKED

### Blocked By

```text
DQ-006
```

### Acceptance Criteria

```text
[ ] medidas registráveis

[ ] catálogo/texto segue decisão

[ ] presença não significa certificação de adequação
```

---

## STORY-032 — Implementar Legal Basis

**Epic:** EPIC-03  
**Priority:** P0  
**Status:** BLOCKED

### Blocked By

```text
DQ-002
DQ-003
```

### Acceptance Criteria

```text
[ ] cardinalidade correta

[ ] associação correta

[ ] legitimate interest suporta justification

[ ] consentimento suporta documento

[ ] backend não escolhe base legal automaticamente
```

---

# EPIC-04 — MAPPING WIZARD

## STORY-033 — Criar Wizard Shell

**Epic:** EPIC-04  
**Priority:** P0  
**Status:** BACKLOG

### Related Docs

```text
features/MAPPING-WIZARD.md
```

### Acceptance Criteria

```text
[ ] navegação entre etapas

[ ] Back

[ ] Save

[ ] Save and Continue

[ ] indicador de progresso

[ ] estados loading/error

[ ] Activity persistida é fonte dos dados
```

---

## STORY-034 — Implementar Resume Wizard

**Epic:** EPIC-04  
**Priority:** P1  
**Status:** BLOCKED

### Blocked By

```text
MWQ-002
MWQ-003
```

### Acceptance Criteria

```text
[ ] usuário pode sair

[ ] usuário pode retornar

[ ] etapa correta é restaurada

[ ] progresso segue regra aprovada
```

---

## STORY-035 — Implementar Conditional Steps

**Epic:** EPIC-04  
**Priority:** P0  
**Status:** BLOCKED

### Blocked By

```text
MWQ-001
```

### Acceptance Criteria

```text
[ ] campos condicionais aparecem corretamente

[ ] ocultar etapa não destrói dados silenciosamente

[ ] política aprovada para dados antigos aplicada
```

---

## STORY-036 — Implementar Wizard Validation

**Epic:** EPIC-04  
**Priority:** P0  
**Status:** BLOCKED

### Blocked By

```text
PAQ-006
```

### Acceptance Criteria

```text
[ ] field validation

[ ] step validation

[ ] save validation

[ ] submit validation

[ ] compliance validation permanece separada
```

---

## STORY-037 — Implementar Review Step

**Epic:** EPIC-04  
**Priority:** P0  
**Status:** BACKLOG

### Acceptance Criteria

```text
[ ] resumo por seção

[ ] pendências estruturais

[ ] links para editar seção

[ ] não afirma conformidade jurídica
```

---

## STORY-038 — Implementar Submit Activity

**Epic:** EPIC-04  
**Priority:** P0  
**Status:** BLOCKED

### Blocked By

```text
WFQ-002
PAQ-006
```

### API

```http
POST /api/v1/processing-activities/:id/submit
```

### Acceptance Criteria

```text
[ ] operação semântica

[ ] não depende de PATCH status

[ ] validações de Submit executadas

[ ] transição autorizada

[ ] audit event

[ ] errors identificam campos/etapas quando possível
```

---

# EPIC-05 — SYSTEMS

## STORY-039 — Criar System Catalog

**Epic:** EPIC-05  
**Priority:** P0  
**Status:** BACKLOG

### Related Docs

```text
features/SYSTEMS.md
```

### Acceptance Criteria

```text
[ ] System pertence à Organization

[ ] UUID

[ ] lifecycle status

[ ] mappingStatus separado

[ ] tenant isolation

[ ] audit
```

---

## STORY-040 — Implementar System Mapping

**Epic:** EPIC-05  
**Priority:** P0  
**Status:** BLOCKED

### Blocked By

```text
SYSQ-002
```

### Acceptance Criteria

```text
[ ] required metadata definida

[ ] backend determina se pode ser MAPPED

[ ] cliente não força MAPPED arbitrariamente

[ ] remoção de metadata relevante segue regra definida
```

---

## STORY-041 — Implementar System Quick Create

**Epic:** EPIC-05  
**Priority:** P0  
**Status:** BLOCKED

### Blocked By

```text
SYSQ-011
```

### Acceptance Criteria

```text
[ ] cria System persistente

[ ] mappingStatus inicial PENDING

[ ] tenant correto

[ ] permission validada

[ ] associação ao Wizard possível

[ ] audit
```

---

## STORY-042 — Associar Systems às Activities

**Epic:** EPIC-05  
**Priority:** P0  
**Status:** BLOCKED

### Blocked By

```text
SYSQ-005
SYSQ-006
```

### Acceptance Criteria

```text
[ ] association model segue decisão

[ ] CollectionSource suportada

[ ] ProcessingOperation suportada conforme decisão

[ ] cross-tenant association rejeitada
```

---

## STORY-043 — Inativar System

**Epic:** EPIC-05  
**Priority:** P1  
**Status:** BLOCKED

### Blocked By

```text
SYSQ-007
```

quando houver Activity ACTIVE relacionada.

### Acceptance Criteria

```text
[ ] histórico preservado

[ ] nenhuma referência histórica destruída

[ ] impacto em Activities segue regra aprovada

[ ] audit
```

---

# EPIC-06 — SUPPLIERS

## STORY-044 — Criar Supplier Catalog

**Epic:** EPIC-06  
**Priority:** P0  
**Status:** BACKLOG

### Related Docs

```text
features/SUPPLIERS.md
```

### Acceptance Criteria

```text
[ ] Supplier pertence à Organization

[ ] mappingStatus separado

[ ] status cadastral separado

[ ] tenant isolation

[ ] audit
```

---

## STORY-045 — Implementar Supplier Mapping

**Epic:** EPIC-06  
**Priority:** P0  
**Status:** BLOCKED

### Blocked By

```text
SUPQ-002
SUPQ-003
```

### Acceptance Criteria

```text
[ ] required metadata segue decisão

[ ] papel de privacidade modelado corretamente

[ ] backend controla MAPPED

[ ] não inferir operador automaticamente
```

---

## STORY-046 — Implementar Supplier Quick Create

**Epic:** EPIC-06  
**Priority:** P0  
**Status:** BLOCKED

### Blocked By

```text
SUPQ-011
```

### Acceptance Criteria

```text
[ ] Supplier persistido

[ ] PENDING inicialmente

[ ] tenant correto

[ ] permission validada

[ ] Wizard recebe associação

[ ] audit
```

---

## STORY-047 — Associar Supplier

**Epic:** EPIC-06  
**Priority:** P0  
**Status:** BLOCKED

### Blocked By

```text
SUPQ-004
SYSQ-004
```

### Acceptance Criteria

```text
[ ] associations seguem domínio aprovado

[ ] cross-tenant rejeitado

[ ] Supplier não é automaticamente operador

[ ] histórico preservável
```

---

## STORY-048 — Inativar Supplier

**Epic:** EPIC-06  
**Priority:** P1  
**Status:** BLOCKED

### Blocked By

```text
SUPQ-009
```

### Acceptance Criteria

```text
[ ] histórico preservado

[ ] Activities existentes não são corrompidas

[ ] comportamento de referências ativas segue decisão

[ ] audit
```

---

# EPIC-07 — COMPLIANCE GATE

## STORY-049 — Criar Compliance Engine

**Epic:** EPIC-07  
**Priority:** P0  
**Status:** BLOCKED

### Blocked By

```text
CGQ-003
CGQ-005
BRQ-007
```

### Related Docs

```text
features/COMPLIANCE-GATE.md
```

### Acceptance Criteria

```text
[ ] Gate backend-authoritative

[ ] checks independentes

[ ] reason codes

[ ] resultado agregado

[ ] Activity version/state identificável

[ ] nenhuma certificação jurídica
```

---

## STORY-050 — Legal Basis Check

**Epic:** EPIC-07  
**Priority:** P0  
**Status:** BLOCKED

### Dependencies

```text
STORY-032
STORY-049
```

### Acceptance Criteria

```text
[ ] ausência detectada

[ ] legitimate interest justification considerada estruturalmente

[ ] não decide adequação jurídica

[ ] reasonCode estável
```

---

## STORY-051 — Retention Check

**Epic:** EPIC-07  
**Priority:** P0  
**Status:** BLOCKED

### Dependencies

```text
STORY-030
STORY-049
```

### Acceptance Criteria

```text
[ ] duration validada

[ ] unit validada

[ ] startEvent validado

[ ] não avalia se prazo é juridicamente ideal
```

---

## STORY-052 — Security Measures Check

**Epic:** EPIC-07  
**Priority:** P0  
**Status:** BLOCKED

### Dependencies

```text
STORY-031
STORY-049
```

### Acceptance Criteria

```text
[ ] presença estrutural avaliada

[ ] ausência detectada

[ ] não certifica segurança
```

---

## STORY-053 — International Transfer Check

**Epic:** EPIC-07  
**Priority:** P0  
**Status:** BLOCKED

### Blocked By

```text
BRQ-003
```

### Acceptance Criteria

```text
[ ] NOT_APPLICABLE quando transferência não existe

[ ] destination country considerada

[ ] mecanismo tratado conforme regra

[ ] não escolhe mecanismo jurídico
```

---

## STORY-054 — Sensitive Data Check

**Epic:** EPIC-07  
**Priority:** P0  
**Status:** BLOCKED

### Blocked By

```text
BRQ-001
CGQ-001
```

### Acceptance Criteria

```text
[ ] sensíveis detectados

[ ] ausência resulta em NOT_APPLICABLE quando definido

[ ] presença não gera FAIL automático

[ ] revisão segue workflow aprovado
```

---

## STORY-055 — Minor Data Check

**Epic:** EPIC-07  
**Priority:** P0  
**Status:** BLOCKED

### Blocked By

```text
BRQ-002
CGQ-001
```

### Acceptance Criteria

```text
[ ] menores detectados

[ ] presença não gera FAIL automático

[ ] revisão segue regra aprovada
```

---

## STORY-056 — Implementar Compliance UI

**Epic:** EPIC-07  
**Priority:** P0  
**Status:** BLOCKED

### Dependencies

```text
STORY-049
```

### Acceptance Criteria

```text
[ ] checks exibidos

[ ] status textual

[ ] status não depende apenas de cor

[ ] reasonCode mapeado

[ ] links de correção

[ ] permissions respeitadas

[ ] não usa label "LGPD compliant"
```

---

## STORY-057 — Resolver Human Review

**Epic:** EPIC-07  
**Priority:** P0  
**Status:** BLOCKED

### Blocked By

```text
WFQ-005
CGQ-001
CGQ-002
```

### Acceptance Criteria

```text
[ ] reviewer autorizado

[ ] decisão persistida

[ ] justification conforme regra

[ ] audit obrigatório

[ ] histórico preservado
```

---

## STORY-058 — Ativar Processing Activity

**Epic:** EPIC-07  
**Priority:** P0  
**Status:** BLOCKED

### Blocked By

```text
BRQ-006
WFQ-004
WFQ-006
```

### Acceptance Criteria

```text
[ ] ativação é operação semântica

[ ] Gate obrigatório

[ ] permission validada

[ ] workflow validado

[ ] não permite PATCH status=ACTIVE

[ ] audit
```

---

# EPIC-08 — VERSIONING & AUDIT

## STORY-059 — Implementar ActivityVersion

**Epic:** EPIC-08  
**Priority:** P0  
**Status:** BLOCKED

### Blocked By

```text
DBQ-002
DBQ-003
AUDQ-013
```

### Acceptance Criteria

```text
[ ] histórico não sobrescrito

[ ] versão identificável

[ ] snapshot/estrutura segue decisão

[ ] tenant isolation

[ ] versão imutável quando aplicável
```

---

## STORY-060 — Implementar Published Version

**Epic:** EPIC-08  
**Priority:** P0  
**Status:** BLOCKED

### Blocked By

```text
WFQ-008
```

### Acceptance Criteria

```text
[ ] versão publicada identificável

[ ] revisão não altera versão publicada

[ ] ROPA pode determinar versão correta

[ ] Dashboard pode determinar versão correta
```

---

## STORY-061 — Implementar Revision Workflow

**Epic:** EPIC-08  
**Priority:** P0  
**Status:** BLOCKED

### Blocked By

```text
WFQ-007
WFQ-008
PAQ-007
```

### Acceptance Criteria

```text
[ ] Activity ACTIVE pode iniciar revisão conforme regra

[ ] versão publicada preservada

[ ] revisão independente

[ ] Gate da revisão não altera versão anterior

[ ] publicação troca versão corretamente
```

---

## STORY-062 — Implementar AuditLog

**Epic:** EPIC-08  
**Priority:** P0  
**Status:** BACKLOG

### Related Decision

```text
DEC-016
```

### Acceptance Criteria

```text
[ ] append-only

[ ] actor

[ ] action/event

[ ] entity

[ ] timestamp

[ ] organization

[ ] metadata segura

[ ] sem secrets
```

---

## STORY-063 — Implementar Activity History

**Epic:** EPIC-08  
**Priority:** P1  
**Status:** BLOCKED

### Dependencies

```text
STORY-059
STORY-062
```

### Acceptance Criteria

```text
[ ] versões listáveis

[ ] eventos relevantes visíveis

[ ] versão histórica read-only

[ ] authorization aplicada
```

---

# EPIC-09 — ROPA

## STORY-064 — Implementar ROPA Projection

**Epic:** EPIC-09  
**Priority:** P0  
**Status:** BLOCKED

### Blocked By

```text
ROPAQ-001
ROPAQ-002
ROPAQ-003
WFQ-008
```

### Related Docs

```text
features/ROPA.md
```

### Acceptance Criteria

```text
[ ] ROPA derivado de Activity

[ ] nenhuma segunda fonte manual

[ ] versão correta

[ ] tenant isolation

[ ] authorization

[ ] sem mistura entre versões
```

---

## STORY-065 — Implementar ROPA Filters

**Epic:** EPIC-09  
**Priority:** P1  
**Status:** BACKLOG

### Acceptance Criteria

Filtros aprovados entre:

```text
Business Unit

Compliance Status

Sensitive Data

Minor Data

International Transfer

Search
```

```text
[ ] server-side

[ ] tenant scoped

[ ] authorization scoped

[ ] paginação
```

---

## STORY-066 — Implementar ROPA UI

**Epic:** EPIC-09  
**Priority:** P0  
**Status:** BLOCKED

### Dependencies

```text
STORY-064
```

### Acceptance Criteria

```text
[ ] tabela/listagem

[ ] filtros

[ ] detalhe

[ ] versão

[ ] compliance status

[ ] read-only

[ ] link para Activity
```

---

## STORY-067 — Exportar ROPA XLSX

**Epic:** EPIC-09  
**Priority:** P0  
**Status:** BLOCKED

### Blocked By

```text
ROPAQ-004
ROPAQ-005
ROPAQ-008
APIQ-006
```

### Acceptance Criteria

```text
[ ] backend gera arquivo

[ ] tenant scope

[ ] permission

[ ] arrays representados consistentemente

[ ] snapshot consistente

[ ] arquivo privado

[ ] audit
```

---

## STORY-068 — Exportar ROPA PDF

**Epic:** EPIC-09  
**Priority:** P0  
**Status:** BLOCKED

### Dependencies

```text
STORY-064
```

### Blocked By

```text
ROPAQ-004
ROPAQ-005
ROPAQ-008
APIQ-006
```

### Acceptance Criteria

```text
[ ] PDF gerado pelo backend

[ ] dados correspondem ao ROPA

[ ] tenant scope

[ ] permission

[ ] arquivo privado

[ ] snapshot consistente

[ ] audit
```

---

# EPIC-10 — DASHBOARD

## STORY-069 — Implementar Dashboard Summary

**Epic:** EPIC-10  
**Priority:** P0  
**Status:** BLOCKED

### Blocked By

```text
DASHQ-001
DASHQ-002
DASHQ-003
DASHQ-010
DASHQ-011
```

### Related Docs

```text
features/DASHBOARD.md
```

### Acceptance Criteria

```text
[ ] métricas seguem fórmulas aprovadas

[ ] tenant scope

[ ] authorization scope

[ ] versão correta

[ ] archived tratados corretamente

[ ] erro não aparece como zero
```

---

## STORY-070 — Implementar Pending Items

**Epic:** EPIC-10  
**Priority:** P0  
**Status:** BLOCKED

### Blocked By

```text
DASHQ-006
DASHQ-007
```

### Acceptance Criteria

```text
[ ] pendências possuem tipo

[ ] recurso relacionado

[ ] pendingSince

[ ] tenant scope

[ ] authorization scope
```

---

## STORY-071 — Implementar Old Pendencies

**Epic:** EPIC-10  
**Priority:** P1  
**Status:** BLOCKED

### Blocked By

```text
DASHQ-008
```

### Acceptance Criteria

```text
[ ] threshold aprovado

[ ] idade calculada corretamente

[ ] filtros consistentes
```

---

## STORY-072 — Implementar Dashboard UI

**Epic:** EPIC-10  
**Priority:** P0  
**Status:** BLOCKED

### Dependencies

```text
STORY-069
STORY-070
```

### Acceptance Criteria

```text
[ ] metric cards

[ ] pendências

[ ] sensitive data

[ ] minors

[ ] international transfers

[ ] Systems pending

[ ] Suppliers pending

[ ] drill-down

[ ] loading/error/empty
```

---

# EPIC-11 — SECURITY & HARDENING

## STORY-073 — Executar IDOR Review

**Epic:** EPIC-11  
**Priority:** P0  
**Status:** BACKLOG

### Acceptance Criteria

Testar recursos de:

```text
Activities

Systems

Suppliers

ROPA

Files

Audit

Users

Business Units
```

contra acesso por IDs externos ao scope.

---

## STORY-074 — Executar Cross-Tenant Security Suite

**Epic:** EPIC-11  
**Priority:** P0  
**Status:** BACKLOG

### Scenario

```text
Organization A

Organization B
```

Tentar:

```text
GET

PATCH

DELETE

association

export

download
```

entre tenants.

### Acceptance Criteria

```text
[ ] nenhum vazamento

[ ] nenhuma alteração cross-tenant

[ ] nenhum arquivo cross-tenant

[ ] nenhuma associação cross-tenant
```

---

## STORY-075 — Upload Security

**Epic:** EPIC-11  
**Priority:** P0  
**Status:** BLOCKED

### Blocked By

```text
SECQ-005
APIQ-007
```

### Acceptance Criteria

```text
[ ] size validation

[ ] MIME validation

[ ] extension validation

[ ] private storage

[ ] authorized download

[ ] filename seguro

[ ] malware strategy aplicada
```

---

## STORY-076 — Implementar Rate Limiting

**Epic:** EPIC-11  
**Priority:** P1  
**Status:** BACKLOG

### Acceptance Criteria

Aplicar especialmente em:

```text
authentication

sensitive mutations

exports
```

quando adequado.

---

## STORY-077 — Security Headers / CORS / CSRF

**Epic:** EPIC-11  
**Priority:** P0  
**Status:** BLOCKED

### Blocked By

```text
SECQ-002
```

### Acceptance Criteria

```text
[ ] CORS restritivo

[ ] CSRF tratado conforme sessão

[ ] cookies seguros quando aplicável

[ ] headers de segurança

[ ] produção exige HTTPS
```

---

## STORY-078 — Secrets Review

**Epic:** EPIC-11  
**Priority:** P0  
**Status:** BACKLOG

### Acceptance Criteria

```text
[ ] nenhum secret no Git

[ ] nenhum secret em logs

[ ] nenhum credential em System description

[ ] nenhum credential em Audit metadata

[ ] configuração de produção externa ao código
```

---

# EPIC-12 — RELEASE

## STORY-079 — Configurar Production Environment

**Epic:** EPIC-12  
**Priority:** P0  
**Status:** BLOCKED

### Blocked By

```text
INFRAQ-001
INFRAQ-002
INFRAQ-005
```

### Acceptance Criteria

```text
[ ] application deploy

[ ] database production

[ ] object storage

[ ] TLS

[ ] secrets

[ ] domain

[ ] environment configuration
```

---

## STORY-080 — Configurar Backup

**Epic:** EPIC-12  
**Priority:** P0  
**Status:** BLOCKED

### Blocked By

```text
INFRAQ-007
```

### Acceptance Criteria

```text
[ ] backup automático

[ ] retention definida

[ ] acesso protegido

[ ] monitoramento de falha
```

---

## STORY-081 — Executar Restore Test

**Epic:** EPIC-12  
**Priority:** P0  
**Status:** BLOCKED

### Dependencies

```text
STORY-080
```

### Acceptance Criteria

```text
[ ] backup restaurado em ambiente controlado

[ ] integridade verificada

[ ] procedimento documentado

[ ] tempo observado registrado
```

---

## STORY-082 — Configurar Observability

**Epic:** EPIC-12  
**Priority:** P1  
**Status:** BLOCKED

### Blocked By

```text
INFRAQ-008
```

### Acceptance Criteria

```text
[ ] structured logs

[ ] error tracking

[ ] health monitoring

[ ] métricas essenciais

[ ] alertas essenciais
```

---

## STORY-083 — Executar Release E2E Suite

**Epic:** EPIC-12  
**Priority:** P0  
**Status:** BACKLOG

### Critical Flows

```text
Login
↓
Organization
↓
Create Activity
↓
Mapping Wizard
↓
Submit
↓
Review
↓
Compliance Gate
↓
Activate
↓
ROPA
↓
Export
↓
Dashboard
```

### Acceptance Criteria

```text
[ ] todos os fluxos aprovados passam

[ ] nenhum teste P0 falhando

[ ] tenant isolation suite passa

[ ] authorization suite passa
```

---

# 10. Mapa de dependências principal

```text
STORY-001 Frontend
STORY-002 Backend
STORY-003 Database
        ↓
STORY-009 Authentication
        ↓
STORY-010 Authenticated Context
        ↓
STORY-013 Organization
        ↓
STORY-015 Membership
        ↓
STORY-017 Authorization
        ↓
STORY-018 Tenant Isolation
        ↓
STORY-019 Processing Activity
        ↓
STORY-023..032 Domain Mapping
        ↓
STORY-033 Wizard
        ↓
STORY-038 Submit
        ↓
STORY-039 Systems
STORY-044 Suppliers
        ↓
STORY-049 Compliance Gate
        ↓
STORY-058 Activation
        ↓
STORY-059 Versioning
        ↓
STORY-064 ROPA
        ↓
STORY-069 Dashboard
        ↓
EPIC-11 Hardening
        ↓
EPIC-12 Release
```

---

# 11. Backlog inicial P0

Itens de maior prioridade estrutural:

```text
STORY-001 — Frontend

STORY-002 — Backend

STORY-003 — Database

STORY-007 — Testing

STORY-009 — Authentication

STORY-010 — Authenticated Context

STORY-013 — Organization

STORY-014 — Business Units

STORY-015 — Membership

STORY-016 — Business Unit Scope

STORY-017 — Permissions

STORY-018 — Tenant Isolation

STORY-019 — Create Activity

STORY-020 — List Activities

STORY-021 — Activity Detail

STORY-022 — Edit Draft
```

---

# 12. Backlog bloqueado por decisões

Antes de iniciar desenvolvimento funcional amplo, priorizar decisões relacionadas a:

```text
DBQ-001

PRODQ-001

AUTHQ-005
AUTHQ-006
AUTHQ-007
AUTHQ-008

SECQ-001
SECQ-002

DQ-001
DQ-002
DQ-003
DQ-004
DQ-005

WFQ-001
WFQ-002
WFQ-004
WFQ-005

CGQ-001
CGQ-003
CGQ-005
```

---

# 13. Task Template

Quando uma Story for movida para:

```text
READY
```

ela pode ser quebrada em Tasks.

Exemplo:

```markdown
## TASK-XXX — Create ProcessingActivity migration

**Story:** STORY-019
**Status:** READY

### Objective

Create the database structure required for ProcessingActivity.

### Related Docs

- `docs/03-DATABASE.md`
- `docs/features/PROCESSING-ACTIVITY.md`

### Acceptance Criteria

- [ ] migration created
- [ ] tenant relationship enforced
- [ ] indexes created
- [ ] migration test passes
```

---

# 14. Exemplo de decomposição

Para:

```text
STORY-019 — Criar Processing Activity Draft
```

poderão existir:

```text
TASK-001 — ProcessingActivity migration

TASK-002 — ProcessingActivity domain model

TASK-003 — CreateProcessingActivity use case

TASK-004 — ProcessingActivity repository

TASK-005 — POST processing-activities controller

TASK-006 — Request validation

TASK-007 — Authorization

TASK-008 — Tenant validation

TASK-009 — Audit event

TASK-010 — Integration tests

TASK-011 — Cross-tenant tests

TASK-012 — Frontend create form

TASK-013 — Frontend API integration

TASK-014 — Frontend tests
```

---

# 15. Tamanho das Tasks

Uma Task deve preferencialmente representar uma mudança:

```text
pequena

testável

revisável
```

Evitar:

```text
TASK — Implement Processing Activities
```

Preferir:

```text
TASK — Implement CreateProcessingActivity use case
```

---

# 16. Regra para agentes de IA

Quando receber uma Story ou Task:

```text
1. localizar ID no backlog

2. ler Related Docs

3. verificar Dependencies

4. verificar Blocked By

5. consultar 12-OPEN-QUESTIONS.md

6. consultar 13-DECISIONS.md

7. implementar somente o escopo solicitado

8. adicionar testes

9. revisar contra Acceptance Criteria
```

---

# 17. Não implementar dependência automaticamente

Se o agente receber:

```text
STORY-067 — Exportar ROPA XLSX
```

e descobrir que:

```text
STORY-064 — ROPA Projection
```

não existe ainda, não deve implementar silenciosamente todo o ROPA.

Deve informar:

```text
Dependency not satisfied:
STORY-064
```

---

# 18. Não resolver bloqueador automaticamente

Se:

```text
Status = BLOCKED
```

por:

```text
DQ-003
```

o agente não deve escolher uma cardinalidade por conveniência.

---

# 19. Decision Required

Formato:

```text
Decision Required

Story:
STORY-032

Blocked By:
DQ-002
DQ-003

Question:
Como LegalBasis se relaciona com ProcessingActivity?

Why it matters:
A decisão altera schema, API, domínio e Compliance Gate.

Options:
...

Affected:
Database
Domain
API
Wizard
Compliance
ROPA
```

---

# 20. Definition of Done — Story

Uma Story somente pode assumir:

```text
DONE
```

quando:

```text
[ ] acceptance criteria atendidos

[ ] backend implementado quando aplicável

[ ] frontend implementado quando aplicável

[ ] database atualizado quando aplicável

[ ] authorization aplicada

[ ] tenant isolation aplicada

[ ] audit aplicado quando necessário

[ ] unit tests passam

[ ] integration tests passam

[ ] E2E relevante passa

[ ] lint passa

[ ] typecheck passa

[ ] build passa

[ ] documentação atualizada se comportamento mudou

[ ] nenhuma decisão estrutural foi inventada
```

---

# 21. Definition of Done — Epic

Epic pode ser considerado concluído quando:

```text
[ ] todas as Stories P0/P1 obrigatórias concluídas

[ ] regras funcionais atendidas

[ ] testes críticos passando

[ ] autorização revisada

[ ] tenant isolation revisada

[ ] documentação sincronizada

[ ] nenhum blocker crítico relacionado permanece
```

---

# 22. Fluxo sugerido no Jira

Este backlog pode ser representado com:

```text
BACKLOG
↓
READY
↓
IN PROGRESS
↓
IN REVIEW
↓
DONE
```

Com:

```text
BLOCKED
```

como estado ou flag adicional.

---

# 23. Hierarquia sugerida no Jira

```text
Epic
└── Story
    └── Sub-task
```

Mapeamento:

```text
EPIC-XX
→ Epic

STORY-XXX
→ Story

TASK-XXX
→ Sub-task
```

---

# 24. Labels sugeridas

```text
frontend

backend

database

security

auth

tenant

activity

wizard

system

supplier

compliance

audit

versioning

ropa

dashboard

infrastructure
```

Não criar dezenas de labels sem necessidade.

---

# 25. Prioridade de implementação

O agente deve priorizar:

```text
segurança estrutural
↓
tenant isolation
↓
domínio
↓
workflow
↓
funcionalidade
↓
UX
↓
otimização
```

---

# 26. Evitar otimização prematura

Não adicionar automaticamente:

```text
Redis

BullMQ

microservices

event bus

CQRS framework

Elasticsearch

Kafka

Kubernetes
```

sem requisito concreto.

---

# 27. Regra para novas Stories

Uma nova Story deve responder:

```text
Por que existe?

Qual problema resolve?

Do que depende?

O que pode bloqueá-la?

Quais documentos definem seu comportamento?

Como saberemos que está pronta?

Como será testada?
```

---

# 28. Regra de rastreabilidade

Idealmente:

```text
Requirement
↓
Business Rule
↓
Decision
↓
Story
↓
Task
↓
Code
↓
Test
```

---

# 29. Exemplo de rastreabilidade

```text
BR-GLOBAL-001
Activity não pode concluir sem Gate
        ↓
DEC-006
Compliance Gate estruturado
        ↓
STORY-049
Compliance Engine
        ↓
STORY-058
Activate Activity
        ↓
Integration Test
        ↓
E2E Activation Flow
```

---

# 30. Regra final

O backlog não deve ser tratado como lista fixa de código a produzir.

Ele representa:

```text
ordem

dependências

decisões

escopo

aceitação

rastreabilidade
```

Se uma descoberta durante desenvolvimento alterar comportamento do produto:

```text
não alterar silenciosamente a Story
```

O fluxo deve ser:

```text
Discovery
↓
Open Question
↓
Decision
↓
Update Specification
↓
Update Backlog
↓
Implementation
```

---

# 31. Próximo documento

O próximo documento recomendado é:

```text
docs/16-CODING-STANDARDS.md
```

Ele deve definir as regras de implementação que humanos e agentes de IA deverão seguir:

```text
TypeScript

naming

folder structure

imports

domain boundaries

NestJS conventions

React conventions

error handling

validation

repository patterns

transactions

logging

security

testing

comments

Git conventions

prohibited patterns
```

Esse documento reduz a chance de diferentes agentes implementarem cada Story com padrões incompatíveis.