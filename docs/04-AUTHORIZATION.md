# Autenticação, Autorização e Controle de Acesso

> **Documento:** Autenticação, RBAC e autorização  
> **Status:** Draft  
> **Projeto:** LGPD Data Mapping Platform  
> **Documentos relacionados:** `00-PROJECT.md`, `01-ARCHITECTURE.md`, `02-DOMAIN.md`, `03-DATABASE.md`

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

Este documento define como a plataforma controla:

- autenticação;
- organizações;
- usuários;
- papéis;
- áreas;
- permissões;
- isolamento entre clientes;
- acesso às atividades de tratamento;
- operações administrativas.

A autorização deve ser aplicada obrigatoriamente no backend.

O frontend pode ocultar ou desabilitar funcionalidades para melhorar a experiência do usuário, mas nunca deve ser considerado mecanismo de segurança.

---

# 2. Princípios

## AUTH-001 — Backend como autoridade

Toda operação protegida deve ser autorizada pelo backend.

Não é suficiente:

```text
esconder botão
desabilitar campo
bloquear rota no frontend
```

---

## AUTH-002 — Negação por padrão

Quando não existir permissão explícita para determinada operação:

```text
DENY
```

deve ser o comportamento padrão.

---

## AUTH-003 — Isolamento por organização

Usuários não podem acessar dados pertencentes a organizações às quais não possuem acesso.

---

## AUTH-004 — Escopo por área

Quando o papel possuir escopo limitado a uma área, o usuário somente poderá operar sobre recursos pertencentes às áreas autorizadas.

---

## AUTH-005 — Menor privilégio

Cada papel deve possuir somente as permissões necessárias para executar sua função.

---

## AUTH-006 — Papel não é selecionado no login

O desenho funcional menciona o papel do usuário na tela inicial.

Na implementação, o usuário não deve escolher livremente:

```text
COLLABORATOR
MANAGER
DPO
ADMIN
```

O papel deve ser obtido das permissões cadastradas no backend.

---

# 3. Autenticação vs autorização

## Autenticação

Responde:

> Quem é o usuário?

Exemplo:

```text
userId = 7b3...
email = usuario@empresa.com
```

---

## Autorização

Responde:

> O usuário pode executar esta ação neste recurso?

Exemplo:

```text
Usuário:
João

Papel:
COLLABORATOR

Área:
RH

Recurso:
Atividade do Financeiro

Operação:
UPDATE

Resultado:
DENY
```

---

# 4. Contexto autenticado

Após autenticação, o backend deve ser capaz de construir um contexto semelhante a:

```ts
AuthenticatedContext {
    userId
    organizationId
    roles
    businessUnitIds
}
```

Esse contexto deve ser derivado de informações confiáveis do backend.

Não confiar em valores enviados livremente pelo cliente.

---

# 5. Organization Context

Toda operação relacionada aos dados de um cliente deve possuir contexto de organização.

Exemplo:

```text
Organization A
    ↓
Usuário
    ↓
Requisição
    ↓
Backend
    ↓
Organization A
```

Uma requisição não pode simplesmente enviar:

```json
{
  "organizationId": "organization-b"
}
```

e obter acesso à organização B.

O backend deve validar a associação do usuário.

---

# 6. Usuário em múltiplas organizações

A arquitetura permite que um usuário pertença a mais de uma organização.

Exemplo:

```text
User
│
├── Organization A
│      └── DPO
│
└── Organization B
       └── DPO
```

Nesse cenário, deve existir um **contexto de organização ativa**.

Exemplo:

```text
Organization A
```

Todas as operações seguintes devem respeitar esse contexto.

> Múltiplos vínculos independentes foram aprovados em DEC-035.

---

# 7. Papéis iniciais

O desenho funcional define:

```text
COLLABORATOR
MANAGER
DPO
```

A arquitetura propõe adicionalmente:

```text
ADMIN
```

Portanto:

| Papel | Descrição |
|---|---|
| `COLLABORATOR` | Usuário operacional de uma ou mais áreas |
| `MANAGER` | Gestor responsável por uma ou mais áreas |
| `DPO` | Encarregado com visão consolidada da organização |
| `ADMIN` | Administrador da organização |

`ADMIN` é uma proposta técnica e deve ser validado como requisito.

---

# 8. COLLABORATOR

## Escopo

Área(s) associada(s) ao usuário.

Exemplo:

```text
COLLABORATOR

BusinessUnits:
- RH
```

---

## Permissões iniciais

Pode:

```text
visualizar atividades da própria área
criar atividades na própria área
editar atividades permitidas da própria área
preencher wizard
cadastrar informações de mapeamento
visualizar pendências das próprias atividades
```

Não pode, por padrão:

```text
visualizar todas as áreas
administrar usuários
administrar organização
aprovar sua própria atividade
alterar regras do compliance gate
acessar dashboard global do DPO
```

---

# 9. MANAGER

## Escopo

Área(s) sob responsabilidade do gestor.

Exemplo:

```text
MANAGER

BusinessUnits:
- RH
- Departamento Pessoal
```

---

## Permissões iniciais

Pode:

```text
visualizar atividades das áreas sob sua responsabilidade
criar atividades
editar atividades permitidas
acompanhar pendências
visualizar indicadores das próprias áreas
```

Possível permissão:

```text
revisar atividades
```

A capacidade de aprovação ainda precisa ser definida.

---

# 10. DPO

## Escopo

Organização inteira.

---

## Permissões iniciais

Pode:

```text
visualizar todas as atividades da organização
visualizar todas as áreas
consultar ROPA
consultar dashboard
consultar atividades pendentes
consultar atividades com dados sensíveis
consultar atividades envolvendo menores
consultar transferências internacionais
consultar histórico das atividades
consultar compliance checks
```

Também poderá possuir responsabilidades de:

```text
revisão
aprovação
bloqueio
solicitação de correção
```

Essas operações dependem da definição final do workflow.

---

# 11. ADMIN

> Papel proposto pela arquitetura.

## Escopo

Organização inteira.

---

## Responsabilidades sugeridas

Pode administrar:

```text
usuários
papéis
áreas
cadastros auxiliares
sistemas
fornecedores
configurações organizacionais
```

O `ADMIN` não deve automaticamente possuir poderes jurídicos do DPO.

Exemplo:

```text
ADMIN
```

não significa necessariamente:

```text
pode aprovar conformidade
```

---

# 12. Super Admin da plataforma

Caso o produto seja SaaS multiempresa, poderá existir futuramente:

```text
PLATFORM_ADMIN
```

Esse papel não pertence ao contexto normal da organização cliente.

Responsabilidades possíveis:

```text
criar organizações
administrar tenants
suporte técnico
configuração da plataforma
```

O acesso aos dados dos clientes deve ser altamente restrito e auditado.

> Não faz parte do desenho funcional original e não deve ser implementado sem decisão explícita.

---

# 13. Permissões

Evitar espalhar verificações como:

```ts
if (user.role === 'DPO')
```

por toda a aplicação.

Preferir permissões semânticas.

Exemplo:

```text
processing_activity:create

processing_activity:read

processing_activity:update

processing_activity:submit

processing_activity:review

processing_activity:approve

processing_activity:archive

ropa:read

ropa:export

dashboard:read

user:manage

business_unit:manage

supplier:manage

system:manage

audit:read
```

---

# 14. Catálogo inicial de permissões

## Processing Activities

```text
processing_activity:create
processing_activity:read
processing_activity:update
processing_activity:submit
processing_activity:review
processing_activity:approve
processing_activity:archive
processing_activity:read_history
```

---

## ROPA

```text
ropa:read
ropa:export
```

---

## Dashboard

```text
dashboard:read
```

---

## Systems

```text
system:create
system:read
system:update
system:archive
```

---

## Suppliers

```text
supplier:create
supplier:read
supplier:update
supplier:archive
```

---

## Users

```text
user:create
user:read
user:update
user:disable
user:manage_roles
```

---

## Business Units

```text
business_unit:create
business_unit:read
business_unit:update
business_unit:archive
```

---

## Audit

```text
audit:read
```

---

# 15. Papel + escopo

Possuir uma permissão não significa automaticamente possuir acesso a todos os recursos.

A autorização deve considerar:

```text
Permission
+
Scope
```

Exemplo:

```text
COLLABORATOR

Permission:
processing_activity:update

Scope:
BUSINESS_UNIT
```

Enquanto:

```text
DPO

Permission:
processing_activity:read

Scope:
ORGANIZATION
```

---

# 16. Escopos

Escopos iniciais:

```text
OWN
BUSINESS_UNIT
ORGANIZATION
PLATFORM
```

---

## OWN

Somente recursos diretamente associados ao próprio usuário quando essa regra for aplicável.

---

## BUSINESS_UNIT

Recursos pertencentes às áreas autorizadas.

---

## ORGANIZATION

Todos os recursos da organização.

---

## PLATFORM

Recursos administrativos da plataforma SaaS.

Não deve ser utilizado por usuários normais dos clientes.

---

# 17. Matriz inicial

