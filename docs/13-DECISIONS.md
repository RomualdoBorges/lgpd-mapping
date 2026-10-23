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

# DEC-058 — Digest SHA-256 do segredo da Session

**Status:** DECIDED
**Decision Date:** 2026-09-24

## Related Questions

SECQ-004, somente quanto ao algoritmo de digest da Session. Complementa DEC-042, DEC-053 e DEC-057 sem decidir duração, renovação ou expiração por inatividade.

## Context

A Session server-side persiste somente uma representação não reversível do segredo opaco. A S3.3 precisa transformar o segredo recebido no mesmo valor usado por `resolve_session`, sem ampliar o escopo para geração do segredo ou integração OIDC.

## Decision

O backend calcula:

```text
tokenDigest = SHA-256(sessionSecret)
```

O segredo bruto da Session nunca é persistido. Somente o resultado SHA-256 é persistido como `tokenDigest` e fornecido a `resolve_session`. Nesta etapa não utilizar HMAC, Argon2 nem introduzir novo secret operacional para o digest.

A futura geração de `sessionSecret` deve utilizar CSPRNG e alta entropia. Quantidade de bytes, encoding e mecanismo concreto de geração permanecem adiados até a etapa que realmente criar Sessions.

## Rationale

Um segredo opaco de alta entropia permite lookup determinístico por SHA-256 com implementação simples e sem novo secret operacional, preservando a separação entre o segredo apresentado pelo cliente e sua representação persistida.

## Consequences

S3.3 pode calcular o digest no backend antes de chamar o primitive existente. A decisão não altera schema, migration ou assinatura de `resolve_session`.

SECQ-004 permanece OPEN quanto a duração absoluta concreta, renovação, expiração por inatividade, frequência de atualização de atividade e demais detalhes operacionais. Esta decisão também não escolhe fornecedor OIDC, quantidade de bytes, encoding ou mecanismo de geração do segredo.

## Affected Documents

09-SECURITY.md, 12-OPEN-QUESTIONS.md, 13-DECISIONS.md e features/AUTH.md.

---

# DEC-059 — Perfis fixos do cookie de Session por ambiente

**Status:** DECIDED
**Decision Date:** 2026-09-24

## Related Questions

SECQ-002 e APIQ-002, quanto à configuração concreta do cookie de Session. Complementa DEC-042 e DEC-055 sem decidir o mecanismo de CSRF ou o fluxo OIDC.

## Context

A DEC-055 definiu os atributos mínimos do cookie, mas não seu nome nem o comportamento de `Secure` no desenvolvimento HTTP. A fundação precisa de perfis previsíveis, sem expor configuração arbitrária do nome.

## Decision

Em desenvolvimento e teste por HTTP, usar o perfil:

```text
name = lgpd_session
HttpOnly = true
SameSite = Lax
Path = /
Secure = false
Domain ausente
```

Em produção por HTTPS, usar o perfil:

```text
name = __Host-lgpd_session
HttpOnly = true
SameSite = Lax
Path = /
Secure = true
Domain ausente
```

Os dois nomes são definidos pelo projeto. Não criar `SESSION_COOKIE_NAME` arbitrariamente configurável. O backend selecionará o perfil apropriado ao ambiente, e produção deve falhar explicitamente se houver tentativa de usar parâmetros incompatíveis com o perfil seguro.

O frontend não conhece, lê ou persiste o segredo do cookie. O prefixo `__Host-` é hardening adicional imposto pelo navegador para `Secure`, `Path=/` e ausência de `Domain`; não substitui CSRF, CORS, revogação server-side ou os demais requisitos da DEC-055.

## Rationale

Permitir desenvolvimento e testes no HTTP local atual, mantendo em produção um perfil rígido cujo nome e atributos reduzem regressões de configuração e ampliação acidental do cookie para subdomínios ou paths diferentes.

## Consequences

Emissão, leitura e remoção do cookie devem utilizar o perfil selecionado pelo backend. Testes futuros devem cobrir os dois perfis e a falha explícita de configuração insegura em produção.

Esta decisão não implementa o comportamento, não escolhe mecanismo de CSRF, provider OIDC, endpoints de autenticação ou política temporal da Session.

## Affected Documents

09-SECURITY.md, 12-OPEN-QUESTIONS.md, 13-DECISIONS.md e features/AUTH.md.

---

# DEC-060 — Identidade autenticada explícita no boundary e na aplicação

**Status:** DECIDED
**Decision Date:** 2026-09-24

## Related Questions

APIQ-020, somente quanto à separação entre identidade autenticada e contexto tenant. Complementa DEC-042, DEC-050, DEC-052, DEC-053, DEC-054, DEC-056 e DEC-057 sem alterar seus estados.

## Context

A S3.3 precisa transportar a identidade obtida de uma Session válida até a aplicação sem permitir que dados controlados pelo cliente se tornem identidade confiável e sem acoplar application/domain ao framework HTTP.

## Decision

Adotar a combinação entre propriedade tipada na request HTTP e passagem explícita para application/use cases:

```ts
type AuthenticatedIdentity = Readonly<{
  sessionId: string;
  authenticatedUserId: string;
}>;
```

