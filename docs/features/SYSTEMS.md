# Feature — Sistemas

> **Feature:** Systems  
> **Status:** Draft  
> **Módulo:** Data Mapping / Catalog  
> **Documentos relacionados:** `00-PROJECT.md`, `02-DOMAIN.md`, `03-DATABASE.md`, `04-AUTHORIZATION.md`, `05-BUSINESS-RULES.md`, `06-WORKFLOWS.md`, `07-API.md`, `08-FRONTEND.md`, `09-SECURITY.md`, `10-AUDIT.md`, `12-OPEN-QUESTIONS.md`, `features/ORGANIZATIONS.md`, `features/PROCESSING-ACTIVITY.md`, `features/MAPPING-WIZARD.md`, `features/COMPLIANCE-GATE.md`, `features/ROPA.md`

> **Controle V1 (DEC-031):** pendências são registradas e acompanhadas internamente. A plataforma não bloqueia tecnicamente produção externa; SYSQ-007 e SUPQ-006 continuam abertas sobre os efeitos internos.

---

# 1. Objetivo

A feature Systems mantém o catálogo de sistemas utilizados pelas organizações em suas atividades de tratamento.

Exemplos:

```text
SAP

Salesforce

Microsoft 365

Sistema interno de RH

Portal do Cliente

Sistema de Controle de Acesso
```

O objetivo é evitar que o nome de um sistema seja digitado repetidamente em cada atividade.

---

# 2. Conceito

`System` representa uma aplicação, plataforma ou ferramenta utilizada no fluxo de tratamento.

Estrutura conceitual:

```text
Organization
    ↓
System
    ↓
Processing Activities
```

---

# 3. System como entidade

System deve ser entidade reutilizável.

Evitar:

```text
ProcessingActivity.systemName = "Sistema RH"
```

repetido em diversas atividades.

Preferir:

```text
System
id = UUID
name = Sistema RH

↓

ProcessingActivity
references System
```

---

# 4. Benefícios

Essa modelagem permite:

```text
reutilização

padronização

busca

identificação de dependências

dashboard

auditoria

mapeamento de novos sistemas

integrações futuras
```

---

# 5. Tenant

Todo sistema cadastrado pela organização pertence a:

```text
Organization
```

Regra:

```text
System.organizationId
=
AuthenticatedContext.organizationId
```

---

# 6. Isolamento

Sistema da:

```text
Organization A
```

não pode ser utilizado por atividade da:

```text
Organization B
```

mesmo que os sistemas tenham o mesmo nome.

---

# 7. Exemplo

É válido existir:

```text
Organization A
└── Salesforce
```

e:

```text
Organization B
└── Salesforce
```

como registros independentes.

---

# 8. Campos principais

Estrutura conceitual inicial:

```text
id

organizationId

name

description?

type?

mappingStatus

status

createdAt

updatedAt
```

Campos opcionais precisam ser aprovados antes de serem considerados obrigatórios.

---

# 9. Name

Campo:

```text
name
```

deve ser obrigatório.

Exemplo:

```text
Sistema de Gestão de Pessoas
```

---

# 10. Description

Pode existir:

```text
description
```

para explicar o propósito geral do sistema.

Exemplo:

```text
Sistema utilizado pelo RH para gestão cadastral
e administrativa dos funcionários.
```

Obrigatoriedade permanece aberta.

---

# 11. Type

Pode ser útil classificar sistemas como:

```text
INTERNAL

EXTERNAL
```

ou outro catálogo.

Porém o documento funcional não define classificação completa.

Não consolidar sem decisão.

---

# 12. Nova questão — SYSQ-001

**Status:** OPEN  
**Priority:** MEDIUM

System precisa possuir classificação?

Possibilidades:

```text
INTERNAL

EXTERNAL

SAAS

ON_PREMISE

OTHER
```

Ou nenhuma classificação na V1.

---

# 13. Status operacional

Separar:

```text
status
```

de:

```text
mappingStatus
```

---

# 14. Status

`status` representa disponibilidade do cadastro.

Valores sugeridos:

```text
ACTIVE

INACTIVE
```

---

# 15. Mapping Status

