# Feature — Compliance Gate

> **Feature:** Compliance Gate  
> **Status:** Draft  
> **Módulo:** Compliance  
> **Documentos relacionados:** `00-PROJECT.md`, `02-DOMAIN.md`, `03-DATABASE.md`, `04-AUTHORIZATION.md`, `05-BUSINESS-RULES.md`, `06-WORKFLOWS.md`, `07-API.md`, `08-FRONTEND.md`, `09-SECURITY.md`, `10-AUDIT.md`, `11-TESTING.md`, `12-OPEN-QUESTIONS.md`, `features/PROCESSING-ACTIVITY.md`, `features/MAPPING-WIZARD.md`

---

# 1. Objetivo

O Compliance Gate é responsável por avaliar se uma:

```text
ProcessingActivity
```

possui as informações e verificações obrigatórias definidas pela plataforma antes de poder avançar para determinados estados do workflow.

Fluxo conceitual:

```text
Processing Activity
        ↓
Mapping Complete
        ↓
Compliance Gate
        ↓
Compliance Checks
        ↓
┌─────────────────────────────┐
│ PASS                        │
│ FAIL                        │
│ REVIEW_REQUIRED             │
│ NOT_APPLICABLE              │
└─────────────────────────────┘
        ↓
Compliance Status
        ↓
Workflow
```

---

# 2. Objetivo funcional

O Gate existe para impedir que uma atividade seja considerada concluída apenas porque o formulário foi preenchido.

Ele deve verificar requisitos estruturados relacionados a:

```text
base legal

retenção

medidas de segurança

transferência internacional

dados sensíveis

menores
```

---

# 3. O que o Gate não representa

O Compliance Gate não representa:

```text
certificação jurídica

parecer jurídico

auditoria técnica completa

garantia de conformidade com a LGPD

garantia de segurança

DPIA/RIPD completo

LIA completo
```

Portanto, a interface não deve afirmar:

```text
"Esta atividade está em conformidade com a LGPD."
```

apenas porque o Gate terminou com sucesso.

---

# 4. Terminologia

Preferir na interface termos como:

```text
Gate completo

Verificações concluídas

Verificações pendentes

Revisão necessária

Pendência encontrada
```

Evitar:

```text
LGPD Compliant

100% conforme

Legalmente aprovado
```

sem uma regra formal que permita essa afirmação.

---

# 5. ComplianceCheck

Cada verificação deve ser representada individualmente.

Conceito:

```text
ComplianceCheck
```

Estrutura conceitual:

```text
type

status

reasonCode

metadata?

evaluatedAt

evaluatedBy?
```

Campos definitivos dependem do modelo de banco.

---

# 6. Tipos iniciais

Checks atualmente previstos:

```text
LEGAL_BASIS

RETENTION

SECURITY_MEASURES

INTERNATIONAL_TRANSFER

SENSITIVE_DATA

MINOR_DATA
```

---

# 7. Resultado

Cada check pode produzir:

```text
PASS

FAIL

REVIEW_REQUIRED

NOT_APPLICABLE
```

---

# 8. PASS

`PASS` significa que as condições automatizáveis definidas para aquele check foram satisfeitas.

Exemplo:

```text
LEGAL_BASIS

Base legal obrigatória informada
↓
PASS
```

Isso não significa necessariamente que a base legal escolhida foi juridicamente validada por especialista.

---

# 9. FAIL

`FAIL` representa condição objetiva não satisfeita conforme regra configurada.

Exemplo conceitual:

```text
RETENTION

Nenhuma política de retenção informada
↓
FAIL
```

---

# 10. REVIEW_REQUIRED

`REVIEW_REQUIRED` significa que o sistema identificou situação que exige avaliação adicional.

Exemplos:

```text
dados sensíveis

menores

transferência internacional
```

quando as regras aplicáveis exigirem revisão humana.

---

# 11. NOT_APPLICABLE

`NOT_APPLICABLE` significa que determinado check não se aplica à atividade.

Exemplo:

```text
Activity
↓
não possui transferência internacional

INTERNATIONAL_TRANSFER
↓
NOT_APPLICABLE
```

---

# 12. Não omitir checks condicionais

Preferir:

```text
INTERNATIONAL_TRANSFER
NOT_APPLICABLE
```

em vez de simplesmente não retornar o check.

Isso torna o resultado do Gate mais explícito e auditável.

---

# 13. ComplianceStatus

A atividade possui status agregado de compliance separado do workflow.

Valores atuais:

```text
PENDING

COMPLETE

BLOCKED
```

---

# 14. PENDING

Representa atividade cujo Gate ainda não está completamente resolvido.

Pode ocorrer quando:

```text
Gate ainda não executado

informações ainda faltam

existe REVIEW_REQUIRED pendente

mapeamento foi alterado após avaliação
```

A lista definitiva deve seguir as regras aprovadas.

---

# 15. COMPLETE

`COMPLETE` significa que todos os checks necessários permitem a conclusão do Gate.

Regra global:

```text
ProcessingActivity.status = ACTIVE
```

exige:

```text
ProcessingActivity.complianceStatus = COMPLETE
```

---

# 16. BLOCKED

`BLOCKED` significa que existe condição que impede avanço segundo regras definidas.

Os critérios exatos ainda dependem de:

```text
BRQ-007
WFQ-006
```

Não assumir que todo `FAIL` necessariamente produz `BLOCKED` até essa regra ser fechada.

---

# 17. Status independentes

Exemplo:

```text
ActivityStatus:
COMPLIANCE_PENDING

ComplianceStatus:
PENDING
```

São conceitos diferentes.

---

# 18. Gate e workflow