O mecanismo de autenticação cria `AuthenticatedIdentity` somente após validar a Session e atribui temporariamente o valor a `request.authenticatedIdentity`. No boundary HTTP existe um contrato tipado único; preferir decorator tipado para disponibilizá-lo ao controller e evitar casts espalhados. `sessionId` e `authenticatedUserId` nunca vêm de body, query ou headers controlados pelo cliente.

O controller extrai a identidade e a passa explicitamente ao application/use case. Não encaminha `Request` ou `Response` para application/domain. Application/use cases não dependem de NestJS, Express, provider request-scoped ou AsyncLocalStorage para obter a identidade. Repositories não descobrem User, Session ou tenant por contexto HTTP ou estado global; recebem parâmetros e contextos explicitamente.

`AuthenticatedIdentity` não contém Organization, Membership, roles, permissions, Business Units, segredo ou digest da Session, cookie, issuer, subject, perfil ou objetos HTTP. Em especial, ficam fora: `organizationId`, `membershipId`, `roles`, `permissions`, `businessUnitIds`, `sessionSecret`, `tokenDigest`, `cookie`, `issuer`, `subject`, `email`, `name`, `Request` e `Response`.

A S3.4 comporá um novo contexto tenant autorizado sem alterar o significado de `AuthenticatedIdentity`:

```text
AuthenticatedIdentity
↓
resolve_membership(authenticatedUserId, requestedOrganizationId)
↓
AuthorizedTenantContext
```

Roles, scopes e Business Units permanecem fora da identidade global e serão tratados posteriormente no contexto de autorização.

## Rationale

Manter autenticação, seleção tenant e autorização como fases distintas; deixar dependências de segurança visíveis nas assinaturas da aplicação; e evitar contexto implícito, vazamento entre requests e acoplamento das camadas internas ao framework HTTP.

## Consequences

O boundary HTTP precisa de tipagem única e pode oferecer decorator próprio. Testes de application/use cases constroem `AuthenticatedIdentity` diretamente, enquanto testes HTTP comprovam que somente o mecanismo de autenticação a cria e que requests concorrentes não compartilham identidade.

Esta decisão não implementa S3.3, não define Organization autorizada, roles, permissions, contrato de `/me`, provider OIDC ou política temporal da Session.

## Affected Documents

07-API.md, 09-SECURITY.md, 12-OPEN-QUESTIONS.md, 13-DECISIONS.md e features/AUTH.md.

---

# DEC-061 — Falha uniforme de autenticação da Session

**Status:** DECIDED
**Decision Date:** 2026-09-24

## Related Questions

SECQ-002 e APIQ-002, quanto ao comportamento HTTP quando a Session não autentica. Complementa DEC-042, DEC-053, DEC-055 e DEC-057 a DEC-060 sem resolver SECQ-004.

## Context

A S3.3 precisa tratar cookie ausente ou inválido e Sessions inexistentes, expiradas ou revogadas sem revelar ao cliente qual condição interna ocorreu, preservando diagnóstico seguro e o perfil de cookie aprovado.

## Decision

Em endpoints protegidos, cookie ausente, cookie malformado/inválido, Session inexistente, Session expirada e Session revogada retornam sempre:

```http
HTTP/1.1 401 Unauthorized
```

```json
{
  "error": {
    "code": "AUTHENTICATION_REQUIRED",
    "message": "Autenticação necessária."
  }
}
```

As causas não são diferenciadas no contrato público. Internamente, a implementação pode usar:

```ts
type AuthenticationFailureReason =
  | 'COOKIE_MISSING'
  | 'COOKIE_INVALID'
  | 'SESSION_NOT_FOUND'
  | 'SESSION_EXPIRED'
  | 'SESSION_REVOKED';
```

Essas causas podem apoiar testes e observabilidade estruturada segura, mas nunca expõem nem registram `sessionSecret`, valor do cookie, `tokenDigest` ou header `Cookie`.

Quando o cookie está ausente, responder 401 sem emitir remoção. Quando o cookie está presente e é inválido, ou sua Session é inexistente, expirada ou revogada, responder 401 e expirar somente esse cookie no navegador. A resposta não revoga Session server-side nem altera outra Session.

A remoção reutiliza exatamente o perfil da DEC-059, incluindo nome, `Path=/`, `HttpOnly`, `SameSite=Lax`, `Secure` correspondente ao ambiente e ausência de `Domain`, além da expiração apropriada.

Em endpoints públicos, cookie ausente ou inválido não causa 401 apenas por essa condição, cookie inválido não é limpo automaticamente e `AuthenticatedIdentity` nunca é criada sem Session válida.

## Rationale

Manter o contrato público simples e não enumerável, permitir diagnóstico interno sem secrets e remover do navegador apenas credenciais que já não podem autenticar.

## Consequences

O boundary protegido possui uma resposta pública única e causas internas não exportadas. Testes devem cobrir os cinco casos, os headers de remoção nos quatro casos com cookie presente, ausência de remoção quando o cookie falta e a diferença de comportamento em endpoints públicos.

Esta decisão não define login, callback OIDC, logout, provider OIDC, mecanismo de CSRF, política temporal da Session, geração do segredo, `/me` ou tenant context da S3.4.

