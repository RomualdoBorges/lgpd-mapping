# Feature — ROPA

> **Feature:** ROPA — Registro das Operações de Tratamento  
> **Status:** Draft  
> **Módulo:** Compliance / Reporting  
> **Documentos relacionados:** `00-PROJECT.md`, `02-DOMAIN.md`, `03-DATABASE.md`, `04-AUTHORIZATION.md`, `05-BUSINESS-RULES.md`, `06-WORKFLOWS.md`, `07-API.md`, `08-FRONTEND.md`, `09-SECURITY.md`, `10-AUDIT.md`, `11-TESTING.md`, `12-OPEN-QUESTIONS.md`, `features/PROCESSING-ACTIVITY.md`, `features/MAPPING-WIZARD.md`, `features/COMPLIANCE-GATE.md`


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

# 1. Objetivo

ROPA representa o:

```text
Registro das Operações de Tratamento
```

da organização.

Na plataforma, o ROPA deve ser produzido automaticamente a partir das:

```text
ProcessingActivities
```

mapeadas.

Fluxo conceitual:

```text
Processing Activities
        ↓
Versionamento
        ↓
Versões vigentes
        ↓
Dados relacionados
        ↓
Compliance Gate
        ↓
ROPA Projection
```

---

# 2. Princípio principal

ROPA não deve ser um segundo formulário preenchido manualmente.

Evitar:

```text
Usuário preenche Activity
↓
Usuário abre ROPA
↓
Usuário preenche novamente os mesmos dados
```

O correto é:

```text
Usuário mapeia Activity
↓
Sistema deriva ROPA
```

---

# 3. Fonte da verdade

A fonte da verdade permanece:

```text
ProcessingActivity

ActivityVersion

Purposes

PersonalData

DataSubjects

ProcessingOperations

Recipients

Systems

Suppliers

Retention

SecurityMeasures

LegalBases

InternationalTransfers

ComplianceChecks
```

ROPA é uma:

```text
projection
```

ou:

```text
read model
```

sobre essas informações.

---

# 4. Não duplicar estado

Não criar tabela:

```text
ropa
```

com cópia manual permanente de todos os campos das atividades, salvo se uma necessidade técnica futura justificar materialização controlada.

---

# 5. Materialized View

Futuramente, por performance, pode existir:

```text
Materialized View
```

ou:

```text
projection table
```

Mas isso continua sendo uma representação derivada.

Não se torna nova fonte da verdade.

---

# 6. Unidade do ROPA

Conceitualmente, cada linha representa uma:

```text
ProcessingActivity
```

ou sua versão vigente.

Exemplo:

```text
Processamento da folha de pagamento
```

↓

```text
1 registro lógico no ROPA
```

---

# 7. Cardinalidade

Caso uma atividade possua múltiplas:

```text
Purposes

LegalBases

Recipients

PersonalDataCategories
```

a apresentação precisa suportar múltiplos valores sem perder informação.

---

# 8. Não duplicar linha sem regra

Evitar automaticamente:

```text
1 atividade
×
3 finalidades
×
4 dados
×
2 bases legais
=
24 linhas
```

sem uma decisão funcional explícita.

---

# 9. Nova questão — ROPAQ-001

**Status:** OPEN  
**Priority:** HIGH

Qual será a granularidade de uma linha do ROPA?

Possibilidades:

```text
1 linha por atividade

1 linha por atividade + finalidade

1 linha por atividade + finalidade + base legal

ou outro modelo
```

A decisão depende também de:

```text
DQ-002
DQ-003
DQ-004
```

---

# 10. Versão utilizada

ROPA deve refletir a versão considerada:

```text
vigente
```

da atividade.

---

# 11. Atividade ACTIVE

Modelo esperado:

```text
ProcessingActivity
ACTIVE
Version 3
↓
ROPA usa Version 3
```

---

# 12. Atividade em revisão

Exemplo:

```text
Version 1
ACTIVE

Version 2
UNDER_REVIEW
```

A regra proposta é que o ROPA continue refletindo:

```text
Version 1
```

até a nova versão ser aprovada/ativada.

Essa decisão ainda depende de:

```text
WFQ-008
```

---

# 13. Regra crítica

ROPA nunca deve misturar:

```text
parte da Version 1
```

com:

```text
parte da Version 2
```

na mesma projeção lógica.

---

# 14. Snapshot consistente

Ao gerar ROPA, os dados devem representar estado consistente da versão escolhida.

---

# 15. Atividades incluídas

Precisamos definir quais status aparecem no ROPA oficial.

Candidatos:

```text
ACTIVE
```

e possivelmente:

```text
ARCHIVED
```

somente em visualização histórica.

---

# 16. DRAFT

Atividades:

```text
DRAFT
```

não devem aparecer como registros oficiais do ROPA sem decisão explícita.

---

# 17. MAPPING

Atividades:

```text
MAPPING
```

podem aparecer em visão administrativa de pendências, mas não necessariamente no ROPA oficial.

---

# 18. Nova questão — ROPAQ-002

**Status:** OPEN  
**Priority:** HIGH

Quais status entram no:

```text
ROPA oficial
```

?

Proposta inicial:

```text
ACTIVE
```

apenas.

Mas a decisão deve ser funcionalmente aprovada.

---

# 19. ROPA operacional vs oficial

Pode ser útil distinguir:

```text
ROPA Current
```

e:

```text
Mapping Overview
```

O segundo pode mostrar drafts e pendências.

Não misturar os dois conceitos.

---

# 20. Informações previstas

O desenho funcional prevê informações como:

```text
área

atividade

finalidade

dados pessoais

titulares

base legal

status do Gate

última atualização
```

além dos elementos necessários ao registro completo.

---

# 21. Estrutura conceitual

Uma projeção pode conter:

```text
activityId

activityName

businessUnit

purposes

personalDataCategories

dataSubjectCategories

collectionSources

processingOperations

systems

recipients

suppliers

internationalTransfers

retention

securityMeasures

legalBases

complianceStatus

lastUpdatedAt

version
```

A lista definitiva depende das decisões de domínio.

---

# 22. Identificador

ROPA deve preservar referência à:

```text
ProcessingActivity.id
```

para navegação interna e rastreabilidade.

---

# 23. Nome da atividade

Campo:

```text
activityName
```

Exemplo:

```text
Processamento da folha de pagamento
```

---

# 24. Área

Campo derivado de:

```text
BusinessUnit
```

Exemplo:

```text
Recursos Humanos
```

---

# 25. Finalidade

Derivada de:

```text
Purpose
```

Exemplo:

```text
Realizar cálculo e pagamento da remuneração.
```

---

# 26. Múltiplas finalidades

Se `DQ-004` permitir múltiplas:

```text
purposes[]
```

ROPA precisa representá-las corretamente.

---

# 27. Dados pessoais

Derivados de:

```text
PersonalDataCategory
```

e futuramente possivelmente:

```text
PersonalDataItem
```

---

# 28. Exemplo

```text
Identificação

Financeiro

Dados profissionais
```

---

# 29. Dados sensíveis

ROPA deve permitir identificar atividades contendo dados classificados como sensíveis.

Pode apresentar indicador:

```text
Dados sensíveis
```

---

# 30. Indicador

Não precisa duplicar manualmente:

```text
hasSensitiveData
```

se puder ser derivado de forma eficiente e consistente.

Pode existir campo derivado/cache se necessário por performance.

---

# 31. Titulares

Derivados de:

```text
DataSubjectCategory
```

Exemplo:

```text
Funcionários

Dependentes
```

---

# 32. Menores

ROPA deve permitir identificar atividades envolvendo menores.

Pode apresentar indicador:

```text
Envolve menores
```

---

# 33. Fonte de coleta

Pode ser apresentada quando fizer parte do relatório desejado.

Exemplo:

```text
Sistema de RH

Contrato

Formulário
```

---

# 34. Operações

ROPA pode representar operações:

```text
USE

UPDATE

INTERNAL_TRANSFER

EXTERNAL_TRANSFER

INTERNATIONAL_TRANSFER

DELETE
```

com labels localizadas na interface/exportação.

---

# 35. Sistemas

Sistemas relacionados podem ser derivados das associações da atividade.

Exemplo:

```text
Sistema interno de RH
```

---

# 36. Fornecedores

Fornecedores relacionados podem ser derivados de:

```text
Recipients

ProcessingOperations

ou relações aprovadas
```

---

# 37. Destinatários

Derivados de:

```text
Recipient
```

Exemplo:

```text
Financeiro

Operador de folha

Autoridade pública
```

---

# 38. Transferência internacional

Quando existente, ROPA deve indicar:

```text
existência

país(es) de destino

mecanismo registrado
```

conforme campos disponíveis.

---

# 39. Não interpretar juridicamente

ROPA apenas apresenta mecanismo registrado.

Não deve afirmar automaticamente:

```text
"Transferência internacional regular"
```

---

# 40. Retenção

Derivada de:

```text
RetentionPolicy
```

Exemplo:

```text
5 anos após término do contrato
```

---

# 41. Segurança

Medidas de segurança podem ser apresentadas.