Fluxo conceitual:

```text
MAPPING
↓
SUBMIT
↓
PENDING_REVIEW?
↓
COMPLIANCE_PENDING
↓
RUN GATE
↓
COMPLETE / PENDING / BLOCKED
↓
ACTIVE?
```

As etapas intermediárias dependem das decisões de workflow.

---

# 19. Regra crítica

Nunca permitir:

```text
ACTIVE
```

quando:

```text
complianceStatus != COMPLETE
```

---

# 20. Gate como serviço de domínio/aplicação

A lógica do Gate não deve existir somente:

```text
no frontend

em controller

em componente React
```

Ela deve ser executada no backend.

---

# 21. Estrutura conceitual

Pode existir serviço:

```text
ComplianceGateService
```

ou equivalente.

Responsabilidade:

```text
receber estado da atividade

executar checks aplicáveis

persistir resultados

calcular complianceStatus
```

---

# 22. Check isolado

Cada regra deve preferencialmente ser isolável.

Exemplo conceitual:

```ts
interface ComplianceCheckEvaluator {
  evaluate(context: ComplianceContext): ComplianceCheckResult;
}
```

Não é contrato obrigatório de implementação.

Representa apenas separação desejada de responsabilidades.

---

# 23. Resultado conceitual

```ts
type ComplianceCheckResult = {
  type: ComplianceCheckType;
  status: ComplianceCheckStatus;
  reasonCode: string;
};
```

---

# 24. Evitar boolean

Não modelar Gate apenas como:

```text
isCompliant = true
```

Isso perde informação importante sobre:

```text
qual check falhou

por que falhou

qual precisa revisão

qual não se aplica
```

---

# 25. Reason Code

Cada resultado deve possuir código estável quando necessário.

Exemplos:

```text
LEGAL_BASIS_PRESENT

LEGAL_BASIS_MISSING

RETENTION_PRESENT

RETENTION_MISSING

SECURITY_MEASURES_PRESENT

SECURITY_MEASURES_MISSING

INTERNATIONAL_TRANSFER_NOT_PRESENT

INTERNATIONAL_TRANSFER_REVIEW_REQUIRED

SENSITIVE_DATA_NOT_PRESENT

SENSITIVE_DATA_REVIEW_REQUIRED

MINOR_DATA_NOT_PRESENT

MINOR_DATA_REVIEW_REQUIRED
```

---

# 26. Reason Code vs mensagem

Backend retorna:

```text
reasonCode
```

Frontend traduz para mensagem.

Exemplo:

```text
RETENTION_MISSING
```

↓

```text
A política de retenção ainda não foi informada.
```

---

# 27. Não usar mensagem como regra

Evitar:

```ts
if (
  result.message ===
  'A política de retenção ainda não foi informada.'
) {
  ...
}
```

Utilizar códigos estáveis.

---

# 28. LEGAL_BASIS

Objetivo:

```text
verificar presença das informações de base legal exigidas
```

---

# 29. Regra mínima

Atividade sem base legal necessária não pode receber:

```text
LEGAL_BASIS = PASS
```

---

# 30. Exemplo

```text
Legal Basis ausente
↓
LEGAL_BASIS
FAIL
LEGAL_BASIS_MISSING
```

O impacto agregado no `complianceStatus` depende da regra de BLOCKED.

---

# 31. Legítimo interesse

Quando:

```text
LEGITIMATE_INTEREST
```

for utilizado, deve existir:

```text
justification
```

conforme regras atuais.

---

# 32. Exemplo

```text
LEGITIMATE_INTEREST
+
justification ausente
↓
LEGAL_BASIS
FAIL
LEGITIMATE_INTEREST_JUSTIFICATION_MISSING
```

---

# 33. LIA

O Gate não deve fingir executar um:

```text
Legitimate Interest Assessment
```

completo.

Se LIA for incorporado futuramente, deve existir feature/regra própria.

---

# 34. Cardinalidade

A avaliação definitiva de base legal depende de:

```text
DQ-002
DQ-003
```

Se base legal for por finalidade, o check precisará avaliar cada finalidade.

---

# 35. Exemplo futuro

```text
Purpose A
→ Legal Basis ✓

Purpose B
→ Legal Basis ✗

↓
LEGAL_BASIS
FAIL
```

Somente implementar após decisão de cardinalidade.

---

# 36. RETENTION

Objetivo:

```text
verificar existência das informações obrigatórias de retenção
```

---

# 37. Regra mínima

Atividade sem retenção exigida não pode receber:

```text
RETENTION = PASS
```

---

# 38. Campos

Atualmente previstos:

```text
duration

unit

startEvent
```

---

# 39. Exemplo

```text
duration = 5

unit = YEARS

startEvent = término do contrato
```

↓

```text
RETENTION
PASS
RETENTION_PRESENT
```

Esse PASS significa presença estrutural conforme regra.

Não valida automaticamente se:

```text
5 anos
```

é o prazo juridicamente correto.

---

# 40. Regra importante

O sistema não deve inventar prazo de retenção.

Não fazer:

```text
"CPF deve ser mantido por 5 anos"
```

sem regra formal fornecida/aprovada.

---

# 41. Granularidade

Check depende de:

```text
DQ-005
```

caso retenção passe a existir por:

```text
Purpose

PersonalDataCategory
```

---

# 42. SECURITY_MEASURES

Objetivo:

```text
verificar se medidas de segurança exigidas foram registradas
```

---

# 43. Regra mínima

Sem nenhuma medida exigida:

```text
SECURITY_MEASURES
```

não pode resultar `PASS`.

---

# 44. Exemplo

