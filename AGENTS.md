# AGENTS.md

> **Projeto:** LGPD Data Mapping Platform  
> **Objetivo:** instruções operacionais para agentes de IA que criarem, alterarem, revisarem ou testarem código neste repositório.

---

## 1. Regra principal

Antes de implementar qualquer funcionalidade relevante, leia a documentação relacionada em:

```text
/docs
```

A documentação funcional e técnica é a fonte de verdade do projeto.

Não invente regras de negócio para preencher lacunas.

---

# 2. Documentos do projeto

Estrutura esperada:

```text
/docs
├── 00-PROJECT.md
├── 01-ARCHITECTURE.md
├── 02-DOMAIN.md
├── 03-DATABASE.md
├── 04-AUTHORIZATION.md
├── 05-BUSINESS-RULES.md
├── 06-WORKFLOWS.md
├── 07-API.md
├── 08-FRONTEND.md
├── 09-SECURITY.md
├── 10-AUDIT.md
├── 11-TESTING.md
├── 12-OPEN-QUESTIONS.md
└── features/
```

Nem todos os documentos precisam ser lidos integralmente para toda tarefa.

Leia os documentos relacionados ao escopo da alteração.

---

# 3. Ordem de precedência

Em caso de dúvida, considere:

```text
decisão explicitamente registrada
        ↓
regra de negócio
        ↓
workflow
        ↓
domínio
        ↓
autorização
        ↓
API / banco / frontend
        ↓
implementação existente
```

Se código existente contradizer uma regra documentada, não assumir automaticamente que o código está correto.

Investigue a divergência.

---

# 4. Open Questions

Antes de implementar uma decisão estrutural, consulte:

```text
/docs/12-OPEN-QUESTIONS.md
```

Se uma questão relacionada estiver:

```text
OPEN
```

ou:

```text
IN_ANALYSIS
```

não transforme uma das alternativas em regra definitiva silenciosamente.

---

# 5. Questões bloqueadoras

Uma questão deve ser considerada potencialmente bloqueadora quando alterar:

```text
regra de negócio

modelo de dados

cardinalidade

workflow

autorização

tenant isolation

Compliance Gate

versionamento

contrato público da API

segurança
```

Nesses casos:

```text
pare a parte dependente da decisão
```

e indique claramente qual questão precisa ser resolvida.

---

# 6. Questões não bloqueadoras

Não interrompa desnecessariamente implementação por decisões triviais.

Exemplos:

```text
nome de variável interna

estrutura pequena de componente

função auxiliar

organização local de arquivo

biblioteca de ícones já compatível com o projeto
```

Decisões técnicas locais podem ser tomadas quando não alterarem comportamento funcional.

---

# 7. Não inventar regras jurídicas

Este projeto trabalha com LGPD.

O agente não deve inventar conclusões jurídicas.

Não assumir automaticamente:

```text
qual base legal é correta

que legítimo interesse é válido

que consentimento é necessário

que RIPD é obrigatório

que determinada transferência internacional é válida

que determinada medida de segurança é suficiente

que uma atividade está juridicamente conforme
```

O software registra informações e executa regras definidas pelo produto.

Não substitui avaliação jurídica.

---

# 8. Compliance Gate

O Compliance Gate é uma regra de sistema estruturada.

Nunca implementar como simples:

```ts
isCompliant = true;
```

O modelo conceitual possui checks independentes.

Exemplos:

```text
LEGAL_BASIS

RETENTION

SECURITY_MEASURES

INTERNATIONAL_TRANSFER

SENSITIVE_DATA

MINOR_DATA
```

Resultados possíveis:

```text
PASS

FAIL

REVIEW_REQUIRED

NOT_APPLICABLE
```

---

# 9. ComplianceStatus

Não confundir:

```text
ActivityStatus
```

com:

```text
ComplianceStatus
```

São conceitos diferentes.

Exemplo:

```text
status = COMPLIANCE_PENDING

complianceStatus = PENDING
```

---

# 10. Regra crítica

Uma atividade não pode ficar:

```text
ACTIVE
```

sem satisfazer as condições de compliance definidas pelo projeto.

A regra deve ser garantida no backend.

Nunca confiar somente na interface.

---

# 11. Workflow