Exemplo:

```text
Controle de acesso

Criptografia

Backup
```

---

# 42. Base legal

Derivada de:

```text
LegalBasis
```

---

# 43. Cardinalidade da base

A apresentação depende de:

```text
DQ-002
DQ-003
```

---

# 44. Consentimento

Se a base estiver relacionada a consentimento, ROPA pode apresentar referência apropriada.

Não incluir aceites individuais na V1.

---

# 45. Compliance

ROPA deve apresentar status do Gate.

Exemplos:

```text
COMPLETE

PENDING

BLOCKED
```

---

# 46. Label

Frontend pode traduzir:

```text
COMPLETE
→ Verificações concluídas

PENDING
→ Verificações pendentes

BLOCKED
→ Bloqueado
```

Labels finais devem seguir UX aprovada.

---

# 47. Não usar "Conforme LGPD"

Evitar transformar:

```text
COMPLETE
```

em:

```text
Conforme LGPD
```

porque o Gate não representa certificação jurídica.

---

# 48. Última atualização

ROPA deve mostrar:

```text
lastUpdatedAt
```

ou data equivalente da versão vigente.

---

# 49. Data da versão

Pode ser útil diferenciar:

```text
Activity updatedAt
```

de:

```text
publishedVersionAt
```

A semântica precisa ser definida.

---

# 50. Nova questão — ROPAQ-003

**Status:** OPEN  
**Priority:** MEDIUM

A coluna:

```text
Última atualização
```

representa:

```text
última alteração técnica?

última versão publicada?

última revisão aprovada?
```

?

---

# 51. Versão

Pode apresentar:

```text
v1

v2

v3
```

para rastreabilidade.

---

# 52. ROPA Current

Endpoint conceitual:

```http
GET /api/v1/ropa
```

---

# 53. Response

Exemplo conceitual:

```json
{
  "data": [
    {
      "activityId": "uuid",
      "activityName": "Processamento da folha de pagamento",
      "businessUnit": {
        "id": "uuid",
        "name": "Recursos Humanos"
      },
      "purposes": [
        "Processar a remuneração dos funcionários"
      ],
      "personalDataCategories": [
        "Identificação",
        "Financeiro"
      ],
      "dataSubjectCategories": [
        "Funcionários"
      ],
      "hasSensitiveData": false,
      "hasMinorData": false,
      "hasInternationalTransfer": false,
      "legalBases": [
        "LEGAL_OBLIGATION"
      ],
      "complianceStatus": "COMPLETE",
      "version": 2,
      "lastUpdatedAt": "2026-08-20T14:30:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 53,
    "totalPages": 3
  }
}
```

---

# 54. API projection

Response de ROPA não precisa reproduzir exatamente entidades internas.

Pode possuir DTO específico:

```text
RopaEntryDto
```

---

# 55. Benefício

Isso evita acoplamento do frontend à estrutura física do banco.

---

# 56. Filtros

Filtros previstos/evolutivos:

```text
businessUnitId

complianceStatus

hasSensitiveData

hasMinorData

hasInternationalTransfer

search
```

---

# 57. Filtro por área

Exemplo:

```text
Área:
Recursos Humanos
```

---

# 58. Filtro por Gate

Exemplo:

```text
Verificações:
Pendentes
```

---

# 59. Filtro sensíveis

```text
Somente atividades com dados sensíveis
```

---

# 60. Filtro menores

```text
Somente atividades envolvendo menores
```

---

# 61. Filtro internacional

```text
Somente atividades com transferência internacional
```

---

# 62. Busca

Busca pode considerar inicialmente:

```text
activityName
```

Evoluções podem incluir:

```text
purpose

system

supplier
```

se necessário.

---

# 63. Paginação

ROPA deve ser paginado na interface.

Exemplo:

```text
page=1
pageSize=20
```

---

# 64. Ordenação

Pode suportar:

```text
activityName

businessUnit

lastUpdatedAt
```

conforme API aprovada.

---

# 65. Frontend

Rota:

```text
/ropa
```

---

# 66. Layout

Exemplo:

```text
ROPA — Registro das Operações de Tratamento

[Filtros]                         [Exportar]

┌───────────────────────────────────────────────┐
│ Atividade │ Área │ Dados │ Gate │ Atualização│
├───────────────────────────────────────────────┤
│ Folha     │ RH   │ ...   │ ...  │ ...        │
└───────────────────────────────────────────────┘
```

---

# 67. Tabela larga

ROPA possui muitas informações.

Não tentar colocar obrigatoriamente todas em colunas simultâneas.

---

# 68. Estratégia recomendada

