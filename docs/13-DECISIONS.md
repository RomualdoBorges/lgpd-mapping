# Architecture & Product Decisions

> **Documento:** Registro de Decisões do Projeto  
> **Status:** Living Document  
> **Objetivo:** registrar decisões efetivamente aprovadas sobre produto, domínio, arquitetura, segurança, workflow e implementação.

---

# 1. Objetivo

Este documento registra apenas decisões que já foram tomadas.

Ele complementa:

```text
12-OPEN-QUESTIONS.md
```

A relação entre os documentos é:

```text
12-OPEN-QUESTIONS.md
        ↓
questão analisada
        ↓
decisão aprovada
        ↓
13-DECISIONS.md
```

---

# 2. Regra principal

Uma questão:

```text
OPEN
```

não deve aparecer neste documento como decisão definitiva.

Somente registrar decisões cujo status seja:

```text
DECIDED
```

---

# 3. Fonte da verdade

Para decisões já aprovadas:

```text
13-DECISIONS.md
```

é a fonte central de registro da decisão.

Os documentos funcionais e técnicos afetados também devem ser atualizados.

---

# 4. Não usar este documento como substituto das especificações

Exemplo:

```text
DEC-001
Multi-tenancy aprovado
```

não elimina a necessidade de atualizar:

```text
01-ARCHITECTURE.md

02-DOMAIN.md

03-DATABASE.md

04-AUTHORIZATION.md

09-SECURITY.md
```

---

# 5. Ciclo de decisão

```text
Open Question
      ↓
Analysis
      ↓
Decision
      ↓
Record Decision
      ↓
Update Specifications
      ↓
Update Tests
      ↓
Implementation
```

---

# 6. Identificador

Cada decisão deve possuir identificador estável:

```text
DEC-001

DEC-002

DEC-003
```

Não reutilizar identificadores removidos.

---

# 7. Estrutura

Cada decisão deve seguir:

```text
ID

Title

Status

Decision Date

Related Questions

Context

Decision

Rationale

Consequences

Affected Documents
```

---

# 8. Status

Decisões registradas aqui normalmente possuem:

```text
DECIDED
```

Se uma decisão for posteriormente substituída:

```text
SUPERSEDED
```

pode ser utilizado.

---

# 9. Decisão substituída

Nunca apagar silenciosamente decisão antiga.

Exemplo:

```text
DEC-010
Status: SUPERSEDED
Superseded By: DEC-027
```

---

# 10. Rastreabilidade

Toda decisão originada de Open Question deve referenciar seu ID.

Exemplo:

```text
Related Questions:

PRODQ-001
AUTHQ-006
```

---

# 11. Atualização do Open Questions

Após decisão:

```text
12-OPEN-QUESTIONS.md
```

deve mudar:

```text
Status: OPEN
```

para:

```text
Status: DECIDED
```

e referenciar:

```text
Decision: DEC-XXX
```

---

# 12. Template

Copiar o bloco abaixo para registrar nova decisão:

```markdown
# DEC-XXX — Título

**Status:** DECIDED  
**Decision Date:** YYYY-MM-DD

## Related Questions

- XXXQ-001

## Context

Descrever o problema que exigia decisão.

## Decision

Descrever objetivamente o que foi decidido.

## Rationale

Explicar por que essa alternativa foi escolhida.

## Consequences

### Positive

- ...

### Negative / Trade-offs

- ...

## Affected Documents

- `docs/...`
- `docs/features/...`

## Implementation Notes

Informações técnicas necessárias para aplicar a decisão.

## Validation

- [ ] Open Question atualizada
- [ ] Domain atualizado
- [ ] Database atualizado
- [ ] API atualizada
- [ ] Frontend atualizado
- [ ] Tests atualizados
```

---

# 13. Decisões já assumidas pela documentação

Algumas decisões já aparecem de forma consistente nos documentos atuais.

Elas podem ser registradas formalmente aqui.

---

# DEC-001 — Arquitetura inicial como Modular Monolith

**Status:** DECIDED  
**Decision Date:** 2026-09-17

## Related Questions

```text
Architecture
```

## Context

O produto possui diversos módulos relacionados:

```text
Authentication

Organizations

Processing Activities

Mapping Wizard

Compliance Gate

ROPA

Systems

Suppliers

Dashboard

Audit
```

Apesar da separação funcional, todos fazem parte do mesmo domínio e possuem forte relacionamento transacional.

## Decision

A arquitetura inicial será:

```text
Modular Monolith
```

Não serão utilizados microservices como arquitetura padrão da V1.

## Rationale

O Modular Monolith permite:

```text
separação clara de módulos

transações simples

menor complexidade operacional

desenvolvimento mais rápido

testes mais simples

deploy simplificado

evolução futura
```

sem introduzir prematuramente:

```text
service discovery

distributed transactions

eventual consistency

observabilidade distribuída

múltiplos deploys
```

## Consequences

### Positive

```text
arquitetura mais simples

menor custo operacional

domínio centralizado

facilidade de desenvolvimento assistido por IA
```

### Trade-offs

```text
disciplina modular precisa ser mantida

módulos não devem acessar internals uns dos outros arbitrariamente
```

## Affected Documents

```text
01-ARCHITECTURE.md

AGENTS.md
```

---

# DEC-002 — API REST versionada

**Status:** DECIDED  
**Decision Date:** 2026-09-17

## Context

Frontend e backend precisam de contrato de comunicação previsível.

## Decision

A API principal utilizará:

```text
REST
```

com prefixo:

```text
/api/v1
```

## Rationale

REST atende adequadamente aos casos de uso atuais:

```text
CRUD

workflows

queries

exports

uploads
```

sem necessidade identificada de GraphQL.

## Consequences

Endpoints devem utilizar:

```text
resources

semantic actions

HTTP status apropriados

error codes estáveis
```

## Affected Documents

```text
01-ARCHITECTURE.md

07-API.md
```

---

# DEC-003 — PostgreSQL como banco principal

**Status:** DECIDED  
**Decision Date:** 2026-09-17

## Context

O domínio possui:

```text
relacionamentos

integridade referencial

transações

consultas estruturadas

versionamento

auditoria
```

## Decision

Banco principal:

```text
PostgreSQL
```

## Rationale

O modelo é predominantemente relacional e exige forte consistência.

## Consequences

O schema deve explorar adequadamente:

```text
foreign keys

unique constraints

indexes

transactions

JSONB quando justificável
```

## Affected Documents

```text
01-ARCHITECTURE.md

03-DATABASE.md
```

---

# DEC-004 — UUID como identificador

**Status:** DECIDED  
**Decision Date:** 2026-09-17

## Decision

Entidades principais utilizarão:

```text
UUID
```

como identificador.

## Consequences

APIs não devem depender de IDs sequenciais como:

```text
1
2
3
```

para identificar entidades.

UUID não substitui autorização.

Conhecer UUID nunca concede acesso ao recurso.

## Affected Documents

```text
01-ARCHITECTURE.md

03-DATABASE.md

07-API.md
```

---

# DEC-005 — Backend é autoridade das regras de negócio

**Status:** DECIDED  
**Decision Date:** 2026-09-17

## Context

O frontend possui diversas regras condicionais e workflows.

## Decision

Frontend pode reproduzir validações para UX, mas:

```text
backend
```

é a autoridade final para:

```text
business rules

authorization

tenant isolation

workflow transitions

Compliance Gate

validation
```

## Consequences

Nunca considerar suficiente:

