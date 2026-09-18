# Feature — Fornecedores

> **Feature:** Suppliers  
> **Status:** Draft  
> **Módulo:** Data Mapping / Catalog  
> **Documentos relacionados:** `00-PROJECT.md`, `02-DOMAIN.md`, `03-DATABASE.md`, `04-AUTHORIZATION.md`, `05-BUSINESS-RULES.md`, `06-WORKFLOWS.md`, `07-API.md`, `08-FRONTEND.md`, `09-SECURITY.md`, `10-AUDIT.md`, `12-OPEN-QUESTIONS.md`, `features/ORGANIZATIONS.md`, `features/PROCESSING-ACTIVITY.md`, `features/MAPPING-WIZARD.md`, `features/COMPLIANCE-GATE.md`, `features/ROPA.md`, `features/SYSTEMS.md`

> **Controle V1 (DEC-031):** pendências são registradas e acompanhadas internamente. A plataforma não bloqueia tecnicamente produção externa; SYSQ-007 e SUPQ-006 continuam abertas sobre os efeitos internos.

---

# 1. Objetivo

A feature Suppliers mantém o catálogo de fornecedores externos que participam, direta ou indiretamente, do tratamento de dados pessoais da organização.

Exemplos:

```text
empresa de folha de pagamento

empresa de recrutamento

provedor SaaS

empresa de benefícios

empresa de armazenamento

consultoria

operador externo
```

O objetivo é permitir identificar:

```text
quem é o fornecedor

em quais atividades participa

quais sistemas estão relacionados

se recebe dados pessoais

se participa de transferências

se seu mapeamento está completo
```

---

# 2. Conceito

`Supplier` representa uma organização externa relacionada ao tratamento.

Estrutura conceitual:

```text
Organization
    ↓
Supplier
    ├── Systems
    ├── Processing Activities
    ├── Recipients
    └── International Transfers
```

---

# 3. Supplier como entidade

Evitar armazenar somente:

```text
supplierName = "Empresa X"
```

dentro de cada atividade.

Preferir:

```text
Supplier
id = UUID
name = Empresa X
```

reutilizável por múltiplas atividades.

---

# 4. Benefícios

A entidade permite:

```text
padronização

reutilização

busca

identificação de dependências

controle de pendências

dashboard

auditoria

integrações futuras
```

---

# 5. Tenant

Todo Supplier cadastrado pertence a uma:

```text
Organization
```

Regra:

```text
Supplier.organizationId
=
AuthenticatedContext.organizationId
```

---

# 6. Significado

Isso não significa que o fornecedor pertence juridicamente à organização.

Significa apenas que:

```text
o cadastro do fornecedor pertence ao tenant
```

---

# 7. Isolamento

Supplier da:

```text
Organization A
```

não pode ser utilizado por Activity da:

```text
Organization B
```

---

# 8. Mesmo fornecedor em tenants diferentes

É válido:

```text
Organization A
└── Fornecedor X
```

e:

```text
Organization B
└── Fornecedor X
```

serem registros independentes.

---

# 9. Campos principais

Estrutura conceitual inicial:

```text
id

organizationId

name

description?

mappingStatus

status

createdAt

updatedAt
```

Campos adicionais dependem das decisões funcionais.

---

# 10. Name

Obrigatório.

Exemplo:

```text
Empresa de Processamento de Folha
```

---

# 11. Razão social

Pode existir:

```text
legalName
```

caso o produto precise diferenciar:

```text
nome comercial

razão social
```

Não é requisito confirmado.

---

# 12. Documento empresarial

Pode surgir necessidade de:

```text
CNPJ
```

ou identificador equivalente.

O desenho funcional original não define esse campo.

Não torná-lo obrigatório sem decisão.

---

# 13. Nova questão — SUPQ-001

**Status:** OPEN  
**Priority:** MEDIUM

Supplier precisa armazenar:

```text
legalName

tradeName

CNPJ/document identifier
```

na V1?

---

# 14. Description

Pode existir:

```text
description
```

Exemplo:

```text
Fornecedor responsável pelo processamento
terceirizado da folha de pagamento.
```

