# Observability

> **Documento:** Observabilidade, Monitoramento e Diagnóstico  
> **Status:** Draft  
> **Objetivo:** definir como a plataforma deve produzir sinais operacionais suficientes para detectar, investigar e diagnosticar problemas sem expor dados sensíveis ou confundir observabilidade técnica com auditoria funcional.

---

# 1. Objetivo

A observabilidade deve permitir responder:

```text
A aplicação está disponível?

Está funcionando corretamente?

Há erros aumentando?

As requisições estão lentas?

O banco está saudável?

Jobs estão falhando?

Exports estão demorando?

Existe problema restrito a um tenant?

Qual requisição originou determinado erro?

Qual versão da aplicação apresentou o problema?
```

---

# 2. Pilares

A estratégia deve considerar:

```text
Logs

Metrics

Traces
```

Traces distribuídos não são obrigatórios na V1.

Como a arquitetura inicial é:

```text
Modular Monolith
```

começar com:

```text
structured logs

request correlation

metrics essenciais

error tracking

health/readiness

alerting essencial
```

---

# 3. Princípio

Observabilidade deve crescer conforme necessidade.

Não introduzir automaticamente:

```text
ELK cluster

Prometheus

Grafana

OpenTelemetry Collector

Jaeger

Loki

Datadog

New Relic
```

sem decisão de infraestrutura.

Este documento define comportamento e requisitos, não fornecedor.

---

# 4. Separação de responsabilidades

Existem três conceitos diferentes:

```text
Application Log

Audit Log

Business Dashboard
```

Eles não devem ser confundidos.

---

# 5. Application Log

Objetivo:

```text
diagnóstico técnico

operações

investigação de erros

performance

infraestrutura
```

Exemplo:

```json
{
  "level": "info",
  "event": "http_request_completed",
  "requestId": "req_123",
  "method": "POST",
  "path": "/api/v1/processing-activities",
  "statusCode": 201,
  "durationMs": 84
}
```

---

# 6. Audit Log

Objetivo:

```text
rastreabilidade de ações relevantes de negócio
```

Exemplo conceitual:

```text
PROCESSING_ACTIVITY_CREATED

ACTIVITY_SUBMITTED

COMPLIANCE_GATE_RUN

ACTIVITY_ACTIVATED

ROPA_EXPORTED
```

AuditLog segue:

```text
10-AUDIT.md
```

---

# 7. Business Dashboard

O Dashboard do DPO apresenta:

```text
estado funcional do mapeamento

pendências

dados sensíveis

menores

transferências internacionais

Systems pendentes

Suppliers pendentes
```

Ele segue:

```text
features/DASHBOARD.md
```

Não utilizar métricas técnicas como fonte do Dashboard funcional.

---

# 8. Regra principal

```text
Application Log ≠ AuditLog ≠ Dashboard
```

---

# 9. Structured Logging

Logs devem preferencialmente ser estruturados.

Formato recomendado:

```json
{
  "timestamp": "2026-09-17T14:30:00.000Z",
  "level": "info",
  "event": "processing_activity_created",
  "requestId": "req_123",
  "organizationId": "org_uuid",
  "actorId": "user_uuid",
  "activityId": "activity_uuid"
}
```

---

# 10. Campos comuns

Quando aplicável:

```text
timestamp

level

event

requestId

organizationId

actorId

resourceType

resourceId

durationMs

statusCode

applicationVersion

environment
```

---

# 11. Campos opcionais

Somente quando necessários:

```text
jobId

exportId

errorCode

module

operation
```

---

# 12. Request ID

Cada requisição deve possuir:

```text
requestId
```

---

# 13. Request ID recebido do cliente

Se aceitar request ID externo:

```text
validar formato

limitar tamanho

não confiar semanticamente
```

Alternativamente, backend gera novo ID.

---

# 14. Propagação

`requestId` deve acompanhar:

```text
Controller
↓
Use Case
↓
Repository
↓
Relevant Logs
```

quando tecnicamente viável.

---

# 15. Response

Pode retornar:

```http
X-Request-Id: ...
```

para facilitar suporte e diagnóstico.

---

# 16. Jobs

Quando uma requisição gerar job:

```text
requestId
↓
jobId
```

A correlação deve ser preservável.