Estados atualmente propostos:

```text
DRAFT

MAPPING

PENDING_REVIEW

COMPLIANCE_PENDING

ACTIVE

UNDER_REVIEW

ARCHIVED
```

Alguns ainda dependem de questões abertas.

Antes de implementar transições, consulte:

```text
/docs/06-WORKFLOWS.md

/docs/12-OPEN-QUESTIONS.md
```

---

# 12. Status não deve ser alterado arbitrariamente

Evitar:

```http
PATCH /processing-activities/:id
```

com:

```json
{
  "status": "ACTIVE"
}
```

Transições devem ocorrer por casos de uso semânticos.

Exemplo:

```text
startMapping()

submitActivity()

requestChanges()

runCompliance()

activateActivity()

startRevision()

archiveActivity()
```

---

# 13. Backend é autoridade

O backend é a fonte de verdade para:

```text
autorização

tenant isolation

workflow

Compliance Gate

validação de negócio

versionamento

auditoria
```

O frontend pode melhorar UX, mas não substitui essas garantias.

---

# 14. Multi-tenancy

A arquitetura assume isolamento por organização.

Recursos pertencentes a tenant devem possuir contexto:

```text
organizationId
```

direta ou indiretamente.

---

# 15. Nunca confiar em organizationId do cliente

Não fazer:

```ts
const organizationId = request.body.organizationId;
```

como fonte de autorização.

A organização deve vir do contexto autenticado/autorizado.

---

# 16. Tenant Context

Exemplo conceitual:

```ts
type AuthenticatedContext = {
  userId: string;
  organizationId: string;
  roles: string[];
  businessUnitIds: string[];
};
```

A estrutura definitiva depende das decisões de autenticação.

---

# 17. Toda consulta deve respeitar tenant

Errado:

```ts
repository.findById(id);
```

quando o recurso é tenant-bound.

Preferir conceitualmente:

```ts
repository.findById({
  id,
  organizationId,
});
```

ou mecanismo equivalente.

---

# 18. Cross-tenant relationships

Também validar relações.

Exemplo proibido:

```text
Activity
Organization A

↓

Supplier
Organization B
```

Conhecer um UUID não concede acesso.

---

# 19. IDOR

Nunca assumir que:

```text
UUID difícil de adivinhar
```

é mecanismo de segurança.

Toda busca por ID precisa aplicar autorização adequada.

---

# 20. Authorization

Papéis atualmente considerados:

```text
COLLABORATOR

MANAGER

DPO
```

Também existe proposta:

```text
ADMIN
```

e possibilidade futura:

```text
PLATFORM_ADMIN
```

Consulte `04-AUTHORIZATION.md` antes de utilizar esses papéis.

---

# 21. Permission-based authorization

Evitar espalhar código como:

```ts
if (user.role === 'DPO') {
  // ...
}
```

Preferir permissões semânticas.

Exemplo:

```text
processing_activity:create

processing_activity:update

processing_activity:submit

processing_activity:approve

processing_activity:archive

ropa:read

audit:read
```

---

# 22. Permission + Scope

Autorização pode depender de:

```text
permission
+
scope
```

Scopes conceituais:

```text
OWN

BUSINESS_UNIT

ORGANIZATION

PLATFORM
```

---

# 23. Controllers

Controllers devem ser finos.

Responsabilidades aceitáveis:

```text
receber request

extrair contexto

validar DTO estruturalmente

chamar use case

converter resultado em response
```

Não colocar regras complexas de negócio em controllers.

---

# 24. Domain/Application

Regras devem ficar preferencialmente em:

```text
domain
```

ou:

```text
application
```

dependendo da natureza da regra.

---

# 25. Repository

Repository não deve decidir regras de negócio.

Responsabilidade:

```text
persistência
consulta
```

sempre respeitando contratos definidos pela aplicação.

---

# 26. Arquitetura

O projeto adota como direção:

```text
Modular Monolith
```

Não transformar o projeto em microservices sem requisito explícito.

---

# 27. Backend

Stack proposta:

```text
NestJS

TypeScript

PostgreSQL
```

ORM aprovado: Drizzle (DBQ-001 / DEC-044). Queries em repository/persistence; migrations versionadas e revisáveis. Não simplificar constraints, índices ou policies para acomodar o ORM.

