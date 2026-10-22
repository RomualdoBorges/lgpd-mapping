# Error Catalog

> **Documento:** Catálogo de Erros da Aplicação  
> **Status:** Draft  
> **Objetivo:** centralizar códigos de erro estáveis utilizados pelo backend, frontend, testes e integrações, evitando mensagens e comportamentos inconsistentes entre módulos.

---

# 1. Objetivo

A aplicação deve diferenciar:

```text
Error Code
↓
identificador estável para software

Error Message
↓
mensagem destinada ao usuário/desenvolvedor

HTTP Status
↓
semântica do protocolo

Details
↓
informações estruturadas opcionais
```

---

# 2. Regra principal

Frontend não deve depender da mensagem textual para determinar comportamento.

Errado:

```ts
if (error.message === 'Activity not found') {
}
```

Correto:

```ts
if (error.code === 'PROCESSING_ACTIVITY_NOT_FOUND') {
}
```

---

# 3. Formato padrão

Resposta de erro:

```json
{
  "error": {
    "code": "PROCESSING_ACTIVITY_NOT_FOUND",
    "message": "Atividade de tratamento não encontrada.",
    "requestId": "req_123"
  }
}
```

---

# 4. Erro com detalhes

Quando necessário:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Falha na validação da requisição",
    "requestId": "req_123",
    "details": [
      {
        "field": "name",
        "code": "REQUIRED"
      }
    ]
  }
}
```

---

# 5. Campos

Estrutura conceitual:

```ts
interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    requestId?: string;
    details?: unknown;
  };
}
```

---

# 6. `code`

Deve ser:

```text
estável

machine-readable

UPPER_SNAKE_CASE
```

---

# 7. `message`

Conforme DEC-064, mensagens públicas da API são escritas em português. Podem ser alteradas sem quebrar consumidores; frontend e integrações dependem de `error.code`, nunca da mensagem. Detalhes técnicos e internos não são expostos.

---

# 8. Status de validação

Conforme DEC-063, falhas estruturais ou de transporte usam 400; violações de domínio, negócio ou workflow em requests estruturalmente válidas usam 422. Autenticação, autorização, inexistência, conflito e erro interno conservam seus contratos específicos.

---

# 8. `requestId`

Permite correlacionar erro com observabilidade.

Seguir:

```text
18-OBSERVABILITY.md
```

---

# 9. `details`

Deve possuir estrutura conhecida para cada categoria de erro.

Não utilizar:

```text
details: qualquer objeto interno
```

---

# 10. Segurança

Nunca retornar em erro:

```text
stack trace

SQL

database hostname

connection string

access token

refresh token

cookie

authorization header

storage credentials

internal secrets
```

---

# 11. HTTP Status

Convenção geral:

```text
400
Malformed/invalid request

401
Authentication required or invalid

403
Authenticated but action not allowed

404
Resource unavailable/not found

409
Conflict with current resource state

422
Structurally valid request that cannot be processed due to domain/workflow validation

429
Rate limit

500
Erro interno inesperado

503
Essential service temporarily unavailable
```

---

# 12. Regra sobre 400 e 422

Conforme DEC-063, usar consistentemente:

```text
400
transport/request format validation

422
domain/business validation
```

A convenção deve ser aplicada igualmente em toda API. Autenticação, autorização, inexistência, conflito e falha interna conservam seus contratos próprios.

---

# 13. 401 vs 403

```text
401
não existe contexto autenticado válido

403
usuário autenticado não possui autorização
```

---

# 14. 404 e Tenant Isolation

Pela DEC-066, após existir `AuthorizedTenantContext`, recurso inexistente, recurso fora do tenant atual e recurso fora do scope de visibilidade devem usar o mesmo contrato 404 dentro do endpoint.

Exemplo:

```text
Organization A tenta acessar Activity de Organization B
↓
404 PROCESSING_ACTIVITY_NOT_FOUND
```

em vez de revelar:

```text
403 Activity belongs to another organization
```

Conhecer o UUID não concede visibilidade. Não executar lookup global apenas para distinguir publicamente essas condições.

---

# 15. Error Namespace

Os códigos serão agrupados conceitualmente por domínio.

Não precisam possuir prefixo técnico como:

```text
ERR_
```

---

# 16. Categorias

```text
GENERAL

AUTHENTICATION

AUTHORIZATION

TENANT

VALIDATION

ORGANIZATION

BUSINESS_UNIT

USER

PROCESSING_ACTIVITY

WORKFLOW

PERSONAL_DATA

COLLECTION_SOURCE

PROCESSING_OPERATION

RETENTION

SECURITY_MEASURE

LEGAL_BASIS

INTERNATIONAL_TRANSFER

SYSTEM

SUPPLIER

COMPLIANCE

VERSIONING

ROPA

DASHBOARD

FILE

EXPORT

CONCURRENCY

RATE_LIMIT

INFRASTRUCTURE
```

---

# 17. General Errors

## `INTERNAL_ERROR`

```text
HTTP: 500
```

Uso:

```text
erro inesperado não mapeado
```

Resposta:

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Erro interno inesperado",
    "requestId": "req_123"
  }
}
```

Nunca retornar detalhes internos.

---

## `SERVICE_UNAVAILABLE`

```text
HTTP: 503
```

Uso:

```text
dependência essencial indisponível
```

---

## `RESOURCE_NOT_FOUND`

```text
HTTP: 404
Message: Recurso não encontrado.
```

