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

# DEC-050 — Provisionamento controlado de identidade no D1

**Status:** DECIDED
**Decision Date:** 2026-09-18

## Related Questions

SECQ-001 e ORGQ-004, somente quanto à delimitação do login e do provisionamento no D1. A escolha do fornecedor OIDC e o mecanismo de criação de Organization permanecem pendentes. A decisão também delimita a lacuna de provisionamento/vinculação de identidade identificada na análise do Slice 3, sem Question ID específico.

## Context

Aprovação humana expressa para o Slice 3, antes da implementação da fundação de autenticação e contexto da requisição necessária ao D1.

## Decision

No D1, usuários com acesso à aplicação são provisionados de forma controlada. User, ExternalIdentity, Membership e as concessões necessárias existem antes do login.

A autenticação OIDC identifica a ExternalIdentity pela combinação validada de issuer + subject e resolve o User interno correspondente.

O login não cria automaticamente User, Membership, RoleAssignment ou Organization, não concede acesso a BusinessUnit e não realiza associação automática por e-mail. O e-mail não é chave de identidade e não pode ser usado para associação automática entre uma identidade OIDC e um User.

## Rationale

Separar a autenticação da identidade externa do provisionamento dos vínculos e concessões de acesso, preservando o modelo de Identity/Tenant aprovado.

## Consequences

Signup público, fluxo completo de convites, account linking self-service e merge automático de contas permanecem fora deste Slice. Essa delimitação não exclui essas capacidades da V1 por si só.

A decisão não escolhe fornecedor OIDC, mecanismo operacional de provisionamento, política de nome/e-mail/claims, lifecycle de Session ou proteção/bootstrap das tabelas globais. SECQ-001 permanece IN_ANALYSIS e ORGQ-004 permanece OPEN. Nenhuma implementação é autorizada nesta etapa.

## Affected Documents

12-OPEN-QUESTIONS.md, 13-DECISIONS.md.

---

# DEC-051 — Identidade externa e perfil no D1

**Status:** DECIDED
**Decision Date:** 2026-09-18

## Related Questions

SECQ-001, somente quanto à identidade externa e aos atributos de perfil no D1. O fornecedor gerenciado continua pendente. A decisão responde às lacunas de chave, unicidade, vínculo e tratamento de claims de perfil identificadas na análise do Slice 3, sem criar novos Question IDs. Complementa DEC-040 e DEC-050.

## Context

Aprovação humana expressa para o Slice 3, antes da implementação de ExternalIdentity e da autenticação necessária ao D1.

## Decision

ExternalIdentity representa a identidade autenticada externa vinculada a um User global interno. A chave estável é a combinação issuer + subject, com unicidade global UNIQUE (issuer, subject): a mesma identidade externa não pode estar vinculada a dois Users.

ExternalIdentity possui, no mínimo conceitualmente, id, userId, issuer, subject, createdAt e updatedAt, se coerente com o padrão estrutural existente. Esta decisão não autoriza implementação de schema ou migration.

Nome e e-mail não são chaves de identidade. O sistema não pode localizar User por e-mail e vinculá-lo automaticamente, fundir contas por e-mail, alterar o vínculo de ExternalIdentity por mudança de e-mail ou conceder Membership, RoleAssignment ou qualquer autorização com base em e-mail ou email_verified.

No D1, os dados necessários do User, incluindo nome/e-mail exigidos pelo modelo interno atual, são fornecidos pelo provisionamento controlado da DEC-050. Claims OIDC name, email e email_verified são atributos de perfil/claims externos, não autoridade de identidade ou autorização.

Não haverá sincronização automática de name/email do User a cada login. A ausência desses claims não impede a autenticação de uma ExternalIdentity previamente provisionada e válida. Mudança de e-mail no IdP não altera a identidade interna nem o vínculo ExternalIdentity → User.

O modelo pode permitir múltiplas ExternalIdentities para um User. Isso não aprova o fluxo de vinculação de uma segunda identidade.

## Rationale

Preservar a identidade interna e os vínculos de acesso independentemente dos atributos de perfil externos, usando a chave estável issuer + subject e o provisionamento controlado aprovado.

## Consequences

Criação self-service de identidade adicional, account linking, merge de contas, fluxo para vincular uma segunda identidade e política administrativa definitiva para esses casos permanecem fora do Slice 3.