`mappingStatus` representa situação do mapeamento do sistema.

Valores inicialmente propostos:

```text
PENDING

MAPPED
```

---

# 16. Diferença

Exemplo:

```text
status = ACTIVE

mappingStatus = PENDING
```

significa:

```text
sistema existe e está sendo utilizado

mas seu cadastro/mapeamento ainda possui pendências
```

---

# 17. Regra global

O desenho funcional estabelece que:

```text
novo sistema
```

deve permanecer pendente até que seu mapeamento/metadata necessário seja concluído.

---

# 18. Quick Create

Durante o Mapping Wizard:

```text
Selecionar sistema
↓
Sistema não encontrado
↓
Adicionar sistema
```

---

# 19. Objetivo do Quick Create

Evitar interromper o mapeamento da atividade.

O usuário pode cadastrar rapidamente:

```text
name
```

e continuar.

---

# 20. Exemplo

```text
Sistema:
[ Sistema de RH        ]

Nenhum resultado encontrado.

[ + Adicionar "Sistema de RH" ]
```

---

# 21. Resultado

Sistema criado pelo Quick Create pode nascer:

```text
status = ACTIVE

mappingStatus = PENDING
```

---

# 22. Regra importante

Quick Create não deve fingir que o sistema está completamente mapeado.

---

# 23. Metadata mínima

Precisamos definir quais informações transformam:

```text
PENDING
```

em:

```text
MAPPED
```

---

# 24. Nova questão — SYSQ-002

**Status:** OPEN  
**Priority:** CRITICAL

Quais campos são obrigatórios para considerar:

```text
System.mappingStatus = MAPPED
```

?

Essa decisão é necessária para implementar a regra de pendência.

---

# 25. Não inventar metadata

Não adicionar automaticamente campos como:

```text
IP

hostname

database engine

operating system

cloud region

encryption algorithm

server version
```

Esses dados não fazem parte do requisito funcional atual.

---

# 26. Possíveis informações futuras

Se houver necessidade futura, podem ser consideradas informações como:

```text
responsibleBusinessUnit

supplier

description

hostingType

countries
```

Mas devem ser aprovadas individualmente.

---

# 27. Área responsável

Pode ser útil associar System a uma:

```text
BusinessUnit
```

responsável.

Exemplo:

```text
Sistema de RH
↓
Tecnologia
```

ou:

```text
Recursos Humanos
```

dependendo do conceito de responsabilidade.

---

# 28. Nova questão — SYSQ-003

**Status:** OPEN  
**Priority:** MEDIUM

System possui:

```text
responsibleBusinessUnitId
```

?

Se sim, "responsável" significa:

```text
área proprietária

área usuária

área técnica

área gestora
```

?

---

# 29. Responsável individual

Não adicionar:

```text
responsibleUserId
```

sem requisito.

---

# 30. Supplier

Um System pode estar relacionado a um:

```text
Supplier
```

Exemplo:

```text
Sistema SaaS
↓
Fornecedor
```

---

# 31. Cardinalidade fornecedor

Ainda precisa ser definida.

Possibilidades:

```text
System
↓
0..1 Supplier
```

ou:

```text
System
↓
N Suppliers
```

---

# 32. Nova questão — SYSQ-004

**Status:** OPEN  
**Priority:** MEDIUM

Qual é a relação:

```text
System ↔ Supplier
```

?

---

# 33. Sistemas internos

Sistema desenvolvido internamente pode não possuir fornecedor.

Exemplo:

```text
Portal Interno
↓
Supplier = null
```

---

# 34. Relação com ProcessingActivity

Uma atividade pode utilizar múltiplos sistemas.

Exemplo:

```text
Processamento da folha
├── Sistema de RH
├── ERP
└── Portal do funcionário
```

---

# 35. Relação indireta

A associação pode ocorrer através de:

```text
CollectionSource

ProcessingOperation
```

---

# 36. Evitar relações contraditórias

Não criar sem necessidade:

```text
activity_systems
```

e simultaneamente:

```text
collection_source.system_id

processing_operation.system_id
```

sem definir qual relação representa o quê.

---

# 37. Nova questão — SYSQ-005