## Affected Documents

07-API.md, 09-SECURITY.md, 12-OPEN-QUESTIONS.md, 13-DECISIONS.md e features/AUTH.md.

---

# DEC-062 — Contexto tenant autorizado separado da identidade

**Status:** DECIDED
**Decision Date:** 2026-10-02

## Related Questions

APIQ-020, quanto ao contrato produzido após a resolução positiva da Membership. Complementa DEC-043, DEC-052, DEC-054, DEC-056 e DEC-060 sem alterar seus estados.

## Context

A S3.4 precisa representar o resultado da autorização tenant da request sem modificar `AuthenticatedIdentity`, duplicar a identidade global ou antecipar roles, permissions e Business Units.

## Decision

Adotar um contrato separado:

```ts
type AuthorizedTenantContext = Readonly<{
  membershipId: string;
  authorizedOrganizationId: string;
}>;
```

`AuthenticatedIdentity` permanece inalterada e contém somente `sessionId` e `authenticatedUserId`. `AuthorizedTenantContext` representa exclusivamente o resultado da autorização tenant da request. `membershipId` somente pode vir de resolução positiva de `resolve_membership()`, e `authorizedOrganizationId` somente pode vir do resultado autorizado desse bootstrap.

`X-Organization-Id` continua sendo apenas `requestedOrganizationId`. Seu valor não pode ser copiado diretamente para `authorizedOrganizationId` antes da resolução positiva da Membership.

`AuthorizedTenantContext` não contém `sessionId`, `authenticatedUserId`, `AuthenticatedIdentity` aninhada, `requestedOrganizationId`, roles, permissions, Business Units, `Request`, `Response`, transaction ou conexão de banco. Os campos de `AuthenticatedIdentity` não são duplicados no contexto tenant. Controllers e application/use cases podem receber os dois contratos separadamente quando necessário.

Repositories não descobrem identidade ou tenant implicitamente por `Request`, Session, estado global, AsyncLocalStorage ou mecanismo equivalente. Recebem os parâmetros e contextos necessários explicitamente.

## Rationale

Preservar a separação entre identidade global autenticada e autorização tenant atual, impedir que o valor solicitado pelo cliente adquira autoridade antes do bootstrap e manter visíveis as dependências de segurança nas assinaturas da aplicação.

## Consequences

A S3.4 pode compor `AuthorizedTenantContext` somente após `resolve_membership()` retornar positivamente e pode então usar `authorizedOrganizationId` para iniciar `withTenant()`. Trocar a Organization solicitada entre requests exige nova resolução; nenhum contexto é congelado na Session.

Esta decisão não define status HTTP, `error.code` ou mensagem para `X-Organization-Id` ausente, UUID inválido, múltiplos valores, Membership inexistente/inativa ou Organization inexistente. Não decide 400 versus 422, não amplia a distinção HTTP já aprovada, não define roles, scopes, permissions, S3.5, OIDC, `/me` ou frontend e não autoriza implementação nesta etapa.

## Affected Documents

07-API.md, 09-SECURITY.md, 12-OPEN-QUESTIONS.md, 13-DECISIONS.md e features/AUTH.md.

---


# DEC-063 — Status HTTP para validação estrutural e de negócio

**Status:** DECIDED
**Decision Date:** 2026-10-02

## Related Questions

ERRQ-002, integralmente.

## Context

A documentação previa 400 e 422, mas ainda não separava de forma normativa falhas de estrutura/transporte de violações semânticas de domínio, negócio ou workflow.

## Decision

Usar `400 Bad Request` quando a request não puder ser aceita estruturalmente: JSON inválido, campo ou parâmetro estrutural obrigatório ausente, tipo ou formato inválido, header obrigatório ausente, UUID inválido ou valores múltiplos onde apenas um valor é permitido.

Usar `422 Unprocessable Entity` quando a request for estruturalmente válida, mas violar regra de domínio, negócio ou workflow.

`401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict` e `500 Internal Server Error` permanecem reservados aos seus contratos específicos. Falhas de autenticação, autorização, inexistência, conflito ou infraestrutura não são convertidas em 422.

## Rationale

Separar erro de transporte/estrutura de rejeição semântica torna o contrato previsível para clientes sem confundir autorização ou inexistência com validação de negócio.

## Consequences

Headers tenant ausentes, UUIDs inválidos e múltiplos valores são falhas 400. A resposta de autorização tenant negativa é definida separadamente pela DEC-065. Esta Decision não resolve ERRQ-003, ERRQ-004 nem códigos ou mensagens específicos de features.

## Affected Documents

07-API.md, 12-OPEN-QUESTIONS.md, 13-DECISIONS.md, 19-ERROR-CATALOG.md e 20-API-CONTRACTS.md.

---

# DEC-064 — Mensagens públicas da API em português

**Status:** DECIDED
**Decision Date:** 2026-10-02

## Related Questions

ERRQ-003, integralmente.

## Context

Os documentos continham exemplos públicos em inglês e português. O cliente precisa de mensagens consistentes sem acoplar seu comportamento ao texto apresentado.

## Decision

