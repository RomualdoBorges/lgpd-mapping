# Regras de Negócio

> **Documento:** Regras de negócio  
> **Status:** Draft  
> **Projeto:** LGPD Data Mapping Platform  
> **Documentos relacionados:** `00-PROJECT.md`, `02-DOMAIN.md`, `03-DATABASE.md`, `04-AUTHORIZATION.md`

> **Question IDs:** referências canônicas em `12-OPEN-QUESTIONS.md`; migrações dos IDs locais registradas por documento de origem no registro central. Perguntas e recomendações locais não encerram essas questões.

---

## 1. Objetivo

Este documento consolida as regras de negócio da plataforma.

As regras aqui descritas devem ser consideradas fonte de verdade para:

- backend;
- frontend;
- testes;
- validações;
- workflows;
- agentes de IA.

Cada regra possui um identificador estável.

Exemplo:

```text
BR-PA-001
BR-CG-001
BR-ROPA-001
```

Testes automatizados devem, sempre que possível, referenciar o identificador da regra correspondente.

---

# 2. Classificação das regras

As regras são agrupadas por domínio:

```text
BR-ORG-*     Organização
BR-BU-*      Áreas
BR-PA-*      Atividades de tratamento
BR-DATA-*    Dados pessoais
BR-COL-*     Coleta
BR-OP-*      Operações
BR-SYS-*     Sistemas
BR-SUP-*     Fornecedores
BR-SUB-*     Titulares
BR-REC-*     Destinatários
BR-RET-*     Retenção
BR-SEC-*     Segurança
BR-LB-*      Base legal
BR-CONS-*    Consentimento
BR-INT-*     Transferência internacional
BR-CG-*      Compliance Gate
BR-ROPA-*    ROPA
BR-VER-*     Versionamento
BR-AUD-*     Auditoria
```

---

# 3. Organização

## BR-ORG-001 — Isolamento

Todo dado pertencente a um cliente deve estar associado a uma organização.

---

## BR-ORG-002 — Acesso entre organizações

Um usuário não pode acessar recursos pertencentes a outra organização sem autorização administrativa explícita da plataforma.

---

## BR-ORG-003 — Contexto confiável

O `organizationId` utilizado para autorização deve ser validado pelo backend.

O frontend não é fonte confiável para determinar o tenant.

---

## BR-ORG-004 — Organização inativa

Uma organização inativa não deve permitir novas operações normais de negócio.

O comportamento exato para consultas históricas deve ser definido posteriormente.

---

# 4. Áreas / Unidades de negócio

## BR-BU-001 — Associação

Toda área pertence a exatamente uma organização.

---

## BR-BU-002 — Atividade responsável

Toda atividade de tratamento deve possuir uma área responsável.

---

## BR-BU-003 — Escopo

Usuários com escopo limitado a uma área não podem manipular atividades pertencentes a áreas não autorizadas.

---

## BR-BU-004 — Histórico

Uma área com histórico de tratamento não deve ser fisicamente removida de forma que comprometa atividades ou auditorias anteriores.

---

# 5. Atividade de tratamento

## BR-PA-001 — Nome obrigatório

Toda atividade deve possuir um nome.

Exemplo:

```text
Cadastro de currículos para vaga aberta
```

---

## BR-PA-002 — Organização obrigatória

Toda atividade pertence a exatamente uma organização.

---

## BR-PA-003 — Área obrigatória

Toda atividade possui uma área responsável.

---

## BR-PA-004 — Draft permitido

Uma atividade pode ser salva incompleta enquanto estiver em:

```text
DRAFT
```

---

## BR-PA-005 — Salvamento progressivo

O wizard deve permitir que o usuário salve o progresso e continue posteriormente.

---

## BR-PA-006 — Ativação

Uma atividade somente pode assumir:

```text
ACTIVE
```

quando:

```text
complianceStatus = COMPLETE
```

---

## BR-PA-007 — Arquivamento

Uma atividade arquivada deve permanecer disponível para histórico e auditoria.

---

## BR-PA-008 — ROPA

As informações da atividade devem alimentar automaticamente o ROPA.