Integridade tenant-bound: validação da aplicação + constraints compostas envolvendo organization_id quando necessário (DBQ-008 / DEC-045). UUID/FK simples não garante mesmo tenant.

RLS adicional aprovado (DBQ-009 / DEC-046): tenant local à transação, acesso negado sem contexto, queries no mesmo contexto e nenhum tenant persistente em conexão reutilizada. Runtime sem superuser, BYPASSRLS, propriedade das tabelas protegidas ou alteração de policies; credencial de migration separada. Não substituir permission/scope por RLS. Global User/ExternalIdentity/Session e descoberta dos próprios Memberships exigem proteção específica, sem policy irrestrita. Testes PostgreSQL reais obrigatórios conforme DEC-046.

---

# 28. Frontend

Stack proposta:

```text
React

TypeScript

Vite

Tailwind CSS

TanStack Query

Zustand

React Hook Form

Zod
```

Utilize essas ferramentas de acordo com suas responsabilidades.

---

# 29. TanStack Query

Preferir para:

```text
server state

fetching

cache de API

mutations

loading de requests

invalidation
```

---

# 30. Zustand

Utilizar somente para estado global do cliente que realmente precise dele.

Não copiar dados da API para Zustand sem necessidade.

Evitar:

```text
TanStack Query
+
Zustand
```

mantendo duas fontes de verdade para o mesmo recurso.

---

# 31. React Hook Form

Utilizar para estado de formulários quando apropriado.

Especialmente:

```text
wizard

cadastros

edições
```

---

# 32. Zod

Pode ser utilizado no frontend para:

```text
schemas

validação

parsing
```

Mas validação do frontend não substitui validação do backend.

---

# 33. Banco de dados

Banco:

```text
PostgreSQL
```

IDs:

```text
UUID
```

Datas:

```text
TIMESTAMPTZ
```

Naming:

```text
snake_case
```

no banco.

---

# 34. Migrations

Toda mudança de schema deve possuir migration.

Não alterar manualmente banco compartilhado sem migration correspondente.

---

# 35. Migration safety

Antes de criar migration destrutiva, avaliar:

```text
dados existentes

compatibilidade

rollback

deploy
```

Evitar:

```text
DROP COLUMN
```

imediato quando houver risco de dados existentes.

---

# 36. Foreign Keys

Utilizar relações adequadas.

Não utilizar:

```text
ON DELETE CASCADE
```

indiscriminadamente.

Histórico, auditoria e versões não devem desaparecer por cascata acidental.

---

# 37. JSONB

Utilizar JSONB para:

```text
snapshots

metadata flexível

histórico
```

Não utilizar JSONB como substituto automático de modelagem relacional.

---

# 38. Dados reais de titulares

A V1 não deve armazenar dados pessoais reais de titulares apenas para realizar o mapeamento.

Exemplo:

A ferramenta pode registrar:

```text
Categoria: Identificação
Dado: CPF
```

mas não deve registrar:

```text
CPF de João = 123...
```

salvo futura mudança explícita de escopo.

---

# 39. Sistemas

`System` é entidade de primeira classe.

Não utilizar apenas:

```text
systemName: string
```

em todas as atividades se existir catálogo de sistemas.

---

# 40. Fornecedores

`Supplier` também é entidade de primeira classe.

Deve poder ser reutilizado entre atividades da mesma organização.

---

# 41. Quick Create

Wizard pode permitir cadastro rápido de:

```text
System

Supplier
```

quando autorizado.

Esses registros podem iniciar como:

```text
mappingStatus = PENDING
```

conforme regras do projeto.

---

# 42. Não inventar bloqueio externo

`mappingStatus = PENDING` não significa automaticamente que o software consegue bloquear tecnicamente um sistema de terceiros.

Sem integração externa:

```text
PENDING
```

representa pendência dentro da plataforma.

---

# 43. ROPA

ROPA deve ser tratado como:

```text
projection / read model
```

dos dados das atividades.

Não criar segunda estrutura manual duplicando toda informação da atividade.

---

# 44. ROPA current state

ROPA atual deve utilizar a versão vigente da atividade.