Fallback genérico quando não houver código `*_NOT_FOUND` específico já aprovado para o tipo de recurso. Pela DEC-066, no mesmo endpoint representa de forma indistinguível recurso inexistente, cross-tenant ou fora do scope de visibilidade.

---

## `INVALID_REQUEST`

```text
HTTP: 400
```

Uso:

```text
request malformada ou inválida no nível de transporte
```

---

## `VALIDATION_ERROR`

```text
HTTP: 400
```

Uso:

```text
um ou mais campos falharam na validação de transporte
```

---

# 18. Validation Detail Codes

Possíveis códigos de campo:

```text
REQUIRED

INVALID_TYPE

INVALID_FORMAT

INVALID_UUID

INVALID_ENUM

MIN_LENGTH

MAX_LENGTH

MIN_VALUE

MAX_VALUE

INVALID_DATE
```

---

# 19. Exemplo

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Falha na validação da requisição",
    "details": [
      {
        "field": "businessUnitId",
        "code": "INVALID_UUID"
      }
    ]
  }
}
```

---

# 20. Authentication Errors

## `AUTHENTICATION_REQUIRED`

```text
HTTP: 401
```

Uso:

```text
endpoint protegido acessado sem autenticação
```

---

## `INVALID_SESSION`

```text
HTTP: 401
```

Uso:

```text
sessão inválida
```

---

## `SESSION_EXPIRED`

```text
HTTP: 401
```

Uso:

```text
sessão expirada
```

A existência desse código depende da estratégia de sessão escolhida.

---

## `INVALID_CREDENTIALS`

```text
HTTP: 401
```

Somente aplicável se autenticação local existir.

Mensagem não deve revelar:

```text
email exists