A decisão não resolve provider OIDC, MFA, lifecycle global/disable de User, lifecycle de Session, armazenamento de tokens do IdP, proteção/bootstrap das tabelas globais, onboarding administrativo definitivo ou atualização administrativa de perfil. SECQ-001 permanece IN_ANALYSIS; nenhuma implementação é autorizada nesta etapa.

## Affected Documents

12-OPEN-QUESTIONS.md, 13-DECISIONS.md, features/AUTH.md.

---

# DEC-052 — Bootstrap restrito de contexto tenant

**Status:** DECIDED
**Decision Date:** 2026-09-20

## Related Questions

APIQ-020 e DBQ-009, quanto à separação entre Organization solicitada e autorizada e ao bootstrap restrito antes do contexto RLS. Complementa DEC-043, DEC-045 e DEC-046, sem alterar suas garantias. O mecanismo SQL concreto não possui decisão registrada.

## Context

A autenticação parte de identidade global; Membership é tenant-bound e protegida por RLS. O organizationId informado pelo cliente ainda não comprova autorização para estabelecer o contexto tenant.

## Decision

Estabelecer o contexto em duas fases. Na fase de identidade/bootstrap: validar Session, identificar o User, receber a Organization explicitamente solicitada como requestedOrganizationId e consultar, de forma específica e restrita ao authenticatedUserId e requestedOrganizationId, somente a Membership própria correspondente ou sua ausência. A consulta deve confirmar que a Membership existe, liga esse User à Organization solicitada e está ativa. Ausência ou inatividade não estabelece tenant autorizado; resultado negativo não pode enumerar Memberships ou Organizations de terceiros.

Somente na fase seguinte a Organization validada torna-se authorizedOrganizationId. Operações tenant-bound usam withTenant(authorizedOrganizationId), permanecem sob RLS e carregam RoleAssignments e associações com BusinessUnits somente dentro do contexto tenant apropriado. Troca de Organization entre requests repete a validação; não herda autorização da request anterior. Session não congela Membership, RoleAssignments ou scopes como fonte definitiva de autorização: o backend consulta/valida o estado atual.

Não criar API genérica de runtime/repository para listAllMemberships(), busca por Organization sem User autenticado, leitura irrestrita de Memberships ou escolha de Membership pelo cliente sem validação do User. User, ExternalIdentity e Session são globais, mas isso não autoriza acesso irrestrito do runtime; privilégios concretos devem seguir least privilege e limitar-se às operações de autenticação/sessão necessárias.

Não usar migration credentials em requests normais, credencial administrativa global genérica, bypass genérico de RLS, SUPERUSER, BYPASSRLS, ownership de tabelas protegidas pelo runtime, grants amplos ou desabilitação de RLS/FORCE RLS. A credencial de migration permanece separada do runtime.

## Rationale

Impedir que um contexto solicitado pelo cliente seja elevado a tenant autorizado antes da confirmação restrita da Membership, mantendo a defesa em camadas de DEC-045 e DEC-046.

## Consequences

A solução PostgreSQL concreta para o bootstrap ainda precisa ser desenhada de modo compatível com constraints tenant-aware, FORCE RLS, runtime restrito e least privilege. Esta decisão aprova boundary e propriedades de segurança, não escolhe SQL, SECURITY DEFINER ou alternativa, grants específicos, lifecycle de User/Session, provider OIDC, MFA, transporte HTTP de requestedOrganizationId, endpoint de descoberta das próprias Organizations, permission matrix, ADMIN/PLATFORM_ADMIN ou cache de autorização. Não autoriza schema, migration, grants, policies, repositories ou endpoints nesta etapa.

## Implementation Status — S3.2

A S3.2 implementou somente a fundação PostgreSQL necessária à fase restrita de resolução de Membership: `auth_private.resolve_membership` e seu repository retornam membershipId + organizationId para a Membership ativa do par exato User + Organization. A autenticação HTTP, a resolução de Session no request, a produção de authenticatedUserId, o transporte de requestedOrganizationId, o AuthenticatedContext completo e a autorização por RoleAssignment/BusinessUnit continuam não implementados.

## Affected Documents