```text
botão escondido

rota protegida no React

campo disabled

validação Zod no browser
```

como mecanismo de segurança.

## Affected Documents

```text
04-AUTHORIZATION.md

05-BUSINESS-RULES.md

07-API.md

08-FRONTEND.md

09-SECURITY.md

AGENTS.md
```

---

# DEC-006 — Compliance Gate estruturado

**Status:** DECIDED  
**Decision Date:** 2026-09-17

## Context

Uma única flag:

```text
isCompliant
```

não explica por que uma Activity está liberada ou pendente.

## Decision

Compliance Gate será composto por verificações estruturadas.

Tipos iniciais:

```text
LEGAL_BASIS

RETENTION

SECURITY_MEASURES

INTERNATIONAL_TRANSFER

SENSITIVE_DATA

MINOR_DATA
```

Statuses:

```text
PASS

FAIL

REVIEW_REQUIRED

NOT_APPLICABLE
```

Estado agregado:

```text
PENDING

COMPLETE

BLOCKED
```

## Important

A forma exata de agregação continua dependente das Open Questions do Compliance Gate.

## Consequences

Não implementar:

```text
isLgpdCompliant = true
```

como substituto do Gate.

## Affected Documents

```text
02-DOMAIN.md

05-BUSINESS-RULES.md

features/COMPLIANCE-GATE.md
```

---

# DEC-007 — ActivityStatus e ComplianceStatus são conceitos separados

**Status:** DECIDED  
**Decision Date:** 2026-09-17

## Decision

ProcessingActivity possui estado de workflow separado do estado do Compliance Gate.

Exemplo:

```text
ActivityStatus
DRAFT
MAPPING
PENDING_REVIEW
COMPLIANCE_PENDING
ACTIVE
UNDER_REVIEW
ARCHIVED
```

e:

```text
ComplianceStatus
PENDING
COMPLETE
BLOCKED
```

A lista definitiva de ActivityStatus ainda depende de `WFQ-001`.

## Consequences

Não criar uma enum única como:

```text
DRAFT

COMPLIANT

ACTIVE

BLOCKED
```

misturando conceitos.

## Affected Documents

```text
02-DOMAIN.md

05-BUSINESS-RULES.md

06-WORKFLOWS.md

features/PROCESSING-ACTIVITY.md

features/COMPLIANCE-GATE.md
```

---

# DEC-008 — ROPA como projeção

**Status:** DECIDED  
**Decision Date:** 2026-09-17

## Context

ROPA utiliza informações já presentes nas Processing Activities.

## Decision

ROPA será:

```text
Read Model / Projection
```

derivada das Activities e entidades relacionadas.

ROPA não será um segundo formulário independente.

## Consequences

Fluxo:

```text
ProcessingActivity
↓
Version
↓
Related Domain Data
↓
ROPA
```

Correções devem ocorrer na Activity.

## Affected Documents

```text
02-DOMAIN.md

features/ROPA.md
```

---

# DEC-009 — Systems como entidades reutilizáveis

**Status:** DECIDED  
**Decision Date:** 2026-09-17

## Decision

System será entidade de domínio reutilizável dentro da Organization.

Evitar:

```text
systemName
```

repetido como texto livre em todas as Activities.

## Consequences

Será possível relacionar Systems a:

```text
Collection Sources

Processing Operations

Activities

Suppliers
```

conforme cardinalidades que ainda precisam ser decididas.

## Affected Documents

```text
02-DOMAIN.md

03-DATABASE.md

features/SYSTEMS.md
```

---

# DEC-010 — Suppliers como entidades reutilizáveis

**Status:** DECIDED  
**Decision Date:** 2026-09-17

## Decision

Supplier será entidade reutilizável dentro da Organization.

## Consequences

Supplier poderá participar de:

```text
Systems

Recipients

Processing Activities

International Transfers
```

conforme relações que ainda precisam ser definidas.

## Affected Documents

```text
02-DOMAIN.md

03-DATABASE.md

features/SUPPLIERS.md
```

---

# DEC-011 — Systems e Suppliers possuem estado de mapeamento

**Status:** DECIDED  
**Decision Date:** 2026-09-17

## Decision

Systems e Suppliers poderão representar:

```text
PENDING

MAPPED
```

separadamente de seu status cadastral.

Exemplo:

```text
status = ACTIVE

mappingStatus = PENDING
```

## Important

Os critérios para:

```text
MAPPED
```

continuam abertos:

```text
SYSQ-002

SUPQ-002
```

## Consequences

Quick Create não pode automaticamente significar:

```text
MAPPED
```

## Affected Documents

```text
features/SYSTEMS.md

features/SUPPLIERS.md

features/DASHBOARD.md
```

---

# DEC-012 — Quick Create cria entidade persistente

**Status:** DECIDED  
**Decision Date:** 2026-09-17

## Context

Wizard pode precisar cadastrar System ou Supplier inexistente.

## Decision

Quick Create cria uma entidade real.

Fluxo:

```text
Wizard
↓
Quick Create
↓
System/Supplier persisted
↓
Activity association
```

Não será apenas texto temporário dentro da Activity.

## Consequences

Quick Create deve respeitar:

```text
authorization

tenant isolation

validation

audit
```

Quem possui permissão para Quick Create continua em aberto.

## Affected Documents

```text
features/MAPPING-WIZARD.md

features/SYSTEMS.md

features/SUPPLIERS.md
```

---

# DEC-013 — Não armazenar dados pessoais reais dos titulares

**Status:** DECIDED  
**Decision Date:** 2026-09-17

## Context

A ferramenta mapeia tratamentos.

Ela não é o sistema operacional onde os dados dos titulares são processados.

## Decision

A plataforma registra:

```text
categorias

tipos de dados

fluxos

finalidades

operações

metadata
```

e não registros reais como:

```text
João da Silva

CPF 123...

Maria...

dados médicos individuais
```

## Consequences

Não criar tabelas como:

```text
data_subject_person

customer_personal_record

employee_personal_record
```

para armazenar titulares reais como parte do mapeamento.

## Affected Documents

```text
00-PROJECT.md

02-DOMAIN.md

03-DATABASE.md

09-SECURITY.md

AGENTS.md
```

---

# DEC-014 — Versionamento não sobrescreve histórico relevante

**Status:** DECIDED  
**Decision Date:** 2026-09-17

## Context

O desenho funcional determina que alterações relevantes gerem nova versão e que histórico não seja sobrescrito.

## Decision

Mudanças relevantes em Activities publicadas devem preservar histórico.

## Important

Ainda permanecem abertas:

```text
WFQ-007
PAQ-007
DBQ-002
DBQ-003
AUDQ-013
```

que definem exatamente:

```text
quando

como

em qual estrutura
```

as versões serão criadas.

## Consequences

Não implementar histórico através de simples:

```sql
UPDATE processing_activity
```

que destrua o estado anterior necessário.

## Affected Documents

```text
02-DOMAIN.md

03-DATABASE.md

06-WORKFLOWS.md

10-AUDIT.md

features/PROCESSING-ACTIVITY.md
```

---

# DEC-015 — AuditLog e ActivityVersion são conceitos diferentes

**Status:** DECIDED  
**Decision Date:** 2026-09-17

## Decision

Separar:

```text
AuditLog
```

de:

```text
ActivityVersion
```

AuditLog responde:

```text
quem fez?

o quê?

quando?
```

ActivityVersion responde:

```text
qual era o estado da Activity?
```

## Consequences

