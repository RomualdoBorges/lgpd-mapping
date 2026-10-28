# Feature — Atividade de Tratamento

> **Feature:** Processing Activity  
> **Status:** Draft  
> **Módulo:** Data Mapping  
> **Documentos relacionados:** `00-PROJECT.md`, `02-DOMAIN.md`, `03-DATABASE.md`, `04-AUTHORIZATION.md`, `05-BUSINESS-RULES.md`, `06-WORKFLOWS.md`, `07-API.md`, `10-AUDIT.md`, `12-OPEN-QUESTIONS.md`, `features/ORGANIZATIONS.md`

## Primeiro recorte persistente aprovado — implementação pendente

[DEC-073](../13-DECISIONS.md#dec-073--processingactivity-persistência-mínima-e-leitura-d1) aprova somente `id UUID`, `organization_id UUID`, `business_unit_id UUID`, `name TEXT`, `created_at TIMESTAMPTZ`, `updated_at TIMESTAMPTZ`, todos obrigatórios. Nome não vazio nem composto somente por espaços, sem unicidade ou limite máximo adicional. Área responsável obrigatória da mesma Organization, garantida por FK composta; não há áreas participantes neste recorte.

A leitura D1 considera exclusivamente a área responsável: ORGANIZATION da própria Organization, BUSINESS_UNIT somente nas áreas explícitas, vazio sem leitura. A primeira consulta interna retorna apenas `id`, `organizationId`, `businessUnitId`, `name`, `createdAt`, `updatedAt`. Ausência e falta de visibilidade são indistinguíveis; falhas contratuais/persistência são erros. Grants e Activity no mesmo snapshot tenant-bound REPEATABLE READ; RLS/FORCE RLS e runtime com leitura mínima, sem BYPASSRLS ou ownership; migration incremental futura.

Não autoriza criação/atualização por usuários, exclusão, status/workflow, versões, publicação, compliance, owner individual obrigatório, áreas participantes, ROPA, endpoints ou frontend. As seções posteriores sobre campos, criação, versões e workflow são especificação ampliada, não autorização para o primeiro modelo. Nome/área na identidade estrutural não definem vínculo definitivo com versões. PAQ-001, PAQ-003, DQ-009, VALQ-002, WFQ-001/007/008/015, DBQ-002, AUDQ-013 e ROPAQ-001/002 permanecem OPEN. Esta formalização não cria tabela, consulta, endpoint ou funcionalidade entregue.

---

# 1. Objetivo

`ProcessingActivity` representa uma atividade de tratamento de dados pessoais mapeada pela organização.

É a principal entidade de negócio da plataforma.

Exemplos conceituais:

```text
Processamento da folha de pagamento

Recrutamento e seleção

Cadastro de clientes

Atendimento ao consumidor

Controle de acesso de funcionários

Campanhas de marketing
```

A atividade concentra as informações necessárias para compreender:

```text
o que é feito

por que é feito

quais dados são tratados

de quais titulares

como os dados são coletados

onde são tratados

quais operações são realizadas

quem recebe os dados

por quanto tempo são mantidos

quais medidas de segurança existem

qual base legal foi informada

se existe transferência internacional
```

---

# 2. Papel no domínio

A estrutura conceitual central é:

```text
Organization
    ↓
Business Unit
    ↓
Processing Activity
    ├── Purposes
    ├── Personal Data
    ├── Data Subjects
    ├── Collection Sources
    ├── Processing Operations
    ├── Systems
    ├── Recipients
    ├── Suppliers
    ├── Retention
    ├── Security Measures
    ├── Legal Bases
    ├── International Transfers
    └── Compliance Checks
```

---

# 3. Aggregate

`ProcessingActivity` deve ser tratada como aggregate principal para o processo de mapeamento.

Isso não significa que todos os dados precisam estar em uma única tabela.

Significa que determinadas operações precisam preservar invariantes da atividade como um todo.

---

# 4. Tenant

Toda atividade pertence a exatamente uma:

```text
Organization
```

Regra:

```text
ProcessingActivity.organizationId
=
AuthenticatedContext.organizationId
```

na criação.

O frontend não escolhe livremente o tenant.

---

# 5. Área responsável

Toda atividade deve possuir uma:

```text
BusinessUnit
```

responsável.

Exemplo:

```text
Processamento da folha de pagamento
↓
Recursos Humanos
```

---

# 6. Regra de tenant da área

A Business Unit precisa pertencer à mesma organização da atividade.

Proibido:

```text
Activity
Organization A

↓

BusinessUnit
Organization B
```

---

# 7. Responsável individual

Ainda está em aberto se a atividade também possuirá:

```text
ownerUserId
```

ou conceito equivalente.

Relacionado:

```text
DQ-009
```

Não adicionar obrigatoriamente antes da decisão.

---

# 8. Campos principais

Estrutura conceitual:

```text
id

organizationId

businessUnitId

name

status

complianceStatus

currentVersion

createdBy

createdAt

updatedAt
```

Campos definitivos devem seguir o modelo de banco aprovado.

---

# 9. Nome

Nome da atividade é obrigatório.

Deve representar claramente o processo tratado.

Exemplo adequado:

```text
Processamento da folha de pagamento
```

Evitar nomes excessivamente genéricos como:

```text
Dados

Sistema

Processamento

Cadastro
```

A plataforma pode orientar o usuário, mas não deve tentar interpretar juridicamente o nome.

---

# 10. Descrição

Pode existir campo:

```text
description
```

para contextualizar a atividade.

Exemplo:

```text
Tratamento dos dados necessários para cálculo,
pagamento e administração da folha de funcionários.
```

A obrigatoriedade precisa ser definida.

---

# 11. Status

Estados atualmente propostos:

```text
DRAFT

MAPPING

PENDING_REVIEW

COMPLIANCE_PENDING

ACTIVE

UNDER_REVIEW

ARCHIVED
```

A lista definitiva depende das decisões do workflow.

---

# 12. Compliance Status

Separado de `status`.

Valores conceituais:

```text
PENDING

COMPLETE

BLOCKED
```

Nunca utilizar:

```text
status = ACTIVE
```

como sinônimo de:

```text
complianceStatus = COMPLETE
```

---

# 13. Exemplo

```json
{
  "status": "COMPLIANCE_PENDING",
  "complianceStatus": "PENDING"
}
```

é uma combinação possível.

---

# 14. Criação

Fluxo conceitual:

```text
User
↓
Nova atividade
↓
Nome
↓
Business Unit
↓
ProcessingActivity criada
↓
DRAFT
```

---

# 15. Criação mínima

A criação inicial deve exigir somente dados necessários para estabelecer o draft.

Exemplo:

```json
{
  "name": "Processamento da folha de pagamento",
  "businessUnitId": "uuid"
}
```

Não exigir todos os dados do mapeamento para criar o registro.

---

# 16. Por que permitir draft incompleto?

O mapeamento pode ser longo.

Usuário precisa conseguir:

```text
começar

salvar

sair

retornar

continuar
```

sem preencher todo o processo em uma única sessão.

---

# 17. DRAFT

`DRAFT` representa atividade criada, mas ainda não suficientemente mapeada.

Pode conter informações incompletas.

---

# 18. MAPPING

`MAPPING` representa atividade cujo levantamento está em andamento.

A necessidade de separar:

```text
DRAFT
```

e:

```text
MAPPING
```

ainda depende de:

```text
WFQ-001
```

---

# 19. Salvamento progressivo

Durante o mapeamento:

```text
Save Draft
```

não deve executar as mesmas validações de:

```text
Submit
```

---

# 20. Finalidade

Toda atividade concluída precisa possuir finalidade conforme regra atual.

Conceito:

```text
Purpose
```

Exemplo:

```text
Realizar cálculo e pagamento da remuneração dos funcionários.
```

---

# 21. Cardinalidade da finalidade

Ainda está aberta:

```text
DQ-004
```

Possibilidades:

```text
ProcessingActivity
↓
1 Purpose
```

ou:

```text
ProcessingActivity
├── Purpose A
├── Purpose B
└── Purpose C
```

O modelo arquitetural atual está preparado para:

```text
1:N
```

mas isso ainda não deve ser tratado como decisão funcional definitiva.

---

# 22. Finalidades vagas

A aplicação pode futuramente orientar contra finalidades excessivamente vagas.

Exemplo:

```text
"Para fins administrativos"
```

Porém a regra objetiva de validação ainda não está definida.

Não criar heurísticas arbitrárias.

---

# 23. Dados pessoais

Uma atividade pode tratar múltiplas categorias de dados.

Exemplo:

```text
ProcessingActivity
├── Identificação
├── Financeiro
└── Dados profissionais
```

---

# 24. Categorias iniciais

O levantamento funcional prevê categorias como:

```text
identificação

financeiro

saúde

biometria

imagem/voz

menores

opinião política

outros
```

A nomenclatura definitiva do catálogo deve ser centralizada.

---

# 25. Dados sensíveis

A plataforma deve conseguir identificar categorias consideradas sensíveis dentro do catálogo configurado.

Exemplo conceitual:

```text
PersonalDataCategory
isSensitive = true
```

---

# 26. Consequência

Presença de dados sensíveis deve gerar avaliação específica.

Não significa automaticamente:

```text
FAIL
```

no Compliance Gate.

Pode gerar:

```text
REVIEW_REQUIRED
```

conforme regras definidas.

---

# 27. Menores

O envolvimento de menores também precisa ser identificável.

Conceitualmente, titular menor deve preferencialmente ser tratado no modelo de:

```text
DataSubjectCategory
```

e não apenas como tipo de dado.

Essa distinção deve ser preservada no domínio.

---

# 28. Granularidade dos dados

Questão:

```text
DQ-001
```

define se a plataforma utilizará apenas:

```text
categoria
```

ou também:

```text
dado específico
```

Exemplo:

```text
Identificação
├── Nome
├── CPF
├── RG
└── E-mail
```

---

# 29. V1

Enquanto a granularidade não estiver decidida:

```text
PersonalDataCategory
```

é suficiente para o fluxo básico.

A arquitetura pode permanecer preparada para:

```text
PersonalDataItem
```

sem obrigar sua utilização.

---

# 30. Dados reais

A atividade registra:

```text
quais tipos de dados são tratados
```

e não:

```text
os dados reais de cada titular
```

Exemplo:

```text
CPF
```

é válido.

Exemplo:

```text
123.456.789-00
```

de uma pessoa real não deve ser necessário para o mapeamento.

---

# 31. Titulares

Uma atividade pode envolver múltiplas categorias de titulares.

Exemplos:

```text
Funcionários

Candidatos

Clientes

Fornecedores

Menores
```

---

# 32. Relação

```text
ProcessingActivity
↓
DataSubjectCategory[]
```

---

# 33. Outros titulares

Pode existir opção:

```text
OTHER
```

com descrição complementar.

Exemplo:

```text
Visitantes
```

---

# 34. Fonte de coleta

A atividade precisa registrar como os dados entram no processo.

Conceito:

```text
CollectionSource
```

---

# 35. Pergunta principal

Fluxo funcional:

```text
Os dados são coletados por documento?
```

Se:

```text
SIM
```

seguir fluxo documental.

Se:

```text
NÃO
```

seguir fluxo de sistema/formulário/outra fonte.

---

# 36. Coleta documental

Informações possíveis:

```text
documentType

collectionMoment

attachment/model
```

Exemplos:

```text
Contrato

Ficha cadastral

Formulário físico

Documento de identificação
```

---

# 37. Upload

Se documento/modelo for anexado:

```text
File
```

deve utilizar armazenamento seguro conforme especificação de segurança.

Não armazenar documento real com dados pessoais quando um modelo vazio for suficiente.

---

# 38. Coleta não documental

Pode registrar:

```text
System

Form

Other
```

---

# 39. Sistema de origem

Exemplo:

```text
Sistema de RH
```

pode ser associado como:

```text
System
```

---

# 40. Coleta direta

Também deve ser possível indicar se os dados foram obtidos:

```text
diretamente do titular
```

ou não.

---

# 41. Processamento além do armazenamento

Pergunta funcional:

```text
Os dados são tratados além do simples armazenamento?
```

Quando sim, devem ser registradas operações.

---

# 42. Processing Operation

Operações inicialmente previstas:

```text
USE

UPDATE

INTERNAL_TRANSFER

EXTERNAL_TRANSFER

INTERNATIONAL_TRANSFER

DELETE
```

---

# 43. Múltiplas operações

Uma atividade pode possuir:

```text
N ProcessingOperations
```

Exemplo:

```text
USE

INTERNAL_TRANSFER

DELETE
```

---

# 44. Executor

Cada operação pode estar relacionada a:

```text
System
```

e/ou:

```text
BusinessUnit
```

conforme natureza da operação.

---

# 45. Sistema

`System` deve ser entidade reutilizável.

Exemplo:

```text
SAP

Salesforce

Sistema interno de RH
```

---

# 46. Relação com sistemas

Uma atividade pode utilizar múltiplos sistemas.

A relação pode surgir através de:

```text
CollectionSource

ProcessingOperation
```

ou outras associações definidas posteriormente.

Evitar criar duplicações inconsistentes.

---

# 47. Sistema pendente

Durante o wizard pode ser permitido:

```text
Quick Create System
```

O sistema pode nascer:

```text
mappingStatus = PENDING
```

---

# 48. Supplier

Fornecedor também deve ser entidade reutilizável.

Exemplos:

```text
empresa de folha de pagamento

empresa de recrutamento

cloud provider

operador externo
```

---

# 49. Recipient

Atividade deve registrar destinatários quando houver compartilhamento.

Tipos conceituais:

```text
INTERNAL

OPERATOR

PUBLIC_AUTHORITY

OTHER
```

A enumeração definitiva deve seguir domínio aprovado.

---

# 50. Destinatário interno

Pode apontar para:

```text
BusinessUnit
```

Exemplo:

```text
RH
↓
Financeiro
```

---

# 51. Destinatário externo

Pode apontar para:

```text
Supplier
```

Exemplo:

```text
Organização
↓
Empresa terceirizada de folha
```

---

# 52. Transferência internacional

Quando houver:

```text
INTERNATIONAL_TRANSFER
```

a atividade deve registrar informações adicionais.

No mínimo, o desenho funcional prevê:

```text
destinationCountry
```

e verificação do mecanismo aplicável.

---

# 53. País

Transferência internacional não deve ser concluída sem país de destino quando essa informação for obrigatória pelo fluxo.

---

# 54. Mecanismo

O sistema pode registrar:

```text
transferMechanism
```

ou conceito equivalente.

A plataforma não deve inventar automaticamente qual mecanismo jurídico deve ser utilizado.

---

# 55. Transferência e Gate

Existência de transferência internacional adiciona check específico no Compliance Gate.

Possível resultado:

```text
REVIEW_REQUIRED
```

até que a avaliação necessária seja concluída.

---

# 56. Retenção

Atividade precisa possuir política de retenção antes da conclusão do Gate.

Informações previstas:

```text
duration

unit

startEvent
```

---

# 57. Exemplo

```text
duration = 5

unit = YEARS

startEvent = TERMINATION_OF_CONTRACT
```

O conteúdo concreto deve ser fornecido pelo usuário responsável.

---

# 58. Granularidade da retenção

Ainda está aberta:

```text
DQ-005
```

Possibilidades:

```text
Activity
↓
Retention
```

ou retenção por:

```text
Purpose

Data Category
```

Não consolidar cardinalidade definitiva antes da decisão.

---

# 59. Medidas de segurança

Uma atividade pode possuir múltiplas:

```text
SecurityMeasures
```

Exemplos conceituais:

```text
controle de acesso

criptografia

backup

MFA

segregação de acesso

monitoramento
```

---

# 60. Presença não significa suficiência

A plataforma registrar:

```text
Criptografia
```

não significa que a implementação técnica foi auditada ou considerada suficiente.

O sistema não deve afirmar automaticamente:

```text
"Esta atividade é segura."
```

---

# 61. Base legal

Uma atividade concluída precisa possuir base legal conforme regras atuais.

---

# 62. Cardinalidade

Ainda depende de:

```text
DQ-002
```

Pode ser:

```text
1
```

ou:

```text
N
```

bases legais.

---

# 63. Associação

Também depende de:

```text
DQ-003
```

A base legal pode estar associada a:

```text
Activity

Purpose

Data
```

ou combinação.

Essa decisão é estrutural.

---

# 64. Legítimo interesse

Quando base:

```text
LEGITIMATE_INTEREST
```

for utilizada, o desenho atual exige:

```text
justification
```

---

# 65. LIA

A justificativa não equivale necessariamente a um fluxo completo de:

```text
Legitimate Interest Assessment
```

LIA completo está fora da V1 conforme escopo atual.

---

# 66. Consentimento

Quando consentimento estiver relacionado à atividade, a plataforma pode armazenar:

```text
ConsentDocument

version

effectiveDate

collectionMethod
```

---

# 67. Aceites individuais

V1 não deve assumir armazenamento de:

```text
aceite individual por titular
```

conforme DEC-026, que responde integralmente a DQ-011 para a V1. Uma mudança exige alteração formal de escopo.

---

# 68. Metadata

Além das etapas do wizard, a atividade precisa contemplar metadata necessária ao registro.

Exemplos:

```text
controller/operator context

purpose

subjects

recipients

international transfer

retention

security measures
```

---

# 69. Controlador e operador

A atividade precisa permitir representar os papéis relevantes previstos no mapeamento.

A modelagem exata entre:

```text
Organization

Supplier

Controller

Operator
```

deve seguir definição futura caso seja necessária estrutura mais sofisticada.

Não criar automaticamente cadastro jurídico complexo.

---

# 70. Submit

Ao finalizar o preenchimento, usuário executa operação semântica:

```text
submit
```

---

# 71. Submit não é PATCH de status

Evitar:

```json
{
  "status": "PENDING_REVIEW"
}
```

enviado diretamente pelo cliente.

Preferir:

```http
POST /api/v1/processing-activities/:id/submit
```

---

# 72. Validação de submit

No submit, backend deve verificar regras necessárias para avançar.

Exemplos:

```text
atividade identificada

área responsável válida

dados necessários preenchidos

finalidade informada

fluxos condicionais completos
```

A lista definitiva deve acompanhar regras aprovadas.

---

# 73. Erro de submit

Se houver problemas:

```text
status não avança
```

e API retorna erros estruturados.

Exemplo:

```json
{
  "error": {
    "code": "ACTIVITY_MAPPING_INCOMPLETE",
    "details": [
      {
        "field": "retention",
        "code": "RETENTION_REQUIRED"
      }
    ]
  }
}
```

---

# 74. Review

Após submit, a atividade pode seguir para:

```text
PENDING_REVIEW
```

ou diretamente:

```text
COMPLIANCE_PENDING
```

dependendo de:

```text
WFQ-002
WFQ-003
```

---

# 75. Compliance

Antes de ficar ACTIVE, atividade precisa passar pelas regras do Compliance Gate.

Checks conceituais:

```text
LEGAL_BASIS

RETENTION

SECURITY_MEASURES

INTERNATIONAL_TRANSFER

SENSITIVE_DATA

MINOR_DATA
```

---

# 76. Gate Status

Resultados individuais:

```text
PASS

FAIL

REVIEW_REQUIRED

NOT_APPLICABLE
```

---

# 77. Ativação

Regra global:

```text
ACTIVE
```

não pode ocorrer com:

```text
complianceStatus != COMPLETE
```

Além disso, eventual aprovação humana precisa ser respeitada caso seja definida.

---

# 78. API de criação

```http
POST /api/v1/processing-activities
```

Request conceitual:

```json
{
  "name": "Processamento da folha de pagamento",
  "businessUnitId": "uuid"
}
```

---

# 79. Response

```json
{
  "data": {
    "id": "uuid",
    "name": "Processamento da folha de pagamento",
    "status": "DRAFT",
    "complianceStatus": "PENDING",
    "businessUnit": {
      "id": "uuid",
      "name": "Recursos Humanos"
    },
    "currentVersion": 1
  }
}
```

O significado de `currentVersion = 1` durante draft depende da decisão de versionamento.

Não consolidar esse detalhe até:

```text
WFQ-015
AUDQ-013
```

serem resolvidas.

---

# 80. Listagem

```http
GET /api/v1/processing-activities
```

Filtros possíveis:

```text
status

complianceStatus

businessUnitId

search

hasSensitiveData

hasMinorData

hasInternationalTransfer
```

---

# 81. Paginação

Listagem deve ser paginada.

Exemplo:

```http
?page=1&pageSize=20
```

---

# 82. Ordenação

Pode suportar:

```text
name

updatedAt

createdAt
```

Não permitir sort arbitrário diretamente convertido em SQL.

---

# 83. Busca

Busca pode considerar inicialmente:

```text
activity.name
```

Evoluções futuras podem ampliar o escopo.

---

# 84. Detalhe

```http
GET /api/v1/processing-activities/:id
```

Deve respeitar:

```text
tenant

permission

scope
```

---

# 85. Atualização

```http
PATCH /api/v1/processing-activities/:id
```

deve aceitar somente campos editáveis no estado atual.

---

# 86. Campos protegidos

Frontend não deve controlar diretamente:

```text
organizationId

status

complianceStatus

currentVersion

createdBy
```

---

# 87. Allowed Actions

Backend pode retornar:

```json
{
  "allowedActions": [
    "EDIT",
    "SUBMIT"
  ]
}
```

para facilitar frontend.

Isso ainda depende de:

```text
APIQ-016
```

---

# 88. Frontend — lista

Tela:

```text
Atividades de Tratamento
```

pode possuir:

```text
Busca

Filtros

Nova atividade

Tabela
```

---

# 89. Colunas

Exemplo:

```text
Atividade

Área

Status

Compliance

Última atualização

Ações
```

---

# 90. Status visual

Não utilizar somente cor.

Exemplo:

```text
● Ativa
```

deve possuir texto:

```text
Ativa
```

---

# 91. Compliance visual

Exemplos:

```text
Completo

Pendente

Bloqueado
```

Evitar texto:

```text
LGPD Compliant
```

porque o Gate não representa garantia jurídica absoluta.

---

# 92. Nova atividade

Fluxo inicial:

```text
Nova atividade
↓
Nome
↓
Área responsável
↓
Criar
↓
Wizard
```

---

# 93. Detalhe da atividade

Página pode possuir:

```text
Resumo

Mapeamento

Compliance

Histórico

Auditoria
```

conforme permissões.

---

# 94. Header

Exemplo:

```text
Processamento da folha de pagamento

Status: Em mapeamento
Compliance: Pendente

Área responsável:
Recursos Humanos
```

---

# 95. Ações

Botões dependem de:

```text
permission
+
status
+
complianceStatus
```

Exemplos:

```text
Continuar mapeamento

Editar

Submeter

Solicitar alterações

Executar Gate

Ativar

Iniciar revisão

Arquivar
```

---

# 96. Frontend não inventa ações

Não fazer apenas:

```ts
if (status === 'DRAFT') {
  showSubmit = true;
}
```

se autorização também for necessária.

Idealmente considerar:

```text
permissions

workflow

allowedActions
```

---

# 97. Versionamento

Atividade deve preservar versões relevantes.

Conceito:

```text
Activity
├── Version 1
├── Version 2
└── Version 3
```

---

# 98. ACTIVE em revisão

Modelo proposto:

```text
Version 1
ACTIVE

↓

edição relevante

↓

Version 2
UNDER_REVIEW

↓

Version 1 continua vigente
```

até aprovação da nova versão.

Essa regra ainda depende de decisão final.

---

# 99. Alteração relevante

Questão:

```text
DQ-010
```

define o que gera nova versão.

Candidatos:

```text
purpose

legal basis

personal data

subjects

recipient

international transfer

retention

security measures

system

supplier
```

---

# 100. Alteração não relevante

Mudanças como:

```text
correção ortográfica
```

podem eventualmente não gerar nova versão.

Mas a regra precisa ser explícita.

Não criar heurística silenciosa.

---

# 101. Snapshot

Versão histórica pode armazenar snapshot da atividade.

Exemplo conceitual:

```json
{
  "activity": {},
  "purposes": [],
  "personalData": [],
  "subjects": [],
  "operations": [],
  "recipients": [],
  "retention": {},
  "securityMeasures": [],
  "legalBases": [],
  "internationalTransfers": []
}
```

Schema definitivo permanece aberto.

---

# 102. ROPA

ROPA é derivado das atividades.

Fluxo:

```text
Processing Activities
↓
Current Published Versions
↓
ROPA Projection
```

---

# 103. Não duplicar ROPA

Não criar fluxo onde usuário precisa preencher:

```text
Activity
```

e depois repetir os mesmos dados manualmente em:

```text
ROPA
```

---

# 104. Activity e Dashboard

Dashboard também deriva métricas das atividades.

Exemplos:

```text
total

ativas

pendentes

sensíveis

menores

transferências internacionais
```

---

# 105. Arquivamento

Atividade pode passar para:

```text
ARCHIVED
```

conforme workflow.

Arquivamento não deve apagar:

```text
versions

audit

historical ROPA information
```

---

# 106. Delete

Evitar delete físico de atividade já relevante para histórico.

Para draft abandonado, comportamento ainda depende de decisão:

```text
WFQ-012
```

---

# 107. Audit Events

Eventos possíveis:

```text
PROCESSING_ACTIVITY_CREATED

PROCESSING_ACTIVITY_UPDATED

PROCESSING_ACTIVITY_MAPPING_STARTED

PROCESSING_ACTIVITY_SUBMITTED

PROCESSING_ACTIVITY_CHANGES_REQUESTED

PROCESSING_ACTIVITY_COMPLIANCE_RUN

PROCESSING_ACTIVITY_ACTIVATED

PROCESSING_ACTIVITY_REVISION_STARTED

PROCESSING_ACTIVITY_ARCHIVED
```

---

# 108. Audit metadata

Registrar somente contexto necessário.

Exemplo:

```json
{
  "activityId": "uuid",
  "fromStatus": "MAPPING",
  "toStatus": "PENDING_REVIEW"
}
```

---

# 109. Histórico

ActivityVersion e AuditLog possuem funções diferentes.

```text
ActivityVersion
=
estado histórico
```

```text
AuditLog
=
evento ocorrido
```

---

# 110. Concorrência

Dois usuários podem editar a mesma atividade.

Exemplo:

```text
User A abre v1

User B abre v1

User A salva

User B salva depois
```

Não aceitar perda silenciosa de alteração como decisão permanente.

---

# 111. Conflict

Estratégia futura pode utilizar:

```text
version
```

ou:

```text
ETag
```

---

# 112. HTTP Conflict

Quando versão estiver desatualizada:

```text
409 Conflict
```

pode ser utilizado.

---

# 113. Frontend Conflict

Mensagem conceitual:

```text
Esta atividade foi alterada por outro usuário.

Atualize os dados antes de salvar novamente.
```

Não sobrescrever automaticamente.

---

# 114. Authorization

Ações dependem da matriz definida em:

```text
04-AUTHORIZATION.md
```

Exemplos de permissions:

```text
processing_activity:create

processing_activity:read

processing_activity:update

processing_activity:submit

processing_activity:approve

processing_activity:archive
```

---

# 115. Scope

Além da permission:

```text
BUSINESS_UNIT
```

pode restringir atividades acessíveis.

---

# 116. Collaborator

Comportamento exato depende da matriz final.

Conceitualmente pode:

```text
criar

editar atividades permitidas

participar do mapeamento
```

---

# 117. Manager

Pode possuir acesso às atividades da área.

Aprovação ainda está em aberto.

---

# 118. DPO

Pode possuir visão organizacional e responsabilidades de revisão/compliance.

Permissões exatas ainda precisam ser aprovadas.

---

# 119. ADMIN

Caso seja aprovado, não significa automaticamente poder:

```text
aprovar juridicamente atividades
```

Administração técnica e revisão de privacidade são responsabilidades diferentes.

---

# 120. Invariantes

## INV-PA-001

```text
Toda atividade pertence a uma Organization.
```

## INV-PA-002

```text
Toda atividade possui Business Unit válida da mesma Organization.
```

## INV-PA-003

```text
Atividade ACTIVE exige complianceStatus COMPLETE.
```

## INV-PA-004

```text
Draft pode estar incompleto.
```

## INV-PA-005

```text
Submit executa validações de conclusão do mapeamento.
```

## INV-PA-006

```text
Dados reais dos titulares não são necessários para o mapeamento.
```

## INV-PA-007

```text
Atividade histórica não deve perder versões publicadas.
```

## INV-PA-008

```text
ROPA é derivado da atividade e não uma duplicação manual.
```

## INV-PA-009

```text
Cross-tenant relationships são proibidas.
```

## INV-PA-010

```text
Mudanças de estado ocorrem por operações de workflow.
```

---

# 121. Error Codes

Possíveis códigos:

```text
PROCESSING_ACTIVITY_NOT_FOUND

PROCESSING_ACTIVITY_INVALID_STATE

PROCESSING_ACTIVITY_MAPPING_INCOMPLETE

PROCESSING_ACTIVITY_NOT_COMPLIANT

PROCESSING_ACTIVITY_CONFLICT

BUSINESS_UNIT_NOT_FOUND

BUSINESS_UNIT_INVALID_FOR_ORGANIZATION

PURPOSE_REQUIRED

RETENTION_REQUIRED

LEGAL_BASIS_REQUIRED

SECURITY_MEASURE_REQUIRED

INTERNATIONAL_TRANSFER_COUNTRY_REQUIRED
```

A lista deve evoluir conforme implementação.

---

# 122. Testes — criação

```text
Given:
usuário autorizado

When:
cria atividade com nome e área válida

Then:
atividade é criada na organização ativa
```

---

# 123. Teste cross-tenant

```text
Given:
User da Organization A

And:
BusinessUnit da Organization B

When:
tenta criar atividade utilizando BusinessUnit B

Then:
operação é rejeitada
```

---

# 124. Teste draft

```text
Given:
atividade DRAFT

When:
usuário salva informações parciais

Then:
salvamento é permitido
```

---

# 125. Teste submit incompleto

```text
Given:
atividade com campos obrigatórios de conclusão ausentes

When:
usuário executa submit

Then:
submit é rejeitado

And:
status não avança
```

---

# 126. Teste base legal

```text
Given:
atividade sem base legal

When:
Compliance Gate é executado

Then:
LEGAL_BASIS não pode resultar PASS
```

O resultado exato depende das regras do Gate.

---

# 127. Teste retenção

```text
Given:
atividade sem retenção

When:
Gate é executado

Then:
RETENTION não pode resultar PASS
```

---

# 128. Teste segurança

```text
Given:
atividade sem medidas de segurança

When:
Gate é executado

Then:
SECURITY_MEASURES não pode resultar PASS
```

---

# 129. Teste sensível

```text
Given:
atividade contém dados sensíveis

When:
Gate é executado

Then:
check SENSITIVE_DATA é criado/avaliado
```

Não assumir automaticamente FAIL.

---

# 130. Teste menores

```text
Given:
atividade envolve menores

When:
Gate é executado

Then:
check MINOR_DATA é criado/avaliado
```

---

# 131. Teste transferência internacional

```text
Given:
atividade possui INTERNATIONAL_TRANSFER

When:
não possui destinationCountry obrigatório

Then:
mapeamento não pode ser concluído
```

---

# 132. Teste ACTIVE

```text
Given:
complianceStatus != COMPLETE

When:
tentativa de ativação ocorre

Then:
atividade não fica ACTIVE
```

Esse é teste crítico.

---

# 133. Teste versão

Após definição das regras:

```text
Given:
atividade ACTIVE v1

When:
mudança relevante é iniciada

Then:
v1 permanece preservada

And:
nova versão segue workflow de revisão
```

---

# 134. Teste concorrência

Após estratégia definida:

```text
Given:
User A e User B carregaram a mesma versão

And:
User A salva primeiro

When:
User B tenta salvar versão antiga

Then:
API retorna conflito
```

---

# 135. Teste audit

```text
Given:
atividade é submetida

When:
transição é concluída

Then:
PROCESSING_ACTIVITY_SUBMITTED é registrado
```

---

# 136. Open Questions relacionadas

```text
DQ-001 — granularidade dos dados?

DQ-002 — múltiplas bases legais?

DQ-003 — base legal associada a quê?

DQ-004 — múltiplas finalidades?

DQ-005 — granularidade da retenção?

DQ-011 — consentimento individual (respondida por DEC-026): DECIDED por DEC-026

DQ-009 — responsável individual?

DQ-010 — mudanças relevantes?

AUTHQ-002 — aprovador?

WFQ-001 — DRAFT e MAPPING?

WFQ-002 — revisão humana?

WFQ-004 — ativação após Gate?

WFQ-005 — REVIEW_REQUIRED?

WFQ-006 — BLOCKED?

WFQ-007 — edição de ACTIVE?

WFQ-008 — ROPA durante revisão?

AUTHQ-013 — quem arquiva?

WFQ-011 — reativação?

WFQ-009 — REJECTED?

WFQ-014 — CANCELLED?

APIQ-004 — concorrência?

APIQ-016 — allowedActions?
```

---

# 137. Nova questão — PAQ-001

**Status:** OPEN  
**Priority:** LOW

Campo:

```text
description
```

será obrigatório?

---

# 138. Nova questão — DQ-009

**Status:** OPEN  
**Priority:** HIGH

Uma atividade possui:

```text
um usuário responsável
```

além da Business Unit?

Relacionado:

```text
DQ-009
```

---

# 139. Nova questão — PAQ-003

**Status:** OPEN  
**Priority:** MEDIUM

Pode existir mais de uma Business Unit participante além da área responsável?

Exemplo:

```text
Responsável:
RH

Participantes:
Financeiro
Jurídico
TI
```

---

# 140. Nova questão — PAQ-004

**Status:** OPEN  
**Priority:** LOW

O sistema permitirá duplicar/clonar uma atividade?

Possível uso:

```text
atividade semelhante
↓
duplicar
↓
novo DRAFT
```

Se implementado, histórico/auditoria não deve ser compartilhado como se fosse a mesma atividade.

---

# 141. Nova questão — PAQ-005

**Status:** OPEN  
**Priority:** LOW

Atividade pode possuir:

```text
tags
```

ou classificações adicionais?

Não implementar sem necessidade.

---

# 142. Nova questão — PAQ-006

**Status:** OPEN  
**Priority:** CRITICAL

Quais campos mínimos são necessários para:

```text
Submit
```

e quais são necessários somente para:

```text
Compliance Gate
```

Essa distinção é importante para não duplicar validações incorretamente.

---

# 143. Nova questão — PAQ-007

**Status:** OPEN  
**Priority:** HIGH

Alterações não relevantes em uma atividade ACTIVE:

```text
editam a versão vigente
```

ou também precisam criar nova versão?

Não permitir sobrescrita histórica até essa regra ser definida.

---

# 144. Critérios de aceite

```text
AC-PA-001

Given:
usuário autorizado

When:
cria atividade

Then:
atividade pertence automaticamente à organização ativa

And:
status inicial corresponde ao workflow definido
```

```text
AC-PA-002

Given:
atividade em draft

When:
usuário salva mapeamento incompleto

Then:
dados válidos informados são preservados
```

```text
AC-PA-003

Given:
atividade incompleta

When:
usuário tenta submeter

Then:
backend retorna erros estruturados

And:
atividade não avança indevidamente
```

```text
AC-PA-004

Given:
atividade sem compliance completo

When:
tentativa de ativação ocorre

Then:
atividade não fica ACTIVE
```

```text
AC-PA-005

Given:
atividade da Organization A

When:
usuário da Organization B conhece seu UUID

Then:
atividade não é exposta
```

```text
AC-PA-006

Given:
atividade utiliza recurso de outro tenant

When:
associação é enviada

Then:
backend rejeita a relação
```

```text
AC-PA-007

Given:
atividade possui dados sensíveis

When:
compliance é avaliado

Then:
check específico é considerado
```

```text
AC-PA-008

Given:
atividade possui transferência internacional

When:
mapeamento é avaliado

Then:
informações adicionais exigidas pelo fluxo são verificadas
```

```text
AC-PA-009

Given:
atividade publicada possui histórico

When:
nova revisão é criada

Then:
versão histórica anterior não é destruída
```

---

# 145. Definition of Done

A feature Processing Activity está concluída quando aplicável:

```text
[ ] entidade criada

[ ] tenant isolation aplicado

[ ] Business Unit validada

[ ] criação de draft implementada

[ ] leitura implementada

[ ] edição implementada

[ ] wizard integrado

[ ] finalidades integradas

[ ] dados pessoais integrados

[ ] titulares integrados

[ ] coleta integrada

[ ] operações integradas

[ ] sistemas integrados

[ ] destinatários integrados

[ ] fornecedores integrados

[ ] retenção integrada

[ ] medidas de segurança integradas

[ ] bases legais integradas

[ ] transferência internacional integrada

[ ] workflow aplicado

[ ] Compliance Gate integrado

[ ] versionamento aplicado

[ ] auditoria aplicada

[ ] ROPA derivado corretamente

[ ] autorização aplicada

[ ] conflitos tratados

[ ] testes unitários

[ ] testes de integração

[ ] testes cross-tenant

[ ] testes de workflow

[ ] testes E2E críticos

[ ] documentação atualizada
```

---

# 146. Regra final

`ProcessingActivity` deve responder:

```text
Qual tratamento está sendo realizado?

Por qual área?

Para qual finalidade?

Quais dados são tratados?

De quais titulares?

De onde os dados vêm?

O que é feito com eles?

Quais sistemas participam?

Com quem são compartilhados?

Existe transferência internacional?

Por quanto tempo são mantidos?

Quais medidas de segurança foram registradas?

Qual base legal foi informada?

O mapeamento passou pelos checks definidos?

Qual versão está vigente?
```

Se essas informações forem espalhadas sem relação consistente, o ROPA e o Compliance Gate se tornam frágeis.

Por isso:

```text
ProcessingActivity
```

é o núcleo funcional do produto.

---

# 147. Próxima feature

O próximo documento recomendado é:

`docs/features/MAPPING-WIZARD.md`

Ele deve especificar detalhadamente:

```text
etapas do wizard

navegação

salvamento progressivo

campos condicionais

coleta documental

coleta por sistema

operações

dados sensíveis

menores

transferência internacional

validações por etapa

submit

retomada do mapeamento

tratamento de alterações condicionais
```