password specifically wrong
```

---

## `USER_DISABLED`

Status HTTP definitivo depende da estratégia de autenticação.

Uso:

```text
usuário existe mas está desativado
```

Evitar expor informação no login quando isso facilitar enumeração de usuários.

---

# 21. Authorization Errors

## `FORBIDDEN`

```text
HTTP: 403
Message: Ação não autorizada.
```

Uso genérico quando o recurso é legitimamente visível, mas a ação solicitada não é autorizada:

```text
usuário autenticado sem permission/scope necessário
```

---

## `INSUFFICIENT_PERMISSION`

```text
HTTP: 403
```

Pode ser utilizado internamente quando a API optar por código mais específico.

---

## `RESOURCE_SCOPE_DENIED`

```text
HTTP: 403
```

Uso:

```text
permission existe mas recurso está fora do scope permitido
```

Somente pode ser utilizado quando a existência do recurso for legitimamente revelável. Quando o scope impedir confirmar a existência, usar o mesmo contrato 404 aplicável a recurso inexistente e cross-tenant, conforme DEC-066.

---

# 22. Tenant Errors

## `ORGANIZATION_CONTEXT_REQUIRED`

```text
HTTP: 400
```

Definido pela DEC-065 para ausência de `X-Organization-Id` em endpoint tenant-bound.

Uso:

```text
usuário possui sessão válida mas operação exige Organization ativa
```

---

## `ORGANIZATION_ACCESS_DENIED`

```text
HTTP: 403
```

Uso:

```text
tentativa explícita de selecionar Organization sem membership
```

---

## `CROSS_TENANT_REFERENCE`

```text
HTTP: 422
```

Uso interno/domínio:

```text
tentativa de relacionar recursos de Organizations diferentes
```

Cuidado para não revelar dados do outro tenant na resposta.

---

# 23. Organization Errors

## `ORGANIZATION_NOT_FOUND`

```text
HTTP: 404
```

Não utilizar no bootstrap tenant: Organization inexistente nesse fluxo usa uniformemente 403/`ORGANIZATION_ACCESS_DENIED` conforme DEC-065. Outros usos exigem endpoint no qual a existência possa ser legitimamente revelada.

---

## `ORGANIZATION_INACTIVE`

```text
HTTP: 409 ou 403
```

Comportamento definitivo depende de:

```text
ORGQ-005
```

---

## `ORGANIZATION_NAME_CONFLICT`

```text
HTTP: 409
```

Somente utilizar se existir regra de uniqueness correspondente.

---

# 24. Business Unit Errors

## `BUSINESS_UNIT_NOT_FOUND`

```text
HTTP: 404
```

---

## `BUSINESS_UNIT_INACTIVE`

```text
HTTP: 409
```

Uso possível:

```text
tentativa de utilizar BU inativa em nova associação
```

---

## `BUSINESS_UNIT_NOT_ALLOWED`

```text
HTTP: 403
```

Uso:

```text
BU pertence ao tenant, mas está fora do scope autorizado
```

Somente pode ser exposto quando a existência da Business Unit for legitimamente revelável. Caso contrário, usar o contrato 404 já aprovado para o tipo ou `RESOURCE_NOT_FOUND` como fallback genérico, sem decidir nesta regra a autorização específica de Business Units.

---

## `BUSINESS_UNIT_NAME_CONFLICT`

```text
HTTP: 409
```

Somente se:

```text
ORGQ-001
```

definir uniqueness correspondente.

---

# 25. User / Membership Errors

## Bootstrap tenant — DEC-065

### `ORGANIZATION_CONTEXT_REQUIRED`

```text
HTTP: 400
Message: A organização da requisição é obrigatória.
```

Usar somente quando `X-Organization-Id` estiver ausente em endpoint tenant-bound.

### `INVALID_ORGANIZATION_CONTEXT`

```text
HTTP: 400
Message: Contexto de organização inválido.
```

Usar para UUID inválido ou múltiplos valores de `X-Organization-Id`.

### `ORGANIZATION_ACCESS_DENIED`

```text
HTTP: 403
Message: Acesso à organização não autorizado.
```

Usar uniformemente no bootstrap para Membership inexistente, inativa, pertencente a outro User ou Organization inexistente. Não expor qual condição ocorreu. `MEMBERSHIP_NOT_FOUND` e `MEMBERSHIP_INACTIVE` não representam falhas desse bootstrap e não permanecem no catálogo sem caso administrativo aprovado.

---

## `USER_NOT_FOUND`

```text
HTTP: 404
```

---

## `MEMBERSHIP_ALREADY_EXISTS`

```text
HTTP: 409
```

---

## `INVALID_ROLE`

```text
HTTP: 422
```

---

## `INVALID_BUSINESS_UNIT_SCOPE`

```text
HTTP: 422
```

---

# 26. Processing Activity Errors

## `PROCESSING_ACTIVITY_NOT_FOUND`

```text
HTTP: 404
```

---

## `PROCESSING_ACTIVITY_NAME_REQUIRED`

```text
HTTP: 422
```

Se a validação ocorrer no domínio.

Se campo obrigatório for rejeitado no DTO:

```text
VALIDATION_ERROR
```

pode ser suficiente.

---

## `PROCESSING_ACTIVITY_BUSINESS_UNIT_REQUIRED`

```text
HTTP: 422
```

---

## `PROCESSING_ACTIVITY_ALREADY_ARCHIVED`

```text
HTTP: 409
```

---

## `PROCESSING_ACTIVITY_NOT_EDITABLE`

```text
HTTP: 409
```

Uso:

```text
estado atual não permite edição direta
```

---

## `PROCESSING_ACTIVITY_ACTIVE_REVISION_REQUIRED`

```text
HTTP: 409
```

Uso possível:

```text
tentativa de editar Activity publicada que exige criação de revisão
```

Depende da decisão final de workflow.

---

# 27. Workflow Errors

## `INVALID_ACTIVITY_TRANSITION`

```text
HTTP: 409
```

Details podem conter:

```json
{
  "currentStatus": "ACTIVE",
  "requestedAction": "SUBMIT"
}
```

Não retornar regras internas desnecessárias.

---

## `ACTIVITY_SUBMIT_REQUIREMENTS_NOT_MET`

```text
HTTP: 422
```

Uso:

```text
Activity não atende requisitos para Submit
```

---

## `ACTIVITY_ACTIVATION_REQUIREMENTS_NOT_MET`

```text
HTTP: 422
```

Uso:

```text
Activity não pode ser ativada
```

---

## `ACTIVITY_ARCHIVE_NOT_ALLOWED`

```text
HTTP: 409
```

---

## `ACTIVITY_REVISION_ALREADY_EXISTS`

```text
HTTP: 409
```

Se modelo final permitir apenas uma revisão ativa.

---

## `ACTIVITY_REVISION_NOT_FOUND`

```text
HTTP: 404
```

---

# 28. Submit Error Details

Pode retornar pendências estruturadas.

Exemplo:

```json
{
  "error": {
    "code": "ACTIVITY_SUBMIT_REQUIREMENTS_NOT_MET",
    "message": "A atividade de tratamento não pode ser submetida",
    "details": {
      "issues": [
        {
          "code": "PURPOSE_REQUIRED",
          "section": "purpose"
        },
        {
          "code": "RETENTION_REQUIRED",
          "section": "retention"
        }
      ]
    }
  }
}
```

---

# 29. Personal Data Errors

## `PERSONAL_DATA_CATEGORY_NOT_FOUND`

```text
HTTP: 404
```

---

## `PERSONAL_DATA_ITEM_NOT_FOUND`

```text
HTTP: 404
```

Somente se granularidade de item existir após:

```text
DQ-001
```

---

## `INVALID_PERSONAL_DATA_SELECTION`

```text
HTTP: 422
```

---

# 30. Data Subject Errors

## `DATA_SUBJECT_CATEGORY_NOT_FOUND`

```text
HTTP: 404
```

---

## `INVALID_DATA_SUBJECT_SELECTION`

```text
HTTP: 422
```

---

# 31. Purpose Errors

## `PURPOSE_REQUIRED`

```text
HTTP: 422
```

---

## `PURPOSE_NOT_FOUND`

```text
HTTP: 404
```

Se Purpose for entidade/recurso independente no modelo final.

---

## `INVALID_PURPOSE`

```text
HTTP: 422
```

---

# 32. Collection Source Errors

## `COLLECTION_SOURCE_NOT_FOUND`

```text
HTTP: 404
```

---

## `COLLECTION_SOURCE_TYPE_REQUIRED`

```text
HTTP: 422
```

---

## `DOCUMENT_TYPE_REQUIRED`

```text
HTTP: 422
```

quando a fonte for documental e regra exigir.

---

## `COLLECTION_SYSTEM_REQUIRED`

```text
HTTP: 422
```

quando regra condicional exigir System.

---

## `INVALID_COLLECTION_SOURCE`

```text
HTTP: 422
```

---

# 33. Processing Operation Errors

## `PROCESSING_OPERATION_NOT_FOUND`

```text
HTTP: 404
```

---

## `INVALID_PROCESSING_OPERATION_TYPE`

```text
HTTP: 422
```

---

## `PROCESSING_OPERATION_SYSTEM_REQUIRED`

```text
HTTP: 422
```

somente quando regra aprovada exigir System para determinada operação.

---

# 34. Recipient Errors

## `RECIPIENT_NOT_FOUND`

```text
HTTP: 404
```

---

## `INVALID_RECIPIENT_TYPE`

```text
HTTP: 422
```

---

## `RECIPIENT_SUPPLIER_NOT_FOUND`

```text
HTTP: 404
```

quando associação contextual utilizar Supplier.

---

# 35. Retention Errors

## `RETENTION_REQUIRED`

```text
HTTP: 422
```

---

## `INVALID_RETENTION_DURATION`

```text
HTTP: 422
```

---

## `INVALID_RETENTION_UNIT`

```text
HTTP: 422
```

---

## `RETENTION_START_EVENT_REQUIRED`

```text
HTTP: 422
```

---

## `INVALID_RETENTION_POLICY`

```text
HTTP: 422
```

Uso para combinação estrutural inválida.

Não significa:

```text
prazo juridicamente inadequado
```

---

# 36. Security Measure Errors

## `SECURITY_MEASURE_REQUIRED`

```text
HTTP: 422
```

---

## `SECURITY_MEASURE_NOT_FOUND`

```text
HTTP: 404
```

---

## `INVALID_SECURITY_MEASURE`

```text
HTTP: 422
```

Não significa:

```text
medida tecnicamente insuficiente
```

a menos que regra explícita futura defina isso.

---

# 37. Legal Basis Errors

## `LEGAL_BASIS_REQUIRED`

```text
HTTP: 422
```

---

## `LEGAL_BASIS_NOT_FOUND`

```text
HTTP: 404
```

---

## `INVALID_LEGAL_BASIS`

```text
HTTP: 422
```

---

## `LEGITIMATE_INTEREST_JUSTIFICATION_REQUIRED`

```text
HTTP: 422
```

Uso:

```text
base escolhida exige justificativa estrutural
```

Não representa validação jurídica da justificativa.

---

## `CONSENT_DOCUMENT_REQUIRED`

```text
HTTP: 422
```

Somente quando regra aprovada exigir documento para aquele cenário.

---

# 38. Consent Errors

## `CONSENT_DOCUMENT_NOT_FOUND`

```text
HTTP: 404
```

---

## `CONSENT_VERSION_REQUIRED`

```text
HTTP: 422
```

---

## `CONSENT_EFFECTIVE_DATE_REQUIRED`

```text
HTTP: 422
```

---

## `INVALID_CONSENT_DOCUMENT`

```text
HTTP: 422
```

---

# 39. International Transfer Errors

## `INTERNATIONAL_TRANSFER_NOT_FOUND`

```text
HTTP: 404
```

---

## `TRANSFER_DESTINATION_COUNTRY_REQUIRED`

```text
HTTP: 422
```

---

## `TRANSFER_MECHANISM_REQUIRED`

```text
HTTP: 422
```

Somente se regra aprovada exigir preenchimento antes da etapa correspondente.

---

## `INVALID_TRANSFER_MECHANISM`

```text
HTTP: 422
```

---

## `INTERNATIONAL_TRANSFER_REVIEW_REQUIRED`

```text
HTTP: 422 ou estado de ComplianceCheck
```

Preferência:

Não utilizar erro HTTP quando:

```text
REVIEW_REQUIRED
```

for resultado normal do Compliance Gate.

---

# 40. System Errors

## `SYSTEM_NOT_FOUND`

```text
HTTP: 404
```

---

## `SYSTEM_INACTIVE`

```text
HTTP: 409
```

Uso:

```text
tentativa de criar nova associação com System inativo
```

---

## `SYSTEM_MAPPING_PENDING`

```text
HTTP: depende de SYSQ-007
```

Não utilizar como bloqueador até:

```text
SYSQ-007
```

ser decidido.

---

## `SYSTEM_MAPPING_REQUIREMENTS_NOT_MET`

```text
HTTP: 422
```

Uso:

```text
tentativa de marcar System como MAPPED sem metadata obrigatória
```

Depende de:

```text
SYSQ-002
```

---

## `SYSTEM_ALREADY_MAPPED`

```text
HTTP: 409
```

Somente se repetir operação for considerado conflito.

Caso a operação seja idempotente, pode não ser erro.

---

## `SYSTEM_NAME_CONFLICT`

```text
HTTP: 409
```

Somente se:

```text
SYSQ-010
```

definir uniqueness.

---

## `SYSTEM_DEACTIVATION_NOT_ALLOWED`

```text
HTTP: 409
```

Depende das regras de relacionamento com Activities.

---

# 41. Supplier Errors

## `SUPPLIER_NOT_FOUND`

```text
HTTP: 404
```

---

## `SUPPLIER_INACTIVE`

```text
HTTP: 409
```

---

## `SUPPLIER_MAPPING_PENDING`

```text
HTTP: depende de SUPQ-006
```

Não utilizar como bloqueador até decisão.

---

## `SUPPLIER_MAPPING_REQUIREMENTS_NOT_MET`

```text
HTTP: 422
```

Depende de:

```text
SUPQ-002
```

---

## `SUPPLIER_NAME_CONFLICT`

```text
HTTP: 409
```

Somente se:

```text
SUPQ-010
```

definir uniqueness.

---

## `SUPPLIER_DEACTIVATION_NOT_ALLOWED`

```text
HTTP: 409
```

Depende de:

```text
SUPQ-009
```

---

# 42. Compliance Errors

## `COMPLIANCE_GATE_NOT_AVAILABLE`

```text
HTTP: 409
```

Uso:

```text
Activity está em estado no qual Gate não pode ser executado
```

---

## `COMPLIANCE_GATE_EXECUTION_FAILED`

```text
HTTP: 500
```

Uso:

```text
falha técnica inesperada durante execução
```

Não confundir com:

```text
ComplianceCheck = FAIL
```

---

## `COMPLIANCE_REVIEW_REQUIRED`

Não deve necessariamente ser erro HTTP.

É preferencialmente estado normal:

```text
ComplianceCheck.status = REVIEW_REQUIRED
```

---

## `COMPLIANCE_REVIEW_NOT_ALLOWED`

```text
HTTP: 403 ou 409
```

Diferença:

```text
403
ator não autorizado

