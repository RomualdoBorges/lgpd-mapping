# Feature — Dashboard do DPO

> **Feature:** Dashboard  
> **Status:** Draft  
> **Módulo:** Monitoring / Compliance  
> **Documentos relacionados:** `00-PROJECT.md`, `01-ARCHITECTURE.md`, `02-DOMAIN.md`, `03-DATABASE.md`, `04-AUTHORIZATION.md`, `05-BUSINESS-RULES.md`, `06-WORKFLOWS.md`, `07-API.md`, `08-FRONTEND.md`, `09-SECURITY.md`, `10-AUDIT.md`, `11-TESTING.md`, `12-OPEN-QUESTIONS.md`, `features/PROCESSING-ACTIVITY.md`, `features/MAPPING-WIZARD.md`, `features/COMPLIANCE-GATE.md`, `features/ROPA.md`, `features/SYSTEMS.md`, `features/SUPPLIERS.md`

---

# 1. Objetivo

O Dashboard fornece ao DPO e demais usuários autorizados uma visão consolidada da situação do mapeamento de dados pessoais da organização.

O desenho funcional prevê acompanhamento de:

```text
percentual de mapeamento concluído

pendências antigas

atividades com dados sensíveis

atividades envolvendo menores

transferências internacionais

novos sistemas não mapeados

novos fornecedores não mapeados
```

O Dashboard deve funcionar como:

```text
visão consolidada
+
ponto de entrada para investigação
```

---

# 2. Princípio

Dashboard não é fonte da verdade.

Ele é uma projeção de informações existentes em:

```text
ProcessingActivity

ComplianceCheck

System

Supplier

ActivityVersion

InternationalTransfer

PersonalDataCategory

DataSubjectCategory
```

e demais entidades do domínio.

---

# 3. Não duplicar regras

Evitar implementar regras diferentes em:

```text
Dashboard

ROPA

ProcessingActivity

Compliance Gate
```

Exemplo incorreto:

```text
Dashboard considera atividade completa
se status = ACTIVE
```

enquanto:

```text
Compliance Gate considera COMPLETE
por outra regra
```

O Dashboard deve consumir conceitos já definidos no domínio.

---

# 4. Público principal

O documento funcional define o:

```text
DPO
```

como principal usuário do Dashboard.

Outros papéis podem receber acesso conforme:

```text
04-AUTHORIZATION.md
```

---

# 5. Rota

Rota principal:

```text
/dashboard
```

---

# 6. Visão conceitual

```text
┌──────────────────────────────────────────────────────────┐
│ Dashboard                                                │
├──────────────────────────────────────────────────────────┤
│ Mapeamento     Gate        Sensíveis      Menores        │
│    72%         18 pend.       12             4           │
├──────────────────────────────────────────────────────────┤
│ Transferências internacionais        7                   │
│ Sistemas pendentes                   5                   │
│ Fornecedores pendentes               3                   │
├──────────────────────────────────────────────────────────┤
│ Pendências antigas                                       │
│ ...                                                      │
└──────────────────────────────────────────────────────────┘
```

Valores são apenas ilustrativos.

---

# 7. Escopo

V1 deve priorizar:

```text
indicadores

pendências

drill-down

filtros básicos

navegação para recursos relacionados
```

---

# 8. Fora do escopo inicial

Não adicionar automaticamente:

```text
BI completo

construtor de dashboards

gráficos customizáveis

machine learning

score jurídico

score LGPD

benchmark entre empresas

previsão de risco

heatmap de risco

alertas preditivos
```

---

# 9. Dashboard por tenant

Todo Dashboard é calculado dentro da:

```text
Organization ativa
```

---

# 10. Regra

```text
Dashboard.organizationId
=
AuthenticatedContext.organizationId
```

conceitualmente.

O `organizationId` não deve ser confiado ao frontend como mecanismo de autorização.

---

# 11. Escopo por Business Unit

Dependendo da autorização:

```text
DPO
→ ORGANIZATION

Manager
→ BUSINESS_UNIT

Collaborator
→ conforme matriz aprovada
```

---

# 12. Regra crítica

Os números do Dashboard devem considerar somente recursos que o usuário está autorizado a visualizar.

---

# 13. Exemplo

Organization possui:

```text
RH          20 Activities
Financeiro  10 Activities
Jurídico     5 Activities
```

Se usuário possui acesso somente a RH:

```text
Dashboard
```