---

# 17. Exports

Exemplo:

```text
requestId

exportId

jobId

organizationId
```

podem ser correlacionados.

---

# 18. Organization Context

Logs tenant-bound podem registrar:

```text
organizationId
```

para diagnóstico.

---

# 19. Segurança do tenant nos logs

`organizationId` é contexto técnico.

Isso não autoriza que ferramentas de observabilidade exponham logs de todos os tenants para usuários da aplicação.

---

# 20. Actor Context

Quando relevante:

```text
actorId
```

pode ser registrado.

Evitar registrar dados desnecessários como:

```text
full name

email

document
```

se ID já for suficiente.

---

# 21. Log Levels

Utilizar:

```text
ERROR

WARN

INFO

DEBUG
```

---

# 22. ERROR

Usar quando operação falhou de maneira inesperada ou exige investigação.

Exemplos:

```text
database unavailable

unexpected exception

storage failure

export generation failure
```

---

# 23. WARN

Usar para situações anormais mas tratadas.

Exemplos:

```text
retry scheduled

deprecated configuration

unexpected but recoverable condition
```

---

# 24. INFO

Usar para eventos operacionais úteis.

Exemplos:

```text
application started

application stopped

migration completed

job completed
```

Evitar transformar cada pequena ação do usuário em INFO se AuditLog já cobre o evento.

---

# 25. DEBUG

Utilizar para diagnóstico detalhado.

Produção deve evitar DEBUG permanente sem necessidade.

---

# 26. Proibido

Nunca utilizar logs para armazenar:

```text
password

access token

refresh token

session token

authorization header

cookie value

database password

storage secret

private key
```

---

# 27. Request Body

Não registrar automaticamente:

```text
req.body
```

---

# 28. Response Body

Não registrar automaticamente:

```text
response body
```

---

# 29. Motivo

Payloads podem conter:

```text
legal basis justification

security measures

supplier metadata

consent metadata

document metadata

internal organizational information
```

---

# 30. Sanitization

Deve existir estratégia de sanitização para campos sensíveis.

Exemplo conceitual:

```ts
{
  authorization: '[REDACTED]',
  cookie: '[REDACTED]',
  password: '[REDACTED]'
}
```

---

# 31. Redaction

Redaction deve ocorrer antes do envio para ferramenta externa de logs/error tracking quando possível.

---

# 32. Error Objects

Erros podem conter:

```text
message

errorCode

stack

cause
```

Stack trace deve permanecer em ambiente técnico autorizado.

Não retornar stack ao cliente.

---

# 33. SQL Errors

Não expor ao usuário:

```text
SQL query

table names desnecessários

database hostname

credentials

internal stack
```

---

# 34. Expected Errors

Erros esperados de negócio não devem gerar ERROR automaticamente.

Exemplo:

```text
INVALID_ACTIVITY_TRANSITION
```

pode ser comportamento esperado da aplicação.

---

# 35. 4xx

Nem todo:

```text
4xx
```

é incidente.

---

# 36. 5xx

Aumento de:

```text
5xx
```

é sinal operacional relevante.

---

# 37. Metrics

Métricas devem ser agregáveis e possuir cardinalidade controlada.

---

# 38. HTTP Metrics

Mínimo recomendado:

```text
request count

request duration

status code distribution
```

---

# 39. Exemplo conceitual

```text
http_requests_total

http_request_duration_seconds

http_responses_total
```

Nomes definitivos dependem da biblioteca.

---

# 40. Labels

Labels devem possuir baixa cardinalidade.

Adequado:

```text
method

route template

status class
```

Evitar:

```text
userId

activityId

supplierId

requestId
```

como labels de métricas.

---

# 41. Organization ID em métricas

Evitar utilizar:

```text
organizationId
```

como label global de todas as métricas.

Pode gerar alta cardinalidade e exposição desnecessária.

Para investigação tenant-specific, preferir logs quando adequado.

---

# 42. Route Metrics

Utilizar:

```text
/api/v1/processing-activities/:id
```

como dimensão.

Não:

```text
/api/v1/processing-activities/550e8400-e29b-...
```

---

# 43. Database Metrics

Monitorar quando disponível:

```text
connection pool usage

query latency

connection errors

transaction failures
```

