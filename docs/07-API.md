# API — Contratos e Convenções

> **Documento:** Especificação da API  
> **Status:** Draft  
> **Projeto:** LGPD Data Mapping Platform  
> **Estilo:** REST + JSON  
> **Versão inicial:** `/api/v1`  
> **Documentos relacionados:** `01-ARCHITECTURE.md`, `02-DOMAIN.md`, `04-AUTHORIZATION.md`, `05-BUSINESS-RULES.md`, `06-WORKFLOWS.md`

> **Question IDs:** referências canônicas em `12-OPEN-QUESTIONS.md`; migrações dos IDs locais registradas por documento de origem no registro central. Perguntas e recomendações locais não encerram essas questões.


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

## 1. Objetivo

Este documento define as convenções da API da plataforma, incluindo:

- estrutura das URLs;
- autenticação;
- contexto da organização;
- requests e responses;
- paginação;
- filtros;
- ordenação;
- validação;
- erros;
- operações de workflow;
- idempotência;
- concorrência;
- endpoints iniciais.

Este documento não substitui as regras de negócio.

A API deve implementar as regras definidas principalmente em:

```text
04-AUTHORIZATION.md
05-BUSINESS-RULES.md
06-WORKFLOWS.md
```

---

# 2. Estilo da API

Utilizar inicialmente:

```text
REST
+
JSON
+
HTTPS
```

Base:

```text
/api/v1
```

Exemplo:

```text
GET /api/v1/processing-activities
```

---

# 3. Versionamento

Toda API pública do frontend deve ser versionada.

Inicialmente:

```text
/api/v1
```

Mudanças incompatíveis futuras podem gerar:

```text
/api/v2
```

Não criar uma nova versão para pequenas alterações compatíveis.

---

# 4. Convenções de URL

Utilizar recursos no plural.

Preferir:

```text
/processing-activities
/business-units
/systems
/suppliers
/users
```

Evitar:

```text
/getProcessingActivities
/createSupplier
/updateSystem
```

Operações de workflow são exceção e podem utilizar ações semânticas.

Exemplo:

```text
POST /processing-activities/:id/submit
```

---

# 5. Métodos HTTP

Utilizar:

```text
GET     consulta
POST    criação / ação
PATCH   atualização parcial
PUT     substituição completa quando realmente necessário
DELETE  exclusão quando aplicável
```

Para a maioria das edições:

```text
PATCH
```

é preferível.

---

# 6. Content-Type

Requests JSON:

```http
Content-Type: application/json
```

Responses JSON:

```http
Content-Type: application/json
```

Uploads devem utilizar mecanismo específico, como:

```text
multipart/form-data
```

ou upload direto para object storage via URL temporária.

A estratégia definitiva de upload ainda precisa ser definida.

---

# 7. Autenticação

Endpoints protegidos exigem autenticação.

A estratégia concreta ainda depende da decisão:

```text
JWT
Session Cookie
OIDC/SSO
```

A API não deve assumir uma estratégia específica antes da decisão arquitetural.

---

# 8. Contexto autenticado

Após autenticação, o backend deve obter:

```text
userId
organizationId
roles
permissions
businessUnitIds
```

Essas informações devem ser confiáveis e validadas pelo backend.

---

# 9. Organization ID

Não confiar em:

```json
{
  "organizationId": "..."
}
```

enviado pelo cliente para determinar autorização.

Quando `organizationId` fizer parte de um payload por necessidade funcional, o backend ainda deve validar o contexto.

---

# 10. Formato padrão de resposta

Para recurso único:

```json
{
  "data": {
    "id": "uuid",
    "name": "Cadastro de currículos"
  }
}
```

---

# 11. Coleções

Para coleções:

```json
{
  "data": [
    {
      "id": "uuid-1",
      "name": "Cadastro de currículos"
    },
    {
      "id": "uuid-2",
      "name": "Folha de pagamento"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 42,
    "totalPages": 3
  }
}
```

---

# 12. Paginação

Endpoints que podem retornar muitos registros devem possuir paginação.

Parâmetros:

```text
page
pageSize
```

Exemplo:

```text
GET /processing-activities?page=1&pageSize=20
```

