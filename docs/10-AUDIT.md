# Auditoria, Histórico e Rastreabilidade

> **Documento:** Auditoria e rastreabilidade  
> **Status:** Draft  
> **Projeto:** LGPD Data Mapping Platform  
> **Documentos relacionados:** `02-DOMAIN.md`, `03-DATABASE.md`, `04-AUTHORIZATION.md`, `05-BUSINESS-RULES.md`, `06-WORKFLOWS.md`, `09-SECURITY.md`

> **Question IDs:** referências canônicas em `12-OPEN-QUESTIONS.md`; migrações dos IDs locais registradas por documento de origem no registro central. Perguntas e recomendações locais não encerram essas questões.

---

## 1. Objetivo

Este documento define como a plataforma deve registrar e disponibilizar informações de auditoria.

O objetivo é permitir responder perguntas como:

```text
Quem realizou a ação?

Quando?

Em qual organização?

Sobre qual recurso?

Qual operação foi executada?

Qual era o estado anterior?

Qual passou a ser o novo estado?

Qual versão estava envolvida?

A operação foi concluída?
```

Auditoria deve fornecer rastreabilidade sem se tornar uma cópia indiscriminada de todos os dados da aplicação.

---

# 2. Conceitos

A plataforma possui três conceitos diferentes:

```text
Application Log
Audit Log
Activity Version
```

Eles não devem ser tratados como a mesma coisa.

---

# 3. Application Log

Application Logs são registros técnicos.

Exemplos:

```text
request recebido

erro de conexão

exception

job iniciado

job falhou

tempo de resposta

timeout
```

São utilizados principalmente para:

```text
observabilidade
debug
monitoramento
operação
```

---

# 4. Audit Log

Audit Logs registram ações relevantes de negócio ou administração.

Exemplos:

```text
atividade criada

atividade submetida

atividade ativada

base legal alterada

usuário desativado

papel alterado

atividade arquivada
```

São utilizados principalmente para:

```text
rastreabilidade
governança
investigação
compliance
```

---

# 5. Activity Version

Activity Version representa um estado histórico relevante de uma atividade.

Exemplo:

```text
Activity

v1
↓
vigente de janeiro até março

v2
↓
vigente de março até agosto

v3
↓
vigente atualmente
```

A versão permite reconstruir o conteúdo.

O Audit Log permite reconstruir os eventos.

---

# 6. Diferença fundamental

Exemplo:

```text
17/09/2026 10:00
Usuário alterou retenção
```

Isso é:

```text
Audit Log
```

O conjunto completo dos dados da atividade depois dessa alteração pode constituir:

```text
Activity Version
```

---

# 7. Regra geral

Não utilizar Audit Log como substituto de versionamento.

Não utilizar versionamento como substituto de Audit Log.

---

# 8. Estrutura base

Tabela definida conceitualmente em `03-DATABASE.md`:

```text
audit_logs
```

Estrutura sugerida:

```text
id

organization_id

actor_id

action

entity_type

entity_id

timestamp

request_id

metadata

created_at
```

Campos adicionais podem ser necessários conforme decisões deste documento.

---

# 9. ID

Cada evento deve possuir identificador único.

Preferência:

```text
UUID
```

---

# 10. Organization

Todo evento relacionado a recurso de cliente deve possuir:

```text
organization_id
```

Isso permite:

```text
isolamento
consulta
investigação
retenção
```

por tenant.

---

# 11. Actor

Quando existir usuário responsável:

```text
actor_id
```

deve ser registrado.

Exemplo:

```text
actorId = User A
```

---

# 12. Eventos de sistema

Nem toda ação possui usuário humano.

Exemplo:

```text
Compliance Gate executado automaticamente

notificação enviada por job

exportação concluída por worker
```

Portanto, eventos devem conseguir representar:

```text
actorType = USER
```

ou:

```text
actorType = SYSTEM
```

---

# 13. Actor Type

Valores sugeridos:

```text
USER
SYSTEM
```

Futuramente:

```text
INTEGRATION
```

pode ser necessário.

Não criar tipos adicionais sem necessidade.

---

# 14. Action

`action` deve utilizar identificador estável.

Exemplo:

```text
PROCESSING_ACTIVITY_CREATED
```

Evitar armazenar somente:

```text
"Usuário criou uma atividade"
```