Não deve utilizar automaticamente versão ainda em revisão.

O comportamento definitivo durante `UNDER_REVIEW` depende das decisões de workflow.

---

# 45. Dashboard

Métricas devem ser derivadas de dados reais.

Exemplos previstos:

```text
% de mapeamento completo

pendências antigas

atividades com dados sensíveis

atividades envolvendo menores

transferências internacionais

sistemas pendentes

fornecedores pendentes
```

Não manter contadores manuais sem necessidade.

---

# 46. Versionamento

Alterações relevantes devem preservar histórico.

Não sobrescrever silenciosamente uma versão histórica.

Estrutura conceitual:

```text
Activity
├── v1
├── v2
└── v3
```

---

# 47. ActivityVersion

Snapshot histórico pode utilizar:

```text
JSONB
```

desde que seja capaz de reconstruir o estado relevante.

A estrutura definitiva ainda depende de decisão.

---

# 48. ACTIVE em edição

A direção arquitetural proposta é:

```text
v1 ACTIVE
        ↓
nova alteração
        ↓
v2 UNDER_REVIEW
        ↓
v1 continua vigente
        ↓
v2 aprovada
        ↓
v2 ACTIVE
```

Não consolidar definitivamente sem resolver as questões de workflow/versionamento correspondentes.

---

# 49. Audit Log

Mutations relevantes devem gerar Audit Log.

Exemplos:

```text
atividade criada

atividade submetida

atividade ativada

atividade arquivada

role alterada

usuário desativado

sistema criado

fornecedor criado
```

---

# 50. Audit Log não é console.log

Não utilizar:

```ts
console.log(...)
```

como mecanismo de auditoria.

Audit Log é persistente e estruturado.

---

# 51. Audit Log não é versionamento

Não tentar reconstruir ActivityVersion apenas percorrendo logs de eventos.

São responsabilidades diferentes.

---

# 52. Audit Service

Preferir mecanismo central.

Exemplo conceitual:

```ts
auditService.record({
  organizationId,
  actorId,
  action,
  entityType,
  entityId,
  metadata,
});
```

---

# 53. Auditoria crítica

Quando necessário, alteração de negócio e Audit Log devem participar da mesma transação.

Exemplo:

```text
BEGIN

alterar role

registrar USER_ROLE_CHANGED

COMMIT
```

---

# 54. Secrets

Nunca registrar:

```text
password

access token

refresh token

API key

cookie

authorization header

secret
```

em:

```text
logs

audit logs

errors

telemetry
```

---

# 55. Logging

Logs técnicos devem ser estruturados.

Preferir:

```json
{
  "level": "error",
  "requestId": "req-123",
  "message": "Failed to process request"
}
```

Evitar dump completo de requests.

---

# 56. Request ID

Requests devem possuir identificador de correlação quando infraestrutura suportar.

Exemplo:

```text
X-Request-Id
```

ou ID gerado pelo backend.

---

# 57. API

Base:

```text
/api/v1
```

Formato:

```text
JSON
```

---

# 58. Resource IDs

Utilizar UUID nos contratos externos quando aplicável.

---

# 59. Datas

API deve utilizar ISO 8601.

Exemplo:

```text
2026-09-17T13:30:00Z
```

---

# 60. Errors

Utilizar códigos estáveis.

Exemplo:

```json
{
  "error": {
    "code": "ACTIVITY_NOT_COMPLIANT",
    "message": "A atividade possui pendências de compliance.",
    "requestId": "req-123"
  }
}
```

---

# 61. Código vs mensagem

Frontend deve depender preferencialmente de:

```text
error.code
```

para comportamento.

Não depender de comparação de texto:

```ts
if (error.message === 'A atividade...')
```

---

# 62. HTTP Status

Utilizar semanticamente:

```text
200 OK

201 Created

204 No Content

400 Bad Request

401 Unauthorized

403 Forbidden

404 Not Found

409 Conflict

422 Unprocessable Entity

429 Too Many Requests

500 Internal Server Error
```

---

# 63. Cross-tenant response

Quando apropriado, recursos de outro tenant devem ser tratados como:

```text
NOT_FOUND
```

para evitar revelar sua existência.

Consulte as regras de autorização.

---

# 64. PATCH