Valores sugeridos:

```text
page default = 1
pageSize default = 20
pageSize max = 100
```

Os valores definitivos podem ser configurados.

---

# 13. Ordenação

Padrão:

```text
sort
order
```

Exemplo:

```text
GET /processing-activities?sort=updatedAt&order=desc
```

Valores de `order`:

```text
asc
desc
```

Somente campos permitidos pelo endpoint podem ser utilizados para ordenação.

Nunca interpolar campos arbitrários diretamente em SQL.

---

# 14. Filtros

Exemplo:

```text
GET /processing-activities?status=ACTIVE
```

Filtros podem ser combinados:

```text
GET /processing-activities
    ?status=ACTIVE
    &businessUnitId=...
    &complianceStatus=COMPLETE
```

---

# 15. Busca textual

Quando necessário:

```text
search
```

Exemplo:

```text
GET /processing-activities?search=curriculo
```

A implementação inicial pode buscar por campos definidos, como:

```text
name
description
```

Não realizar busca indiscriminada em todas as colunas.

---

# 16. Datas

Datas e timestamps retornados pela API devem utilizar ISO 8601.

Exemplo:

```json
{
  "createdAt": "2026-09-17T14:30:00Z"
}
```

Datas sem horário:

```text
YYYY-MM-DD
```

---

# 17. IDs

IDs expostos pela API devem utilizar UUID.

Exemplo:

```text
7f46dc87-c21e-49f6-8bc2-4aee2d5cf941
```

---

# 18. Enums

Enums devem utilizar códigos estáveis.

Exemplo:

```json
{
  "status": "COMPLIANCE_PENDING"
}
```

Não utilizar texto traduzido como valor da API.

Evitar:

```json
{
  "status": "Aguardando conformidade"
}
```

A tradução pertence ao frontend.

---

# 19. Erros

Formato padrão:

```json
{
  "error": {
    "code": "LEGAL_BASIS_REQUIRED",
    "message": "Legal basis is required.",
    "details": []
  }
}
```

O campo:

```text
code
```

deve ser estável.

O frontend deve preferir `code` para tratamento programático.

---

# 20. Erros de campo

Exemplo:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed.",
    "details": [
      {
        "field": "retention.duration",
        "code": "REQUIRED"
      },
      {
        "field": "legalBasis",
        "code": "LEGAL_BASIS_REQUIRED"
      }
    ]
  }
}
```

---

# 21. Status HTTP

Utilizar semanticamente:

```text
200 OK
201 Created
204 No Content

400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Unprocessable Entity