12-OPEN-QUESTIONS.md, 13-DECISIONS.md, 03-DATABASE.md, 09-SECURITY.md, features/AUTH.md, features/ORGANIZATIONS.md.

---

# DEC-053 — Lifecycle da Session

**Status:** DECIDED
**Decision Date:** 2026-09-20

## Related Questions

SECQ-004 (cobertura parcial), SECQ-002 e APIQ-002. Complementa DEC-042 e DEC-052.

## Context

A sessão server-side com cookie opaco já foi aprovada, mas seu modelo de expiração e revogação precisava de limites estruturais para o Slice 3.

## Decision

Session é global e vinculada ao User. O navegador recebe somente segredo opaco criptograficamente imprevisível; o valor bruto não é persistido. Persistir representação não reversível apropriada para validar o segredo recebido. Session representa ao menos id interno, userId, representação protegida do token, createdAt, expiresAt e informação suficiente para revogação. Possui expiração absoluta e modelo capaz de suportar expiração por inatividade; durações concretas são configuráveis, não regra imutável de domínio.

Um User pode ter múltiplas sessões simultâneas. Logout normal revoga somente a sessão atual; a arquitetura permite revogar todas as sessões de um User em caso futuro administrativo/de segurança. Sessão expirada ou revogada não autentica. Membership, RoleAssignments, scopes e permissions não ficam congelados na Session como autoridade definitiva. Session da aplicação é distinta dos tokens OIDC do IdP.

## Rationale

Permitir revogação e reavaliação da autorização atual sem persistir o segredo de sessão em claro nem acoplar a sessão da aplicação ao IdP.

## Consequences

Permanecem abertos os tempos concretos, frequência de atualização de lastSeenAt, algoritmo de digest, armazenamento de tokens do IdP, lifecycle global/disable de User, UI de gestão de sessões e logout global do IdP. O endpoint/UI de revogação geral fica fora deste Slice. Não autoriza implementação nesta etapa.

## Affected Documents

12-OPEN-QUESTIONS.md, 13-DECISIONS.md, 03-DATABASE.md, 09-SECURITY.md, 11-TESTING.md, features/AUTH.md, features/ORGANIZATIONS.md.

---

# DEC-054 — Organization explícita via header

**Status:** DECIDED
**Decision Date:** 2026-09-20

## Related Questions

APIQ-020. Complementa DEC-043 e DEC-052.

## Context

DEC-043 exige seleção explícita por request e DEC-052 distingue Organization solicitada da autorizada; faltava definir o transporte HTTP.

## Decision

Requests tenant-bound enviam `X-Organization-Id`, cujo valor é apenas requestedOrganizationId. O backend valida a Membership própria ativa conforme DEC-052 antes de estabelecer AuthenticatedContext tenant. Ausência do header em endpoint tenant-bound rejeita o request conforme o contrato HTTP a implementar. Endpoints globais anteriores ao contexto tenant, como início do login, callback OIDC, identificação da sessão independente de tenant e logout da sessão atual, não exigem o header.

Não selecionar implicitamente a última Organization utilizada; Session não guarda Organization atual como autoridade. Requests concorrentes do mesmo User podem solicitar Organizations diferentes, com validação independente. Subdomain, query parameter, body e session state não são o mecanismo principal neste Slice.

## Rationale

O contexto fica explícito em cada request sem confundir o valor fornecido pelo cliente com autorização validada pelo backend.

## Consequences

Custom domains e detalhes secundários do contrato HTTP permanecem fora desta decisão. Não autoriza implementação nesta etapa.

## Affected Documents

12-OPEN-QUESTIONS.md, 13-DECISIONS.md, 07-API.md, 09-SECURITY.md, 11-TESTING.md, features/AUTH.md, features/ORGANIZATIONS.md.

---

# DEC-055 — Cookie de sessão e baseline CSRF

**Status:** DECIDED
**Decision Date:** 2026-09-20

## Related Questions

SECQ-002 e APIQ-002; complementa DEC-042 e DEC-053.

## Context

O transporte por cookie foi aprovado; faltavam as propriedades mínimas do cookie e a proteção das operações mutáveis.

## Decision