Não tentar reconstruir obrigatoriamente toda Activity histórica somente através de eventos de AuditLog.

## Affected Documents

```text
10-AUDIT.md

03-DATABASE.md
```

---

# DEC-016 — AuditLog append-only

**Status:** DECIDED  
**Decision Date:** 2026-09-17

## Decision

Eventos de auditoria devem ser tratados como:

```text
append-only
```

Não devem ser editados pelo fluxo normal da aplicação.

## Consequences

Não disponibilizar CRUD genérico:

```text
PATCH /audit/:id

DELETE /audit/:id
```

## Affected Documents

```text
10-AUDIT.md

09-SECURITY.md
```

---

# DEC-017 — Arquivos privados

**Status:** DECIDED  
**Decision Date:** 2026-09-17

## Context

A plataforma pode armazenar:

```text
termos de consentimento

attachments

modelos

exports ROPA
```

## Decision

Arquivos não devem ser públicos por padrão.

## Consequences

Storage deve utilizar mecanismos como:

```text
private bucket/container

authorized download

short-lived signed URLs
```

conforme implementação escolhida.

## Affected Documents

```text
01-ARCHITECTURE.md

07-API.md

09-SECURITY.md

features/ROPA.md
```

---

# DEC-018 — Organization nunca vem do cliente como autoridade

**Status:** DECIDED  
**Decision Date:** 2026-09-17

## Decision

Em operações tenant-bound:

```text
organizationId
```

deve ser derivado do:

```text
AuthenticatedContext
```

e não confiado ao body/query enviado pelo cliente.

## Example

Evitar:

```json
{
  "organizationId": "tenant-b",
  "name": "Activity"
}
```

como forma de escolher tenant.

## Consequences

Backend deve aplicar tenant scope independentemente da UI.

## Affected Documents

```text
04-AUTHORIZATION.md

07-API.md

09-SECURITY.md

features/ORGANIZATIONS.md
```

---

# DEC-019 — Cross-tenant references são proibidas

**Status:** DECIDED  
**Decision Date:** 2026-09-17

## Decision

Recursos de Organizations diferentes não podem formar relações.

Exemplo proibido:

```text
Activity Organization A
↓
System Organization B
```

Também:

```text
System A
↓
Supplier B
```

## Consequences

Validação deve existir no backend e, quando possível, ser reforçada pelo banco.

Estratégia exata permanece em:

```text
DBQ-008

DBQ-009
```

## Affected Documents

```text
03-DATABASE.md

04-AUTHORIZATION.md

09-SECURITY.md

features/SYSTEMS.md

features/SUPPLIERS.md
```

---

# DEC-020 — Soft/inactive preservation para recursos históricos

**Status:** DECIDED  
**Decision Date:** 2026-09-17

## Decision

Recursos reutilizados por histórico não devem desaparecer por exclusão operacional comum.

Isso se aplica especialmente a:

```text
System

Supplier

BusinessUnit

ProcessingActivity
```

quando possuem relações históricas.

## Consequences

Preferir:

```text
INACTIVE

ARCHIVED

soft delete
```

conforme entidade.

A política exata de `deletedAt` continua em:

```text
DBQ-004
```

## Affected Documents

```text
03-DATABASE.md

features/ORGANIZATIONS.md

features/PROCESSING-ACTIVITY.md

features/SYSTEMS.md

features/SUPPLIERS.md
```

---

# DEC-021 — Dashboard como Read Model

**Status:** DECIDED  
**Decision Date:** 2026-09-17

## Decision

Dashboard é projeção de informações existentes.

Não possuirá estado independente para representar:

```text
quantidade de sensíveis

quantidade de menores

quantidade de pendências
```

## Consequences

Métricas devem ser calculadas a partir das fontes do domínio ou read models derivados.

## Affected Documents

```text
features/DASHBOARD.md
```

---

# DEC-022 — Dashboard não representa certificação LGPD

**Status:** DECIDED  
**Decision Date:** 2026-09-17

## Decision

Dashboard não apresentará automaticamente conclusões como:

```text
Empresa 85% conforme com LGPD
```

ou:

```text
LGPD Score = 92
```

## Consequences

Indicadores devem representar fatos específicos:

```text
mapeamento concluído

Gate pendente

dados sensíveis

menores

transferências

Systems pendentes

Suppliers pendentes
```

## Affected Documents

```text
features/DASHBOARD.md

features/COMPLIANCE-GATE.md
```

---

# DEC-023 — Compliance COMPLETE não significa certificação jurídica

**Status:** DECIDED  
**Decision Date:** 2026-09-17

## Decision

```text
ComplianceStatus = COMPLETE
```

significa apenas que as verificações estruturadas definidas pelo produto foram concluídas.

Não significa automaticamente:

```text
Conforme LGPD

Legalmente aprovado

Certificado LGPD
```

## Consequences

Frontend, API e exports devem evitar labels que impliquem certificação jurídica.

## Affected Documents

```text
features/COMPLIANCE-GATE.md

features/ROPA.md

features/DASHBOARD.md
```

---

# DEC-024 — Sensitive Data e Minor Data geram atenção, não irregularidade automática

**Status:** DECIDED  
**Decision Date:** 2026-09-17

## Decision

A presença de:

```text
Sensitive Data
```

ou:

```text
Minor Data
```

não significa automaticamente:

```text
FAIL
```

ou irregularidade.

Essas condições devem ser identificadas e podem exigir avaliação/revisão conforme regras finais.

## Important

A obrigatoriedade de RIPD/DPIA continua em:

```text
BRQ-001

BRQ-002
```

## Affected Documents

```text
05-BUSINESS-RULES.md

features/COMPLIANCE-GATE.md

features/DASHBOARD.md
```

---

# DEC-025 — Transferência internacional deve ser explicitamente registrada

**Status:** DECIDED  
**Decision Date:** 2026-09-17

## Decision

A plataforma não deve inferir transferência internacional apenas porque:

```text
Supplier é estrangeiro

System é SaaS

empresa possui operação internacional
```

Deve existir informação de transferência registrada no contexto da Activity.

## Consequences

Dashboard, Gate e ROPA devem utilizar:

```text
InternationalTransfer
```

como fonte do conceito.

## Affected Documents

```text
02-DOMAIN.md

features/PROCESSING-ACTIVITY.md

features/COMPLIANCE-GATE.md

features/ROPA.md

features/SUPPLIERS.md

features/DASHBOARD.md
```

---

# DEC-026 — Consentimento individual fora da V1

**Status:** DECIDED  
**Decision Date:** 2026-09-17

## Context

O produto precisa mapear quando consentimento é utilizado como base e armazenar documentos relacionados.

## Decision

V1 pode armazenar:

```text
ConsentDocument

template

version

effectiveDate

collectionMethod
```

mas não será responsável por armazenar:

```text
aceite individual de cada titular
```

## Consequences

Não criar na V1:

```text
ConsentAcceptance

SubjectConsent

ConsentHistoryPerPerson
```

salvo mudança formal de escopo.

## Affected Documents

```text
02-DOMAIN.md

03-DATABASE.md

05-BUSINESS-RULES.md

features/PROCESSING-ACTIVITY.md

features/MAPPING-WIZARD.md
```

---

# DEC-027 — Wizard opera sobre ProcessingActivity persistida

**Status:** DECIDED  
**Decision Date:** 2026-09-17

## Decision

Mapping Wizard não será uma entidade de domínio separada.

Ele é uma interface sobre:

```text
ProcessingActivity
+
subresources
```

