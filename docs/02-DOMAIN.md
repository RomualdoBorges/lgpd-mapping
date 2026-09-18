# Modelo de Domínio

> **Documento:** Modelo de domínio  
> **Status:** Draft  
> **Projeto:** LGPD Data Mapping Platform  
> **Documentos relacionados:** `00-PROJECT.md`, `01-ARCHITECTURE.md`

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

Seções de proposta legadas deste documento devem ser interpretadas sob estas decisões: não constituem aprovação de permissões de escrita, scopes adicionais, fornecedor, topologia do banco, RLS ou herança hierárquica. Questões decididas continuam referenciadas para rastreabilidade; pendências parciais estão identificadas no registro central.

---


---

## 1. Objetivo

Este documento define os principais conceitos, entidades, relacionamentos e invariantes do domínio da plataforma.

O objetivo é criar uma linguagem comum entre:

- produto;
- desenvolvimento;
- arquitetura;
- QA;
- agentes de IA.

Este documento descreve o **domínio conceitual**.

Detalhes físicos de tabelas, índices, constraints e migrations pertencem ao `03-DATABASE.md`.

---

## 2. Visão geral do domínio

O domínio principal pode ser representado da seguinte forma:

```text
Organization
│
├── BusinessUnit
│
├── User
│
├── System
│
├── Supplier
│
└── ProcessingActivity
      │
      ├── PersonalData
      ├── CollectionSource
      ├── ProcessingOperation
      ├── DataSubjectCategory
      ├── Recipient
      ├── InternationalTransfer
      ├── RetentionPolicy
      ├── SecurityMeasure
      ├── LegalBasis
      ├── ConsentDocument
      ├── ComplianceCheck
      └── ActivityVersion
```

O conceito central da aplicação é:

`ProcessingActivity`

Todas as informações do ROPA devem ser derivadas das atividades de tratamento e de seus relacionamentos.

---

# 3. Organization

## 3.1 Definição

Representa uma organização/empresa cliente da plataforma.

É a raiz de isolamento dos dados da aplicação.

Exemplos:

```text
Empresa ABC
Empresa XYZ
Cliente Jurídico 01
```

---

## 3.2 Atributos conceituais

```text
id
name
document?
status
createdAt
updatedAt
```

---

## 3.3 Status

```text
ACTIVE
INACTIVE
```

Estados adicionais somente devem ser adicionados quando houver necessidade de negócio documentada.

---

## 3.4 Relacionamentos

```text
Organization
│
├── BusinessUnits
├── Users
├── Systems
├── Suppliers
└── ProcessingActivities
```

---

## 3.5 Regras

### BR-ORG-001

Toda entidade pertencente a um cliente deve possuir associação direta ou inequivocamente derivável com uma `Organization`.

### BR-ORG-002

Dados de uma `Organization` não podem ser acessados por usuários de outra organização sem uma regra explícita de acesso administrativo da plataforma.

### BR-ORG-003

A identificação da organização nunca deve depender exclusivamente de um parâmetro enviado pelo frontend.

O backend deve validar o contexto do usuário autenticado.

---

# 4. BusinessUnit

## 4.1 Definição

Representa uma área ou unidade de negócio da organização.

Exemplos:

```text
RH
Marketing
TI
Vendas
Jurídico
Financeiro
```

---

## 4.2 Atributos conceituais

```text
id
organizationId
name
description?
status
createdAt
updatedAt
```

---

## 4.3 Relacionamentos

```text
Organization 1:N BusinessUnit

BusinessUnit 1:N ProcessingActivity
```

---

## 4.4 Regras

### BR-BU-001

Uma `BusinessUnit` pertence a exatamente uma `Organization`.

### BR-BU-002

O nome da área deve ser único dentro da organização quando a organização não permitir áreas duplicadas.

> A necessidade dessa constraint deve ser confirmada em `12-OPEN-QUESTIONS.md`.

### BR-BU-003

Uma área que possua histórico de atividades não deve ser fisicamente removida sem uma política explícita de exclusão.

---

# 5. User

## 5.1 Definição

Representa um usuário autenticável da plataforma.