Obrigatoriedade permanece aberta.

---

# 15. Status

Separar:

```text
status
```

de:

```text
mappingStatus
```

---

# 16. Status cadastral

Valores sugeridos:

```text
ACTIVE

INACTIVE
```

---

# 17. Mapping Status

Valores inicialmente propostos:

```text
PENDING

MAPPED
```

---

# 18. Exemplo

```text
status = ACTIVE

mappingStatus = PENDING
```

significa:

```text
fornecedor está disponível no catálogo

mas seu mapeamento ainda possui pendências
```

---

# 19. Regra global

O desenho funcional estabelece que:

```text
novo fornecedor
```

permanece pendente até que seu metadata/mapeamento necessário seja concluído.

---

# 20. Quick Create

Durante o Mapping Wizard:

```text
Selecionar fornecedor
↓
Fornecedor não encontrado
↓
Adicionar fornecedor
```

---

# 21. Objetivo

Quick Create permite continuar o mapeamento sem obrigar o usuário a sair do fluxo.

---

# 22. Cadastro mínimo

Pode inicialmente solicitar:

```text
name
```

---

# 23. Resultado

Supplier criado rapidamente pode nascer:

```text
status = ACTIVE

mappingStatus = PENDING
```

---

# 24. Regra

Quick Create não significa:

```text
Supplier totalmente avaliado
```

ou:

```text
Supplier aprovado juridicamente
```

---

# 25. Critérios para MAPPED

Precisam ser definidos.

---

# 26. Nova questão — SUPQ-002

**Status:** OPEN  
**Priority:** CRITICAL

Quais informações são necessárias para:

```text
Supplier.mappingStatus = MAPPED
```

?

---

# 27. Não inventar due diligence

Não adicionar automaticamente campos como:

```text
certificação ISO

SOC 2

score de risco

DPA assinado

data de auditoria

questionário de segurança

incidentes

rating financeiro
```

Esses conceitos podem ser úteis futuramente, mas não fazem parte automaticamente da V1.

---

# 28. Papel no tratamento

Fornecedor pode exercer diferentes papéis.

Exemplos conceituais:

```text
operador

destinatário

provedor de sistema

prestador de serviço
```

---

# 29. Controller / Operator

O documento funcional prevê identificação de:

```text
controlador

operador
```

A representação exata do Supplier como:

```text
OPERATOR
```

precisa ser definida.

---

# 30. Nova questão — SUPQ-003

**Status:** OPEN  
**Priority:** CRITICAL

Supplier possuirá campo explícito:

```text
privacyRole
```

como:

```text
OPERATOR

CONTROLLER

JOINT_CONTROLLER

OTHER
```

?

Ou o papel será contextual por Activity?

---

# 31. Recomendação conceitual

Evitar assumir que um fornecedor possui sempre o mesmo papel.

Exemplo:

```text
Supplier X
```

pode participar de contextos diferentes.

Se o papel depender da atividade, deve ser modelado na relação.

---

# 32. Relação com ProcessingActivity

Uma atividade pode envolver:

```text
0..N Suppliers
```

---

# 33. Exemplo

```text
Folha de pagamento
├── Operador de folha
└── Provedor de benefícios
```

---

# 34. Relação contextual

Supplier pode aparecer através de:

```text
Recipient

ProcessingOperation

System
```

---

# 35. Evitar duplicação inconsistente

Não criar:

```text
activity_suppliers
```

apenas por conveniência se a mesma relação já estiver corretamente representada por entidades contextuais.

---

# 36. Nova questão — SUPQ-004

**Status:** OPEN  
**Priority:** CRITICAL

Como representar:

```text
ProcessingActivity ↔ Supplier
```

?

Possibilidades:

```text
somente através de Recipient/System/Operation

relação direta

ambas com semânticas diferentes
```

---

# 37. Recipient

Fornecedor pode ser destinatário externo.

Exemplo:

```text
ProcessingActivity
↓
Recipient
type = OPERATOR
↓
Supplier
```

---

# 38. Benefício

Isso preserva contexto:

```text
quem recebe os dados
```

em vez de apenas:

```text
qual fornecedor está relacionado
```