O texto visual pode ser construído posteriormente.

---

# 15. Entity Type

Exemplos:

```text
PROCESSING_ACTIVITY

USER

BUSINESS_UNIT

SYSTEM

SUPPLIER

CONSENT_DOCUMENT

FILE

ORGANIZATION
```

---

# 16. Entity ID

Quando o evento estiver relacionado a uma entidade:

```text
entity_id
```

deve apontar para o identificador correspondente.

---

# 17. Timestamp

Eventos devem utilizar timestamp confiável do backend.

Exemplo:

```text
2026-09-17T13:42:31Z
```

Não confiar em timestamp enviado pelo navegador.

---

# 18. Request ID

Quando o evento tiver origem em uma request:

```text
request_id
```

deve permitir correlacionar:

```text
Audit Log
        ↕
Application Log
```

---

# 19. Metadata

Pode existir campo:

```text
metadata JSONB
```

para informações específicas do evento.

Exemplo:

```json
{
  "previousStatus": "MAPPING",
  "newStatus": "PENDING_REVIEW"
}
```

---

# 20. Metadata não é depósito genérico

Não utilizar `metadata` para evitar modelagem.

Evitar:

```json
{
  "everything": {
    "...": "..."
  }
}
```

Metadata deve conter somente contexto necessário ao evento.

---

# 21. Snapshot

Quando uma versão completa for necessária:

```text
activity_versions.snapshot
```

é o local recomendado.

Não colocar snapshot completo de todas as atividades dentro do Audit Log por padrão.

---

# 22. Before e After

Algumas operações podem exigir registro de:

```text
before
after
```

Exemplo:

```json
{
  "before": {
    "role": "COLLABORATOR"
  },
  "after": {
    "role": "MANAGER"
  }
}
```

---

# 23. Limitação de before/after

Não armazenar automaticamente todo objeto antes e depois de qualquer mutation.

Isso pode:

```text
duplicar grandes volumes

registrar informações desnecessárias

aumentar risco de exposição

dificultar retenção
```

Registrar apenas informações relevantes para a auditoria.

---

# 24. Dados sensíveis em auditoria

Audit Logs não devem armazenar conteúdo sensível sem necessidade.

Evitar:

```json
{
  "documentContents": "...",
  "accessToken": "...",
  "password": "...",
  "consentPdf": "..."
}
```

---

# 25. Identificadores em vez de conteúdo

Quando possível:

```json
{
  "fileId": "uuid"
}
```

em vez de armazenar o conteúdo do arquivo.

---

# 26. Eventos de ProcessingActivity

Eventos iniciais:

```text
PROCESSING_ACTIVITY_CREATED

PROCESSING_ACTIVITY_UPDATED

PROCESSING_ACTIVITY_MAPPING_STARTED

PROCESSING_ACTIVITY_SUBMITTED

PROCESSING_ACTIVITY_CHANGES_REQUESTED

PROCESSING_ACTIVITY_ACTIVATED

PROCESSING_ACTIVITY_REVIEW_STARTED

PROCESSING_ACTIVITY_ARCHIVED
```

---

# 27. Criação

Evento:

```text
PROCESSING_ACTIVITY_CREATED
```

Metadata mínima possível:

```json
{
  "businessUnitId": "uuid"
}
```

Não é necessário duplicar toda a atividade.

---

# 28. Atualização

Evento:

```text
PROCESSING_ACTIVITY_UPDATED
```

Pode registrar campos alterados.

Exemplo:

```json
{
  "changedFields": [
    "name",
    "description"
  ]
}
```

---

# 29. Mudança de status

Mudança relevante de status deve registrar:

```json
{
  "previousStatus": "MAPPING",
  "newStatus": "PENDING_REVIEW"
}
```

---

# 30. Solicitação de correção

Evento:

```text
PROCESSING_ACTIVITY_CHANGES_REQUESTED
```

Pode registrar:

```json
{
  "reason": "Política de retenção precisa ser revisada."
}
```

O motivo pode possuir informação relevante e deve seguir regras de acesso do Audit Log.

---

# 31. Ativação

Evento:

```text
PROCESSING_ACTIVITY_ACTIVATED
```

Metadata:

```json
{
  "version": 2,
  "complianceStatus": "COMPLETE"
}
```

---

# 32. Arquivamento

Evento:

```text
PROCESSING_ACTIVITY_ARCHIVED
```

Pode registrar:

```json
{
  "reason": "Processo encerrado."
}
```

caso o motivo seja obrigatório.

---

# 33. Compliance Gate

Eventos possíveis:

```text
COMPLIANCE_GATE_STARTED

COMPLIANCE_GATE_COMPLETED
```

Para V1, pode ser suficiente registrar somente:

```text
COMPLIANCE_GATE_EXECUTED
```

com o resultado.

---

# 34. Resultado do Gate

Exemplo:

```json
{
  "result": "BLOCKED",
  "checks": [
    {
      "type": "LEGAL_BASIS",
      "status": "PASS"
    },
    {
      "type": "RETENTION",
      "status": "FAIL"
    }
  ]
}
```

A quantidade de detalhe armazenada deve ser equilibrada com o histórico mantido em `compliance_checks`.

---

# 35. Compliance Check

Se `compliance_checks` armazenar o estado detalhado:

```text
Audit Log
```

pode registrar apenas:

```text
gate executado
resultado geral
```

evitando duplicação desnecessária.

---

# 36. Versionamento

Eventos:

```text
ACTIVITY_VERSION_CREATED

ACTIVITY_VERSION_PUBLISHED
```

---

# 37. Nova versão

Quando uma alteração relevante gerar versão:

```json
{
  "previousVersion": 2,
  "newVersion": 3
}
```

---

# 38. Publicação

Quando uma versão se torna vigente:

```text
ACTIVITY_VERSION_PUBLISHED
```

Metadata:

```json
{
  "version": 3
}
```

---

# 39. Versão histórica

A versão anterior não deve ser sobrescrita.

Exemplo:

```text
v2
```

permanece reconstruível depois da publicação de:

```text
v3
```

---

# 40. Usuários

Eventos administrativos:

```text
USER_CREATED

USER_INVITED

USER_ACTIVATED

USER_DISABLED

USER_ROLE_CHANGED

USER_BUSINESS_UNIT_CHANGED
```

A disponibilidade depende do mecanismo final de autenticação.

---

# 41. Mudança de papel

Evento:

```text
USER_ROLE_CHANGED
```

Metadata:

```json
{
  "targetUserId": "uuid",
  "previousRoles": [
    "COLLABORATOR"
  ],
  "newRoles": [
    "MANAGER"
  ]
}
```

---

# 42. Mudança de área

Evento:

```text
USER_BUSINESS_UNIT_CHANGED
```

Exemplo:

```json
{
  "targetUserId": "uuid",
  "addedBusinessUnitIds": [
    "uuid"
  ],
  "removedBusinessUnitIds": []
}
```

---

# 43. Sistemas

Eventos:

```text
SYSTEM_CREATED

SYSTEM_UPDATED

SYSTEM_MAPPING_STATUS_CHANGED

SYSTEM_ARCHIVED
```

---

# 44. Fornecedores

Eventos:

```text
SUPPLIER_CREATED

SUPPLIER_UPDATED

SUPPLIER_MAPPING_STATUS_CHANGED

SUPPLIER_ARCHIVED
```

---

# 45. Business Units

Eventos:

```text
BUSINESS_UNIT_CREATED

BUSINESS_UNIT_UPDATED

BUSINESS_UNIT_ARCHIVED
```

---

# 46. Consentimento

Eventos possíveis:

```text
CONSENT_DOCUMENT_CREATED

CONSENT_DOCUMENT_VERSION_CREATED

CONSENT_DOCUMENT_ARCHIVED
```

A V1 não pressupõe eventos individuais de consentimento de titulares.

---

# 47. Arquivos

Eventos relevantes podem incluir:

```text
FILE_UPLOADED

FILE_DOWNLOADED

FILE_REMOVED
```

Auditoria de download deve ser confirmada como requisito.

---

# 48. Exportações

Eventos recomendados:

```text
ROPA_EXPORT_REQUESTED

ROPA_EXPORT_COMPLETED

ROPA_EXPORT_DOWNLOADED
```

Dependendo da implementação síncrona, pode ser suficiente:

```text
ROPA_EXPORTED
```

---

# 49. Exportação e escopo

O Audit Log da exportação pode registrar filtros.

Exemplo:

```json
{
  "format": "XLSX",
  "businessUnitId": "uuid"
}
```