---

## BR-PA-009 — Alteração relevante

Alterações relevantes em atividades já concluídas devem preservar a versão anterior.

As alterações consideradas relevantes ainda devem ser definidas integralmente.

---

## BR-PA-010 — Descrição

A descrição da atividade é opcional, salvo decisão futura em contrário.

---

# 6. Wizard

## BR-WIZ-001 — Fluxo condicional

O wizard deve adaptar suas etapas conforme as respostas do usuário.

---

## BR-WIZ-002 — Reutilização

Informações preenchidas no wizard devem ser reutilizadas nas telas posteriores.

O usuário não deve precisar cadastrar novamente a mesma informação.

---

## BR-WIZ-003 — Persistência

O estado relevante do wizard deve ser persistido no backend.

Não depender exclusivamente do estado do navegador.

---

## BR-WIZ-004 — Retomada

Uma atividade incompleta deve poder ser retomada posteriormente.

---

## BR-WIZ-005 — Validação por etapa

O sistema pode permitir regras diferentes entre:

```text
salvar etapa
```

e:

```text
concluir mapeamento
```

Um draft pode conter informações incompletas.

---

# 7. Dados pessoais

## BR-DATA-001 — Múltiplas categorias

Uma atividade pode envolver múltiplas categorias de dados pessoais.

---

## BR-DATA-002 — Categorias iniciais

O desenho funcional prevê inicialmente:

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

## BR-DATA-003 — Dados sensíveis

Categorias consideradas sensíveis devem ser identificáveis pelo sistema.

---

## BR-DATA-004 — Menores

Dados relacionados a crianças/adolescentes devem ser identificáveis pelo sistema.

---

## BR-DATA-005 — Alerta

Atividade envolvendo:

```text
dados sensíveis
```

ou:

```text
crianças/adolescentes
```

deve gerar sinalização para avaliação de necessidade de RIPD/DPIA.

---

## BR-DATA-006 — RIPD

A sinalização não significa automaticamente que o RIPD é obrigatório.

A plataforma deve indicar:

```text
REVIEW_REQUIRED
```

ou conceito equivalente.

A decisão jurídica não deve ser inferida automaticamente sem regra específica.

---

## BR-DATA-007 — Dados reais

A V1 não deve exigir armazenamento de dados pessoais reais dos titulares para realizar o mapeamento.

Exemplo:

Evitar:

```text
Nome: João da Silva
CPF: 000...
```

Quando o necessário é:

```text
Dado: CPF
Titular: Cliente
```

---

# 8. Origem da coleta

## BR-COL-001 — Origem obrigatória

O fluxo deve identificar como os dados são coletados.

---

## BR-COL-002 — Decisão principal

O wizard deve perguntar se o dado é coletado por meio de documento.

---

## BR-COL-003 — Documento

Quando:

```text
coletadoPorDocumento = true
```

o sistema deve abrir o ramo de documento.

---

## BR-COL-004 — Não documento

Quando:

```text
coletadoPorDocumento = false
```

o sistema deve abrir o ramo de formulário/sistema.

---

# 9. Coleta por documento

## BR-COL-DOC-001 — Tipo

Quando a coleta ocorrer por documento, deve ser possível informar seu tipo.

Tipos inicialmente previstos:

```text
RG
CPF
CNH
Passaporte
Comprovante de residência
CV
Contrato
Outro
```

---

## BR-COL-DOC-002 — Documento de exemplo

O upload de documento de exemplo é opcional.

---

## BR-COL-DOC-003 — Dados reais

O documento de exemplo deve ser destinado a referência/modelo.

A ferramenta não deve incentivar o armazenamento desnecessário de documentos contendo dados pessoais reais.

---

## BR-COL-DOC-004 — Momento da coleta

Deve ser registrado o momento da coleta.

Opções iniciais:

```text
Admissão/contratação
Submissão de proposta/candidatura
Execução do serviço
Outro
```

---

# 10. Coleta por sistema/formulário

## BR-COL-SYS-001 — Ferramenta

Quando o dado não for coletado por documento, deve ser possível identificar a ferramenta ou sistema de coleta.