não deve apresentar totais calculados sobre as 35 atividades caso isso revele informações fora do seu escopo.

---

# 14. Nova questão — DASHQ-001

**Status:** OPEN  
**Priority:** HIGH

Dashboard será:

```text
exclusivo para DPO/Admin
```

ou também haverá visão restrita para:

```text
Manager

Collaborator
```

?

---

# 15. Percentual de mapeamento

O documento funcional prevê:

```text
% completo
```

Precisamos definir exatamente o denominador e numerador.

---

# 16. Possibilidade

Exemplo conceitual:

```text
Activities consideradas completas
----------------------------------
Activities consideradas no universo
```

×

```text
100
```

---

# 17. Problema

Precisamos decidir o que significa:

```text
completa
```

Pode significar:

```text
status ACTIVE

Compliance Gate COMPLETE

workflow concluído

todos os campos obrigatórios preenchidos
```

Esses conceitos não são necessariamente equivalentes.

---

# 18. Nova questão — DASHQ-002

**Status:** OPEN  
**Priority:** CRITICAL

Qual fórmula define:

```text
percentual de mapeamento concluído
```

?

Não implementar uma fórmula arbitrária.

---

# 19. Exemplo após decisão

Se for definido:

```text
Complete = ComplianceStatus.COMPLETE
```

e houver:

```text
100 Activities elegíveis

72 COMPLETE
```

então:

```text
72%
```

---

# 20. Universo

Também é necessário definir quais Activities entram no denominador.

Possibilidades:

```text
todas não arquivadas

somente submetidas

somente em mapeamento ou posteriores

somente atividades conhecidas
```

---

# 21. Nova questão — DASHQ-003

**Status:** OPEN  
**Priority:** CRITICAL

Quais status de ProcessingActivity entram no universo do indicador de mapeamento?

---

# 22. Card — Mapeamento

Exemplo:

```text
Mapeamento

72%

72 de 100 atividades
```

Somente após fórmula aprovada.

---

# 23. Drill-down

Ao clicar:

```text
Mapeamento
```

pode navegar para:

```text
/activities
```

com filtro correspondente.

---

# 24. Gate pendente

Dashboard deve permitir visualizar Activities cujo:

```text
complianceStatus = PENDING
```

---

# 25. Card

Exemplo:

```text
Gate pendente

18
```

---

# 26. Gate bloqueado

Pode existir indicador separado:

```text
BLOCKED
```

caso seja útil.

---

# 27. Nova questão — DASHQ-004

**Status:** OPEN  
**Priority:** MEDIUM

Dashboard deve separar:

```text
PENDING

BLOCKED
```

em cards diferentes ou agrupá-los como pendências?

---

# 28. Dados sensíveis

O documento funcional prevê destaque para atividades com dados sensíveis.

---

# 29. Cálculo

Indicador deve ser derivado das categorias/itens classificados como sensíveis no domínio.

Não criar flag manual independente sem necessidade.

---

# 30. Card

Exemplo:

```text
Dados sensíveis

12 atividades
```

---

# 31. Drill-down

```text
/activities?hasSensitiveData=true
```

ou rota/filtro equivalente.

---

# 32. Regra

Não significa:

```text
12 atividades irregulares
```

Significa apenas:

```text
12 atividades mapeadas envolvem dados classificados como sensíveis
```

---

# 33. Menores

O documento funcional também prevê destaque para atividades envolvendo menores.

---

# 34. Modelagem

O indicador deve derivar de:

```text
DataSubjectCategory
```

ou mecanismo de domínio aprovado.

---

# 35. Card

```text
Envolvendo menores

4 atividades
```

---

# 36. Não confundir

```text
menor
```

é característica/categoria do titular no modelo proposto.

Não tratar automaticamente como:

```text
PersonalDataCategory
```

sem decisão de domínio.

---

# 37. Transferência internacional

Dashboard deve identificar Activities contendo:

```text
InternationalTransfer
```

---

# 38. Card

```text
Transferências internacionais

7 atividades
```

---

# 39. Sem inferência

Não contar Supplier estrangeiro automaticamente.

Não contar System externo automaticamente.

Deve existir transferência registrada conforme domínio.

---

# 40. Drill-down

Pode navegar para:

```text
/activities?hasInternationalTransfer=true
```

---

# 41. Transferências pendentes

Pode ser útil mostrar transferências que ainda exigem:

```text
REVIEW_REQUIRED
```