---

# 44. Slow Queries

Queries lentas devem poder ser identificadas.

Não registrar parâmetros sensíveis indiscriminadamente.

---

# 45. Query Performance

Problemas em:

```text
ROPA

Dashboard

Activity listing
```

devem primeiro ser analisados por:

```text
query plan

indexes

pagination

N+1
```

antes de adicionar cache.

---

# 46. Object Storage Metrics

Quando relevante:

```text
upload failures

download authorization failures

storage latency

export upload failures
```

---

# 47. Job Metrics

Se jobs forem introduzidos:

```text
jobs created

jobs completed

jobs failed

job duration

retry count

queue depth
```

---

# 48. Export Metrics

Quando exportação existir:

```text
export duration

export failures

export size
```

podem ser monitorados.

---

# 49. Compliance Metrics

Não criar métrica técnica chamada:

```text
lgpd_compliance_score
```

sem requisito funcional explícito.

---

# 50. Sensitive/Minor Metrics

Contagens funcionais pertencem primariamente ao Dashboard/read model.

Não duplicar lógica de domínio na plataforma de métricas.

---

# 51. Health Check

Aplicar:

```text
17-ENVIRONMENTS-AND-DEPLOYMENT.md
```

---

# 52. Liveness

Pergunta:

```text
o processo está funcionando?
```

---

# 53. Readiness

Pergunta:

```text
a instância está apta a receber tráfego?
```

---

# 54. Endpoints conceituais

Possível:

```http
GET /health/live

GET /health/ready
```

ou estrutura equivalente.

---

# 55. Liveness não deve depender de tudo

Se liveness consultar todas as dependências externas, uma falha transitória pode causar restart desnecessário.

---

# 56. Readiness e PostgreSQL

Readiness pode considerar PostgreSQL se banco for essencial para atender requisições.

---

# 57. Readiness e Storage

Decidir se storage indisponível torna aplicação inteira:

```text
NOT READY
```

ou apenas features de arquivo indisponíveis.

Não assumir automaticamente.

---

# 58. Nova Open Question

Adicionar:

```text
OBSQ-001
```

Pergunta:

```text
Quais dependências devem participar do readiness check?
```

Priority:

```text
MEDIUM
```

---

# 59. Health Response

Não expor:

```text
credentials

internal topology

private hostname

connection string
```

---

# 60. Error Tracking

Produção deve considerar ferramenta centralizada para exceções.

Fornecedor ainda não definido.

---

# 61. Error Tracking Context

Pode incluir:

```text
environment

applicationVersion

requestId

module

errorCode
```

---

# 62. User Context

Se actorId for enviado a serviço externo de error tracking, avaliar necessidade e política de privacidade.

Evitar enviar:

```text
email

name

personal data
```

sem necessidade.

---

# 63. Payload Sanitization

Integração de error tracking deve possuir:

```text
beforeSend
```

ou mecanismo equivalente de sanitização quando disponível.

---

# 64. Tracing

Tracing distribuído não é obrigatório inicialmente.

---

# 65. OpenTelemetry

Pode ser adotado futuramente se houver necessidade de:

```text
distributed tracing

cross-service correlation

standardized telemetry
```

Não é dependência obrigatória da V1.

---

# 66. Modular Monolith Tracing

No início:

```text
requestId

structured logs

timing metrics
```

podem ser suficientes.

---

# 67. External Calls

Se existirem integrações externas, medir:

```text
latency

success

failure

timeout
```

sem registrar payload sensível.

---

# 68. Timeout

Chamadas externas devem possuir timeout explícito.

---

# 69. Retry

Retry deve ser aplicado apenas quando operação for segura para repetição ou idempotente.

---

# 70. Alerting

Alertas devem representar condições acionáveis.

---

# 71. Alertas mínimos

Considerar:

```text
API unavailable

elevated 5xx rate

database unavailable

backup failure

persistent job failures

storage failures

authentication failures above expected baseline
```

---

# 72. Alert Fatigue

Não criar alerta para qualquer evento isolado.

Preferir:

```text
threshold

duration

rate
```

apropriados.

---

# 73. Thresholds

Valores definitivos devem ser calibrados após observação.

Não inventar SLA operacional arbitrariamente.

---

# 74. Nova Open Question

