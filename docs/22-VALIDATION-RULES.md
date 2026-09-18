# Validation Rules

> **Documento:** Regras de Validação  
> **Status:** Draft  
> **Objetivo:** centralizar as regras de validação da plataforma, separando validação técnica, estrutural, de domínio, workflow e Compliance Gate.

---

# 1. Objetivo

A plataforma possui diferentes níveis de validação.

Eles não devem ser tratados como uma única regra:

```text
Transport Validation
↓
Field Validation
↓
Reference Validation
↓
Draft Validation
↓
Step Validation
↓
Submit Validation
↓
Workflow Validation
↓
Compliance Validation
```

---

# 2. Princípio fundamental

Uma Activity pode estar:

```text
válida como Draft
```

e ao mesmo tempo:

```text
inválida para Submit
```

ou:

```text
incompleta para Compliance
```

Isso é esperado.

Aplicar:

```text
DEC-028
```

---

# 3. Draft incompleto

O sistema deve permitir salvar progresso parcial.

Exemplo:

```text
Activity criada
name preenchido
purpose ainda vazio
legal basis ainda vazia
retention ainda vazia
```

Pode ser:

```text
VALID DRAFT
```

mas não necessariamente:

```text
VALID FOR SUBMIT
```

---

# 4. Backend como autoridade

Aplicar:

```text
DEC-005
```

Frontend pode validar para UX.

Backend deve validar novamente.

Fluxo:

```text
Frontend Validation
↓
API Request
↓
Backend Validation
↓
Domain / Workflow Validation
```

---

# 5. Frontend Validation

Objetivos:

```text
feedback rápido

destacar campos

evitar requests obviamente inválidas

melhorar UX
```

Não é mecanismo de segurança.

---

# 6. Backend Validation

Responsável por:

```text
segurança

integridade

domain invariants

tenant isolation

workflow

authorization-related constraints

compliance execution
```

---

# 7. Database Validation

Banco deve proteger invariantes estruturais quando possível.

Exemplos:

```text
foreign keys

unique constraints

NOT NULL estrutural

enum/check constraints quando apropriado
```

---

# 8. Banco não substitui domínio

Não depender exclusivamente de erro SQL para validar regras funcionais.

Errado:

```text
INSERT
↓
database error
↓
discover business rule
```

Preferir:

```text
validate business rule
↓
persist
```

com banco como última barreira de integridade.

---

# 9. Validation Layers

## Level 1 — Transport

Valida formato da request.

Exemplos:

```text
JSON válido

UUID válido

enum válido

tipo correto

string length

date format
```

---

## Level 2 — Reference

Valida referências.

Exemplos:

```text
BusinessUnit exists

System exists

Supplier exists

LegalBasis exists
```

Sempre dentro do tenant/contexto permitido.

---

## Level 3 — Draft

Valida apenas o necessário para persistir estado parcial.

---

## Level 4 — Step

Valida se determinada etapa do Wizard pode ser considerada completa.

---

## Level 5 — Submit

Valida se Activity pode sair do processo de preenchimento para próxima fase.

---

## Level 6 — Workflow

Valida se ação é permitida no estado atual.

---

## Level 7 — Compliance

Executa verificações estruturadas do Compliance Gate.

---

# 10. Error Contract

Aplicar:

```text
19-ERROR-CATALOG.md
```

Transport validation:

```text
VALIDATION_ERROR
```

Domain validation pode utilizar código específico.

---

# 11. Validation Error

Formato:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
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

# 12. Field Error Codes

Utilizar quando aplicável:

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

# 13. Unknown Fields

Comportamento definitivo depende de:

```text
APIQ-018
```

Não permitir mass assignment independentemente da decisão.

---

# 14. Strings

Strings devem possuir:

```text
trim strategy

minimum length

maximum length
```

quando aplicável.

---

# 15. Empty String

Evitar armazenar:

```text
""
```

como equivalente ambíguo de:

```text
null
```

---

# 16. Normalização

Para campos opcionais de texto, estratégia recomendada:

```text
"   "
↓
trim
↓
empty
↓
null
```

quando semanticamente apropriado.

---

# 17. Nova Open Question

Adicionar:

```text
VALQ-001
```

**Question:**

```text
Strings opcionais vazias serão normalizadas para null?
```

**Priority:**

```text
LOW
```

---

# 18. String Length

Limites máximos devem ser definidos antes da implementação definitiva dos DTOs.

Não utilizar:

```text
TEXT ilimitado para tudo
```

sem considerar finalidade.

---

# 19. Nova Open Question

Adicionar:

```text
VALQ-002
```

**Question:**

```text
Quais limites máximos serão adotados para campos comuns como name, description e justification?
```

**Priority:**

```text
MEDIUM
```

---

# 20. UUID Validation

IDs recebidos devem possuir formato válido.

Exemplo inválido:

```text
abc
```

Resultado:

```text
VALIDATION_ERROR
INVALID_UUID
```

---

# 21. UUID válido não significa recurso válido

Depois:

```text
UUID format
↓
tenant-aware lookup
↓
authorization/scope
```

---

# 22. Tenant Reference Validation

Toda referência tenant-bound deve ser validada dentro de:

```text
AuthenticatedContext.organizationId
```

Aplicar:

```text
DEC-018
DEC-019
```

---

# 23. Cross-Tenant

Exemplo:

```text
Activity Organization A
+
Supplier Organization B
```

Resultado:

```text
relação proibida
```

Resposta pública deve evitar revelar existência do Supplier B.

---

# 24. Reference Lookup

Preferir:

```text
findByIdAndOrganizationId(...)
```

ou mecanismo equivalente.

Evitar:

```text
find globally
↓
compare organization
```

quando isso aumentar risco de vazamento.

---

# 25. Inactive Reference

Recursos inativos podem continuar em histórico.

Mas novas associações normalmente devem ser impedidas.

Exemplo:

```text
System.status = INACTIVE
```

Nova associação pode resultar em:

```text
SYSTEM_INACTIVE
```

---

# 26. Historical Reference

Uma Activity histórica pode continuar mostrando:

```text
inactive System

inactive Supplier

inactive BusinessUnit
```

Não apagar associação histórica.

---

# 27. ProcessingActivity — Draft

Campos mínimos para criação devem ser reduzidos.

Exemplo conceitual:

```text
name

businessUnitId?
```

Obrigatoriedade final depende de:

```text
PAQ-001
DQ-009
PAQ-003
```

---

# 28. Activity Name

Regra:

```text
não vazio
```

se `name` for obrigatório na criação.

---

# 29. Activity Description

Obrigatoriedade depende de:

```text
PAQ-001
```

Não marcar REQUIRED silenciosamente.

---

# 30. Responsible User

Depende de:

```text
DQ-009
```

Se obrigatório, referência deve:

```text
exist

belong to Organization

possess valid membership
```

Scope adicional depende das regras de autorização.

---

# 31. Business Unit

Se `businessUnitId` for obrigatório:

```text
must exist

same organization

appropriate status

within actor scope when applicable
```

---

# 32. Multiple Business Units

Depende de:

```text
PAQ-003
```

Não criar array adicional antes da decisão.

---

# 33. Purpose Validation

Purpose deve representar finalidade de tratamento.

Não aceitar apenas whitespace.

---

# 34. Purpose Cardinality

Depende de:

```text
DQ-004
```

---

# 35. Submit Purpose Validation

Se Purpose for requisito de Submit:

```text
no purpose
↓
PURPOSE_REQUIRED
```

---

# 36. Personal Data Validation

Activity deve possuir seleção estruturada de dados pessoais conforme granularidade aprovada.

Depende de:

```text
DQ-001
```

---

# 37. Personal Data Reference

Categoria/item selecionado deve:

```text
exist

be active for new mappings

belong to allowed catalog
```

---

# 38. Duplicate Personal Data

Não permitir duplicação lógica da mesma seleção.

Exemplo:

```text
HEALTH
HEALTH
```