```text
Security Measures = []
↓
FAIL
SECURITY_MEASURES_MISSING
```

---

# 45. Com medidas

```text
Security Measures:
- Controle de acesso
- Criptografia
```

pode satisfazer requisito estrutural de presença.

---

# 46. Limitação

Isso não significa que o sistema verificou:

```text
configuração da criptografia

algoritmo utilizado

gestão de chaves

eficácia do controle de acesso
```

---

# 47. Não avaliar suficiência automaticamente

Sem metodologia formal aprovada, o Gate não deve produzir:

```text
SECURITY_MEASURES_ADEQUATE
```

apenas com base em checkboxes.

---

# 48. Catálogo

A avaliação depende também da definição:

```text
DQ-006
```

sobre medidas reutilizáveis/configuráveis.

---

# 49. INTERNATIONAL_TRANSFER

Objetivo:

```text
identificar e avaliar requisitos adicionais quando existe transferência internacional
```

---

# 50. Não aplicável

Se não houver:

```text
INTERNATIONAL_TRANSFER
```

resultado:

```text
NOT_APPLICABLE
INTERNATIONAL_TRANSFER_NOT_PRESENT
```

---

# 51. Aplicável

Se houver transferência:

```text
destinationCountry
```

deve estar presente quando exigido.

---

# 52. País ausente

Exemplo:

```text
International Transfer = true

destinationCountry = null
```

↓

```text
INTERNATIONAL_TRANSFER
FAIL
INTERNATIONAL_TRANSFER_COUNTRY_MISSING
```

---

# 53. Mecanismo

Quando o fluxo exigir:

```text
transferMechanism
```

sua ausência deve ser representada explicitamente.

---

# 54. Revisão

Mesmo com campos preenchidos, transferência internacional pode exigir:

```text
REVIEW_REQUIRED
```

conforme regra aprovada.

---

# 55. Exemplo

```text
destinationCountry = US

transferMechanism = informado

↓
REVIEW_REQUIRED
INTERNATIONAL_TRANSFER_REVIEW_REQUIRED
```

---

# 56. Não decidir mecanismo

O Gate não deve inferir automaticamente:

```text
qual mecanismo jurídico é adequado
```

sem regras formais aprovadas.

---

# 57. SENSITIVE_DATA

Objetivo:

```text
identificar atividades envolvendo categorias sensíveis
```

---

# 58. Não aplicável

Se nenhuma categoria sensível:

```text
SENSITIVE_DATA
NOT_APPLICABLE
SENSITIVE_DATA_NOT_PRESENT
```

---

# 59. Aplicável

Se houver dado sensível:

```text
SENSITIVE_DATA
REVIEW_REQUIRED
SENSITIVE_DATA_REVIEW_REQUIRED
```

é o comportamento inicialmente proposto.

---

# 60. RIPD/DPIA

Dados sensíveis devem acionar avaliação sobre necessidade de:

```text
RIPD / DPIA
```

conforme regras globais.

Isso não significa gerar automaticamente um RIPD completo na V1.

---

# 61. Resultado da revisão

O que transforma:

```text
REVIEW_REQUIRED
```

em resultado resolvido ainda depende de:

```text
WFQ-005
```

---

# 62. MINOR_DATA

Objetivo:

```text
identificar atividades envolvendo menores
```

---

# 63. Não aplicável

Sem menores:

```text
MINOR_DATA
NOT_APPLICABLE
MINOR_DATA_NOT_PRESENT
```

---

# 64. Aplicável

Com menores:

```text
MINOR_DATA
REVIEW_REQUIRED
MINOR_DATA_REVIEW_REQUIRED
```

é comportamento inicialmente proposto.

---

# 65. Não assumir reprovação

A presença de menores não deve produzir automaticamente:

```text
FAIL
```

sem regra formal.

---

# 66. Avaliação adicional

Assim como dados sensíveis, menores podem exigir avaliação de:

```text
RIPD / DPIA
```

---

# 67. Checks obrigatórios

Checks estruturais atualmente considerados obrigatórios:

```text
LEGAL_BASIS

RETENTION

SECURITY_MEASURES
```

Checks condicionais:

```text
INTERNATIONAL_TRANSFER

SENSITIVE_DATA

MINOR_DATA
```

---

# 68. Extensibilidade

Arquitetura deve permitir adicionar checks futuros.

Exemplos possíveis:

```text
DATA_MINIMIZATION

PURPOSE_COMPATIBILITY

SUPPLIER_MAPPING

SYSTEM_MAPPING

RIPD

LIA
```

Esses checks NÃO fazem parte do escopo atual automaticamente.

---

# 69. Não criar checks futuros sem regra

Um agente de IA não deve adicionar:

```text
DATA_MINIMIZATION
```

ou qualquer outro check apenas porque parece útil.

Toda nova regra precisa ser aprovada e documentada.

---

# 70. Execução do Gate

API conceitual:

```http
POST /api/v1/processing-activities/:id/compliance/run
```

---

# 71. Autorização

Execução deve exigir permission apropriada.

Exemplo conceitual:

```text
compliance:run
```

Naming definitivo deve seguir catálogo de permissions.

---

# 72. Pré-condições

Gate não deve ser executado arbitrariamente em qualquer estado se workflow definir restrições.

Exemplo:

```text
DRAFT
```

pode não estar elegível para execução oficial do Gate.

---

# 73. Preview

Futuramente pode existir:

```text
Compliance Preview
```

durante o wizard.

Isso deve ser diferenciado de execução oficial persistida.

Não implementar automaticamente.

---

# 74. Processo