Adicionar:

```text
OBSQ-002
```

Pergunta:

```text
Quais SLIs/SLOs serão adotados para a V1?
```

Priority:

```text
MEDIUM
```

---

# 75. Availability

Possível SLI:

```text
successful request ratio
```

mas definição deve considerar quais endpoints contam.

---

# 76. Latency

Possível SLI:

```text
request duration percentile
```

sem definir meta arbitrária antes da decisão.

---

# 77. Error Rate

Possível:

```text
unexpected 5xx / total requests
```

---

# 78. Technical Dashboard

Pode existir dashboard operacional contendo:

```text
request volume

latency

errors

database

jobs

storage
```

---

# 79. Technical Dashboard ≠ DPO Dashboard

Nunca apresentar dashboard técnico como:

```text
Dashboard do DPO
```

---

# 80. Database Monitoring

Produção deve permitir identificar:

```text
connection exhaustion

long-running queries

deadlocks

storage growth

backup status
```

---

# 81. Connection Pool

Monitorar utilização do pool quando possível.

---

# 82. Database Size

Crescimento deve ser observável.

Especial atenção futura:

```text
AuditLog

ActivityVersion

exports metadata
```

---

# 83. AuditLog Growth

AuditLog append-only pode crescer continuamente.

Sua retenção depende das decisões de:

```text
AUDQ-001
```

ou questão correspondente no documento central.

---

# 84. ActivityVersion Growth

Snapshots também podem crescer.

Monitorar:

```text
row count

database size

snapshot size
```

antes de otimizações.

---

# 85. Storage Growth

Monitorar:

```text
attachments

consent documents

ROPA exports
```

---

# 86. Storage Retention

Relacionar com:

```text
INFRAQ-013
ROPAQ-005
```

---

# 87. Security Logging

Eventos de segurança podem exigir observação separada.

Exemplos:

```text
repeated authentication failures

authorization denials

cross-tenant access attempts

invalid session usage

rate limit triggered
```

---

# 88. Cross-Tenant Attempt

Tentativa de acesso cross-tenant deve ser:

```text
blocked
```

e pode gerar sinal de segurança.

---

# 89. Cuidado

Nem todo:

```text
404
```

de recurso inexistente deve virar alerta de segurança.

---

# 90. Authorization Denials

Taxas anormais de:

```text
403
```

podem indicar:

```text
misconfiguration

bug

abuse
```

mas precisam de contexto.

---

# 91. Authentication Failures

Não registrar:

```text
password informado
```

em nenhuma hipótese.

---

# 92. Rate Limit Events

Podem registrar:

```text
route

requestId

technical source information
```

conforme política de privacidade e segurança.

---

# 93. IP Address

Armazenamento de IP em logs deve ser uma decisão consciente de segurança/privacidade.

---

# 94. Nova Open Question

Adicionar:

```text
OBSQ-003
```

Pergunta:

```text
IP de origem deve ser armazenado nos logs técnicos e/ou eventos de segurança?
```

Priority:

```text
MEDIUM
```

---

# 95. User Agent

Mesma cautela se aplica a:

```text
User-Agent
```

---

# 96. Security Event Retention

Retenção de logs de segurança deve ser definida.

---

# 97. Nova Open Question

Adicionar:

```text
OBSQ-004
```

Pergunta:

```text
Qual será a retenção dos Application Logs e Security Logs?
```

Priority:

```text
HIGH
```

---

# 98. Audit Retention

AuditLog possui política independente.

Não usar automaticamente a retenção dos Application Logs.

---

# 99. Log Access

Acesso à plataforma de logs deve seguir:

```text
least privilege
```

---

# 100. Production Logs

Nem todo desenvolvedor precisa necessariamente de acesso irrestrito aos logs de produção.

---

# 101. Tenant Support

Se futuramente houver suporte técnico por tenant, ferramenta de observabilidade deve permitir filtragem segura por:

```text
organizationId
```

---

# 102. Log Integrity

Aplicação não deve permitir que usuário controle livremente campos estruturais de logs.

---

# 103. Log Injection

Entradas do usuário devem ser tratadas de forma que não consigam:

```text
forjar eventos

quebrar formato

injetar linhas
```

em logs.

Structured logging ajuda a reduzir esse risco.