Tabela principal pode mostrar resumo:

```text
Atividade

Área

Dados

Indicadores

Gate

Atualização
```

e permitir:

```text
expandir

abrir detalhe
```

---

# 69. Detalhe

Ao clicar em uma atividade:

```text
/activities/:id
```

ou drawer/modal de resumo pode apresentar informações completas.

Preferir navegação consistente com Activity Detail.

---

# 70. Badges

Possíveis indicadores:

```text
Sensível

Menores

Transferência internacional
```

---

# 71. Não usar apenas cor

Cada badge precisa possuir texto.

---

# 72. Compliance visual

Exemplo:

```text
✓ Verificações concluídas

! Pendentes

✕ Bloqueado
```

Sem depender exclusivamente da cor.

---

# 73. Exportação

O desenho funcional prevê:

```text
PDF

Excel
```

---

# 74. API

Possível:

```http
POST /api/v1/ropa/export
```

---

# 75. Request

Exemplo:

```json
{
  "format": "XLSX",
  "filters": {
    "businessUnitId": "uuid",
    "complianceStatus": "COMPLETE"
  }
}
```

---

# 76. Formatos

Inicialmente:

```text
PDF

XLSX
```

---

# 77. Exportação e filtros

Se usuário exportar ROPA filtrado, export deve respeitar os mesmos filtros selecionados quando essa for a UX aprovada.

---

# 78. Nova questão — ROPAQ-004

**Status:** OPEN  
**Priority:** MEDIUM

Exportação deve ser:

```text
sempre ROPA completo
```

ou:

```text
respeitar filtros atuais
```

ou permitir ambos?

---

# 79. Excel

Excel deve utilizar colunas estáveis e legíveis.

Exemplo conceitual:

```text
Atividade

Área

Finalidade

Dados pessoais

Titulares

Operações

Destinatários

Transferência internacional

Retenção

Segurança

Base legal

Gate

Versão

Última atualização
```

---

# 80. Arrays no Excel

Campos múltiplos podem ser representados como:

```text
Identificação; Financeiro; Saúde
```

ou outra convenção documentada.

Não gerar múltiplas linhas inadvertidamente sem regra.

---

# 81. Excel e códigos

Preferir labels legíveis:

```text
Obrigação legal
```

em vez de:

```text
LEGAL_OBLIGATION
```

na exportação para usuário.

---

# 82. PDF

PDF deve ser adequado para:

```text
leitura

compartilhamento autorizado

registro
```

---

# 83. PDF extenso

Como ROPA pode possuir muitas atividades, PDF deve suportar:

```text
paginação

cabeçalhos repetidos

quebra adequada

metadata da geração
```

---

# 84. Metadata do export

Pode incluir:

```text
Organization

GeneratedAt

GeneratedBy

Filters

Version/criteria
```

conforme regras aprovadas.

---

# 85. Sensibilidade do documento

Export do ROPA pode conter informações internas relevantes.

Deve ser tratado como documento protegido.

---

# 86. Autorização de export

Não assumir que:

```text
ropa:read
```

implica automaticamente:

```text
ropa:export
```

Pode existir permission separada.

---

# 87. Permission

Possíveis:

```text
ropa:read

ropa:export
```

---

# 88. Escopo

ROPA pode respeitar:

```text
BUSINESS_UNIT
```

ou:

```text
ORGANIZATION
```

conforme papel.

---

# 89. Collaborator

Pode não possuir acesso ao ROPA completo da organização.

Regra definitiva depende de:

```text
AUTHQ-004
```

---

# 90. Manager

Pode possuir visão:

```text
BUSINESS_UNIT
```

conforme matriz final.

---

# 91. DPO

Pode possuir visão:

```text
ORGANIZATION
```

conforme proposta atual.

---

# 92. ADMIN

Acesso administrativo não deve automaticamente conceder ROPA se matriz decidir separar funções.

---

# 93. Tenant Isolation

Toda consulta deve respeitar:

```text
AuthenticatedContext.organizationId
```

---

# 94. Regra crítica

Nunca implementar:

```sql
SELECT *
FROM processing_activities
WHERE status = 'ACTIVE';
```

sem escopo de organização.

Conceitualmente deve existir:

```text
organization_id = current organization
```

em toda consulta aplicável.

---

# 95. Export cross-tenant

Exportação também precisa respeitar tenant.

Não basta proteger apenas a tela.

---

# 96. IDOR

Se export usar:

```text
jobId
```

ou:

```text
fileId
```

download também precisa validar tenant e permission.

---

# 97. Export síncrono

Para relatórios pequenos:

```text
request
↓
generate
↓
response
```

pode ser suficiente.

---

# 98. Export assíncrono

Para relatórios grandes:

```text
request
↓
job
↓
queue
↓
file
↓
authorized download
```

pode ser mais adequado.

---

# 99. Decisão

Relacionado:

```text
APIQ-006
```

Não adicionar fila apenas por antecipação.

---

# 100. Arquivo temporário

Se export gerar arquivo em object storage, deve existir política de expiração.

---

# 101. Nova questão — ROPAQ-005

**Status:** OPEN  
**Priority:** MEDIUM

Exports gerados serão:

```text
streamed e descartados
```

ou:

```text
armazenados temporariamente
```

?

Se armazenados:

```text
por quanto tempo?
```

---

# 102. Nome do arquivo

Exemplo:

```text
ropa-2026-08-20.xlsx
```

Pode incluir nome sanitizado da organização se aprovado.

---

# 103. Não expor informação em filename

Evitar nomes contendo informações excessivamente sensíveis.

---

# 104. Audit — visualização

Precisamos decidir se toda visualização do ROPA será auditada.

Isso pode gerar alto volume.

---

# 105. Exportação

Export deve ser auditável.

Evento:

```text
ROPA_EXPORTED
```

---

# 106. Metadata

Exemplo:

```json
{
  "format": "XLSX",
  "filtersApplied": true
}
```

Não registrar conteúdo inteiro do relatório no audit.

---

# 107. Download

Se arquivo temporário for armazenado, download pode também ser auditado se requisito exigir.

---

# 108. Nova questão — ROPAQ-006

**Status:** OPEN  
**Priority:** LOW

Registrar audit de:

```text
cada visualização
```

do ROPA?

Ou apenas:

```text
exportações
```

e ações relevantes?

---

# 109. Histórico

ROPA atual e ROPA histórico são conceitos diferentes.

---

# 110. ROPA atual

Representa:

```text
versões vigentes agora
```

---

# 111. Histórico

Pode permitir consulta:

```text
como o ROPA estava em determinada data
```

Isso exige versionamento consistente.

---

# 112. Não prometer histórico sem dados

Só é possível reconstruir ROPA histórico se:

```text
ActivityVersion

relações versionadas/snapshot

datas de vigência
```

forem suficientes.

---

# 113. Possível endpoint futuro

```http
GET /api/v1/ropa/history
```

ou:

```http
GET /api/v1/ropa?asOf=2026-01-01
```

Não implementar até requisito ser aprovado.

---

# 114. Nova questão — ROPAQ-007

**Status:** OPEN  
**Priority:** MEDIUM

V1 precisa permitir:

```text
ROPA histórico por data
```

ou apenas:

```text
ROPA atual
```

?

---

# 115. Arquivadas

Atividade arquivada pode permanecer disponível em histórico.

Não deve necessariamente aparecer no ROPA atual.

---

# 116. Dashboard

ROPA e Dashboard compartilham dados derivados das atividades.

Evitar duas regras diferentes para determinar:

```text
atividade sensível

atividade com menor

atividade internacional

Gate completo
```

---

# 117. Serviço compartilhado

Pode existir camada de query/read model reutilizável.

Não significa necessariamente um serviço técnico separado.

---

# 118. Performance

ROPA pode crescer para centenas ou milhares de atividades.

Consultas devem evitar:

```text
N+1
```

---

# 119. Paginação server-side

Não carregar todas as atividades no browser apenas para paginar localmente.

---

# 120. Filtros server-side

Filtros relevantes devem ser aplicados no backend.

---

# 121. Export

Export completo não deve depender de:

```text
dados já carregados na tabela do frontend
```

Backend deve gerar a partir da fonte autorizada.

---

# 122. Índices

Banco pode precisar de índices para:

```text
organization_id

status

business_unit_id

compliance_status

updated_at
```

e relações usadas nos filtros.

---

# 123. Materialização

Só introduzir:

```text
materialized view

cache

projection table
```

se métricas mostrarem necessidade.

---

# 124. Cache

Se houver cache:

```text
tenant
```

deve fazer parte da chave.

---

# 125. Cache invalidation

Alteração em Activity publicada precisa invalidar projeção/cache correspondente.

Não implementar cache sem estratégia de invalidação.

---

# 126. Empty State

Quando não houver atividades:

```text
Nenhuma atividade disponível no ROPA.
```

Pode orientar:

```text
Mapeie e conclua uma atividade de tratamento para que ela apareça aqui.
```

conforme regra de inclusão definida.

---

# 127. Filter Empty State

Quando filtro não encontrar resultado:

```text
Nenhum registro encontrado para os filtros selecionados.
```

---

# 128. Loading

Tabela deve possuir estado de loading apropriado.

---

# 129. Error

Erro ao carregar ROPA não deve ser apresentado como:

```text
ROPA vazio
```

Estados:

```text
empty

loading

error

success
```

devem ser distintos.

---

# 130. Export Loading

Durante geração:

```text
Gerando arquivo...
```

Se assíncrono:

```text
Exportação em processamento
```

---

# 131. Export Failure

Falha técnica não deve gerar arquivo incompleto como se fosse válido.

---

# 132. Data consistency

Se exportação envolver muitas atividades e alterações ocorrerem durante geração, precisamos definir consistência.

Possibilidades:

```text
read committed

transaction snapshot

published versions captured at start
```

---

# 133. Nova questão — ROPAQ-008

**Status:** OPEN  
**Priority:** MEDIUM

Export deve representar snapshot consistente do instante de geração?

Recomendação:

```text
sim
```

especialmente para relatórios oficiais.

---

# 134. GeneratedAt

Export deve registrar:

```text
generatedAt
```

para deixar claro quando a informação foi produzida.

---

# 135. Timezone

Persistência:

```text
UTC
```

Apresentação:

```text
timezone configurado/aplicável
```

conforme arquitetura.

---

# 136. Internacionalização

V1:

```text
pt-BR
```

A API deve continuar usando códigos estáveis.

---

# 137. Datas

Interface pt-BR:

```text
20/08/2026
```

API:

```text
2026-08-20T14:30:00Z
```

---

# 138. Segurança — conteúdo

ROPA pode revelar:

```text
sistemas internos

fornecedores

fluxos de dados

medidas de segurança

transferências
```

Portanto não deve possuir URL pública.

---

# 139. Signed URL

Se export usar signed URL:

```text
curta duração

escopo restrito

arquivo não público
```

conforme `09-SECURITY.md`.

---

# 140. Logs

Não registrar conteúdo completo do ROPA em logs técnicos.

---

# 141. Analytics

Não enviar conteúdo das atividades para ferramentas de analytics sem necessidade e aprovação.

---

# 142. Frontend query

Exemplo conceitual:

```text
useRopa({
  page,
  pageSize,
  filters,
  sort
})
```

---

# 143. Query Key

Deve considerar contexto relevante.

Exemplo conceitual:

```text
[
  'ropa',
  organizationContext,
  filters,
  page,
  pageSize,
  sort
]
```

---

# 144. Server State

Dados do ROPA pertencem a:

```text
TanStack Query
```

ou mecanismo equivalente de server state.

Não duplicar todo ROPA em Zustand.

---

# 145. Mutations

ROPA atual é essencialmente:

```text
read-only
```

Alterações devem ocorrer na:

```text
ProcessingActivity
```

---

# 146. Corrigir informação

Se usuário encontrar erro:

```text
ROPA
↓
Abrir Activity
↓
Editar/Revisar Activity
↓
Workflow
↓
Nova projeção ROPA
```

---

# 147. Não editar célula diretamente

Evitar edição inline do ROPA que bypassa:

```text
workflow

versionamento

Gate

audit
```

---

# 148. Invariantes

## INV-ROPA-001

```text
ROPA é derivado das atividades.
```

## INV-ROPA-002

```text
ROPA não é fonte primária de dados.
```

## INV-ROPA-003

```text
ROPA respeita tenant isolation.
```

## INV-ROPA-004

```text
ROPA não mistura versões diferentes da mesma atividade.
```

## INV-ROPA-005

```text
Exportação respeita autorização.
```

## INV-ROPA-006

```text
Exportação não pode ampliar escopo do usuário.
```

## INV-ROPA-007

```text
Compliance COMPLETE não deve ser rotulado automaticamente como conformidade jurídica LGPD.
```

## INV-ROPA-008

```text
Alterações no ROPA são realizadas através da fonte de domínio.
```

## INV-ROPA-009

```text
ROPA histórico depende de versões preservadas.
```

## INV-ROPA-010

```text
Arquivamento de atividade não destrói histórico necessário.
```

---

# 149. Teste — projeção

```text
Given:
atividade ACTIVE válida para ROPA

When:
ROPA é consultado

Then:
atividade aparece conforme regra de inclusão
```

---

# 150. Teste — draft

Após definição `ROPAQ-002`:

```text
Given:
atividade DRAFT

When:
ROPA oficial é consultado

Then:
atividade segue exatamente regra definida para drafts
```

---

# 151. Teste — versão