409
estado atual não permite revisão
```

---

## `COMPLIANCE_REVIEW_JUSTIFICATION_REQUIRED`

```text
HTTP: 422
```

se:

```text
CGQ-002
```

determinar justificativa obrigatória.

---

## `COMPLIANCE_CHECK_NOT_FOUND`

```text
HTTP: 404
```

---

## `COMPLIANCE_GATE_INCOMPLETE`

```text
HTTP: 422
```

Pode ser utilizado ao tentar operação que exige:

```text
ComplianceStatus.COMPLETE
```

---

## `COMPLIANCE_GATE_BLOCKED`

```text
HTTP: 422
```

Somente após semântica de:

```text
BLOCKED
```

estar definida.

---

# 43. Compliance Reason Codes

Compliance reason codes são diferentes de API error codes.

Exemplo:

```text
LEGAL_BASIS_MISSING

RETENTION_MISSING

SECURITY_MEASURES_MISSING

TRANSFER_COUNTRY_MISSING

SENSITIVE_DATA_REVIEW_REQUIRED

MINOR_DATA_REVIEW_REQUIRED
```

Eles pertencem ao:

```text
ComplianceCheck
```

e não necessariamente representam falha HTTP.

---

# 44. Regra

Não misturar:

```text
API Error
```

com:

```text
Compliance Check Result
```

---

# 45. Versioning Errors

## `ACTIVITY_VERSION_NOT_FOUND`

```text
HTTP: 404
```

---

## `ACTIVITY_VERSION_READ_ONLY`

```text
HTTP: 409
```

---

## `ACTIVITY_VERSION_CONFLICT`

```text
HTTP: 409
```

---

## `PUBLISHED_VERSION_NOT_FOUND`

```text
HTTP: 409
```

Uso possível quando operação exige versão publicada.

---

## `REVISION_NOT_ALLOWED`

```text
HTTP: 409
```

---

# 46. Audit Errors

Falha de auditoria em operação que exige AuditLog pode causar falha da transação.

Não retornar necessariamente:

```text
AUDIT_WRITE_FAILED
```

ao cliente.

Preferir:

```text
INTERNAL_ERROR
```

e registrar detalhe técnico internamente.

---

# 47. ROPA Errors

## `ROPA_NOT_AVAILABLE`

```text
HTTP: 409
```

Uso somente se existir cenário no qual ROPA não possa ser produzido.

---

## `ROPA_EXPORT_NOT_ALLOWED`

```text
HTTP: 403
```

quando permission ausente.

---

## `ROPA_EXPORT_FAILED`

```text
HTTP: 500
```

para falha técnica.

---

## `ROPA_EXPORT_TOO_LARGE`

```text
HTTP: 422 ou 413
```

Somente se limite explícito existir.

---

## `ROPA_SNAPSHOT_UNAVAILABLE`

```text
HTTP: 409
```

Pode ser necessário dependendo de:

```text
ROPAQ-008
```

---

# 48. Dashboard Errors

Erros de Dashboard devem normalmente reutilizar categorias gerais.

Exemplo:

```text
FORBIDDEN