---

# 104. Error Codes

Logs devem registrar códigos estáveis quando erro de aplicação possuir:

```text
errorCode
```

---

# 105. Exemplo

```json
{
  "level": "warn",
  "event": "request_rejected",
  "requestId": "req_123",
  "errorCode": "INVALID_ACTIVITY_TRANSITION",
  "resourceType": "ProcessingActivity",
  "resourceId": "..."
}
```

---

# 106. Exception Handler

Backend deve possuir tratamento global de exceções.

Responsabilidades:

```text
map known errors

generate safe response

log unexpected errors

preserve requestId
```

---

# 107. Expected Domain Error

Não gerar stack trace como ERROR para todo erro esperado.

---

# 108. Unexpected Error

Erro não reconhecido deve:

```text
generate internal error identifier

log stack

return generic safe response
```

---

# 109. Client Error Reference

Resposta pode incluir:

```text
requestId
```

para suporte.

Exemplo:

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Unexpected error",
    "requestId": "req_123"
  }
}
```

---

# 110. Frontend Error Reporting

Frontend pode enviar erros técnicos para ferramenta de error tracking.

---

# 111. Frontend Context

Pode incluir:

```text
route

applicationVersion

requestId from failed API response
```

---

# 112. Frontend Sensitive Data

Não enviar automaticamente:

```text
form values

wizard state

legal justification

security measures

uploaded file names
```

para error tracking.

---

# 113. Source Maps

Produção pode utilizar source maps para diagnóstico.

Se forem privados:

```text
não publicar desnecessariamente
```

Ferramenta de error tracking pode recebê-los durante build.

---

# 114. Application Version

Toda telemetria relevante deve permitir identificar versão implantada.

Exemplo:

```text
applicationVersion = Git SHA
```

---

# 115. Deployment Correlation

Deve ser possível responder:

```text
Os erros começaram depois de qual deploy?
```

---

# 116. Deploy Marker

Ferramenta de observabilidade pode registrar eventos de deploy.

---

# 117. Migration Observability

Migrations devem produzir informação operacional suficiente para saber:

```text
started

completed

failed
```

sem expor secrets.

---

# 118. Migration Failure

Falha de migration deve impedir deploy inconsistente quando necessário.

---

# 119. Backup Monitoring

Backup deve possuir:

```text
success/failure monitoring
```

---

# 120. Backup Alert

Falha persistente ou ausência de backup esperado deve gerar alerta operacional.

---

# 121. Restore

Restore tests devem gerar registro operacional/documental.

---

# 122. Job Observability

Se BullMQ ou equivalente for adotado, cada job relevante deve possuir:

```text
jobId

type

organizationId

attempt

status

duration
```

em logs quando apropriado.

---

# 123. Job Payload

Não registrar payload inteiro automaticamente.

---

# 124. Retry Logging

Não gerar dezenas de ERRORs para cada retry esperado.

Estratégia pode ser:

```text
WARN during retries

ERROR on terminal failure
```

---

# 125. ROPA Export Observability

Registrar tecnicamente:

```text
export started

export completed

export failed

duration

format
```

---

# 126. ROPA Export Audit

Separadamente:

```text
ROPA_EXPORTED
```

deve existir no AuditLog quando definido.

---

# 127. Compliance Gate Observability

Pode medir:

```text
execution duration

unexpected execution failures
```

---

# 128. Compliance Result

Não duplicar todos os resultados do Gate em logs técnicos.

Resultado pertence ao modelo de domínio.

---

# 129. Dashboard Observability

Monitorar:

```text
query duration

endpoint failures
```

Não duplicar métricas funcionais como fonte da verdade.

---

# 130. N+1 Detection

Durante desenvolvimento, queries de endpoints complexos devem ser observadas para identificar:

```text
N+1

repeated queries