Não permitir alteração de campos protegidos.

Exemplos:

```text
organizationId

createdBy

status

complianceStatus

currentVersion
```

quando esses campos forem controlados pelo sistema.

---

# 65. Mass Assignment

Nunca passar diretamente:

```ts
repository.update(req.body);
```

Utilizar DTO/command explicitamente permitido.

---

# 66. Validação

Existem três níveis conceituais:

```text
Structural Validation

Business Validation

Workflow Validation
```

Não misturar tudo em schemas de frontend.

---

# 67. Structural Validation

Exemplo:

```text
name é string

UUID possui formato válido

array possui elementos válidos
```

---

# 68. Business Validation

Exemplo:

```text
LEGITIMATE_INTEREST
↓
justification obrigatória
```

---

# 69. Workflow Validation

Exemplo:

```text
DRAFT
```

não pode ir diretamente para:

```text
ACTIVE
```

---

# 70. Campos condicionais

Sempre validar no backend.

Exemplo:

```text
INTERNATIONAL_TRANSFER
```

exige os campos definidos para transferência internacional.

Frontend apenas auxilia preenchimento.

---

# 71. Arquivos

Arquivos não devem ser armazenados como blobs dentro das tabelas de negócio por padrão.

Preferir:

```text
object storage
+
metadata no PostgreSQL
```

---

# 72. Upload

Validar:

```text
autorização

tenant

tamanho

MIME

extensão quando aplicável

nome

storage key
```

Malware scanning depende de decisão de infraestrutura.

---

# 73. Nome físico

Não utilizar diretamente filename fornecido pelo usuário como caminho físico.

Gerar storage key segura.

---

# 74. Frontend Security

Não inserir HTML não confiável com:

```text
dangerouslySetInnerHTML
```

sem sanitização e necessidade explícita.

---

# 75. Server State

Não manter cópia manual de recursos remotos em múltiplos stores.

Preferir TanStack Query como fonte de server state no frontend.

---

# 76. Wizard

Wizard deve suportar salvamento progressivo.

Usuário não deve perder todo o mapeamento porque ainda existem campos obrigatórios para conclusão.

Diferenciar:

```text
salvar rascunho
```

de:

```text
submeter/concluir
```

---

# 77. Validação do Draft

DRAFT pode estar incompleto.

Não aplicar todas as validações de conclusão ao salvar rascunho.

---

# 78. Form State

Dados não salvos podem permanecer localmente no formulário.

Dados já persistidos devem ser sincronizados com server state de forma previsível.

---

# 79. Loading

Toda mutation relevante deve apresentar estado de carregamento.

Evitar duplo clique gerando operações duplicadas.

---

# 80. Errors no frontend

Erros devem:

```text
ser compreensíveis

preservar dados digitados quando possível

indicar campo/etapa quando aplicável

permitir retry quando apropriado
```

---

# 81. Acessibilidade

Componentes devem considerar:

```text
labels

keyboard

focus

aria quando necessário

mensagens de erro associadas

contraste
```

---

# 82. Testes

Toda regra nova deve considerar:

```text
caso positivo

caso negativo

tenant

permission

workflow

audit
```

quando aplicável.

---

# 83. Test Runner

Stack proposta:

```text
Vitest

Testing Library

Playwright
```

Não adicionar outro framework sem necessidade.

---

# 84. Unit Tests

Priorizar regras como:

```text
Compliance Gate

state transitions

permission decisions

business validation
```

---

# 85. Integration Tests

Utilizar para validar:

```text
use case

repository

PostgreSQL

transactions

constraints
```

---

# 86. PostgreSQL

Não substituir PostgreSQL por SQLite em testes importantes de persistência se o comportamento depender de recursos específicos do PostgreSQL.

---

# 87. E2E

Playwright deve focar jornadas críticas.

Exemplos:

```text
login

criar atividade

mapear

submeter

compliance

ativar

ROPA

versionamento
```

---

# 88. Tenant Isolation Tests

São obrigatórios para recursos tenant-bound.

Exemplo:

```text
Organization A
```

não pode:

```text
ler

alterar

associar

remover
```

recursos da Organization B.

---

# 89. Regression Test

Bug corrigido deve receber teste de regressão quando possível.