O segredo opaco da Session é transportado por cookie `HttpOnly`, `Path=/`, `SameSite=Lax` e `Secure` em HTTPS/produção. Não configurar `Domain` amplo sem necessidade arquitetural explícita. Frontend não armazena o identificador em localStorage, sessionStorage ou estado persistente acessível por JavaScript; tokens OIDC não são o mecanismo de autenticação exposto ao frontend.

Após autenticação bem-sucedida, criar nova Session com novo segredo, sem reutilizar identificador controlado pelo cliente. Logout invalida primeiro a Session server-side e depois expira/remove o cookie. SameSite sozinho não basta contra CSRF: operações mutáveis autenticadas por cookie exigem proteção explícita, com validação de origem confiável e mecanismo CSRF apropriado. A técnica concreta fica para desenho técnico sem reduzir essas garantias. CORS com credentials não usa origem wildcard `*`. Não registrar cookies, authorization codes, tokens OIDC, session secrets ou outros secrets em logs.

## Rationale

Reduzir exposição do segredo, fixação de sessão e CSRF no transporte aprovado por DEC-042.

## Consequences

Custom domains, SSO corporativo, política completa de CORS de produção, rate limiting distribuído e provider OIDC não são decididos aqui. Não autoriza implementação nesta etapa.

## Affected Documents

12-OPEN-QUESTIONS.md, 13-DECISIONS.md, 07-API.md, 09-SECURITY.md, 11-TESTING.md, features/AUTH.md, features/ORGANIZATIONS.md.

---

# DEC-056 — Bootstrap PostgreSQL restrito de Membership

**Status:** DECIDED
**Decision Date:** 2026-09-20

## Related Questions

DBQ-009 e APIQ-020 já decididas; concretiza o bootstrap de DEC-052 sem alterar DEC-045/046 ou encerrar questões parcialmente relacionadas.

## Context

Membership é tenant-bound e tem ENABLE/FORCE RLS. O backend precisa confirmar a Membership própria ativa antes de transformar a Organization solicitada em contexto tenant autorizado. A policy tenant normal atual de `memberships` é implicitamente aplicável a PUBLIC; o runtime possui grants tenant normais, mas não pode obter leitura irrestrita no bootstrap.

## Decision

Implementar o bootstrap por função PostgreSQL `SECURITY DEFINER` restrita, conceitualmente `auth_private.resolve_membership(authenticated_user_id uuid, requested_organization_id uuid)`. Ela consulta explicitamente `user_id = authenticated_user_id AND organization_id = requested_organization_id AND active = true`, devolve no máximo uma linha com somente `membershipId` e `organizationId`, e produz a mesma forma de ausência para Membership inexistente/inativa ou Organization inexistente. Somente o backend, após validar Session legítima, fornece `authenticated_user_id`; o cliente não o escolhe. `requested_organization_id` ainda não é tenant autorizado. Somente resultado positivo permite `authorizedOrganizationId`, `withTenant()` e carregamento tenant-bound de concessões sob RLS.

O owner final da função será uma role dedicada conceitualmente `lgpd_membership_bootstrap`: NOLOGIN, NOSUPERUSER, NOBYPASSRLS, NOCREATEDB, NOCREATEROLE, sem ownership de `memberships` nem privilégios tenant/admin genéricos. Conceder-lhe somente USAGE nos schemas necessários e SELECT nas colunas de `memberships` necessárias à consulta. Runtime não será membro dessa role; receberá somente USAGE no schema privado e EXECUTE especificamente na função. Revogar EXECUTE de PUBLIC sem janela de exposição durante criação/provisionamento. Migrator não será owner final da função e não ganhará CREATEROLE.

Manter ENABLE/FORCE RLS em `memberships`. A policy tenant normal deixará de aplicar-se implicitamente a PUBLIC e será atribuída explicitamente às roles pertinentes às operações tenant normais. Criar policy SELECT separada apenas para `lgpd_membership_bootstrap`, limitada ao User, Organization e vínculo ativo usados internamente pela função, evitando combinação permissiva OR que amplie o runtime. Fora da função, runtime não recebe essa policy; dentro dela, o owner dedicado continua sujeito a FORCE RLS. Não desligar `row_security` ou RLS, nem usar BYPASSRLS ou ownership da tabela.