Evitar registrar o conteúdo completo exportado.

---

# 50. Autenticação

Eventos de segurança podem existir em sistema separado ou no Audit Log.

Exemplos:

```text
LOGIN_SUCCEEDED

LOGIN_FAILED

LOGOUT

MFA_ENABLED

MFA_DISABLED
```

A decisão depende da solução de autenticação.

---

# 51. LOGIN_FAILED

Falhas de login podem gerar grande volume.

Podem ser mais adequadas a:

```text
Security Log
```

ou provedor de identidade.

Não duplicar indiscriminadamente eventos já mantidos pelo IdP.

---

# 52. Eventos automáticos

Jobs podem registrar ações relevantes.

Exemplo:

```text
SYSTEM

PENDING_ACTIVITY_NOTIFICATION_SENT
```

Metadata:

```json
{
  "activityId": "uuid",
  "recipientUserId": "uuid"
}
```

---

# 53. Falha de operação

Nem toda tentativa negada precisa gerar Audit Log de negócio.

Exemplo:

```text
403
```

pode ser registrado em logs de segurança.

Porém, padrões suspeitos de autorização devem ser observáveis.

---

# 54. Acesso entre tenants

Tentativa de acesso cross-tenant pode ser registrada em Security Log.

Evitar incluir na resposta qualquer informação sobre o tenant alvo.

---

# 55. Audit Log append-only

No nível da aplicação:

```text
INSERT
```

deve ser permitido.

Operações normais:

```text
UPDATE
DELETE
```

não devem existir para Audit Logs.

---

# 56. Correção de Audit Log

Se um evento possuir informação incorreta, não sobrescrever silenciosamente.

Caso seja necessário corrigir:

```text
novo evento de correção
```

pode ser considerado.

O mecanismo precisa ser definido se houver requisito real.

---

# 57. Banco

Idealmente, o usuário runtime da aplicação deve possuir somente os privilégios necessários.

Controles adicionais podem ser utilizados para dificultar alteração dos registros de auditoria.

A estratégia depende da infraestrutura.

---

# 58. Transação

Quando uma ação de negócio e seu Audit Log precisarem ser atomicamente consistentes, preferir mesma transação.

Exemplo:

```text
BEGIN

UPDATE activity

INSERT audit_log

COMMIT
```

Assim evita-se:

```text
atividade alterada
+
audit log ausente
```

---

# 59. Eventos assíncronos

Para ações externas como:

```text
e-mail
webhook
analytics
```

podem existir estratégias assíncronas.

Não utilizar evento assíncrono como única garantia para auditoria crítica sem estratégia de consistência.

---

# 60. Outbox

Se futuramente houver necessidade forte de integração/eventos confiáveis, considerar:

```text
Transactional Outbox
```

Não introduzir na V1 sem necessidade concreta.

---

# 61. ActivityVersion

Estrutura conceitual:

```text
id

organization_id

processing_activity_id

version

snapshot

created_by

created_at
```

Pode ser necessário adicionar:

```text
published_at
published_by
```

dependendo do workflow final.

---

# 62. Snapshot

Formato recomendado inicialmente:

```text
JSONB
```

representando estado relevante da atividade.

Exemplo conceitual:

```json
{
  "name": "Recrutamento",
  "businessUnit": {},
  "purposes": [],
  "dataCategories": [],
  "subjects": [],
  "collectionSources": [],
  "operations": [],
  "recipients": [],
  "retention": {},
  "securityMeasures": [],
  "legalBases": [],
  "internationalTransfers": []
}
```

---

# 63. Snapshot imutável

Após criação/publicação da versão histórica:

```text
snapshot
```

não deve ser alterado.

---

# 64. Snapshot e IDs

Snapshot pode conter:

```text
IDs
+
valores relevantes
```

quando necessário para reconstrução histórica.

Exemplo:

Se o nome da área mudar futuramente, um snapshot que contenha apenas:

```text
businessUnitId
```

pode deixar de representar corretamente o nome histórico.

---

# 65. Snapshot autossuficiente

Para informações relevantes ao histórico, considerar armazenar:

```json
{
  "businessUnit": {
    "id": "uuid",
    "name": "Recursos Humanos"
  }
}
```

em vez de somente:

```json
{
  "businessUnitId": "uuid"
}
```