---

# 39. Transferência externa

Operação:

```text
EXTERNAL_TRANSFER
```

pode apontar para Recipient relacionado a Supplier.

---

# 40. Transferência internacional

Fornecedor pode estar envolvido em:

```text
INTERNATIONAL_TRANSFER
```

---

# 41. Não inferir internacionalização

Supplier estrangeiro não significa automaticamente:

```text
International Transfer = true
```

A transferência deve ser registrada no fluxo da atividade.

---

# 42. País do Supplier

Pode ser útil cadastrar:

```text
country
```

mas isso não substitui:

```text
InternationalTransfer.destinationCountry
```

---

# 43. Nova questão — SUPQ-005

**Status:** OPEN  
**Priority:** MEDIUM

Supplier terá:

```text
country
```

no cadastro?

---

# 44. Múltiplos países

Não tentar representar infraestrutura multinacional inteira através de um único:

```text
Supplier.country
```

O país cadastral e destino da transferência são conceitos diferentes.

---

# 45. Relação com System

Um Supplier pode fornecer um ou mais Systems.

Exemplo:

```text
Supplier
└── Sistema SaaS
```

---

# 46. Cardinalidade

Depende de:

```text
SYSQ-004
```

Possibilidades:

```text
Supplier 1:N Systems
```

ou estruturas mais flexíveis.

---

# 47. Exemplo

```text
Fornecedor X
├── Sistema A
├── Sistema B
└── Sistema C
```

---

# 48. Sistema interno

System pode não possuir Supplier.

---

# 49. Supplier sem System

Também é válido.

Exemplo:

```text
consultoria que recebe planilha
```

sem plataforma própria cadastrada.

---

# 50. Supplier pendente

Activity pode temporariamente utilizar Supplier:

```text
PENDING
```

durante o mapeamento.

---

# 51. Impacto da pendência

Precisamos definir se Supplier PENDING:

```text
bloqueia Submit

bloqueia Gate

bloqueia ACTIVE

gera REVIEW_REQUIRED

gera apenas alerta
```

---

# 52. Nova questão — SUPQ-006

**Status:** OPEN  
**Priority:** CRITICAL

Qual impacto de:

```text
Supplier.mappingStatus = PENDING
```

sobre ProcessingActivity?

Essa decisão deve ser consistente com:

```text
SYSQ-007
```

---

# 53. Regra de consistência

Idealmente Systems e Suppliers devem possuir política semelhante de pendência quando fizer sentido.

Evitar:

```text
System PENDING bloqueia ACTIVE
```

enquanto:

```text
Supplier PENDING não faz nada
```

sem justificativa funcional.

---

# 54. Compliance Gate

Não criar automaticamente:

```text
SUPPLIER_MAPPING
```

como check do Gate antes de decisão explícita.

---

# 55. Dashboard

O desenho funcional prevê:

```text
novo fornecedor não mapeado
```

como pendência.

---

# 56. Métricas possíveis

```text
Fornecedores cadastrados

Fornecedores pendentes

Fornecedores mapeados
```

---

# 57. Pendência antiga

Pode ser destacada no Dashboard.

---

# 58. Política central de antiguidade — DASHQ-008

A antiguidade de fornecedores é definida em DASHQ-008, incluindo a possibilidade de limiares diferentes por recurso. O ID anterior é alias no registro central, sem decisão independente (DEC-033).

Nenhum prazo foi definido. DASHQ-007 determina o início da contagem. Disparo de alertas/notificações permanece em WFQ-013.

---

# 59. Tela

Rota:

```text
/suppliers
```

---

# 60. Listagem

Pode apresentar:

```text
Fornecedor

Status

Mapeamento

Papel?

País?

Última atualização
```

Campos condicionais dependem das decisões abertas.

---

# 61. Exemplo

```text
Fornecedores

[Buscar] [Mapeamento]               [+ Novo fornecedor]

Fornecedor                    Mapeamento
-------------------------------------------------
Operador de Folha             Mapeado
Provedor SaaS                 Pendente
Consultoria                   Mapeado
```

---

# 62. Filtros

Possíveis:

```text
status

mappingStatus

country

privacyRole

search
```

Somente quando campos correspondentes existirem.

---

# 63. Busca

Inicialmente:

```text
name
```

---

# 64. Paginação

Server-side quando necessário.

---

# 65. Cadastro

Tela:

```text
Novo fornecedor
```

Campos mínimos:

```text
name
```

Demais campos dependem das decisões.

---

# 66. Detalhe

Rota:

```text
/suppliers/:id
```

Pode apresentar:

```text
Informações

Sistemas

Atividades relacionadas

Pendências

Histórico
```

---

# 67. Atividades relacionadas

Exemplo:

```text
Folha de pagamento

Gestão de benefícios

Recrutamento
```

---

# 68. Contexto

Idealmente mostrar como Supplier participa.

Exemplo:

```text
Atividade            Participação

Folha                Operador / Destinatário

Benefícios           Destinatário

Recrutamento         Sistema
```

---

# 69. Impact Analysis

Essa estrutura permite responder:

```text
Quais atividades seriam impactadas
se esse fornecedor mudasse?
```

---

# 70. Evolução futura

Pode permitir análise como:

```text
Fornecedor X
↓
Systems
↓
Activities
↓
Personal Data
↓
Data Subjects
```

Não é obrigatório construir visualização completa na V1.

---

# 71. API — listagem

```http
GET /api/v1/suppliers
```

---

# 72. API — criação

```http
POST /api/v1/suppliers
```

Request mínimo:

```json
{
  "name": "Empresa de Processamento de Folha"
}
```

---

# 73. Organization

Backend deriva:

```text
organizationId
```

do contexto autenticado.

---

# 74. Response

Exemplo:

```json
{
  "data": {
    "id": "uuid",
    "name": "Empresa de Processamento de Folha",
    "status": "ACTIVE",
    "mappingStatus": "PENDING"
  }
}
```

---

# 75. Detalhe

```http
GET /api/v1/suppliers/:id
```

---

# 76. Atualização

```http
PATCH /api/v1/suppliers/:id
```

Somente campos editáveis.

---

# 77. MappingStatus

Não permitir necessariamente alteração arbitrária:

```json
{
  "mappingStatus": "MAPPED"
}
```

---

# 78. Complete Mapping

Preferir operação semântica se houver validações:

```http
POST /api/v1/suppliers/:id/complete-mapping
```

---

# 79. Processo

```text
Load Supplier
↓
Tenant
↓
Permission
↓
Validate Required Metadata
↓
mappingStatus = MAPPED
↓
Audit
```

---

# 80. Inativação

Possível:

```http
POST /api/v1/suppliers/:id/deactivate
```

---

# 81. Reativação

Possível:

```http
POST /api/v1/suppliers/:id/reactivate
```

se aprovada.

---

# 82. Delete

Evitar exclusão física de Supplier utilizado por Activity/System histórico.

---

# 83. Nunca utilizado

Fornecedor criado por engano e nunca utilizado pode eventualmente ser removido fisicamente.

---

# 84. Nova questão — SUPQ-008

**Status:** OPEN  
**Priority:** LOW

Supplier nunca utilizado pode ser:

```text
deletado
```

ou sempre:

```text
inativado
```

?

---

# 85. Inativação

Supplier INACTIVE não deve aparecer normalmente em novas associações.

---

# 86. Histórico

Activities existentes continuam mostrando Supplier inativo.

---

# 87. Não remover associação

Inativar fornecedor não deve apagar:

```text
Recipients

Operations

Systems

ActivityVersions
```

---

# 88. Supplier inativo ainda utilizado

Precisamos definir comportamento quando Supplier é inativado mas existe Activity ACTIVE que ainda o referencia.

---

# 89. Nova questão — SUPQ-009

**Status:** OPEN  
**Priority:** HIGH

O que acontece quando:

```text
Supplier → INACTIVE
```

mas ainda participa de:

```text
ProcessingActivity ACTIVE
```

?

Possibilidades:

```text
permitir com warning

forçar revisão das Activities

bloquear inativação

gerar pendências
```

---

# 90. Duplicidade