ou outro ComplianceCheck.

---

# 42. Nova questão — DASHQ-005

**Status:** OPEN  
**Priority:** MEDIUM

Dashboard precisa de indicador específico para:

```text
transferências internacionais com revisão pendente
```

?

---

# 43. Systems PENDING

O documento funcional prevê novos sistemas ainda não mapeados.

---

# 44. Card

```text
Sistemas pendentes

5
```

---

# 45. Fonte

```text
System.mappingStatus = PENDING
```

conforme `features/SYSTEMS.md`.

---

# 46. Drill-down

```text
/systems?mappingStatus=PENDING
```

---

# 47. Suppliers PENDING

Da mesma forma:

```text
Supplier.mappingStatus = PENDING
```

---

# 48. Card

```text
Fornecedores pendentes

3
```

---

# 49. Drill-down

```text
/suppliers?mappingStatus=PENDING
```

---

# 50. Pendências antigas

O desenho funcional explicitamente prevê:

```text
pendências antigas
```

---

# 51. Conceito

Precisamos definir:

```text
o que é uma pendência
```

e:

```text
quando ela se torna antiga
```

---

# 52. Possíveis fontes

Pendências podem incluir:

```text
Activity incompleta

ComplianceCheck pendente

System PENDING

Supplier PENDING

Review pendente
```

Não assumir todas automaticamente.

---

# 53. Nova questão — DASHQ-006

**Status:** OPEN  
**Priority:** CRITICAL

Quais entidades/estados entram em:

```text
Pendências
```

?

---

# 54. Idade

Exemplo conceitual:

```text
pendingSince
↓
currentDate - pendingSince
```

---

# 55. Problema

`updatedAt` não necessariamente representa quando a pendência começou.

---

# 56. Exemplo

Uma Activity pode estar pendente há 60 dias e receber alteração de descrição hoje.

Se usar:

```text
updatedAt
```

ela pareceria ter apenas:

```text
0 dias
```

de pendência.

---

# 57. Recomendação

Se "idade da pendência" for requisito real, o domínio deve possuir informação suficiente para determinar:

```text
quando o estado pendente começou
```

---

# 58. Nova questão — DASHQ-007

**Status:** OPEN  
**Priority:** CRITICAL

Como calcular:

```text
pendingSince
```

?

Possibilidades:

```text
data da transição para estado pendente

data de criação do ComplianceCheck

data de criação do recurso

AuditLog

campo explícito
```

---

# 59. Limite

Precisamos definir quando é "antiga".

---

# 60. Política central de antiguidade — DASHQ-008

**Status:** OPEN  
**Priority:** MEDIUM

Qual política classifica uma pendência como antiga? Os limiares serão comuns ou diferentes por recurso, fixos ou configuráveis por organização?

Nenhum valor de dias foi definido. DASHQ-007 determina o início da contagem. DEC-033 centraliza a antiguidade nesta questão; disparo de alerta/notificação é separado em WFQ-013. Systems e Suppliers referenciam a mesma política.

---

# 61. Lista de pendências

Além de cards, Dashboard pode possuir:

```text
Pendências antigas
```

com lista.

---

# 62. Exemplo

```text
Pendências antigas

Atividade                  Tipo                 Dias
----------------------------------------------------
Folha de pagamento         Compliance Gate      42
Sistema legado             Sistema              35
Fornecedor X               Fornecedor           31
```

---

# 63. Ordenação

Preferencialmente:

```text
mais antiga primeiro
```

se essa métrica estiver corretamente definida.

---

# 64. Drill-down de pendência

Cada item deve navegar para o recurso correspondente.

Exemplo:

```text
Activity
→ /activities/:id

System
→ /systems/:id

Supplier
→ /suppliers/:id
```

---

# 65. Tipo de pendência

Pode existir enum de read model:

```text
ACTIVITY

COMPLIANCE

SYSTEM

SUPPLIER

REVIEW
```

Não precisa necessariamente ser entidade persistida.

---

# 66. Dashboard Summary

Endpoint conceitual:

```http
GET /api/v1/dashboard
```

ou:

```http
GET /api/v1/dashboard/summary
```

---

# 67. Response conceitual

```json
{
  "data": {
    "mapping": {
      "completed": 72,
      "total": 100,
      "percentage": 72
    },
    "compliance": {
      "pending": 18,
      "blocked": 4
    },
    "sensitiveData": {
      "activities": 12
    },
    "minors": {
      "activities": 4
    },
    "internationalTransfers": {
      "activities": 7
    },
    "systems": {
      "pending": 5
    },
    "suppliers": {
      "pending": 3
    }
  }
}
```