A matriz abaixo é uma proposta inicial e deve ser refinada após definição do workflow.

| Operação | Collaborator | Manager | DPO | Admin |
|---|---:|---:|---:|---:|
| Criar atividade | Área | Área | Organização | Organização |
| Ler atividade | Área | Área | Organização | Organização |
| Editar draft | Área | Área | Organização | Organização |
| Submeter atividade | Área | Área | A definir | A definir |
| Revisar atividade | Não | A definir | Sim | Não |
| Aprovar atividade | Não | A definir | A definir | Não |
| Consultar ROPA | Não, inicialmente na primeira entrega | Áreas explicitamente autorizadas | Organization do Membership | A definir |
| Exportar ROPA | Não | A definir | Sim | A definir |
| Dashboard global | Não | Não | Sim | A definir |
| Gerenciar usuários | Não | Não | Não | Sim |
| Gerenciar áreas | Não | Não | Não | Sim |
| Consultar auditoria | Não | A definir | Sim | A definir |

`A definir` significa que agentes de IA não devem decidir o comportamento durante implementação.

---

# 18. Autorização de ProcessingActivity

A autorização deve considerar:

```text
user
organization
businessUnit
activityStatus
permission
```

Exemplo:

```text
User
  role = COLLABORATOR
  businessUnit = RH

Activity
  businessUnit = RH
  status = DRAFT

Action
  UPDATE

Resultado:
ALLOW
```

Outro exemplo:

```text
User
  role = COLLABORATOR
  businessUnit = RH

Activity
  businessUnit = FINANCEIRO

Action
  UPDATE

Resultado:
DENY
```

---

# 19. Estado também influencia autorização

Uma permissão pode ser válida somente em determinados estados.

Exemplo:

```text
COLLABORATOR
+
processing_activity:update
+
atividade DRAFT
=
ALLOW
```

Mas:

```text
COLLABORATOR
+
processing_activity:update
+
atividade ACTIVE
=
possivelmente DENY
```

A regra definitiva será estabelecida em:

`06-WORKFLOWS.md`

---

# 20. Alteração de atividade ativa

Uma atividade `ACTIVE` possui implicações de versionamento.

Portanto, editar uma atividade ativa não deve ser equivalente a editar um draft.

Fluxo esperado:

```text
ACTIVE
   ↓
solicitação de alteração
   ↓
nova versão / revisão
   ↓
compliance gate
   ↓
ACTIVE
```

A autorização deve respeitar esse fluxo.

---

# 21. Compliance Gate

O usuário operacional pode preencher as informações necessárias para o gate.

Porém, a aplicação deve distinguir:

```text
preencher informação
```

de:

```text
aprovar conformidade
```

A definição de quem efetivamente aprova a atividade permanece pendente.

---

# 22. Sistemas e fornecedores

O desenho funcional permite cadastro rápido durante o wizard.

Portanto, usuários autorizados a mapear uma atividade podem precisar de:

```text
system:create
supplier:create
```

em modo limitado.

Exemplo:

```text
COLLABORATOR
    ↓
cadastra fornecedor durante wizard
    ↓
Supplier.mappingStatus = PENDING
```

Isso não significa que o colaborador possua permissão administrativa completa sobre fornecedores.

---

# 23. Cadastro rápido

Pode existir diferença entre:

```text
supplier:create_quick
```

e:

```text
supplier:manage
```

Assim:

```text
COLLABORATOR
```

poderia cadastrar um fornecedor mínimo durante o wizard.

Enquanto:

```text
ADMIN
```

poderia completar e administrar o cadastro.

O mesmo princípio pode ser aplicado a `System`.

---

# 24. ROPA

O ROPA deve respeitar o mesmo escopo das atividades.

Possível comportamento:

```text
MANAGER
    ↓
ROPA filtrado pelas próprias áreas
```

```text
DPO
    ↓
ROPA completo da organização
```

Na primeira entrega, COLLABORATOR não possui leitura do ROPA (DEC-039). Política de entregas posteriores não é inferida.

---

# 25. Dashboard

Dashboard global deve ser restrito a usuários com:

```text
dashboard:read
+
scope = ORGANIZATION
```

Indicadores de área podem futuramente utilizar:

```text
dashboard:read
+
scope = BUSINESS_UNIT
```

---

# 26. Audit Logs

Logs de auditoria podem conter informações sensíveis sobre operações internas.

A leitura deve ser restrita.

Possíveis usuários:

```text
DPO
ADMIN
PLATFORM_ADMIN
```

A matriz definitiva ainda precisa ser validada.

---