A estrutura definitiva deve equilibrar:

```text
reconstrução histórica
volume
duplicação
```

---

# 66. Versão atual

A atividade deve conseguir identificar sua versão vigente.

Exemplo:

```text
currentVersion = 3
```

---

# 67. Versão em edição

Se `UNDER_REVIEW` permitir edição paralela enquanto uma versão anterior permanece vigente, será necessário distinguir:

```text
publishedVersion
draftVersion
```

Esse ponto depende da decisão de workflow.

---

# 68. ROPA histórico

O modelo deve permitir reconstruir:

```text
Como estava o ROPA em determinada versão?
```

quando o requisito exigir.

Não necessariamente é preciso gerar e armazenar um PDF do ROPA a cada mudança.

---

# 69. ROPA atual

ROPA atual deve utilizar:

```text
versão vigente
```

e não uma versão ainda em revisão.

---

# 70. Histórico visual

Na interface:

```text
Histórico

v3 — Vigente
17/09/2026
Publicado por Usuário A

v2
02/08/2026
Publicado por Usuário B

v1
10/06/2026
Publicado por Usuário A
```

---

# 71. Timeline

Além das versões, pode existir timeline de eventos.

Exemplo:

```text
17/09 14:00
Atividade ativada

17/09 13:58
Compliance Gate concluído

17/09 13:40
Retenção alterada

17/09 13:20
Alterações solicitadas
```

---

# 72. Histórico não é edição

Visualização de versão histórica deve ser:

```text
read-only
```

Não permitir editar diretamente:

```text
v1
```

---

# 73. Restaurar versão

Funcionalidade futura pode permitir:

```text
Restaurar v2
```

Mas isso deve significar:

```text
criar nova versão baseada na v2
```

e não sobrescrever o histórico.

Não faz parte automaticamente da V1.

---

# 74. Consulta de Audit Logs

Endpoint previsto:

```http
GET /api/v1/audit-logs
```

Deve exigir permissão específica.

---

# 75. Filtros

Filtros possíveis:

```text
entityType
entityId
actorId
action
from
to
```

---

# 76. Paginação

Audit Logs devem ser sempre paginados.

Exemplo:

```text
page
pageSize
```

Não retornar histórico completo de uma organização em uma única request.

---

# 77. Ordenação

Padrão recomendado:

```text
timestamp DESC
```

Eventos mais recentes primeiro.

---

# 78. Busca textual

Não implementar busca textual indiscriminada sobre metadata sem necessidade.

Preferir filtros estruturados.

---

# 79. Autorização

Possíveis perfis com acesso:

```text
DPO
ADMIN
```

A matriz definitiva depende de `04-AUTHORIZATION.md`.

---

# 80. Escopo

Mesmo usuários autorizados devem respeitar:

```text
organization
```

e eventualmente:

```text
businessUnit
```

se o produto permitir auditoria por gestores.

---

# 81. Super Admin

Se existir acesso global:

```text
PLATFORM_ADMIN
```

consultas de auditoria entre tenants devem ser altamente restritas e auditadas.

---

# 82. Auditoria da auditoria

A consulta de Audit Logs pode, futuramente, ser auditada.

Especialmente:

```text
exportação
download
acesso administrativo global
```

Não é requisito automático para todo GET.

---

# 83. Exportação de auditoria

Se futuramente existir:

```text
Exportar Audit Logs
```

deve possuir:

```text
permissão específica
tenant scope
filtros
limites
auditoria da exportação
```

---

# 84. Retenção

Audit Logs precisam de política de retenção.

Ainda deve ser definido:

```text
tempo de retenção
arquivamento
remoção
```

Não assumir retenção infinita.

---

# 85. Activity Versions

Versões também precisam de política de retenção.

Entretanto, a política pode ser diferente dos logs técnicos.

Não apagar versões apenas porque Application Logs expiraram.

---

# 86. Application Logs

Podem possuir retenção relativamente curta.

Exemplo conceitual:

```text
dias/semanas/meses
```

A duração final depende da operação e infraestrutura.

---

# 87. Audit Logs

Podem exigir retenção maior.

A duração deve ser definida pelo produto/compliance.

---

# 88. Backups

Mesmo após expiração de registros ativos, backups podem manter cópias temporárias até sua própria expiração.

A política de retenção deve considerar isso.

---

# 89. Horário