Campos dependem das decisões finais.

---

# 68. Pendências endpoint

Pode existir:

```http
GET /api/v1/dashboard/pendencies
```

ou:

```http
GET /api/v1/dashboard/pending-items
```

---

# 69. Exemplo

```json
{
  "data": [
    {
      "type": "COMPLIANCE",
      "resourceId": "uuid",
      "resourceName": "Folha de pagamento",
      "pendingSince": "2026-07-01T10:00:00Z",
      "ageInDays": 42
    }
  ]
}
```

---

# 70. Não confiar em ageInDays persistido

Preferir calcular a idade a partir de uma data de referência confiável.

---

# 71. Filtros

Dashboard pode possuir filtros como:

```text
Business Unit

período?
```

---

# 72. Business Unit

Filtro mais diretamente alinhado ao domínio:

```text
businessUnitId
```

---

# 73. Período

Filtro temporal não deve ser adicionado automaticamente porque muitos cards representam:

```text
estado atual
```

e não eventos ocorridos em um período.

---

# 74. Nova questão — DASHQ-009

**Status:** OPEN  
**Priority:** LOW

Dashboard V1 precisa de filtro temporal?

Se sim, cada indicador deve definir sua semântica.

---

# 75. Exemplo do problema

Filtro:

```text
Últimos 30 dias
```

poderia significar:

```text
Activities criadas nos últimos 30 dias

Activities atualizadas nos últimos 30 dias

pendências surgidas nos últimos 30 dias
```

São métricas diferentes.

---

# 76. Atualização

Dashboard deve refletir estado atual suficientemente recente.

---

# 77. Não exigir realtime

V1 não precisa necessariamente de:

```text
WebSocket

Server-Sent Events
```

---

# 78. Cache

Pode ser introduzido somente se necessário.

---

# 79. Estratégia inicial

Para volume moderado:

```text
request
↓
queries agregadas
↓
response
```

pode ser suficiente.

---

# 80. Evitar N+1

Não calcular cada card fazendo loop sobre Activities e queries individuais.

---

# 81. Agregações

Preferir consultas agregadas apropriadas.

Exemplo conceitual:

```text
COUNT

GROUP BY

EXISTS
```

respeitando tenant e authorization scope.

---

# 82. Queries separadas

Não é obrigatório criar uma única query SQL gigantesca.

Pode haver queries especializadas por indicador.

---

# 83. Read Model

Pode existir:

```text
DashboardQueryService
```

na application/read layer.

---

# 84. Não colocar no domínio

Cálculos puramente de apresentação/agregação podem ficar em:

```text
query/read model
```

desde que utilizem regras de domínio existentes.

---

# 85. Cache futuro

Se métricas se tornarem caras:

```text
Redis
```

pode ser considerado.

---

# 86. Cache key

Deve incluir:

```text
organizationId

authorization scope

filters
```

quando aplicável.

---

# 87. Risco

Nunca usar apenas:

```text
dashboard:summary
```

como chave global.

Isso pode causar vazamento cross-tenant.

---

# 88. Invalidation

Se cache existir, mudanças relevantes precisam invalidá-lo.

Exemplos:

```text
Activity activated

Gate changed

System mapping completed

Supplier mapping completed

Activity archived
```

---

# 89. Frontend

Estrutura possível:

```text
features/
└── dashboard/
    ├── api/
    ├── components/
    ├── hooks/
    ├── pages/
    └── types/
```

---

# 90. Componentes

Possíveis:

```text
DashboardPage

MappingProgressCard

CompliancePendingCard

SensitiveDataCard

MinorsCard

InternationalTransferCard

PendingSystemsCard

PendingSuppliersCard

OldPendingItemsList

DashboardFilters
```

---

# 91. Evitar abstração precoce

Não criar um sistema genérico de:

```text
WidgetFactory
```

se existem apenas alguns cards conhecidos.

---

# 92. Card

Componente compartilhado simples pode ser suficiente:

```text
MetricCard
```

---

# 93. Card acessível

Card clicável deve possuir comportamento acessível por:

```text
teclado

foco

label
```

---

# 94. Não depender de cor

Exemplo:

```text
18 pendentes
```

deve conter texto/ícone além da cor.