```text
Run Gate
↓
Load Activity
↓
Validate tenant
↓
Validate permission
↓
Validate workflow state
↓
Load required mapping
↓
Evaluate checks
↓
Persist results
↓
Calculate ComplianceStatus
↓
Audit
↓
Return result
```

---

# 75. Atomicidade

Persistência dos resultados e atualização de:

```text
complianceStatus
```

devem ocorrer de forma consistente.

Preferencialmente em transação quando aplicável.

---

# 76. Resultado da API

Exemplo:

```json
{
  "data": {
    "activityId": "uuid",
    "complianceStatus": "PENDING",
    "evaluatedAt": "2026-08-20T14:30:00Z",
    "checks": [
      {
        "type": "LEGAL_BASIS",
        "status": "PASS",
        "reasonCode": "LEGAL_BASIS_PRESENT"
      },
      {
        "type": "RETENTION",
        "status": "PASS",
        "reasonCode": "RETENTION_PRESENT"
      },
      {
        "type": "SECURITY_MEASURES",
        "status": "PASS",
        "reasonCode": "SECURITY_MEASURES_PRESENT"
      },
      {
        "type": "INTERNATIONAL_TRANSFER",
        "status": "NOT_APPLICABLE",
        "reasonCode": "INTERNATIONAL_TRANSFER_NOT_PRESENT"
      },
      {
        "type": "SENSITIVE_DATA",
        "status": "REVIEW_REQUIRED",
        "reasonCode": "SENSITIVE_DATA_REVIEW_REQUIRED"
      },
      {
        "type": "MINOR_DATA",
        "status": "NOT_APPLICABLE",
        "reasonCode": "MINOR_DATA_NOT_PRESENT"
      }
    ]
  }
}
```

---

# 77. Resultado agregado

A função que calcula:

```text
ComplianceStatus
```

deve possuir regra explícita.

Não espalhar lógica como:

```ts
if (checks.some(...))
```

por controllers e componentes.

---

# 78. Tabela de agregação

A tabela definitiva depende das decisões sobre:

```text
FAIL

REVIEW_REQUIRED

BLOCKED
```

Proposta conceitual:

| Situação | ComplianceStatus |
|---|---|
| Gate ainda não executado | PENDING |
| Check obrigatório pendente | PENDING ou BLOCKED — definir |
| REVIEW_REQUIRED não resolvido | PENDING |
| Todos os checks resolvidos | COMPLETE |
| Condição explicitamente bloqueante | BLOCKED |

---

# 79. Regra não definida

Não implementar:

```text
FAIL = BLOCKED
```

automaticamente enquanto:

```text
BRQ-007
```

estiver aberta.

---

# 80. Revisão humana

`REVIEW_REQUIRED` exige conceito de resolução.

Possível fluxo:

```text
REVIEW_REQUIRED
↓
Reviewer
↓
Decision
↓
Resolved
```

---

# 81. Reviewer

Ainda precisa ser definido:

```text
Manager

DPO

ambos

papel específico
```

Relacionado:

```text
WFQ-003
WFQ-005
```

---

# 82. Não reutilizar PASS ambiguamente

Uma revisão humana aprovada pode resultar em:

```text
PASS
```

ou possuir conceito separado de:

```text
RESOLVED
```

Isso precisa ser decidido.

---

# 83. Nova questão — CGQ-001

**Status:** OPEN  
**Priority:** CRITICAL

Como um:

```text
REVIEW_REQUIRED
```

é resolvido?

Alternativas:

```text
muda para PASS

mantém REVIEW_REQUIRED + resolvedAt

gera decisão separada

gera check substituto
```

Essa decisão afeta banco, API, auditoria e histórico.

---

# 84. Justificativa da revisão

Caso revisão humana exista, pode ser necessário:

```text
decision

justification

reviewedBy

reviewedAt
```

A obrigatoriedade precisa ser definida.

---

# 85. Nova questão — CGQ-002

**Status:** OPEN  
**Priority:** HIGH

Revisor precisa informar justificativa ao resolver:

```text
REVIEW_REQUIRED
```

?

---

# 86. Histórico dos checks

Resultados anteriores não devem desaparecer sem rastreabilidade quando Gate é reexecutado.

Exemplo:

```text
Run 1
RETENTION = FAIL

↓ usuário corrige

Run 2
RETENTION = PASS
```

Deve ser possível reconstruir que o primeiro Gate falhou.

---

# 87. Compliance Run

Pode ser útil introduzir entidade:

```text
ComplianceRun
```

como agrupador.

Modelo:

```text
ComplianceRun
├── Check A
├── Check B
├── Check C
└── Check D
```

---

# 88. Banco

`03-DATABASE.md` já considera possibilidade futura de:

```text
compliance_runs
```

A decisão deve ser fechada antes da implementação final do histórico do Gate.

---

# 89. Recomendação arquitetural

Para rastreabilidade forte, preferir:

```text
ComplianceRun
```

imutável contendo os resultados de cada execução.

Mas isso precisa ser alinhado com o modelo definitivo de versionamento.

---

# 90. Nova questão — CGQ-003

**Status:** OPEN  
**Priority:** CRITICAL

Cada execução do Gate terá:

```text
ComplianceRun
```

imutável?

Ou `compliance_checks` representarão apenas estado atual?

---

# 91. Reexecução

Mudanças relevantes no mapeamento devem invalidar ou exigir nova avaliação do Gate.

Exemplo:

```text
Activity
Gate COMPLETE

↓
adiciona transferência internacional

↓
Gate anterior não pode continuar representando
estado atual sem reavaliação
```

---

# 92. Compliance invalidation

Quando mudança afetar checks:

```text
complianceStatus
```

deve retornar ao estado apropriado.