Armazenar timestamps preferencialmente em:

```text
UTC
```

A interface converte para timezone apropriado.

---

# 90. Precisão

Eventos devem possuir precisão suficiente para ordenar operações próximas.

Não depender apenas de data sem horário.

---

# 91. Actor removido

Se um usuário for desativado ou removido:

```text
Audit Log
```

deve continuar permitindo identificar o ator histórico.

---

# 92. Foreign Key e histórico

Não utilizar cascade que apague Audit Logs quando:

```text
User
ProcessingActivity
Organization-related entity
```

for removida/arquivada.

---

# 93. Nome histórico do ator

Se for necessário preservar o nome exibido no momento da ação, pode existir snapshot mínimo:

```json
{
  "actorName": "João Silva"
}
```

na metadata.

Mas isso aumenta duplicação e deve ser decidido explicitamente.

---

# 94. IP

Registrar IP em Audit Log pode ser útil para segurança, mas também adiciona informação pessoal e volume.

Não incluir automaticamente sem requisito.

Pode ser mantido separadamente em Security Logs.

---

# 95. User Agent

Mesma regra para:

```text
User-Agent
```

Não adicionar ao Audit Log de negócio sem necessidade.

---

# 96. Reason

Algumas ações podem exigir motivo.

Exemplos:

```text
arquivamento
rejeição
solicitação de correção
mudança administrativa crítica
```

Quando obrigatório, o motivo deve fazer parte da transação/evento.

---

# 97. Eventos de alteração de segurança

Exemplos:

```text
ROLE_CHANGED

MFA_DISABLED

PERMISSION_CHANGED

ADMIN_ACCESS_GRANTED
```

devem possuir rastreabilidade adequada quando essas funcionalidades existirem.

---

# 98. Correlação

Exemplo completo:

```text
requestId:
req-123

Application Log:
PATCH /processing-activities/abc

Audit Log:
PROCESSING_ACTIVITY_UPDATED

Activity Version:
v3
```

Os registros devem permitir correlação quando necessário.

---

# 99. Event naming

Utilizar padrão:

```text
ENTITY_ACTION
```

Exemplos:

```text
PROCESSING_ACTIVITY_CREATED

USER_DISABLED

SUPPLIER_UPDATED

ACTIVITY_VERSION_PUBLISHED
```

---

# 100. Não traduzir códigos

Banco/API:

```text
PROCESSING_ACTIVITY_CREATED
```

Frontend:

```text
Atividade criada
```

Não armazenar o texto traduzido como identificador principal.

---

# 101. Catálogo inicial de eventos

```text
PROCESSING_ACTIVITY_CREATED
PROCESSING_ACTIVITY_UPDATED
PROCESSING_ACTIVITY_MAPPING_STARTED
PROCESSING_ACTIVITY_SUBMITTED
PROCESSING_ACTIVITY_CHANGES_REQUESTED
PROCESSING_ACTIVITY_ACTIVATED
PROCESSING_ACTIVITY_REVIEW_STARTED
PROCESSING_ACTIVITY_ARCHIVED

ACTIVITY_VERSION_CREATED
ACTIVITY_VERSION_PUBLISHED

COMPLIANCE_GATE_EXECUTED

USER_CREATED
USER_INVITED
USER_ACTIVATED
USER_DISABLED
USER_ROLE_CHANGED
USER_BUSINESS_UNIT_CHANGED

BUSINESS_UNIT_CREATED
BUSINESS_UNIT_UPDATED
BUSINESS_UNIT_ARCHIVED

SYSTEM_CREATED
SYSTEM_UPDATED
SYSTEM_MAPPING_STATUS_CHANGED
SYSTEM_ARCHIVED

SUPPLIER_CREATED
SUPPLIER_UPDATED
SUPPLIER_MAPPING_STATUS_CHANGED
SUPPLIER_ARCHIVED

CONSENT_DOCUMENT_CREATED
CONSENT_DOCUMENT_VERSION_CREATED
CONSENT_DOCUMENT_ARCHIVED

FILE_UPLOADED
FILE_DOWNLOADED
FILE_REMOVED

ROPA_EXPORTED

PENDING_ACTIVITY_NOTIFICATION_SENT
```

A lista deve evoluir conforme features reais forem implementadas.

---

# 102. Serviço de auditoria