---

## 5.2 Atributos conceituais

```text
id
name
email
status
createdAt
updatedAt
```

A relação entre usuário, organização, área e papel deve ser modelada separadamente quando necessário.

---

## 5.3 Papéis iniciais

O desenho funcional define:

```text
COLLABORATOR
MANAGER
DPO
```

A arquitetura também propõe:

```text
ADMIN
```

`ADMIN` ainda deve ser validado como requisito funcional.

---

## 5.4 Regras

### BR-USER-001

O papel do usuário não deve ser escolhido livremente durante o login.

### BR-USER-002

Permissões devem ser determinadas pelo backend.

### BR-USER-003

Um usuário somente pode operar dentro das organizações e áreas às quais possui acesso.

### BR-USER-004

As regras completas de autorização pertencem ao documento:

`04-AUTHORIZATION.md`

---

# 6. ProcessingActivity

## 6.1 Definição

Representa uma atividade de tratamento de dados pessoais.

É a principal entidade do domínio.

Exemplos:

```text
Cadastro de currículos para vaga aberta

Processamento da folha de pagamento

Cadastro de clientes

Envio de campanhas de marketing

Controle de acesso de colaboradores
```

---

## 6.2 Atributos conceituais

```text
id
organizationId
businessUnitId

name
description?

status
complianceStatus

createdBy
createdAt
updatedAt
```

Outras informações devem ser representadas por entidades ou objetos relacionados sempre que possuírem comportamento próprio.

---

## 6.3 Status

Estados iniciais propostos:

```text
DRAFT
MAPPING
PENDING_REVIEW
COMPLIANCE_PENDING
ACTIVE
UNDER_REVIEW
ARCHIVED
```

Os estados e transições serão detalhados em:

`06-WORKFLOWS.md`

---

## 6.4 ComplianceStatus

```text
PENDING
COMPLETE
BLOCKED
```

O status operacional da atividade e o status de conformidade são conceitos diferentes.

Exemplo:

```text
status = COMPLIANCE_PENDING

complianceStatus = PENDING
```

---

## 6.5 Relacionamentos

```text
ProcessingActivity
│
├── BusinessUnit
├── PersonalData
├── CollectionSources
├── ProcessingOperations
├── DataSubjectCategories
├── Recipients
├── InternationalTransfers
├── RetentionPolicy
├── SecurityMeasures
├── LegalBasis
├── ConsentDocuments
├── ComplianceChecks
└── ActivityVersions
```

---

## 6.6 Regras

### BR-PA-001

Toda atividade pertence a exatamente uma organização.

### BR-PA-002

Toda atividade deve possuir uma área responsável.

### BR-PA-003

Toda atividade deve possuir um nome identificável.

### BR-PA-004

Uma atividade não pode assumir estado `ACTIVE` enquanto:

```text
complianceStatus != COMPLETE
```

### BR-PA-005

Uma atividade pode permanecer incompleta como `DRAFT`.

### BR-PA-006

Alterações relevantes em uma atividade já concluída devem preservar histórico.

### BR-PA-007

Uma atividade arquivada não deve desaparecer do histórico da organização.

### BR-PA-008

As informações da atividade devem alimentar o ROPA automaticamente.

---

# 7. PersonalData

## 7.1 Definição

Representa o dado pessoal ou categoria de dado envolvido na atividade.

O desenho funcional trabalha inicialmente com categorias.

Exemplos definidos no documento:

```text
Identificação
Financeiro
Saúde
Biometria
Imagem/Voz
Dados de menores
Opinião política
Outra
```

---

## 7.2 Evolução recomendada

O domínio deve permitir futuramente diferenciar:

```text
Categoria
    ↓
Dado específico
```

Exemplo:

```text
Identificação
├── Nome
├── CPF
├── RG
├── E-mail
└── Telefone
```

Essa granularidade ainda precisa ser validada como requisito da V1.

---

## 7.3 Atributos conceituais

```text
id
organizationId?
category
name?
description?
sensitive
minorRelated
```

A estrutura definitiva será determinada no modelo de banco.

---

## 7.4 Regras

