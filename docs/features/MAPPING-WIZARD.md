# Feature — Wizard de Mapeamento de Dados

> **Feature:** Mapping Wizard  
> **Status:** Draft  
> **Módulo:** Data Mapping  
> **Documentos relacionados:** `00-PROJECT.md`, `02-DOMAIN.md`, `03-DATABASE.md`, `04-AUTHORIZATION.md`, `05-BUSINESS-RULES.md`, `06-WORKFLOWS.md`, `07-API.md`, `08-FRONTEND.md`, `12-OPEN-QUESTIONS.md`, `features/PROCESSING-ACTIVITY.md`

---

# 1. Objetivo

O Mapping Wizard é a principal interface para levantamento estruturado de uma:

```text
ProcessingActivity
```

Seu objetivo é transformar o processo de mapeamento em uma sequência guiada de perguntas.

Fluxo conceitual:

```text
Identificar atividade
        ↓
Finalidade
        ↓
Dados pessoais
        ↓
Titulares
        ↓
Fonte de coleta
        ↓
Tratamento
        ↓
Compartilhamentos
        ↓
Retenção
        ↓
Segurança
        ↓
Base legal
        ↓
Revisão
        ↓
Submit
```

O wizard não determina sozinho se a atividade está juridicamente adequada.

Ele coleta e estrutura as informações necessárias para o restante da plataforma.

---

# 2. Princípios

O wizard deve ser:

```text
progressivo

salvável

retomável

condicional

orientado

validável

auditável

compatível com versionamento
```

---

# 3. Regra principal

O usuário não deve precisar preencher todo o mapeamento em uma única sessão.

Deve ser possível:

```text
iniciar

salvar

sair

retornar

continuar
```

---

# 4. Draft

O wizard trabalha sobre uma:

```text
ProcessingActivity
```

existente.

Fluxo recomendado:

```text
Nova atividade
↓
informações mínimas
↓
ProcessingActivity DRAFT
↓
abrir Wizard
```

---

# 5. Não criar estado paralelo

O wizard não deve possuir uma cópia independente completa da atividade.

Evitar:

```text
WizardDraft
+
ProcessingActivity
```

representando permanentemente os mesmos dados.

A atividade e seus sub-recursos são a fonte persistida.

---

# 6. Estado local

O frontend pode possuir estado temporário para:

```text
campos ainda não salvos

etapa atual

erros locais

estado visual
```

Mas os dados persistidos devem permanecer sincronizados com o backend.

---

# 7. Estrutura proposta

Etapas conceituais:

```text
STEP 1
Identificação

STEP 2
Finalidade

STEP 3
Dados pessoais

STEP 4
Titulares

STEP 5
Fonte de coleta

STEP 6
Tratamento

STEP 7
Destinatários e compartilhamento

STEP 8
Transferência internacional

STEP 9
Retenção

STEP 10
Medidas de segurança

STEP 11
Base legal

STEP 12
Revisão
```

A quantidade visual de telas pode ser diferente.

Não existe obrigação de uma página por conceito.

---

# 8. Configuração das etapas

Preferir definição centralizada.

Exemplo conceitual:

```ts
const mappingSteps = [
  {
    id: 'identification',
    route: 'identification',
  },
  {
    id: 'purposes',
    route: 'purposes',
  },
  {
    id: 'personal-data',
    route: 'personal-data',
  },
];
```

Não espalhar sequência do wizard por múltiplos componentes sem fonte clara.

---

# 9. Etapas condicionais

Nem todas as etapas precisam aparecer sempre.

Exemplo:

```text
Existe transferência internacional?

NÃO
↓
não exigir detalhes da transferência

SIM
↓
exibir etapa de transferência internacional
```

---

# 10. Regra importante

Ocultar uma etapa no frontend não significa automaticamente:

```text
apagar os dados persistidos daquela etapa
```

O comportamento precisa ser definido explicitamente.

---

# 11. Dados condicionais antigos

Exemplo:

```text
Usuário informa:
internationalTransfer = true

↓
preenche:
Brasil → Estados Unidos

↓
depois altera:
internationalTransfer = false
```

Precisamos decidir se os dados anteriores serão:

```text
apagados

inativados

mantidos sem efeito

preservados apenas no histórico
```

Não apagar silenciosamente.

---

# 12. Nova questão — MWQ-001

**Status:** OPEN  
**Priority:** HIGH

Quando uma condição deixa de ser aplicável, o que acontece com dados dependentes já preenchidos?

Exemplo:

```text
International Transfer = SIM
↓
dados preenchidos
↓
International Transfer = NÃO
```

Essa decisão afeta:

```text
frontend

API

banco

versionamento

audit
```

---

# 13. Navegação

Usuário deve conseguir:

```text
Voltar

Salvar

Continuar
```

conforme estado e permissões.

---

# 14. Salvar

Ação:

```text
Salvar
```

persiste informações válidas da etapa atual sem exigir conclusão de toda atividade.

---

# 15. Continuar

Ação:

```text
Continuar
```

pode:

```text
validar etapa atual

salvar

avançar
```

---

# 16. Voltar

Ação:

```text
Voltar
```

não deve apagar alterações já persistidas.

Para alterações locais ainda não salvas, UX precisa tratar perda potencial.

---

# 17. Autosave

Estratégia ainda depende de:

```text
FEQ-003
```

Possibilidades:

```text
manual

autosave

híbrido
```

Não implementar autosave como requisito definitivo enquanto questão estiver aberta.

---

# 18. Recomendação provisória

Para V1, a opção mais simples é:

```text
Salvar
+
Salvar e continuar
```

com persistência explícita.

Isso reduz complexidade de:

```text
debounce

concorrência

erros silenciosos

feedback de salvamento
```

Mas continua sendo decisão de frontend/produto.

---

# 19. Retomada

Ao retornar à atividade:

```text
GET ProcessingActivity
↓
carregar progresso
↓
abrir wizard
↓
continuar mapeamento
```

---

# 20. Etapa inicial ao retomar

Pode ser:

```text
última etapa visitada
```

ou:

```text
primeira etapa incompleta
```

Ainda precisa ser definido.

---

# 21. Nova questão — MWQ-002

**Status:** OPEN  
**Priority:** MEDIUM

Ao retomar o wizard, abrir:

```text
última etapa visitada
```

ou:

```text
primeira etapa incompleta
```

?

---

# 22. Progresso

Interface pode apresentar:

```text
3 de 10 etapas
```

ou:

```text
30%
```

Mas etapas condicionais tornam porcentagem menos trivial.

---

# 23. Progresso não é Compliance

Não confundir:

```text
Wizard Progress
```

com:

```text
Compliance Status
```

Exemplo:

```text
Wizard = 100%

Compliance = PENDING
```

é possível.

---

# 24. Progresso não deve ser inventado pelo frontend

Idealmente o backend deve fornecer informações suficientes para determinar o estado real.

Possível contrato futuro:

```json
{
  "progress": {
    "completedSteps": [
      "identification",
      "personal-data"
    ],
    "currentStep": "collection"
  }
}
```

A implementação definitiva está aberta.

---

# 25. Nova questão — MWQ-003

**Status:** OPEN  
**Priority:** MEDIUM

Backend fornecerá:

```text
wizardProgress
```

explicitamente?

Ou frontend derivará progresso dos dados?

Recomendação arquitetural:

```text
backend deve fornecer ao menos o estado necessário
para evitar regras de negócio duplicadas
```

---

# 26. STEP 1 — Identificação

Objetivo:

```text
identificar a atividade
```

Campos inicialmente relacionados:

```text
name

businessUnit

description?
```

---

# 27. Nome

Obrigatório para criação da atividade.

Exemplo:

```text
Processamento da folha de pagamento
```

---

# 28. Área responsável

Obrigatória.

Selecionada de:

```text
BusinessUnit
```

da organização ativa.

---

# 29. Área e tenant

Backend deve validar:

```text
businessUnit.organizationId
=
activity.organizationId
```

---

# 30. Description

Obrigatoriedade depende de:

```text
PAQ-001
```

Não tornar obrigatório silenciosamente.

---

# 31. STEP 2 — Finalidade

Objetivo:

```text
registrar por que o tratamento é realizado
```

Exemplo:

```text
Realizar cálculo e pagamento da remuneração dos funcionários.
```

---

# 32. Cardinalidade

Depende de:

```text
DQ-004
```

Enquanto estiver aberta, não consolidar UI irreversível para somente uma finalidade.

---

# 33. Caso 1:N

UI poderia permitir:

```text
Finalidades

[ + Adicionar finalidade ]

1. Processar folha de pagamento

2. Cumprir obrigações relacionadas à remuneração
```

Somente implementar após decisão funcional.

---

# 34. Finalidade obrigatória

Para conclusão do mapeamento:

```text
Purpose
```

deve existir conforme regras atuais.

Draft pode permanecer sem finalidade.

---

# 35. STEP 3 — Dados pessoais

Objetivo:

```text
identificar quais categorias de dados são tratadas
```

---

# 36. Categorias

Exemplos iniciais:

```text
Identificação

Financeiro

Saúde

Biometria

Imagem/Voz

Opinião política

Outros
```

A lista deve vir do catálogo.

---

# 37. Não hardcode

Evitar:

```ts
const categories = [
  'HEALTH',
  'FINANCIAL',
  ...
];
```

diretamente na tela se o backend disponibilizar catálogo.

---

# 38. Seleção múltipla

Usuário deve poder selecionar:

```text
N categorias
```

quando aplicável.

---

# 39. Dados sensíveis

Categorias sensíveis devem possuir indicação visual.

Exemplo:

```text
Saúde
Dado sensível
```

Não utilizar apenas cor.

---

# 40. Efeito

Seleção de dado sensível deve ser preservada para avaliação posterior do:

```text
Compliance Gate
```

---

# 41. Dados específicos

Se:

```text
DQ-001
```

aprovar `PersonalDataItem`, UI poderá permitir:

```text
Identificação
├── Nome
├── CPF
├── E-mail
└── Telefone
```

Não implementar antes da decisão se isso aumentar significativamente o escopo.

---

# 42. Outros

Categoria:

```text
OTHER
```

pode exigir:

```text
description
```

A regra precisa ser definida no catálogo/negócio.

---

# 43. STEP 4 — Titulares

Objetivo:

```text
identificar de quem são os dados
```

Categorias iniciais:

```text
Funcionários

Candidatos

Clientes

Fornecedores

Menores

Outros
```

---

# 44. Seleção múltipla

Uma atividade pode envolver múltiplos titulares.

Exemplo:

```text
Funcionários

Dependentes
```

se o catálogo contemplar esses tipos.

---

# 45. Menores

Quando categoria representar menor:

```text
Minor Data Check
```

deve ser considerado posteriormente.

Não assumir:

```text
FAIL
```

automaticamente.

---

# 46. Dados vs titulares

Não confundir:

```text
tipo de dado
```

com:

```text
tipo de titular
```

Exemplo:

```text
Biometria
=
dado
```

```text
Funcionário
=
titular
```

---

# 47. STEP 5 — Fonte de coleta

Objetivo:

```text
identificar como os dados entram no processo
```

Pergunta central do desenho funcional:

```text
Os dados são coletados por documento?
```

---

# 48. Branch A — Documento

Se:

```text
SIM
```

exibir campos relacionados a documento.

---

# 49. Tipo de documento

Exemplos:

```text
Contrato

Ficha

Formulário

Documento de identificação

Outro
```

Pode ser texto ou catálogo conforme decisão futura.

---

# 50. Momento da coleta

Registrar quando ocorre.

Exemplos conceituais:

```text
admissão

cadastro

contratação

atendimento
```

Não hardcode exemplos como enum sem regra aprovada.

---

# 51. Modelo do documento

Pode permitir upload de:

```text
modelo
```

preferencialmente sem dados pessoais reais quando possível.

---

# 52. Upload

Frontend deve respeitar regras definidas em:

```text
09-SECURITY.md
```

e decisões:

```text
SECQ-007
VALQ-004
SECQ-005
INFRAQ-002
APIQ-007
```

---

# 53. Branch B — Não documental

Se:

```text
NÃO
```

identificar:

```text
sistema

formulário

outra origem
```

---

# 54. Sistema

Pode selecionar:

```text
System
```

existente.

---

# 55. Quick Create System

Se autorizado:

```text
Sistema não encontrado
↓
Adicionar sistema
```

---

# 56. Sistema criado rapidamente

Pode nascer:

```text
mappingStatus = PENDING
```

conforme regras de Systems.

---

# 57. Coleta direta

Pergunta:

```text
Os dados são coletados diretamente do titular?
```

Valores:

```text
SIM

NÃO
```

---

# 58. Origem indireta

Caso:

```text
NÃO
```

pode ser necessário identificar origem.

O documento funcional não define detalhamento completo dessa origem.

Não inventar campos adicionais obrigatórios sem decisão.

---

# 59. Múltiplas fontes

O modelo permite conceitualmente múltiplas:

```text
CollectionSources
```

A UX precisa decidir se V1 permitirá isso explicitamente.

---

# 60. Nova questão — MWQ-004

**Status:** OPEN  
**Priority:** HIGH

Uma atividade pode possuir múltiplas fontes de coleta?

Exemplo:

```text
Portal

Contrato físico

API de parceiro
```

O modelo arquitetural suporta `1:N`, mas comportamento funcional precisa ser confirmado.

---

# 61. STEP 6 — Tratamento

Pergunta central:

```text
Os dados são tratados além do simples armazenamento?
```

---

# 62. Se NÃO