na mesma Activity.

---

# 39. Sensitive Data

Se categoria possui:

```text
isSensitive = true
```

Activity deve ser identificável como envolvendo dado sensível.

Não significa automaticamente:

```text
invalid

FAIL

illegal
```

Aplicar:

```text
DEC-024
```

---

# 40. Data Subject Validation

Categorias devem existir no catálogo válido.

---

# 41. Duplicate Subject

Evitar associação duplicada da mesma categoria.

---

# 42. Minor Data

Se categoria possui:

```text
isMinor = true
```

Activity deve ser identificável para Compliance/Dashboard.

Não significa automaticamente:

```text
FAIL
```

---

# 43. Collection Source

Validação deve ser condicional.

---

# 44. Source Type

Deve utilizar enum/código permitido.

---

# 45. Document Source

Quando fonte for documental, campos documentais podem se tornar obrigatórios.

Exemplo conceitual:

```text
sourceType = DOCUMENT
↓
documentType required?
documentModel required?
collectionMoment required?
```

Regras exatas devem acompanhar Wizard.

---

# 46. Non-Document Source

Quando não for documental:

```text
systemId?
collectedDirectlyFromSubject?
```

podem ser necessários conforme regra aprovada.

---

# 47. Conditional Hidden Fields

Aplicar:

```text
MWQ-001
```

Quando condição mudar, não apagar dados silenciosamente até política ser definida.

---

# 48. Exemplo

Usuário informa:

```text
sourceType = DOCUMENT
documentType = FORM
```

Depois muda:

```text
sourceType = SYSTEM
```

É necessário decidir se:

```text
documentType é removido

preservado mas ignorado

solicita confirmação
```

---

# 49. Multiple Collection Sources

Depende de:

```text
MWQ-004
```

Não impor cardinalidade até decisão.

---

# 50. ProcessingOperation

`type` deve utilizar:

```text
USE

UPDATE

INTERNAL_TRANSFER

EXTERNAL_TRANSFER

INTERNATIONAL_TRANSFER

DELETE
```

Aplicar:

```text
DEC-029
```

---

# 51. Duplicate Operation

Apenas o tipo pode não ser suficiente para definir duplicidade.

Exemplo:

```text
EXTERNAL_TRANSFER to Supplier A

EXTERNAL_TRANSFER to Supplier B
```

podem ser operações distintas.

Não aplicar uniqueness somente em:

```text
activityId + type
```

sem decisão de modelo.

---

# 52. Operation System

Obrigatoriedade/cardinalidade depende de:

```text
SYSQ-006
```

---

# 53. International Operation

A existência de:

```text
INTERNATIONAL_TRANSFER
```

deve exigir registro coerente de InternationalTransfer conforme regra definida.

---

# 54. InternationalTransfer

Transferência deve ser explícita.

Aplicar:

```text
DEC-025
```

---

# 55. Destination Country

Quando transferência internacional existir:

```text
destinationCountry
```

deve ser preenchido antes da conclusão correspondente.

---

# 56. Country Validation

Se catálogo ISO for adotado:

```text
country code must exist
```

Não aceitar label arbitrário.

---

# 57. Transfer Mechanism

Obrigatoriedade depende de:

```text
BRQ-003
```

---

# 58. Supplier Country

Não inferir InternationalTransfer de:

```text
Supplier.country != BR
```

---

# 59. Recipient Validation

Recipient deve possuir tipo válido.

Exemplo conceitual:

```text
INTERNAL

EXTERNAL
```

---

# 60. Internal Recipient

Pode exigir:

```text
businessUnitId
```

quando modelagem aprovada.

---

# 61. External Recipient

Pode possuir:

```text
supplierId
```

quando relacionado a Supplier.

---

# 62. Supplier Role

Não validar `privacyRole` global até:

```text
SUPQ-003
```

ser resolvida.

---

# 63. Retention Validation

Retention é requisito obrigatório do Compliance Gate.

---

# 64. Duration

Quando política usar duração numérica:

```text
duration > 0
```

---

# 65. Unit

Valores devem vir de catálogo/enum aprovado.

Possíveis:

```text
DAYS

MONTHS

YEARS
```

---

# 66. Start Event

Obrigatoriedade/formato depende de:

```text
MWQ-005
```

---

# 67. Retention Granularity

Depende de:

```text
DQ-005
```

Não assumir uma política única por Activity até decisão.

---

# 68. Retention Compliance

Compliance Gate deve validar presença/estrutura.

Não deve automaticamente decidir:

```text
"5 years is legally correct"
```

sem regra jurídica explícita aprovada.

---

# 69. Security Measures

Pelo menos uma medida pode ser requisito do Gate.

Detalhes dependem de:

```text
DQ-006
```

---

# 70. Security Measure Validation

Validar:

```text
presence

reference

structure
```

Não concluir automaticamente:

```text
adequate security
```

---

# 71. Legal Basis

Legal Basis é requisito do Gate.

---

# 72. Cardinalidade

Depende de:

```text
DQ-002
```

---

# 73. Association

Depende de:

```text
DQ-003
```

---

# 74. Legal Basis Reference

Deve utilizar catálogo aprovado.

---

# 75. Legitimate Interest

Quando base correspondente for selecionada:

```text
justification
```

pode ser obrigatória.

Relacionado a:

```text
BRQ-005
```

---

# 76. Validation Scope

Sistema pode validar:

```text
justification exists
```

Não deve concluir automaticamente:

```text
justification is legally sufficient
```

---

# 77. Consent

Se Legal Basis ou cenário exigir consentimento:

```text
ConsentDocument
```

pode possuir validações condicionais.

---

# 78. Consent Fields

Possíveis:

```text
file

version

effectiveDate

method
```

Obrigatoriedade depende de:

```text
BRQ-004
```

---

# 79. Individual Consent

Não validar aceitações individuais.

Fora da V1:

```text
DEC-026
```

---

# 80. System Validation

System deve pertencer ao tenant atual.

---

# 81. New System

Quick Create gera:

```text
mappingStatus = PENDING
status = ACTIVE
```

conforme decisões existentes.

---

# 82. System Mapping Completion

Para:

```text
PENDING → MAPPED
```

validar metadata obrigatória.

Critérios dependem de:

```text
SYSQ-002
```

---

# 83. System Pending Impact

Não bloquear Submit/Gate/ACTIVE automaticamente até:

```text
SYSQ-007
```

ser resolvida.

---

# 84. System Name

Uniqueness depende de:

```text
SYSQ-010
```

---

# 85. System Inactive

Não permitir nova associação quando inativo, salvo regra específica futura.

Preservar histórico.

---

# 86. Supplier Validation

Supplier deve pertencer ao tenant atual.

---

# 87. Supplier Mapping Completion

Critérios dependem de:

```text
SUPQ-002
SUPQ-003
```

---

# 88. Supplier Pending Impact

Não bloquear fluxo automaticamente até:

```text
SUPQ-006
```

ser resolvida.

---

# 89. Supplier Name

Uniqueness depende de:

```text
SUPQ-010
```

---

# 90. Supplier Inactive

Preservar referências históricas.

Comportamento em Activities ativas depende de:

```text
SUPQ-009
```

---

# 91. Wizard Step Validation

Cada etapa pode possuir estado:

```text
NOT_STARTED

IN_PROGRESS

COMPLETE
```

como conceito de UI/read model.

Não necessariamente precisa ser persistido como enum.

---

# 92. Step Complete

Uma etapa é completa quando seus requisitos atuais são atendidos.

---

# 93. Wizard Progress

Fonte definitiva depende de:

```text
MWQ-003
```

Pode ser:

```text
backend-derived

frontend-derived

hybrid
```

---

# 94. Continue

Ao clicar:

```text
Continue
```

frontend deve validar campos necessários para aquela etapa.

---

# 95. Save Draft

Ao clicar:

```text
Save
```

não exigir campos de etapas futuras.

---