### BR-PD-001

Uma atividade pode envolver múltiplas categorias de dados.

### BR-PD-002

Categorias consideradas sensíveis devem ser identificáveis pelo sistema.

### BR-PD-003

Dados relacionados a crianças/adolescentes devem ser identificáveis pelo sistema.

### BR-PD-004

A presença de dados sensíveis ou de menores deve gerar sinalização para avaliação de necessidade de RIPD/DPIA.

---

# 8. CollectionSource

## 8.1 Definição

Representa a origem ou mecanismo utilizado para coletar o dado.

O fluxo funcional possui dois caminhos principais:

```text
DOCUMENT
NON_DOCUMENT
```

---

## 8.2 Documento

Quando a coleta ocorre por documento, devem ser registradas informações como:

```text
documentType
sampleDocument?
collectionMoment
```

Tipos iniciais:

```text
RG
CPF
CNH
PASSAPORTE
COMPROVANTE_RESIDENCIA
CV
CONTRATO
OUTRO
```

---

## 8.3 Não-documento

Quando não ocorre por documento, o dado pode ser coletado através de:

```text
site
CRM
ERP
planilha
formulário
sistema interno
ferramenta de terceiro
```

Deve ser possível indicar se a coleta ocorre diretamente do titular.

---

## 8.4 Regras

### BR-CS-001

A origem da coleta deve ser identificada durante o wizard.

### BR-CS-002

Quando a origem for documento, devem ser solicitadas as informações específicas do ramo de documento.

### BR-CS-003

Quando a origem não for documento, deve ser possível relacionar a coleta a um `System`.

### BR-CS-004

Quando o sistema ainda não existir, o fluxo poderá permitir cadastro rápido.

---

# 9. System

## 9.1 Definição

Representa uma ferramenta ou sistema utilizado no ciclo de tratamento.

Exemplos:

```text
Site institucional
CRM
ERP
Sistema de RH
Planilha
Sistema interno
Ferramenta SaaS
```

---

## 9.2 Atributos conceituais

```text
id
organizationId
name
description?
type?
supplierId?
status
mappingStatus
createdAt
updatedAt
```

---

## 9.3 MappingStatus

Sugestão:

```text
PENDING
MAPPED
```

---

## 9.4 Regras

### BR-SYS-001

Um sistema pertence a uma organização.

### BR-SYS-002

Um sistema pode participar de múltiplas atividades de tratamento.

### BR-SYS-003

Um sistema cadastrado durante o wizard pode iniciar como:

```text
mappingStatus = PENDING
```

### BR-SYS-004

O sistema deve permanecer identificável como pendente até que os requisitos de mapeamento aplicáveis sejam concluídos.

---

# 10. Supplier

## 10.1 Definição

Representa um fornecedor/terceiro envolvido no tratamento ou responsável por um sistema externo.

---

## 10.2 Atributos conceituais

```text
id
organizationId
name
document?
country?
contact?
status
mappingStatus
createdAt
updatedAt
```

---

## 10.3 Relacionamentos

Um fornecedor pode estar relacionado a:

```text
Systems
ProcessingOperations
Recipients
InternationalTransfers
```

---

## 10.4 Regras

### BR-SUP-001

Um fornecedor pertence ao contexto de uma organização.

### BR-SUP-002

Um fornecedor pode participar de múltiplas atividades.

### BR-SUP-003

Fornecedor cadastrado rapidamente durante o wizard deve poder iniciar como pendente de mapeamento.

---

# 11. ProcessingOperation

## 11.1 Definição

Representa uma operação realizada sobre dados dentro de uma atividade.

Operações definidas inicialmente:

```text
USE
UPDATE
INTERNAL_TRANSFER
EXTERNAL_TRANSFER
INTERNATIONAL_TRANSFER
DELETE
```

---

## 11.2 Atributos conceituais

```text
id
processingActivityId
type
businessUnitId?
systemId?
supplierId?
description?
```

---

## 11.3 Regras

### BR-OP-001

Uma atividade pode possuir múltiplas operações.

### BR-OP-002