unbounded queries
```

---

# 131. Slow Request Logging

Pode existir threshold para registrar requests lentos.

Valor deve ser configurável.

---

# 132. Nova Open Question

Adicionar:

```text
OBSQ-005
```

Pergunta:

```text
Qual threshold inicial deve classificar uma request como lenta?
```

Priority:

```text
LOW
```

Pode ser calibrado operacionalmente.

---

# 133. Sampling

Em alto volume, logs/traces podem exigir sampling.

Não necessário automaticamente na V1.

---

# 134. Sampling de AuditLog

Não aplicar sampling ao AuditLog.

Eventos de auditoria obrigatórios não podem desaparecer por sampling técnico.

---

# 135. Sampling de Security Events

Eventos críticos de segurança também não devem ser descartados indiscriminadamente.

---

# 136. Data Minimization

Aplicar princípio:

```text
log only what is useful
```

Não:

```text
log everything in case we need it later
```

---

# 137. Retention

Cada categoria pode possuir política diferente:

```text
Application Logs

Security Logs

Audit Logs

Metrics

Traces

Error Tracking Events
```

---

# 138. Nova Open Question

Adicionar:

```text
OBSQ-006
```

Pergunta:

```text
Por quanto tempo métricas, traces e eventos de error tracking devem ser mantidos?
```

Priority:

```text
LOW
```

---

# 139. Environment Separation

Telemetria deve identificar claramente:

```text
development

test

staging

production
```

---

# 140. Test Logs

CI deve evitar volume excessivo de logs em execução normal.

Em falha, deve disponibilizar informação suficiente para diagnóstico.

---

# 141. Local Development

Desenvolvimento pode utilizar logging legível por humanos.

Produção deve priorizar formato estruturado.

---

# 142. Pretty Logs

Pretty printing pode ser habilitado localmente sem alterar estrutura semântica dos eventos.

---

# 143. Sensitive Test Data

Mesmo ambientes de teste não devem usar secrets reais ou dados reais desnecessariamente.

---

# 144. Observability Provider

Fornecedor ainda está aberto.

---

# 145. Nova Open Question

Adicionar:

```text
OBSQ-007
```

Pergunta:

```text
Qual stack de observabilidade será utilizada em produção?
```

Priority:

```text
MEDIUM
```

Opções devem ser avaliadas após definição da infraestrutura.

---

# 146. Vendor Lock-in

Quando razoável, código da aplicação deve evitar dependência profunda de APIs proprietárias para logging básico.

---

# 147. OpenTelemetry Compatibility

Compatibilidade futura com padrões como OpenTelemetry é desejável, mas não deve gerar complexidade prematura.

---

# 148. Alert Destination

É necessário definir onde alertas operacionais serão recebidos.

---

# 149. Nova Open Question

Adicionar:

```text
OBSQ-008
```

Pergunta:

```text
Qual canal receberá alertas operacionais de produção?
```

Priority:

```text
MEDIUM
```

Exemplos possíveis:

```text
email

Slack

Microsoft Teams

incident management platform
```

A escolha não deve ser assumida.

---

# 150. Ownership

Todo alerta deve possuir responsável operacional.

Evitar:

```text
alerta existe mas ninguém sabe quem responde
```

---

# 151. Incident Context

Um alerta útil deve indicar:

```text
environment

service

condition

time

relevant dashboard/log link
```

quando infraestrutura permitir.

---

# 152. Runbooks

Alertas críticos devem futuramente possuir runbook.

Exemplo:

```text
Database unavailable
→ runbook/database-unavailable.md
```

---

# 153. Runbooks não são obrigatórios imediatamente

Criá-los conforme operações reais forem definidas.

---

# 154. Observability Tests

Testar pelo menos:

```text
requestId generated

requestId returned

unexpected errors logged

secrets redacted

health endpoint

readiness behavior

cross-tenant attempt does not leak data

error response does not expose stack
```

---

# 155. Redaction Tests

Criar testes específicos garantindo que valores como:

```text
Authorization

Cookie

password

token
```

não aparecem nos logs.

---

# 156. Error Handler Tests

Validar:

```text
known domain error

validation error

authorization error

unexpected exception
```

---

# 157. Metrics Tests

Não é necessário testar biblioteca de métricas.

Testar instrumentação própria relevante.

---

# 158. Health Tests

Validar comportamento quando:

```text
application healthy

database unavailable
```

e demais dependências conforme `OBSQ-001`.

---

# 159. Prohibited Patterns

Não fazer:

```text
console.log(req.body)

console.log(process.env)

log Authorization header

log cookies

log passwords

log full JWT

log full database error to client

log full consent documents

log uploaded file contents