500 Internal Server Error
```

---

# 22. 401 vs 403

Utilizar:

```text
401
```

quando o usuário não estiver autenticado.

Utilizar:

```text
403
```

quando estiver autenticado, mas não possuir autorização.

Entretanto, recursos pertencentes a outro tenant podem retornar:

```text
404
```

para evitar exposição da existência do recurso.

---

# 23. 409 Conflict

Utilizar quando houver conflito de estado ou concorrência.

Exemplo:

```text
atividade já foi alterada por outro usuário
```

Resposta:

```json
{
  "error": {
    "code": "RESOURCE_VERSION_CONFLICT",
    "message": "The resource was modified by another user."
  }
}
```

---

# 24. 422

Pode ser utilizado para violações de regras de negócio.

Exemplo:

```text
tentativa de ativar atividade sem compliance completo
```

Resposta:

```json
{
  "error": {
    "code": "ACTIVITY_NOT_COMPLIANT",
    "message": "The activity cannot be activated."
  }
}
```

---

# 25. Request ID

Toda requisição deve possuir identificador de correlação.

Exemplo:

```text
requestId
```

Pode ser retornado em header:

```http
X-Request-Id
```

e incluído nos logs.

---

# 26. Processing Activities

Base:

```text
/api/v1/processing-activities
```

---

# 27. Listar atividades

```http
GET /api/v1/processing-activities
```

Filtros iniciais:

```text
page
pageSize
search
status
complianceStatus
businessUnitId
hasSensitiveData
hasMinorData
hasInternationalTransfer
sort
order
```

A consulta deve respeitar automaticamente:

```text
organization
+
scope
+
permissions
```

---

# 28. Consultar atividade

```http
GET /api/v1/processing-activities/:id
```

Deve retornar a representação necessária para visualização/edição.

Exemplo conceitual:

```json
{
  "data": {
    "id": "uuid",
    "name": "Cadastro de currículos",
    "status": "MAPPING",
    "complianceStatus": "PENDING",
    "businessUnit": {
      "id": "uuid",
      "name": "RH"
    },
    "purposes": [],
    "dataCategories": [],
    "subjects": [],
    "collectionSources": [],
    "operations": [],
    "recipients": [],
    "retentionPolicy": null,
    "securityMeasures": [],
    "legalBases": []
  }
}
```

---

# 29. Criar atividade

```http
POST /api/v1/processing-activities
```

Request mínimo:

```json
{
  "name": "Cadastro de currículos",
  "businessUnitId": "uuid"
}
```

Opcional:

```json
{
  "name": "Cadastro de currículos",
  "description": "Processo seletivo para contratação.",
  "businessUnitId": "uuid"
}
```

O backend deve definir:

```text
organizationId
createdBy
status
complianceStatus
```

Não aceitar esses valores livremente do cliente.

---

# 30. Resposta de criação

```http
201 Created
```

```json
{
  "data": {
    "id": "uuid",
    "name": "Cadastro de currículos",
    "status": "DRAFT",
    "complianceStatus": "PENDING"
  }
}
```

---

# 31. Atualizar atividade

```http
PATCH /api/v1/processing-activities/:id
```

Exemplo:

```json
{
  "name": "Recrutamento de candidatos",
  "description": "..."
}
```

Não permitir alteração arbitrária de:

```text
status
complianceStatus
organizationId
createdBy
```

---

# 32. Wizard

O wizard pode utilizar endpoints específicos por seção ou um endpoint de atualização estruturada.

Recomendação inicial:

Utilizar sub-recursos claros quando o domínio justificar.

Exemplo:

```text
/processing-activities/:id/purposes

/processing-activities/:id/data-categories

/processing-activities/:id/subjects

/processing-activities/:id/collection-sources

/processing-activities/:id/operations

/processing-activities/:id/recipients

/processing-activities/:id/retention-policy

/processing-activities/:id/security-measures

/processing-activities/:id/legal-bases

/processing-activities/:id/international-transfers
```

---

# 33. Evitar endpoint gigante

Evitar depender exclusivamente de:

```http
PUT /processing-activities/:id
```

com todo o wizard:

```json
{
  "everything": "..."
}
```

Isso dificulta:

- salvamento parcial;
- validações;
- concorrência;
- manutenção;
- auditoria.

---

# 34. Finalidades

Caso o modelo 1:N seja aprovado:

```http
GET /processing-activities/:id/purposes

POST /processing-activities/:id/purposes

PATCH /processing-activities/:id/purposes/:purposeId

DELETE /processing-activities/:id/purposes/:purposeId
```

Se a decisão final for finalidade única, simplificar o contrato.

---

# 35. Categorias de dados

Consultar catálogo:

```http
GET /api/v1/personal-data-categories
```

Associar categorias à atividade:

```http
PUT /api/v1/processing-activities/:id/data-categories
```

Exemplo:

```json
{
  "dataCategoryIds": [
    "uuid-1",
    "uuid-2"
  ]
}
```

`PUT` é adequado nesse caso quando o objetivo for substituir o conjunto completo da associação.

---

# 36. Titulares

Catálogo:

```http
GET /api/v1/data-subject-categories
```

Associação:

```http
PUT /api/v1/processing-activities/:id/subjects
```

Request:

```json
{
  "subjectCategoryIds": [
    "uuid-1",
    "uuid-2"
  ]
}
```

---

# 37. Collection Sources

```http
GET /processing-activities/:id/collection-sources

POST /processing-activities/:id/collection-sources

PATCH /processing-activities/:id/collection-sources/:sourceId