Especialmente:

```text
segurança

autorização

tenant isolation

workflow

compliance
```

---

# 90. Dados de teste

Utilizar dados fictícios.

Nunca copiar base de cliente real para testes locais sem processo autorizado e sanitização apropriada.

---

# 91. TypeScript

Evitar:

```ts
any
```

sem justificativa.

Preferir tipos explícitos.

---

# 92. Type Assertions

Evitar:

```ts
as SomeType
```

apenas para silenciar TypeScript.

Se dado vem de fonte externa, validar/parsing antes.

---

# 93. Non-null assertions

Evitar:

```ts
value!
```

quando a ausência é possível.

Tratar estado explicitamente.

---

# 94. Enums

Não duplicar valores mágicos.

Evitar:

```ts
if (status === 'active')
```

em múltiplos locais sem contrato central.

---

# 95. Magic Strings

Preferir tipos/constantes compartilhados dentro do módulo apropriado.

Não criar um arquivo global gigantesco de constantes sem domínio.

---

# 96. Functions

Preferir funções pequenas com responsabilidade clara.

Não extrair cada linha para uma função apenas para reduzir tamanho artificialmente.

---

# 97. Comments

Comentários devem explicar:

```text
por quê
```

quando necessário.

Evitar comentários que apenas repetem o código.

Ruim:

```ts
// Set status to active
activity.status = 'ACTIVE';
```

Melhor:

```ts
// Keep the previously published version active until the revision passes compliance.
```

quando essa regra estiver aprovada.

---

# 98. TODO

TODO deve possuir contexto.

Evitar:

```ts
// TODO fix
```

Preferir:

```ts
// TODO(WFQ-005): define who can resolve REVIEW_REQUIRED checks.
```

Isso conecta código à documentação.

---

# 99. Open Question no código

Se implementação temporária for permitida apesar de questão aberta, identificar explicitamente.

Exemplo:

```ts
// OPEN QUESTION: DQ-004
```

Mas não espalhar soluções provisórias que consolidem decisões incompatíveis.

---

# 100. Dependências

Antes de adicionar package:

```text
verificar se já existe solução no projeto

avaliar manutenção

avaliar segurança

avaliar tamanho/complexidade

confirmar necessidade
```

---

# 101. Não adicionar dependência para função trivial

Exemplo:

Não instalar pacote apenas para:

```text
capitalize

UUID validation simples já disponível

debounce já existente

formatação pequena
```

quando a stack já resolve adequadamente.

---

# 102. Segurança de dependências

Não adicionar pacote:

```text
abandonado

desconhecido

desnecessariamente privilegiado
```

sem avaliação.

---

# 103. Microservices

Não criar:

```text
auth-service

ropa-service

compliance-service

audit-service
```

como aplicações independentes apenas porque são módulos diferentes.

No momento:

```text
Modular Monolith
```

é a direção arquitetural.

---

# 104. Redis

Não utilizar Redis se PostgreSQL/memória da aplicação resolver adequadamente o requisito.

Redis é opção arquitetural, não obrigação.

---

# 105. BullMQ

Não criar fila para operação simples e síncrona sem necessidade.

Candidatos futuros:

```text
exportações pesadas

notificações

processamento de arquivos
```

---

# 106. Cache

Não adicionar cache antes de existir necessidade mensurável.

Especialmente cuidado com cache em ambiente multi-tenant.

Toda cache key tenant-bound deve incluir contexto de organização.

---

# 107. Transactions

Utilizar transação quando múltiplas operações precisarem ser atomicamente consistentes.

Exemplo:

```text
publicar versão

atualizar versão vigente

alterar status

registrar auditoria
```

---

# 108. Concorrência

Não ignorar possibilidade de dois usuários editarem a mesma atividade.

Estratégia definitiva ainda depende de:

```text
APIQ-004
```

Não implementar last-write-wins silencioso como decisão permanente.

---

# 109. Datas

Backend deve trabalhar preferencialmente em UTC.

Não usar timezone local do servidor como regra de negócio implícita.

---

# 110. Soft Delete

Não adicionar `deletedAt` automaticamente em todas as tabelas.

Consulte:

```text
DBQ-004
```

Alguns recursos possuem estados próprios, como:

```text
ARCHIVED
```

---

# 111. Physical Delete

Dados históricos relacionados a:

```text
audit

versions

ROPA histórico
```

não devem desaparecer por delete acidental.

---

# 112. Performance

Evitar:

```text
N+1 queries

carregar relações gigantes sem necessidade

retornar milhares de registros sem paginação
```

---

# 113. Paginação

Listagens potencialmente grandes devem ser paginadas.

Exemplos:

```text
activities

audit logs

systems

suppliers

users
```

---

# 114. Dashboard Queries

Evitar carregar todas as atividades no backend e calcular métricas em JavaScript quando o PostgreSQL puder agregá-las eficientemente.

---

# 115. ROPA Queries

ROPA pode exigir read model/query específica.

Não deformar entidades de domínio apenas para facilitar uma tabela do frontend.

---

# 116. OpenAPI

Manter contrato OpenAPI atualizado quando API mudar.

Se tipos forem gerados futuramente, o contrato deve permanecer consistente.

---

# 117. API Breaking Changes

Não alterar silenciosamente:

```text
endpoint

enum

campo

tipo

semântica
```

se já estiver sendo consumido.

Documentar breaking changes.

---

# 118. Feature Implementation Process

Antes de codificar uma feature relevante, produzir mentalmente ou na resposta:

```text
1. arquivos afetados

2. entidades afetadas

3. regras de negócio

4. permissions

5. workflow

6. alterações de banco

7. endpoints

8. frontend

9. audit

10. testes
```

---

# 119. Antes de alterar banco

Verificar:

```text
/docs/02-DOMAIN.md

/docs/03-DATABASE.md

/docs/05-BUSINESS-RULES.md

/docs/12-OPEN-QUESTIONS.md
```

---

# 120. Antes de criar endpoint

Verificar:

```text
/docs/04-AUTHORIZATION.md

/docs/05-BUSINESS-RULES.md

/docs/06-WORKFLOWS.md

/docs/07-API.md
```

---

# 121. Antes de criar tela

Verificar:

```text
/docs/04-AUTHORIZATION.md

/docs/06-WORKFLOWS.md

/docs/07-API.md

/docs/08-FRONTEND.md
```

---

# 122. Antes de alterar Compliance Gate

Verificar:

```text
/docs/02-DOMAIN.md

/docs/05-BUSINESS-RULES.md

/docs/06-WORKFLOWS.md

/docs/12-OPEN-QUESTIONS.md
```

---

# 123. Antes de alterar autenticação

Verificar:

```text
/docs/04-AUTHORIZATION.md

/docs/09-SECURITY.md

/docs/12-OPEN-QUESTIONS.md
```

---

# 124. Antes de alterar auditoria/versionamento

Verificar:

```text
/docs/06-WORKFLOWS.md

/docs/10-AUDIT.md

/docs/12-OPEN-QUESTIONS.md
```

---

# 125. Antes de finalizar implementação

Verificar:

```text
lint

typecheck

tests

build
```

de acordo com scripts existentes no projeto.

---

# 126. Não inventar comandos

Antes de executar:

```text
npm run test

npm run lint

npm run build
```

verificar:

```text
package.json
```

Não assumir nomes de scripts.

---

# 127. Não trocar package manager

Se projeto utiliza:

```text
npm
```

não introduzir:

```text
pnpm
```

ou:

```text
yarn
```

sem decisão explícita.

Respeitar lockfile existente.

---

# 128. Não reescrever código fora do escopo

Ao corrigir uma feature:

```text
não refatorar módulos não relacionados
```

sem necessidade.

Mudanças devem permanecer focadas.

---

# 129. Preserve comportamento existente

Antes de modificar código existente:

```text
entenda comportamento atual

localize testes

localize consumidores

verifique documentação
```

Não substituir implementação apenas por preferência estética.

---

# 130. Não esconder problemas

Não utilizar:

```ts
// @ts-ignore
```

ou:

```ts
eslint-disable
```

para esconder problema sem justificativa.

---

# 131. Erros

Não engolir exceptions silenciosamente.

Ruim:

```ts
try {
  await operation();
} catch {
  return;
}
```

Tratar conforme contexto.

---

# 132. Mensagens ao usuário