---

## BR-COL-SYS-002 — Sistema existente

O usuário deve poder selecionar um sistema previamente cadastrado.

---

## BR-COL-SYS-003 — Sistema inexistente

Caso o sistema não exista, o wizard deve permitir cadastro rápido quando o usuário possuir autorização.

---

## BR-COL-SYS-004 — Titular

Deve ser registrado se o dado é coletado diretamente do titular.

---

# 11. Processamento

## BR-OP-001 — Decisão

Após identificar a origem da coleta, o sistema deve perguntar se o dado sofre processamento além do armazenamento.

---

## BR-OP-002 — Sem processamento adicional

Quando a resposta for:

```text
Não
```

a atividade deve ser registrada como dado pessoal coletado conforme a terminologia do desenho funcional e seguir para o gate de conformidade.

---

## BR-OP-003 — Com processamento

Quando a resposta for:

```text
Sim
```

o usuário deve informar as operações realizadas.

---

## BR-OP-004 — Múltiplas operações

Uma atividade pode possuir múltiplas operações.

---

## BR-OP-005 — Operações iniciais

Devem ser suportadas:

```text
Uso
Atualização/Modificação
Transferência interna
Transferência externa/terceiro
Transferência internacional
Eliminação
```

---

## BR-OP-006 — Executor

Para cada operação deve ser possível identificar a área ou sistema responsável quando aplicável.

---

# 12. Sistemas

## BR-SYS-001 — Reutilização

Um sistema pode participar de múltiplas atividades.

---

## BR-SYS-002 — Organização

Todo sistema pertence ao contexto de uma organização.

---

## BR-SYS-003 — Cadastro rápido

Sistema criado dentro do wizard pode iniciar com:

```text
mappingStatus = PENDING
```

---

## BR-SYS-004 — Privacy by Design

Um novo sistema cadastrado sem mapeamento concluído deve aparecer como pendência.

---

## BR-SYS-005 — Controle interno na V1

Conforme DEC-031, a V1 registra e acompanha internamente pendências de mapeamento de sistemas e fornecedores. Não bloqueia tecnicamente a entrada em produção de sistemas externos.

O efeito de System/Supplier PENDING sobre Submit, Compliance Gate e ACTIVE continua aberto em SYSQ-007 e SUPQ-006. O controle interno não define essas transições.

---

# 13. Fornecedores

## BR-SUP-001 — Reutilização

Um fornecedor pode participar de múltiplas atividades.

---

## BR-SUP-002 — Organização

Fornecedor deve estar associado à organização correspondente.

---

## BR-SUP-003 — Cadastro rápido

Fornecedor criado durante o wizard pode iniciar com:

```text
mappingStatus = PENDING
```

---

## BR-SUP-004 — Pendência

Fornecedor ainda não mapeado deve permanecer identificável como pendência.

---

# 14. Titulares

## BR-SUB-001 — Múltiplos titulares

Uma atividade pode envolver múltiplas categorias de titulares.

---

## BR-SUB-002 — Categorias iniciais

O desenho funcional prevê:

```text
Colaboradores
Candidatos
Clientes
Fornecedores
Menores
Outros
```

---

## BR-SUB-003 — Menores

Quando:

```text
titular = MENOR
```

deve ser gerada sinalização de risco/revisão.

---

# 15. Destinatários

## BR-REC-001 — Múltiplos destinatários

Uma atividade pode possuir múltiplas categorias de destinatários.

---

## BR-REC-002 — Tipos iniciais

```text
Interno
Operador externo
Autoridade pública
Outro
```

---

## BR-REC-003 — Interno

Destinatário interno deve permitir identificação da área quando aplicável.

---

## BR-REC-004 — Externo

Destinatário externo deve permitir associação a fornecedor quando aplicável.

---

# 16. Finalidade

## BR-PUR-001 — Obrigatória

Toda atividade que pretenda concluir o mapeamento deve possuir finalidade definida.

---

## BR-PUR-002 — Clareza

A finalidade não deve aceitar descrições propositalmente genéricas como:

```text
diversos fins
```

O desenho funcional prevê bloqueio de textos vagos.

---

## BR-PUR-003 — Validação

A estratégia exata para identificar uma finalidade vaga ainda deve ser definida.

A IA não deve criar heurísticas arbitrárias sem decisão documentada.

---

## BR-PUR-004 — Cardinalidade

Ainda deve ser definido se uma atividade possui:

```text
uma finalidade
```

ou:

```text
múltiplas finalidades
```

---

# 17. Retenção

## BR-RET-001 — Obrigatória para conclusão

Uma atividade não pode concluir o gate mínimo sem política de retenção.

---

## BR-RET-002 — Duração

A retenção deve possuir:

```text
duration
+
unit
```

Exemplo:

```text
2 YEARS
```

---

## BR-RET-003 — Evento inicial

Também deve existir evento de início da contagem.

Exemplo:

```text
2 anos após encerramento do contrato
```

Onde:

```text
duration = 2
unit = YEARS
startEvent = encerramento do contrato
```

---

## BR-RET-004 — Cardinalidade

Ainda precisa ser definido se o prazo pertence:

```text
à atividade
```

ou:

```text
ao conjunto de dados/finalidade
```

---

# 18. Medidas de segurança

## BR-SEC-001 — Múltiplas medidas

Uma atividade pode possuir múltiplas medidas técnicas ou organizacionais.

---

## BR-SEC-002 — Tipos iniciais

```text
Criptografia
Pseudonimização
Controle de acesso
Backup
Outro
```

---

## BR-SEC-003 — Gate

Uma atividade sem medidas de segurança definidas não pode satisfazer o gate mínimo.

---

## BR-SEC-004 — Significado jurídico

A existência de uma medida cadastrada não significa que a segurança da atividade seja juridicamente ou tecnicamente suficiente.

O gate apenas verifica a existência da informação exigida pelo fluxo atualmente especificado.

---

# 19. Base legal

## BR-LB-001 — Obrigatória

Uma atividade não pode concluir o gate mínimo sem base legal definida.

---

## BR-LB-002 — Bases iniciais

O desenho funcional prevê:

```text
Execução de contrato
Obrigação legal
Legítimo interesse
Exercício regular de direitos
Proteção da vida
Tutela da saúde
Interesse público
Proteção ao crédito
Consentimento
```

---

## BR-LB-003 — Legítimo interesse

Quando:

```text
legalBasis = LEGITIMATE_INTEREST
```

deve existir justificativa escrita.

---

## BR-LB-004 — Justificativa

A ausência de justificativa para legítimo interesse deve impedir que essa base seja considerada completa.

---

## BR-LB-005 — LIA

A justificativa poderá futuramente alimentar um fluxo de LIA.

O LIA completo não faz parte automaticamente da V1.

---

## BR-LB-006 — Cardinalidade

Ainda deve ser definido se uma atividade pode possuir múltiplas bases legais.

A implementação não deve inventar essa decisão.

---

# 20. Consentimento

## BR-CONS-001 — Aplicabilidade

O módulo de consentimento deve ser utilizado quando a base aplicável exigir esse mecanismo conforme a regra funcional definida.

---

## BR-CONS-002 — Versão

Cada termo deve possuir uma versão identificável.

---

## BR-CONS-003 — Histórico

Nova versão de termo não deve sobrescrever versões anteriores.

---

## BR-CONS-004 — Vigência

Deve ser possível registrar a data de vigência.

---

## BR-CONS-005 — Meio de coleta

Deve ser possível registrar:

```text
Formulário digital
Papel assinado
Aceite eletrônico
Outro
```

---

## BR-CONS-006 — Consentimentos individuais

A V1 não deve assumir armazenamento individual dos aceites dos titulares.

A decisão precisa ser explícita antes dessa funcionalidade ser implementada.

---

# 21. Transferência internacional

## BR-INT-001 — Identificação

Toda transferência internacional deve ser identificada explicitamente.

---

## BR-INT-002 — País

Quando existir transferência internacional:

```text
destinationCountry
```

é obrigatório.

---