DELETE /processing-activities/:id/collection-sources/:sourceId
```

---

# 38. Exemplo — coleta por documento

```json
{
  "sourceType": "DOCUMENT",
  "documentType": "CV",
  "collectionMoment": "APPLICATION",
  "collectedFromSubject": true
}
```

---

# 39. Exemplo — coleta por sistema

```json
{
  "sourceType": "SYSTEM",
  "systemId": "uuid",
  "collectedFromSubject": true
}
```

---

# 40. Operações

```http
GET /processing-activities/:id/operations

POST /processing-activities/:id/operations

PATCH /processing-activities/:id/operations/:operationId

DELETE /processing-activities/:id/operations/:operationId
```

Exemplo:

```json
{
  "type": "EXTERNAL_TRANSFER",
  "supplierId": "uuid",
  "description": "Envio ao fornecedor de folha de pagamento."
}
```

---

# 41. Destinatários

```http
GET /processing-activities/:id/recipients

POST /processing-activities/:id/recipients

PATCH /processing-activities/:id/recipients/:recipientId

DELETE /processing-activities/:id/recipients/:recipientId
```

---

# 42. Retenção

Como a modelagem inicial considera 1:1:

```http
GET /processing-activities/:id/retention-policy

PUT /processing-activities/:id/retention-policy
```

Request:

```json
{
  "duration": 2,
  "unit": "YEARS",
  "startEvent": "END_OF_RECRUITMENT_PROCESS"
}
```

Se a cardinalidade mudar, o contrato deve ser revisto.

---

# 43. Medidas de segurança

Catálogo:

```http
GET /api/v1/security-measures
```

Associação:

```http
PUT /processing-activities/:id/security-measures
```

Exemplo:

```json
{
  "measures": [
    {
      "securityMeasureId": "uuid-1"
    },
    {
      "securityMeasureId": "uuid-2",
      "description": "Acesso limitado ao RH."
    }
  ]
}
```

---

# 44. Bases legais

```http
GET /processing-activities/:id/legal-bases

POST /processing-activities/:id/legal-bases

PATCH /processing-activities/:id/legal-bases/:legalBasisId

DELETE /processing-activities/:id/legal-bases/:legalBasisId
```

Exemplo:

```json
{
  "type": "LEGITIMATE_INTEREST",
  "justification": "..."
}
```

A cardinalidade final depende das questões abertas.

---

# 45. Transferências internacionais

```http
GET /processing-activities/:id/international-transfers

POST /processing-activities/:id/international-transfers

PATCH /processing-activities/:id/international-transfers/:transferId