# 27. Frontend

O frontend deve utilizar as permissões retornadas pelo backend para controlar a interface.

Exemplo de resposta:

```json
{
  "user": {
    "id": "..."
  },
  "organization": {
    "id": "..."
  },
  "roles": [
    "MANAGER"
  ],
  "permissions": [
    "processing_activity:create",
    "processing_activity:read",
    "processing_activity:update"
  ]
}
```

---

# 28. Frontend não é segurança

Mesmo que o frontend não renderize:

```text
[Excluir]
```

uma chamada manual à API deve continuar sendo rejeitada quando o usuário não possuir autorização.

---

# 29. API

Uma requisição deve seguir aproximadamente:

```text
HTTP Request
      ↓
Authentication
      ↓
Organization Context
      ↓
Permission Check
      ↓
Resource Scope Check
      ↓
Business Rule
      ↓
Use Case
```

---

# 30. Exemplo de autorização

Requisição:

```http
PATCH /api/v1/processing-activities/:id
```

Processo:

```text
1. usuário está autenticado?

2. usuário pertence à organização ativa?

3. possui processing_activity:update?

4. atividade pertence à organização?

5. atividade pertence ao escopo de área permitido?

6. estado da atividade permite alteração?

7. regra de negócio permite alteração?

8. executar atualização
```

---

# 31. Ordem das verificações

Evitar revelar existência de recursos de outras organizações.

Exemplo:

Usuário da organização A solicita:

```text
/activity/{id-da-organizacao-B}
```

A resposta pública preferencial deve ser equivalente a:

```text
NOT_FOUND
```

quando apropriado, em vez de revelar:

> "Você não possui acesso à atividade da Empresa B."

---

# 32. IDOR

A aplicação deve ser protegida contra:

**Insecure Direct Object Reference**

Nunca assumir que conhecer:

```text
processingActivityId
```

é suficiente para acessar a atividade.

Sempre verificar:

```text
organization
+
permission
+
scope
```

---

# 33. Mudança de organização

Se usuários puderem pertencer a várias organizações, a mudança de contexto deve ser explícita.

Exemplo:

```text
Organization A
     ↓
Switch Organization
     ↓
Organization B
```

O backend deve validar que o usuário realmente possui associação com a organização B.

---

# 34. Convites

Caso exista criação de usuários por convite, fluxo sugerido:

```text
ADMIN
  ↓
convida usuário
  ↓
e-mail
  ↓
usuário aceita
  ↓
associação com Organization
  ↓
papel e áreas atribuídos
```

O mecanismo de convite ainda não está definido no desenho funcional original.

---

# 35. Desativação de usuário

Desativar um usuário deve impedir novas autenticações/operações sem eliminar seu histórico.

Exemplo:

```text
User.status = INACTIVE
```

Audit logs e versões anteriores continuam apontando para esse usuário.

---

# 36. Remoção de acesso à área

Caso um usuário deixe de possuir acesso ao RH:

```text
user_business_units
```

deve ser atualizado.

O histórico de operações anteriores realizadas pelo usuário deve permanecer intacto.

---

# 37. Sessões

A estratégia definitiva de sessão depende da solução de autenticação escolhida.

Possibilidades:

```text
JWT
session cookie
OIDC provider
```

Não escolher durante implementação sem verificar a decisão arquitetural correspondente.

---

# 38. SSO

O desenho funcional menciona:

```text
SSO se disponível
```

A arquitetura deve permitir integração futura com:

```text
Microsoft Entra ID
Google Workspace
OIDC
SAML
```

A V1 não deve implementar todos os provedores antecipadamente.

---

# 39. MFA

A necessidade de autenticação multifator deve ser definida em conjunto com os requisitos de segurança.

Especialmente relevante para:

```text
DPO
ADMIN
PLATFORM_ADMIN
```

Será detalhada em:

`09-SECURITY.md`

---

# 40. Auditoria de autorização

Operações administrativas relevantes devem gerar `AuditLog`.

Exemplos:

```text
USER_CREATED

USER_DISABLED

USER_ROLE_CHANGED

USER_BUSINESS_UNIT_CHANGED

ORGANIZATION_SETTINGS_CHANGED
```

---

# 41. Mudanças de papel

Toda alteração de papel deve registrar:

```text
quem alterou
qual usuário
papel anterior
novo papel
data/hora
organização
```

---

# 42. Elevação de privilégio

Usuários não devem conseguir elevar o próprio privilégio sem uma regra administrativa explícita.

Exemplo proibido:

```text
ADMIN altera próprio papel para DPO
```

caso não exista autorização específica para isso.