Possivelmente:

```text
PENDING
```

---

# 93. Não recalcular silenciosamente sem política

Precisamos decidir se alterações causam:

```text
reexecução automática
```

ou:

```text
invalidação + execução manual
```

Relacionado:

```text
APIQ-010
```

---

# 94. Nova questão — CGQ-004

**Status:** OPEN  
**Priority:** CRITICAL

Após mudança relevante:

```text
Gate roda automaticamente
```

ou:

```text
Gate é invalidado e precisa ser executado novamente
```

?

---

# 95. Mudanças que afetam Gate

Candidatos:

```text
personal data categories

subjects

purposes

legal bases

retention

security measures

operations

international transfers

recipients

systems

suppliers
```

A lista definitiva precisa ser alinhada ao versionamento.

---

# 96. Mudança irrelevante

Exemplo:

```text
correção ortográfica no nome
```

pode não exigir novo Gate.

Mas não criar heurística sem regra.

---

# 97. ActivityVersion

O Gate deve estar relacionado ao estado/versionamento da atividade.

Idealmente deve ser possível saber:

```text
qual versão foi avaliada
```

---

# 98. Regra crítica

Não reutilizar Gate de:

```text
Version 1
```

como se tivesse avaliado:

```text
Version 2
```

quando conteúdo relevante mudou.

---

# 99. Version ID

ComplianceRun pode referenciar:

```text
activityVersionId
```

ou:

```text
activityId + versionNumber
```

conforme modelagem final.

---

# 100. Atividade em revisão

Fluxo proposto:

```text
v1 ACTIVE
Compliance COMPLETE

↓
start revision

v2 UNDER_REVIEW
Compliance PENDING

↓
Gate v2

↓
v2 COMPLETE

↓
activate v2
```

---

# 101. Versão vigente

Enquanto v2 está em revisão:

```text
v1
```

pode continuar sendo a versão publicada no ROPA.

Isso depende de:

```text
WFQ-008
```

---

# 102. Gate e ROPA

ROPA não deve usar Gate de versão incorreta.

A projeção precisa saber:

```text
current published version
```

e seu resultado de compliance correspondente.

---

# 103. Frontend — tela

Rota possível:

```text
/activities/:id/compliance
```

---

# 104. Header

Exemplo:

```text
Compliance Gate

Processamento da folha de pagamento

Gate: Pendente
```

---

# 105. Check Cards

Cada check pode aparecer como card.

Exemplo:

```text
Base legal

✓ Verificação concluída

Base legal informada.
```

---

# 106. FAIL visual

Exemplo:

```text
Retenção

✕ Pendência encontrada

A política de retenção ainda não foi informada.

[Corrigir retenção]
```

---

# 107. REVIEW_REQUIRED visual

Exemplo:

```text
Dados sensíveis

! Revisão necessária

A atividade envolve dados classificados como sensíveis.

[Revisar]
```

---

# 108. NOT_APPLICABLE visual

Exemplo:

```text
Transferência internacional

— Não aplicável

Nenhuma transferência internacional foi informada.
```

---

# 109. Acessibilidade

Não utilizar somente:

```text
verde

vermelho

amarelo
```

Status deve possuir:

```text
texto

ícone

semântica acessível
```

---

# 110. Ordem dos checks

Pode utilizar ordem estável:

```text
Base legal

Retenção

Segurança

Transferência internacional

Dados sensíveis

Menores
```

Evitar mudança aleatória entre execuções.

---

# 111. Corrigir pendência

Quando possível, check pode apontar para etapa do wizard.

Exemplo:

```text
RETENTION_MISSING
↓
Corrigir
↓
/activities/:id/map/retention
```

---

# 112. Não hardcode reasonCode em dezenas de componentes

Centralizar mapeamento:

```text
reasonCode
↓
label
↓
description
↓
target route
```

quando apropriado.

---

# 113. Run Gate Button

Pode existir:

```text
Executar verificações
```

somente quando:

```text
permission
+
workflow
```

permitirem.

---

# 114. Loading

Durante execução:

```text
Executando verificações...
```

Evitar múltiplos submits simultâneos.

---

# 115. Sem optimistic update

Não utilizar optimistic update para:

```text
Compliance Gate
```

O resultado depende do backend.

---

# 116. Erro de execução

Se ocorrer erro técnico:

```text
500
```

não transformar automaticamente em:

```text
FAIL
```

Erro técnico e resultado de compliance são conceitos diferentes.

---

# 117. Exemplo

Errado:

```text
Database unavailable
↓
RETENTION = FAIL
```

Correto:

```text
Gate execution failed
```

e preservar estado consistente.

---

# 118. Concorrência

Se atividade mudar durante execução do Gate, resultado não deve ser associado silenciosamente a estado diferente daquele avaliado.

Estratégia pode utilizar:

```text
version

revision

transaction

snapshot
```

---

# 119. Nova questão — CGQ-005

**Status:** OPEN  
**Priority:** CRITICAL

Gate avalia:

```text
estado live da atividade
```

ou:

```text
snapshot/version imutável
```

?

Recomendação arquitetural:

```text
vincular avaliação a uma versão/snapshot identificável
```

---

# 120. Autorização — leitura

Permission possível:

```text
compliance:read
```

---

# 121. Autorização — execução

Permission possível:

```text
compliance:run
```

---

# 122. Autorização — revisão

Permission possível:

```text
compliance:review
```

---

# 123. Autorização — resolução

Se revisão humana possuir decisão:

```text
compliance:resolve
```

pode ser necessária.

Naming definitivo deve permanecer centralizado.

---

# 124. DPO

DPO é candidato natural a possuir permissões amplas de compliance.