---

# 95. Loading

Dashboard precisa distinguir:

```text
loading

success

empty

error
```

---

# 96. Loading parcial

Se API usar endpoints independentes, pode haver loading parcial.

Se summary for único, pode usar skeleton do conjunto.

---

# 97. Error

Não apresentar:

```text
0
```

quando houve falha na consulta.

---

# 98. Exemplo

Incorreto:

```text
Sistemas pendentes: 0
```

quando endpoint falhou.

Preferir:

```text
Não foi possível carregar este indicador.
```

---

# 99. Empty State

Se organização ainda não possui atividades:

```text
Nenhuma atividade de tratamento foi mapeada.
```

Pode oferecer ação conforme permission:

```text
Mapear primeira atividade
```

---

# 100. Zero válido

Se existem Activities mas nenhuma possui transferência internacional:

```text
Transferências internacionais
0
```

é um resultado válido.

---

# 101. Drill-down

Todo indicador que representa conjunto de recursos deve preferencialmente permitir navegar para os registros correspondentes.

---

# 102. Exemplo

```text
12 atividades com dados sensíveis
↓
clicar
↓
Activities filtradas
```

---

# 103. Preservar filtro

Destino deve receber filtro equivalente.

Pode ser via:

```text
query string
```

---

# 104. Exemplo

```text
/activities?hasSensitiveData=true
```

---

# 105. Segurança do filtro

Query string não substitui autorização.

Backend continua aplicando scope.

---

# 106. Dashboard e ROPA

Os dois podem compartilhar definições de:

```text
hasSensitiveData

hasMinorData

hasInternationalTransfer

complianceStatus
```

---

# 107. Regra

Não duplicar implementação semântica.

Exemplo:

```text
ActivityIndicatorsService
```

pode existir se tecnicamente útil.

Não é obrigatório criar esse serviço específico.

---

# 108. Mapeamento concluído

A definição deve existir em um único lugar lógico.

---

# 109. Pendência

A definição também deve ser reutilizável.

---

# 110. Atividade arquivada

Precisamos definir se entra em indicadores.

---

# 111. Recomendação conceitual

Indicadores de estado atual normalmente não deveriam considerar:

```text
ARCHIVED
```

mas isso precisa ser explicitamente decidido.

---

# 112. Nova questão — DASHQ-010

**Status:** OPEN  
**Priority:** CRITICAL

Activities `ARCHIVED` entram em quais métricas?

---

# 113. Activity UNDER_REVIEW

Se existe versão ACTIVE anterior e nova revisão:

```text
v1 ACTIVE
v2 UNDER_REVIEW
```

Dashboard precisa saber qual dimensão está medindo.

---

# 114. Exemplo

Para:

```text
dados sensíveis atualmente tratados
```

pode ser necessário considerar versão vigente.

Para:

```text
revisões pendentes
```

deve considerar revisão.

---

# 115. Regra

Não misturar:

```text
estado publicado
```

com:

```text
estado em revisão
```

---

# 116. Versionamento

Dashboard deve consumir a versão adequada para cada indicador.

---

# 117. Nova questão — DASHQ-011

**Status:** OPEN  
**Priority:** CRITICAL

Para métricas sobre conteúdo da Activity:

```text
qual versão deve ser considerada durante UNDER_REVIEW?
```

Idealmente alinhada com:

```text
ROPAQ
WFQ-008
```

---

# 118. Audit

Dashboard é majoritariamente leitura.

---

# 119. Visualização

Auditar cada acesso ao Dashboard pode gerar grande volume.

Não fazer automaticamente.

---

# 120. Nova questão — DASHQ-012

**Status:** OPEN  
**Priority:** LOW

A visualização do Dashboard precisa gerar AuditLog?

---

# 121. Drill-down

A navegação em si não precisa necessariamente ser evento de auditoria.

Ações posteriores seguem regras da feature correspondente.

---

# 122. Export Dashboard

O desenho funcional prevê exportação para ROPA, não necessariamente para Dashboard.

Não adicionar:

```text
Exportar Dashboard PDF
```

sem requisito.

---

# 123. Refresh

Pode existir:

```text
Atualizar
```

se UX considerar necessário.

TanStack Query pode revalidar automaticamente conforme configuração.

---

# 124. Auto-refresh

Não adicionar polling agressivo.

---

# 125. Mobile

Dashboard deve permanecer utilizável em telas menores.