Nenhuma operação adicional precisa ser selecionada nessa branch.

O fluxo segue para metadata/compliance aplicável.

---

# 63. Se SIM

Usuário seleciona operações realizadas.

---

# 64. Operações

Tipos inicialmente previstos:

```text
USE

UPDATE

INTERNAL_TRANSFER

EXTERNAL_TRANSFER

INTERNATIONAL_TRANSFER

DELETE
```

---

# 65. Labels pt-BR

Frontend pode apresentar:

```text
Uso

Alteração

Transferência interna

Transferência externa

Transferência internacional

Exclusão
```

mantendo códigos estáveis na API.

---

# 66. Múltiplas operações

Usuário pode selecionar várias.

Exemplo:

```text
[x] Uso

[x] Transferência interna

[x] Exclusão
```

---

# 67. Detalhamento da operação

Cada operação pode exigir informações adicionais.

Exemplo:

```text
Operation
↓
System
↓
Business Unit
```

conforme regra definida.

---

# 68. Não criar formulário gigante

Preferir detalhamento contextual por operação.

Exemplo:

```text
Transferência interna
↓
Para qual área?
```

em vez de dezenas de campos sempre visíveis.

---

# 69. Transferência interna

Pode exigir:

```text
destinationBusinessUnit
```

quando aplicável.

---

# 70. Transferência externa

Pode exigir:

```text
Recipient

Supplier
```

conforme modelagem aprovada.

---

# 71. Transferência internacional

Ativa branch adicional:

```text
International Transfer
```

---

# 72. Exclusão

Registrar que exclusão faz parte do ciclo de tratamento.

Não confundir:

```text
ProcessingOperation.DELETE
```

com exclusão da própria:

```text
ProcessingActivity
```

---

# 73. STEP 7 — Destinatários

Objetivo:

```text
identificar quem recebe os dados
```

---

# 74. Tipos

Conceitualmente:

```text
INTERNAL

OPERATOR

PUBLIC_AUTHORITY

OTHER
```

---

# 75. Destinatário interno

Selecionar:

```text
BusinessUnit
```

da mesma organização.

---

# 76. Destinatário externo

Pode selecionar:

```text
Supplier
```

---

# 77. Quick Create Supplier

Se autorizado:

```text
Fornecedor não encontrado
↓
Adicionar fornecedor
```

---

# 78. Supplier pendente

Novo fornecedor pode possuir:

```text
mappingStatus = PENDING
```

---

# 79. Autoridade pública

Pode exigir identificação textual da autoridade.

O modelo definitivo deve ser definido antes de consolidar campos.

---

# 80. Outros destinatários

Pode exigir descrição.

---

# 81. STEP 8 — Transferência internacional

Esta etapa aparece quando houver indicação de:

```text
INTERNATIONAL_TRANSFER
```

---

# 82. País de destino

Campo:

```text
destinationCountry
```

deve ser informado quando aplicável.

---

# 83. Country Selector

Preferir catálogo padronizado de países.

Não permitir múltiplas grafias inconsistentes como:

```text
USA

U.S.A.

Estados Unidos

United States
```

internamente.

---

# 84. Código

Pode utilizar padrão como:

```text
ISO 3166-1
```

se aprovado tecnicamente.

UI continua exibindo nome localizado.

---

# 85. Múltiplos países

Uma atividade pode transferir dados para mais de um país.

O modelo `InternationalTransfer` pode representar múltiplos registros.

Confirmar UX antes da implementação.

---

# 86. Mecanismo

Pode existir campo:

```text
transferMechanism
```

---

# 87. Regra jurídica

A aplicação não deve decidir automaticamente:

```text
qual mecanismo é juridicamente adequado
```

sem regra formal aprovada.

---

# 88. Gate

Transferência internacional deve gerar check correspondente.

---

# 89. STEP 9 — Retenção

Objetivo:

```text
registrar por quanto tempo os dados são mantidos
```

---

# 90. Campos

Estrutura prevista:

```text
duration

unit

startEvent
```

---

# 91. Duration

Exemplo:

```text
5
```

---

# 92. Unit

Possíveis unidades:

```text
DAYS

MONTHS

YEARS
```

Lista definitiva deve ser centralizada.

---

# 93. Start Event

Exemplo:

```text
término do contrato
```

---

# 94. Texto livre vs catálogo

Ainda precisa ser definido se:

```text
startEvent
```

será:

```text
texto livre
```

ou:

```text
catálogo
```

---

# 95. Nova questão — MWQ-005

**Status:** OPEN  
**Priority:** MEDIUM

`Retention.startEvent` será:

```text
texto livre

catálogo

modelo híbrido
```

?

---

# 96. Granularidade

Depende de:

```text
DQ-005
```

Se retenção for por finalidade/dado, essa etapa precisará ser redesenhada.

---

# 97. STEP 10 — Medidas de segurança

Objetivo:

```text
registrar controles de segurança relacionados à atividade
```

---

# 98. Seleção

Pode utilizar catálogo.

Exemplo:

```text
[x] Controle de acesso

[x] Criptografia

[x] Backup

[x] MFA
```

---

# 99. Catálogo

Depende de:

```text
DQ-006
```

Pode existir:

```text
medidas globais

medidas da organização
```

---

# 100. Outras medidas

Pode existir:

```text
OTHER
```

com descrição.

---

# 101. Sem afirmação jurídica

UI não deve mostrar:

```text
"Segurança adequada"
```

apenas porque medidas foram selecionadas.

---

# 102. STEP 11 — Base legal

Objetivo:

```text
registrar a base legal informada para o tratamento
```

---

# 103. Cardinalidade

Depende de:

```text
DQ-002
```

---

# 104. Associação

Depende de:

```text
DQ-003
```

Essa é uma decisão crítica para a UI.

---

# 105. Se base legal for por atividade

UI simples:

```text
Atividade
↓
Base(s) legal(is)
```

---

# 106. Se for por finalidade

UI precisará relacionar:

```text
Purpose A
↓
Legal Basis A

Purpose B
↓
Legal Basis B
```

---

# 107. Não implementar associação errada

Enquanto:

```text
DQ-003 = OPEN
```

evitar construir uma estrutura difícil de migrar assumindo associação definitiva.

---

# 108. Legítimo interesse

Quando:

```text
LEGITIMATE_INTEREST
```

for selecionado:

```text
justification
```

é obrigatória conforme regra atual.

---

# 109. Campo condicional

Exemplo:

```text
Base legal:
Legítimo interesse

↓ aparece

Justificativa:
[________________________]
```

---

# 110. Consentimento

Quando aplicável, pode solicitar referência ao:

```text
ConsentDocument
```

---

# 111. Consent Document

Campos previstos:

```text
version

effectiveDate

collectionMethod

file
```

---

# 112. Consentimento individual

Não coletar:

```text
nome do titular

aceite

IP do titular

data individual de consentimento
```

na V1 sem mudança explícita de escopo.

---

# 113. STEP 12 — Revisão

Última etapa antes do submit.

Objetivo:

```text
mostrar resumo do mapeamento
```

---

# 114. Seções

Exemplo:

```text
Identificação

Finalidade

Dados pessoais

Titulares

Coleta

Operações

Destinatários

Transferência internacional

Retenção

Segurança

Base legal
```

---

# 115. Editar seção

Usuário pode selecionar:

```text
Editar
```

e retornar à etapa correspondente.

---

# 116. Pendências

Revisão pode mostrar campos faltantes.

Exemplo:

```text
Retenção
⚠ Informação pendente
```

---

# 117. Não confundir revisão com Gate

A tela de revisão verifica:

```text
completude do mapeamento
```

O Compliance Gate é processo separado.

---

# 118. Submit

Botão:

```text
Enviar mapeamento
```

ou label equivalente.

---

# 119. Submit backend

Operação semântica:

```http
POST /api/v1/processing-activities/:id/submit
```

---

# 120. Backend validation

Backend deve validar todas as regras necessárias para submissão.

Não confiar em:

```text
"Usuário passou por todas as telas"
```

como prova de completude.

---

# 121. Usuário pode pular URL

Mesmo que frontend bloqueie:

```text
Step 5
```

usuário tecnicamente pode tentar chamar API diretamente.

Backend precisa garantir invariantes.

---

# 122. Validation Levels

Wizard utiliza:

```text
Structural Validation

Step Validation

Submit Validation
```

---

# 123. Structural Validation

Exemplo:

```text
UUID válido

duration numérico

array válido
```

---

# 124. Step Validation

Valida campos necessários para salvar/avançar naquela etapa.

Não precisa garantir conclusão global.

---

# 125. Submit Validation

Valida requisitos necessários para finalizar o mapeamento.

---

# 126. Compliance Validation

Não deve ser misturada completamente com Submit Validation.

Exemplo:

```text
Submit
=
mapeamento suficientemente preenchido
```

```text
Compliance Gate
=
checks de compliance
```

A fronteira exata depende de:

```text
PAQ-006
```

---

# 127. Erros de campo

API deve permitir associar erro ao campo.

Exemplo:

```json
{
  "field": "retention.duration",
  "code": "RETENTION_DURATION_REQUIRED"
}
```

---

# 128. Erros de etapa

Frontend deve conseguir associar erro a:

```text
Retention Step
```

para orientar navegação.

---

# 129. Summary Errors

Exemplo:

```text
Existem 3 pendências:

• Retenção
• Base legal
• País da transferência internacional
```

---

# 130. API Strategy

Conforme `07-API.md`, preferir sub-recursos em vez de um único payload gigante.

Exemplo:

```text
/processing-activities/:id/purposes

/processing-activities/:id/data-categories

/processing-activities/:id/subjects

/processing-activities/:id/collection-sources

/processing-activities/:id/operations

/processing-activities/:id/recipients

/processing-activities/:id/retention

/processing-activities/:id/security-measures

/processing-activities/:id/legal-bases

/processing-activities/:id/international-transfers
```

---

# 131. Benefício

Isso permite:

```text
salvamento progressivo

validação localizada

menores payloads

isolamento de regras

evolução do wizard
```

---

# 132. Não acoplar API à tela

Endpoint não precisa necessariamente ser:

```text
/save-step-4
```

Preferir contratos de domínio.

A interface do wizard pode mudar sem exigir reconstrução completa da API.

---

# 133. Frontend structure

Sugestão:

```text
features/mapping-wizard/
├── api/
├── components/
├── hooks/
├── routes/
├── schemas/
├── steps/
│   ├── IdentificationStep/
│   ├── PurposeStep/
│   ├── PersonalDataStep/
│   ├── SubjectsStep/
│   ├── CollectionStep/
│   ├── OperationsStep/
│   ├── RecipientsStep/
│   ├── InternationalTransferStep/
│   ├── RetentionStep/
│   ├── SecurityStep/
│   ├── LegalBasisStep/
│   └── ReviewStep/
├── types/
└── utils/
```

---

# 134. Wizard Shell

Componente estrutural pode possuir:

```text
WizardHeader

WizardNavigation

WizardContent

WizardActions
```

---

# 135. Desktop

Exemplo conceitual:

```text
┌─────────────────────────────────────────────┐
│ Processamento da folha                     │
├──────────────┬──────────────────────────────┤
│ ✓ Atividade  │                              │
│ ✓ Dados      │      Conteúdo da etapa       │
│ ● Coleta     │                              │
│ ○ Operações  │                              │
│ ○ Retenção   │                              │
│ ○ Segurança  │                              │
│ ○ Base legal │                              │
├──────────────┴──────────────────────────────┤
│ Voltar              Salvar     Continuar   │
└─────────────────────────────────────────────┘
```

---

# 136. Mobile

Se suporte mobile for aprovado, navegação lateral pode virar:

```text
stepper horizontal

dropdown

progress header
```

Detalhes dependem de:

```text
FEQ-007
```

---

# 137. Step Status

Visualmente:

```text
COMPLETED

CURRENT

INCOMPLETE

ERROR
```

Podem ser úteis.

Não criar status persistente redundante sem necessidade.

---

# 138. Status visual

Não utilizar somente:

```text
verde
amarelo
vermelho
```

Utilizar:

```text
ícone
+
texto
```

---

# 139. Unsaved Changes

Se usuário alterar dados e tentar sair antes de salvar:

```text
alerta de alterações não salvas
```

pode ser exibido.

---

# 140. Browser navigation

Tratar:

```text
refresh

back

close
```

de forma consistente com estratégia de salvamento.

---

# 141. Concurrency

Cada save deve respeitar estratégia futura de concorrência.

Se backend retornar:

```text
409
```

wizard deve impedir sobrescrita silenciosa.

---

# 142. Conflict UX

Exemplo:

```text
Esta atividade foi alterada por outro usuário.

Recarregue os dados para continuar.
```

Uma futura comparação/merge pode ser implementada, mas não é necessária na V1.

---

# 143. Loading

Durante save:

```text
Salvar
↓
Salvando...
```

Evitar envio duplicado.

---

# 144. Success Feedback

Após persistência:

```text
Alterações salvas
```

pode ser exibido discretamente.

---

# 145. Network Failure

Se save falhar:

```text
não avançar silenciosamente

preservar formulário

mostrar erro

permitir retry
```

---

# 146. Server Error

Não apagar dados digitados devido a:

```text
500
```

quando puderem ser preservados localmente.

---

# 147. Authorization

Wizard depende de:

```text
processing_activity:update
```

e demais permissions específicas quando aplicável.

---

# 148. Read-only

Usuário sem permissão de edição pode visualizar mapeamento em modo:

```text
read-only
```

