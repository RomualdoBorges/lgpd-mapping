# Workflows e Máquinas de Estado

> **Documento:** Workflows, estados e transições  
> **Status:** Draft  
> **Projeto:** LGPD Data Mapping Platform  
> **Documentos relacionados:** `00-PROJECT.md`, `02-DOMAIN.md`, `04-AUTHORIZATION.md`, `05-BUSINESS-RULES.md`

> **Question IDs:** referências canônicas em `12-OPEN-QUESTIONS.md`; migrações dos IDs locais registradas por documento de origem no registro central. Perguntas e recomendações locais não encerram essas questões.

---

## 1. Objetivo

Este documento define os fluxos de negócio da plataforma e as transições permitidas entre estados.

O objetivo é impedir que:

- frontend;
- backend;
- testes;
- agentes de IA;

implementem interpretações diferentes sobre o ciclo de vida de uma atividade.

As transições de estado devem ser controladas pelo backend.

---

# 2. Princípio geral

Estados não devem ser alterados diretamente.

Evitar operações genéricas como:

```http
PATCH /processing-activities/:id

{
  "status": "ACTIVE"
}
```

Preferir operações semânticas:

```text
createActivity()
startMapping()
submitActivity()
runComplianceGate()
requestReview()
approveActivity()
activateActivity()
archiveActivity()
```

O caso de uso deve validar se a transição é permitida.

---

# 3. Estados da atividade

Estados inicialmente propostos:

```text
DRAFT
MAPPING
PENDING_REVIEW
COMPLIANCE_PENDING
ACTIVE
UNDER_REVIEW
ARCHIVED
```

Esses estados ainda dependem de algumas decisões funcionais descritas ao final deste documento.

---

# 4. Visão geral

Fluxo conceitual:

```text
                    ┌───────────┐
                    │   DRAFT   │
                    └─────┬─────┘
                          │
                          ▼
                    ┌───────────┐
                    │  MAPPING  │
                    └─────┬─────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │ PENDING_REVIEW   │
                 └────────┬─────────┘
                          │
                          ▼
              ┌──────────────────────┐
              │ COMPLIANCE_PENDING   │
              └──────────┬───────────┘
                         │
                         │ gate completo
                         ▼
                    ┌───────────┐
                    │  ACTIVE   │
                    └─────┬─────┘
                          │
                          │ alteração relevante
                          ▼
                  ┌──────────────┐
                  │ UNDER_REVIEW │
                  └──────┬───────┘
                         │
                         │ revisão + gate
                         ▼
                    ┌───────────┐
                    │  ACTIVE   │
                    └───────────┘
```

Qualquer estado aplicável pode eventualmente resultar em:

```text
ARCHIVED
```

desde que o usuário possua autorização e a regra de negócio permita.

---

# 5. DRAFT

## Definição

Representa uma atividade criada, porém ainda não suficientemente preenchida.

Exemplo:

```text
Nome:
Recrutamento de candidatos

Área:
RH

Wizard:
20% preenchido
```

---

## Permitido

Enquanto `DRAFT`, o usuário autorizado pode:

```text
editar nome
editar descrição
preencher wizard
adicionar dados
adicionar sistemas
adicionar fornecedores
salvar parcialmente
sair
retornar posteriormente
```

---

## Regras

### WF-DRAFT-001

Uma atividade pode permanecer incompleta em `DRAFT`.

### WF-DRAFT-002

Campos necessários apenas para conclusão não precisam bloquear salvamento do draft.

### WF-DRAFT-003

O draft deve ser persistido no backend.

### WF-DRAFT-004

A atividade deve continuar pertencendo à organização e área definidas.

---

# 6. Criação

Fluxo:

```text
Usuário
   ↓
Nova atividade
   ↓
Informações mínimas
   ↓
ProcessingActivity
   ↓
DRAFT
```

Informações mínimas sugeridas:

```text
organization
businessUnit
name
createdBy
```

`organization` deve ser derivada/validada pelo contexto autenticado.

---

# 7. Transição DRAFT → MAPPING

A transição ocorre quando o usuário inicia efetivamente o processo de mapeamento.