Isso não define automaticamente que somente DPO pode revisar.

---

# 125. Manager

Papel do Manager na revisão ainda depende das decisões abertas.

---

# 126. Collaborator

Pode visualizar pendências relacionadas às atividades autorizadas.

Não deve resolver revisão privilegiada sem permission explícita.

---

# 127. ADMIN

Administração organizacional não deve equivaler automaticamente a:

```text
compliance:approve
```

ou:

```text
compliance:resolve
```

---

# 128. Tenant

Todo Gate pertence ao contexto da organização da atividade.

---

# 129. Cross-tenant

Usuário da Organization A não pode:

```text
executar

consultar

resolver
```

Gate da Organization B.

---

# 130. Audit

Execução do Gate deve ser auditável.

Evento possível:

```text
COMPLIANCE_GATE_RUN
```

---

# 131. Metadata

Exemplo:

```json
{
  "activityId": "uuid",
  "activityVersion": 2,
  "complianceStatus": "PENDING"
}
```

---

# 132. Check Resolution

Caso revisão humana exista:

```text
COMPLIANCE_CHECK_REVIEWED
```

ou evento equivalente.

---

# 133. Metadata de revisão

Pode conter:

```text
checkType

decision

reviewedBy

reason
```

sem registrar informações desnecessárias.

---

# 134. Invalidation

Evento possível:

```text
COMPLIANCE_GATE_INVALIDATED
```

quando mudança relevante exigir nova avaliação.

---

# 135. Histórico

Deve ser possível responder:

```text
quando Gate foi executado?

qual versão foi avaliada?

quais checks resultaram?

quem resolveu revisão?

quando foi resolvida?

o que mudou depois?
```

conforme nível de auditoria aprovado.

---

# 136. Dashboard

Dashboard pode usar Gate para métricas como:

```text
atividades com Gate completo

atividades pendentes

atividades bloqueadas

revisões necessárias
```

---

# 137. Percentual

Se dashboard exibir:

```text
% completo
```

a fórmula precisa ser explícita.

Exemplo possível:

```text
activities with complianceStatus COMPLETE
/
eligible activities
```

Mas população exata precisa ser definida.

---

# 138. Não calcular métrica diferente no frontend

Backend deve fornecer métricas autoritativas quando existir endpoint específico.

---

# 139. Notifications

Pode haver notificações para:

```text
REVIEW_REQUIRED

BLOCKED

Gate invalidado

pendência antiga
```

Isso depende da feature futura de notificações.

---

# 140. Não enviar conteúdo excessivo

Notificações por e-mail não devem incluir dados desnecessários do mapeamento.

Preferir:

```text
Existe uma revisão pendente na atividade X.
```

com link autenticado.

---

# 141. Configurabilidade

Existe possibilidade futura de organizações configurarem Gate.

Exemplo:

```text
Organization A exige Check X

Organization B exige Check Y
```

Não faz parte automaticamente da V1.

---

# 142. Nova questão — CGQ-006

**Status:** OPEN  
**Priority:** MEDIUM

Compliance Gate será:

```text
fixo para todas as organizações
```

ou:

```text
configurável por Organization
```

?

---

# 143. Rule Versioning

Se regras do Gate mudarem no futuro, atividades antigas podem ter sido avaliadas por regras diferentes.

Pode ser necessário registrar:

```text
gateRuleVersion
```

---

# 144. Exemplo

```text
Gate Rules v1
↓
Activity evaluated

meses depois

Gate Rules v2
```

É importante saber qual conjunto de regras produziu o resultado histórico.

---

# 145. Nova questão — CGQ-007

**Status:** OPEN  
**Priority:** MEDIUM

ComplianceRun deve registrar:

```text
ruleVersion
```

?

Recomendação arquitetural:

```text
sim, se as regras forem versionáveis/configuráveis
```

---

# 146. API — consulta atual

```http
GET /api/v1/processing-activities/:id/compliance
```

Retorna estado atual autorizado.

---

# 147. API — executar

```http
POST /api/v1/processing-activities/:id/compliance/run
```

---

# 148. API — histórico

Caso `ComplianceRun` seja adotado:

```http
GET /api/v1/processing-activities/:id/compliance/runs
```

---

# 149. API — run específico

Possível:

```http
GET /api/v1/processing-activities/:id/compliance/runs/:runId
```

---

# 150. API — resolver revisão

Contrato depende de `CGQ-001`.

Possível formato futuro:

```http
POST /api/v1/processing-activities/:id/compliance/checks/:checkId/resolve
```

Não implementar até regra de resolução estar definida.

---

# 151. API response atual

Pode retornar:

```text
complianceStatus

checks

evaluatedAt

activityVersion
```

---

# 152. Error Codes

Possíveis códigos:

```text
COMPLIANCE_GATE_NOT_AVAILABLE

COMPLIANCE_GATE_INVALID_STATE

COMPLIANCE_GATE_ALREADY_RUNNING

COMPLIANCE_GATE_EXECUTION_FAILED

COMPLIANCE_CHECK_NOT_FOUND

COMPLIANCE_REVIEW_REQUIRED

COMPLIANCE_REVIEW_NOT_ALLOWED

COMPLIANCE_STALE_ACTIVITY_VERSION

LEGAL_BASIS_MISSING

LEGITIMATE_INTEREST_JUSTIFICATION_MISSING

RETENTION_MISSING

SECURITY_MEASURES_MISSING

INTERNATIONAL_TRANSFER_COUNTRY_MISSING
```

---

# 153. Não confundir códigos

```text
COMPLIANCE_GATE_EXECUTION_FAILED
```

é erro técnico.