**Status:** OPEN  
**Priority:** CRITICAL

Como representar a relação geral:

```text
ProcessingActivity ↔ System
```

?

Possibilidades:

```text
somente através das etapas onde o sistema participa

relação direta activity_systems

ambas, com semânticas diferentes
```

---

# 38. Recomendação conceitual

Preferir preservar o contexto.

Exemplo:

```text
System A
↓
Collection Source
```

e:

```text
System B
↓
Processing Operation USE
```

Isso permite entender:

```text
onde cada sistema participa do fluxo
```

---

# 39. Data Flow

A modelagem deve permitir futuramente representar:

```text
Titular
↓
Portal
↓
CRM
↓
ERP
↓
Fornecedor
```

sem precisar remodelar completamente o domínio.

---

# 40. V1

Não é necessário implementar:

```text
editor visual de fluxo
```

na V1.

Mas as relações não devem impedir essa evolução.

---

# 41. Collection Source

System pode ser utilizado como origem da coleta.

Exemplo:

```text
CollectionSource
type = SYSTEM
systemId = UUID
```

---

# 42. Validação

O System selecionado deve:

```text
existir

estar acessível

pertencer ao tenant correto

estar em estado permitido
```

---

# 43. Sistema inativo

Um sistema:

```text
INACTIVE
```

não deve aparecer normalmente para novas associações.

---

# 44. Histórico

Atividades históricas que já utilizavam o sistema devem continuar referenciando-o.

---

# 45. Não remover referência histórica

Inativar System não deve:

```text
remover System das Activities

apagar Operations

alterar versões históricas
```

---

# 46. Processing Operation

System também pode estar relacionado a operação.

Exemplo:

```text
USE
↓
Sistema de RH
```

---

# 47. Múltiplos sistemas por operação

Precisamos decidir se uma operação pode envolver:

```text
1 System
```

ou:

```text
N Systems
```

---

# 48. Nova questão — SYSQ-006

**Status:** OPEN  
**Priority:** MEDIUM

Qual cardinalidade:

```text
ProcessingOperation ↔ System
```

?

---

# 49. Sistema pendente e Activity

Uma atividade pode temporariamente referenciar System:

```text
PENDING
```

durante o mapeamento.

---

# 50. Regra global

O desenho funcional prevê que novo sistema/fornecedor permaneça como pendência até ser mapeado.

Precisamos definir se isso:

```text
bloqueia Submit

bloqueia Gate

bloqueia ACTIVE

gera apenas alerta
```

---

# 51. Nova questão — SYSQ-007

**Status:** OPEN  
**Priority:** CRITICAL

Qual impacto de:

```text
System.mappingStatus = PENDING
```

sobre a ProcessingActivity?

Possibilidades:

```text
bloqueia Submit

bloqueia Gate COMPLETE

bloqueia ACTIVE

gera REVIEW_REQUIRED

gera somente Dashboard Warning
```

---

# 52. Compliance Gate

Não adicionar automaticamente:

```text
SYSTEM_MAPPING
```

como ComplianceCheck enquanto regra não for aprovada.

---

# 53. Dashboard

O desenho funcional prevê identificação de:

```text
novo sistema não mapeado
```

como pendência.

Dashboard deve conseguir mostrar:

```text
Systems PENDING
```

---

# 54. Indicadores possíveis

Exemplos:

```text
Sistemas cadastrados

Sistemas pendentes

Sistemas mapeados
```

---

# 55. Pendências antigas

Dashboard pode destacar sistemas:

```text
PENDING
```

há muito tempo.

A definição de "antigo" precisa ser configurada/definida.

---

# 56. Política central de antiguidade — DASHQ-008

A antiguidade de sistemas é definida em DASHQ-008, incluindo a possibilidade de limiares diferentes por recurso. O ID anterior é alias no registro central, sem decisão independente (DEC-033).

Nenhum prazo foi definido. DASHQ-007 determina o início da contagem. Disparo de alertas/notificações permanece em WFQ-013.

---

# 57. Tela

Rota possível:

```text
/systems
```

---

# 58. Listagem

Pode apresentar:

```text
Sistema

Status

Mapeamento

Área responsável

Fornecedor

Última atualização
```

somente para campos realmente aprovados.

---

# 59. Exemplo

```text
Sistemas

[Buscar] [Status] [Mapeamento]      [+ Novo sistema]

Sistema           Mapeamento
-----------------------------------------------
Sistema de RH     Mapeado
CRM               Pendente
ERP               Mapeado
```

---

# 60. Filtros

Possíveis:

```text
status

mappingStatus

businessUnitId

supplierId

search
```

Filtros dependentes de campos opcionais só existem se esses campos forem aprovados.

---

# 61. Busca

Inicialmente pode buscar:

```text
name
```

---

# 62. Paginação

Listagem deve ser server-side quando necessário.

---

# 63. Nova tela

```text
Novo sistema
```

Campos mínimos:

```text
name
```

Demais campos dependem das decisões abertas.

---

# 64. Detalhe

Página:

```text
/systems/:id
```

pode apresentar:

```text
Informações

Atividades relacionadas

Pendências

Histórico
```

conforme permissões.

---

# 65. Atividades relacionadas

Pode listar atividades onde o sistema participa.

Exemplo:

```text
Processamento da folha

Cadastro de funcionários

Gestão de benefícios
```

---

# 66. Contexto da associação

Idealmente mostrar:

```text
Atividade                Participação

Folha                     Coleta / Uso

Cadastro                   Uso

Benefícios                 Transferência
```

se o modelo permitir.

---

# 67. Impact Analysis

Essa visão permite responder:

```text
Quais atividades dependem deste sistema?
```

---

# 68. Evolução futura

Isso pode permitir futuramente:

```text
Sistema comprometido
↓
quais atividades são impactadas?
↓
quais categorias de dados?
↓
quais titulares?
```

Essa análise não faz parte automaticamente da V1.

---

# 69. API — listagem

```http
GET /api/v1/systems
```

---

# 70. API — criação

```http
POST /api/v1/systems
```

Request mínimo:

```json
{
  "name": "Sistema de RH"
}
```

---

# 71. Organization ID

Não aceitar `organizationId` como fonte autoritativa do request.

Backend utiliza:

```text
AuthenticatedContext.organizationId
```

---

# 72. Response

Exemplo:

```json
{
  "data": {
    "id": "uuid",
    "name": "Sistema de RH",
    "status": "ACTIVE",
    "mappingStatus": "PENDING"
  }
}
```

O status inicial definitivo precisa seguir regra aprovada.

---

# 73. API — detalhe

```http
GET /api/v1/systems/:id
```

---

# 74. API — atualização

```http
PATCH /api/v1/systems/:id
```

Somente campos permitidos.

---

# 75. MappingStatus protegido

Não permitir necessariamente:

```json
{
  "mappingStatus": "MAPPED"
}
```

como alteração arbitrária do frontend.

---

# 76. Operação semântica

Se `MAPPED` depender de validações, preferir operação como:

```http
POST /api/v1/systems/:id/complete-mapping
```

---

# 77. Complete Mapping

Backend deve:

```text
carregar System

validar tenant

validar permission

validar campos necessários

alterar mappingStatus

auditar
```

---

# 78. Inativação

Preferir operação semântica:

```http
POST /api/v1/systems/:id/deactivate
```

ou convenção equivalente.

---

# 79. Reativação

Pode existir:

```http
POST /api/v1/systems/:id/reactivate
```

se requisito aprovado.

---

# 80. Delete

Evitar delete físico de System que já esteja relacionado a atividades.

---

# 81. Draft sem uso

Para System criado por engano e nunca utilizado, exclusão física poderia ser considerada.

A regra ainda precisa ser definida.

---

# 82. Nova questão — SYSQ-009

**Status:** OPEN  
**Priority:** LOW

System nunca utilizado pode ser:

```text
deletado fisicamente
```

ou sempre:

```text
inativado
```

?

---

# 83. Duplicidade

Precisamos definir se dois sistemas podem possuir mesmo nome dentro da organização.

---

# 84. Recomendação inicial

Evitar duplicidade ativa exata por:

```text
organizationId + normalizedName
```

mas não consolidar sem decisão.

---

# 85. Nova questão — SYSQ-010

**Status:** OPEN  
**Priority:** MEDIUM

Nome de System deve ser único dentro da Organization?

---

# 86. Normalização

Se unicidade for adotada, considerar diferenças como:

```text
Salesforce

salesforce

SalesForce
```

A estratégia precisa ser consistente.

---

# 87. Quick Create e duplicidade

Antes de criar:

```text
Sistema RH
```

frontend pode pesquisar sistemas existentes.

Backend continua responsável pela garantia de unicidade caso exista.

---

# 88. Race Condition

Dois usuários podem tentar criar o mesmo sistema simultaneamente.

Se houver unique constraint, API deve tratar conflito adequadamente.

---

# 89. Error Code

Possível:

```text
SYSTEM_ALREADY_EXISTS
```

---

# 90. Authorization

Permissions conceituais:

```text
system:create

system:read

system:update

system:complete_mapping

system:deactivate
```

Naming final deve seguir `04-AUTHORIZATION.md`.

---

# 91. Quick Create Permission

Usuário que pode editar Activity não necessariamente deve poder criar Systems.

Isso precisa ser definido.

---

# 92. Nova questão — SYSQ-011

**Status:** OPEN  
**Priority:** CRITICAL

Quem pode executar:

```text
Quick Create System
```

?

Possibilidades:

```text
COLLABORATOR

MANAGER

DPO

ADMIN
```

---

# 93. Sem permission

Se usuário não puder criar:

```text
Sistema não encontrado.
Solicite o cadastro a um responsável.
```

ou fluxo equivalente.

---

# 94. Scope

Systems normalmente pertencem à Organization inteira.

Ainda pode existir restrição por:

```text
BusinessUnit
```

se produto exigir.

Não assumir automaticamente.

---

# 95. Tenant isolation

Toda query precisa respeitar:

```text
organizationId
```

---

# 96. Cross-tenant read

```text
User A
↓
GET System B
```

não deve expor System B.

---

# 97. Cross-tenant association

Mesmo conhecendo UUID de System B:

```text
Activity A
↓
System B
```

deve ser rejeitado.

---

# 98. Cross-tenant update

```text
PATCH System B
```

por User A deve ser rejeitado sem expor existência do recurso.

---

# 99. Supplier tenant

Se System estiver relacionado a Supplier:

```text
System.organizationId
=
Supplier.organizationId
```

deve ser garantido.

---

# 100. Business Unit tenant

Se houver área responsável:

```text
System.organizationId
=
BusinessUnit.organizationId
```

---

# 101. Audit Events

Eventos possíveis:

```text
SYSTEM_CREATED

SYSTEM_UPDATED

SYSTEM_MAPPING_COMPLETED

SYSTEM_DEACTIVATED

SYSTEM_REACTIVATED
```

---

# 102. Quick Create audit

Quick Create continua sendo criação real.

Deve gerar:

```text
SYSTEM_CREATED
```

---

# 103. Metadata

Exemplo:

```json
{
  "systemId": "uuid",
  "source": "MAPPING_WIZARD"
}
```

`source` é opcional e só deve existir se útil.

---

# 104. Mapping completed

Evento:

```text
SYSTEM_MAPPING_COMPLETED
```

pode registrar:

```text
fromStatus = PENDING

toStatus = MAPPED
```

---

# 105. Não registrar dados inteiros

Audit não precisa guardar toda representação do sistema a cada alteração.

---

# 106. Versionamento

Precisamos definir se System possui versionamento próprio.

O requisito original de nova versão refere-se principalmente às mudanças relevantes da atividade.

Não assumir automaticamente `SystemVersion`.

---

# 107. Nova questão — SYSQ-012

**Status:** OPEN  
**Priority:** MEDIUM

System precisa de:

```text
versionamento próprio
```

ou:

```text
AuditLog + snapshots das Activities
```

é suficiente?

---

# 108. Alteração do nome

Se:

```text
Sistema RH
```

vira:

```text
People Platform
```

atividades históricas precisam continuar reconstruíveis.

---