```text
DRAFT
  ↓
startMapping()
  ↓
MAPPING
```

---

## Pré-condições

```text
atividade existe
usuário possui acesso
atividade pertence à organização
atividade pertence ao escopo permitido
status atual = DRAFT
```

---

# 8. MAPPING

## Definição

Representa uma atividade em processo de preenchimento do mapeamento.

O wizard é a principal interface desse estado.

---

## Informações esperadas

O fluxo pode coletar:

```text
finalidade
categorias de dados
titulares
origem da coleta
documentos
sistemas
operações
destinatários
fornecedores
transferências
retenção
medidas de segurança
base legal
consentimento
```

---

## Regra importante

Nem todos os campos são obrigatórios durante cada salvamento.

As regras completas são verificadas no momento apropriado da conclusão/submissão.

---

# 9. Fluxo do wizard

Fluxo conceitual:

```text
Atividade
   │
   ▼
Finalidade
   │
   ▼
Dados pessoais
   │
   ▼
Titulares
   │
   ▼
Origem da coleta
   │
   ├──── Documento
   │
   └──── Sistema/Formulário
   │
   ▼
Existe processamento?
   │
   ├──── Não
   │
   └──── Sim
            │
            ▼
        Operações
            │
            ├── Uso
            ├── Atualização
            ├── Transferência interna
            ├── Transferência externa
            ├── Transferência internacional
            └── Eliminação
   │
   ▼
Destinatários
   │
   ▼
Retenção
   │
   ▼
Segurança
   │
   ▼
Base legal
   │
   ▼
Compliance Gate
```

---

# 10. Ramo de documento

Quando:

```text
collectedByDocument = true
```

fluxo:

```text
Origem
  ↓
Documento
  ↓
Tipo do documento
  ↓
Momento da coleta
  ↓
Documento de exemplo? (opcional)
  ↓
continua wizard
```

---

# 11. Ramo de sistema

Quando:

```text
collectedByDocument = false
```

fluxo:

```text
Origem
  ↓
Sistema / formulário
  ↓
Selecionar sistema
  │
  ├── sistema existente
  │
  └── novo sistema
          ↓
      cadastro rápido
          ↓
      mappingStatus = PENDING
  ↓
Coletado diretamente do titular?
  ↓
continua wizard
```

---

# 12. Novo sistema

Fluxo:

```text
Wizard
  ↓
Sistema não encontrado
  ↓
Usuário seleciona "Cadastrar sistema"
  ↓
Cadastro mínimo
  ↓
System criado
  ↓
mappingStatus = PENDING
  ↓
System associado à atividade
```

A criação deve respeitar autorização.

---

# 13. Novo fornecedor

Fluxo equivalente:

```text
Wizard
  ↓
Fornecedor não encontrado
  ↓
Cadastro rápido
  ↓
Supplier criado
  ↓
mappingStatus = PENDING
  ↓
Supplier associado
```

---

# 14. Processamento

Pergunta:

```text
Os dados passam por processamento além do armazenamento?
```

Fluxo:

```text
                ┌──────────────┐
                │ Processamento│
                └──────┬───────┘
                       │
             ┌─────────┴─────────┐
             │                   │
            NÃO                 SIM
             │                   │
             ▼                   ▼
       segue para gate       Operações
                                 │
                                 ▼
                           Destinatários
                                 │
                                 ▼
                              Gate
```

---

# 15. Transferência internacional

Caso uma operação seja:

```text
INTERNATIONAL_TRANSFER
```

o wizard deve abrir informações adicionais.

```text
Transferência internacional
        ↓
País de destino
        ↓
Destinatário
        ↓
Mecanismo aplicável
        ↓
Compliance Check
```

---

## Regra

Não permitir concluir a informação de transferência internacional sem:

```text
destinationCountry
```

---

# 16. Dados sensíveis

Quando a atividade possuir categoria marcada como:

```text
isSensitive = true
```

o sistema deve gerar sinalização.

Fluxo:

```text
Dados sensíveis detectados
        ↓
SENSITIVE_DATA check
        ↓
avaliação
        ↓
PASS / REVIEW_REQUIRED / FAIL
```