Cards podem reorganizar:

```text
desktop → grid

mobile → stack
```

---

# 126. Desktop

Como aplicação corporativa, desktop provavelmente será uso importante.

Priorizar boa densidade de informação sem comprometer responsividade.

---

# 127. Performance target

Não definir SLA numérico sem requisito.

Mas evitar que cada card cause dezenas de queries desnecessárias.

---

# 128. Endpoint único vs múltiplos

Existem duas estratégias:

```text
GET /dashboard
```

retornando tudo

ou:

```text
GET /dashboard/mapping
GET /dashboard/compliance
GET /dashboard/pending-items
...
```

---

# 129. Nova questão — DASHQ-013

**Status:** OPEN  
**Priority:** LOW

Dashboard utilizará:

```text
endpoint agregado
```

ou:

```text
endpoints independentes
```

?

Decisão pode ser técnica.

---

# 130. Recomendação inicial

Para V1, um endpoint de:

```text
summary
```

e outro de:

```text
pending-items
```

é uma estrutura simples.

Não é decisão obrigatória.

---

# 131. Autorização

Permissions conceituais:

```text
dashboard:read
```

Possivelmente escopada por:

```text
BUSINESS_UNIT

ORGANIZATION
```

---

# 132. Não assumir Admin

ADMIN não deve automaticamente visualizar tudo se matriz final não conceder permission.

---

# 133. Backend

Controller deve ser fino:

```text
DashboardController
↓
DashboardQueryService
↓
Repositories / Read Models
```

---

# 134. Não colocar SQL no controller

Evitar:

```text
Controller
↓
ORM queries
↓
manual count
```

---

# 135. Tenant guard

Mesmo que `DashboardQueryService` receba:

```text
AuthenticatedContext
```

repositories/read queries precisam preservar tenant scope.

---

# 136. Cross-tenant test

Obrigatório.

---

# 137. Invariantes

## INV-DASH-001

```text
Dashboard é uma projeção.
```

## INV-DASH-002

```text
Dashboard não é fonte da verdade.
```

## INV-DASH-003

```text
Todo indicador respeita tenant isolation.
```

## INV-DASH-004

```text
Todo indicador respeita authorization scope.
```

## INV-DASH-005

```text
Falha de consulta não deve ser representada como zero.
```

## INV-DASH-006

```text
Sensitive Data não implica irregularidade.
```

## INV-DASH-007

```text
Menores não implicam automaticamente irregularidade.
```

## INV-DASH-008

```text
Transferência internacional deve ser derivada do domínio, não inferida pelo país do Supplier.
```

## INV-DASH-009

```text
System/Supplier PENDING não pode ser apresentado como MAPPED.
```

## INV-DASH-010

```text
Dashboard não deve misturar versões de uma Activity de forma inconsistente.
```

---

# 138. Error Codes

Como feature majoritariamente de leitura, erros específicos devem ser mínimos.

Possíveis:

```text
DASHBOARD_NOT_ALLOWED

DASHBOARD_INVALID_FILTER

BUSINESS_UNIT_NOT_ALLOWED
```

Erros técnicos seguem padrão global da API.

---

# 139. Teste — tenant

```text
Given:
Organization A possui 10 Activities

And:
Organization B possui 20 Activities

When:
User A consulta Dashboard

Then:
nenhuma métrica utiliza dados da Organization B
```

Teste crítico.

---

# 140. Teste — Business Unit

```text
Given:
Manager possui acesso somente ao RH

When:
consulta Dashboard

Then:
todos os indicadores respeitam RH
```

---

# 141. Teste — sensitive

```text
Given:
3 Activities vigentes possuem dados sensíveis

When:
Dashboard é consultado

Then:
indicador retorna 3
```

conforme regra de versão/status definida.

---

# 142. Teste — minors

```text
Given:
2 Activities envolvem menores

When:
Dashboard é consultado

Then:
indicador retorna 2
```

---

# 143. Teste — international

```text
Given:
4 Activities possuem InternationalTransfer registrada

When:
Dashboard é consultado

Then:
indicador retorna 4
```

---

# 144. Teste — Supplier estrangeiro

```text
Given:
Supplier possui country diferente do Brasil

And:
nenhuma InternationalTransfer está registrada

When:
Dashboard é consultado

Then:
Activity não é contada automaticamente como transferência internacional
```

---

# 145. Teste — Systems