A função usará parâmetros `uuid`, nomes totalmente qualificados, `search_path` fixo com apenas schemas confiáveis e `pg_temp` em posição segura, sem concatenação ou SQL dinâmico desnecessário. Usar STRICT se compatível com a implementação final. Settings internos locais à transação podem ligar parâmetros à policy, mas não são prova de autenticação. Preservar predicados explícitos na função mesmo quando a policy os repetir. Os grants tenant normais de runtime em `memberships` podem permanecer: SELECT concede a operação, não visibilidade de linhas que não passem pelo RLS. Operações tenant normais continuam com Organization autorizada, `withTenant()` e contexto local à transação.

O PostgreSQL não precisa reautenticar criptograficamente o User dentro da função. Comprometimento total da credencial runtime com SQL arbitrário inclui a capacidade de invocar funções para as quais ela possui EXECUTE; essa premissa não autoriza SUPERUSER, BYPASSRLS, ownership de tabelas, migration/admin credentials no runtime, leitura irrestrita de Memberships ou desabilitação de RLS/FORCE RLS. RLS e constraints continuam defesa em profundidade contra erros de aplicação e relações cross-tenant inválidas.

## Rationale

Encapsular o único primitive de bootstrap com retorno mínimo, privilégio dedicado e policy específica, sem transformar o contexto fornecido pelo cliente em autorização nem ampliar a leitura normal do runtime.

## Consequences

Provisionar a role dedicada administrativamente, de forma controlada e reproduzível; não elevar o migrator atual apenas para criá-la. Credenciais administrativas não entram na configuração/runtime normal. O procedimento exato de provisionamento fica para a implementação.

Testes futuros com PostgreSQL real devem comprovar: runtime sem tenant não lê Memberships diretamente; runtime com tenant permanece na policy normal; owner sem BYPASSRLS/ownership; PUBLIC sem EXECUTE; runtime com EXECUTE somente no primitive privilegiado necessário; vínculo ativo próprio retorna apenas os dois IDs; vínculo ausente/inativo e Organization inexistente retornam ausência indistinguível; parâmetros não retornam Membership de outro User nem mais de uma linha; settings de bootstrap não tornam a policy aplicável ao runtime fora da função; search_path/object shadowing não alteram comportamento; regressão integral de RLS/constraints do Slice 2; pool, commit e rollback sem contexto residual; runtime sem SUPERUSER/BYPASSRLS/ownership; credenciais migration/admin ausentes do runtime; cliente não substitui authenticatedUserId; Session ausente/inválida não inicia bootstrap; `X-Organization-Id` só vira tenant autorizado após resultado positivo.

Esta decisão não define schema completo de Session, digest, duração/renovação, provider OIDC, MFA, permission matrix, autorização funcional, endpoints/respostas HTTP finais, proteção das demais tabelas globais, política administrativa definitiva de provisionamento ou restante do Slice 3. Não autoriza implementação nesta etapa.

## Implementation Status — S3.2

A S3.2 implementou `lgpd_membership_bootstrap` como role NOLOGIN dedicada e `auth_private.resolve_membership` como primitive `SECURITY DEFINER` de retorno mínimo. O provisionamento administrativo, separado das migrations, conserva ENABLE/FORCE RLS em `memberships`, direciona `tenant_isolation` ao runtime, cria `membership_bootstrap_select` exclusivamente para a role dedicada e concede apenas SELECT nas colunas necessárias. A function é criada sob `SET LOCAL ROLE`, com CREATE temporário e transacional em `auth_private`; runtime e migrator não são membros da role, PUBLIC não possui EXECUTE, runtime recebe somente o EXECUTE específico e nenhum CREATE persiste. Nenhuma migration 0003 foi criada.

O repository chama exclusivamente a primitive. Os 28 cenários previstos para a DEC-056 foram aprovados em PostgreSQL real, juntamente com as regressões de DEC-045/046 e DEC-057. O estado validado possui 10 testes unitários e 52 testes de integração. Isso não implementa o pipeline HTTP ou as demais matérias expressamente excluídas pela Decision.

## Affected Documents

12-OPEN-QUESTIONS.md, 13-DECISIONS.md, 03-DATABASE.md, 07-API.md, 09-SECURITY.md, 11-TESTING.md, features/AUTH.md, features/ORGANIZATIONS.md.

---


# DEC-057 — Fronteira PostgreSQL restrita para persistência global de autenticação