A regra jurídica exata do resultado ainda precisa ser definida.

---

# 17. Dados de menores

Quando existir:

```text
isMinor = true
```

fluxo:

```text
Dados de menores detectados
        ↓
MINOR_DATA check
        ↓
avaliação adicional
```

Não assumir automaticamente:

```text
FAIL
```

sem regra documentada.

---

# 18. Base legal

Fluxo:

```text
Selecionar base legal
        ↓
┌───────────────────────────────┐
│ LEGITIMATE_INTEREST ?         │
└───────────────┬───────────────┘
                │
       ┌────────┴────────┐
       │                 │
      SIM               NÃO
       │                 │
       ▼                 ▼
Justificativa        continuar
obrigatória
```

---

# 19. Consentimento

Quando a regra aplicável determinar necessidade de termo:

```text
Base legal / regra
        ↓
Consentimento aplicável
        ↓
Termo
        ↓
Versão
        ↓
Data de vigência
        ↓
Meio de coleta
```

A V1 não assume armazenamento de consentimentos individuais dos titulares.

---

# 20. Conclusão do mapeamento

Quando o usuário considera o wizard preenchido:

```text
MAPPING
   ↓
submitMapping()
   ↓
validações
```

O backend deve verificar os requisitos necessários para avançar.

---

# 21. Validação de submissão

Exemplos de validações:

```text
finalidade definida?

categorias de dados definidas?

titulares definidos?

origem da coleta definida?

operações preenchidas quando aplicável?

destinatários preenchidos quando aplicável?

retenção definida?

medidas de segurança definidas?

base legal definida?

transferência internacional completa quando aplicável?
```

A lista definitiva deve refletir as regras de negócio aprovadas.

---

# 22. Falha de validação

Quando informações obrigatórias estiverem ausentes:

```text
MAPPING
   ↓
submitMapping()
   ↓
validation FAIL
   ↓
MAPPING
```

Retornar erros estruturados.

Exemplo:

```json
{
  "errors": [
    {
      "code": "RETENTION_POLICY_REQUIRED",
      "field": "retention"
    },
    {
      "code": "LEGAL_BASIS_REQUIRED",
      "field": "legalBasis"
    }
  ]
}
```

---

# 23. PENDING_REVIEW

Estado reservado para atividade aguardando revisão humana.

```text
MAPPING
   ↓
submitMapping()
   ↓
PENDING_REVIEW
```

Esse estado somente deve permanecer no workflow definitivo se existir uma etapa de revisão humana antes do Compliance Gate.

---

# 24. Quem revisa?

Ainda precisa ser definido:

```text
MANAGER
DPO
MANAGER + DPO
```

Portanto, não implementar uma decisão definitiva enquanto essa questão estiver aberta.

---

# 25. Possíveis fluxos de revisão

## Opção A — Gestor revisa

```text
COLLABORATOR
     ↓
MAPPING
     ↓
PENDING_REVIEW
     ↓
MANAGER
     ↓
COMPLIANCE_PENDING
```

---

## Opção B — DPO revisa

```text
COLLABORATOR
     ↓
MAPPING
     ↓
PENDING_REVIEW
     ↓
DPO
     ↓
COMPLIANCE_PENDING
```

---

## Opção C — Sem revisão humana prévia

```text
MAPPING
     ↓
COMPLIANCE_PENDING
```

A escolha deve ser registrada em `12-OPEN-QUESTIONS.md`.

---

# 26. Rejeição da revisão

Caso exista revisão humana, deve existir possibilidade de solicitar correções.

Fluxo sugerido:

```text
PENDING_REVIEW
      ↓
requestChanges()
      ↓
MAPPING
```

O sistema deve registrar:

```text
reviewer
reason
timestamp
```

---

# 27. COMPLIANCE_PENDING

Representa atividade pronta para avaliação de conformidade.

```text
COMPLIANCE_PENDING
        ↓
runComplianceGate()
```

---

# 28. Execução do Compliance Gate

Fluxo:

```text
COMPLIANCE_PENDING
        ↓
Compliance Gate
        │
        ├── LEGAL_BASIS
        ├── RETENTION
        ├── SECURITY_MEASURES
        ├── INTERNATIONAL_TRANSFER
        ├── SENSITIVE_DATA
        └── MINOR_DATA
        │
        ▼
Resultado
```

---

# 29. Resultado PASS

Quando todos os checks obrigatórios permitirem conclusão:

```text
complianceStatus = COMPLETE
```

A atividade pode seguir para:

```text
ACTIVE
```

caso não exista aprovação humana adicional.

---

# 30. Resultado FAIL

Quando existir falha impeditiva:

```text
complianceStatus = BLOCKED
```

A atividade não pode assumir:

```text
ACTIVE
```

Fluxo possível:

```text
COMPLIANCE_PENDING
        ↓
Gate FAIL
        ↓
BLOCKED
        ↓
correção
        ↓
MAPPING / COMPLIANCE_PENDING
```

`BLOCKED` está definido como `ComplianceStatus`, não necessariamente como `ActivityStatus`.

---

# 31. REVIEW_REQUIRED

Quando determinado check exigir avaliação humana:

```text
Check
  ↓
REVIEW_REQUIRED
```

a atividade deve permanecer impedida de ativação até que a revisão necessária seja concluída.

O responsável pela revisão ainda deve ser definido.

---

# 32. ACTIVE

## Definição

Representa uma atividade de tratamento concluída e vigente no mapeamento.

Pré-condição obrigatória:

```text
complianceStatus = COMPLETE
```

---

## Efeitos

Quando a atividade se torna `ACTIVE`:

```text
versão vigente definida
ROPA atualizado
dashboard atualizado
evento de auditoria registrado
```

---

# 33. Ativação

Fluxo:

```text
COMPLIANCE_PENDING
        ↓
Gate completo
        ↓
complianceStatus = COMPLETE
        ↓
activateActivity()
        ↓
ACTIVE
```

Se houver aprovação humana obrigatória, ela deve ocorrer antes de `activateActivity()`.

---

# 34. ROPA

Não existe workflow separado para cadastro do ROPA.

Fluxo:

```text
ProcessingActivity
       ↓
ACTIVE
       ↓
ROPA
```

Alterações na versão vigente devem refletir na visão atual.

---

# 35. Alteração de atividade ativa

Uma atividade `ACTIVE` não deve ser tratada como um draft comum.

Exemplo:

```text
ACTIVE v1
    ↓
usuário solicita alteração
    ↓
UNDER_REVIEW
    ↓
alterações
    ↓
Compliance Gate
    ↓
ACTIVE v2
```

---

# 36. UNDER_REVIEW

Representa atividade ativa que está passando por alteração relevante.

Objetivo:

Preservar:

```text
versão vigente
```

enquanto:

```text
nova versão
```

está sendo preparada.

---

# 37. Versão vigente durante revisão

Enquanto uma nova versão está em revisão:

```text
v1 = ACTIVE
v2 = UNDER_REVIEW
```

A visão atual do ROPA deve continuar representando a versão vigente aprovada até que a nova versão seja concluída.

Esse comportamento exige que a implementação de versionamento consiga diferenciar:

```text
versão publicada
```

de:

```text
versão em edição
```

---

# 38. Publicação de nova versão

Fluxo:

```text
ACTIVE v1
      ↓
edit
      ↓
UNDER_REVIEW v2
      ↓
mapping
      ↓
compliance
      ↓
approval
      ↓
ACTIVE v2
```

Depois:

```text
v1 = histórico
v2 = versão vigente
```

---

# 39. Alteração não relevante

Ainda deve ser definido se alterações pequenas podem ocorrer sem gerar nova versão.

Exemplos possíveis:

```text
correção ortográfica
descrição interna
metadata não regulatória
```

Agentes de IA não devem decidir quais campos são irrelevantes sem regra explícita.

---

# 40. ARCHIVED

## Definição

Representa atividade que não está mais vigente.

---

## Fluxo

```text
ACTIVE
   ↓
archiveActivity()
   ↓
ARCHIVED
```

---

## Regras

### WF-ARCH-001