# 96. Resume

Comportamento depende de:

```text
MWQ-002
```

---

# 97. Submit Validation

Submit deve possuir validação própria.

Não reutilizar:

```text
Compliance Gate
```

como única validação de Submit.

---

# 98. Submit Requirements

Conjunto final depende de:

```text
PAQ-006
WFQ-002
```

---

# 99. Submit Result

Se requisitos não forem atendidos:

```text
ACTIVITY_SUBMIT_REQUIREMENTS_NOT_MET
```

---

# 100. Submit Issues

Retornar issues estruturadas.

Exemplo:

```json
{
  "issues": [
    {
      "code": "PURPOSE_REQUIRED",
      "section": "purpose"
    },
    {
      "code": "PERSONAL_DATA_REQUIRED",
      "section": "personalData"
    }
  ]
}
```

---

# 101. Nova Open Question

Adicionar:

```text
PAQ-006
```

**Question:**

```text
Qual é a lista exata de requisitos obrigatórios para Submit?
```

**Priority:**

```text
CRITICAL
```

Relacionado a:

```text
PAQ-006
WFQ-002
```

---

# 102. Workflow Validation

Toda ação semântica deve validar estado atual.

---

# 103. Exemplo

```text
ACTIVE
↓
submit
```

pode resultar em:

```text
INVALID_ACTIVITY_TRANSITION
```

---

# 104. Status não vem do cliente

Cliente solicita:

```text
action
```

Backend determina:

```text
next status
```

Aplicar:

```text
DEC-030
```

---

# 105. Activation

Requisitos finais dependem de:

```text
BRQ-006
WFQ-004
WFQ-005
WFQ-006
```

---

# 106. Regra global conhecida

Activity não pode ser considerada concluída/ativa sem:

```text
Legal Basis

Retention

Security Measures
```

e verificações condicionais aplicáveis.

---

# 107. Compliance Gate

Gate não é uma validação booleana.

Aplicar:

```text
DEC-006
```

---

# 108. Checks

Tipos:

```text
LEGAL_BASIS

RETENTION

SECURITY_MEASURES

INTERNATIONAL_TRANSFER

SENSITIVE_DATA

MINOR_DATA
```

---

# 109. Check Status

```text
PASS

FAIL

REVIEW_REQUIRED

NOT_APPLICABLE
```

---

# 110. Legal Basis Check

Exemplo estrutural:

```text
legal basis exists
↓
PASS
```

```text
missing
↓
FAIL
```

Não valida mérito jurídico automaticamente.

---

# 111. Retention Check

```text
retention structure complete
↓
PASS
```

```text
missing
↓
FAIL
```

---

# 112. Security Check

```text
required security metadata present
↓
PASS
```

```text
missing
↓
FAIL
```

Não certifica adequação técnica.

---

# 113. International Transfer Check

Se não houver transferência explícita:

```text
NOT_APPLICABLE
```

Se houver:

```text
validate required transfer metadata
```

Resultado exato depende de:

```text
BRQ-003
```

---

# 114. Sensitive Data Check

Se não houver dados sensíveis:

```text
NOT_APPLICABLE
```

Se houver:

```text
REVIEW_REQUIRED
```

é comportamento proposto, não decisão final.

Depende de:

```text
BRQ-001
CGQ-001
```

---

# 115. Minor Data Check

Mesma lógica.

Depende de:

```text
BRQ-002
CGQ-001
```

---

# 116. Human Review

Resolução de:

```text
REVIEW_REQUIRED
```

depende de:

```text
CGQ-001
WFQ-005
```

---

# 117. Review Justification

Obrigatoriedade depende de:

```text
CGQ-002
```

---

# 118. Compliance Aggregation

Não calcular:

```text
COMPLETE

BLOCKED

PENDING
```

arbitrariamente até regras correspondentes serem decididas.

---

# 119. Compliance Snapshot

Gate deve avaliar dados consistentes.

Se usar versão/snapshot depende de:

```text
CGQ-005
```

---

# 120. Gate Reexecution