Para cada operação deve ser possível identificar quem ou qual sistema executa a operação quando aplicável.

### BR-OP-003

Uma operação de transferência internacional deve gerar informações adicionais de transferência.

---

# 12. DataSubjectCategory

## 12.1 Definição

Representa a categoria dos titulares cujos dados são tratados.

Categorias iniciais:

```text
COLLABORATOR
CANDIDATE
CUSTOMER
SUPPLIER
MINOR
OTHER
```

---

## 12.2 Regras

### BR-DS-001

Uma atividade pode possuir múltiplas categorias de titulares.

### BR-DS-002

A categoria `MINOR` deve gerar sinalização específica.

---

# 13. Recipient

## 13.1 Definição

Representa quem recebe ou possui acesso aos dados tratados.

Tipos iniciais:

```text
INTERNAL
EXTERNAL_OPERATOR
PUBLIC_AUTHORITY
OTHER
```

---

## 13.2 Atributos conceituais

```text
id
processingActivityId
type
businessUnitId?
supplierId?
name?
description?
```

---

## 13.3 Regras

### BR-REC-001

Uma atividade pode possuir múltiplos destinatários.

### BR-REC-002

Destinatários internos devem permitir associação com uma área quando aplicável.

### BR-REC-003

Destinatários externos devem permitir associação com fornecedor quando aplicável.

---

# 14. InternationalTransfer

## 14.1 Definição

Representa transferência de dados pessoais para terceiro país ou organização internacional.

---

## 14.2 Atributos conceituais

```text
id
processingActivityId
destinationCountry
recipient?
mechanism?
status
notes?
```

---

## 14.3 Regras

### BR-IT-001

Toda transferência internacional deve possuir país de destino.

### BR-IT-002

A existência de transferência internacional deve acionar uma verificação específica de conformidade.

### BR-IT-003

O mecanismo aplicável à transferência deve poder ser registrado.

Exemplos citados no desenho funcional:

```text
adequação
SCC
consentimento específico
```

A modelagem jurídica definitiva desses mecanismos deve ser validada antes da implementação.

---

# 15. RetentionPolicy

## 15.1 Definição

Representa a política de retenção da atividade.

---

## 15.2 Atributos conceituais

```text
id
processingActivityId

duration
unit
startEvent
description?
```

Unidades possíveis:

```text
DAYS
MONTHS
YEARS
```

---

## 15.3 Exemplo

```text
duration = 2
unit = YEARS
startEvent = "Encerramento do processo seletivo"
```

---

## 15.4 Regras

### BR-RET-001

Uma atividade somente satisfaz o requisito mínimo de retenção quando possuir prazo e evento inicial definidos.

### BR-RET-002

A ausência de política de retenção impede a conclusão do gate mínimo.

---

# 16. SecurityMeasure

## 16.1 Definição

Representa uma medida técnica ou organizacional de segurança relacionada à atividade.

Tipos inicialmente previstos:

```text
ENCRYPTION
PSEUDONYMIZATION
ACCESS_CONTROL
BACKUP
OTHER
```

---

## 16.2 Atributos conceituais

```text
id
processingActivityId
type
description?
```

---

## 16.3 Regras

### BR-SEC-001

Uma atividade pode possuir múltiplas medidas de segurança.

### BR-SEC-002

O gate mínimo exige pelo menos uma medida de segurança definida.

> A regra de quantidade não significa que uma única medida seja juridicamente suficiente. Ela representa apenas a condição mínima funcional atualmente especificada para o gate.

---

# 17. LegalBasis

## 17.1 Definição

Representa a base legal utilizada para justificar o tratamento.

Bases inicialmente previstas no desenho funcional:

```text
CONTRACT
LEGAL_OBLIGATION
LEGITIMATE_INTEREST
REGULAR_EXERCISE_OF_RIGHTS
LIFE_PROTECTION
HEALTH_PROTECTION
PUBLIC_INTEREST
CREDIT_PROTECTION
CONSENT
```

---

## 17.2 Atributos conceituais

```text
id
processingActivityId
type
justification?
```

---

## 17.3 Regras

### BR-LB-001