Não expor:

```text
stack trace

SQL

internal path

secret

detalhes de infraestrutura
```

em responses da API.

---

# 133. Error logging

Erro interno pode registrar contexto técnico necessário, mas sem secrets ou conteúdo pessoal desnecessário.

---

# 134. Feature flags

Não introduzir sistema complexo de feature flags sem requisito.

Se necessário futuramente, documentar estratégia.

---

# 135. Configuração

Configuração de ambiente deve vir de:

```text
environment variables
```

ou mecanismo central de configuração.

Não hardcode:

```text
credentials

URLs de produção

tokens

segredos
```

---

# 136. `.env`

Nunca commitar:

```text
.env
```

com secrets reais.

Pode existir:

```text
.env.example
```

sem credenciais reais.

---

# 137. Documentação durante implementação

Se uma feature alterar uma decisão documentada, atualizar o documento correspondente.

Não deixar:

```text
código dizendo A
docs dizendo B
```

sem registrar a divergência.

---

# 138. Feature Specs

Funcionalidades maiores devem possuir documento em:

```text
/docs/features/
```

Exemplo:

```text
/docs/features/PROCESSING-ACTIVITY.md
```

---

# 139. Feature Spec deve definir

No mínimo:

```text
objetivo

atores

permissions

regras

fluxo

estados

campos

validações

API

erros

audit events

critérios de aceite

testes

open questions
```

---

# 140. Critérios de aceite

Devem ser verificáveis.

Evitar:

```text
"O sistema deve funcionar corretamente."
```

Preferir:

```text
Given:
atividade sem retenção

When:
usuário tenta concluir o Compliance Gate

Then:
RETENTION deve retornar FAIL

And:
atividade não pode ser ativada
```

---

# 141. IA implementando feature

Antes de gerar código, o agente deve identificar:

```text
Feature:
...

Docs consultados:
...

Rules:
...

Open Questions:
...

Database changes:
...

API changes:
...

Authorization:
...

Audit:
...

Tests:
...
```

Não é obrigatório criar arquivo para isso, mas o raciocínio da implementação deve respeitar esses pontos.

---

# 142. IA revisando código

Ao revisar código, priorizar:

```text
1. tenant isolation

2. authorization

3. business rules

4. workflow

5. compliance

6. data integrity

7. audit

8. security

9. tests

10. maintainability
```

---

# 143. Severidade de revisão

Problemas que podem permitir:

```text
cross-tenant access

authorization bypass

atividade ACTIVE sem compliance

perda de histórico

alteração de versão vigente incorreta

exposição de secrets
```

devem ser tratados como críticos.

---

# 144. Não assumir que teste existente prova segurança

Sempre verificar implementação.

Um teste pode:

```text
estar incompleto

mockar camada errada

não cobrir cross-tenant

não cobrir IDOR
```

---

# 145. Definition of Done

Uma feature está concluída quando aplicável:

```text
[ ] implementação concluída

[ ] regras documentadas respeitadas

[ ] tenant isolation aplicado

[ ] authorization aplicado

[ ] validações implementadas

[ ] workflow respeitado

[ ] Compliance Gate considerado

[ ] audit implementado

[ ] versionamento considerado

[ ] erros estáveis definidos

[ ] testes unitários

[ ] testes de integração

[ ] E2E quando crítico

[ ] lint

[ ] typecheck

[ ] build

[ ] documentação atualizada
```

---

# 146. Regra final para agentes

Quando existir conflito entre:

```text
"terminar rápido"
```

e:

```text
inventar uma regra estrutural
```

não invente a regra.

Quando existir conflito entre:

```text
"criar arquitetura sofisticada"
```

e:

```text
resolver o requisito atual de forma simples
```

prefira a solução simples compatível com a arquitetura.

Quando existir conflito entre:

```text
frontend conveniente
```

e:

```text
segurança do backend
```

a segurança do backend prevalece.

Quando existir conflito entre:

```text
código existente
```

e:

```text
documentação aprovada
```

investigue antes de alterar qualquer um.

O objetivo é construir uma plataforma:

```text
segura

rastreável

testável

multi-tenant

evolutiva

sem regras jurídicas inventadas

sem complexidade desnecessária
```