```text
RETENTION_MISSING
```

é resultado/regra de negócio.

---

# 154. Teste — base legal

```text
Given:
atividade sem base legal

When:
Gate é executado

Then:
LEGAL_BASIS não resulta PASS
```

---

# 155. Teste — legítimo interesse

```text
Given:
LEGITIMATE_INTEREST

And:
justification ausente

When:
Gate é executado

Then:
LEGAL_BASIS não resulta PASS
```

---

# 156. Teste — retenção

```text
Given:
atividade sem retenção

When:
Gate é executado

Then:
RETENTION não resulta PASS
```

---

# 157. Teste — segurança

```text
Given:
atividade sem medidas de segurança exigidas

When:
Gate é executado

Then:
SECURITY_MEASURES não resulta PASS
```

---

# 158. Teste — internacional não aplicável

```text
Given:
atividade sem transferência internacional

When:
Gate é executado

Then:
INTERNATIONAL_TRANSFER = NOT_APPLICABLE
```

---

# 159. Teste — internacional

```text
Given:
atividade possui transferência internacional

When:
Gate é executado

Then:
INTERNATIONAL_TRANSFER é avaliado
```

---

# 160. Teste — país ausente

```text
Given:
transferência internacional

And:
destinationCountry ausente

When:
Gate é executado

Then:
check não resulta PASS
```

---

# 161. Teste — sensível

```text
Given:
atividade possui dado sensível

When:
Gate é executado

Then:
SENSITIVE_DATA é avaliado

And:
não é tratado automaticamente como NOT_APPLICABLE
```

---

# 162. Teste — sem sensível

```text
Given:
atividade não possui dado sensível

When:
Gate é executado

Then:
SENSITIVE_DATA = NOT_APPLICABLE
```

---

# 163. Teste — menores

```text
Given:
atividade envolve menores

When:
Gate é executado

Then:
MINOR_DATA é avaliado
```

---

# 164. Teste — sem menores

```text
Given:
atividade não envolve menores

When:
Gate é executado

Then:
MINOR_DATA = NOT_APPLICABLE
```

---

# 165. Teste — ativação

```text
Given:
complianceStatus != COMPLETE

When:
tentativa de ativação ocorre

Then:
atividade não fica ACTIVE
```

Teste crítico.

---

# 166. Teste — Gate completo

Após definição das regras agregadas:

```text
Given:
todos os checks necessários estão resolvidos

When:
Gate termina

Then:
complianceStatus = COMPLETE
```

---

# 167. Teste — REVIEW_REQUIRED

```text
Given:
um check resulta REVIEW_REQUIRED

When:
não existe resolução humana

Then:
atividade não deve ser considerada Gate completo
```

conforme modelo atual.

---

# 168. Teste — reexecução

```text
Given:
Gate anterior foi executado

And:
atividade sofre mudança relevante

When:
novo Gate é necessário

Then:
resultado antigo não representa silenciosamente o estado novo
```

---

# 169. Teste — histórico

Se `ComplianceRun` for adotado:

```text
Given:
Run 1 = FAIL

And:
usuário corrige dados

When:
Run 2 = PASS

Then:
Run 1 permanece consultável no histórico autorizado
```

---

# 170. Teste — versionamento

```text
Given:
v1 possui Gate COMPLETE

When:
v2 é criada com mudança relevante

Then:
Gate de v1 não torna v2 automaticamente COMPLETE
```

---

# 171. Teste — concorrência

```text
Given:
Gate iniciou sobre determinada versão

And:
atividade foi alterada antes da persistência

When:
resultado tenta ser associado

Then:
sistema não associa silenciosamente avaliação à versão incorreta
```

---

# 172. Teste — cross-tenant

```text
Given:
Activity pertence à Organization B

When:
User da Organization A tenta executar Gate

Then:
recurso não é exposto
```

---

# 173. Teste — permission

```text
Given:
User pode ler atividade

But:
não possui compliance:run

When:
tenta executar Gate

Then:
operação é rejeitada
```

---

# 174. Teste — erro técnico

```text
Given:
falha técnica durante Gate

When:
execução falha

Then:
erro técnico é retornado

And:
não é convertido em resultado jurídico FAIL
```

---

# 175. Invariantes

## INV-CG-001

```text
Atividade ACTIVE exige ComplianceStatus COMPLETE.
```

## INV-CG-002

```text
Cada check possui resultado explícito.
```

## INV-CG-003

```text
Checks condicionais não aplicáveis podem retornar NOT_APPLICABLE.
```

## INV-CG-004

```text
REVIEW_REQUIRED não equivale automaticamente a PASS.
```

## INV-CG-005

```text
Dados sensíveis não equivalem automaticamente a FAIL.
```

## INV-CG-006

```text
Menores não equivalem automaticamente a FAIL.
```

## INV-CG-007

```text
Transferência internacional exige avaliação específica.
```

## INV-CG-008

```text
Erro técnico não equivale a resultado de compliance.
```

## INV-CG-009

```text
Gate deve ser executado no backend.
```

## INV-CG-010

```text
Gate de uma versão não pode validar silenciosamente outra versão alterada.
```

## INV-CG-011

```text
Gate não representa garantia jurídica absoluta de conformidade LGPD.
```

---

# 176. Open Questions relacionadas