## BR-INT-003 — Compliance

Transferência internacional deve acionar verificação adicional.

---

## BR-INT-004 — Mecanismo

Deve ser possível registrar o mecanismo aplicável quando definido.

O desenho funcional cita exemplos como:

```text
adequação
SCC
consentimento específico
```

A lista jurídica definitiva não deve ser criada por inferência da IA.

---

## BR-INT-005 — Resultado

Enquanto a transferência exigir avaliação adicional, o sistema deve conseguir representá-la como:

```text
REVIEW_REQUIRED
```

ou estado equivalente.

---

# 22. Compliance Gate

## BR-CG-001 — Execução obrigatória

Toda atividade deve passar pelo Compliance Gate antes de ser considerada concluída.

---

## BR-CG-002 — Base legal

Check:

```text
LEGAL_BASIS
```

PASS quando a base legal exigida estiver corretamente preenchida.

---

## BR-CG-003 — Retenção

Check:

```text
RETENTION
```

PASS quando existir política de retenção válida conforme as regras atuais.

---

## BR-CG-004 — Segurança

Check:

```text
SECURITY_MEASURES
```

PASS quando existirem medidas de segurança definidas.

---

## BR-CG-005 — Transferência internacional

Quando não existir transferência internacional:

```text
INTERNATIONAL_TRANSFER
=
NOT_APPLICABLE
```

Quando existir, deve ser executada a verificação correspondente.

---

## BR-CG-006 — Dados sensíveis

Quando existirem dados sensíveis:

```text
SENSITIVE_DATA
```

deve sinalizar necessidade de avaliação adicional quando aplicável.

---

## BR-CG-007 — Menores

Quando existirem dados de crianças/adolescentes:

```text
MINOR_DATA
```

deve sinalizar necessidade de avaliação adicional.

---

## BR-CG-008 — Resultado estruturado

Cada check deve retornar um resultado estruturado.

Exemplo:

```json
{
  "type": "RETENTION",
  "status": "FAIL",
  "reasonCode": "RETENTION_POLICY_NOT_DEFINED"
}
```

---

## BR-CG-009 — Status

Checks podem retornar:

```text
PASS
FAIL
REVIEW_REQUIRED
NOT_APPLICABLE
```

---

## BR-CG-010 — Complete

O `ComplianceStatus` somente pode ser:

```text
COMPLETE
```

quando todos os checks obrigatórios permitirem conclusão.

---

## BR-CG-011 — Pending

Quando informações obrigatórias ainda não estiverem preenchidas:

```text
complianceStatus = PENDING
```

---

## BR-CG-012 — Blocked

Quando existir condição impeditiva definida pelas regras:

```text
complianceStatus = BLOCKED
```

A lista exata de condições bloqueantes ainda precisa ser especificada.

---

## BR-CG-013 — Backend

O resultado do gate deve ser determinado pelo backend.

---

## BR-CG-014 — Reexecução

Alterações em informações que afetam conformidade devem provocar nova avaliação do gate antes de manter/retornar a atividade a `ACTIVE`.

---

# 23. ROPA

## BR-ROPA-001 — Automático

O ROPA deve ser gerado a partir das atividades cadastradas.

---

## BR-ROPA-002 — Sem duplicação

O usuário não deve cadastrar manualmente no ROPA informações já existentes na atividade.

---

## BR-ROPA-003 — Atualização

Alterações na versão vigente da atividade devem refletir na visão atual do ROPA.

---

## BR-ROPA-004 — Área

O ROPA deve permitir identificar a área responsável.

---

## BR-ROPA-005 — Atividade e finalidade

Deve apresentar:

```text
nome da atividade
finalidade
```

---

## BR-ROPA-006 — Dados e titulares

Deve apresentar:

```text
categorias de dados
categorias de titulares
```

---

## BR-ROPA-007 — Base legal

Deve apresentar a base legal correspondente.

---

## BR-ROPA-008 — Gate

Deve apresentar o status do gate de conformidade.

---

## BR-ROPA-009 — Atualização

Deve ser possível identificar a última atualização da atividade.

---

## BR-ROPA-010 — Destaques