A aplicação deve possuir abstração central.

Exemplo conceitual:

```ts
auditService.record({
  organizationId,
  actorId,
  action,
  entityType,
  entityId,
  metadata,
});
```

Evitar inserts manuais de Audit Log espalhados em controllers.

---

# 103. Camada responsável

Audit Log deve ser disparado pelo:

```text
Application Layer / Use Case
```

ou mecanismo arquitetural equivalente.

Não pelo componente React.

Não depender exclusivamente de middleware HTTP.

---

# 104. Por que middleware não basta?

Middleware sabe:

```text
PATCH /activity/123
```

Mas pode não saber semanticamente que ocorreu:

```text
ACTIVITY_VERSION_PUBLISHED
```

A camada de negócio possui esse contexto.

---

# 105. Domain Events

Domain Events podem futuramente representar eventos como:

```text
ProcessingActivityActivated
```

Mas não são obrigatórios na V1.

Não introduzir event-driven architecture apenas para implementar Audit Log.

---

# 106. Falha ao registrar auditoria

Para eventos críticos, falha ao persistir Audit Log deve impedir a conclusão da transação.

Exemplo:

```text
mudança de role
atividade ativada
```

Não concluir silenciosamente uma ação crítica sem sua auditoria correspondente.

---

# 107. Eventos não críticos

Alguns eventos operacionais podem tolerar processamento assíncrono.

Exemplo:

```text
notificação enviada
```

A classificação deve ser explícita.

---

# 108. Testes

Audit Log deve possuir testes automatizados.

Exemplo:

```ts
describe('Audit', () => {
  it('records activity creation', () => {});

  it('records activity activation', () => {});

  it('records role changes', () => {});

  it('preserves organization isolation', () => {});
});
```

---

# 109. Teste de criação

```text
Given:
usuário autorizado

When:
cria atividade

Then:
PROCESSING_ACTIVITY_CREATED é registrado
```

---

# 110. Teste de ativação

```text
Given:
atividade válida

When:
atividade é ativada

Then:
PROCESSING_ACTIVITY_ACTIVATED é registrado
```

Metadata deve incluir a versão quando aplicável.

---

# 111. Teste de transação

Cenário:

```text
UPDATE activity
↓
falha ao registrar audit
```

Para operação classificada como crítica:

```text
ROLLBACK
```

deve ocorrer.

---

# 112. Teste multi-tenant

```text
User Organization A
```

não pode consultar:

```text
Audit Logs Organization B
```

mesmo conhecendo:

```text
entityId
actorId
auditLogId
```

---

# 113. Teste de imutabilidade

API normal não deve possuir operação capaz de:

```text
editar Audit Log
```

ou:

```text
deletar Audit Log
```

---

# 114. Teste de versão

```text
Given:
Activity v1 ACTIVE

When:
nova versão v2 é publicada

Then:
v1 continua disponível

And:
v2 torna-se vigente
```

---

# 115. Teste de ROPA

Quando existir:

```text
v1 ACTIVE
v2 UNDER_REVIEW
```

ROPA deve utilizar:

```text
v1
```

até publicação de `v2`, caso esse modelo de workflow seja aprovado.

---

# 116. Performance

Audit Logs podem crescer rapidamente.

Índices devem considerar consultas por:

```text
organization_id

entity_type + entity_id

actor_id

timestamp

action
```

Detalhes físicos permanecem em `03-DATABASE.md`.

---

# 117. Particionamento

Não implementar particionamento de tabela antecipadamente.

Avaliar quando volume real justificar.

---

# 118. Metadata index

Não criar índices GIN sobre todo JSONB sem necessidade.

Indexar somente padrões reais de consulta.

---

# 119. Cleanup

Se houver expiração automática:

```text
job de retenção
```

deve possuir comportamento controlado e auditável quando necessário.

Nunca executar:

```text
DELETE audit_logs WHERE ...
```

sem política formal definida.

---

# 120. Observabilidade

Devem existir métricas para falhas relevantes.

Exemplos:

```text
audit write failures

version creation failures

unexpected audit volume
```

---

# 121. Questões abertas

Registrar também em `12-OPEN-QUESTIONS.md`.

### AUDQ-001 — Retenção

Por quanto tempo manter:

```text
Audit Logs
```

?

**Impacto:** alto.

---

### AUDQ-016 — Version retention