Precisamos definir unicidade do nome.

---

# 91. Nova questão — SUPQ-010

**Status:** OPEN  
**Priority:** MEDIUM

Supplier deve possuir nome único dentro da Organization?

---

# 92. CNPJ e duplicidade

Se CNPJ for adotado, pode ser identificador mais forte que nome.

Mas:

```text
SUPQ-001
```

precisa ser resolvida primeiro.

---

# 93. Quick Create

Antes de criar novo Supplier:

```text
buscar existentes
```

reduz duplicidade.

---

# 94. Backend

Mesmo assim, backend deve garantir regras de unicidade aprovadas.

---

# 95. Authorization

Permissions conceituais:

```text
supplier:create

supplier:read

supplier:update

supplier:complete_mapping

supplier:deactivate
```

---

# 96. Quick Create Permission

Editar Activity não significa automaticamente poder criar Supplier.

---

# 97. Nova questão — SUPQ-011

**Status:** OPEN  
**Priority:** CRITICAL

Quem pode:

```text
Quick Create Supplier
```

?

Deve ser consistente com política de Systems.

---

# 98. Tenant isolation

Toda consulta:

```text
Supplier
```

deve respeitar:

```text
organizationId
```

---

# 99. Cross-tenant read

Supplier da Organization B não pode ser exposto ao usuário da Organization A.

---

# 100. Cross-tenant Activity

```text
Activity A
↓
Supplier B
```

deve ser rejeitado.

---

# 101. Cross-tenant System

```text
System A
↓
Supplier B
```

também deve ser rejeitado.

---

# 102. Recipient tenant

Quando Recipient referencia Supplier:

```text
Recipient.organizationId
=
Supplier.organizationId
```

direta ou indiretamente.

---

# 103. International Transfer

Se transferência referencia Supplier:

```text
todos os recursos precisam pertencer ao mesmo tenant
```

---

# 104. Audit Events

Possíveis:

```text
SUPPLIER_CREATED

SUPPLIER_UPDATED

SUPPLIER_MAPPING_COMPLETED

SUPPLIER_DEACTIVATED

SUPPLIER_REACTIVATED
```

---

# 105. Quick Create

Continua gerando:

```text
SUPPLIER_CREATED
```

---

# 106. Metadata

Pode registrar:

```json
{
  "supplierId": "uuid",
  "source": "MAPPING_WIZARD"
}
```

se útil.

---

# 107. Mapping completed

Evento:

```text
SUPPLIER_MAPPING_COMPLETED
```

---

# 108. Status transition

Metadata pode registrar:

```text
PENDING → MAPPED
```

---

# 109. Versionamento

Não assumir automaticamente:

```text
SupplierVersion
```

---

# 110. Questão

Mudanças de Supplier podem impactar Activity histórica.

---

# 111. Nova questão — SUPQ-012

**Status:** OPEN  
**Priority:** MEDIUM

Supplier precisa de:

```text
versionamento próprio
```

ou snapshots de Activity + AuditLog são suficientes?

---

# 112. Nome alterado

Exemplo:

```text
Empresa XPTO Ltda.
↓
Nova Razão Social Ltda.
```

ROPA histórico pode precisar preservar nome anterior.

---

# 113. Snapshot

ActivityVersion pode preservar metadata necessária do Supplier.

Essa estratégia precisa ser alinhada com:

```text
AUDQ

ROPAQ
```

---

# 114. ROPA

ROPA pode apresentar Suppliers relacionados quando aplicável.

---

# 115. ROPA atual

Deve utilizar informações consistentes da versão vigente.

---

# 116. ROPA histórico

Não deve perder contexto antigo devido à edição do cadastro atual do Supplier.

---

# 117. Dashboard

Pode apresentar:

```text
Fornecedores pendentes
```

---

# 118. Link

Exemplo:

```text
5 fornecedores pendentes
↓
/suppliers?mappingStatus=PENDING
```

---

# 119. Activity Warning

Se Activity utiliza Supplier PENDING:

```text
Fornecedor com mapeamento pendente
```

pode ser exibido.

O efeito depende de:

```text
SUPQ-006
```

---