Atividades envolvendo:

```text
dados sensíveis
menores
```

devem ser visualmente identificáveis.

---

## BR-ROPA-011 — Exportação

O desenho funcional exige exportação:

```text
PDF
Excel
```

---

## BR-ROPA-012 — Filtros

O ROPA deve permitir, no mínimo, evolução para filtros por:

```text
área
status
categoria de dados
base legal
```

Filtros adicionais podem ser definidos no documento de frontend/API.

---

# 24. Dashboard do DPO

## BR-DASH-001 — Conformidade

O dashboard deve apresentar percentual de atividades com gate completo.

---

## BR-DASH-002 — Área

O indicador deve poder ser analisado por área.

---

## BR-DASH-003 — Pendências antigas

O dashboard deve identificar atividades pendentes há mais de:

```text
X dias
```

O valor de `X` ainda deve ser configurado/definido.

---

## BR-DASH-004 — Dados sensíveis

Deve existir visão das atividades envolvendo dados sensíveis.

---

## BR-DASH-005 — Menores

Deve existir visão das atividades envolvendo menores.

---

## BR-DASH-006 — Transferências

Deve existir visão das atividades com transferência internacional.

---

## BR-DASH-007 — Sistemas pendentes

Sistemas cadastrados sem mapeamento concluído devem ser identificáveis.

---

## BR-DASH-008 — Fornecedores pendentes

Fornecedores cadastrados sem mapeamento concluído devem ser identificáveis.

---

# 25. Versionamento

## BR-VER-001 — Preservação

Alterações relevantes não devem sobrescrever definitivamente a versão anterior.

---

## BR-VER-002 — Sequência

Versões devem possuir identificação sequencial dentro da atividade.

Exemplo:

```text
v1
v2
v3
```

---

## BR-VER-003 — Autor

Toda versão deve permitir identificar quem originou a alteração.

---

## BR-VER-004 — Data

Toda versão deve possuir data/hora.

---

## BR-VER-005 — Reconstrução

Deve ser possível reconstruir o estado relevante da atividade em uma versão anterior.

---

## BR-VER-006 — Alterações relevantes

O desenho funcional cita explicitamente como exemplos:

```text
nova finalidade
novo destinatário
novo prazo
```

Outras alterações relevantes precisam ser definidas.

---

# 26. Auditoria

## BR-AUD-001 — Criação

Criação de atividade deve ser auditável.

---

## BR-AUD-002 — Alteração

Alterações relevantes devem ser auditáveis.

---

## BR-AUD-003 — Gate

Execuções relevantes do Compliance Gate devem ser auditáveis.

---

## BR-AUD-004 — Usuários

Alterações de:

```text
papel
área
status
```

de usuários devem ser auditáveis.

---

## BR-AUD-005 — Sistemas e fornecedores

Criação e alterações relevantes em sistemas e fornecedores devem ser auditáveis.

---

## BR-AUD-006 — Append-only

Audit Logs devem ser tratados como registros append-only.

---

## BR-AUD-007 — Dados mínimos

Um evento deve permitir identificar:

```text
actor
organization
action
entity
entityId
timestamp
```

---

# 27. Notificações

O desenho funcional prevê cobrança automática ao gestor para atividades pendentes há mais de X dias.

Portanto:

## BR-NOT-001

O sistema deve ser capaz de identificar atividades que ultrapassaram o prazo configurado de pendência.

---

## BR-NOT-002

Quando a regra de notificação estiver habilitada, o gestor responsável deve poder ser notificado.

---

## BR-NOT-003

O canal ainda deve ser definido.

Possibilidades:

```text
notificação interna
e-mail
ambos
```

---

# 28. Validação de campos

Existem três níveis distintos de validação.

## Validação estrutural

Exemplo:

```text
duration deve ser número positivo
```

---

## Validação de negócio

Exemplo:

```text
LEGITIMATE_INTEREST exige justification
```

---

## Validação de workflow

Exemplo:

```text
atividade não pode ficar ACTIVE sem compliance COMPLETE
```

Essas responsabilidades não devem ser misturadas indiscriminadamente.