---

# 43. Permissões no token

Caso permissões sejam incluídas em JWT, considerar que alterações de papel podem tornar o token temporariamente desatualizado.

Possíveis estratégias:

```text
tokens curtos
refresh
consulta de permissões
session version
```

A solução depende da estratégia de autenticação.

---

# 44. Cache de autorização

Não introduzir cache complexo de permissões na V1 sem necessidade.

Correção e segurança têm prioridade sobre otimização prematura.

---

# 45. Regras críticas

### BR-AUTH-001

Usuário não autenticado não pode acessar endpoints protegidos.

### BR-AUTH-002

Usuário não pode acessar organização sem associação válida.

### BR-AUTH-003

Usuário não pode acessar recurso fora do seu tenant.

### BR-AUTH-004

Usuário com escopo de área não pode acessar recursos de áreas não autorizadas.

### BR-AUTH-005

Permissão deve ser validada no backend.

### BR-AUTH-006

Papel informado pelo frontend não deve determinar autorização.

### BR-AUTH-007

Conhecer o ID de uma entidade não concede acesso a ela.

### BR-AUTH-008

Usuário desativado não pode realizar novas operações autenticadas.

### BR-AUTH-009

Alterações de permissões devem ser auditáveis.

### BR-AUTH-010

Operações devem respeitar simultaneamente:

```text
tenant
+
permission
+
scope
+
workflow
```

---

# 46. Testes obrigatórios

A autorização deve possuir testes automatizados para pelo menos:

```text
usuário sem autenticação

usuário de outra organização

usuário da mesma organização

usuário de outra área

COLLABORATOR

MANAGER

DPO

ADMIN
```

---

# 47. Teste crítico de isolamento

Cenário:

```text
Organization A
Activity A

Organization B
User B
```

Quando:

```text
User B solicita Activity A
```

Então:

```text
acesso deve ser negado
```

independentemente de conhecer o UUID da atividade.

Esse teste deve existir para recursos multi-tenant críticos.

---

# 48. Questões abertas

Registrar também em `12-OPEN-QUESTIONS.md`.

### AUTHQ-002 — Aprovação

Quem aprova uma atividade?

```text
MANAGER
DPO
MANAGER + DPO
```

**Impacto:** alto.

---

### AUTHQ-011 — DPO pode editar?

O DPO possui somente revisão/aprovação ou também pode editar diretamente uma atividade?

**Impacto:** médio.

---

### AUTHQ-002 — Manager aprova?

O gestor apenas revisa ou pode aprovar atividades da própria área?

**Impacto:** alto.

---

### AUTHQ-004 — ROPA

COLLABORATOR pode consultar o ROPA da própria área?

**Impacto:** baixo/médio.

---

### AUTHQ-003 — Admin

O papel `ADMIN` será realmente criado?

**Impacto:** médio.

---

### AUTHQ-006 — Multi-organização

Um usuário pode pertencer a múltiplas organizações?

**Impacto:** alto.

---

### AUTHQ-007 — Múltiplos papéis

Um usuário pode possuir:

```text
MANAGER + DPO
```

dentro da mesma organização?

**Impacto:** médio.

---

### AUTHQ-008 — Múltiplas áreas

COLLABORATOR e MANAGER podem pertencer a múltiplas áreas?

**Impacto:** médio.

---

### AUTHQ-012 — Cadastro rápido

Quais campos um colaborador pode preencher ao cadastrar rapidamente:

```text
System
Supplier
```

durante o wizard?

**Impacto:** médio.

---

### AUTHQ-010 — SSO

SSO será obrigatório na V1 ou apenas preparado para evolução?

**Impacto:** médio/alto.

---

# 49. Instruções para agentes de IA

Antes de implementar qualquer endpoint protegido:

1. identificar a permissão necessária;
2. identificar o escopo;
3. validar organização;
4. validar área quando aplicável;
5. validar estado do recurso;
6. executar a regra de negócio;
7. registrar auditoria quando necessário.

Nunca implementar somente:

```ts
if (user.role === 'DPO') {
   ...
}
```

quando a operação puder ser representada através de uma permissão.

---

# 50. Regra contra decisões implícitas

Se uma operação depender de uma questão marcada como:

```text
A definir
```

ou estiver registrada em `12-OPEN-QUESTIONS.md`, o agente não deve escolher silenciosamente uma opção.

A decisão deve ser explicitamente registrada antes da implementação definitiva.

---

# 51. Próximo documento

As regras funcionais detalhadas da aplicação serão consolidadas em:

`05-BUSINESS-RULES.md`