**Status:** DECIDED
**Decision Date:** 2026-09-24

## Related Questions

SECQ-001, somente quanto à fronteira de persistência necessária à autenticação; SECQ-002, quanto à persistência da Session server-side; e DBQ-009, quanto à distinção entre tabelas tenant-bound protegidas por RLS e tabelas globais protegidas por primitives restritos.

DEC-057 não escolhe provider OIDC, não altera a política temporal da Session e não modifica DEC-046 ou DEC-056. Nenhuma Open Question muda de estado por esta Decision.

## Context

ExternalIdentity e Session são entidades globais necessárias antes do estabelecimento do contexto tenant.

Conceder SELECT, INSERT ou UPDATE diretamente à role runtime permitiria que SQL arbitrário executado com essa credencial enumerasse identidades, consultasse digests ou modificasse Sessions fora das operações mínimas aprovadas.

É necessária uma fronteira PostgreSQL explícita que permita à aplicação:

- resolver uma ExternalIdentity por issuer + subject;
- criar uma Session;
- resolver uma Session por token digest;
- revogar uma Session;

sem conceder acesso direto às tabelas globais correspondentes.

## Decision

`external_identities` e `sessions` permanecem entidades globais, sem `organization_id` e sem RLS tenant.

`lgpd_runtime` não recebe SELECT, INSERT, UPDATE ou DELETE diretamente em:

- `external_identities`;
- `sessions`;
- `users`.

O acesso runtime à persistência global de autenticação ocorre exclusivamente através dos seguintes primitives PostgreSQL:

```text
auth_private.resolve_external_identity(text, text)

auth_private.create_session(
  uuid,
  text,
  timestamp with time zone
)

auth_private.resolve_session(text)

auth_private.revoke_session(
  uuid,
  timestamp with time zone
)
```

Os quatro primitives são `SECURITY DEFINER`.

Seu owner final é a role dedicada:

```text
lgpd_auth_persistence
```

Essa role deve possuir:

```text
NOLOGIN
NOSUPERUSER
NOBYPASSRLS
NOCREATEDB
NOCREATEROLE
NOINHERIT
```

Ela:

- não é concedida como membership a `lgpd_runtime`;
- não é concedida como membership ao migrator;
- não é owner de `users`;
- não é owner das tabelas globais ou tenant-bound;
- é owner de `auth_private` e dos quatro primitives;
- não possui privilégios administrativos gerais.

Seus únicos privilégios diretos de tabela são:

```text
external_identities:
  SELECT

sessions:
  SELECT
  INSERT
  UPDATE

users:
  nenhum
```

`lgpd_runtime` recebe somente:

```text
USAGE ON SCHEMA auth_private

EXECUTE ON FUNCTION
  auth_private.resolve_external_identity(...)
  auth_private.create_session(...)
  auth_private.resolve_session(...)
  auth_private.revoke_session(...)
```

`lgpd_runtime` não recebe `CREATE` em `auth_private`.

`PUBLIC` não recebe `USAGE` ou `CREATE` em `auth_private` e não possui `EXECUTE` nos primitives.

### resolve_external_identity

`resolve_external_identity(issuer, subject)`:

- localiza exatamente a combinação issuer + subject;
- retorna zero ou uma linha;
- retorna somente `userId`;
- não pesquisa por email;
- não cria ou altera vínculos;
- não permite listagem.

### create_session

`create_session(userId, tokenDigest, expiresAt)`:

- cria somente a estrutura mínima da Session;
- recebe digest previamente calculado;
- não gera token;
- não calcula digest;
- não define duração;
- deixa `id` e `createdAt` sob controle do banco;
- inicia `revokedAt` como NULL;
- retorna somente `sessionId`, `createdAt`, `expiresAt` e `revokedAt`;
- não retorna `tokenDigest`.

A FK `sessions.user_id → users.id` valida a existência do User sem exigir SELECT em `users` do runtime ou da role dedicada.

### resolve_session

`resolve_session(tokenDigest)` retorna somente:

```text
sessionId
userId
expiresAt
revokedAt
```

Não retorna:

- `tokenDigest`;
- token bruto;
- Organization;
- Membership;
- RoleAssignment;
- permission;
- BusinessUnit scope.

### revoke_session