use AuditLog as debug log

use technical metrics as DPO Dashboard

use userId/requestId as metric labels

create "LGPD compliance score" metric arbitrarily

sample mandatory AuditLog events

return stack traces in production
```

---

# 160. Implementation Order

Sugestão:

```text
Structured Logger
↓
Request ID
↓
Global Exception Handler
↓
Health/Liveness
↓
Readiness
↓
Basic HTTP Metrics
↓
Error Tracking
↓
Infrastructure Metrics
↓
Alerting
↓
Jobs/Export Metrics
↓
Tracing if needed
```

---

# 161. V1 mínimo

Para V1:

```text
structured logs

requestId

safe error handling

health endpoint

readiness endpoint

basic HTTP metrics

database monitoring

error tracking

backup monitoring

essential alerts
```

---

# 162. Pode esperar

Inicialmente pode ficar fora:

```text
distributed tracing

complex log analytics

custom observability platform

advanced anomaly detection

business intelligence telemetry

multi-region monitoring
```

---

# 163. Open Questions

Adicionar ao:

```text
docs/12-OPEN-QUESTIONS.md
```

as seguintes questões:

```text
OBSQ-001
Quais dependências devem participar do readiness check?
Priority: MEDIUM

OBSQ-002
Quais SLIs/SLOs serão adotados para a V1?
Priority: MEDIUM

OBSQ-003
IP de origem deve ser armazenado nos logs técnicos e/ou eventos de segurança?
Priority: MEDIUM

OBSQ-004
Qual será a retenção dos Application Logs e Security Logs?
Priority: HIGH

OBSQ-005
Qual threshold inicial deve classificar uma request como lenta?
Priority: LOW

OBSQ-006
Por quanto tempo métricas, traces e eventos de error tracking devem ser mantidos?
Priority: LOW

OBSQ-007
Qual stack de observabilidade será utilizada em produção?
Priority: MEDIUM

OBSQ-008
Qual canal receberá alertas operacionais de produção?
Priority: MEDIUM
```

---

# 164. Acceptance Criteria

Este documento estará aplicado quando:

```text
[ ] logs estruturados

[ ] requestId disponível

[ ] correlation implementada

[ ] secrets redacted

[ ] request body não logado indiscriminadamente

[ ] response body não logado indiscriminadamente

[ ] exception handling seguro

[ ] health implementado

[ ] readiness implementado

[ ] HTTP metrics disponíveis

[ ] database observável

[ ] error tracking configurado

[ ] applicationVersion disponível

[ ] deploys correlacionáveis

[ ] backup failure observável

[ ] alertas essenciais configurados

[ ] AuditLog permanece separado

[ ] Dashboard funcional permanece separado
```

---

# 165. Definition of Done

```text
[ ] logging strategy implementada

[ ] log schema consistente

[ ] request correlation implementada

[ ] redaction implementada

[ ] error handling integrado

[ ] health checks implementados

[ ] readiness definido

[ ] metrics essenciais implementadas

[ ] error tracking configurado

[ ] security events considerados

[ ] database monitoring configurado

[ ] job monitoring configurado quando aplicável

[ ] alerting configurado

[ ] retention definida

[ ] access control da observabilidade definido

[ ] testes de sanitização passam

[ ] documentação operacional atualizada
```

---

# 166. Regra final

Observabilidade deve permitir diagnosticar o sistema sem transformar telemetria em uma cópia dos dados da aplicação.

Regra:

```text
Enough context to diagnose
+
Minimum necessary data
+
Strong correlation
+
No secrets
```

A prioridade é conseguir responder:

```text
what failed?

where?

when?

for which request?

in which version?

in which tenant context?
```

sem registrar conteúdo sensível desnecessário.

---

# 167. Próximo documento

O próximo documento recomendado é:

```text
docs/19-ERROR-CATALOG.md
```

Ele deve centralizar códigos de erro estáveis utilizados pela API e pelo frontend:

```text
authentication errors

authorization errors

tenant errors

validation errors

processing activity errors

workflow errors

system errors

supplier errors

compliance errors

ROPA errors

file errors

concurrency errors

infrastructure-safe errors
```

Isso evita que cada módulo ou agente invente códigos e formatos diferentes para o mesmo tipo de erro.