# 109. Snapshot da Activity

Se ActivityVersion guarda nome/metadata necessária do System no snapshot, histórico pode permanecer consistente mesmo sem SystemVersion.

Isso precisa ser validado no desenho de versionamento.

---

# 110. Sistema inativado

Inativação não deve alterar snapshots históricos.

---

# 111. ROPA

ROPA pode apresentar Systems relacionados quando essa informação fizer parte da projeção.

---

# 112. ROPA histórico

Não deve apresentar nome atual do sistema em um registro histórico se o requisito for reproduzir exatamente o estado antigo e o nome mudou.

Por isso, estratégia de snapshot é importante.

---

# 113. Dashboard

Pode apresentar:

```text
Sistemas pendentes
```

---

# 114. Dashboard link

Exemplo:

```text
7 sistemas pendentes
↓
/systems?mappingStatus=PENDING
```

---

# 115. Activity warning

Se Activity utiliza System PENDING, UI pode exibir:

```text
Este sistema possui mapeamento pendente.
```

O impacto funcional depende de `SYSQ-007`.

---

# 116. System Detail — Pendências

Pode apresentar campos faltantes somente depois que critérios de `MAPPED` forem definidos.

---

# 117. Não criar checklist falso

Enquanto `SYSQ-002` estiver aberta, não inventar:

```text
[x] Fornecedor
[x] Região
[x] Criptografia
[x] Responsável
```

como critérios obrigatórios.

---

# 118. Search Select

No wizard:

```text
Buscar sistema...
```

deve usar busca paginada/autocomplete quando catálogo crescer.

---

# 119. Debounce

Busca pode utilizar debounce apropriado.

Não carregar todos os sistemas da organização em cada formulário se volume crescer.

---

# 120. Query

Possível:

```http
GET /api/v1/systems?search=RH&status=ACTIVE
```

---

# 121. Select result

Pode apresentar:

```text
Sistema de RH
Pendente
```

para que usuário conheça situação do sistema.

---

# 122. Inactive

Por padrão:

```text
INACTIVE
```

não aparece em selects de novas associações.

---

# 123. Existing Activity

Ao editar Activity que já referencia sistema inativo, interface deve continuar mostrando a referência.

Exemplo:

```text
Sistema legado
Inativo
```

---

# 124. Não substituir automaticamente

Não trocar System inativo por outro sistema sem ação explícita.

---

# 125. Merge

Pode surgir necessidade de:

```text
duplicado A
+
duplicado B
↓
merge
```

Isso não faz parte da V1.

---

# 126. Nova questão — SYSQ-013

**Status:** DEFERRED  
**Priority:** LOW

Será necessária funcionalidade de:

```text
merge de sistemas duplicados
```

?

Não implementar na V1 sem necessidade.

---

# 127. Importação

Futuramente pode existir importação de Systems por:

```text
CSV

Excel

integração CMDB

SSO/Entra

inventário
```

Não faz parte da V1.

---

# 128. API futura

Não criar endpoints de integração antes do requisito.

---

# 129. Segurança

System pode revelar detalhes da arquitetura interna da empresa.

Aplicar:

```text
authorization

tenant isolation

safe logging

protected exports
```

---

# 130. Description

Descrição não deve ser enviada integralmente para analytics externos sem necessidade.

---

# 131. Logs

Evitar:

```text
logger.info(system)
```

se o objeto puder crescer ou conter metadata interna.

Preferir:

```text
systemId

organizationId

operation
```

---

# 132. Invariantes

## INV-SYS-001

```text
Todo System pertence a uma Organization.
```

## INV-SYS-002

```text
System não pode ser associado a Activity de outro tenant.
```

## INV-SYS-003

```text
System PENDING não deve ser tratado como MAPPED.
```

## INV-SYS-004

```text
Quick Create cria entidade real e auditável.
```

## INV-SYS-005

```text
System inativo permanece disponível para reconstrução histórica.
```

## INV-SYS-006

```text
Inativação não remove associações históricas.
```

## INV-SYS-007

```text
mappingStatus não deve ser alterado arbitrariamente se depender de validações.
```

## INV-SYS-008