# 120. Supplier Detail — pendências

Depois de `SUPQ-002`, tela pode mostrar checklist real dos requisitos faltantes.

---

# 121. Não inventar checklist

Enquanto critérios não estiverem definidos, não criar:

```text
Contrato

DPA

ISO

Risco

SLA

Auditoria
```

como requisitos obrigatórios.

---

# 122. Segurança

Supplier pode revelar relações comerciais internas.

Aplicar:

```text
authorization

tenant isolation

safe logging
```

---

# 123. Logs

Evitar registrar objetos completos.

Preferir:

```text
supplierId

organizationId

operation
```

---

# 124. Analytics

Não enviar metadata comercial do fornecedor para analytics sem necessidade.

---

# 125. Dados pessoais de contatos

Não adicionar automaticamente:

```text
nome do contato

telefone

e-mail pessoal

CPF
```

ao Supplier.

Se contato empresarial for necessário futuramente, deve existir requisito próprio.

---

# 126. Nova questão — SUPQ-013

**Status:** DEFERRED  
**Priority:** LOW

V1 precisa armazenar:

```text
contatos do fornecedor
```

?

Não implementar sem necessidade.

---

# 127. Contratos

Relacionar contratos com Supplier pode ser evolução futura.

Exemplo:

```text
Supplier
↓
Contract
```

Não faz parte automaticamente da V1.

---

# 128. DPA

Gestão de:

```text
Data Processing Agreement
```

também pode ser evolução futura.

Não incluir silenciosamente.

---

# 129. Risk Management

Supplier Risk Management completo está fora do escopo atual.

Não transformar Suppliers em:

```text
Third Party Risk Management Platform
```

na V1.

---

# 130. Importação

Futuramente:

```text
CSV

Excel

ERP

sistema de compras
```

podem alimentar Suppliers.

Não faz parte da V1.

---

# 131. Search Select

Wizard pode utilizar:

```text
Buscar fornecedor...
```

---

# 132. Busca paginada

Se volume crescer, usar autocomplete/paginação.

---

# 133. Query

Exemplo:

```http
GET /api/v1/suppliers?search=folha&status=ACTIVE
```

---

# 134. Resultado

Pode mostrar:

```text
Empresa de Folha
Pendente
```

---

# 135. Supplier inativo

Não aparece normalmente em novas associações.

---

# 136. Existing Supplier

Se Activity histórica utiliza Supplier inativo:

```text
Empresa X
Inativo
```

continua visível.

---

# 137. Merge

Pode surgir necessidade de unir Suppliers duplicados.

---

# 138. Nova questão — SUPQ-014

**Status:** DEFERRED  
**Priority:** LOW

Será necessário:

```text
merge de fornecedores duplicados
```

?

Não implementar na V1.

---

# 139. Invariantes

## INV-SUP-001

```text
Todo Supplier pertence a uma Organization.
```

## INV-SUP-002

```text
Supplier não pode ser associado a recursos de outro tenant.
```

## INV-SUP-003

```text
Supplier PENDING não equivale a MAPPED.
```

## INV-SUP-004

```text
Quick Create gera entidade real e auditável.
```

## INV-SUP-005

```text
Supplier inativo continua disponível para histórico.
```

## INV-SUP-006

```text
Inativação não remove associações históricas.
```

## INV-SUP-007

```text
mappingStatus não deve ser alterado arbitrariamente quando depender de validações.
```

## INV-SUP-008

```text
Supplier estrangeiro não implica automaticamente transferência internacional.
```

## INV-SUP-009

```text
Supplier não deve ser tratado automaticamente como operador em todas as atividades.
```

---

# 140. Error Codes

Possíveis:

```text
SUPPLIER_NOT_FOUND

SUPPLIER_ALREADY_EXISTS

SUPPLIER_INVALID_STATUS

SUPPLIER_MAPPING_INCOMPLETE

SUPPLIER_ALREADY_MAPPED

SUPPLIER_IN_USE

SUPPLIER_NOT_ALLOWED

SUPPLIER_CROSS_TENANT_REFERENCE

SUPPLIER_INVALID_STATE
```

---