se possuir permission de leitura.

---

# 149. ACTIVE

Atividade ACTIVE não deve abrir diretamente para edição da versão publicada se regras exigirem:

```text
startRevision
```

---

# 150. Start Revision

Fluxo:

```text
ACTIVE
↓
Iniciar revisão
↓
UNDER_REVIEW
↓
Wizard editável
```

conforme workflow final.

---

# 151. Histórico

Ao visualizar versão histórica:

```text
Wizard
```

ou representação equivalente deve ser:

```text
read-only
```

---

# 152. Audit

Não é necessário criar AuditLog para cada:

```text
click

troca de step

abertura de dropdown
```

---

# 153. Mutations relevantes

Mudanças persistidas podem gerar eventos conforme estratégia de auditoria.

Exemplo:

```text
PROCESSING_ACTIVITY_UPDATED
```

---

# 154. Submit

Deve gerar:

```text
PROCESSING_ACTIVITY_SUBMITTED
```

quando concluído com sucesso.

---

# 155. Quick Create

Criação de System/Supplier deve possuir audit próprio quando aplicável.

---

# 156. Segurança

Wizard não deve exibir recursos de outro tenant em:

```text
selects

autocomplete

search

quick create
```

---

# 157. Catálogos

Toda busca deve respeitar:

```text
global authorized catalogs
```

ou:

```text
current organization
```

conforme tipo.

---

# 158. File Upload

Arquivos enviados durante wizard devem ser vinculados à:

```text
Organization
```

e ao recurso apropriado.

---

# 159. Sensitive Information

Evitar enviar conteúdo completo do wizard para:

```text
analytics

error tracking

console
```

sem necessidade.

---

# 160. Teste — retomada

```text
Given:
atividade parcialmente preenchida

When:
usuário sai e retorna

Then:
dados persistidos são restaurados
```

---

# 161. Teste — draft parcial

```text
Given:
apenas parte da etapa foi preenchida

When:
usuário salva draft

Then:
dados estruturalmente válidos são preservados
```

---

# 162. Teste — documento

```text
Given:
coleta por documento = SIM

When:
usuário acessa coleta

Then:
campos documentais aplicáveis são apresentados
```

---

# 163. Teste — não documental

```text
Given:
coleta por documento = NÃO

When:
usuário acessa coleta

Then:
fluxo de sistema/formulário/outra origem é apresentado
```

---

# 164. Teste — sensível

```text
Given:
usuário seleciona categoria sensível

When:
mapeamento é salvo

Then:
informação permanece identificável para Compliance Gate
```

---

# 165. Teste — menor

```text
Given:
usuário seleciona titular menor

When:
mapeamento é salvo

Then:
informação permanece identificável para Compliance Gate
```

---

# 166. Teste — internacional

```text
Given:
INTERNATIONAL_TRANSFER selecionada

When:
usuário avança

Then:
detalhamento de transferência internacional torna-se aplicável
```

---

# 167. Teste — país obrigatório

```text
Given:
transferência internacional aplicável

And:
destinationCountry ausente

When:
usuário tenta concluir requisito correspondente

Then:
erro estruturado é retornado
```

---

# 168. Teste — legítimo interesse

```text
Given:
Legal Basis = LEGITIMATE_INTEREST

And:
justification ausente

When:
usuário tenta concluir etapa

Then:
justification é exigida
```

---

# 169. Teste — branch alterada

Após resolver `MWQ-001`:

```text
Given:
branch condicional previamente preenchida

When:
usuário altera condição

Then:
dados dependentes seguem exatamente a política definida
```

---

# 170. Teste — cross-tenant

```text
Given:
Activity da Organization A

When:
usuário tenta selecionar System da Organization B

Then:
backend rejeita associação
```

---

# 171. Teste — permission

```text
Given:
usuário possui read mas não update

When:
abre wizard

Then:
visualização pode ocorrer

And:
mutations são bloqueadas
```

---

# 172. Teste — submit

```text
Given:
mapeamento válido para submissão

When:
usuário executa Submit

Then:
backend executa workflow definido

And:
evento de auditoria é registrado
```

---

# 173. Teste — submit inválido

```text
Given:
mapeamento incompleto

When:
Submit é executado

Then:
status não avança

And:
erros são retornados
```

---

# 174. Teste — concorrência

Após estratégia definida:

```text
Given:
dois usuários editaram mesma versão

When:
segundo tenta salvar versão obsoleta

Then:
não ocorre sobrescrita silenciosa
```

---

# 175. Open Questions relacionadas