INTERNAL_ERROR

SERVICE_UNAVAILABLE
```

Não criar dezenas de códigos específicos sem necessidade.

---

## `DASHBOARD_NOT_AVAILABLE`

```text
HTTP: 403
```

somente se acesso ao Dashboard for uma capability específica.

---

# 49. File Errors

## `FILE_NOT_FOUND`

```text
HTTP: 404
```

---

## `FILE_ACCESS_DENIED`

```text
HTTP: 403
```

Somente quando o arquivo for legitimamente visível e apenas a ação estiver negada.

Cross-tenant pode utilizar:

```text
FILE_NOT_FOUND
```

Arquivo fora do scope de visibilidade também deve ser indistinguível de arquivo inexistente/cross-tenant. Esta regra não define a política específica de autorização de arquivos.

---

## `FILE_TOO_LARGE`

```text
HTTP: 413
```

---

## `FILE_TYPE_NOT_ALLOWED`

```text
HTTP: 422
```

---

## `INVALID_FILE`

```text
HTTP: 422
```

---

## `FILE_UPLOAD_FAILED`

```text
HTTP: 500 ou 503
```

dependendo da causa.

---

## `FILE_STORAGE_UNAVAILABLE`

```text
HTTP: 503
```

---

## `FILE_MALWARE_DETECTED`

```text
HTTP: 422
```

Somente se estratégia de malware scanning for implementada.

Não retornar detalhes desnecessários sobre mecanismo de detecção.

---

# 50. Export Errors

## `EXPORT_NOT_FOUND`

```text
HTTP: 404
```

---

## `EXPORT_PENDING`

Não deve normalmente ser erro.

Preferir recurso com:

```text
status = PENDING
```

---

## `EXPORT_FAILED`

Pode ser estado persistido do Export Job.

Ao consultar job:

```text
200
```

com status:

```text
FAILED
```

pode ser mais apropriado que retornar erro HTTP.

---

## `EXPORT_FORMAT_NOT_SUPPORTED`

```text
HTTP: 422
```

---

## `EXPORT_EXPIRED`

```text
HTTP: 410
```

Pode ser utilizado se arquivos exportados possuírem expiração explícita.

---

# 51. Concurrency Errors

## `CONCURRENT_MODIFICATION`

```text
HTTP: 409
```

Uso:

```text
recurso mudou desde a versão lida pelo cliente
```

---

## `VERSION_MISMATCH`

```text
HTTP: 409
```

Pode ser usado se estratégia utilizar versão explícita.

---

## `ETAG_MISMATCH`

```text
HTTP: 412
```

Somente se API adotar ETag/If-Match.

Não implementar até estratégia de:

```text
APIQ-004
```

estar definida.

---

# 52. Rate Limit

## `RATE_LIMIT_EXCEEDED`

```text
HTTP: 429
```

Pode incluir:

```http
Retry-After
```

quando apropriado.

---

# 53. Infrastructure Errors

Erros internos de infraestrutura devem ser traduzidos.

Não retornar:

```text
ECONNREFUSED