Mensagens públicas retornadas pela API são escritas em português. `error.code` permanece estável, em inglês e `UPPER_SNAKE_CASE`. O frontend depende de `error.code`, nunca da comparação de `message`, e pode futuramente substituir a mensagem pela tradução da interface.

Detalhes técnicos e internos, incluindo stack trace, SQL, caminhos internos, secrets e causas que ampliem exposição de segurança, não são incluídos na resposta pública.

## Rationale

Alinhar as mensagens ao público inicial do produto e ao contrato já aprovado na DEC-061, preservando códigos estáveis e independentes do idioma para automação e evolução futura.

## Consequences

Exemplos públicos em inglês nos documentos afetados devem ser harmonizados para português. Nomes de códigos e identificadores técnicos permanecem em inglês. Esta Decision não define códigos, status ou mensagens específicos de cada feature e não resolve ERRQ-002 ou ERRQ-004.

## Affected Documents

07-API.md, 12-OPEN-QUESTIONS.md, 13-DECISIONS.md, 19-ERROR-CATALOG.md e 20-API-CONTRACTS.md.

---

# DEC-065 — Contrato HTTP do bootstrap tenant

**Status:** DECIDED
**Decision Date:** 2026-10-02

## Related Questions

APIQ-020, somente quanto ao contrato HTTP da S3.4. Complementa DEC-052, DEC-054, DEC-056, DEC-062, DEC-063 e DEC-064 sem alterar seus estados e não resolve ERRQ-004.

## Context

A S3.4 precisa rejeitar entradas estruturais inválidas e resultados negativos de autorização tenant sem transformar `X-Organization-Id` em autoridade ou revelar se Organization ou Membership existem e qual estado possuem.

## Decision

Em endpoint tenant-bound, ausência de `X-Organization-Id` retorna:

```http
HTTP/1.1 400 Bad Request
```

```json
{
  "error": {
    "code": "ORGANIZATION_CONTEXT_REQUIRED",
    "message": "A organização da requisição é obrigatória."
  }
}
```

UUID inválido ou múltiplos valores de `X-Organization-Id` retornam:

```http
HTTP/1.1 400 Bad Request
```

```json
{
  "error": {
    "code": "INVALID_ORGANIZATION_CONTEXT",
    "message": "Contexto de organização inválido."
  }
}
```

Após validação estrutural e autenticação válida, todos estes resultados negativos do bootstrap tenant retornam exatamente a mesma resposta pública: Membership inexistente, Membership inativa, Organization inexistente ou Membership pertencente a outro User.

```http
HTTP/1.1 403 Forbidden
```

```json
{
  "error": {
    "code": "ORGANIZATION_ACCESS_DENIED",
    "message": "Acesso à organização não autorizado."
  }
}
```

A API não revela externamente qual condição interna causou a negação. Nenhum resultado negativo produz `AuthorizedTenantContext` ou inicia `withTenant()`.

## Rationale

Aplicar a distinção estrutural da DEC-063, preservar a mensagem pública em português da DEC-064 e impedir enumeração de Organizations, Memberships ou seus estados conforme DEC-052/056.

## Consequences

`MEMBERSHIP_NOT_FOUND` e `MEMBERSHIP_INACTIVE` não representam falhas do bootstrap tenant. O contrato uniforme desta Decision é anterior a roles, permissions e scopes. ERRQ-004 permanece OPEN para recursos fora do scope dentro de uma Organization já autorizada.

Esta Decision não define OIDC, `/me`, S3.5, permission matrix, frontend ou comportamento administrativo futuro de Memberships.

## Affected Documents

07-API.md, 09-SECURITY.md, 12-OPEN-QUESTIONS.md, 13-DECISIONS.md, 19-ERROR-CATALOG.md, 20-API-CONTRACTS.md, features/AUTH.md e features/ORGANIZATIONS.md.

---

# DEC-066 — Política 403/404 para recursos tenant-bound

**Status:** DECIDED
**Decision Date:** 2026-10-02

## Related Questions

ERRQ-004, integralmente.

## Context

Depois de criado `AuthorizedTenantContext`, a API ainda precisa distinguir ausência de recurso de falta de autorização sem permitir enumeração de recursos cross-tenant ou fora do scope de visibilidade. Conhecer, fornecer ou adivinhar um UUID não concede visibilidade.

## Decision

Retornar `404 Not Found` quando a política de autorização não permitir ao usuário confirmar a existência do recurso. Dentro do mesmo endpoint, recurso inexistente, recurso pertencente a outra Organization, recurso pertencente à Organization autorizada mas fora do scope de visibilidade e recurso cujo UUID seja conhecido sem autorização de visibilidade são publicamente indistinguíveis.

Em endpoint tipado, reutilizar o código `*_NOT_FOUND` específico já aprovado para o recurso. Por exemplo:

```json
{
  "error": {
    "code": "PROCESSING_ACTIVITY_NOT_FOUND",
    "message": "Atividade de tratamento não encontrada."
  }
}
```

O mesmo contrato é usado quando a atividade inexiste, pertence a outra Organization ou está fora do scope de visibilidade no tenant autorizado. Quando não houver contrato específico aprovado para o tipo, usar `RESOURCE_NOT_FOUND` como fallback genérico. Esta Decision não cria novos códigos `*_NOT_FOUND`.