Uma atividade deve possuir base legal antes de concluir o gate.

### BR-LB-002

Quando a base for:

```text
LEGITIMATE_INTEREST
```

a justificativa deve ser obrigatória.

### BR-LB-003

Quando a base exigir informações adicionais, essas regras devem ser representadas explicitamente e não inferidas pelo frontend.

### BR-LB-004

A relação exata entre atividade, finalidade, categoria de dado e base legal ainda deve ser validada.

> É necessário decidir se uma atividade possui uma única base legal ou se diferentes finalidades/dados dentro da mesma atividade podem possuir bases distintas.

---

# 18. ConsentDocument

## 18.1 Definição

Representa uma versão de termo de consentimento associada à atividade quando aplicável.

---

## 18.2 Atributos conceituais

```text
id
processingActivityId
version
effectiveDate
collectionMethod
documentId
createdAt
```

Meios iniciais:

```text
DIGITAL_FORM
SIGNED_PAPER
ELECTRONIC_ACCEPTANCE
OTHER
```

---

## 18.3 Regras

### BR-CONS-001

Versões anteriores de termos não devem ser sobrescritas.

### BR-CONS-002

Deve ser possível identificar qual versão estava vigente em determinado período.

### BR-CONS-003

A V1 não deve assumir que a plataforma armazenará consentimentos individuais dos titulares.

Essa decisão permanece fora do escopo inicial até validação explícita.

---

# 19. ComplianceCheck

## 19.1 Definição

Representa o resultado de uma verificação executada pelo Compliance Gate.

---

## 19.2 Checks mínimos

```text
LEGAL_BASIS
RETENTION
SECURITY_MEASURES
```

Checks adicionais podem existir:

```text
INTERNATIONAL_TRANSFER
SENSITIVE_DATA
MINOR_DATA
```

---

## 19.3 Status do check

```text
PASS
FAIL
REVIEW_REQUIRED
NOT_APPLICABLE
```

---

## 19.4 Atributos conceituais

```text
id
processingActivityId
type
status
reason?
checkedAt
```

---

## 19.5 Regras

### BR-CC-001

O resultado do gate deve ser derivado dos checks aplicáveis.

### BR-CC-002

Checks devem possuir códigos estáveis.

### BR-CC-003

O frontend não deve decidir sozinho se uma atividade está conforme.

### BR-CC-004

Novos checks devem poder ser adicionados sem alterar o significado dos checks existentes.

---

# 20. ActivityVersion

## 20.1 Definição

Representa uma versão histórica de uma atividade de tratamento.

---

## 20.2 Objetivo

Permitir reconstruir como uma atividade estava definida em determinado momento.

Exemplo:

```text
ProcessingActivity
│
├── v1 — criação
├── v2 — nova finalidade
└── v3 — novo destinatário
```

---

## 20.3 Informações mínimas

```text
id
processingActivityId
version
createdBy
createdAt
changeReason?
snapshot/differences
```

A estratégia de armazenamento será definida em:

`03-DATABASE.md`

e:

`10-AUDIT.md`

---

## 20.4 Regras

### BR-VER-001

Alterações consideradas relevantes devem gerar nova versão.

### BR-VER-002

Uma nova versão não deve apagar versões anteriores.

### BR-VER-003

Deve ser possível identificar quem realizou a alteração.

### BR-VER-004

Ainda precisa ser definido exatamente quais alterações são consideradas relevantes.

---

# 21. AuditLog

## 21.1 Definição

Representa o registro técnico de uma ação relevante realizada na plataforma.

`AuditLog` não é equivalente a `ActivityVersion`.

### ActivityVersion

Responde:

> Como a atividade estava definida?

### AuditLog

Responde:

> Quem fez o quê e quando?

---

## 21.2 Estrutura conceitual

```text
id
organizationId
actorId
action
entityType
entityId
timestamp
metadata
```

---

## 21.3 Exemplos

```text
ACTIVITY_CREATED

ACTIVITY_UPDATED

ACTIVITY_SUBMITTED

COMPLIANCE_GATE_EXECUTED

ACTIVITY_ACTIVATED

SUPPLIER_CREATED

SYSTEM_CREATED
```