Quando reexecutar depende de:

```text
CGQ-004
```

---

# 121. Versioning Validation

Activity ACTIVE pode exigir revisão para alteração relevante.

Depende de:

```text
WFQ-007
PAQ-007
```

---

# 122. Historical Version

Versão publicada não deve ser editável.

Erro:

```text
ACTIVITY_VERSION_READ_ONLY
```

---

# 123. Concurrency Validation

Estratégia depende de:

```text
APIQ-004
```

---

# 124. Concurrent Update

Se recurso mudou desde leitura:

```text
CONCURRENT_MODIFICATION
```

---

# 125. ActivityVersion não é concurrency token

Não reutilizar número funcional de versão automaticamente como controle técnico de concorrência.

---

# 126. File Validation

Upload deve validar:

```text
authorization

tenant context

file size

allowed type

actual file characteristics when necessary
```

---

# 127. Filename

Filename não deve ser utilizado como única validação de tipo.

Exemplo:

```text
document.pdf
```

não garante conteúdo PDF.

---

# 128. MIME Type

Header informado pelo cliente não deve ser considerado prova absoluta.

---

# 129. Allowed Types

Lista depende do caso de uso.

Consent document provavelmente exige:

```text
PDF
```

conforme documento funcional.

Outros uploads dependem do módulo.

---

# 130. File Size

Limites devem ser explícitos.

---

# 131. Nova Open Question

Adicionar:

```text
VALQ-004
```

**Question:**

```text
Qual tamanho máximo permitido por tipo de upload?
```

**Priority:**

```text
MEDIUM
```

---

# 132. Malware Scan

Depende de:

```text
SECQ-005
```

---

# 133. Validation Order

Ordem recomendada:

```text
authentication
↓
authorization/context
↓
transport
↓
tenant-safe references
↓
domain validation
↓
workflow validation
↓
transaction
```

Pode variar tecnicamente sem alterar segurança.

---

# 134. Authorization vs Validation

Não retornar:

```text
"field X invalid"
```

sobre recurso que usuário nem poderia acessar.

Autorização/contexto deve impedir vazamentos.

---

# 135. Database Unique Conflict

Unique constraints devem ser traduzidas para erro estável quando regra correspondente existir.

Exemplo futuro:

```text
SYSTEM_NAME_CONFLICT
```

se:

```text
SYSQ-010
```

decidir uniqueness.

---

# 136. Race Conditions

Mesmo com validação prévia:

```text
check uniqueness
↓
insert
```

banco ainda deve proteger contra corrida quando constraint existir.

---

# 137. Validation Reuse

Regra de domínio deve possuir uma implementação autoritativa.

Evitar duplicar lógica em:

```text
controller

service

frontend

Compliance Gate

export
```

---

# 138. Frontend Schema

Frontend pode possuir Zod schema para UX.

Mas regras críticas continuam no backend.

---

# 139. Shared Validation

Não compartilhar automaticamente todos os schemas frontend/backend se isso acoplar contratos indevidamente.

Compartilhar apenas quando arquitetura justificar.

---

# 140. Validation Messages

Frontend pode traduzir:

```text
REQUIRED
```

para:

```text
Campo obrigatório
```

---

# 141. Business Issue Messages

Exemplo:

```text
LEGAL_BASIS_REQUIRED
```

pode aparecer como:

```text
Informe ao menos uma base legal antes de continuar.
```

---

# 142. Accessibility

Erro de formulário deve ser associado ao campo correspondente.

Não depender apenas de cor.

---

# 143. Wizard Summary

Review Step deve destacar:

```text
incomplete sections

submit blockers
```

sem executar conclusões jurídicas.

---

# 144. ROPA Validation

ROPA é projection.

Não validar ROPA separadamente como fonte de dados.

Se projeção estiver inconsistente:

```text
corrigir source data/read model
```

---

# 145. Dashboard Validation

Mesma regra.

Dashboard não cria estado funcional próprio.

---

# 146. Catalog Validation

Catálogos devem utilizar códigos estáveis.