## Consequences

Dados podem ser salvos progressivamente.

Não criar:

```text
WizardData
```

como segunda fonte da verdade contendo cópia integral da Activity.

## Affected Documents

```text
features/MAPPING-WIZARD.md

features/PROCESSING-ACTIVITY.md
```

---

# DEC-028 — Draft pode permanecer incompleto

**Status:** DECIDED  
**Decision Date:** 2026-09-17

## Decision

ProcessingActivity em:

```text
DRAFT
```

pode estar incompleta.

Validações de criação/salvamento não devem exigir todos os campos necessários para Submit/Gate.

## Consequences

Validação deve possuir níveis distintos:

```text
structural

draft/save

submit

compliance
```

## Affected Documents

```text
05-BUSINESS-RULES.md

features/PROCESSING-ACTIVITY.md

features/MAPPING-WIZARD.md
```

---

# DEC-029 — Operações de tratamento utilizam códigos estáveis

**Status:** DECIDED  
**Decision Date:** 2026-09-17

## Decision

Operações iniciais serão representadas por códigos estáveis como:

```text
USE

UPDATE

INTERNAL_TRANSFER

EXTERNAL_TRANSFER

INTERNATIONAL_TRANSFER

DELETE
```

Labels de UI podem ser localizadas.

## Consequences

Não persistir exclusivamente labels como:

```text
"Transferência externa"
```

como identificador da regra.

## Affected Documents

```text
02-DOMAIN.md

05-BUSINESS-RULES.md

features/PROCESSING-ACTIVITY.md

features/MAPPING-WIZARD.md
```

---

# DEC-030 — API utiliza operações semânticas para transições importantes

**Status:** DECIDED  
**Decision Date:** 2026-09-17

## Decision

Mudanças relevantes de workflow não devem depender apenas de:

```http
PATCH /activities/:id
```

alterando arbitrariamente:

```json
{
  "status": "ACTIVE"
}
```

Preferir operações semânticas como:

```text
submit

review

activate

archive

run compliance
```

conforme workflow final.

## Consequences

Campos protegidos não devem ser mass-assignment.

## Affected Documents

```text
06-WORKFLOWS.md

07-API.md

04-AUTHORIZATION.md
```

---

# DEC-031 — Controle exclusivamente interno de pendências na V1

**Status:** DECIDED  
**Decision Date:** 2026-09-18

## Related Questions

BRQ-011. SYSQ-007 e SUPQ-006 são relacionadas e permanecem abertas.

## Context

A questão legada perguntava se a V1 bloquearia tecnicamente entrada em produção de sistemas externos. DEC-011 define somente estados de mapeamento; não resolve bloqueio externo.

## Decision

A V1 não bloqueia tecnicamente a entrada em produção de sistemas externos. O produto registra e acompanha internamente as pendências de mapeamento.

## Rationale

Decisão expressa do usuário ao encerrar o saneamento documental.

## Consequences

Não alegar bloqueio externo nem introduzir integração de controle de implantação para cumprir essa regra. O efeito de System/Supplier PENDING sobre Submit, Gate e ACTIVE continua sendo decisão separada em SYSQ-007 e SUPQ-006.

## Affected Documents

12-OPEN-QUESTIONS.md, 00-PROJECT.md, 05-BUSINESS-RULES.md, 06-WORKFLOWS.md, features/SYSTEMS.md, features/SUPPLIERS.md.

---

# DEC-032 — Branding separado de domínio próprio

**Status:** DECIDED  
**Decision Date:** 2026-09-18

## Related Questions

PRODQ-003, PRODQ-004.

## Decision

Branding (logo e cores) e domínio próprio são decisões distintas. PRODQ-003 trata branding; PRODQ-004 trata domínio próprio. A separação não inclui nenhuma capacidade na V1. Ambas permanecem OPEN.

## Rationale

Separação expressamente escolhida pelo usuário para organizar o escopo sem aprovar funcionalidades.

## Consequences

Não adicionar automaticamente logo, cores ou customDomain ao modelo. A referência histórica de White Label em Organizations permanece rastreável no registro central.

## Affected Documents

12-OPEN-QUESTIONS.md, features/ORGANIZATIONS.md.

---

# DEC-033 — Antiguidade separada do disparo de notificações

**Status:** DECIDED  
**Decision Date:** 2026-09-18

## Related Questions

DASHQ-008, WFQ-013, DASHQ-007. SYSQ-008 e SUPQ-007 são aliases de DASHQ-008.

## Decision

Antiguidade de pendência e disparo de alerta/notificação são conceitos distintos. DASHQ-008 centraliza a política de antiguidade e a pergunta sobre limiares comuns ou diferentes por recurso. WFQ-013 trata exclusivamente o disparo de alertas/notificações.

Nenhum valor de dias foi definido. DASHQ-007 permanece a dependência para determinar o início da contagem.

## Rationale

Decisão expressa do usuário; uma pergunta canônica pode permitir limiares diferentes por recurso sem criar decisões paralelas sobre a mesma política.

## Consequences

SYSQ-008 e SUPQ-007 tornam-se aliases sem Status próprio. Classificar pendência como antiga não implica notificação automática. A igualdade ou diferença dos limiares não foi decidida.

## Affected Documents

12-OPEN-QUESTIONS.md, 05-BUSINESS-RULES.md, 06-WORKFLOWS.md, 24-NOTIFICATIONS.md, features/DASHBOARD.md, features/SYSTEMS.md, features/SUPPLIERS.md, 21-DATA-DICTIONARY.md, 15-BACKLOG.md.

---

# DEC-034 — SaaS multi-tenant e fronteira Organization

**Status:** DECIDED  
**Decision Date:** 2026-09-18

## Related Questions

PRODQ-001.

## Context

Lote Foundation → Identity/Tenant, aprovado expressamente pelo usuário.

## Decision

SaaS multi-tenant. Cada Organization é um tenant independente; Business Unit não é tenant. Esta decisão não escolhe a topologia física do banco nem RLS.

## Rationale

Registrar a alternativa expressamente aprovada, preservando os limites da primeira entrega e as pendências não respondidas.

## Consequences

Não implementar nesta etapa. Aplicar o modelo conceitual aprovado e respeitar as questões específicas ainda abertas. 

## Affected Documents

12-OPEN-QUESTIONS.md, 00-PROJECT.md, 01-ARCHITECTURE.md, 02-DOMAIN.md, 03-DATABASE.md, 04-AUTHORIZATION.md, 07-API.md, 08-FRONTEND.md, 09-SECURITY.md, 11-TESTING.md, 14-IMPLEMENTATION-PLAN.md, 15-BACKLOG.md, 17-ENVIRONMENTS-AND-DEPLOYMENT.md, 20-API-CONTRACTS.md, 21-DATA-DICTIONARY.md, 23-SEED-AND-CATALOGS.md, 26-RELEASE-CHECKLIST.md, 28-PRE-IMPLEMENTATION-CHECKLIST.md, features/AUTH.md, features/ORGANIZATIONS.md, features/ROPA.md.

---

# DEC-035 — Identidade global e memberships independentes

**Status:** DECIDED  
**Decision Date:** 2026-09-18

## Related Questions

AUTHQ-006.

## Context

Lote Foundation → Identity/Tenant, aprovado expressamente pelo usuário.

## Decision

User é uma identidade da plataforma e pode possuir Memberships em múltiplas Organizations. Os vínculos são independentes: papéis e desativação de um vínculo não se propagam para outro.

