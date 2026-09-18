# Notifications

> **Documento:** Notificações, Pendências e Alertas  
> **Status:** Draft  
> **Objetivo:** definir quando a plataforma pode gerar notificações, quem pode recebê-las e como separar notificações operacionais de Dashboard, AuditLog e Compliance Gate.

---

# 1. Objetivo

A plataforma possui eventos que podem exigir atenção humana.

Exemplos:

```text
Activity enviada para revisão

Activity aguardando Compliance Review

Activity rejeitada

System criado como PENDING

Supplier criado como PENDING

pendência antiga

revisão periódica necessária

export concluído
```

Esses eventos podem futuramente gerar:

```text
in-app notification

email

outros canais
```

---

# 2. Princípio fundamental

Separar:

```text
Dashboard
≠
Notification
≠
AuditLog
≠
Application Log
≠
Compliance Check
```

---

# 3. Dashboard

Dashboard responde:

```text
"O que está pendente agora?"
```

É um:

```text
read model
```

Não precisa criar Notification para cada item exibido.

---

# 4. Notification

Notification responde:

```text
"O que aconteceu ou exige minha atenção?"
```

Pode possuir:

```text
recipient

event

resource

createdAt

read state
```

---

# 5. AuditLog

AuditLog responde:

```text
"Qual evento relevante ocorreu?"
```

Possui finalidade histórica/auditável.

Não significa que alguém precisa ser notificado.

---

# 6. Application Log

Application Log responde:

```text
"O que aconteceu tecnicamente na aplicação?"
```

Não deve gerar notificações funcionais automaticamente.

---

# 7. ComplianceCheck

ComplianceCheck responde:

```text
"Qual o resultado de determinada verificação?"
```

Um:

```text
REVIEW_REQUIRED
```

pode originar uma Notification.

Mas são entidades/conceitos diferentes.

---

# 8. Regra

Nunca utilizar Notification como:

```text
source of truth
```

do workflow.

Exemplo incorreto:

```text
notification exists
→ Activity is pending review
```

Correto:

```text
Activity/Compliance state
→ notification may be generated
```

---

# 9. Escopo V1 recomendado

V1 deve priorizar:

```text
in-app notifications
```

para eventos realmente acionáveis.

Email pode ser adicionado quando necessidade operacional estiver definida.

---

# 10. Fora do escopo inicial

Não implementar automaticamente:

```text
SMS

WhatsApp

push mobile

Slack

Microsoft Teams

webhooks

digest inteligente

AI notification prioritization
```

---

# 11. Notification Entity

Entidade conceitual:

```text
Notification
```

---

# 12. Campos

Possível estrutura:

```text
id

organizationId

recipientUserId

type

resourceType

resourceId

status

createdAt

readAt

metadata
```

---

# 13. `id`

```text
Type: UUID
Status: SYSTEM
```

---

# 14. `organizationId`

```text
Type: UUID
Status: SYSTEM
```

Define tenant da Notification.

---

# 15. `recipientUserId`

```text
Type: UUID
Status: REQUIRED
```

Usuário destinatário.

Deve possuir acesso apropriado ao contexto no momento da criação.

---

# 16. `type`

```text
Type: stable code
Status: REQUIRED
```

Exemplo:

```text
ACTIVITY_REVIEW_REQUESTED
```

---

# 17. `resourceType`

Exemplo:

```text
PROCESSING_ACTIVITY
SYSTEM
SUPPLIER
EXPORT
```

---

# 18. `resourceId`

Identificador do recurso relacionado.

Não substitui autorização.

Ao abrir Notification:

```text
backend must authorize resource again
```

---

# 19. `status`

Conceitos possíveis:

```text
UNREAD

READ
```

Alternativamente, `readAt` pode ser suficiente.

Evitar armazenar duas fontes da mesma verdade.

---

# 20. `readAt`

```text
Type: TIMESTAMPTZ
Nullable: true
```

```text
null
→ unread

timestamp
→ read
```

---

# 21. `createdAt`