Arquivamento não deve apagar a atividade.

### WF-ARCH-002

Histórico deve permanecer disponível.

### WF-ARCH-003

Versões devem permanecer disponíveis.

### WF-ARCH-004

Audit Logs devem permanecer disponíveis conforme política de retenção.

### WF-ARCH-005

ROPA histórico deve continuar reconstruível quando necessário.

---

# 41. Reativação

Ainda precisa ser definido se uma atividade `ARCHIVED` pode ser reativada.

Possibilidades:

```text
ARCHIVED
   ↓
UNDER_REVIEW
   ↓
ACTIVE
```

ou:

```text
ARCHIVED
   ↓
não pode reativar
   ↓
criar nova atividade
```

Essa decisão deve permanecer aberta.

---

# 42. Sistemas

Workflow sugerido:

```text
System criado
     ↓
mappingStatus = PENDING
     ↓
mapeamento realizado
     ↓
mappingStatus = MAPPED
```

---

# 43. Fornecedores

Workflow equivalente:

```text
Supplier criado
     ↓
mappingStatus = PENDING
     ↓
mapeamento realizado
     ↓
mappingStatus = MAPPED
```

---

# 44. Privacy by Design

O desenho funcional prevê controle para novos sistemas/fornecedores.

Fluxo conceitual:

```text
Novo sistema/fornecedor
        ↓
mappingStatus = PENDING
        ↓
alerta
        ↓
mapeamento obrigatório
        ↓
mappingStatus = MAPPED
```

Conforme DEC-031, na V1:

```text
PENDING
   ↓
pendência interna acompanhada na plataforma
```

A V1 não bloqueia tecnicamente implantação ou produção de sistemas externos. As consequências internas sobre Submit, Gate e ACTIVE continuam em SYSQ-007 e SUPQ-006.

---

# 45. Pendências

Atividades podem possuir tempo de permanência em determinados estados.

Exemplo:

```text
PENDING_REVIEW
há 10 dias
```

Se ultrapassar:

```text
X dias
```

pode gerar notificação.

---

# 46. Notificação de pendência

Fluxo:

```text
atividade pendente
      ↓
tempo > X
      ↓
identificar responsável
      ↓
notificar
```

O valor de `X` ainda precisa ser definido.

---

# 47. Timeout não altera estado automaticamente

Uma atividade não deve mudar automaticamente de:

```text
PENDING_REVIEW
```

para:

```text
ACTIVE
```

apenas por tempo.

Tempo pode gerar:

```text
alerta
notificação
escalonamento
```

mas não aprovação implícita.

---

# 48. Transições permitidas

Matriz inicial:

| Estado atual | Ação | Próximo estado |
|---|---|---|
| `DRAFT` | iniciar mapeamento | `MAPPING` |
| `MAPPING` | salvar | `MAPPING` |
| `MAPPING` | submeter | `PENDING_REVIEW` ou `COMPLIANCE_PENDING` |
| `PENDING_REVIEW` | solicitar correção | `MAPPING` |
| `PENDING_REVIEW` | aprovar revisão | `COMPLIANCE_PENDING` |
| `COMPLIANCE_PENDING` | corrigir dados | `MAPPING` |
| `COMPLIANCE_PENDING` | gate completo | `ACTIVE` |
| `ACTIVE` | iniciar alteração relevante | `UNDER_REVIEW` |
| `UNDER_REVIEW` | solicitar correção | `UNDER_REVIEW` |
| `UNDER_REVIEW` | concluir nova versão | `ACTIVE` |
| `ACTIVE` | arquivar | `ARCHIVED` |
| `ARCHIVED` | reativar | `A DEFINIR` |

---

# 49. Transições proibidas

Exemplos:

```text
DRAFT → ACTIVE
```

sem passar pelas validações necessárias.

```text
MAPPING → ACTIVE
```

ignorando Compliance Gate.

```text
ARCHIVED → ACTIVE
```

sem regra explícita de reativação.

```text
COMPLIANCE_PENDING → ACTIVE
```

quando:

```text
complianceStatus != COMPLETE
```

---

# 50. Backend