Retornar `403 Forbidden` somente quando o recurso pertence ao tenant autorizado, sua existência pode ser legitimamente conhecida pelo usuário, mas a ação solicitada não é autorizada:

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Ação não autorizada."
  }
}
```

Códigos mais específicos de autorização somente podem ser usados quando não revelarem informação que a política de visibilidade determine como não revelável. `RESOURCE_SCOPE_DENIED`, `BUSINESS_UNIT_NOT_ALLOWED` e `FILE_ACCESS_DENIED` não podem revelar a existência de recurso oculto.

Recurso inexistente, cross-tenant e fora do scope de visibilidade compartilham, dentro do mesmo endpoint, status HTTP, `error.code`, `message` e formato público da resposta. A API não expõe Organization proprietária, Business Unit, owner, existência, estado interno ou motivo interno da negação e não realiza lookup global apenas para distinguir publicamente essas condições.

A ordem conceitual é:

```text
AuthenticatedIdentity
→ AuthorizedTenantContext
→ busca tenant-aware limitada ao scope de visibilidade
→ recurso não localizado/visível: 404
→ recurso visível
→ verificar autorização da ação
→ ação negada: 403
→ validar domínio/negócio/workflow
```

## Rationale

Preservar isolamento tenant, evitar IDOR e enumeração de recursos e ainda distinguir falta de visibilidade de negação de uma ação sobre recurso legitimamente visível.

## Consequences

`401` continua reservado à autenticação conforme DEC-061; falha estrutural continua em 400 e violação de domínio, negócio ou workflow em 422 conforme DEC-063; mensagens públicas permanecem em português conforme DEC-064; `ORGANIZATION_ACCESS_DENIED` continua exclusivo do bootstrap tenant conforme DEC-065. Esta Decision aplica-se somente depois da criação de `AuthorizedTenantContext`.

Esta Decision não define matriz de permissions, scopes concretos por role, quais roles visualizam cada recurso, autorização específica de arquivos ou Business Units, contratos de referências inválidas em mutations ou comportamento administrativo especial.

## Affected Documents

07-API.md, 09-SECURITY.md, 12-OPEN-QUESTIONS.md, 13-DECISIONS.md, 19-ERROR-CATALOG.md, 20-API-CONTRACTS.md, 28-PRE-IMPLEMENTATION-CHECKLIST.md, features/AUTH.md e features/ORGANIZATIONS.md.

---

# DEC-067 — Validade temporal e atividade da Session

**Status:** DECIDED
**Decision Date:** 2026-10-02

## Related Questions

SECQ-004, quanto à duração absoluta, idle timeout e persistência de atividade. Complementa DEC-042, DEC-053, DEC-057 e DEC-061.

## Context

A Session já possui `createdAt`, `expiresAt` e `revokedAt`, mas faltavam os valores temporais concretos e a política de atividade necessária para aplicar inatividade sem depender de estado em memória ou produzir escrita a cada request.

## Decision

Toda Session possui `expiresAt`. A duração absoluta padrão é de 12 horas, calculada como `expiresAt = createdAt + 12 horas`. `expiresAt` representa o limite absoluto, não é estendido durante a vida da Session e `now >= expiresAt` torna a Session inválida. Expiração temporal não preenche `revokedAt`.

O idle timeout padrão é de 30 minutos. O modelo passa a exigir conceitualmente `lastActivityAt`; na criação, `lastActivityAt = createdAt`. A Session é inválida quando `now >= lastActivityAt + 30 minutos`. Expiração absoluta e por inatividade produzem o mesmo contrato público 401/`AUTHENTICATION_REQUIRED` da DEC-061.

Conta como atividade uma request a endpoint protegido cuja Session tenha sido validada com sucesso, mesmo que depois da autenticação ela termine em 400, 403, 404, 409, 422 ou 500. Não contam como atividade: cookie ausente, inválido ou malformado; Session inexistente, já expirada ou revogada; e endpoint público que não autentica Session.

`lastActivityAt` somente pode ser atualizado em decorrência de request autenticada válida. A persistência é throttled: se menos de cinco minutos se passaram desde o timestamp persistido, nenhuma escrita é necessária; se cinco minutos ou mais se passaram, a request pode avançar `lastActivityAt` para o instante corrente. Ausência de requests nunca gera atualização periódica. A atualização deve ser condicional, segura para concorrência, nunca regredir e usar o estado persistido compartilhado, sem depender da memória do processo; múltiplas instâncias observam esse mesmo estado.

Os valores são configuração validada, com defaults de 12 horas, 30 minutos e cinco minutos. Exigir: absolute lifetime > 0; idle timeout > 0; activity persistence interval > 0; activity persistence interval < idle timeout; idle timeout <= absolute lifetime.

A implementação futura adicionará `last_activity_at TIMESTAMPTZ NOT NULL`, com backfill esperado `last_activity_at = created_at`. `expires_at` continua sendo o limite absoluto; não adicionar `absolute_expires_at`, refresh token, device ID, remember-me ou contador de renovação. Esta Decision não determina o SQL final e preserva a DEC-057: runtime não recebe DML direto em Sessions.

## Rationale

Limitar a exposição de Sessions abandonadas, preservar um limite absoluto previsível e evitar write amplification sem introduzir estado local por instância.

## Consequences

Schema, primitive restrita, repository e boundary precisarão evoluir posteriormente para persistir e avaliar `lastActivityAt`. Testes usarão tempo controlável e cobrirão limites, throttling e concorrência. `lastActivityAt` é o termo canônico para a atividade usada pelo idle timeout; referências históricas a `lastSeenAt` na DEC-053 permanecem históricas.

Esta Decision não define fornecedor OIDC, MFA, geração/bytes/encoding do `sessionSecret`, refresh token do IdP, logout global, gerenciamento de dispositivos, limite de Sessions, remember-me ou UI de Sessions.

## Affected Documents

03-DATABASE.md, 07-API.md, 09-SECURITY.md, 11-TESTING.md, 12-OPEN-QUESTIONS.md, 13-DECISIONS.md, 14-IMPLEMENTATION-PLAN.md, 21-DATA-DICTIONARY.md, 26-RELEASE-CHECKLIST.md e features/AUTH.md.

---

# DEC-068 — Sem renovação automática da Session local

**Status:** DECIDED
**Decision Date:** 2026-10-02

## Related Questions

SECQ-004, quanto à renovação. Complementa DEC-042, DEC-053, DEC-058 e DEC-067.

## Context

Era necessário separar a renovação da Session local dos tokens e da sessão mantidos pelo IdP e impedir que atividade transforme a Session local em credencial indefinidamente renovável.

## Decision

Não existe sliding expiration. Atividade não altera `expiresAt`, a mesma Session não é renovada automaticamente e `sessionSecret` não é rotacionado automaticamente por atividade. Esta política não cria endpoint de refresh da Session local, não exige refresh token do IdP para mantê-la e não consulta o IdP a cada request.

Após expiração absoluta ou por inatividade, a Session local permanece inválida. Criar uma nova Session local exige passar novamente pelo fluxo de autenticação. Se a sessão do IdP ainda estiver ativa, o IdP pode concluir esse novo fluxo sem necessariamente solicitar credenciais novamente; isso não renova nem reativa a Session local anterior.

## Rationale

Manter o lifecycle local simples, limitado e independente do lifecycle do IdP, evitando extensão silenciosa, rotação concorrente do segredo e um protocolo de refresh sem requisito aprovado.

## Consequences

Não existe endpoint local de renovação. Esta Decision não define refresh token do IdP, fornecedor OIDC, duração da sessão do IdP ou rotação periódica de `sessionSecret`.

## Affected Documents

07-API.md, 09-SECURITY.md, 11-TESTING.md, 12-OPEN-QUESTIONS.md, 13-DECISIONS.md, 14-IMPLEMENTATION-PLAN.md, 26-RELEASE-CHECKLIST.md e features/AUTH.md.

---

# DEC-069 — Logout e revogação da Session atual

**Status:** DECIDED
**Decision Date:** 2026-10-02

## Related Questions

SECQ-004, quanto à revogação operacional e ao logout da Session atual. Complementa DEC-053, DEC-055, DEC-057, DEC-059 e DEC-061.

## Context

A revogação idempotente já existe na fronteira PostgreSQL e a DEC-055 exige invalidação server-side antes da remoção do cookie, mas faltava o contrato operacional e HTTP do logout da Session atual.

## Decision

O logout da Session atual segue esta ordem: identificar a Session autenticada atual; revogar server-side; confirmar a revogação; remover o cookie conforme DEC-059; responder `204 No Content`. A revogação server-side ocorre antes da remoção do cookie.

`revokedAt` permanece idempotente: nova revogação não substitui o primeiro timestamp. Request que tentar autenticar depois do commit da revogação recebe o contrato 401 da DEC-061. Request que já concluiu a autenticação antes da revogação pode terminar normalmente; o logout não promete cancelar requests já em execução.

DEC-053 continua permitindo múltiplas Sessions simultâneas. O logout normal revoga somente a Session atual.

## Rationale

Garantir invalidação efetiva no servidor, remoção coerente do cookie e comportamento concorrente honesto sem ampliar o logout para funções administrativas.

## Consequences

A implementação futura adicionará o endpoint de logout da Session atual, usando a primitive restrita existente e sem expor segredo ou digest. Esta Decision não inclui logout de todos os dispositivos, revogação administrativa global, logout global no IdP, UI de Sessions, limite de Sessions simultâneas ou identificação de dispositivo.

## Affected Documents

07-API.md, 09-SECURITY.md, 11-TESTING.md, 12-OPEN-QUESTIONS.md, 13-DECISIONS.md, 14-IMPLEMENTATION-PLAN.md, 26-RELEASE-CHECKLIST.md e features/AUTH.md.

---

# DEC-070 — S3.5 como resolução estrutural de concessões do Membership autorizado

**Status:** APPROVED
**Decision Date:** 2026-10-23

## Related Questions

AUTHQ-015, integralmente. Complementa DEC-034/035/036/037/038/039/042/043/045/046/049/052/056/062/065/066, sem alterar seus estados ou ampliar permissões funcionais.

## Context

Aprovação humana expressa da Alternativa A, do contrato `ResolvedMembershipGrants`, do tratamento conservador, do privilégio mínimo de Role e dos 17 critérios S3.5-AC-001 a S3.5-AC-017. A autorização recebida permite exclusivamente formalização documental; não autoriza implementação de código, SQL, schema ou migrations.

A S3.4 resolve a Membership própria ativa do User autenticado e produz `AuthorizedTenantContext`. A S3.5 prepara a estrutura de concessões para autorização futura, sem declarar a autorização funcional concluída.

## Decision

Adotar a Alternativa A: limitar a S3.5 à resolução estrutural das concessões do Membership autorizado.

### Contrato interno

`ResolvedMembershipGrants` contém `membershipId`, `authorizedOrganizationId` e `grants[]`. Cada grant contém exclusivamente `roleAssignmentId`, `roleCode`, `scope` e `businessUnitIds[]`. Scope aceita somente ORGANIZATION e BUSINESS_UNIT.

Os dois IDs do envelope vinculam o resultado ao contexto autorizado e não precisam ser repetidos em cada grant. O contrato é separado de `AuthenticatedIdentity` e `AuthorizedTenantContext`, que conservam seus campos e responsabilidades atuais. Resultado, grants e arrays internos são imutáveis em tipos e runtime; congelamento apenas superficial não basta.

### Resolução e passagem explícita

Resolver após resultado positivo da S3.4, recebendo explicitamente `AuthorizedTenantContext`. Organization e Membership vêm exclusivamente desse contexto; o cliente não escolhe Membership nem fornece Organization como autoridade.

Consultar o estado persistido atual por request que necessite das concessões. Session, estado global e cache não são fontes definitivas de grants/scopes. Mudanças confirmadas antes da consulta da request posterior aparecem nessa resolução; não se promete cancelar requests em andamento ou revalidar continuamente uma operação iniciada.

Application/use cases recebem explicitamente o resultado quando necessário. Application/domain não descobrem concessões por Request, Response, Session, estado global ou AsyncLocalStorage; repositories recebem explicitamente parâmetros e transação. A presença do contrato não comprova autorização funcional.

### Concessões independentes e comportamento conservador

Cada RoleAssignment permanece independente, inclusive para roles repetidos. Não calcular produto cartesiano de roles e áreas, unir áreas globalmente ou herdar Business Units automaticamente pela hierarquia.

ORGANIZATION possui `businessUnitIds` vazio e representa alcance organizacional sem enumerar áreas. BUSINESS_UNIT contém somente áreas explicitamente associadas àquela concessão; sem áreas, mantém alcance vazio e nunca é promovido a ORGANIZATION. Scope estrutural não concede permissions automaticamente.

Ausência de grants retorna coleção vazia, sem papel ou acesso padrão. Scope desconhecido ou inconsistência estrutural detectada interrompe a resolução, sem resultado parcial utilizável. Falha de persistência não retorna sucesso vazio. Erros não expõem concessões, existência de recursos ou detalhes internos. Não são criados códigos públicos de erro nem regras administrativas de criação/alteração de concessões.

`roleCode` vem do catálogo persistido e não aprova novos papéis, permissions ou capacidades funcionais.

### Persistência e segurança

Usar `withAuthorizedTenant()` e `withTenant()` com `authorizedOrganizationId` da S3.4. Todas as consultas tenant-bound da operação usam a mesma transação sob RLS/FORCE RLS e filtros explícitos por Organization e Membership. RLS isola tenant e não substitui filtro de Membership ou autorização funcional.

Consultar associações por Organization e RoleAssignment, preservando concessões sem áreas. Obter snapshot coerente dos dados consultados, preferencialmente em uma única consulta. Preservar constraints compostas, contexto local à transação e ausência de tenant persistente na conexão reutilizada pelo pool.

O privilégio mínimo aprovado é `SELECT (id, code) ON public.roles`, por SQL incremental e versionado na implementação, sem editar migrations já aplicadas. Permite leitura dessas duas colunas do catálogo global; não concede escrita, administração, ownership, BYPASSRLS ou acesso adicional a entidades globais. Não criar nova primitive privilegiada nem ampliar o bootstrap de Membership ou seu retorno mínimo.

### Limites

A S3.5 não inclui permission matrix, Role → Permission, ADMIN, PLATFORM_ADMIN, OWN, PLATFORM, catálogo definitivo de roles, custom roles, hierarquia de roles ou administração de concessões. Não inclui aprovação, revisão, arquivamento, transições de workflow, autorização funcional de ProcessingActivity ou outros recursos, `GET /me`, endpoints públicos ou frontend. Não inclui cache autoritativo de grants na Session, ampliação do bootstrap, mutations de negócio ou novos eventos de auditoria de administração de concessões.

DEC-039 permanece válida para leitura funcional de Activities/ROPA no D1. DEC-043 continua exigindo permission, scope e restrições antes de operações protegidas; grants estruturais não satisfazem isoladamente essa obrigação. Preservar os contratos de bootstrap da DEC-065 e a política de não enumeração da DEC-066 nas entregas correspondentes.

## Rationale

Entregar a estrutura necessária à autorização futura, preservando Membership, tenant, scope e concessões independentes, sem consolidar regras funcionais ainda pendentes.

## Consequences

A implementação exigiu e entregou contrato, serviço de composição, repository, integração explícita, privilégio SQL mínimo de Role e testes correspondentes, mediante autorizações posteriores à formalização inicial. Não foi identificada necessidade de alterar schema, constraints ou policies tenant para este recorte; necessidade adicional deverá ser avaliada antes de ampliar o escopo.

DBQ-005 permanece OPEN para os demais catálogos, com Role já coberta por DEC-049. AUTHQ-003, WFQ-003/AUTHQ-001 (alias), AUTHQ-002, AUTHQ-011, AUTHQ-013, APIQ-017, AUTHQ-009 e SECQ-018 permanecem OPEN; AUTHQ-004 permanece IN_ANALYSIS em seu escopo remanescente. Nenhuma outra questão ou Decision é resolvida ou alterada por esta aprovação.

Registro histórico: a formalização inicial não autorizou iniciar a implementação. As autorizações humanas posteriores permitiram S3.5.1 a S3.5.4, cuja conclusão está registrada abaixo; não ampliam o escopo normativo desta decisão.

## Validation — critérios de aceite aprovados

| ID | Critério verificável |
|---|---|
| S3.5-AC-001 | Nenhuma resolução de grants começa antes de resultado positivo da S3.4. |
| S3.5-AC-002 | Membership e Organization da consulta vêm exclusivamente de `AuthorizedTenantContext`. |
| S3.5-AC-003 | Resolver Membership de A não retorna concessões ou áreas de B, inclusive para User com vínculos nas duas Organizations. |
| S3.5-AC-004 | Resolver M1 não retorna concessões de M2 pertencente à mesma Organization. |
| S3.5-AC-005 | Cada grant preserva seu ID, Role, scope e áreas, sem mistura entre concessões. |
| S3.5-AC-006 | ORGANIZATION retorna lista de áreas vazia, sem expansão ou concessão funcional implícita. |
| S3.5-AC-007 | BUSINESS_UNIT retorna exatamente suas áreas explícitas; sem áreas, permanece com alcance vazio. |
| S3.5-AC-008 | Ausência de grants retorna coleção vazia, sem papel padrão. |
| S3.5-AC-009 | Scope desconhecido ou inconsistência detectada impede resultado utilizável; falha de persistência não retorna sucesso vazio. |
| S3.5-AC-010 | Inclusão, alteração e remoção confirmadas aparecem na resolução de request posterior, sem concessões congeladas na Session. |
| S3.5-AC-011 | Resultado e coleções internas resistem a alterações pelo consumidor. |
| S3.5-AC-012 | Consultas tenant-bound usam a mesma transação e permanecem sob RLS/FORCE RLS. |
| S3.5-AC-013 | Concorrência entre Organizations e reutilização do pool após commit, rollback e erro não vazam contexto. |
| S3.5-AC-014 | Runtime lê somente as colunas aprovadas de Role e não recebe escrita ou privilégios administrativos adicionais. |
| S3.5-AC-015 | Constraints continuam rejeitando relações cross-tenant, scopes não aprovados e áreas em grants ORGANIZATION. |
| S3.5-AC-016 | Contratos de identidade, tenant e erros do bootstrap permanecem preservados; nenhuma rota de enumeração é criada. |
| S3.5-AC-017 | Nenhuma operação funcional passa a ser autorizada apenas pela presença de grants. |

Na formalização inicial, os critérios eram requisitos ainda não executados. Após S3.5.1 a S3.5.4, os 17 critérios foram auditados como ATENDIDOS no escopo estrutural. O [registro de encerramento](14-IMPLEMENTATION-PLAN.md#encerramento-documental-da-s35) identifica commits, evidências e resultados reportados; este encerramento não reexecuta testes. Testes estruturais não comprovam autorização funcional.

## Affected Documents

03-DATABASE.md, 04-AUTHORIZATION.md, 09-SECURITY.md, 11-TESTING.md, 12-OPEN-QUESTIONS.md, 13-DECISIONS.md, 14-IMPLEMENTATION-PLAN.md, 28-PRE-IMPLEMENTATION-CHECKLIST.md, features/AUTH.md e features/ORGANIZATIONS.md.

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
| DEC-058 | Digest SHA-256 do segredo da Session |
| DEC-059 | Perfis fixos do cookie de Session por ambiente |
| DEC-060 | Identidade autenticada explícita no boundary e na aplicação |
| DEC-061 | Falha uniforme de autenticação da Session |
| DEC-062 | Contexto tenant autorizado separado da identidade |
| DEC-063 | Status HTTP para validação estrutural e de negócio |
| DEC-064 | Mensagens públicas da API em português |
| DEC-065 | Contrato HTTP do bootstrap tenant |
| DEC-066 | Política 403/404 para recursos tenant-bound |
| DEC-067 | Validade temporal e atividade da Session |
| DEC-068 | Sem renovação automática da Session local |
| DEC-069 | Logout e revogação da Session atual |
| DEC-070 | S3.5 — resolução estrutural de concessões do Membership autorizado |

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