```text
TIMESTAMPTZ
SYSTEM
```

---

# 22. `metadata`

```text
JSONB
OPTIONAL
```

Somente para informações mínimas necessárias à apresentação.

Não armazenar snapshot completo do recurso.

---

# 23. Conteúdo seguro

Notification não deve armazenar desnecessariamente:

```text
legal justification

security descriptions

ROPA contents

uploaded document contents

personal information from forms
```

---

# 24. Event Codes

Notification types devem possuir stable codes.

Não utilizar texto da mensagem como identidade.

---

# 25. Candidate Events

Eventos candidatos:

```text
ACTIVITY_REVIEW_REQUESTED

ACTIVITY_REVIEW_COMPLETED

ACTIVITY_REJECTED

COMPLIANCE_REVIEW_REQUIRED

COMPLIANCE_REVIEW_COMPLETED

ACTIVITY_ACTIVATED

ACTIVITY_REVISION_REQUESTED

ACTIVITY_REVIEW_DUE

SYSTEM_MAPPING_PENDING

SUPPLIER_MAPPING_PENDING

EXPORT_COMPLETED

EXPORT_FAILED
```

Nem todos precisam fazer parte da V1.

---

# 26. Activity Review Requested

Possível origem:

```text
Submit Activity
↓
workflow enters review state
↓
notify reviewer(s)
```

Depende de:

```text
WFQ-002
WFQ-003
```

---

# 27. Recipients

Não decidir destinatário por role hardcoded sem regra.

Exemplo incorreto:

```text
always notify every DPO
```

Pode causar:

```text
noise

information overexposure

poor scalability
```

---

# 28. Reviewer Recipient

Destinatário depende de:

```text
quem revisa
```

Relacionado a:

```text
WFQ-003
```

---

# 29. Activity Rejected

Se workflow possuir rejeição:

```text
reviewer rejects
↓
notify responsible/creator
```

Depende de:

```text
WFQ-009
```

---

# 30. Activity Activated

Pode ser útil notificar:

```text
responsible user

creator

review participants
```

mas não deve ser implementado sem requisito.

---

# 31. Compliance Review Required

Possível fluxo:

```text
Compliance Gate
↓
check = REVIEW_REQUIRED
↓
human review needed
↓
Notification
```

Depende de:

```text
CGQ-001
WFQ-005
```

---

# 32. Compliance Review Recipient

Pode ser:

```text
DPO

designated reviewer

specific permission holders
```

Não decidir até workflow/autorização estarem definidos.

---

# 33. Sensitive Data

A presença de dado sensível não deve gerar automaticamente:

```text
warning notification
```

se não houver ação necessária.

---

# 34. Minor Data

Mesma regra.

Não transformar classificação funcional em alarmismo.

---

# 35. International Transfer

Transferência internacional pode gerar Notification apenas se existir:

```text
review required
```

ou:

```text
missing required information
```

segundo regra aprovada.

---

# 36. System Mapping Pending

Quick Create gera:

```text
System.mappingStatus = PENDING
```

Pode aparecer no Dashboard imediatamente.

Notification é decisão separada.

---

# 37. Supplier Mapping Pending

Mesma regra:

```text
Supplier.mappingStatus = PENDING
```

não significa automaticamente enviar mensagem.

---

# 38. Pending Resource Notification

Possível política:

```text
created PENDING
↓
notify responsible mapper
```

Mas depende de existir:

```text
responsible mapper
```

e regra de ownership.

---

# 39. Old Pendencies

Dashboard exige conceito de:

```text
old pending item
```

Disparo de notificação depende da política própria de WFQ-013. Antiguidade é definida em DASHQ-008; não implica disparo automático (DEC-033).

---

# 40. Antiguidade e disparo

DASHQ-008 define antiguidade, inclusive eventual diferença de limiar por recurso. WFQ-013 define quando alertar/notificar. Ambas dependem de DASHQ-007 para o início da contagem. Não há prazo definido nem equivalência automática entre os limiares (DEC-033).