---

# 22. ROPA

## 22.1 Definição

O ROPA é uma visão consolidada das atividades de tratamento.

Não deve ser tratado inicialmente como entidade independente de cadastro.

---

## 22.2 Origem das informações

```text
ROPA
│
├── BusinessUnit
├── ProcessingActivity
├── Purpose
├── PersonalData
├── DataSubjectCategory
├── Recipient
├── LegalBasis
├── RetentionPolicy
├── InternationalTransfer
├── SecurityMeasure
├── ComplianceStatus
└── LastUpdate
```

---

## 22.3 Regras

### BR-ROPA-001

O usuário não deve precisar cadastrar manualmente no ROPA informações já existentes na atividade.

### BR-ROPA-002

Alterações nas atividades devem refletir na visão atual do ROPA.

### BR-ROPA-003

O histórico das atividades deve permanecer disponível mesmo que a visão atual do ROPA utilize apenas a versão vigente.

### BR-ROPA-004

Atividades com pendências devem ser identificáveis na visão consolidada.

---

# 23. Relações principais

Modelo conceitual simplificado:

```text
Organization
│
├── BusinessUnit
│      │
│      └── ProcessingActivity
│
├── User
│
├── System
│
└── Supplier


ProcessingActivity
│
├── PersonalData                  N:N
├── CollectionSource             1:N
├── ProcessingOperation          1:N
├── DataSubjectCategory          N:N
├── Recipient                    1:N
├── InternationalTransfer        1:N
├── RetentionPolicy              1:1 ?
├── SecurityMeasure              N:N ou 1:N
├── LegalBasis                   1:1 ou 1:N ?
├── ConsentDocument              1:N
├── ComplianceCheck              1:N
└── ActivityVersion              1:N
```

Os relacionamentos marcados com `?` ainda exigem decisão de modelagem.

---

# 24. Agregado principal

`ProcessingActivity` deve ser tratada conceitualmente como o principal agregado do domínio de mapeamento.

Ela coordena informações necessárias para determinar:

```text
o que é tratado
por quê
de quem
de onde veio
onde é utilizado
quem recebe
por quanto tempo
com qual base legal
com quais medidas de segurança
com quais transferências
e qual seu estado de conformidade
```

Isso não significa que todas as entidades precisam ser carregadas ou persistidas em uma única operação.

A implementação deve equilibrar consistência e performance.

---

# 25. Fluxo conceitual dos dados

A arquitetura deve permitir evoluir para uma representação semelhante a:

```text
Titular
   │
   ▼
Coleta
   │
   ▼
Dado Pessoal
   │
   ▼
Sistema
   │
   ▼
Operação
   │
   ├──────────► Área interna
   │
   ├──────────► Fornecedor
   │
   └──────────► Transferência internacional
   │
   ▼
Retenção
   │
   ▼
Eliminação
```

A V1 não precisa necessariamente possuir uma visualização gráfica desse fluxo.

O modelo de domínio, porém, não deve impedir essa evolução.

---

# 26. Invariantes principais

As seguintes condições devem permanecer verdadeiras independentemente da interface utilizada.

### INV-001

Toda atividade pertence a uma organização.

### INV-002

Toda atividade pertence a uma área responsável.

### INV-003

Uma atividade `ACTIVE` deve possuir:

```text
complianceStatus = COMPLETE
```

### INV-004

Uma atividade não pode satisfazer o gate mínimo sem base legal.

### INV-005

Uma atividade não pode satisfazer o gate mínimo sem política de retenção definida.

### INV-006

Uma atividade não pode satisfazer o gate mínimo sem medidas de segurança definidas.

### INV-007

Transferência internacional exige identificação do destino.

### INV-008

Legítimo interesse exige justificativa.

### INV-009

Alterações relevantes devem preservar histórico.

### INV-010

Dados de uma organização não podem vazar para outra organização.

### INV-011

O ROPA deve ser derivado das atividades cadastradas.

---

# 27. Termos que não devem ser confundidos

## Organization ≠ BusinessUnit