```text
AUTHQ-002 / WFQ-003 — quem aprova/revisa?

DQ-002 — múltiplas bases legais?

DQ-003 — base legal associada a quê?

DQ-005 — granularidade da retenção?

DQ-006 — medidas de segurança?

AUTHQ-002 — quem aprova?

BRQ-007 — o que causa BLOCKED?

WFQ-003 — reviewer?

WFQ-004 — aprovação após Gate?

WFQ-005 — quem resolve REVIEW_REQUIRED?

WFQ-006 — BLOCKED?

WFQ-007 — mudanças em ACTIVE?

WFQ-008 — ROPA durante revisão?

APIQ-010 — Gate automático ou explícito?

PAQ-006 — Submit vs Gate?

AUDQ-012 — snapshot de entidades externas?

AUDQ-013 — versionamento inicial?
```

---

# 177. Questões específicas

```text
CGQ-001
Como REVIEW_REQUIRED é resolvido?

CGQ-002
Revisão exige justificativa?

CGQ-003
Existe ComplianceRun imutável?

CGQ-004
Reexecução automática ou manual?

CGQ-005
Gate avalia live state ou snapshot/version?

CGQ-006
Gate fixo ou configurável por Organization?

CGQ-007
Gate possui ruleVersion?
```

As definições canônicas dessas questões estão em:

```text
12-OPEN-QUESTIONS.md
```

---

# 178. Critérios de aceite

```text
AC-CG-001

Given:
atividade elegível

When:
Gate é executado

Then:
todos os checks aplicáveis são avaliados pelo backend
```

```text
AC-CG-002

Given:
base legal obrigatória ausente

When:
Gate é executado

Then:
LEGAL_BASIS não resulta PASS
```

```text
AC-CG-003

Given:
retenção obrigatória ausente

When:
Gate é executado

Then:
RETENTION não resulta PASS
```

```text
AC-CG-004

Given:
medidas de segurança obrigatórias ausentes

When:
Gate é executado

Then:
SECURITY_MEASURES não resulta PASS
```

```text
AC-CG-005

Given:
nenhuma transferência internacional

When:
Gate é executado

Then:
INTERNATIONAL_TRANSFER = NOT_APPLICABLE
```

```text
AC-CG-006

Given:
atividade contém dado sensível

When:
Gate é executado

Then:
SENSITIVE_DATA recebe avaliação específica
```

```text
AC-CG-007

Given:
atividade envolve menores

When:
Gate é executado

Then:
MINOR_DATA recebe avaliação específica
```

```text
AC-CG-008

Given:
ComplianceStatus != COMPLETE

When:
ativação é solicitada

Then:
atividade não se torna ACTIVE
```

```text
AC-CG-009

Given:
atividade muda de forma relevante após Gate

When:
estado atual é consultado

Then:
resultado anterior não valida silenciosamente o novo estado
```

```text
AC-CG-010

Given:
usuário de outro tenant

When:
tenta consultar ou executar Gate

Then:
dados não são expostos
```

---

# 179. Definition of Done

A feature Compliance Gate está concluída quando aplicável:

```text
[ ] tipos de checks definidos

[ ] status dos checks definidos

[ ] reasonCodes definidos

[ ] regra LEGAL_BASIS implementada

[ ] regra RETENTION implementada

[ ] regra SECURITY_MEASURES implementada

[ ] regra INTERNATIONAL_TRANSFER implementada

[ ] regra SENSITIVE_DATA implementada

[ ] regra MINOR_DATA implementada

[ ] cálculo de ComplianceStatus definido

[ ] regra BLOCKED definida

[ ] REVIEW_REQUIRED definido

[ ] resolução humana definida

[ ] integração com workflow implementada

[ ] vínculo com versão definido

[ ] reexecução/invalidação definida

[ ] histórico definido

[ ] API implementada

[ ] authorization implementada

[ ] tenant isolation implementado

[ ] frontend implementado

[ ] acessibilidade aplicada

[ ] audit implementado

[ ] testes unitários dos evaluators

[ ] testes de integração

[ ] testes de workflow

[ ] testes cross-tenant

[ ] testes de versionamento

[ ] testes E2E críticos

[ ] documentação atualizada
```

---

# 180. Regra para agentes de IA

Antes de alterar qualquer regra do Gate, consultar:

```text
02-DOMAIN.md

05-BUSINESS-RULES.md

06-WORKFLOWS.md

12-OPEN-QUESTIONS.md

features/PROCESSING-ACTIVITY.md

features/MAPPING-WIZARD.md

features/COMPLIANCE-GATE.md
```

Se uma condição estiver marcada como:

```text
OPEN
```

o agente não deve escolher uma resposta por conta própria.

---

# 181. Regra de implementação

Não implementar regras como:

```text
"Se contém biometria, bloquear"

"Se transfere para país X, aprovar"

"Se retenção é maior que N anos, reprovar"

"Se usa consentimento, considerar conforme"

"Se possui criptografia, considerar seguro"
```

sem regra funcional explicitamente aprovada.

---

# 182. Regra final

O Compliance Gate deve responder:

```text
Quais verificações foram executadas?

Quais passaram?

Quais falharam?

Quais não se aplicam?

Quais precisam de revisão?

Por que cada resultado ocorreu?

Qual versão da atividade foi avaliada?

O resultado ainda representa o estado atual?
```

Ele não deve responder sozinho:

```text
"Esta empresa está em conformidade com a LGPD."
```

O Gate é um mecanismo estruturado de:

```text
controle

consistência

pendências

revisão

rastreabilidade
```

dentro do processo de mapeamento.

---

# 183. Próxima feature

O próximo documento recomendado é:

`docs/features/ROPA.md`

Ele deverá especificar:

```text
Registro das Operações de Tratamento

projeção automática

fonte dos dados

versão vigente

colunas

filtros

status do Gate

dados sensíveis

menores

transferência internacional

exportação Excel

exportação PDF

histórico

autorização

tenant isolation

auditoria

testes
```