---

# 41. Não usar `updatedAt`

Pendência antiga não deve ser calculada automaticamente por:

```text
updatedAt
```

porque uma edição não necessariamente reinicia o prazo da pendência.

---

# 42. `pendingSince`

Pode ser necessário:

```text
pendingSince
```

ou derivação a partir de evento histórico.

Relacionado a:

```text
DASHQ-007
```

---

# 43. Reminder

Reminder é diferente de evento único.

Exemplo:

```text
System became PENDING
```

é evento.

```text
System has been PENDING for 15 days
```

é condição temporal.

---

# 44. Scheduler

Reminders temporais podem exigir:

```text
scheduled job
```

Não exigem necessariamente Redis/BullMQ.

---

# 45. V1 Scheduler

Pode ser implementado com mecanismo simples compatível com infraestrutura escolhida.

Não introduzir:

```text
Redis

BullMQ

Kafka

RabbitMQ
```

somente para executar uma checagem diária simples.

---

# 46. Jobs

Se jobs forem adotados, devem ser:

```text
tenant-aware

idempotent

observable

retry-safe
```

---

# 47. Notification Creation

Criação deve ser idempotente quando originada por job/retry.

---

# 48. Duplicate Problem

Exemplo:

```text
daily pending scan
```

não deve criar:

```text
30 identical unread notifications
```

para a mesma pendência sem política explícita.

---

# 49. Deduplication

Pode utilizar chave conceitual:

```text
recipient
+
notification type
+
resource
+
notification cycle
```

---

# 50. Nova Open Question

Adicionar:

```text
NOTIFQ-001
```

**Question:**

```text
Qual será a política de deduplicação de Notifications?
```

**Priority:**

```text
HIGH
```

---

# 51. Notification Cycle

Para reminders recorrentes, pode ser:

```text
daily

weekly

once
```

Não definir até política de reminder ser decidida.

---

# 52. Read State

Usuário deve poder marcar Notification como:

```text
read
```

---

# 53. Mark Read

Endpoint conceitual:

```http
POST /api/v1/notifications/{id}/read
```

ou:

```http
PATCH /api/v1/notifications/{id}
```

Ação semântica é preferível se houver somente mudança de leitura.

---

# 54. Mark All Read

Pode existir:

```http
POST /api/v1/notifications/read-all
```

se UX exigir.

---

# 55. Delete Notification

Não é requisito inicial.

Pode ser suficiente manter:

```text
read/unread
```

e aplicar retenção.

---

# 56. Notification Retention

Deve existir política para evitar crescimento indefinido.

---

# 57. Nova Open Question

Adicionar:

```text
NOTIFQ-002
```

**Question:**

```text
Por quanto tempo Notifications serão mantidas?
```

**Priority:**

```text
MEDIUM
```

---

# 58. Notification List

Endpoint conceitual:

```http
GET /api/v1/notifications
```

---

# 59. Filters

Possíveis:

```text
status

type

createdFrom

createdTo
```

---

# 60. Pagination

Aplicar:

```text
20-API-CONTRACTS.md
```

---

# 61. Unread Count

Endpoint possível:

```http
GET /api/v1/notifications/unread-count
```

ou inclusão no:

```text
GET /me
```

---

# 62. Nova Open Question

Adicionar:

```text
NOTIFQ-003
```

**Question:**

```text
Unread count será endpoint próprio ou parte do bootstrap `/me`?
```

**Priority:**

```text
LOW
```

---

# 63. Notification Response

Exemplo conceitual:

```json
{
  "id": "uuid",
  "type": "ACTIVITY_REVIEW_REQUESTED",
  "resource": {
    "type": "PROCESSING_ACTIVITY",
    "id": "uuid"
  },
  "readAt": null,
  "createdAt": "2026-09-17T14:30:00.000Z"
}
```

---

# 64. Presentation

Backend não precisa persistir mensagem completa como:

```text
"João enviou atividade Folha de Pagamento..."
```

se ela puder ser construída de forma segura pelo frontend.