```text
Organization
└── BusinessUnit
```

A organização é o cliente.

A área é uma subdivisão desse cliente.

---

## ProcessingActivity ≠ ProcessingOperation

Exemplo:

```text
ProcessingActivity:
"Recrutamento de candidatos"

ProcessingOperations:
- coleta
- uso
- transferência
- eliminação
```

---

## ActivityStatus ≠ ComplianceStatus

```text
ActivityStatus
```

representa onde a atividade está no workflow.

```text
ComplianceStatus
```

representa o resultado de conformidade.

---

## ActivityVersion ≠ AuditLog

`ActivityVersion` preserva o estado funcional.

`AuditLog` registra ações.

---

## System ≠ Supplier

Exemplo:

```text
Supplier:
Microsoft

System:
Microsoft 365
```

ou:

```text
Supplier:
Fornecedor XYZ

System:
Plataforma de recrutamento XYZ
```

---

# 28. Decisões de domínio pendentes

As seguintes questões devem ser registradas e resolvidas em `12-OPEN-QUESTIONS.md`.

### DQ-001 — Granularidade dos dados

A V1 trabalhará somente com categorias?

```text
Financeiro
Saúde
Identificação
```

Ou também com dados específicos?

```text
CPF
Nome
E-mail
Conta bancária
```

**Impacto:** alto.

---

### DQ-002 — Base legal

Uma atividade possui exatamente uma base legal?

Ou diferentes finalidades/dados podem possuir bases legais diferentes?

**Impacto:** alto.

---

### DQ-004 — Finalidades

Uma atividade possui apenas uma finalidade textual ou múltiplas finalidades estruturadas?

**Impacto:** alto.

---

### DQ-005 — Retenção

Existe uma política de retenção por atividade ou diferentes dados podem possuir prazos diferentes?

**Impacto:** alto.

---

### DQ-006 — Medidas de segurança

Medidas pertencem:

```text
à atividade
```

ou podem ser reutilizadas como catálogo da organização?

**Impacto:** médio.

---

### DQ-011 — Consentimento

Serão armazenados apenas termos e versões ou também consentimentos individuais dos titulares?

**Decisão da V1 — DEC-026 (DQ-011 respondida):**

Somente termos e versões.

**Impacto:** muito alto caso alterado.

---

### DQ-008 — Hierarquia organizacional

O modelo será:

```text
Organization
└── BusinessUnit
```

ou precisará suportar:

```text
Organization
└── Unit
    └── Department
        └── BusinessUnit
```

**Impacto:** médio/alto.

---

### DQ-009 / PAQ-003 — Responsáveis

Uma atividade possui:

```text
uma área responsável
```

ou:

```text
uma área responsável
+
um usuário responsável
+
áreas participantes
```

**Impacto:** médio.

---

### AUTHQ-002 — Aprovação

Quem aprova a atividade?

```text
Gestor
DPO
Gestor + DPO
```

**Impacto:** alto.

---

### DQ-010 — Alteração relevante

Quais mudanças devem gerar `ActivityVersion`?

Exemplos:

```text
finalidade
base legal
destinatário
retenção
dados tratados
transferência internacional
```

**Impacto:** alto.

---

# 29. Orientações para agentes de IA

Antes de implementar uma entidade ou relacionamento:

1. verificar este documento;
2. verificar `03-DATABASE.md`;
3. verificar `05-BUSINESS-RULES.md`;
4. verificar `06-WORKFLOWS.md`;
5. verificar `12-OPEN-QUESTIONS.md`.

Quando existir uma questão marcada como não resolvida, não assumir silenciosamente a solução.

---

## 30. Regra contra modelagem prematura

Agentes de IA não devem transformar automaticamente cada conceito deste documento em uma tabela.

Este documento descreve o **domínio**.

A decisão de persistência pode utilizar:

- entidade;
- tabela;
- enum;
- value object;
- relação;
- tabela associativa;
- JSON estruturado;

conforme definido no `03-DATABASE.md`.

---

# 31. Próximo documento

O modelo físico e lógico de persistência dessas entidades será especificado em:

`03-DATABASE.md`