# UX Guidelines

> **Documento:** UX Guidelines  
> **Status:** Draft  
> **Objetivo:** definir padrões de experiência e interação para que todas as telas da plataforma mantenham comportamento consistente, previsível, acessível e compatível com os workflows definidos.

## Primeiro shell — direção visual aprovada

[DEC-071](13-DECISIONS.md#dec-071--escolhas-técnicas-e-escopo-do-primeiro-frontend-shell), aprovada em 2026-10-23, registra Tailwind CSS com plugin Vite, componentes próprios e HTML semântico exclusivamente para o primeiro shell, React Router declarativo para a base frontend, Lucide React e Vitest + Testing Library para testes comportamentais. FEQ-013 está DECIDED; FEQ-001 permanece OPEN para a biblioteca global.

Direção visual: SaaS moderno e minimalista, tema claro, cores neutras e detalhes em azul/índigo. Tokens locais e provisórios; FEQ-002 e FEQ-010 continuam OPEN. Não se afirma existência de design system corporativo aprovado ou de Figma oficial.

Escopo aprovado: App, AppLayout, Sidebar responsiva, Header, HomePage informativa, EmptyState reutilizável, NotFoundPage, rota `/` e fallback, com acessibilidade básica. Não inclui login ou autenticação fictícia, autenticação real, seletor de Organization (FEQ-015 OPEN), permissões funcionais, métricas simuladas, endpoints não existentes ou navegação para módulos indisponíveis. A lista candidata de módulos em seções legadas não autoriza exibi-los neste shell.

Estado: escolhas registradas; implementação, instalação de dependências e testes do shell ainda pendentes. Este registro não altera a conclusão estrutural da S3.5 nem declara autenticação ou autorização frontend implementadas.

---

# 1. Objetivo

Este documento define padrões para:

```text
layout

navigation

forms

Wizard

tables

filters

loading

empty states

errors

success feedback

confirmation

destructive actions

status presentation

Compliance Gate

Dashboard

Quick Create

Notifications

historical views

responsive behavior

accessibility

unsaved changes
```

---

# 2. Princípio fundamental

A interface deve representar o estado real do domínio.

Nunca:

```text
UI assumption
↓
domain state
```

Sempre:

```text
backend/domain state
↓
UI representation
```

---

# 3. Backend Authority

Aplicar:

```text
DEC-005
```

Frontend não decide:

```text
authorization

workflow transition

Compliance result

tenant scope

business invariants
```

---

# 4. UX não substitui autorização

Esconder botão:

```text
Delete
```

não impede operação.

Backend continua responsável pela autorização.

---

# 5. Linguagem

Interface inicial:

```text
pt-BR
```

Código e identificadores técnicos:

```text
English
```

---

# 6. Terminologia consistente

O mesmo conceito deve possuir o mesmo nome em toda aplicação.

Evitar:

```text
Atividade

Processo

Tratamento

Mapeamento
```

sendo usados aleatoriamente para representar `ProcessingActivity`.

---

# 7. Glossário de UI inicial

```text
ProcessingActivity
→ Atividade de tratamento

BusinessUnit
→ Área / Unidade

System
→ Sistema

Supplier
→ Fornecedor

LegalBasis
→ Base legal

DataSubject
→ Titular

PersonalData
→ Dado pessoal

Compliance Gate
→ Verificação de conformidade

ROPA
→ Registro das atividades de tratamento
```

Terminologia jurídica final deve acompanhar validação do produto.

---

# 8. Não afirmar conformidade jurídica

Interface não deve exibir:

```text
LGPD compliant

100% compliant

Legalmente aprovado

Conforme a LGPD
```

apenas porque Gate está COMPLETE.

Aplicar:

```text
DEC-022
DEC-023
```

---

# 9. Layout Principal

Estrutura sugerida:

```text
┌─────────────────────────────────────────────┐
│ Header                                      │
├──────────────┬──────────────────────────────┤
│ Navigation   │ Main Content                 │
│              │                              │
│              │                              │
└──────────────┴──────────────────────────────┘
```

---

# 10. Header

Pode conter:

```text
Organization

user menu

notifications

account/session actions
```

---

# 11. Sidebar

Navegação principal candidata:

```text
Dashboard

Atividades de tratamento

ROPA

Sistemas

Fornecedores

Administração
```

Itens dependem de autorização.

---

# 12. Não renderizar navegação impossível

Se usuário não possui acesso ao módulo:

```text
hide navigation entry
```

como melhoria de UX.

Backend continua protegendo endpoint.

---

# 13. Organization Context

Se multi-org for adotado:

```text
Organization ativa
```

deve estar claramente visível.

Relacionado a:

```text
AUTHQ-006
```

---

# 14. Organization Switch

Troca de Organization deve:

```text
change authenticated context

invalidate tenant-specific cache

reload permissions

reload tenant data
```

Não apenas alterar variável visual.

---

# 15. Breadcrumb

Utilizar quando ajudar orientação.

Exemplo:

```text
Atividades
>
Folha de pagamento
>
Base legal
```

---

# 16. Page Header

Páginas principais devem possuir:

```text
title

optional description

primary action

contextual secondary actions
```

---

# 17. Primary Action

Evitar múltiplos botões visualmente primários competindo.

Exemplo:

```text
Nova atividade
```

como ação principal da listagem.

---

# 18. Forms

Campos devem possuir:

```text
label

input

help text when necessary

validation feedback
```

---

# 19. Placeholder

Placeholder não substitui label.

Errado:

```text
[ Nome da atividade... ]
```

sem label.

---

# 20. Required Fields

Campos obrigatórios no contexto atual devem possuir indicação consistente.

Exemplo:

```text
Nome da atividade *
```

---

# 21. Draft Context

Não marcar visualmente todos os requisitos futuros como erro enquanto usuário ainda está preenchendo Draft.

---

# 22. Validation Timing

Preferir:

```text
on blur

on submit/continue

after first invalid attempt
```

conforme tipo de campo.

Evitar apresentar dezenas de erros imediatamente ao abrir formulário vazio.

---

# 23. Error Message

Mensagem deve explicar:

```text
what needs attention
```

Exemplo:

```text
Informe o nome da atividade.
```

Não:

```text
Invalid input.
```

---

# 24. Error Code

Frontend deve usar error code para decidir comportamento.

Aplicar:

```text
19-ERROR-CATALOG.md
```

Não interpretar mensagem textual do backend.

---

# 25. Field Error

Erro deve aparecer próximo ao campo correspondente.

---

# 26. Summary Error

Formulários extensos podem possuir resumo adicional.

Especialmente:

```text
Wizard review

Submit validation
```

---

# 27. Accessibility of Errors

Erro deve ser:

```text
programmatically associated with field

announced when appropriate

not represented only by color
```

---

# 28. Save Feedback

Salvar Draft deve produzir feedback discreto.

Exemplo:

```text
Alterações salvas
```

Evitar modal para cada salvamento.

---

# 29. Saving State

Pode apresentar:

```text
Salvando...

Salvo

Erro ao salvar
```

se autosave for adotado.

---

# 30. Autosave

Depende de:

```text
FEQ-003
```

Não implementar autosave silencioso antes da decisão.

---

# 31. Unsaved Changes

Depende de:

```text
FEQ-006
```

Se usuário tentar sair com alterações locais:

```text
warn before losing changes
```

quando aplicável.

---

# 32. Wizard

Wizard deve reduzir complexidade do mapeamento.

Não deve parecer formulário único gigantesco.

---

# 33. Wizard Structure

Etapas conceituais:

```text
1. Identificação

2. Finalidade

3. Dados pessoais

4. Titulares

5. Coleta

6. Tratamento

7. Destinatários

8. Transferência internacional

9. Retenção

10. Segurança

11. Base legal

12. Revisão
```

---

# 34. Step Navigation

Wizard deve apresentar:

```text
current step

completed steps

remaining steps
```

sem confundir:

```text
Wizard progress
```

com:

```text
Compliance status
```

---

# 35. Wizard Progress

Fonte definitiva depende de:

```text
MWQ-003
```

Não implementar percentual arbitrário antes da decisão.

---

# 36. Step Status

Conceitos visuais possíveis:

```text
Not started

In progress

Complete

Needs attention
```

Não precisam necessariamente existir como estado persistido.

---

# 37. Continue

Botão:

```text
Continuar
```

deve validar requisitos da etapa atual.

---

# 38. Back

Botão:

```text
Voltar
```

não deve apagar dados.

---

# 39. Save and Exit

Pode existir:

```text
Salvar e sair
```

para permitir continuidade posterior.

---

# 40. Resume

Comportamento depende de:

```text
MWQ-002
```

---

# 41. Conditional Questions

Wizard deve revelar campos conforme respostas.

Exemplo:

```text
Existe transferência internacional?
```

Se:

```text
Sim
```

mostrar:

```text
País de destino

Mecanismo
```

---

# 42. Hidden Data

Ao esconder campo por mudança de resposta, aplicar política definida em:

```text
MWQ-001
```

Não apagar silenciosamente.

---

# 43. Conditional Confirmation

Se mudança puder remover informação existente, UX recomendada:

```text
inform user

request confirmation when destructive
```

---

# 44. Personal Data Selection

Categorias podem ser apresentadas como:

```text
checkbox list

searchable list
```

dependendo do tamanho final do catálogo.

---

# 45. Sensitive Data Presentation

Categorias sensíveis podem possuir indicação informativa.

Exemplo:

```text
Dado sensível
```

Não usar apresentação alarmista como:

```text
PERIGO
```

ou:

```text
ILEGAL
```

---

# 46. Minor Data

Mesma regra.

Pode indicar:

```text
Envolve crianças/adolescentes
```

sem concluir irregularidade.

---

# 47. Quick Create

Wizard pode permitir criar:

```text
System

Supplier
```

sem sair do fluxo.

---

# 48. Quick Create UX

Preferir:

```text
modal
```

ou:

```text
drawer
```

conforme decisão:

```text
FEQ-005
```

---

# 49. Quick Create Result

Após criar:

```text
resource created

resource selected automatically

mappingStatus = PENDING
```

quando aplicável.

---

# 50. Pending Resource Indicator

Exibir claramente:

```text
Mapeamento pendente
```

---

# 51. Não usar "inválido"

System/Supplier PENDING não significa:

```text
invalid
```

---

# 52. Tables

Listagens devem possuir estrutura consistente.

Exemplo:

```text
Name

Business Unit

Status

Compliance

Updated At

Actions
```

quando aplicável.

---

# 53. Table Actions

Evitar muitos botões por linha.

Preferir:

```text
primary row action

overflow menu
```

para ações secundárias.

---

# 54. Row Click

Se linha inteira for clicável, manter acessibilidade para teclado.

---

# 55. Pagination

Aplicar:

```text
20-API-CONTRACTS.md
```

Frontend não deve carregar todos os registros apenas para paginar localmente em datasets potencialmente grandes.

---

# 56. Filters

Filtros devem refletir parâmetros da API.

---

# 57. Filter State

Pode ser persistido em URL quando útil.

Exemplo:

```text
status

businessUnit

search
```

---

# 58. Clear Filters

Sempre fornecer maneira simples de:

```text
Limpar filtros
```

quando múltiplos filtros estiverem ativos.

---

# 59. Empty State

Diferenciar:

```text
no data exists
```

de:

```text
filters returned no results
```

---

# 60. First-use Empty State

Exemplo:

```text
Nenhuma atividade de tratamento cadastrada.
```

Se autorizado:

```text
[ Nova atividade ]
```

---

# 61. Filtered Empty State

Exemplo:

```text
Nenhuma atividade encontrada com os filtros selecionados.
```

Ação:

```text
Limpar filtros
```

---

# 62. Loading

Não utilizar apenas tela branca.

Pode utilizar:

```text
skeleton

spinner

progress indicator
```

conforme duração/contexto.

---

# 63. Skeleton

Preferível para:

```text
tables

cards

page content
```

quando estrutura já é conhecida.

---

# 64. Button Loading

Ao executar ação:

```text
Submit

Run Gate

Export
```

botão deve indicar processamento e impedir duplicação acidental quando necessário.

---

# 65. Long-running Action

Se ação for assíncrona:

```text
show job state
```

Não manter spinner infinito.

---

# 66. Error State

Erros de página devem diferenciar:

```text
temporary failure

not found/unavailable

forbidden

validation issue
```

sem revelar recursos cross-tenant.

---

# 67. Retry

Falhas temporárias podem apresentar:

```text
Tentar novamente
```

---

# 68. Success Feedback

Utilizar feedback proporcional.

Exemplo:

```text
toast
```

para:

```text
saved

updated

marked as read
```

---

# 69. Important Transition Feedback

Transições relevantes podem utilizar confirmação mais explícita.

Exemplo:

```text
Atividade enviada para revisão.
```

---

# 70. Confirmation Dialog

Usar para ações com consequência relevante.

Exemplos:

```text
archive

deactivate

cancel revision

discard changes
```

---

# 71. Não confirmar tudo

Não mostrar modal para ações triviais como:

```text
open

filter

save harmless field
```

---

# 72. Destructive Action

Modal deve informar:

```text
what will happen

whether historical data is preserved

whether action can be reversed
```

---

# 73. Button Labels

Preferir verbos específicos.

Bom:

```text
Arquivar atividade
```

Evitar:

```text
Confirmar
```

sem contexto.

---

# 74. Status Badges

Status devem possuir componente consistente.

---

# 75. Activity Status

Não depender apenas de cor.

Exemplo:

```text
[ Ativa ]
```

com texto visível.

---

# 76. Compliance Status

Separar visualmente de Activity Status.

Exemplo:

```text
Status da atividade: Ativa

Verificação: Completa
```

---

# 77. Não chamar COMPLETE de "Conforme"

Aplicar:

```text
DEC-023
```

---

# 78. Mapping Status

System/Supplier:

```text
PENDING
→ Mapeamento pendente

MAPPED
→ Mapeado
```

---

# 79. Compliance Gate UI

Gate deve mostrar checks individualmente.

Exemplo:

```text
Base legal
PASS

Retenção
PASS

Medidas de segurança
PASS

Transferência internacional
NOT_APPLICABLE

Dados sensíveis
REVIEW_REQUIRED
```

---

# 80. Check Labels

Frontend traduz códigos técnicos.

Não exibir necessariamente:

```text
REVIEW_REQUIRED
```

ao usuário final.

Pode apresentar:

```text
Revisão necessária
```

---

# 81. Check Explanation

Quando existir `reasonCode`, apresentar explicação compreensível.

---

# 82. Compliance Result

Não resumir Gate como:

```text
Aprovado pela LGPD
```

---

# 83. Review Required

Deve indicar:

```text
what needs human attention
```

sem concluir resultado da revisão.

---

# 84. Compliance Re-run

Se permitido:

```text
Executar verificação novamente
```

deve mostrar estado de processamento.

Comportamento depende de:

```text
CGQ-004
```

---

# 85. Dashboard

Dashboard deve priorizar:

```text
actionable overview
```

Não excesso de gráficos.

---

# 86. Dashboard Candidate Cards

```text
Mapeamento

Pendências

Dados sensíveis

Menores

Transferências internacionais

Sistemas pendentes

Fornecedores pendentes
```

---

# 87. Dashboard Metrics

Não mostrar fórmula não decidida.

Relacionado a:

```text
DASHQ-002
DASHQ-003
DASHQ-006
DASHQ-007
```

---

# 88. Metric Interaction

Quando possível, card pode levar para listagem filtrada correspondente.

Exemplo:

```text
5 sistemas pendentes
↓
/systems?mappingStatus=PENDING
```

---

# 89. Dashboard Empty State

Zero pode significar:

```text
nenhum item
```

ou:

```text
sem acesso aos itens
```

Backend deve fornecer somente escopo autorizado.

---

# 90. ROPA

ROPA deve ser apresentado como:

```text
read-only projection
```

---

# 91. ROPA Editing

Não permitir edição direta dentro do ROPA.

Ação deve direcionar para fonte correspondente:

```text
Processing Activity
```

quando autorizado.

---

# 92. ROPA Filters

Podem incluir:

```text
Business Unit

Activity status

Compliance status

Sensitive data

Minor data

International transfer
```

conforme API.

---

# 93. ROPA Export

Export deve indicar:

```text
format

scope/filter

processing state
```

quando aplicável.

---

# 94. Historical Views

Versões históricas devem possuir indicação clara:

```text
Visualizando versão histórica
```

---

# 95. Historical Read-only

Campos não devem parecer editáveis.

---

# 96. Version Header

Pode apresentar:

```text
Version

Created At

Created By
```

quando dados estiverem disponíveis.

---

# 97. Current vs Historical

Usuário deve conseguir distinguir:

```text
Current Activity

Historical Version
```

sem depender apenas da URL.

---

# 98. Revision

Quando Activity ACTIVE estiver em revisão, UX deve distinguir:

```text
published/current state
```

de:

```text
revision being edited
```

dependendo de:

```text
WFQ-007
WFQ-008
```

---

# 99. Notifications

Pode existir:

```text
bell

unread badge

notification list
```

conforme:

```text
24-NOTIFICATIONS.md
```

---

# 100. Notification Click

Deve navegar para recurso atual.

Autorização é reavaliada.

---

# 101. Stale Notification

Se recurso não estiver mais acessível:

```text
Este item não está mais disponível.
```

Não quebrar interface.

---

# 102. Search

Campos de busca devem possuir:

```text
clear button

debounce when appropriate

loading state
```

---

# 103. Debounce

Não precisa existir em campos que pesquisam somente após Submit.

---

# 104. Selects

Para catálogos pequenos:

```text
select
```

Para catálogos grandes:

```text
searchable combobox
```

---

# 105. Catalog Codes

UI exibe:

```text
label
```

e envia:

```text
code/id
```

---

# 106. OTHER

Se catálogo permitir:

```text
OTHER
```

e descrição for obrigatória conforme:

```text
CATQ-012
```

campo deve aparecer condicionalmente.

---

# 107. Date Input

Usuário visualiza formato local.

API utiliza formato definido em:

```text
20-API-CONTRACTS.md
```

---

# 108. Timestamp

Interface deve apresentar timezone de forma coerente.

Não mostrar timestamp UTC cru ao usuário quando isso prejudicar compreensão.

---

# 109. Relative Time

Pode mostrar:

```text
há 2 dias
```

mas informações críticas devem permitir visualizar data/hora exata.

---

# 110. Pending Age

Para pendências:

```text
Pendente há 15 dias
```

somente se `pendingSince` estiver semanticamente definido.

---

# 111. Responsive Behavior

Aplicação deve funcionar em tamanhos menores, mas foco inicial pode ser:

```text
desktop/tablet business application
```

dependendo de:

```text
FEQ-007
```

---

# 112. Mobile

Não assumir experiência mobile completa antes da decisão.

---

# 113. Tables on Small Screens

Possibilidades:

```text
horizontal scroll

responsive cards

reduced columns
```

Escolher por tela.

---

# 114. Accessibility

Meta depende de:

```text
FEQ-008
```

Mesmo antes da decisão, implementar fundamentos.

---

# 115. Keyboard

Elementos interativos devem ser acessíveis por teclado.

---

# 116. Focus

Modals/drawers devem:

```text
move focus appropriately

trap focus when open

restore focus when closed
```

---

# 117. Labels

Inputs devem possuir associação programática com labels.

---

# 118. Contrast

Status e erros não podem depender apenas de diferença sutil de cor.

---

# 119. Icons

Ícone não deve ser única forma de comunicar significado crítico.

---

# 120. Tooltips

Tooltip não deve conter informação essencial inacessível de outra forma.

---

# 121. Disabled Button

Evitar botão desabilitado sem explicar por quê.

Quando ação não estiver disponível, considerar:

```text
hide action
```

ou:

```text
disabled + explanation
```

conforme contexto.

---

# 122. Allowed Actions

Se:

```text
APIQ-016
```

adotar `allowedActions`, frontend pode utilizar para melhorar UX.

Backend continua autoridade.

---

# 123. Forbidden Action

Se backend retornar:

```text
403
```

frontend não deve tentar reinterpretar como validation error.

---

# 124. Not Found

Cross-tenant/unavailable pode resultar em:

```text
404
```

conforme políticas de segurança.

UI:

```text
Este recurso não está disponível.
```

---

# 125. Optimistic Updates

Usar apenas para ações simples e reversíveis.

Exemplo possível:

```text
mark notification read
```

---

# 126. Não usar optimistic update

Evitar para:

```text
Submit Activity

Activate Activity

Run Compliance Gate

Archive

version creation
```

quando resultado depende de regras backend.

---

# 127. Mutation Errors

Ao falhar:

```text
preserve user input
```

quando possível.

---

# 128. Form Reset

Não resetar formulário após erro.

---

# 129. Server Validation

Mapear erros de campo para formulário quando backend retornar detalhes.

---

# 130. Concurrent Modification

Quando:

```text
CONCURRENT_MODIFICATION
```

não sobrescrever silenciosamente.

UI deve informar que recurso mudou.

---

# 131. Concurrency UX

Possíveis ações:

```text
Reload latest

Review changes
```

dependendo da estratégia final:

```text
APIQ-004
```

---

# 132. Session Expiration

Se sessão expirar durante edição:

```text
preserve local unsaved state when safely possible
```

e solicitar autenticação novamente conforme arquitetura.

---

# 133. Loading Permission Context

Não renderizar brevemente conteúdo privilegiado antes de `/me` carregar.

---

# 134. Tenant Switch Loading

Ao trocar Organization:

```text
clear old tenant content before showing new tenant data
```

para evitar flash de dados anteriores.

---

# 135. File Upload

Deve mostrar:

```text
filename

size

upload progress when useful

success/error
```

---

# 136. Upload Validation

Erros devem ser específicos.

Exemplo:

```text
Arquivo excede o tamanho permitido.
```

---

# 137. Consent PDF

Se PDF for requisito:

```text
accept indication
```

pode ajudar UX.

Backend ainda valida arquivo.

---

# 138. File Removal

Remoção de arquivo já persistido pode exigir confirmação se impactar compliance/workflow.

---

# 139. Export

Ao solicitar export:

```text
show processing state
```

se assíncrono.

---

# 140. Export Success

Fornecer ação clara:

```text
Baixar arquivo
```

quando disponível e autorizado.

---

# 141. Export Failure

Mostrar:

```text
Não foi possível gerar o arquivo.
```

e retry quando seguro.

---

# 142. Comments

Sistema não possui requisito atual de comentários colaborativos genéricos.

Não adicionar:

```text
comment threads
```

sem requisito.

---

# 143. Rich Text

Não utilizar rich text editor onde texto simples é suficiente.

---

# 144. Markdown Inputs

Não adicionar suporte a Markdown em campos de negócio sem requisito.

---

# 145. Character Counter

Usar quando houver limite relevante e campo longo.

---

# 146. Default Values

Não pré-selecionar respostas juridicamente relevantes.

Exemplo:

```text
Legal Basis
```

deve exigir escolha explícita.

---

# 147. Boolean Questions

Quando:

```text
unanswered
```

for diferente de:

```text
No
```

usar UI que preserve três estados conceituais.

---

# 148. Example

Pergunta:

```text
Os dados são coletados diretamente do titular?
```

Antes de resposta:

```text
UNKNOWN
```

Não assumir:

```text
NO
```

---

# 149. Dangerous Confirmation

Não utilizar confirmação genérica:

```text
Tem certeza?
```

Preferir:

```text
Arquivar esta atividade?

Ela deixará de aparecer nas atividades ativas, mas seu histórico será preservado.
```

quando regra correspondente for verdadeira.

---

# 150. Toast Duration

Mensagens críticas não devem desaparecer rápido demais.

Erros que exigem ação devem permanecer acessíveis.

---

# 151. Error Recovery

Sempre que possível informar:

```text
what happened

what user can do next
```

---

# 152. Technical Errors

Não exibir:

```text
stack trace

SQL error

storage key

internal service name
```

---

# 153. Request ID

Em erro inesperado pode apresentar:

```text
Código de referência: {requestId}
```

para suporte.

---

# 154. Sensitive UI Data

Evitar exibir informações sensíveis em:

```text
browser title

URL query string

toast

client logs
```

sem necessidade.

---

# 155. URL

IDs técnicos podem estar na rota.

Não colocar textos potencialmente sensíveis em query string quando evitável.

---

# 156. Browser Storage

Não persistir conteúdo sensível de Activity em:

```text
localStorage
```

por conveniência.

---

# 157. Zustand

Usar para estado de cliente apropriado.

Não duplicar server state já gerenciado pelo TanStack Query.

---

# 158. TanStack Query

Usar para:

```text
server data

cache

loading

error

refetch
```

conforme:

```text
08-FRONTEND.md
```

---

# 159. React Hook Form

Adequado para:

```text
form state
```

---

# 160. Zod

Adequado para:

```text
frontend UX validation
```

Backend continua autoritativo.

---

# 161. Component Reuse

Criar componentes reutilizáveis para padrões reais.

Exemplos:

```text
StatusBadge

PageHeader

EmptyState

ErrorState

ConfirmDialog

FormField

DataTable

Pagination

NotificationBadge
```

---

# 162. Evitar abstração prematura

Não criar:

```text
UniversalEntityForm

GenericEverythingTable

DynamicDomainEngine
```

antes de padrões reais surgirem.

---

# 163. Design System

Decisão depende de:

```text
FEQ-001
FEQ-002
```

---

# 164. UI Library

Não misturar múltiplas bibliotecas de componentes sem necessidade.

---

# 165. Tailwind

Utilizar tokens/classes consistentes.

Evitar valores arbitrários diferentes para cada tela.

---

# 166. Color Semantics

Cores devem possuir significado consistente.

Exemplo conceitual:

```text
success

warning

danger

neutral

information
```

Mas texto continua obrigatório para status importantes.

---

# 167. Status Color Trap

Não assumir:

```text
green = legally compliant
```

Compliance COMPLETE pode usar apresentação positiva operacional sem afirmar conformidade jurídica.

---

# 168. Dashboard Charts

Só adicionar gráfico quando responder pergunta útil.

Não adicionar gráfico apenas para preencher espaço.

---

# 169. Data Visualization

Sempre apresentar:

```text
title

metric definition

scope
```

quando necessário.

---

# 170. Zero State

Não transformar:

```text
0 sensitive activities
```

em:

```text
Everything is compliant
```

---

# 171. Search Result Count

Pode mostrar:

```text
23 resultados
```

quando API fornecer total.

---

# 172. Bulk Actions

Não implementar ações em massa na V1 sem requisito.

Relacionado a:

```text
APIQ-008
```

---

# 173. Delete

Preferir:

```text
archive

deactivate
```

para recursos históricos quando domínio exigir.

---

# 174. Archive UX

Activity arquivada deve possuir indicação clara e normalmente read-only conforme regras.

---

# 175. System Deactivation

Antes de inativar System, UI pode informar existência de referências quando backend fornecer essa informação.

---

# 176. Supplier Deactivation

Mesma regra.

---

# 177. User Deactivation

Admin UI deve explicar impacto sem expor dados desnecessários.

---

# 178. Permission Denied

Não mostrar ação que usuário nunca poderá executar quando permission context for conhecido.

---

# 179. Approval Workflow

Não implementar UI de aprovação até:

```text
AUTHQ-002
BRQ-006
WFQ-004
```

serem resolvidas.

---

# 180. Review Assignment

Não inventar dropdown:

```text
Reviewer
```

até:

```text
WFQ-003
```

definir modelo.

---

# 181. Compliance Human Review

UI de resolução de:

```text
REVIEW_REQUIRED
```

depende de:

```text
CGQ-001
CGQ-002
```

---

# 182. Open Questions adicionadas

Adicionar a:

```text
docs/12-OPEN-QUESTIONS.md
```

```text
UXQ-001
Qual terminologia oficial será exibida para ProcessingActivity: "Atividade de tratamento", "Atividade de tratamento de dados" ou outra?
Priority: MEDIUM

UXQ-002
Wizard terá navegação livre entre etapas concluídas ou somente sequencial?
Priority: MEDIUM

UXQ-003
A aplicação terá página dedicada de Notifications ou apenas dropdown no header na V1?
Priority: LOW

UXQ-004
Quais ações destrutivas exigirão confirmação explícita?
Priority: MEDIUM

MWQ-001
Qual será o comportamento padrão para campos condicionais que já possuem dados quando sua condição deixar de ser verdadeira?
Priority: HIGH

UXQ-006
A V1 exibirá percentual visual de progresso do Wizard?
Priority: MEDIUM

UXQ-007
Qual será o comportamento visual para Activities ACTIVE que possuem uma revisão em andamento?
Priority: HIGH
```

---

# 183. Questões existentes relacionadas

```text
WFQ-003
AUTHQ-002
AUTHQ-006

FEQ-001
FEQ-002
FEQ-003
FEQ-004
FEQ-005
FEQ-006
FEQ-007
FEQ-008
FEQ-009

MWQ-001
MWQ-002
MWQ-003

CGQ-001
CGQ-002
CGQ-004

DASHQ-002
DASHQ-003
DASHQ-006
DASHQ-007

WFQ-007
WFQ-008

APIQ-004
APIQ-008
APIQ-016

CATQ-012

NOTIFQ-005
NOTIFQ-008
NOTIFQ-009
```

---

# 184. AI Implementation Rules

Antes de criar uma tela:

```text
1. Identify use case
2. Read feature specification
3. Read workflow
4. Read authorization rules
5. Read API contract
6. Read validation rules
7. Read this document
8. Check Open Questions
9. Implement smallest complete UX
10. Add component tests
11. Add E2E when flow is critical
```

---

# 185. AI Stop Condition

Se UX exigir decisão estrutural ainda OPEN:

```text
STOP
```

Exemplos:

```text
inventing reviewer

inventing approval button

inventing workflow status

inventing compliance resolution

inventing destructive behavior
```

---

# 186. Prohibited UX Patterns

Não fazer:

```text
hide backend errors

use color as only status indicator

show "LGPD compliant"

show "legal approval"

default Legal Basis

default unanswered boolean to false

erase conditional data silently

edit ROPA directly

edit historical versions

optimistically activate Activity

optimistically run Compliance Gate

show tenant data before context is loaded

use localStorage for sensitive forms

hardcode catalog labels as identifiers

create inconsistent status names

add confirmation dialog to every action

add charts without purpose

introduce complex component abstraction prematurely
```

---

# 187. UX Test Checklist

Para cada tela:

```text
[ ] loading state

[ ] empty state

[ ] success state

[ ] error state

[ ] validation state

[ ] unauthorized behavior

[ ] keyboard navigation

[ ] responsive behavior

[ ] long text

[ ] disabled/inactive resources

[ ] tenant switch when applicable

[ ] concurrent modification when applicable
```

---

# 188. Wizard Test Checklist

```text
[ ] create Draft

[ ] navigate forward

[ ] navigate backward

[ ] conditional fields

[ ] preserve entered values

[ ] validation errors

[ ] Save Draft

[ ] resume

[ ] Quick Create System

[ ] Quick Create Supplier

[ ] sensitive data indication

[ ] minor data indication

[ ] international transfer branch

[ ] review step

[ ] Submit failure

[ ] Submit success
```

---

# 189. Compliance UX Test Checklist

```text
[ ] PASS

[ ] FAIL

[ ] REVIEW_REQUIRED

[ ] NOT_APPLICABLE

[ ] aggregate PENDING

[ ] aggregate COMPLETE

[ ] aggregate BLOCKED

[ ] rerun loading

[ ] reason code presentation

[ ] human review when adopted
```

---

# 190. Accessibility Checklist

```text
[ ] labels associated

[ ] keyboard accessible

[ ] visible focus

[ ] semantic headings

[ ] error association

[ ] contrast adequate

[ ] status not color-only

[ ] modal focus management

[ ] accessible table structure

[ ] icon buttons have accessible names
```

---

# 191. Acceptance Criteria

Este documento estará aplicado quando:

```text
[ ] navigation is consistent

[ ] forms use common patterns

[ ] Wizard follows shared interaction rules

[ ] validation feedback is consistent

[ ] loading/error/empty states exist

[ ] status presentation is centralized

[ ] Activity and Compliance statuses are separated

[ ] ROPA is read-only

[ ] historical views are clearly identified

[ ] Quick Create is consistent

[ ] Notification UX is consistent

[ ] destructive actions are explicit

[ ] accessibility basics are implemented

[ ] backend remains authoritative
```

---

# 192. Definition of Done

Uma tela pode ser considerada pronta quando:

```text
[ ] requirements implemented

[ ] permissions respected

[ ] tenant scope respected

[ ] loading state implemented

[ ] empty state implemented when applicable

[ ] error state implemented

[ ] form validation implemented

[ ] backend errors mapped

[ ] success feedback implemented

[ ] accessibility reviewed

[ ] responsive behavior reviewed

[ ] component tests pass

[ ] critical E2E passes when applicable
```

---

# 193. Regra final

A interface deve tornar claro:

```text
where am I?

what information is required now?

what is optional?

what is pending?

what action can I take?

what happened after my action?
```

sem tentar responder automaticamente:

```text
"Is this legally compliant?"
```

A UX deve facilitar o mapeamento e a revisão.

Ela não deve transformar estados técnicos ou estruturais em conclusões jurídicas.

---

# 194. Próximo documento

O próximo documento é:

```text
docs/26-RELEASE-CHECKLIST.md
```

Ele deve consolidar os critérios necessários antes de liberar uma versão:

```text
Open Questions blockers

Decisions

database migrations

tenant isolation

authorization

security

Compliance Gate

versioning

AuditLog

ROPA

Dashboard

files

exports

observability

backups

tests

E2E

performance

accessibility

deployment

rollback

production configuration

post-deployment verification
```

O objetivo será impedir que uma versão seja considerada pronta apenas porque:

```text
"o código funciona na máquina do desenvolvedor"
```