---

# 65. Message Templates

Pode existir mapeamento:

```text
notification type
↓
translation/template
```

---

# 66. Example

```text
ACTIVITY_REVIEW_REQUESTED
```

Frontend:

```text
Uma atividade foi enviada para revisão.
```

---

# 67. Resource Name

UI pode buscar/exibir nome do recurso se usuário possuir acesso.

Não armazenar cópia desnecessária apenas para Notification.

---

# 68. Historical Presentation

Se recurso for posteriormente removido/inativado/arquivado, Notification ainda pode existir.

UI deve tolerar:

```text
resource unavailable
```

---

# 69. Authorization

Notification pertence ao:

```text
recipientUserId
```

e tenant correspondente.

Usuário não deve conseguir listar Notification de outro usuário sem capability administrativa explícita.

---

# 70. Tenant Isolation

Todas as queries devem aplicar:

```text
organizationId
```

e recipient/scope apropriado.

---

# 71. Notification IDOR

Exemplo:

```text
User A
GET /notifications/{notification-of-user-B}
```

deve falhar sem revelar conteúdo.

---

# 72. Opening Resource

Notification não concede acesso.

Fluxo:

```text
notification visible
↓
user clicks
↓
resource endpoint
↓
authorization checked again
```

---

# 73. Role Change

Se usuário perder acesso depois que Notification foi criada:

```text
Notification must not bypass new authorization state
```

---

# 74. Organization Switch

Em cenário multi-org:

```text
notifications must be isolated by active organization
```

salvo UX global explicitamente decidida.

---

# 75. Nova Open Question

Adicionar:

```text
NOTIFQ-004
```

**Question:**

```text
Usuários multi-org verão Notifications apenas da Organization ativa ou uma inbox global?
```

**Priority:**

```text
MEDIUM
```

Relacionado a:

```text
AUTHQ-006
```

---

# 76. Email

Email não deve ser enviado diretamente dentro de transação crítica.

Errado:

```text
submit activity
↓
send SMTP
↓
SMTP timeout
↓
transaction fails
```

---

# 77. Preferred Flow

Quando email existir:

```text
business transaction succeeds
↓
notification/event persisted
↓
email delivery processed separately
```

---

# 78. Delivery Failure

Falha no email não deve desfazer:

```text
Activity submitted
```

---

# 79. Email Provider

Não escolher fornecedor neste documento.

Possibilidades futuras podem existir, mas são decisão de infraestrutura/produto.

---

# 80. Email Content

Email deve minimizar conteúdo sensível.

Preferir:

```text
"Existe uma atividade aguardando sua revisão."
```

com link autenticado.

Evitar incluir ROPA ou detalhes sensíveis completos no email.

---

# 81. Email Links

Devem apontar para aplicação autenticada.

Não embutir token de autorização de longa duração em URL.

---

# 82. Email Preferences

Usuário pode futuramente escolher:

```text
in-app only

email + in-app

digest
```

Não é requisito inicial.

---

# 83. Nova Open Question

Adicionar:

```text
NOTIFQ-005
```

**Question:**

```text
V1 terá email notifications ou somente in-app?
```

**Priority:**

```text
HIGH
```

---

# 84. Preferences

Se preferences forem implementadas, eventos críticos podem precisar ignorar opt-out.

Isso exige definição de produto.

---

# 85. Nova Open Question

Adicionar:

```text
NOTIFQ-006
```

**Question:**

```text
Usuários poderão configurar preferências de Notification na V1?
```

**Priority:**

```text
MEDIUM
```

---

# 86. Mandatory Notifications

Não definir nenhuma Notification como:

```text
mandatory
```

até produto/workflow especificar.

---

# 87. Notification vs Assignment

Notification não substitui assignment.

Exemplo:

```text
reviewerUserId
```

é ownership/workflow.

```text
ACTIVITY_REVIEW_REQUESTED
```

é comunicação.

---

# 88. Assignment Model

Se workflow exigir responsáveis específicos, modelar explicitamente.