Não aceitar labels como autoridade.

Correto:

```json
{
  "type": "HEALTH"
}
```

Evitar:

```json
{
  "type": "Dados de saúde"
}
```

---

# 147. Unknown Enum

Valor desconhecido:

```text
INVALID_ENUM
```

---

# 148. Inactive Catalog Entry

Nova associação com item inativo deve ser rejeitada.

Referências históricas continuam válidas.

---

# 149. Duplicate Relationships

Relacionamentos many-to-many devem evitar duplicação lógica quando apropriado.

Exemplo:

```text
same Activity
+
same DataSubjectCategory
```

não deve existir duas vezes.

---

# 150. Delete Validation

Antes de delete/deactivate/archive:

```text
check authorization

check tenant

check lifecycle

check historical references
```

---

# 151. Soft Delete

Política exata depende de:

```text
DBQ-004
```

---

# 152. Required at Create

Não confundir:

```text
required at create
```

com:

```text
required at submit
```

---

# 153. Required at Submit

Não confundir com:

```text
required for compliance
```

---

# 154. Validation Matrix

| Campo/Conceito | Draft | Step | Submit | Compliance |
|---|---:|---:|---:|---:|
| Activity name | Required* | Required | Required | N/A |
| Business Unit | Open | Required* | Required* | N/A |
| Purpose | Optional | Required* | Required* | N/A |
| Personal Data | Optional | Required* | Required* | Used |
| Data Subjects | Optional | Required* | Required* | Used |
| Collection Source | Optional | Conditional | Required* | N/A |
| Operations | Optional | Conditional | Required* | Used |
| Recipient | Optional | Conditional | Conditional | Used |
| International Transfer | Optional | Conditional | Conditional | Check |
| Retention | Optional | Required* | Open | Required |
| Security Measures | Optional | Required* | Open | Required |
| Legal Basis | Optional | Required* | Open | Required |
| Consent | Optional | Conditional | Conditional | Conditional |

`*` = depende de decisões finais de Submit/Wizard.

---

# 155. Open Questions adicionadas

Adicionar a:

```text
docs/12-OPEN-QUESTIONS.md
```

```text
VALQ-001
Strings opcionais vazias serão normalizadas para null?
Priority: LOW

VALQ-002
Quais limites máximos serão adotados para name, description e justification?
Priority: MEDIUM

PAQ-006
Qual é a lista exata de requisitos obrigatórios para Submit?
Priority: CRITICAL

VALQ-004
Qual tamanho máximo permitido por tipo de upload?
Priority: MEDIUM
```

---

# 156. Open Questions existentes críticas

Antes de finalizar validações:

```text
PAQ-001
DQ-009
PAQ-003
PAQ-006

MWQ-001
MWQ-003
MWQ-004
MWQ-005

DQ-001
DQ-002
DQ-003
DQ-004
DQ-005
DQ-006

BRQ-001
BRQ-002
BRQ-003
BRQ-004
BRQ-005
BRQ-006
BRQ-007

WFQ-001
WFQ-002
WFQ-004
WFQ-005
WFQ-006
WFQ-007

CGQ-001
CGQ-002
CGQ-004
CGQ-005

SYSQ-002
SYSQ-005
SYSQ-006
SYSQ-007
SYSQ-010

SUPQ-002
SUPQ-003
SUPQ-004
SUPQ-006
SUPQ-009
SUPQ-010

APIQ-004
APIQ-018

SECQ-005
```

---

# 157. AI Implementation Rule

Antes de implementar validação:

```text
1. Identify field/use case
2. Read this document
3. Check related Feature
4. Check Business Rules
5. Check Open Questions
6. Check Decisions
7. Implement smallest authoritative rule
8. Add backend tests
9. Add frontend UX validation when applicable
```

---

# 158. AI Stop Condition

Se validação depender de questão:

```text
CRITICAL + OPEN
```

e não existir comportamento seguro já decidido:

```text
STOP
```

Responder:

```text
Decision Required
```

com ID da questão.