PrismaClientKnownRequestError

QueryFailedError

S3 SDK stack
```

diretamente ao cliente.

---

## `DATABASE_UNAVAILABLE`

Normalmente:

```text
HTTP: 503
```

Pode ser convertido externamente para:

```text
SERVICE_UNAVAILABLE
```

se não houver benefício em expor dependência específica.

---

## `STORAGE_UNAVAILABLE`

```text
HTTP: 503
```

---

## `DEPENDENCY_TIMEOUT`

```text
HTTP: 503 ou 504
```

conforme arquitetura.

---

# 54. Internal Error Mapping

Camada de infraestrutura pode produzir erro técnico:

```text
DatabaseConnectionError
```

que é mapeado para contrato seguro:

```text
SERVICE_UNAVAILABLE
```

---

# 55. Domain Error Base

Implementação pode utilizar estrutura semelhante a:

```ts
abstract class DomainError extends Error {
  abstract readonly code: string;
}
```

Não é obrigatório se outra estratégia consistente for escolhida.

---

# 56. Application Error

Pode existir separação:

```text
DomainError

ApplicationError

InfrastructureError
```

desde que não gere complexidade desnecessária.

---

# 57. Controller

Controller não deve mapear manualmente dezenas de erros.

Preferir mecanismo centralizado.

---

# 58. Global Exception Mapping

Fluxo:

```text
Error
↓
Known Error Mapping
↓
HTTP Status
↓
Safe ApiErrorResponse
```

---

# 59. Unknown Error

Qualquer erro não reconhecido:

```text
INTERNAL_ERROR
```

---

# 60. Logging Unknown Errors

Registrar internamente:

```text
requestId

error type

stack

safe context
```

---

# 61. Não retornar stack

Mesmo em:

```text
INTERNAL_ERROR
```

resposta deve permanecer segura.

---

# 62. Frontend Error Handling

Frontend deve possuir tratamento central para:

```text
401

403

404

409

422

429

500+

network errors
```

---

# 63. 401 no Frontend

Pode provocar:

```text
session refresh
```

ou:

```text
redirect login
```

conforme estratégia de autenticação.

---

# 64. 403 no Frontend

Mostrar estado de acesso negado.

Não tentar esconder erro como:

```text
resource does not exist
```

quando backend retornou explicitamente 403.

---

# 65. 404 no Frontend

Mostrar recurso indisponível/não encontrado sem revelar motivos de tenant.

---

# 66. 409 no Frontend

Pode exigir:

```text
reload resource

show conflict

redirect workflow

refresh state
```

dependendo do código.

---

# 67. 422 no Frontend

Pode mapear issues para:

```text
form fields

wizard sections

compliance correction links
```

---

# 68. 429 no Frontend

Informar temporariamente que limite foi atingido.

Respeitar:

```text
Retry-After
```

quando fornecido.

---

# 69. 500 no Frontend

Mostrar mensagem segura.

Pode exibir:

```text
requestId
```

para suporte.

---

# 70. Network Error

Diferenciar:

```text
API returned error
```

de:

```text
network unavailable
```

---

# 71. Error Localization

Backend pode retornar mensagens em inglês técnico e frontend traduzir por:

```text
error.code
```

ou backend pode possuir mensagens localizadas futuramente.

Não utilizar mensagem como contrato.

---

# 72. Wizard Errors

Wizard deve mapear erros estruturados para etapas.

Exemplo:

```text
PURPOSE_REQUIRED
→ Purpose step

RETENTION_REQUIRED
→ Retention step