Não deduzir ownership pela existência de Notification.

---

# 89. Notification vs Task

Notification também não é Task Management.

V1 não precisa implementar:

```text
task status

task comments

task priorities

task due dates

task assignees
```

apenas por possuir Notifications.

---

# 90. Due Date

Se revisão periódica exigir prazo explícito, isso pertence ao domínio/workflow correspondente.

Notification apenas lembra o prazo.

---

# 91. Periodic Review

Possível futuro:

```text
Activity last review
+
review interval
↓
review due
↓
notification
```

Depende de:

```text
BRQ-009
```

---

# 92. Review Reminder

Não implementar até:

```text
periodicity

due date semantics

recipient
```

estarem definidos.

---

# 93. Dashboard Old Pendency vs Notification Reminder

Podem compartilhar a mesma regra de:

```text
pending age
```

mas não duplicar cálculo.

---

# 94. Shared Read Model/Service

Exemplo:

```text
PendingItemPolicy
```

pode fornecer:

```text
isOldPending(...)
```

para:

```text
Dashboard

Notification scheduler
```

sem criar duas fórmulas.

---

# 95. Event Generation

Eventos de negócio relevantes podem originar Notification.

Mas não é necessário introduzir:

```text
event bus
```

para isso.

---

# 96. Modular Monolith

No modular monolith, pode existir:

```text
application event
```

ou chamada interna explícita.

Escolher solução mais simples que preserve transação e confiabilidade necessárias.

---

# 97. Event Bus

Não introduzir:

```text
Kafka

RabbitMQ

distributed event bus
```

sem necessidade arquitetural.

---

# 98. Transactional Reliability

Existe problema potencial:

```text
business transaction succeeds
↓
notification creation fails
```

Se Notification for crítica, será necessário mecanismo confiável.

---

# 99. Outbox Pattern

Outbox pode ser considerado futuramente se entrega assíncrona confiável se tornar necessária.

Não implementar preventivamente.

---

# 100. Nova Open Question

Adicionar:

```text
NOTIFQ-007
```

**Question:**

```text
Notifications funcionais críticas precisam de garantia transacional/outbox na V1?
```

**Priority:**

```text
MEDIUM
```

---

# 101. Notification Audit

Criar Notification não precisa necessariamente gerar AuditLog.

---

# 102. Business Event Audit

O evento que originou Notification pode já estar auditado.

Exemplo:

```text
ACTIVITY_SUBMITTED
```

AuditLog.

Notification:

```text
ACTIVITY_REVIEW_REQUESTED
```

comunicação.

---

# 103. Read Audit

Marcar Notification como lida normalmente não precisa gerar AuditLog de negócio.

---

# 104. Email Delivery Log

Se email existir, delivery status pertence à infraestrutura de Notification.

Não ao AuditLog funcional por padrão.

---

# 105. Delivery Entity

Somente se múltiplos canais forem implementados, pode surgir:

```text
NotificationDelivery
```

Campos possíveis:

```text
notificationId

channel

status

attempts

lastAttemptAt

deliveredAt

failureCode
```

Não implementar na V1 se houver apenas in-app.

---

# 106. Delivery Status

Possíveis futuros:

```text
PENDING

SENT

FAILED
```

---

# 107. Retry

Email/job retries devem ser:

```text
bounded

observable

idempotent
```

---

# 108. Poison Message

Se fila futura existir, mensagens que falham repetidamente não devem bloquear toda fila.

Não é requisito de V1 sem queue.

---

# 109. Observability

Monitorar quando aplicável:

```text
notification creation failures

delivery failures

job failures

notification backlog

email provider failures
```

---

# 110. Logs

Não registrar conteúdo completo da Notification se contiver contexto funcional sensível.

---

# 111. Metrics

Possíveis métricas:

```text
notifications_created_total

notification_delivery_failures_total
```

Evitar labels de alta cardinalidade como:

```text
userId

resourceId
```

---

# 112. Security

Notification metadata deve ser considerada dado interno da Organization.