```text
Given:
Activity v1 ACTIVE

And:
v2 UNDER_REVIEW

When:
ROPA atual é consultado

Then:
nenhum campo de v2 é misturado com v1
```

---

# 152. Teste — nova versão

```text
Given:
v2 é aprovada e se torna vigente

When:
ROPA é consultado

Then:
projeção passa a utilizar v2
```

---

# 153. Teste — tenant

```text
Given:
Organization A possui 10 atividades

And:
Organization B possui 20 atividades

When:
User da Organization A consulta ROPA

Then:
nenhuma atividade da Organization B é retornada
```

Teste crítico.

---

# 154. Teste — filtro área

```text
Given:
ROPA possui atividades de RH e Financeiro

When:
businessUnitId = RH

Then:
somente atividades autorizadas de RH são retornadas
```

---

# 155. Teste — sensíveis

```text
Given:
atividades sensíveis e não sensíveis

When:
hasSensitiveData = true

Then:
somente atividades classificadas como sensíveis são retornadas
```

---

# 156. Teste — menores

```text
Given:
atividades com e sem menores

When:
hasMinorData = true

Then:
somente atividades envolvendo menores são retornadas
```

---

# 157. Teste — internacional

```text
Given:
atividades com e sem transferência internacional

When:
hasInternationalTransfer = true

Then:
somente atividades aplicáveis são retornadas
```

---

# 158. Teste — Compliance

```text
Given:
atividades COMPLETE e PENDING

When:
complianceStatus = PENDING

Then:
somente atividades pendentes autorizadas são retornadas
```

---

# 159. Teste — export

```text
Given:
usuário autorizado

When:
exporta ROPA

Then:
arquivo contém somente registros dentro de seu escopo
```

---

# 160. Teste — export cross-tenant

```text
Given:
User da Organization A

When:
tenta acessar export da Organization B

Then:
arquivo não é exposto
```

---

# 161. Teste — export permission

```text
Given:
User possui ropa:read

But:
não possui ropa:export

When:
tenta exportar

Then:
operação é rejeitada
```

se permissions forem separadas.

---

# 162. Teste — audit

```text
Given:
exportação concluída

When:
arquivo é gerado

Then:
evento ROPA_EXPORTED é registrado
```

---

# 163. Teste — array

```text
Given:
atividade possui múltiplas categorias

When:
Excel é gerado

Then:
todas as categorias aparecem

And:
nenhuma é perdida
```

---

# 164. Teste — erro

```text
Given:
falha técnica na geração

When:
export é solicitado

Then:
falha é informada

And:
arquivo incompleto não é disponibilizado como sucesso
```

---

# 165. Teste — paginação

```text
Given:
mais registros que pageSize

When:
ROPA é consultado

Then:
paginação e total refletem somente registros autorizados
```

---

# 166. Teste — autorização por área

```text
Given:
Manager possui scope BUSINESS_UNIT

When:
consulta ROPA

Then:
não recebe atividades fora das áreas autorizadas
```

conforme matriz final.

---

# 167. Teste — archived

Após definição:

```text
Given:
atividade arquivada

When:
ROPA atual é consultado

Then:
comportamento segue regra de inclusão definida
```

---

# 168. Teste — histórico

Se V1 incluir histórico:

```text
Given:
Activity teve v1 e v2

When:
ROPA histórico referente ao período de v1 é consultado

Then:
dados de v1 são reconstruídos
```

---

# 169. Open Questions relacionadas

```text
DQ-002 — múltiplas bases legais?

DQ-003 — associação da base legal?

DQ-004 — múltiplas finalidades?

DQ-005 — granularidade da retenção?

AUTHQ-004 — quem acessa ROPA?

WFQ-008 — versão durante revisão?

APIQ-006 — export síncrono ou assíncrono?

FEQ-009 — UX do export?

AUDQ-012 — versionamento?

AUDQ-013 — versão inicial?

CGQ-003 — ComplianceRun?

CGQ-005 — Gate por versão?
```

---

# 170. Questões específicas

```text
ROPAQ-001
Granularidade da linha

ROPAQ-002
Status incluídos no ROPA oficial

ROPAQ-003
Semântica da última atualização

ROPAQ-004
Export respeita filtros?

ROPAQ-005
Armazenamento dos exports

ROPAQ-006
Audit de visualização

ROPAQ-007
ROPA histórico na V1

ROPAQ-008
Snapshot consistente do export
```

As definições canônicas dessas questões estão em:

```text
12-OPEN-QUESTIONS.md
```

---

# 171. Critérios de aceite

```text
AC-ROPA-001

Given:
atividade elegível

When:
ROPA é consultado

Then:
registro é derivado automaticamente da atividade
```