LEGAL_BASIS_REQUIRED
→ Legal Basis step
```

---

# 73. Compliance Correction Links

Compliance `reasonCode` deve possuir mapeamento próprio para seção de correção.

Não reutilizar arbitrariamente API error codes.

---

# 74. Error Details Security

Antes de adicionar dado em:

```text
details
```

perguntar:

```text
isso revela recurso que usuário não deveria conhecer?
```

---

# 75. Cross-Tenant Example

Errado:

```json
{
  "error": {
    "code": "CROSS_TENANT_REFERENCE",
    "details": {
      "supplierOrganizationId": "other-org-id",
      "supplierName": "Secret Supplier"
    }
  }
}
```

---

# 76. Melhor

```json
{
  "error": {
    "code": "INVALID_REFERENCE",
    "message": "O recurso referenciado não está disponível"
  }
}
```

quando exposição for problemática.

---

# 77. Generic Reference Error

Adicionar:

## `INVALID_REFERENCE`

```text
HTTP: 422
```

Uso:

```text
recurso referenciado não pode ser utilizado
```

sem revelar motivo sensível.

---

# 78. Not Found Consistency

Pela DEC-066, códigos `*_NOT_FOUND` específicos já aprovados devem ser reutilizados em endpoints tipados. `RESOURCE_NOT_FOUND` é o fallback genérico quando não houver contrato específico; não criar novos códigos específicos arbitrariamente.

Repositories tenant-aware devem facilitar:

```text
recurso inexistente, outside tenant ou fora do scope de visibilidade
↓
mesmo status, error.code, message e formato 404 no endpoint
```

Sem lookup global seguido de mensagem reveladora. Não expor Organization, Business Unit, owner, existência, estado interno ou causa da negação.

---

# 79. Idempotency

Operações idempotentes não devem retornar conflito apenas porque estado desejado já existe, salvo regra específica.

Exemplo potencial:

```text
deactivate already inactive resource
```

pode:

```text
return success
```

ou:

```text
409
```

A escolha deve ser consistente.

---

# 80. Nova Open Question

Adicionar:

```text
ERRQ-001
```

Pergunta:

```text
Operações semânticas repetidas devem ser idempotentes ou retornar conflito quando o recurso já estiver no estado solicitado?
```

Priority:

```text
MEDIUM
```

Impacta:

```text
activate

archive

deactivate

reactivate

complete mapping
```

---

# 81. Validation Strategy

Evitar criar código específico para cada campo se:

```text
VALIDATION_ERROR
```

com details estruturados resolver adequadamente.

---

# 82. Domain-Specific Error

Criar código específico quando frontend precisa reagir semanticamente.

Exemplo:

```text
INVALID_ACTIVITY_TRANSITION
```

é útil.

---

# 83. Evitar explosão de códigos

Não criar:

```text
NAME_TOO_SHORT

NAME_TOO_LONG

NAME_IS_EMPTY

NAME_HAS_INVALID_CHAR
```

para todos os recursos se validation details já cobrem.

---

# 84. Stable Codes

Depois que código estiver em produção e consumido pelo frontend:

```text
não renomear arbitrariamente
```

---

# 85. Deprecated Error Code

Se código precisar ser substituído:

```text
documentar

migrar consumidores

remover posteriormente
```

---

# 86. Error Catalog Ownership

Este documento é fonte central para códigos públicos da API.

Features podem mencionar códigos, mas não devem criar novos códigos silenciosamente.

---

# 87. Processo para novo erro

```text
Need identified
↓
Check existing catalog
↓
Reuse existing code if semantics match
↓
Otherwise define new stable code
↓
Update this document
↓
Implement
↓
Test
```

---

# 88. Testes obrigatórios

Global error handling deve testar:

```text
validation error

authentication error

authorization error

not found

domain validation

workflow conflict

concurrency conflict

rate limit

unexpected exception
```

---

# 89. Tenant Error Tests

Testar:

```text
Organization A
↓
request resource from Organization B
↓
safe response
```

Sem:

```text
name

organization

existence details
```

do recurso de B.

---

# 90. Error Contract Tests

API tests devem verificar:

```text
HTTP status

error.code

response structure

absence of sensitive details
```

---

# 91. Frontend Tests

Testar pelo menos:

```text
401 behavior

403 screen

404 resource state

409 conflict handling

422 field mapping

500 safe message

requestId display
```

---

# 92. Observability

Erro inesperado deve possuir correlação com:

```text
requestId
```

---

# 93. Audit

Erro técnico não deve automaticamente criar AuditLog.

AuditLog representa eventos de negócio relevantes.

---

# 94. Falha de operação

Se operação falhar antes de ocorrer:

```text
ACTIVITY_ACTIVATED
```

não deve ser auditado como sucesso.

---

# 95. Tentativas relevantes

Eventos de segurança podem registrar tentativas negadas separadamente dos AuditLogs de sucesso.

Seguir:

```text
18-OBSERVABILITY.md
```

---

# 96. Error Codes iniciais obrigatórios

Conjunto mínimo recomendado:

```text
INTERNAL_ERROR

SERVICE_UNAVAILABLE

INVALID_REQUEST

VALIDATION_ERROR

INVALID_REFERENCE

AUTHENTICATION_REQUIRED

INVALID_SESSION

FORBIDDEN

ORGANIZATION_ACCESS_DENIED

ORGANIZATION_NOT_FOUND

BUSINESS_UNIT_NOT_FOUND

BUSINESS_UNIT_NOT_ALLOWED

PROCESSING_ACTIVITY_NOT_FOUND

PROCESSING_ACTIVITY_NOT_EDITABLE

INVALID_ACTIVITY_TRANSITION

ACTIVITY_SUBMIT_REQUIREMENTS_NOT_MET

ACTIVITY_ACTIVATION_REQUIREMENTS_NOT_MET