```text
Cross-tenant relationships são proibidas.
```

---

# 133. Error Codes

Possíveis:

```text
SYSTEM_NOT_FOUND

SYSTEM_ALREADY_EXISTS

SYSTEM_INVALID_STATUS

SYSTEM_MAPPING_INCOMPLETE

SYSTEM_ALREADY_MAPPED

SYSTEM_IN_USE

SYSTEM_NOT_ALLOWED

SYSTEM_CROSS_TENANT_REFERENCE

SYSTEM_INVALID_STATE
```

A lista definitiva depende das regras aprovadas.

---

# 134. Teste — criação

```text
Given:
usuário autorizado

When:
cria System

Then:
System pertence automaticamente à Organization ativa
```

---

# 135. Teste — Quick Create

```text
Given:
usuário autorizado no Mapping Wizard

When:
cria System rapidamente

Then:
System é persistido

And:
pode ser associado à Activity

And:
mappingStatus segue regra inicial definida
```

---

# 136. Teste — cross-tenant read

```text
Given:
System pertence à Organization B

When:
User da Organization A tenta consultá-lo

Then:
System não é exposto
```

---

# 137. Teste — cross-tenant association

```text
Given:
Activity da Organization A

And:
System da Organization B

When:
associação é enviada

Then:
backend rejeita operação
```

Teste crítico.

---

# 138. Teste — mapping

Após `SYSQ-002`:

```text
Given:
System não possui metadata obrigatória

When:
complete-mapping é executado

Then:
mappingStatus não muda para MAPPED
```

---

# 139. Teste — mapped

```text
Given:
System possui requisitos necessários

When:
complete-mapping é executado

Then:
mappingStatus = MAPPED
```

após definição das regras.

---

# 140. Teste — inativação

```text
Given:
System utilizado por Activity histórica

When:
System é inativado

Then:
referência histórica permanece existente
```

---

# 141. Teste — select

```text
Given:
System ACTIVE

And:
System INACTIVE

When:
lista de seleção para nova associação é consultada

Then:
somente estados permitidos são retornados
```

---

# 142. Teste — existing inactive

```text
Given:
Activity já referencia System INACTIVE

When:
Activity é visualizada

Then:
referência continua visível
```

---

# 143. Teste — Supplier

Se relação for implementada:

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

# 144. Teste — Business Unit

Se relação for implementada:

```text
Given:
System da Organization A

And:
BusinessUnit da Organization B

When:
tentativa de associação ocorre

Then:
backend rejeita
```

---

# 145. Teste — permission

```text
Given:
User pode ler Systems

But:
não possui permission de criação

When:
POST /systems

Then:
operação é rejeitada
```

---

# 146. Teste — audit

```text
Given:
System é criado

When:
transação conclui

Then:
SYSTEM_CREATED é registrado
```

---

# 147. Teste — Dashboard

```text
Given:
3 Systems PENDING

When:
Dashboard da Organization é consultado

Then:
indicador considera somente Systems autorizados da Organization
```

---

# 148. Teste — duplicidade

Se unicidade for aprovada:

```text
Given:
Organization possui "Sistema RH"

When:
outro usuário tenta criar nome equivalente

Then:
duplicidade é tratada de forma consistente
```

---

# 149. Teste — concorrência

Se unicidade for aprovada:

```text
Given:
dois usuários criam mesmo System simultaneamente

When:
requests são processados

Then:
não surgem duplicados ativos indevidos
```

---

# 150. Open Questions relacionadas

```text
PRODQ-001 — multi-tenancy

AUTHQ-004 — matriz de acesso

AUTHQ-008 — Business Units

BRQ-010 — sistema novo pendente

WFQ-006 — condições de bloqueio

DBQ-008 — integridade cross-tenant

DBQ-009 — RLS

APIQ-004 — concorrência

FEQ-005 — Quick Create

AUDQ-012 — histórico/versionamento
```

---

# 151. Questões específicas