## Rationale

Registrar a alternativa expressamente aprovada, preservando os limites da primeira entrega e as pendências não respondidas.

## Consequences

Não implementar nesta etapa. Aplicar o modelo conceitual aprovado e respeitar as questões específicas ainda abertas. 

## Affected Documents

12-OPEN-QUESTIONS.md, 00-PROJECT.md, 01-ARCHITECTURE.md, 02-DOMAIN.md, 03-DATABASE.md, 04-AUTHORIZATION.md, 07-API.md, 08-FRONTEND.md, 09-SECURITY.md, 11-TESTING.md, 14-IMPLEMENTATION-PLAN.md, 15-BACKLOG.md, 17-ENVIRONMENTS-AND-DEPLOYMENT.md, 20-API-CONTRACTS.md, 21-DATA-DICTIONARY.md, 23-SEED-AND-CATALOGS.md, 26-RELEASE-CHECKLIST.md, 28-PRE-IMPLEMENTATION-CHECKLIST.md, features/AUTH.md, features/ORGANIZATIONS.md, features/ROPA.md.

---

# DEC-036 — Papéis concedidos pelo Membership

**Status:** DECIDED  
**Decision Date:** 2026-09-18

## Related Questions

AUTHQ-005.

## Context

Lote Foundation → Identity/Tenant, aprovado expressamente pelo usuário.

## Decision

Roles são concedidos através do Membership e não se propagam entre organizações. Isso não aprova PLATFORM_ADMIN.

## Rationale

Registrar a alternativa expressamente aprovada, preservando os limites da primeira entrega e as pendências não respondidas.

## Consequences

Não implementar nesta etapa. Aplicar o modelo conceitual aprovado e respeitar as questões específicas ainda abertas. 

## Affected Documents

12-OPEN-QUESTIONS.md, 00-PROJECT.md, 01-ARCHITECTURE.md, 02-DOMAIN.md, 03-DATABASE.md, 04-AUTHORIZATION.md, 07-API.md, 08-FRONTEND.md, 09-SECURITY.md, 11-TESTING.md, 14-IMPLEMENTATION-PLAN.md, 15-BACKLOG.md, 17-ENVIRONMENTS-AND-DEPLOYMENT.md, 20-API-CONTRACTS.md, 21-DATA-DICTIONARY.md, 23-SEED-AND-CATALOGS.md, 26-RELEASE-CHECKLIST.md, 28-PRE-IMPLEMENTATION-CHECKLIST.md, features/AUTH.md, features/ORGANIZATIONS.md, features/ROPA.md.

---

# DEC-037 — Múltiplas concessões com scope preservado

**Status:** DECIDED  
**Decision Date:** 2026-09-18

## Related Questions

AUTHQ-007.

## Context

Lote Foundation → Identity/Tenant, aprovado expressamente pelo usuário.

## Decision

Um Membership pode possuir múltiplos RoleAssignments. Cada concessão preserva seu scope; não combinar indiscriminadamente todos os roles com todas as Business Units.

## Rationale

Registrar a alternativa expressamente aprovada, preservando os limites da primeira entrega e as pendências não respondidas.

## Consequences

Não implementar nesta etapa. Aplicar o modelo conceitual aprovado e respeitar as questões específicas ainda abertas. 

## Affected Documents

12-OPEN-QUESTIONS.md, 00-PROJECT.md, 01-ARCHITECTURE.md, 02-DOMAIN.md, 03-DATABASE.md, 04-AUTHORIZATION.md, 07-API.md, 08-FRONTEND.md, 09-SECURITY.md, 11-TESTING.md, 14-IMPLEMENTATION-PLAN.md, 15-BACKLOG.md, 17-ENVIRONMENTS-AND-DEPLOYMENT.md, 20-API-CONTRACTS.md, 21-DATA-DICTIONARY.md, 23-SEED-AND-CATALOGS.md, 26-RELEASE-CHECKLIST.md, 28-PRE-IMPLEMENTATION-CHECKLIST.md, features/AUTH.md, features/ORGANIZATIONS.md, features/ROPA.md.

---

# DEC-038 — Acesso explícito a múltiplas áreas

**Status:** DECIDED  
**Decision Date:** 2026-09-18

## Related Questions

AUTHQ-008.

## Context

Lote Foundation → Identity/Tenant, aprovado expressamente pelo usuário.

## Decision

Acesso a múltiplas Business Units deve ser explicitamente concedido no contexto do Membership e de cada RoleAssignment. Scope ORGANIZATION alcança a organização inteira. Não assumir herança automática pela hierarquia. OWN e PLATFORM não estão aprovados.

## Rationale

Registrar a alternativa expressamente aprovada, preservando os limites da primeira entrega e as pendências não respondidas.

## Consequences

Não implementar nesta etapa. Aplicar o modelo conceitual aprovado e respeitar as questões específicas ainda abertas. 

## Affected Documents

12-OPEN-QUESTIONS.md, 00-PROJECT.md, 01-ARCHITECTURE.md, 02-DOMAIN.md, 03-DATABASE.md, 04-AUTHORIZATION.md, 07-API.md, 08-FRONTEND.md, 09-SECURITY.md, 11-TESTING.md, 14-IMPLEMENTATION-PLAN.md, 15-BACKLOG.md, 17-ENVIRONMENTS-AND-DEPLOYMENT.md, 20-API-CONTRACTS.md, 21-DATA-DICTIONARY.md, 23-SEED-AND-CATALOGS.md, 26-RELEASE-CHECKLIST.md, 28-PRE-IMPLEMENTATION-CHECKLIST.md, features/AUTH.md, features/ORGANIZATIONS.md, features/ROPA.md.

---

# DEC-039 — Leitura na primeira entrega

**Status:** DECIDED  
**Decision Date:** 2026-09-18

## Related Questions

AUTHQ-004.

## Context

Lote Foundation → Identity/Tenant, aprovado expressamente pelo usuário.

## Decision

Somente para a primeira entrega: COLLABORATOR lê Activities das Business Units autorizadas e não possui inicialmente leitura do ROPA; MANAGER lê Activities e ROPA das Business Units autorizadas; DPO lê Activities e ROPA de toda a Organization do Membership. Não inferir edição, Submit, aprovação, Gate ou publicação. Dashboard, Systems e Suppliers permanecem pendentes; esta matriz não é exclusão dessas features da V1.

## Rationale

Registrar a alternativa expressamente aprovada, preservando os limites da primeira entrega e as pendências não respondidas.

## Consequences

Não implementar nesta etapa. Aplicar o modelo conceitual aprovado e respeitar as questões específicas ainda abertas. AUTHQ-004 permanece IN_ANALYSIS para leitura de recursos fora da primeira entrega.

## Affected Documents

12-OPEN-QUESTIONS.md, 00-PROJECT.md, 01-ARCHITECTURE.md, 02-DOMAIN.md, 03-DATABASE.md, 04-AUTHORIZATION.md, 07-API.md, 08-FRONTEND.md, 09-SECURITY.md, 11-TESTING.md, 14-IMPLEMENTATION-PLAN.md, 15-BACKLOG.md, 17-ENVIRONMENTS-AND-DEPLOYMENT.md, 20-API-CONTRACTS.md, 21-DATA-DICTIONARY.md, 23-SEED-AND-CATALOGS.md, 26-RELEASE-CHECKLIST.md, 28-PRE-IMPLEMENTATION-CHECKLIST.md, features/AUTH.md, features/ORGANIZATIONS.md, features/ROPA.md.