Aplicar:

```text
09-SECURITY.md
```

---

# 113. Rate Limiting

Endpoints de leitura/marcação podem utilizar política normal da API.

---

# 114. Notification Storm

Sistema deve evitar gerar centenas de Notifications por operação em massa.

---

# 115. Recipient Groups

Se evento tiver vários destinatários:

```text
create one Notification per recipient
```

é modelo simples.

---

# 116. Group Notification

Não criar entidade complexa de grupo inicialmente.

---

# 117. Bulk Read

Se volume justificar, pode existir ação:

```text
mark all as read
```

---

# 118. Unread Badge

Frontend pode exibir:

```text
bell icon
+
unread count
```

---

# 119. Refresh Strategy

V1 pode utilizar:

```text
query refresh

refetch interval

refresh on navigation
```

Não precisa WebSocket.

---

# 120. Real-time

Não introduzir:

```text
WebSocket

SSE
```

apenas para badge em tempo real.

---

# 121. Nova Open Question

Adicionar:

```text
NOTIFQ-008
```

**Question:**

```text
Notifications da V1 precisam de atualização em tempo real?
```

**Priority:**

```text
LOW
```

---

# 122. Frontend Routes

Possível:

```text
/notifications
```

e dropdown no header.

Não é obrigatório possuir página dedicada se UX não exigir.

---

# 123. Notification Click

Mapeamento por type/resource deve ser centralizado.

Exemplo:

```text
PROCESSING_ACTIVITY
→ /processing-activities/{id}
```

---

# 124. Deep Link

Se evento estiver relacionado a seção específica:

```text
COMPLIANCE_REVIEW_REQUIRED
```

pode direcionar para:

```text
Activity → Compliance
```

---

# 125. Não persistir URL completa

Preferir:

```text
resourceType

resourceId

optional action/context code
```

em vez de URL rígida, evitando quebrar Notifications quando rotas mudarem.

---

# 126. Notification Action

Campo opcional futuro:

```text
actionCode
```

Exemplos:

```text
REVIEW_ACTIVITY

REVIEW_COMPLIANCE

COMPLETE_SYSTEM_MAPPING
```

---

# 127. Nova Open Question

Adicionar:

```text
NOTIFQ-009
```

**Question:**

```text
Notification precisa armazenar `actionCode` além de resourceType/resourceId?
```

**Priority:**

```text
LOW
```

---

# 128. Expiration

Algumas Notifications podem deixar de ser acionáveis.

Exemplo:

```text
Activity review requested
↓
someone else completes review
```

Notification antiga continua existindo, mas ação pode não estar mais disponível.

---

# 129. Não sincronizar status manualmente

Não é necessário atualizar toda Notification para:

```text
RESOLVED
```

se recurso atual puder determinar allowedActions.

---

# 130. Allowed Actions

Ao abrir recurso, frontend deve respeitar estado atual retornado pela API.

Relacionado a:

```text
APIQ-016
```

---

# 131. Stale Notification

UI deve tolerar:

```text
notification refers to already-resolved event
```

---

# 132. Example — Review Request

```text
User submits Activity
↓
backend validates Submit
↓
workflow transition succeeds
↓
AuditLog records ACTIVITY_SUBMITTED
↓
review recipient determined
↓
Notification created
↓
reviewer sees unread notification
```

---

# 133. Example — Pending System

```text
User Quick Creates System
↓
System created
mappingStatus = PENDING
↓
Dashboard counts pending System
↓
optional Notification generated only if policy requires
```

---

# 134. Example — Compliance Review

```text
Compliance Gate runs
↓
SENSITIVE_DATA = REVIEW_REQUIRED
↓
Activity/Compliance state updated
↓
reviewer determined
↓
Notification created if review workflow requires
```

---

# 135. Example — Old Pendency

```text
Scheduled check
↓
System pendingSince exceeds configured threshold
↓
deduplication check
↓
Notification created if reminder policy requires
```

---

# 136. V1 Recommended Events