# 141. Teste — criação

```text
Given:
usuário autorizado

When:
cria Supplier

Then:
Supplier pertence automaticamente à Organization ativa
```

---

# 142. Teste — Quick Create

```text
Given:
usuário autorizado no Wizard

When:
cria Supplier rapidamente

Then:
Supplier é persistido

And:
pode ser utilizado no fluxo permitido

And:
mappingStatus segue regra inicial
```

---

# 143. Teste — cross-tenant read

```text
Given:
Supplier da Organization B

When:
User da Organization A tenta consultá-lo

Then:
Supplier não é exposto
```

---

# 144. Teste — cross-tenant Activity

```text
Given:
Activity da Organization A

And:
Supplier da Organization B

When:
tentativa de associação ocorre

Then:
backend rejeita
```

Teste crítico.

---

# 145. Teste — cross-tenant System

```text
Given:
System da Organization A

And:
Supplier da Organization B

When:
tentativa de associação ocorre

Then:
backend rejeita
```

---

# 146. Teste — complete mapping

Após `SUPQ-002`:

```text
Given:
Supplier não possui metadata obrigatória

When:
complete-mapping é executado

Then:
mappingStatus permanece PENDING
```

---

# 147. Teste — mapped

```text
Given:
Supplier satisfaz requisitos definidos

When:
complete-mapping é executado

Then:
mappingStatus = MAPPED
```

---

# 148. Teste — inativação

```text
Given:
Supplier possui relações históricas

When:
é inativado

Then:
relações históricas permanecem
```

---

# 149. Teste — select

```text
Given:
Supplier ACTIVE

And:
Supplier INACTIVE

When:
select para nova associação é consultado

Then:
somente estados permitidos são retornados
```

---

# 150. Teste — historical inactive

```text
Given:
Activity referencia Supplier INACTIVE

When:
Activity é visualizada

Then:
Supplier continua identificado
```

---

# 151. Teste — permission

```text
Given:
User possui supplier:read

But:
não possui supplier:create

When:
POST /suppliers

Then:
operação é rejeitada
```

---

# 152. Teste — audit

```text
Given:
Supplier é criado

When:
transação conclui

Then:
SUPPLIER_CREATED é registrado
```

---

# 153. Teste — Dashboard

```text
Given:
4 Suppliers PENDING

When:
Dashboard é consultado

Then:
métrica considera apenas tenant autorizado
```

---

# 154. Teste — duplicidade

Se unicidade for aprovada:

```text
Given:
Supplier já existente

When:
cadastro equivalente é solicitado

Then:
duplicidade é tratada conforme regra
```

---

# 155. Teste — concorrência

Se houver unique constraint:

```text
Given:
dois usuários criam mesmo Supplier simultaneamente

When:
requests são processados

Then:
não surgem duplicados indevidos
```

---

# 156. Open Questions relacionadas

```text
AUTHQ-004 — autorização

BRQ-010 — novo fornecedor pendente

WFQ-006 — condições de bloqueio

DBQ-008 — integridade cross-tenant

DBQ-009 — RLS

SYSQ-004 — System ↔ Supplier

SYSQ-007 — impacto de System PENDING

APIQ-004 — concorrência

FEQ-005 — Quick Create

AUDQ-012 — histórico/versionamento

ROPAQ-001 — projeção ROPA
```

---

# 157. Questões específicas

```text
SUPQ-001
Dados cadastrais empresariais

SUPQ-002
Critérios para MAPPED

SUPQ-003
Papel de privacidade

SUPQ-004
Activity ↔ Supplier

SUPQ-005
País do Supplier

SUPQ-006
Impacto de PENDING

DASHQ-008
Pendência antiga

SUPQ-008
Delete de Supplier nunca utilizado

SUPQ-009
Inativação com Activity ACTIVE

SUPQ-010
Unicidade

SUPQ-011
Permission de Quick Create

SUPQ-012
Versionamento próprio

SUPQ-013
Contatos

SUPQ-014
Merge
```

As definições canônicas dessas questões estão em:

```text
12-OPEN-QUESTIONS.md
```

---

# 158. Critérios de aceite