```text
SYSQ-001
Classificação do System

SYSQ-002
Critérios para MAPPED

SYSQ-003
Business Unit responsável

SYSQ-004
Relação System ↔ Supplier

SYSQ-005
Relação Activity ↔ System

SYSQ-006
Cardinalidade Operation ↔ System

SYSQ-007
Impacto de System PENDING na Activity

DASHQ-008
Pendência antiga

SYSQ-009
Delete de System nunca utilizado

SYSQ-010
Unicidade do nome

SYSQ-011
Permission de Quick Create

SYSQ-012
Versionamento próprio

SYSQ-013
Merge de duplicados
```

As definições canônicas dessas questões estão em:

```text
12-OPEN-QUESTIONS.md
```

---

# 152. Critérios de aceite

```text
AC-SYS-001

Given:
usuário autorizado

When:
cria System

Then:
System pertence à Organization ativa
```

```text
AC-SYS-002

Given:
System criado via Quick Create

When:
cadastro mínimo é concluído

Then:
System pode permanecer PENDING até completar seu mapeamento
```

```text
AC-SYS-003

Given:
System de outro tenant

When:
é utilizado em Activity

Then:
associação é rejeitada
```

```text
AC-SYS-004

Given:
System INACTIVE possui histórico

When:
é consultada Activity antiga

Then:
referência continua disponível
```

```text
AC-SYS-005

Given:
System não satisfaz critérios de mapeamento

When:
tentativa de marcar MAPPED ocorre

Then:
backend rejeita conforme regras definidas
```

```text
AC-SYS-006

Given:
System PENDING

When:
Dashboard é consultado

Then:
pendência pode ser identificada conforme regra aprovada
```

```text
AC-SYS-007

Given:
usuário sem permission

When:
tenta criar/alterar System

Then:
backend rejeita operação
```

---

# 153. Definition of Done

A feature Systems está concluída quando aplicável:

```text
[ ] entidade System definida

[ ] tenant isolation implementado

[ ] campos obrigatórios definidos

[ ] status definido

[ ] mappingStatus definido

[ ] critérios de PENDING definidos

[ ] critérios de MAPPED definidos

[ ] CRUD necessário implementado

[ ] Quick Create implementado

[ ] permission de Quick Create definida

[ ] relação com Activity definida

[ ] relação com CollectionSource definida

[ ] relação com ProcessingOperation definida

[ ] relação com Supplier definida quando aplicável

[ ] relação com BusinessUnit definida quando aplicável

[ ] impacto de PENDING definido

[ ] inativação implementada

[ ] histórico preservado

[ ] Dashboard integrado

[ ] ROPA integrado quando aplicável

[ ] audit implementado

[ ] authorization implementada

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

# 154. Regra para agentes de IA

Antes de implementar Systems, consultar:

```text
02-DOMAIN.md

03-DATABASE.md

04-AUTHORIZATION.md

05-BUSINESS-RULES.md

07-API.md

10-AUDIT.md

12-OPEN-QUESTIONS.md

features/ORGANIZATIONS.md

features/PROCESSING-ACTIVITY.md

features/MAPPING-WIZARD.md

features/SYSTEMS.md
```

Se:

```text
SYSQ-002
SYSQ-005
SYSQ-007
SYSQ-011
```

continuarem abertas, não assumir comportamento estrutural silenciosamente.

---

# 155. Regra final

A feature Systems deve permitir responder:

```text
Quais sistemas existem na organização?

Quais estão mapeados?

Quais estão pendentes?

Em quais atividades cada sistema participa?

Em qual ponto do tratamento ele participa?

Ele é fonte de coleta?

Ele executa alguma operação?

Está relacionado a algum fornecedor?

Quais atividades seriam impactadas por uma alteração nesse sistema?
```

O cadastro de System não deve se transformar em uma:

```text
CMDB completa
```

na V1.

Seu objetivo é representar apenas as informações necessárias para compreender o papel dos sistemas no mapeamento de dados pessoais.

---

# 156. Próxima feature

O próximo documento recomendado é:

`docs/features/SUPPLIERS.md`

Ele deverá especificar:

```text
cadastro de fornecedores

operadores externos

quick create

mappingStatus

PENDING

MAPPED

relação com sistemas

relação com atividades

destinatários

transferências

pendências

dashboard

autorização

tenant isolation

auditoria

testes
```