---

# 29. Mensagens de erro

Regras devem possuir códigos estáveis.

Exemplo:

```text
LEGAL_BASIS_REQUIRED

LEGITIMATE_INTEREST_JUSTIFICATION_REQUIRED

RETENTION_POLICY_REQUIRED

SECURITY_MEASURE_REQUIRED

INTERNATIONAL_TRANSFER_COUNTRY_REQUIRED

ACTIVITY_NOT_COMPLIANT

ACTIVITY_INVALID_STATE
```

A interface pode traduzir esses códigos para mensagens amigáveis.

---

# 30. Regras não definidas

Agentes de IA não devem inferir automaticamente regras para questões ainda abertas.

Exemplo:

Se a documentação não definir:

> Quantas bases legais uma atividade pode possuir?

não implementar arbitrariamente:

```text
máximo = 1
```

A questão deve ser resolvida antes da regra definitiva.

---

# 31. Questões abertas críticas

Devem também constar em `12-OPEN-QUESTIONS.md`.

### DQ-004

Uma atividade pode possuir múltiplas finalidades?

**Impacto:** alto.

---

### DQ-002

Uma atividade pode possuir múltiplas bases legais?

**Impacto:** alto.

---

### DQ-003

A base legal deve ser associada à:

```text
atividade
finalidade
dado
```

**Impacto:** muito alto.

---

### DQ-005

A retenção pertence à atividade inteira ou pode variar por dado/finalidade?

**Impacto:** alto.

---

### DQ-010

Quais alterações exatamente geram nova versão?

**Impacto:** alto.

---

### AUTHQ-002

Quem aprova uma atividade?

```text
Gestor
DPO
Gestor + DPO
```

**Impacto:** alto.

---

### BRQ-007

O que exatamente gera:

```text
BLOCKED
```

no Compliance Gate?

**Impacto:** alto.

---

### WFQ-013

Qual valor padrão de:

```text
X dias
```

para atividades pendentes?

**Impacto:** baixo.

---

### BRQ-011 — Respondida por DEC-031

A V1 acompanha pendências exclusivamente dentro da plataforma e não bloqueia tecnicamente produção de sistemas externos. SYSQ-007 e SUPQ-006 permanecem decisões separadas.

---

### DQ-011

O sistema deve armazenar consentimentos individuais dos titulares?

**Decisão da V1 — DEC-026:** não armazenar aceites individuais de titulares.

**Impacto:** muito alto.

---

# 32. Definition of Done das regras

Uma regra de negócio é considerada implementada quando:

```text
regra documentada
        +
implementação backend
        +
validação necessária
        +
autorização necessária
        +
teste automatizado
        +
tratamento de erro
```

estiverem concluídos.

---

# 33. Orientação para testes

Sempre que possível, testes devem referenciar a regra.

Exemplo:

```ts
describe('BR-CG-002 - Legal Basis', () => {
    it('fails when the activity has no legal basis', () => {
        // ...
    });
});
```

Outro exemplo:

```ts
describe('BR-LB-003 - Legitimate Interest', () => {
    it('requires justification', () => {
        // ...
    });
});
```

Isso facilita rastrear:

```text
requisito
↓
código
↓
teste
```

---

# 34. Orientações para agentes de IA

Antes de implementar uma feature:

1. identificar todas as regras `BR-*` relacionadas;
2. verificar `02-DOMAIN.md`;
3. verificar `03-DATABASE.md`;
4. verificar `04-AUTHORIZATION.md`;
5. verificar `06-WORKFLOWS.md`;
6. verificar `12-OPEN-QUESTIONS.md`;
7. listar as regras que serão implementadas;
8. implementar;
9. criar testes correspondentes.

Não criar novas regras de negócio silenciosamente.

Quando uma nova regra for necessária:

```text
identificar lacuna
      ↓
registrar decisão
      ↓
atribuir BR-*
      ↓
atualizar documentação
      ↓
implementar
```

---

# 35. Próximo documento

Os estados, transições e caminhos completos das atividades serão definidos em:

`06-WORKFLOWS.md`