Após decisões necessárias, conjunto mínimo candidato:

```text
ACTIVITY_REVIEW_REQUESTED

ACTIVITY_REJECTED

COMPLIANCE_REVIEW_REQUIRED
```

Opcionalmente:

```text
SYSTEM_MAPPING_PENDING

SUPPLIER_MAPPING_PENDING
```

se existir responsável claro.

---

# 137. V1 Recommended Channel

Inicialmente:

```text
IN_APP
```

Email somente se:

```text
NOTIFQ-005
```

decidir inclusão.

---

# 138. V2 Candidates

```text
email

digest

periodic review reminders

advanced preferences

real-time updates

external channels

webhooks
```

---

# 139. API

Possíveis endpoints:

```http
GET /api/v1/notifications

GET /api/v1/notifications/unread-count

POST /api/v1/notifications/{id}/read

POST /api/v1/notifications/read-all
```

---

# 140. Não permitir Create público

Não disponibilizar:

```http
POST /api/v1/notifications
```

para usuário criar Notification arbitrária.

Notifications são originadas por regras internas do sistema.

---

# 141. Não permitir editar conteúdo

Usuário não deve fazer:

```http
PATCH /api/v1/notifications/{id}
```

alterando:

```text
type

recipient

resource

metadata
```

---

# 142. Permission Model

Permissions candidatas:

```text
notification:read-own

notification:mark-read-own
```

Administração de Notifications não é requisito inicial.

---

# 143. Retention Cleanup

Se política definir retenção:

```text
scheduled cleanup
```

pode remover Notifications antigas quando permitido.

---

# 144. Cleanup não remove AuditLog

Notification retention não afeta:

```text
AuditLog

ActivityVersion
```

---

# 145. Data Model Candidate

```text
notifications

id UUID PK
organization_id UUID NOT NULL
recipient_user_id UUID NOT NULL
type VARCHAR NOT NULL
resource_type VARCHAR NOT NULL
resource_id UUID NOT NULL
read_at TIMESTAMPTZ NULL
metadata JSONB NULL
created_at TIMESTAMPTZ NOT NULL
```

É modelo inicial, sujeito às decisões deste documento.

---

# 146. Suggested Indexes

Possíveis:

```text
(organization_id, recipient_user_id, read_at)

(organization_id, recipient_user_id, created_at)

(organization_id, resource_type, resource_id)
```

Índices finais devem ser definidos conforme queries reais.

---

# 147. Deduplication Index

Não criar unique constraint de deduplicação antes de:

```text
NOTIFQ-001
```

---

# 148. Open Questions adicionadas

Adicionar a:

```text
docs/12-OPEN-QUESTIONS.md
```

```text
NOTIFQ-001
Qual será a política de deduplicação de Notifications?
Priority: HIGH

NOTIFQ-002
Por quanto tempo Notifications serão mantidas?
Priority: MEDIUM

NOTIFQ-003
Unread count será endpoint próprio ou parte do `/me`?
Priority: LOW

NOTIFQ-004
Usuários multi-org verão Notifications somente da Organization ativa ou inbox global?
Priority: MEDIUM

NOTIFQ-005
V1 terá email notifications ou somente in-app?
Priority: HIGH

NOTIFQ-006
Usuários poderão configurar preferências de Notification na V1?
Priority: MEDIUM

NOTIFQ-007
Notifications críticas precisam de garantia transacional/outbox na V1?
Priority: MEDIUM

NOTIFQ-008
Notifications da V1 precisam de atualização em tempo real?
Priority: LOW

NOTIFQ-009
Notification precisa armazenar actionCode?
Priority: LOW
```

---

# 149. Questões existentes relacionadas

```text
WFQ-003
AUTHQ-002
AUTHQ-006

BRQ-009

WFQ-002
WFQ-005
WFQ-009

CGQ-001

SYSQ-007
DASHQ-008

SUPQ-006

DASHQ-006
DASHQ-007

APIQ-016

INFRAQ-003
INFRAQ-004
```

---