Toda transição deve utilizar caso de uso específico.

Exemplo:

```ts
submitProcessingActivity()
```

deve verificar:

```text
estado atual
permissão
escopo
campos obrigatórios
regras de negócio
```

antes de alterar o estado.

---

# 51. Concorrência

Considere:

```text
Usuário A abre atividade em MAPPING

Usuário B também abre atividade

B submete

status = PENDING_REVIEW

A tenta salvar uma versão antiga
```

O sistema não deve permitir sobrescrita silenciosa que faça a atividade retornar a um estado anterior.

Utilizar estratégia de concorrência definida no `03-DATABASE.md`.

---

# 52. Auditoria das transições

Transições relevantes devem gerar eventos.

Exemplos:

```text
ACTIVITY_CREATED

MAPPING_STARTED

ACTIVITY_SUBMITTED

CHANGES_REQUESTED

COMPLIANCE_GATE_EXECUTED

ACTIVITY_ACTIVATED

ACTIVITY_REVIEW_STARTED

ACTIVITY_VERSION_PUBLISHED

ACTIVITY_ARCHIVED
```

---

# 53. Motivos

Algumas transições devem exigir motivo.

Exemplo:

```text
requestChanges(reason)
```

```text
archiveActivity(reason)
```

```text
rejectActivity(reason)
```

A obrigatoriedade exata de cada motivo deve ser definida pelas regras funcionais.

---

# 54. API

Evitar:

```http
PATCH /processing-activities/:id/status
```

com qualquer valor arbitrário.

Preferir endpoints semânticos.

Exemplos:

```http
POST /processing-activities/:id/start-mapping

POST /processing-activities/:id/submit

POST /processing-activities/:id/request-changes

POST /processing-activities/:id/run-compliance

POST /processing-activities/:id/activate

POST /processing-activities/:id/start-revision

POST /processing-activities/:id/archive
```

Os contratos completos serão definidos em:

`07-API.md`

---

# 55. Frontend

O frontend deve utilizar o estado retornado pela API para determinar as ações disponíveis.

Exemplo:

```text
status = DRAFT

ações:
[Continuar mapeamento]
```

```text
status = PENDING_REVIEW

ações:
[Aguardando revisão]
```

```text
status = ACTIVE

ações:
[Visualizar]
[Propor alteração]
[Arquivar]
```

A disponibilidade final também depende das permissões do usuário.

---

# 56. Estado não substitui permissão

Exemplo:

```text
Activity.status = ACTIVE
```

pode permitir conceitualmente:

```text
archive
```

Mas o usuário ainda precisa possuir:

```text
processing_activity:archive
```

Portanto:

```text
State Transition Allowed
        +
Permission Allowed
        +
Scope Allowed
        =
Operation Allowed
```

---

# 57. Estado não substitui ComplianceStatus

Manter conceitos separados.

Exemplo:

```text
status = COMPLIANCE_PENDING
complianceStatus = PENDING
```

Depois:

```text
status = COMPLIANCE_PENDING
complianceStatus = COMPLETE
```

e somente então:

```text
status = ACTIVE
complianceStatus = COMPLETE
```

---

# 58. Possível simplificação

Existe possibilidade de o workflow inicial estar excessivamente detalhado.

Por exemplo:

```text
DRAFT
MAPPING
```

podem eventualmente ser um único estado.

Da mesma forma:

```text
PENDING_REVIEW
COMPLIANCE_PENDING
```

podem depender do fluxo real de aprovação.

Não simplificar ou expandir esses estados silenciosamente.

A decisão deve ser tomada antes da implementação definitiva da máquina de estados.

---

# 59. Questões abertas

Registrar também em `12-OPEN-QUESTIONS.md`.

### WFQ-001 — DRAFT x MAPPING

Precisamos realmente dos dois estados?

```text
DRAFT
MAPPING
```

**Impacto:** médio.

---

### WFQ-002 — Revisão humana

Existe obrigatoriamente uma etapa de revisão antes do Compliance Gate?

**Impacto:** alto.

---

### WFQ-003 — Responsável pela revisão

Quem revisa?