```text
DQ-001 — granularidade dos dados

DQ-002 — cardinalidade de base legal

DQ-003 — associação da base legal

DQ-004 — cardinalidade da finalidade

DQ-005 — granularidade da retenção

DQ-006 — catálogo de segurança

DQ-011 — consentimento individual (respondida por DEC-026)

WFQ-001 — DRAFT vs MAPPING

WFQ-002 — revisão humana

WFQ-007 — revisão de ACTIVE

APIQ-021 — estratégia da API do wizard

APIQ-004 — concorrência

APIQ-007 — upload

FEQ-003 — autosave

APIQ-016 — allowedActions

FEQ-007 — suporte mobile

PAQ-006 — Submit vs Gate
```

---

# 176. Open Questions específicas

```text
MWQ-001
Dados condicionais antigos

MWQ-002
Etapa de retomada

MWQ-003
Progresso fornecido pelo backend

MWQ-004
Múltiplas fontes de coleta

MWQ-005
Retention.startEvent
```

As definições canônicas dessas questões estão no:

```text
12-OPEN-QUESTIONS.md
```

Aliases e migrações estão registrados no documento central.

---

# 177. Critérios de aceite

```text
AC-MW-001

Given:
atividade DRAFT

When:
usuário inicia o wizard

Then:
pode preencher e salvar progressivamente
```

```text
AC-MW-002

Given:
atividade parcialmente preenchida

When:
usuário retorna posteriormente

Then:
informações persistidas continuam disponíveis
```

```text
AC-MW-003

Given:
etapa condicional não aplicável

When:
wizard é renderizado

Then:
usuário não é obrigado a preenchê-la
```

```text
AC-MW-004

Given:
etapa condicional aplicável

When:
usuário tenta concluir sem campos obrigatórios

Then:
backend rejeita a conclusão correspondente
```

```text
AC-MW-005

Given:
mapeamento incompleto

When:
usuário salva draft

Then:
atividade não precisa satisfazer todas as regras de Submit
```

```text
AC-MW-006

Given:
mapeamento incompleto

When:
usuário executa Submit

Then:
backend retorna pendências estruturadas

And:
workflow não avança indevidamente
```

```text
AC-MW-007

Given:
usuário sem permission de update

When:
tenta persistir alteração

Then:
backend rejeita mutation
```

```text
AC-MW-008

Given:
recurso de outro tenant

When:
é utilizado em campo do wizard

Then:
backend rejeita associação
```

```text
AC-MW-009

Given:
atividade ACTIVE

When:
edição relevante for necessária

Then:
workflow de revisão/versionamento é respeitado
```

---

# 178. Definition of Done

O Mapping Wizard está concluído quando aplicável:

```text
[ ] estrutura das etapas definida

[ ] navegação implementada

[ ] draft progressivo implementado

[ ] retomada implementada

[ ] identificação implementada

[ ] finalidade implementada

[ ] dados pessoais implementados

[ ] titulares implementados

[ ] coleta documental implementada

[ ] coleta não documental implementada

[ ] sistemas integrados

[ ] operações implementadas

[ ] destinatários implementados

[ ] fornecedores integrados

[ ] transferência internacional implementada

[ ] retenção implementada

[ ] segurança implementada

[ ] base legal implementada

[ ] consent document integrado quando aplicável

[ ] revisão final implementada

[ ] Submit integrado ao workflow

[ ] validação backend implementada

[ ] erros por etapa implementados

[ ] tenant isolation validado

[ ] permissions aplicadas

[ ] concorrência tratada

[ ] audit aplicado

[ ] versionamento respeitado

[ ] acessibilidade validada

[ ] testes unitários

[ ] testes de integração

[ ] testes cross-tenant

[ ] testes E2E dos branches críticos

[ ] documentação atualizada
```

---

# 179. Regra final

O wizard deve ser tratado como:

```text
interface guiada para editar o modelo de domínio
```

e não como:

```text
modelo de negócio paralelo
```

As regras definitivas permanecem no backend.

O frontend deve orientar o usuário.

O backend deve garantir:

```text
integridade

autorização

tenant isolation

workflow

validação

versionamento
```

A navegação entre etapas nunca deve ser utilizada como prova de que uma regra de negócio foi satisfeita.

---

# 180. Próxima feature

O próximo documento recomendado é:

`docs/features/COMPLIANCE-GATE.md`

Ele deverá especificar:

```text
checks

PASS

FAIL

REVIEW_REQUIRED

NOT_APPLICABLE

regras obrigatórias

base legal

retenção

medidas de segurança

dados sensíveis

menores

transferência internacional

execução do Gate

reexecução

bloqueios

revisão humana

integração com workflow

auditoria

testes
```