# 150. AI Rules

Antes de criar Notification:

```text
1. Identify business event
2. Verify event is real domain state
3. Determine whether human action is required
4. Determine authorized recipient
5. Check notification policy
6. Check deduplication
7. Persist minimal metadata
8. Preserve tenant isolation
9. Add tests
```

---

# 151. AI Stop Condition

Se não estiver definido:

```text
who receives it

when it is generated

whether it repeats
```

não inventar comportamento.

Registrar:

```text
Decision Required
```

---

# 152. Prohibited Patterns

Não fazer:

```text
Notification as workflow source of truth

Notification as task management system

notify every DPO automatically

notify every user in Organization

infer recipient from UI

store sensitive resource snapshots in Notification

allow cross-tenant Notification access

use Notification to bypass authorization

send email inside critical DB transaction

introduce Kafka for simple Notifications

introduce Redis/BullMQ without need

introduce WebSocket only for unread badge

create duplicate reminders every scheduler run

use updatedAt as pendingSince

hardcode frontend URLs into persisted Notification

treat sensitive/minor data as automatic alert
```

---

# 153. Tests

Cobrir:

```text
notification creation

correct recipient

wrong recipient isolation

tenant isolation

read/unread

mark read

pagination

deduplication

stale resource

lost resource access

organization switch

scheduler idempotency

email failure when applicable
```

---

# 154. Security Test

```text
Given:
Notification belongs to User A

When:
User B requests notification ID

Then:
content is not exposed
```

---

# 155. Tenant Test

```text
Given:
Notification belongs to Organization A

When:
authenticated context is Organization B

Then:
Notification is unavailable
```

---

# 156. Stale Permission Test

```text
Given:
User received Notification for Activity

And:
User later loses Activity access

When:
User opens Activity through Notification

Then:
normal authorization denies resource
```

---

# 157. Deduplication Test

Quando política for definida:

```text
same reminder job runs twice
↓
no unintended duplicate Notification
```

---

# 158. Acceptance Criteria

Este documento estará aplicado quando:

```text
[ ] Notification está separada de Dashboard

[ ] Notification está separada de AuditLog

[ ] Notification está separada de ComplianceCheck

[ ] Notification não controla workflow

[ ] recipients são autorizados

[ ] tenant isolation existe

[ ] read/unread existe

[ ] deduplication definida

[ ] retention definida

[ ] scheduler é idempotente

[ ] email não participa da transação crítica

[ ] Notification não bypassa autorização

[ ] testes de segurança existem
```

---

# 159. Definition of Done

Para considerar Notifications prontas na V1:

```text
[ ] eventos V1 decididos

[ ] recipients decididos

[ ] channel V1 decidido

[ ] Notification schema implementado

[ ] list endpoint implementado

[ ] unread count implementado

[ ] mark read implementado

[ ] tenant isolation implementado

[ ] authorization implementada

[ ] deduplication implementada quando necessária

[ ] scheduler implementado somente se necessário

[ ] observability implementada

[ ] integration tests passando

[ ] E2E principal passando
```

---

# 160. Regra final

Notification deve existir porque:

```text
algo aconteceu
```

ou:

```text
algo exige atenção
```

e não simplesmente porque:

```text
existe informação no sistema
```

Fluxo correto:

```text
Domain State / Business Event
↓
Notification Policy
↓
Authorized Recipient
↓
Notification
```

Nunca:

```text
Notification
↓
defines Domain State
```

---

# 161. Próximo documento

O próximo documento é:

```text
docs/25-UX-GUIDELINES.md
```

Ele deve consolidar:

```text
layout

navigation

forms

Wizard UX

loading states

empty states

error states

success feedback

confirmation dialogs

destructive actions

tables

filters

Dashboard

Compliance Gate presentation

status badges

accessibility

responsive behavior

unsaved changes

Quick Create

Notifications

historical/read-only views
```

O objetivo será fazer com que todas as telas implementadas por desenvolvedores ou agentes de IA mantenham o mesmo padrão de interação.