PURPOSE_REQUIRED

RETENTION_REQUIRED

SECURITY_MEASURE_REQUIRED

LEGAL_BASIS_REQUIRED

LEGITIMATE_INTEREST_JUSTIFICATION_REQUIRED

TRANSFER_DESTINATION_COUNTRY_REQUIRED

SYSTEM_NOT_FOUND

SYSTEM_INACTIVE

SUPPLIER_NOT_FOUND

SUPPLIER_INACTIVE

COMPLIANCE_GATE_NOT_AVAILABLE

COMPLIANCE_GATE_EXECUTION_FAILED

COMPLIANCE_GATE_INCOMPLETE

ACTIVITY_VERSION_NOT_FOUND

FILE_NOT_FOUND

FILE_TOO_LARGE

FILE_TYPE_NOT_ALLOWED

FILE_UPLOAD_FAILED

EXPORT_FORMAT_NOT_SUPPORTED

CONCURRENT_MODIFICATION

RATE_LIMIT_EXCEEDED
```

---

# 97. Códigos condicionais

Não implementar antes das decisões correspondentes:

```text
SYSTEM_MAPPING_PENDING

SUPPLIER_MAPPING_PENDING

SYSTEM_NAME_CONFLICT

SUPPLIER_NAME_CONFLICT

COMPLIANCE_GATE_BLOCKED

COMPLIANCE_REVIEW_JUSTIFICATION_REQUIRED

ETAG_MISMATCH
```

---

# 98. Checklist ao criar endpoint

```text
[ ] success status definido

[ ] validation errors definidos

[ ] authentication error considerado

[ ] authorization error considerado

[ ] tenant behavior considerado

[ ] not found considerado

[ ] workflow/domain errors considerados

[ ] concurrency considerado

[ ] unexpected error seguro

[ ] requestId disponível

[ ] testes implementados
```

---

# 99. Checklist de segurança

```text
[ ] erro não revela outro tenant

[ ] erro não retorna stack

[ ] erro não retorna SQL

[ ] erro não retorna secrets

[ ] details contém apenas dados necessários

[ ] mensagens de login não permitem enumeração indevida

[ ] logs possuem detalhes técnicos, resposta pública não
```

---

# 100. Open Questions

Adicionar ao:

```text
docs/12-OPEN-QUESTIONS.md
```

---

## ERRQ-001

**Status:** OPEN  
**Priority:** MEDIUM

### Question

Operações semânticas repetidas devem ser idempotentes ou retornar conflito quando o recurso já estiver no estado solicitado?

### Examples

```text
Activate already ACTIVE Activity

Archive already ARCHIVED Activity

Deactivate already INACTIVE System

Deactivate already INACTIVE Supplier

Complete Mapping already MAPPED resource
```

### Impact

```text
API

Frontend

Retries

Automation

Tests
```

---

## ERRQ-002

**Status:** OPEN  
**Priority:** MEDIUM

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

### Impact

```text
API consistency

frontend handling

tests

OpenAPI
```

---

## ERRQ-003

**Status:** OPEN  
**Priority:** LOW

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

### Recommendation Constraint

Independentemente da decisão:

```text
error.code
```

permanece o contrato estável.

---

## ERRQ-004

**Status:** OPEN  
**Priority:** MEDIUM

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

### Important

Cross-tenant deve continuar evitando vazamento de existência.

---

# 101. Acceptance Criteria

Este catálogo é considerado aplicado quando:

```text
[ ] ApiErrorResponse padronizado

[ ] error.code estável

[ ] frontend usa code e não message

[ ] validation details estruturados

[ ] HTTP statuses consistentes

[ ] authentication errors padronizados

[ ] authorization errors padronizados

[ ] tenant behavior seguro

[ ] domain errors padronizados

[ ] workflow errors padronizados

[ ] compliance result separado de API error

[ ] infrastructure errors traduzidos

[ ] requestId presente quando disponível

[ ] stack não retorna ao cliente

[ ] secrets não retornam

[ ] testes de contrato existem
```

---

# 102. Definition of Done

```text
[ ] catálogo revisado

[ ] global exception handler implementado

[ ] error mapping centralizado

[ ] DTO validation integrado

[ ] domain errors integrados

[ ] workflow errors integrados

[ ] tenant errors seguros

[ ] frontend error handler implementado

[ ] wizard error mapping implementado

[ ] observability integrada

[ ] OpenAPI documenta respostas relevantes

[ ] integration tests passam

[ ] security tests passam
```

---

# 103. Regra final

O objetivo não é criar um código diferente para cada possível erro.

O objetivo é possuir erros:

```text
previsíveis

seguros

estáveis

acionáveis
```

A regra deve ser:

```text
Same semantic problem
↓
Same error code
```

e:

```text
Different message wording
↓
Same software behavior
```

Erros públicos devem informar o suficiente para o consumidor corrigir ou tratar o problema, sem expor detalhes internos ou informações de outros tenants.

---

# 104. Próximo documento

O próximo documento recomendado é:

```text
docs/20-API-CONTRACTS.md
```

Ele deve complementar `07-API.md` definindo contratos concretos e reutilizáveis para:

```text
pagination

sorting

filtering

success responses

error responses

timestamps

UUIDs

enums

resource references

allowedActions

optimistic concurrency

file metadata

export jobs

API versioning

OpenAPI conventions
```

Assim, antes de implementar cada endpoint, os agentes terão um padrão único para request e response.