```text
AC-ROPA-002

Given:
atividade possui múltiplos dados pessoais

When:
ROPA é gerado

Then:
nenhuma categoria aplicável é perdida
```

```text
AC-ROPA-003

Given:
atividade possui versão vigente

When:
ROPA é consultado

Then:
somente dados consistentes dessa versão são utilizados
```

```text
AC-ROPA-004

Given:
usuário possui escopo limitado

When:
consulta ROPA

Then:
somente registros autorizados são retornados
```

```text
AC-ROPA-005

Given:
usuário sem permission de export

When:
solicita exportação

Then:
backend rejeita operação
```

```text
AC-ROPA-006

Given:
exportação autorizada

When:
arquivo é produzido

Then:
tenant isolation permanece aplicado
```

```text
AC-ROPA-007

Given:
ComplianceStatus COMPLETE

When:
ROPA é apresentado

Then:
interface não transforma automaticamente esse estado em garantia jurídica de conformidade LGPD
```

```text
AC-ROPA-008

Given:
usuário identifica informação incorreta

When:
deseja corrigi-la

Then:
alteração ocorre através da ProcessingActivity e respectivo workflow
```

---

# 172. Definition of Done

A feature ROPA está concluída quando aplicável:

```text
[ ] regra de inclusão definida

[ ] granularidade definida

[ ] projeção implementada

[ ] versão vigente respeitada

[ ] finalidades projetadas

[ ] dados pessoais projetados

[ ] titulares projetados

[ ] operações projetadas

[ ] sistemas projetados

[ ] destinatários projetados

[ ] fornecedores projetados

[ ] transferência internacional projetada

[ ] retenção projetada

[ ] segurança projetada

[ ] bases legais projetadas

[ ] ComplianceStatus projetado

[ ] indicadores sensíveis implementados

[ ] indicadores de menores implementados

[ ] filtros implementados

[ ] busca implementada

[ ] paginação implementada

[ ] ordenação implementada

[ ] frontend implementado

[ ] export XLSX implementado

[ ] export PDF implementado

[ ] autorização aplicada

[ ] tenant isolation aplicada

[ ] proteção dos arquivos aplicada

[ ] audit de export implementado

[ ] performance validada

[ ] testes unitários

[ ] testes de integração

[ ] testes cross-tenant

[ ] testes de exportação

[ ] testes de versionamento

[ ] testes E2E críticos

[ ] documentação atualizada
```

---

# 173. Regra para agentes de IA

Antes de alterar ROPA, consultar:

```text
02-DOMAIN.md

03-DATABASE.md

04-AUTHORIZATION.md

05-BUSINESS-RULES.md

06-WORKFLOWS.md

07-API.md

09-SECURITY.md

10-AUDIT.md

12-OPEN-QUESTIONS.md

features/PROCESSING-ACTIVITY.md

features/COMPLIANCE-GATE.md

features/ROPA.md
```

---

# 174. Regra de implementação

Um agente não deve:

```text
criar uma segunda fonte de verdade para ROPA

editar Activity através de células do ROPA

misturar versões

ignorar tenant nos exports

expor arquivo publicamente

decidir sozinho quais drafts fazem parte do ROPA

inventar cardinalidade de finalidade/base legal

rotular Gate COMPLETE como "Conforme LGPD"

eliminar histórico para simplificar consultas
```

---

# 175. Regra final

O ROPA deve responder de forma estruturada:

```text
Quais atividades de tratamento estão registradas?

Qual área é responsável?

Para quais finalidades os dados são tratados?

Quais dados são tratados?

Quais titulares estão envolvidos?

Quais operações são realizadas?

Quais sistemas participam?

Quem recebe os dados?

Existe transferência internacional?

Qual é a retenção registrada?

Quais medidas de segurança foram informadas?

Quais bases legais foram registradas?

Qual é o estado do Compliance Gate?

Qual versão da atividade está vigente?

Quando essa informação foi atualizada?
```

Tudo isso deve ser derivado da mesma estrutura utilizada pelo restante da plataforma.

Princípio:

```text
Mapear uma vez.
Usar a mesma informação em todo o produto.
```

---

# 176. Próxima feature

O próximo documento recomendado é:

`docs/features/SYSTEMS.md`

Ele deverá especificar:

```text
cadastro de sistemas

sistemas internos e externos

quick create

mappingStatus

PENDING

MAPPED

associação com atividades

fonte de coleta

operações

responsável

fornecedor relacionado

pendências

dashboard

autorização

tenant isolation

versionamento

auditoria

testes
```