Por quanto tempo manter versões históricas das atividades?

**Impacto:** alto.

---

### AUTHQ-014 — Audit read

Quais papéis podem consultar Audit Logs?

```text
DPO
ADMIN
MANAGER
```

**Impacto:** médio/alto.

---

### AUTHQ-014 — Business Unit Scope

Manager poderá consultar auditoria apenas da própria área?

**Impacto:** médio.

---

### AUDQ-007 — Download audit

Downloads de documentos devem gerar:

```text
FILE_DOWNLOADED
```

?

**Impacto:** médio.

---

### AUDQ-006 — Export audit

Toda exportação de ROPA deve ser auditada?

**Recomendação:** sim.

**Impacto:** baixo/médio.

---

### AUDQ-003 — IP

Audit Log deve armazenar IP?

**Impacto:** médio.

---

### AUDQ-004 — User Agent

Audit Log deve armazenar User-Agent?

**Impacto:** baixo/médio.

---

### AUDQ-017 — Actor snapshot

Devemos preservar:

```text
actorName
actorEmail
```

no momento do evento ou apenas `actorId`?

**Impacto:** médio.

---

### AUDQ-018 — Before/After

Quais eventos precisam armazenar valores:

```text
before
after
```

?

**Impacto:** médio/alto.

---

### DBQ-003 — Snapshot

Qual estrutura definitiva do:

```text
ActivityVersion.snapshot
```

?

**Impacto:** alto.

---

### AUDQ-013 — Draft version

Versões são criadas:

```text
durante edição
```

ou somente:

```text
quando publicadas
```

?

**Impacto:** alto.

---

### WFQ-015 — Published version

Precisamos separar explicitamente:

```text
publishedVersion
draftVersion
```

?

**Impacto:** alto.

---

### AUDQ-014 — Restore

A V1 permitirá restaurar versão anterior?

**Impacto:** médio.

---

### AUDQ-015 — Security Logs

Eventos de segurança terão armazenamento separado de Audit Logs?

**Impacto:** médio.

---

# 122. Regras para agentes de IA

Antes de implementar uma mutation, verificar:

```text
A operação precisa gerar Audit Log?

É uma operação crítica?

O Audit Log precisa estar na mesma transação?

Existe nova ActivityVersion?

Qual metadata é realmente necessária?

Existe risco de registrar informação sensível?
```

---

# 123. Agentes não devem

Não:

```text
registrar passwords

registrar tokens

registrar request.body completo por padrão

registrar documentos inteiros

usar Audit Log como backup

usar Audit Log como versionamento

editar Audit Logs existentes

deletar Audit Logs sem política

criar snapshot para cada pequena request sem decisão

ignorar organizationId

criar auditoria somente no frontend

usar console.log como mecanismo de auditoria
```

---

# 124. Checklist de mutation

```text
[ ] operação identificada

[ ] autorização aplicada

[ ] tenant validado

[ ] regra de negócio executada

[ ] evento de auditoria necessário?

[ ] metadata mínima definida

[ ] informação sensível removida

[ ] versionamento necessário?

[ ] transação necessária?

[ ] teste de auditoria criado
```

---

# 125. Checklist de evento

```text
[ ] action

[ ] organizationId

[ ] actor / actorType

[ ] entityType

[ ] entityId

[ ] timestamp

[ ] requestId quando aplicável

[ ] metadata mínima

[ ] sem secrets

[ ] sem conteúdo pessoal desnecessário
```

---

# 126. Definition of Done

Uma funcionalidade auditável é considerada concluída quando:

```text
ação funcional
+
evento definido
+
persistência
+
tenant isolation
+
autorização de consulta
+
metadata necessária
+
proteção de dados
+
teste automatizado
```

estiverem implementados.

---

# 127. Regra final

Auditoria deve responder:

```text
quem
fez o quê
em qual recurso
quando
em qual organização
com qual resultado relevante
```

Versionamento deve responder:

```text
como o recurso estava
em determinada versão
```

Logs técnicos devem responder:

```text
o que aconteceu tecnicamente
durante a execução
```

Manter essas responsabilidades separadas.

---

# 128. Próximo documento

A estratégia completa de testes, pirâmide de testes, unitários, integração, E2E, fixtures, banco de testes, cobertura e cenários críticos será definida em:

`11-TESTING.md`