```text
AC-SUP-001

Given:
usuário autorizado

When:
cria Supplier

Then:
Supplier pertence à Organization ativa
```

```text
AC-SUP-002

Given:
Supplier criado via Quick Create

When:
cadastro mínimo é concluído

Then:
pode permanecer PENDING até completar o mapeamento
```

```text
AC-SUP-003

Given:
Supplier de outro tenant

When:
tentativa de associação ocorre

Then:
backend rejeita
```

```text
AC-SUP-004

Given:
Supplier INACTIVE possui histórico

When:
Activity histórica é consultada

Then:
referência continua disponível
```

```text
AC-SUP-005

Given:
Supplier não satisfaz critérios de MAPPED

When:
complete-mapping é solicitado

Then:
backend rejeita conclusão
```

```text
AC-SUP-006

Given:
Supplier PENDING

When:
Dashboard é consultado

Then:
pendência pode ser identificada
```

```text
AC-SUP-007

Given:
usuário sem permission adequada

When:
tenta alterar Supplier

Then:
backend rejeita
```

```text
AC-SUP-008

Given:
Supplier estrangeiro

But:
nenhuma transferência internacional foi registrada

When:
Activity é avaliada

Then:
sistema não cria transferência internacional automaticamente
```

---

# 159. Definition of Done

A feature Suppliers está concluída quando aplicável:

```text
[ ] entidade Supplier definida

[ ] tenant isolation implementado

[ ] campos obrigatórios definidos

[ ] status definido

[ ] mappingStatus definido

[ ] critérios de PENDING definidos

[ ] critérios de MAPPED definidos

[ ] CRUD necessário implementado

[ ] Quick Create implementado

[ ] permission de Quick Create definida

[ ] papel no tratamento definido

[ ] relação com Activity definida

[ ] relação com Recipient definida

[ ] relação com System definida

[ ] relação com InternationalTransfer definida quando aplicável

[ ] impacto de PENDING definido

[ ] inativação implementada

[ ] histórico preservado

[ ] Dashboard integrado

[ ] ROPA integrado quando aplicável

[ ] authorization implementada

[ ] tenant isolation testada

[ ] audit implementado

[ ] API implementada

[ ] frontend implementado

[ ] testes unitários

[ ] testes de integração

[ ] testes cross-tenant

[ ] testes de autorização

[ ] testes E2E críticos

[ ] documentação atualizada
```

---

# 160. Regra para agentes de IA

Antes de implementar Suppliers, consultar:

```text
02-DOMAIN.md

03-DATABASE.md

04-AUTHORIZATION.md

05-BUSINESS-RULES.md

07-API.md

09-SECURITY.md

10-AUDIT.md

12-OPEN-QUESTIONS.md

features/PROCESSING-ACTIVITY.md

features/MAPPING-WIZARD.md

features/SYSTEMS.md

features/SUPPLIERS.md
```

Especialmente não decidir silenciosamente:

```text
SUPQ-002

SUPQ-003

SUPQ-004

SUPQ-006

SUPQ-011
```

---

# 161. Regra final

A feature Suppliers deve permitir responder:

```text
Quais fornecedores participam do tratamento?

Em quais atividades?

Como participam?

Recebem dados?

Estão relacionados a quais sistemas?

Existe transferência internacional associada?

Seu mapeamento está completo?

Existem fornecedores novos ainda pendentes?
```

Supplier não deve se transformar automaticamente em uma plataforma completa de:

```text
procurement

contratos

vendor risk management

gestão financeira

gestão comercial
```

Seu papel na V1 é representar fornecedores relevantes para o:

```text
mapeamento do tratamento de dados pessoais
```

e permitir rastrear suas relações com as atividades.

---

# 162. Próxima feature

O próximo documento recomendado é:

`docs/features/DASHBOARD.md`

Ele deverá especificar:

```text
dashboard do DPO

percentual de mapeamento

atividades pendentes

pendências antigas

dados sensíveis

menores

transferências internacionais

sistemas pendentes

fornecedores pendentes

Compliance Gate

cards

listas de atenção

filtros

drill-down

autorização

tenant isolation

performance

testes
```