DELETE /processing-activities/:id/international-transfers/:transferId
```

Exemplo:

```json
{
  "destinationCountry": "US",
  "supplierId": "uuid",
  "mechanism": "TO_BE_DEFINED"
}
```

Não utilizar `TO_BE_DEFINED` como valor real de produção caso o catálogo jurídico ainda não esteja definido.

---

# 46. Sistemas

Base:

```text
/api/v1/systems
```

Endpoints:

```http
GET    /systems
GET    /systems/:id
POST   /systems
PATCH  /systems/:id
```

Arquivamento, caso adotado:

```http
POST /systems/:id/archive
```

---

# 47. Cadastro rápido de sistema

Pode existir:

```http
POST /systems/quick
```

ou utilizar:

```http
POST /systems
```

com um contrato mínimo.

Preferência:

Evitar endpoints duplicados se o mesmo endpoint puder distinguir corretamente o contexto e validar os campos mínimos.

Exemplo:

```json
{
  "name": "Sistema de recrutamento"
}
```

Backend:

```text
mappingStatus = PENDING
```

---

# 48. Fornecedores

Base:

```text
/api/v1/suppliers
```

Endpoints:

```http
GET    /suppliers
GET    /suppliers/:id
POST   /suppliers
PATCH  /suppliers/:id
```

Possível:

```http
POST /suppliers/:id/archive
```

---

# 49. Business Units

```http
GET    /business-units
GET    /business-units/:id
POST   /business-units
PATCH  /business-units/:id
```

Operações administrativas devem exigir permissões correspondentes.

---

# 50. Usuários

```http
GET    /users
GET    /users/:id
POST   /users
PATCH  /users/:id
```

A criação concreta depende da estratégia de autenticação.

Não assumir que:

```text
POST /users
```

significa automaticamente criar senha local.

---

# 51. Usuário atual

Endpoint recomendado:

```http
GET /api/v1/me
```

Resposta:

```json
{
  "data": {
    "user": {
      "id": "uuid",
      "name": "Usuário"
    },
    "organization": {
      "id": "uuid",
      "name": "Empresa"
    },
    "roles": [
      "MANAGER"
    ],
    "permissions": [
      "processing_activity:create",
      "processing_activity:read",
      "processing_activity:update"
    ],
    "businessUnits": [
      {
        "id": "uuid",
        "name": "RH"
      }
    ]
  }
}
```

---

# 52. Compliance Gate

Consultar estado:

```http
GET /processing-activities/:id/compliance
```

Executar:

```http
POST /processing-activities/:id/compliance/run
```

---

# 53. Resultado do gate

Exemplo:

```json
{
  "data": {
    "status": "PENDING",
    "checks": [
      {
        "type": "LEGAL_BASIS",
        "status": "PASS"
      },
      {
        "type": "RETENTION",
        "status": "FAIL",
        "reasonCode": "RETENTION_POLICY_REQUIRED"
      },
      {
        "type": "SECURITY_MEASURES",
        "status": "PASS"
      },
      {
        "type": "INTERNATIONAL_TRANSFER",
        "status": "NOT_APPLICABLE"
      }
    ]
  }
}
```

---

# 54. Workflow — iniciar mapeamento

```http
POST /processing-activities/:id/start-mapping
```

Pré-condição:

```text
status = DRAFT
```

---

# 55. Workflow — submeter

```http
POST /processing-activities/:id/submit
```

O backend deve:

```text
validar estado
validar autorização
validar campos obrigatórios
determinar próximo estado
registrar auditoria
```

---

# 56. Workflow — solicitar correções

```http
POST /processing-activities/:id/request-changes
```

Request:

```json
{
  "reason": "A política de retenção precisa ser revisada."
}
```

A disponibilidade desse endpoint depende do workflow definitivo.

---

# 57. Workflow — ativar

```http
POST /processing-activities/:id/activate
```

Obrigatoriamente:

```text
complianceStatus = COMPLETE
```

e demais aprovações aplicáveis.

---

# 58. Workflow — iniciar revisão

```http
POST /processing-activities/:id/start-revision
```

Utilizado para atividade:

```text
ACTIVE
```

que sofrerá alteração relevante.

---

# 59. Workflow — arquivar

```http
POST /processing-activities/:id/archive
```

Possível request:

```json
{
  "reason": "Processo de tratamento encerrado."
}
```

A obrigatoriedade de `reason` ainda deve ser confirmada.

---

# 60. Histórico

Consultar versões:

```http
GET /processing-activities/:id/versions
```

Consultar versão:

```http
GET /processing-activities/:id/versions/:version
```

Exemplo:

```text
GET /processing-activities/uuid/versions/2
```

---

# 61. Auditoria

Endpoint:

```http
GET /api/v1/audit-logs
```

Deve possuir autorização restrita.

Filtros possíveis:

```text
entityType
entityId
actorId
action
from
to
```

Nunca expor metadata interna indiscriminadamente sem revisar o conteúdo retornado.

---

# 62. ROPA

Endpoint principal:

```http
GET /api/v1/ropa
```

Filtros iniciais:

```text
businessUnitId
status
complianceStatus
dataCategoryId
legalBasis
hasSensitiveData
hasMinorData
hasInternationalTransfer
search
```

---

# 63. ROPA — resposta

Exemplo conceitual:

```json
{
  "data": [
    {
      "activityId": "uuid",
      "activityName": "Cadastro de currículos",
      "businessUnit": {
        "id": "uuid",
        "name": "RH"
      },
      "purposes": [],
      "dataCategories": [],
      "subjects": [],
      "legalBases": [],
      "recipients": [],
      "retention": {},
      "internationalTransfers": [],
      "complianceStatus": "COMPLETE",
      "updatedAt": "2026-09-17T14:30:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

# 64. Exportação ROPA

Requisito funcional:

```text
PDF
Excel
```

Possíveis endpoints:

```http
POST /api/v1/ropa/exports
```

Request:

```json
{
  "format": "PDF",
  "filters": {
    "businessUnitId": "uuid"
  }
}
```

ou:

```json
{
  "format": "XLSX"
}
```

---

# 65. Exportações pequenas

Caso a geração seja rápida, a API pode responder diretamente com o arquivo.

---

# 66. Exportações pesadas

Caso a geração se torne custosa:

```text
POST export
     ↓
job assíncrono
     ↓
PROCESSING
     ↓
COMPLETED
     ↓
download
```

Não introduzir fila antecipadamente se não houver necessidade.

---

# 67. Dashboard

Base:

```text
/api/v1/dashboard
```

Possível endpoint:

```http
GET /api/v1/dashboard/summary
```

Resposta conceitual:

```json
{
  "data": {
    "totalActivities": 120,
    "compliantActivities": 92,
    "pendingActivities": 28,
    "compliancePercentage": 76.67,
    "sensitiveDataActivities": 31,
    "minorDataActivities": 4,
    "internationalTransferActivities": 12,
    "pendingSystems": 8,
    "pendingSuppliers": 3
  }
}
```

---

# 68. Dashboard por área

```http
GET /api/v1/dashboard/by-business-unit
```

Deve respeitar o escopo do usuário.

---

# 69. Uploads

Metadados de arquivo devem ser controlados pelo backend.

Fluxo possível:

```text
Frontend
   ↓
solicita upload
   ↓
Backend
   ↓
URL temporária
   ↓
Object Storage
   ↓
confirmação
```

Ou:

```text
Frontend
   ↓
Backend
   ↓
Object Storage
```

A estratégia deve ser definida antes da implementação definitiva.

---

# 70. Download

O backend deve verificar autorização antes de permitir acesso ao arquivo.

Conhecer:

```text
fileId
```

não concede permissão de download.

---

# 71. URL de object storage

Nunca retornar permanentemente uma URL pública para documentos privados.

Preferir:

```text
signed URL temporária
```

ou download mediado pelo backend.

---

# 72. Concorrência otimista

Caso optimistic locking seja adotado, o frontend deve enviar a versão conhecida.

Exemplo:

```json
{
  "name": "Nova descrição",
  "version": 7
}
```

Backend:

```text
versão atual = 8
versão recebida = 7
```

Resultado:

```http
409 Conflict
```

---

# 73. Alternativa com ETag

Outra possibilidade:

```http
ETag: "activity-version-7"
```

Atualização:

```http
If-Match: "activity-version-7"
```

Caso a versão tenha mudado:

```http
412 Precondition Failed
```

Não implementar simultaneamente múltiplas estratégias de concorrência.

---

# 74. Idempotência

Operações críticas podem utilizar idempotência quando houver risco de requisição duplicada.

Exemplo:

```text
geração de exportação
criação através de integração externa
```

Possível header:

```http
Idempotency-Key
```

Não exigir idempotência em todos os endpoints sem necessidade.

---

# 75. DELETE

Como existe histórico relevante, exclusão física deve ser evitada.

Para recursos de negócio, preferir operações semânticas:

```text
archive
disable
```

em vez de:

```text
DELETE
```

quando aplicável.

---

# 76. DELETE em sub-recursos

Pode ser aceitável para remover informação ainda em edição.

Exemplo:

```http
DELETE /processing-activities/:id/operations/:operationId
```

desde que:

```text
workflow permita
auditoria seja respeitada
versionamento seja respeitado
```

---

# 77. Campos somente leitura

Campos gerenciados pelo backend não devem ser livremente alteráveis.

Exemplos:

```text
id
organizationId
createdBy
createdAt
updatedAt
status
complianceStatus
currentVersion
```

`status` deve mudar por operações de workflow.

---

# 78. Mass Assignment

DTOs devem possuir campos explicitamente permitidos.

Evitar:

```ts
Object.assign(entity, request.body);
```

Preferir mapeamento explícito.

Isso evita alterações indevidas como:

```json
{
  "organizationId": "outra-organizacao",
  "status": "ACTIVE"
}
```

---

# 79. Campos desconhecidos

Recomendação:

Requests com campos desconhecidos devem ser rejeitados ou removidos de forma consistente.

Preferência para operações críticas:

```text
reject unknown fields
```

Isso ajuda a identificar erros de contrato.

---

# 80. OpenAPI

A API deve possuir documentação OpenAPI.

Sugestão:

```text
OpenAPI 3.x
```

Caso NestJS seja utilizado, pode ser gerada a partir dos contratos da aplicação.

---

# 81. OpenAPI não substitui documentação funcional

OpenAPI descreve:

```text
endpoint
request
response
schema
```

Os arquivos `.md` continuam sendo responsáveis por:

```text
regras
decisões
workflow
domínio
arquitetura
```

---

# 82. DTOs

Não utilizar entidades do ORM diretamente como contratos HTTP.

Separar:

```text
Database Model
Domain Model
Request DTO
Response DTO
```

quando necessário.

---

# 83. Dados internos

Responses não devem vazar:

```text
password hashes
internal storage keys
stack traces
tokens
secrets
internal authorization metadata
```

---

# 84. Erro 500

Em produção, evitar:

```json
{
  "error": "TypeError at line 92..."
}
```

Preferir:

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred."
  }
}
```

O detalhe técnico deve permanecer nos logs.

---

# 85. Rate limiting

Endpoints de autenticação e operações sensíveis devem poder possuir rate limiting.

Detalhes serão definidos em:

```text
09-SECURITY.md
```

---

# 86. CORS

CORS deve utilizar configuração explícita por ambiente.

Não utilizar indiscriminadamente:

```text
*
```

em produção quando credenciais estiverem envolvidas.

---

# 87. Health Check

Endpoint técnico:

```http
GET /health
```

Pode retornar:

```json
{
  "status": "ok"
}
```

Não deve revelar detalhes sensíveis de infraestrutura.

---

# 88. Readiness

Em infraestrutura que necessite:

```http
GET /health/ready
```

Pode validar dependências essenciais como banco.

Não expor credenciais ou detalhes internos.

---

# 89. N+1

Endpoints consolidados, especialmente:

```text
ROPA
Dashboard
ProcessingActivity detail
```

devem evitar consultas N+1.

O ORM escolhido não elimina automaticamente esse risco.

---

# 90. Tamanho de resposta

Endpoints de listagem não devem retornar todo o agregado completo quando não necessário.

Exemplo:

```text
GET /processing-activities
```

pode retornar um resumo.

Enquanto:

```text
GET /processing-activities/:id
```

retorna informações detalhadas.

---

# 91. API Client do frontend

O frontend deve possuir camada central de acesso à API.

Exemplo:

```text
services/
ou
features/*/api/
```

Evitar chamadas HTTP espalhadas diretamente pelos componentes.

---

# 92. Tipagem

Requests e responses devem possuir contratos TypeScript.

Idealmente, deve existir estratégia para reduzir divergência entre:

```text
OpenAPI
Backend DTO
Frontend Types
```

A estratégia de geração/compartilhamento de tipos ainda deve ser definida.

---

# 93. Códigos de erro iniciais

```text
VALIDATION_ERROR

UNAUTHENTICATED
FORBIDDEN
RESOURCE_NOT_FOUND

ORGANIZATION_ACCESS_DENIED
BUSINESS_UNIT_ACCESS_DENIED

PROCESSING_ACTIVITY_NOT_FOUND
PROCESSING_ACTIVITY_INVALID_STATE
INVALID_ACTIVITY_STATE_TRANSITION
ACTIVITY_NOT_COMPLIANT

LEGAL_BASIS_REQUIRED
LEGITIMATE_INTEREST_JUSTIFICATION_REQUIRED

RETENTION_POLICY_REQUIRED
SECURITY_MEASURE_REQUIRED

INTERNATIONAL_TRANSFER_COUNTRY_REQUIRED

RESOURCE_VERSION_CONFLICT

SYSTEM_NOT_FOUND
SUPPLIER_NOT_FOUND

FILE_NOT_FOUND
FILE_ACCESS_DENIED

INTERNAL_ERROR
```

---

# 94. Segurança de IDs

Mesmo utilizando UUID:

```text
UUID != autorização
```

Todo endpoint que recebe um ID deve verificar:

```text
tenant
permission
scope
resource
```

---

# 95. Exemplo completo de request

```http
PATCH /api/v1/processing-activities/7f46dc87-c21e-49f6-8bc2-4aee2d5cf941
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "name": "Recrutamento de candidatos",
  "description": "Tratamento relacionado aos processos seletivos."
}
```

Fluxo interno:

```text
Request
   ↓
Authentication
   ↓
Organization Context
   ↓
Resource Lookup
   ↓
Permission
   ↓
Scope
   ↓
Workflow
   ↓
Validation
   ↓
Business Rule
   ↓
Transaction
   ↓
Audit
   ↓
Response
```

---

# 96. Questões abertas

Registrar também em `12-OPEN-QUESTIONS.md`.

### SECQ-001 — Autenticação

Qual será a estratégia inicial?

```text
JWT
Session Cookie
OIDC
```

**Impacto:** alto.

---

### APIQ-020 — Tenant context

Caso usuários pertençam a múltiplas organizações, como a organização ativa será representada?

Possibilidades:

```text
session
token
header validado
rota
```

**Impacto:** alto.

---

### APIQ-021 — Wizard

Será utilizado:

```text
sub-recursos
```

ou:

```text
endpoint agregado por etapa
```

?

**Impacto:** médio.

---

### APIQ-004 — Concorrência

Utilizar:

```text
version field
ETag
```

ou nenhuma estratégia inicialmente?

**Impacto:** médio/alto.

---

### APIQ-007 — Upload

Utilizar:

```text
upload via backend
```

ou:

```text
signed URL para object storage
```

?

**Impacto:** médio.

---

### APIQ-006 — Exportação

Exportação ROPA será inicialmente:

```text
síncrona
```

ou:

```text
job assíncrono
```

?

**Impacto:** médio.

---

### APIQ-019 — Tipos

Frontend terá tipos gerados automaticamente pelo OpenAPI?

**Impacto:** baixo/médio.

---

### DQ-004 — Finalidades

Contrato será:

```text
purpose
```

ou:

```text
purposes[]
```

?

Depende da decisão de domínio.

**Impacto:** alto.

---

### DQ-002 — Bases legais

Contrato permitirá:

```text
legalBasis
```

ou:

```text
legalBases[]
```

?

Depende da decisão de domínio.

**Impacto:** alto.

---

### APIQ-010 — Compliance

A execução do gate será sempre explícita:

```text
POST /compliance/run
```

ou também será disparada automaticamente em determinadas alterações?

**Impacto:** médio.

---

# 97. Regras para agentes de IA

Ao criar um endpoint:

1. identificar o recurso;
2. identificar o caso de uso;
3. consultar autorização;
4. consultar workflow;
5. consultar regras de negócio;
6. definir DTO;
7. definir response;
8. definir erros esperados;
9. garantir isolamento multi-tenant;
10. adicionar testes;
11. atualizar OpenAPI.

---

# 98. Agentes não devem

Não criar:

```text
endpoints sem autorização
status alterável diretamente
organizationId confiado ao frontend
entidades ORM expostas diretamente
responses sem paginação para grandes coleções
erros contendo stack trace
IDs como mecanismo de autorização
regras jurídicas dentro de controllers
```

---

# 99. Regra sobre decisões abertas

Se o contrato depender de uma decisão ainda não resolvida:

```text
não consolidar silenciosamente a decisão na API
```

Exemplo:

Se ainda não sabemos se existem múltiplas bases legais, não criar uma constraint definitiva apenas porque o primeiro endpoint utilizou:

```json
{
  "legalBasis": {}
}
```

A decisão deve primeiro ser registrada.

---

# 100. Definition of Done de endpoint

Um endpoint é considerado concluído quando possuir:

```text
DTO/schema
+
autenticação quando aplicável
+
autorização
+
validação
+
regra de negócio
+
tratamento de erros
+
isolamento multi-tenant
+
teste
+
documentação OpenAPI
```

---

# 101. Próximo documento

A estrutura do React, componentes, páginas, formulários, estado, wizard e padrões de frontend serão definidos em:

`08-FRONTEND.md`