```text
Given:
5 Systems PENDING

And:
8 Systems MAPPED

When:
Dashboard é consultado

Then:
pendingSystems = 5
```

---

# 146. Teste — Suppliers

```text
Given:
3 Suppliers PENDING

When:
Dashboard é consultado

Then:
pendingSuppliers = 3
```

---

# 147. Teste — mapping percentage

Após `DASHQ-002` e `DASHQ-003`:

```text
Given:
universo conhecido

And:
quantidade completa conhecida

When:
Dashboard é consultado

Then:
percentage segue exatamente fórmula aprovada
```

---

# 148. Teste — zero

```text
Given:
nenhuma Activity possui dados sensíveis

When:
consulta é concluída com sucesso

Then:
sensitiveActivities = 0
```

---

# 149. Teste — error

```text
Given:
consulta falha

When:
frontend recebe erro

Then:
não apresenta 0 como resultado válido
```

---

# 150. Teste — pending age

Após definição:

```text
Given:
pendência iniciou há 35 dias

And:
recurso foi atualizado ontem sem resolver a pendência

When:
idade é calculada

Then:
continua representando início real da pendência
```

---

# 151. Teste — archived

Após `DASHQ-010`:

```text
Given:
Activity ARCHIVED

When:
Dashboard é calculado

Then:
cada indicador segue regra aprovada para archived
```

---

# 152. Teste — version

```text
Given:
Activity possui versão vigente

And:
nova versão UNDER_REVIEW

When:
Dashboard calcula indicador de conteúdo

Then:
não mistura dados das duas versões
```

---

# 153. Teste — drill-down

```text
Given:
card indica 12 Activities sensíveis

When:
usuário abre drill-down

Then:
lista correspondente respeita o mesmo conceito

And:
authorization permanece aplicada
```

---

# 154. Teste — consistência ROPA

Quando métricas compartilharem conceito:

```text
Given:
Activity é classificada como hasSensitiveData

When:
ROPA e Dashboard são consultados

Then:
ambos utilizam a mesma definição
```

---

# 155. Teste — permission

```text
Given:
User não possui dashboard:read

When:
GET /dashboard

Then:
backend rejeita
```

---

# 156. Teste — cache cross-tenant

Se cache for introduzido:

```text
Given:
Dashboard A foi cacheado

When:
Organization B consulta Dashboard

Then:
cache A nunca é retornado
```

Teste crítico.

---

# 157. Open Questions relacionadas

```text
AUTHQ-004 — matriz de acesso

WFQ-008 — Activity em revisão

BRQ-010 — novos Systems/Suppliers

SYSQ-002 — System MAPPED

SYSQ-007 — impacto de System PENDING

DASHQ-008 — pendência antiga de System

SUPQ-002 — Supplier MAPPED

SUPQ-006 — impacto de Supplier PENDING

DASHQ-008 — pendência antiga de Supplier

ROPAQ-002 — status no ROPA

ROPAQ-003 — última atualização

CGQ — regras do Compliance Gate
```

---

# 158. Questões específicas

```text
DASHQ-001
Quem acessa Dashboard

DASHQ-002
Fórmula do percentual de mapeamento

DASHQ-003
Universo do percentual

DASHQ-004
PENDING vs BLOCKED

DASHQ-005
Transferências com revisão pendente

DASHQ-006
Definição de pendência

DASHQ-007
pendingSince

DASHQ-008
Threshold de pendência antiga

DASHQ-009
Filtro temporal

DASHQ-010
Activities ARCHIVED

DASHQ-011
Versão considerada durante revisão

DASHQ-012
Audit de visualização

DASHQ-013
Estratégia de endpoints
```

As definições canônicas dessas questões estão em:

```text
12-OPEN-QUESTIONS.md
```

---

# 159. Critérios de aceite

```text
AC-DASH-001

Given:
DPO autorizado

When:
acessa Dashboard

Then:
visualiza indicadores do tenant ativo
```

```text
AC-DASH-002

Given:
usuário possui escopo limitado

When:
Dashboard é carregado

Then:
nenhuma métrica utiliza recursos fora do escopo
```

```text
AC-DASH-003

Given:
Activities com dados sensíveis

When:
Dashboard é calculado

Then:
indicador utiliza classificação do domínio
```

```text
AC-DASH-004

Given:
Activities envolvendo menores

When:
Dashboard é calculado

Then:
indicador utiliza classificação dos titulares
```