---

# DEC-040 — Autenticação OIDC com provedor gerenciado

**Status:** DECIDED  
**Decision Date:** 2026-09-18

## Related Questions

SECQ-001.

## Context

Lote Foundation → Identity/Tenant, aprovado expressamente pelo usuário.

## Decision

Autenticação delegada por OIDC com provedor gerenciado. O fornecedor ainda não foi escolhido; Auth0 é somente candidato. User interno é independente do fornecedor; vincular identidades externas conforme protocolo/provedor, sem união automática por e-mail. Login bem-sucedido não concede Membership ou papel.

## Rationale

Registrar a alternativa expressamente aprovada, preservando os limites da primeira entrega e as pendências não respondidas.

## Consequences

Não implementar nesta etapa. Aplicar o modelo conceitual aprovado e respeitar as questões específicas ainda abertas. SECQ-001 permanece IN_ANALYSIS exclusivamente para escolha do fornecedor.

## Affected Documents

12-OPEN-QUESTIONS.md, 00-PROJECT.md, 01-ARCHITECTURE.md, 02-DOMAIN.md, 03-DATABASE.md, 04-AUTHORIZATION.md, 07-API.md, 08-FRONTEND.md, 09-SECURITY.md, 11-TESTING.md, 14-IMPLEMENTATION-PLAN.md, 15-BACKLOG.md, 17-ENVIRONMENTS-AND-DEPLOYMENT.md, 20-API-CONTRACTS.md, 21-DATA-DICTIONARY.md, 23-SEED-AND-CATALOGS.md, 26-RELEASE-CHECKLIST.md, 28-PRE-IMPLEMENTATION-CHECKLIST.md, features/AUTH.md, features/ORGANIZATIONS.md, features/ROPA.md.

---

# DEC-041 — SSO corporativo posterior na V1

**Status:** DECIDED  
**Decision Date:** 2026-09-18

## Related Questions

AUTHQ-010.

## Context

Lote Foundation → Identity/Tenant, aprovado expressamente pelo usuário.

## Decision

SSO corporativo não é requisito da primeira entrega, mas deverá fazer parte da V1 posteriormente. Preparar a arquitetura sem implementar configuração completa de SSO agora.

## Rationale

Registrar a alternativa expressamente aprovada, preservando os limites da primeira entrega e as pendências não respondidas.

## Consequences

Não implementar nesta etapa. Aplicar o modelo conceitual aprovado e respeitar as questões específicas ainda abertas. 

## Affected Documents

12-OPEN-QUESTIONS.md, 00-PROJECT.md, 01-ARCHITECTURE.md, 02-DOMAIN.md, 03-DATABASE.md, 04-AUTHORIZATION.md, 07-API.md, 08-FRONTEND.md, 09-SECURITY.md, 11-TESTING.md, 14-IMPLEMENTATION-PLAN.md, 15-BACKLOG.md, 17-ENVIRONMENTS-AND-DEPLOYMENT.md, 20-API-CONTRACTS.md, 21-DATA-DICTIONARY.md, 23-SEED-AND-CATALOGS.md, 26-RELEASE-CHECKLIST.md, 28-PRE-IMPLEMENTATION-CHECKLIST.md, features/AUTH.md, features/ORGANIZATIONS.md, features/ROPA.md.

---

# DEC-042 — Sessão server-side com cookie opaco

**Status:** DECIDED  
**Decision Date:** 2026-09-18

## Related Questions

SECQ-002; APIQ-002 (transporte integralmente coberto).

## Context

Lote Foundation → Identity/Tenant, aprovado expressamente pelo usuário.

## Decision

Sessão server-side com cookie opaco. Frontend não administra tokens de autenticação. Backend consulta autorização atual, sem roles/memberships congelados na sessão. Expiração, renovação e revogação detalhadas permanecem em SECQ-004.

## Rationale

Registrar a alternativa expressamente aprovada, preservando os limites da primeira entrega e as pendências não respondidas.

## Consequences

Não implementar nesta etapa. Aplicar o modelo conceitual aprovado e respeitar as questões específicas ainda abertas. 

## Affected Documents

12-OPEN-QUESTIONS.md, 00-PROJECT.md, 01-ARCHITECTURE.md, 02-DOMAIN.md, 03-DATABASE.md, 04-AUTHORIZATION.md, 07-API.md, 08-FRONTEND.md, 09-SECURITY.md, 11-TESTING.md, 14-IMPLEMENTATION-PLAN.md, 15-BACKLOG.md, 17-ENVIRONMENTS-AND-DEPLOYMENT.md, 20-API-CONTRACTS.md, 21-DATA-DICTIONARY.md, 23-SEED-AND-CATALOGS.md, 26-RELEASE-CHECKLIST.md, 28-PRE-IMPLEMENTATION-CHECKLIST.md, features/AUTH.md, features/ORGANIZATIONS.md, features/ROPA.md.

---

# DEC-043 — Contexto explícito de organização por request

**Status:** DECIDED  
**Decision Date:** 2026-09-18

## Related Questions

APIQ-020.

## Context

Lote Foundation → Identity/Tenant, aprovado expressamente pelo usuário.

## Decision

A sessão identifica User. Cada request identifica explicitamente a Organization pretendida, apenas como solicitação de contexto. Backend valida Membership ativo, permission e scope antes do caso de uso, além das restrições específicas aplicáveis. Recursos não mudam de tenant por campos enviados no body. A forma HTTP concreta permanece para o slice.

## Rationale

Registrar a alternativa expressamente aprovada, preservando os limites da primeira entrega e as pendências não respondidas.

## Consequences

Não implementar nesta etapa. Aplicar o modelo conceitual aprovado e respeitar as questões específicas ainda abertas. 

## Affected Documents

12-OPEN-QUESTIONS.md, 00-PROJECT.md, 01-ARCHITECTURE.md, 02-DOMAIN.md, 03-DATABASE.md, 04-AUTHORIZATION.md, 07-API.md, 08-FRONTEND.md, 09-SECURITY.md, 11-TESTING.md, 14-IMPLEMENTATION-PLAN.md, 15-BACKLOG.md, 17-ENVIRONMENTS-AND-DEPLOYMENT.md, 20-API-CONTRACTS.md, 21-DATA-DICTIONARY.md, 23-SEED-AND-CATALOGS.md, 26-RELEASE-CHECKLIST.md, 28-PRE-IMPLEMENTATION-CHECKLIST.md, features/AUTH.md, features/ORGANIZATIONS.md, features/ROPA.md.

---

# DEC-044 — Drizzle como ORM e query builder

**Status:** DECIDED  
**Decision Date:** 2026-09-18

## Related Questions

DBQ-001.

## Context

Menor lote estrutural de persistência Identity/Tenant, aprovado expressamente pelo usuário sobre o modelo DEC-034 a DEC-043.

## Decision

Adotar Drizzle como ORM/query builder. PostgreSQL é a fonte das garantias estruturais: não simplificar constraints, índices ou policies para acomodar o ORM. SQL PostgreSQL específico pode ser usado quando necessário, parametrizado, localizado e versionado. Migrations são versionadas, revisáveis e reproduzíveis desde banco vazio. Queries ficam encapsuladas em repository/persistence.

## Rationale

Aprovação expressa do usuário: manter transparência das garantias PostgreSQL, integridade independente da aplicação e defesa adicional contra filtros de tenant omitidos.

## Consequences