---

# 159. Prohibited Patterns

Não fazer:

```text
require every field on Draft

trust frontend validation

trust organizationId from body

validate cross-tenant resource globally

delete hidden conditional data silently

infer InternationalTransfer from country

mark sensitive data as FAIL automatically

mark minor data as FAIL automatically

decide legal adequacy automatically

decide security adequacy automatically

use database exceptions as normal business validation

duplicate business rules across controllers

change status through generic PATCH

use ActivityVersion as concurrency token without decision

accept unknown enum labels

accept inactive catalog item for new mapping

return cross-tenant validation details
```

---

# 160. Testing

Cada regra crítica deve possuir teste.

Categorias:

```text
positive case

missing required value

invalid format

invalid reference

cross-tenant reference

inactive reference

conditional requirement

workflow conflict

compliance result

concurrent update
```

---

# 161. Example Test — Tenant

```text
Given:
Activity belongs to Organization A
Supplier belongs to Organization B

When:
associate Supplier to Activity

Then:
operation rejected
no cross-tenant relationship created
response does not expose Organization B
```

---

# 162. Example Test — Draft

```text
Given:
new Activity

When:
save without Legal Basis

Then:
Draft can be persisted
```

---

# 163. Example Test — Compliance

```text
Given:
Activity without Legal Basis

When:
Compliance Gate runs

Then:
LEGAL_BASIS check = FAIL
```

---

# 164. Example Test — Sensitive Data

```text
Given:
Activity uses sensitive category

When:
Compliance Gate runs

Then:
system does not automatically classify Activity as illegal/non-compliant
```

Resultado exato do check depende das decisões correspondentes.

---

# 165. Acceptance Criteria

Este documento estará aplicado quando:

```text
[ ] transport validation centralizada

[ ] field validation consistente

[ ] tenant references validadas

[ ] Draft pode permanecer incompleto

[ ] Wizard possui validação por etapa

[ ] Submit possui validação própria

[ ] workflow actions possuem validação própria

[ ] Compliance Gate permanece estruturado

[ ] sensitive/minor não geram FAIL arbitrário

[ ] international transfer não é inferida

[ ] inactive resources preservam histórico

[ ] file validation existe

[ ] validation errors seguem Error Catalog

[ ] backend permanece autoridade

[ ] frontend fornece UX validation

[ ] testes cobrem regras críticas
```

---

# 166. Definition of Done

```text
[ ] DTO schemas definidos

[ ] normalization definida

[ ] field limits definidos

[ ] reference validation implementada

[ ] tenant-safe validation implementada

[ ] Draft validation implementada

[ ] Wizard validation implementada

[ ] Submit requirements decididos

[ ] Submit validation implementada

[ ] workflow validation implementada

[ ] Compliance validation implementada

[ ] file validation implementada

[ ] concurrency validation definida

[ ] frontend schemas implementados

[ ] backend tests passam

[ ] integration tests passam

[ ] E2E críticos passam
```

---

# 167. Regra final

A pergunta correta não é apenas:

```text
"Is this Activity valid?"
```

A pergunta deve ser:

```text
"Valid for what?"
```

Exemplos:

```text
Valid to persist as Draft?

Valid to complete this Wizard step?

Valid to Submit?

Valid for this workflow transition?

Complete enough for a Compliance Check?
```

Essa separação é essencial para impedir que o sistema transforme o Wizard em um formulário rígido ou trate ausência temporária de informação como irregularidade jurídica.

---

# 168. Próximo documento

O próximo documento é:

```text
docs/23-SEED-AND-CATALOGS.md
```

Ele deve definir:

```text
system catalogs

stable codes

PersonalDataCategory

DataSubjectCategory

LegalBasis

Country

RetentionUnit

ProcessingOperation

roles

statuses

seed strategy

catalog versioning

inactive catalog entries

tenant-specific vs global catalogs

development seed

production seed
```

Esse documento será a referência para impedir que enums, labels e valores iniciais sejam inventados de forma diferente no banco, backend e frontend.