```text
AC-DASH-005

Given:
InternationalTransfers registradas

When:
Dashboard é calculado

Then:
indicador considera as Activities aplicáveis
```

```text
AC-DASH-006

Given:
Systems PENDING

When:
Dashboard é consultado

Then:
quantidade pendente é apresentada
```

```text
AC-DASH-007

Given:
Suppliers PENDING

When:
Dashboard é consultado

Then:
quantidade pendente é apresentada
```

```text
AC-DASH-008

Given:
indicador possui registros associados

When:
usuário executa drill-down

Then:
é direcionado para visão correspondente filtrada
```

```text
AC-DASH-009

Given:
falha técnica

When:
indicador não pode ser calculado

Then:
frontend não apresenta zero como resultado
```

```text
AC-DASH-010

Given:
duas Organizations diferentes

When:
Dashboards são consultados

Then:
não ocorre vazamento de métricas entre tenants
```

---

# 160. Definition of Done

A feature Dashboard está concluída quando aplicável:

```text
[ ] público autorizado definido

[ ] authorization scope definido

[ ] fórmula de % mapeado definida

[ ] universo da métrica definido

[ ] Activities ARCHIVED tratadas

[ ] versionamento tratado

[ ] card de mapeamento implementado

[ ] Compliance PENDING implementado

[ ] Compliance BLOCKED tratado

[ ] indicador de dados sensíveis implementado

[ ] indicador de menores implementado

[ ] indicador de transferência internacional implementado

[ ] indicador de Systems PENDING implementado

[ ] indicador de Suppliers PENDING implementado

[ ] definição de pendência implementada

[ ] pendingSince definido

[ ] pendências antigas implementadas

[ ] drill-down implementado

[ ] filtros implementados quando aplicáveis

[ ] tenant isolation implementado

[ ] frontend implementado

[ ] API/read model implementado

[ ] estados loading/empty/error implementados

[ ] performance validada

[ ] cache seguro se necessário

[ ] testes unitários

[ ] testes de integração

[ ] testes de autorização

[ ] testes cross-tenant

[ ] testes de consistência com ROPA

[ ] testes E2E críticos

[ ] documentação atualizada
```

---

# 161. Regra para agentes de IA

Antes de alterar Dashboard, consultar:

```text
02-DOMAIN.md

04-AUTHORIZATION.md

05-BUSINESS-RULES.md

06-WORKFLOWS.md

07-API.md

08-FRONTEND.md

12-OPEN-QUESTIONS.md

features/PROCESSING-ACTIVITY.md

features/COMPLIANCE-GATE.md

features/ROPA.md

features/SYSTEMS.md

features/SUPPLIERS.md

features/DASHBOARD.md
```

---

# 162. Não decidir silenciosamente

Especialmente:

```text
DASHQ-002

DASHQ-003

DASHQ-006

DASHQ-007

DASHQ-010

DASHQ-011
```

precisam estar resolvidas antes que agentes de IA implementem comportamento definitivo correspondente.

---

# 163. Regra final

O Dashboard deve responder rapidamente:

```text
Quanto do mapeamento está concluído?

Quais atividades ainda possuem pendências?

Quais pendências estão abertas há mais tempo?

Quais atividades envolvem dados sensíveis?

Quais envolvem menores?

Quais possuem transferência internacional?

Existem sistemas ainda não mapeados?

Existem fornecedores ainda não mapeados?

Quais itens precisam de atenção?
```

O Dashboard não deve tentar responder automaticamente:

```text
"A empresa está em conformidade com a LGPD?"
```

O produto apresenta:

```text
estado do mapeamento

informações registradas

verificações estruturadas

pendências
```

sem transformar indicadores técnicos em certificação jurídica.

---

# 164. Fim do conjunto inicial de features

Com este documento, o conjunto inicialmente previsto em:

```text
docs/features/
```

fica coberto:

```text
AUTH.md

ORGANIZATIONS.md

PROCESSING-ACTIVITY.md

MAPPING-WIZARD.md

COMPLIANCE-GATE.md

ROPA.md

SYSTEMS.md

SUPPLIERS.md

DASHBOARD.md
```

O próximo passo recomendado é revisar e consolidar as novas questões `PAQ`, `MWQ`, `CGQ`, `ROPAQ`, `SYSQ`, `SUPQ` e `DASHQ` dentro de:

```text
docs/12-OPEN-QUESTIONS.md
```

antes de iniciar a implementação assistida por IA.