Aplicar a escolha à persistência sem decidir regras funcionais ou implementar nesta etapa.

## Affected Documents

AGENTS.md, 12-OPEN-QUESTIONS.md, 01-ARCHITECTURE.md, 03-DATABASE.md, 07-API.md, 09-SECURITY.md, 11-TESTING.md, 14-IMPLEMENTATION-PLAN.md, 15-BACKLOG.md, 16-CODING-STANDARDS.md, 20-API-CONTRACTS.md, 21-DATA-DICTIONARY.md, 26-RELEASE-CHECKLIST.md, 27-AI-DEVELOPMENT-GUIDE.md, 28-PRE-IMPLEMENTATION-CHECKLIST.md, features/ORGANIZATIONS.md.

---

# DEC-045 — Validação da aplicação e integridade composta

**Status:** DECIDED  
**Decision Date:** 2026-09-18

## Related Questions

DBQ-008.

## Context

Menor lote estrutural de persistência Identity/Tenant, aprovado expressamente pelo usuário sobre o modelo DEC-034 a DEC-043.

## Decision

Aplicação valida relações e autorização para erros compreensíveis; PostgreSQL também impede estruturalmente relações tenant-bound entre Organizations. Carregar organization_id em filhos e associações quando necessário à coerência. Utilizar, quando aplicável, organization_id NOT NULL, unicidades e FKs compostas, índices apropriados e checks declarativos. FK simples por UUID não basta quando é preciso garantir mesmo tenant. organization_id vem do contexto autorizado e não move recursos livremente entre tenants. Não usar triggers quando constraint declarativa simples representar a mesma invariante.

## Rationale

Aprovação expressa do usuário: manter transparência das garantias PostgreSQL, integridade independente da aplicação e defesa adicional contra filtros de tenant omitidos.

## Consequences

Aplicar a escolha à persistência sem decidir regras funcionais ou implementar nesta etapa.

## Affected Documents

AGENTS.md, 12-OPEN-QUESTIONS.md, 01-ARCHITECTURE.md, 03-DATABASE.md, 07-API.md, 09-SECURITY.md, 11-TESTING.md, 14-IMPLEMENTATION-PLAN.md, 15-BACKLOG.md, 16-CODING-STANDARDS.md, 20-API-CONTRACTS.md, 21-DATA-DICTIONARY.md, 26-RELEASE-CHECKLIST.md, 27-AI-DEVELOPMENT-GUIDE.md, 28-PRE-IMPLEMENTATION-CHECKLIST.md, features/ORGANIZATIONS.md.

---

# DEC-046 — RLS adicional e contexto local à transação

**Status:** DECIDED  
**Decision Date:** 2026-09-18

## Related Questions

DBQ-009.

## Context

Menor lote estrutural de persistência Identity/Tenant, aprovado expressamente pelo usuário sobre o modelo DEC-034 a DEC-043.

## Decision

Adotar PostgreSQL RLS como defesa adicional nas tabelas tenant-bound. Não substitui Membership, Permission, Scope, filtros tenant-aware, constraints ou regras de negócio; autorização funcional permanece na aplicação. Contexto da Organization é local à transação; ausência de contexto nega acesso. Todas as queries tenant-bound da operação usam o mesmo contexto transacional. Não persistir tenant na conexão; considerar pooling. Runtime não é superuser, não possui BYPASSRLS, não é proprietário das tabelas protegidas nem altera policies; FORCE ROW LEVEL SECURITY quando adequado ao modelo aprovado. Migrations utilizam credencial separada. Entidades globais não recebem organization_id artificial. Proteção de User, ExternalIdentity e Session será definida posteriormente. Descoberta dos próprios Memberships exige tratamento específico e restrito, sem policy irrestrita.

## Rationale

Aprovação expressa do usuário: manter transparência das garantias PostgreSQL, integridade independente da aplicação e defesa adicional contra filtros de tenant omitidos.

## Consequences

Aplicar os testes obrigatórios abaixo ao implementar a infraestrutura. Proteção das entidades globais e descoberta restrita de Memberships ainda precisam de desenho específico; não criar bypass genérico.

### Testes obrigatórios de infraestrutura tenant-aware

Executar com PostgreSQL real e credencial equivalente à de runtime:

1. Contexto A não lê linhas da B.
2. Contexto A não altera/exclui linhas da B.
3. Relação A → recurso B é rejeitada pelas constraints.
4. Query tenant-bound sem filtro explícito permanece limitada pelo RLS.
5. Ausência de contexto nega acesso tenant-bound.
6. Reutilização de conexão não conserva tenant anterior.
7. Commit e rollback não vazam contexto.
8. Runtime não consegue bypassar RLS.
9. Constraints protegem relações mesmo com validação da aplicação omitida no teste.
10. Scope de Business Unit permanece responsabilidade da autorização da aplicação, distinto do isolamento de tenant.

## Affected Documents

AGENTS.md, 12-OPEN-QUESTIONS.md, 01-ARCHITECTURE.md, 03-DATABASE.md, 07-API.md, 09-SECURITY.md, 11-TESTING.md, 14-IMPLEMENTATION-PLAN.md, 15-BACKLOG.md, 16-CODING-STANDARDS.md, 20-API-CONTRACTS.md, 21-DATA-DICTIONARY.md, 26-RELEASE-CHECKLIST.md, 27-AI-DEVELOPMENT-GUIDE.md, 28-PRE-IMPLEMENTATION-CHECKLIST.md, features/ORGANIZATIONS.md.

---

# DEC-047 — Vitest como runner de testes do backend

**Status:** DECIDED
**Decision Date:** 2026-09-18

## Related Questions

TESTQ-011.

## Context

Aprovação expressa do usuário da alternativa A, após análise documental do runner backend. Slice 1 concluído; nenhuma implementação autorizada por esta atualização.

## Decision

Vitest será o runner de testes do backend, para testes unitários e de integração. A configuração própria do backend deve respeitar NestJS, ESM/NodeNext, TypeScript e a injeção de dependências.

## Rationale

Consistência com a direção documental e ausência de necessidade identificada para introduzir outro runner.

## Consequences

A configuração será implementada em etapa posterior. O runner não substitui PostgreSQL real nos testes de comportamento específico do banco e não escolhe ferramentas de frontend/E2E, cobertura ou CI.

## Affected Documents

12-OPEN-QUESTIONS.md, 13-DECISIONS.md, 11-TESTING.md, 14-IMPLEMENTATION-PLAN.md.

---

# DEC-048 — Estratégia híbrida de isolamento/reset dos testes de persistência

**Status:** DECIDED
**Decision Date:** 2026-09-18

## Related Questions

TESTQ-012. Dependências: DEC-045 e DEC-046; TESTQ-001 permanece OPEN.

## Context

Aprovação expressa do usuário da alternativa D para permitir isolamento previsível sem esconder o ciclo real das transações e conexões.

## Decision

Adotar estratégia híbrida de isolamento/reset dos testes de persistência:

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

## Rationale

Combinar estado previsível entre testes com validação real de constraints, RLS, transações e reutilização do pool, sem usar rollback externo ou descarte de conexão para esconder o comportamento avaliado.

## Consequences

Os dez cenários de isolamento/integridade derivados de DEC-045 e DEC-046 continuam obrigatórios:

1. Tenant A não lê dados do tenant B.
2. Tenant A não atualiza dados do tenant B.
3. Tenant A não exclui dados do tenant B.
4. Relacionamento cross-tenant é rejeitado pelo PostgreSQL.
5. Consulta sem filtro de tenant continua restrita pelo RLS.
6. Ausência de contexto de tenant resulta em acesso negado.
7. Reutilização de conexão do pool não vaza contexto de tenant.
8. Commit/rollback não deixa contexto residual.
9. Role runtime não consegue contornar RLS.
10. Constraints protegem integridade sem validação prévia da aplicação.

O scope de Business Unit continua sendo responsabilidade da autorização da aplicação, conforme DEC-046; esta decisão não remove esse requisito.

A infraestrutura será implementada em etapa posterior. TESTQ-001 permanece OPEN. Não escolhe Testcontainers, Docker em CI, fornecedor de CI, Playwright/E2E, cobertura ou paralelização futura. Recriação de schema não equivale ao isolamento completo de um banco, nem substitui o banco exclusivo de testes por execução.

## Affected Documents

12-OPEN-QUESTIONS.md, 13-DECISIONS.md, 11-TESTING.md.

---

# DEC-049 — Role como catálogo global da plataforma

**Status:** DECIDED
**Decision Date:** 2026-09-18

## Related Questions

DBQ-005, exclusivamente quanto a Role. DBQ-005 permanece OPEN para os demais catálogos.

## Context

Aprovação humana expressa após a auditoria do Slice 2.

## Decision

Role é catálogo global da plataforma, sem organization_id. Seu code é globalmente único, estável e não pode ser criado ou redefinido por Organizations. RoleAssignment concede Role no contexto de Membership; o contexto tenant continua vindo de Membership/Organization. Scope e BusinessUnits pertencem à concessão, não à definição global de Role.

## Rationale

Separar a definição estrutural compartilhada do papel de sua concessão independente em cada organização.

## Consequences

Esta decisão não resolve catálogo definitivo de roles, papel ADMIN, PLATFORM, OWN, matriz definitiva de permissions, custom roles, administração de roles pelo tenant, hierarquia de roles ou autorização funcional futura. Papéis concretos e permissões continuam sujeitos às respectivas Decisions/Open Questions. Não implica grants runtime para Role neste slice.

## Affected Documents

12-OPEN-QUESTIONS.md, 13-DECISIONS.md, 03-DATABASE.md, 21-DATA-DICTIONARY.md, 23-SEED-AND-CATALOGS.md, 11-TESTING.md, ../README.md.

---

# 14. Resumo das decisões

| ID | Decisão |
|---|---|
| DEC-001 | Modular Monolith |
| DEC-002 | REST `/api/v1` |
| DEC-003 | PostgreSQL |
| DEC-004 | UUID |
| DEC-005 | Backend como autoridade |
| DEC-006 | Compliance Gate estruturado |
| DEC-007 | ActivityStatus separado de ComplianceStatus |
| DEC-008 | ROPA como projeção |
| DEC-009 | System como entidade |
| DEC-010 | Supplier como entidade |
| DEC-011 | MappingStatus para Systems/Suppliers |
| DEC-012 | Quick Create persistente |
| DEC-013 | Não armazenar titulares reais |
| DEC-014 | Preservar versões históricas |
| DEC-015 | AuditLog ≠ ActivityVersion |
| DEC-016 | AuditLog append-only |
| DEC-017 | Arquivos privados |
| DEC-018 | Tenant derivado do contexto |
| DEC-019 | Proibir relações cross-tenant |
| DEC-020 | Preservar recursos históricos |
| DEC-021 | Dashboard como Read Model |
| DEC-022 | Dashboard não é certificação |
| DEC-023 | Gate COMPLETE não é certificação |
| DEC-024 | Sensíveis/menores não são FAIL automático |
| DEC-025 | Transferência internacional explícita |
| DEC-026 | Consentimento individual fora da V1 |
| DEC-027 | Wizard sobre Activity persistida |
| DEC-028 | Draft pode ser incompleto |
| DEC-029 | Códigos estáveis para operações |
| DEC-030 | Transições por operações semânticas |
| DEC-031 | Controle exclusivamente interno de pendências na V1 |
| DEC-032 | Branding separado de domínio próprio; sem inclusão na V1 |
| DEC-033 | Antiguidade separada de disparo de notificações |
| DEC-034 | SaaS multi-tenant e fronteira Organization |
| DEC-035 | Identidade global e memberships independentes |
| DEC-036 | Papéis concedidos pelo Membership |
| DEC-037 | Múltiplas concessões com scope preservado |
| DEC-038 | Acesso explícito a múltiplas áreas |
| DEC-039 | Leitura na primeira entrega |
| DEC-040 | Autenticação OIDC com provedor gerenciado |
| DEC-041 | SSO corporativo posterior na V1 |
| DEC-042 | Sessão server-side com cookie opaco |
| DEC-043 | Contexto explícito de organização por request |
| DEC-044 | Drizzle como ORM e query builder |
| DEC-045 | Validação da aplicação e integridade composta |
| DEC-046 | RLS adicional e contexto local à transação |
| DEC-047 | Vitest como runner de testes do backend |
| DEC-048 | Estratégia híbrida de isolamento/reset dos testes de persistência |
| DEC-049 | Role como catálogo global da plataforma |

---

# 15. Atenção

As decisões acima não resolvem as questões que permanecem abertas em:

```text
12-OPEN-QUESTIONS.md
```

Exemplo:

```text
DEC-006
```

decide que o Compliance Gate é estruturado.

Mas não decide:

```text
quem resolve REVIEW_REQUIRED

quando FAIL gera BLOCKED

quando o Gate executa

como ComplianceRun é versionado
```

Esses pontos continuam abertos.

---

# 16. Regra para agentes de IA

Antes de implementar:

```text
AGENTS.md
↓
13-DECISIONS.md
↓
12-OPEN-QUESTIONS.md
↓
documentos da feature
↓
código
```

---

# 17. Precedência

Quando houver conflito entre:

```text
recomendação antiga
```

e:

```text
DECIDED
```

a decisão registrada deve prevalecer.

---

# 18. Não inferir decisão

A ausência de uma decisão neste documento não significa:

```text
"pode escolher qualquer opção"
```

Verificar:

```text
12-OPEN-QUESTIONS.md
```

---

# 19. Nova decisão

Quando uma decisão for tomada:

```text
1. identificar Open Question

2. registrar DEC-XXX

3. marcar Open Question como DECIDED

4. atualizar documentos afetados

5. atualizar schema/API se necessário

6. atualizar testes

7. somente então implementar
```

---

# 20. Definition of Done de uma decisão

```text
[ ] decisão registrada

[ ] rationale registrada

[ ] consequências identificadas

[ ] Open Question atualizada

[ ] documentos afetados identificados

[ ] documentação funcional atualizada

[ ] arquitetura atualizada quando necessário

[ ] database atualizado quando necessário

[ ] API atualizada quando necessário

[ ] frontend atualizado quando necessário

[ ] testes atualizados quando necessário
```

---

# 21. Próximo passo

A documentação já possui:

```text
Project

Architecture

Domain

Database

Authorization

Business Rules

Workflows

API

Frontend

Security

Audit

Testing

Open Questions

Decisions

Feature Specifications
```

O próximo documento recomendado para desenvolvimento assistido por IA é:

```text
docs/14-IMPLEMENTATION-PLAN.md
```

Ele deve transformar as especificações em uma ordem segura de implementação:

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

Cada fase deve possuir:

```text
dependencies

deliverables

blocked decisions

backend tasks

frontend tasks

database tasks

tests

Definition of Done
```