```text
MANAGER
DPO
MANAGER + DPO
```

**Impacto:** alto.

---

### WFQ-004 — Aprovação

Compliance Gate completo ativa automaticamente a atividade ou ainda exige aprovação humana?

**Impacto:** alto.

---

### WFQ-005 — REVIEW_REQUIRED

Quem resolve checks:

```text
REVIEW_REQUIRED
```

?

**Impacto:** alto.

---

### BRQ-007 — BLOCKED

Quais condições geram:

```text
complianceStatus = BLOCKED
```

?

**Impacto:** alto.

---

### WFQ-007 — Alteração de ACTIVE

Toda alteração de uma atividade ativa gera nova versão ou somente alterações relevantes?

**Impacto:** alto.

---

### WFQ-008 — Edição paralela

Durante `UNDER_REVIEW`, a versão vigente continua aparecendo no ROPA enquanto uma nova versão é editada?

**Recomendação arquitetural:** sim.

**Impacto:** alto.

---

### AUTHQ-013 — Arquivamento

Quem pode arquivar uma atividade?

**Impacto:** médio.

---

### WFQ-011 — Reativação

Atividade `ARCHIVED` pode ser reativada?

**Impacto:** médio.

---

### WFQ-009 — Rejeição

Existe estado específico:

```text
REJECTED
```

ou rejeição simplesmente devolve a atividade para:

```text
MAPPING
```

?

**Impacto:** médio.

---

### WFQ-014 — Cancelamento

Um draft pode ser cancelado?

Caso sim:

```text
CANCELLED
```

é necessário ou soft delete é suficiente?

**Impacto:** baixo/médio.

---

### WFQ-013 — Disparo de alertas/notificações

Quando uma pendência deve gerar alerta/notificação? A política de disparo é separada da classificação de antiguidade em DASHQ-008 (DEC-033). Nenhum prazo está definido; DASHQ-007 determina o início da contagem.

**Impacto:** baixo.

---

# 60. Testes obrigatórios

A máquina de estados deve possuir testes automatizados.

Exemplos:

```ts
describe('ProcessingActivity workflow', () => {
    it('allows DRAFT -> MAPPING', () => {});

    it('does not allow DRAFT -> ACTIVE', () => {});

    it('does not activate without compliance complete', () => {});

    it('allows ACTIVE -> UNDER_REVIEW', () => {});

    it('preserves the active version while another version is under review', () => {});

    it('allows ACTIVE -> ARCHIVED', () => {});
});
```

---

# 61. Teste crítico do Compliance Gate

Cenário:

```text
Given:
Activity.status = COMPLIANCE_PENDING

And:
ComplianceStatus = PENDING

When:
activateActivity()

Then:
operation must fail
```

Erro esperado:

```text
ACTIVITY_NOT_COMPLIANT
```

---

# 62. Teste crítico de transição

Cenário:

```text
Given:
Activity.status = DRAFT

When:
activateActivity()

Then:
operation must fail
```

Erro:

```text
INVALID_ACTIVITY_STATE_TRANSITION
```

---

# 63. Instruções para agentes de IA

Antes de alterar `status`:

1. consultar este documento;
2. identificar estado atual;
3. identificar ação;
4. validar se a transição existe;
5. consultar `04-AUTHORIZATION.md`;
6. validar permissão;
7. consultar `05-BUSINESS-RULES.md`;
8. validar regras;
9. executar a transição;
10. registrar auditoria quando aplicável.

Nunca alterar estado através de atribuição arbitrária:

```ts
activity.status = requestedStatus;
```

Preferir operações semânticas:

```ts
activity.startMapping();
activity.submit();
activity.activate();
activity.archive();
```

ou casos de uso equivalentes.

---

# 64. Regra para decisões pendentes

Quando uma implementação depender de uma questão `WFQ-*` ainda não resolvida:

```text
NÃO assumir
NÃO inventar
NÃO escolher silenciosamente
```

Registrar a dependência e aguardar a decisão correspondente.

---

# 65. Próximo documento

Os endpoints, contratos de request/response, paginação, filtros, erros e convenções HTTP serão especificados em:

`07-API.md`