`revoke_session(sessionId, revokedAt)`:

- atualiza somente `revoked_at`;
- não exclui a Session;
- não reabre a Session;
- preserva o primeiro timestamp de revogação;
- retorna `true` quando a Session existe e está ou permanece revogada;
- retorna `false` quando a Session não existe.

### Hardening

Os primitives devem:

- utilizar parâmetros tipados;
- utilizar nomes de objetos totalmente qualificados;
- possuir `search_path` fixo contendo somente schemas confiáveis, com `pg_temp` em posição segura;
- não utilizar SQL dinâmico desnecessário;
- utilizar `STRICT` quando semanticamente apropriado;
- ter `EXECUTE` revogado de `PUBLIC`;
- ser criados, protegidos e concedidos sem janela pública observável.

## Operational Separation

As responsabilidades permanecem separadas:

```text
administrative bootstrap
→ cria e configura as roles PostgreSQL

structural migration
→ cria tabelas, FKs, constraints e índices

administrative auth provisioning
→ valida a role dedicada e configura schema, functions, ownership e grants

runtime
→ utiliza somente os primitives explicitamente concedidos
```

`infra/postgres/init.sh` é responsável por criar `lgpd_auth_persistence`.

O provisionamento pós-migration:

- não cria nem altera essa role;
- valida que suas propriedades são exatamente as aprovadas;
- falha se a role estiver ausente ou incorreta;
- valida que runtime e migrator não são membros dela;
- configura `auth_private`, functions, ownership e grants.

O migrator permanece `NOCREATEROLE`, não recebe membership na role dedicada e não recebe credenciais administrativas.

Credenciais administrativas não entram na configuração ou no runtime da aplicação.

## Threat Model

O cliente HTTP não controla o `userId` interno.

O backend produzirá esse valor somente após autenticação e resolução válidas.

Aceita-se que comprometimento total da credencial `lgpd_runtime`, com execução SQL arbitrária, permita invocar os primitives que essa role possui autorização explícita para executar, inclusive com parâmetros arbitrários.

Essa premissa não autoriza:

- grants diretos nas tabelas globais;
- primitive de listagem;
- acesso direto a `users`;
- retorno de token digests;
- DELETE de Session;
- alteração de ExternalIdentity;
- SUPERUSER;
- BYPASSRLS;
- ownership amplo;
- credenciais administrativas ou de migration no runtime.

## Rationale

Os primitives restringem operações, parâmetros e retornos no PostgreSQL e evitam que o runtime obtenha acesso genérico às tabelas globais.

Não se adiciona RLS apenas por simetria: ExternalIdentity e Session não são recursos tenant-bound e não possuem `organization_id`.

## Consequences

A implementação deve comprovar:

- ausência de DML direto do runtime nas três tabelas globais;
- propriedades da role dedicada;
- ausência de membership do runtime e migrator;
- ownership de schema e functions;
- ausência de acesso de PUBLIC;
- grants mínimos;
- retornos mínimos;
- search_path endurecido;
- preservação do primeiro `revoked_at`;
- ausência de DELETE;
- regressão integral das migrations, constraints e RLS do Slice 2.

DEC-057 não decide:

- geração do segredo da Session;
- algoritmo concreto de digest;
- duração absoluta;
- expiração por inatividade;
- renovação;
- provider OIDC;
- PKCE;
- state/nonce;
- endpoints HTTP;
- cookies;
- CSRF;
- CORS;
- MFA;
- permission matrix;
- eventos persistentes de segurança;
- bootstrap tenant da DEC-056.

## Affected Documents

README.md, 03-DATABASE.md, 09-SECURITY.md, 11-TESTING.md, 12-OPEN-QUESTIONS.md, 13-DECISIONS.md e features/AUTH.md.

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
| DEC-050 | Provisionamento controlado de identidade no D1 |
| DEC-051 | Identidade externa e perfil no D1 |
| DEC-052 | Bootstrap restrito de contexto tenant |
| DEC-053 | Lifecycle da Session |
| DEC-054 | Organization explícita via header |
| DEC-055 | Cookie de sessão e baseline CSRF |
| DEC-056 | Bootstrap PostgreSQL restrito de Membership |
| DEC-057 | Fronteira PostgreSQL restrita para persistência global de autenticação |

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
