# Environments & Deployment

> **Documento:** Ambientes, Infraestrutura e Deploy  
> **Status:** Draft  
> **Objetivo:** definir como a aplicação deve ser configurada, executada, testada e implantada de forma previsível e segura.


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

Este documento define padrões para:

```text
local development

Docker

environment variables

test environment

staging

production

PostgreSQL

object storage

Redis quando necessário

migrations

seeds

build

deploy

health checks

backups

rollback

CI/CD

secrets

logging

monitoring
```

---

# 2. Princípios

A infraestrutura deve priorizar:

```text
simplicidade

reprodutibilidade

segurança

observabilidade

automação

recuperação

baixo acoplamento com fornecedor
```

---

# 3. Regra arquitetural

Aplicar:

```text
DEC-001 — Modular Monolith
```

A infraestrutura inicial deve refletir essa decisão.

Não criar automaticamente:

```text
microservices

service mesh

Kafka

Kubernetes

distributed databases
```

sem necessidade aprovada.

---

# 4. Ambientes

Ambientes conceituais:

```text
LOCAL

TEST

STAGING

PRODUCTION
```

---

# 5. LOCAL

Utilizado para desenvolvimento.

Pode utilizar:

```text
frontend local

backend local

PostgreSQL via Docker

object storage local

email fake/local

Redis local quando realmente necessário
```

---

# 6. TEST

Utilizado por:

```text
unit tests

integration tests

API tests

E2E
```

Deve possuir isolamento suficiente para não utilizar dados reais de produção.

---

# 7. STAGING

Ambiente semelhante à produção destinado a:

```text
homologação

E2E

validação de migrations

validação de deploy

integrações

release candidate
```

A existência obrigatória e infraestrutura exata dependem das decisões de produção.

---

# 8. PRODUCTION

Ambiente destinado a usuários reais.

Deve possuir controles adequados para:

```text
security

backup

monitoring

availability

logging

secrets

TLS
```

---

# 9. Separação de ambientes

Ambientes não devem compartilhar inadvertidamente:

```text
database

storage bucket

credentials

session secrets

OAuth clients

queues

cache

email configuration
```

---

# 10. Production Data

Dados de produção não devem ser copiados diretamente para ambientes inferiores sem processo aprovado de:

```text
sanitization

anonymization

authorization
```

---

# 11. Configuração

Aplicação deve seguir princípio:

```text
code is the same

configuration changes by environment
```

Evitar branches contendo lógica como:

```ts
if (environment === 'customer-a-production') {
  // special business behavior
}
```

---

# 12. Environment Variables

Configurações sensíveis ou específicas de ambiente devem vir de configuração externa.

Exemplo conceitual:

```text
NODE_ENV

APP_ENV

API_PORT

DATABASE_URL

AUTH_...

STORAGE_...

REDIS_URL

LOG_LEVEL
```

Os nomes definitivos devem acompanhar a implementação.

---

# 13. `.env`

Arquivos reais contendo secrets não devem ser versionados.

Permitido:

```text
.env.example
```

Proibido:

```text
.env.production
```

com credenciais reais no Git.

---

# 14. `.env.example`

Deve documentar variáveis necessárias sem valores secretos.

Exemplo:

```env
NODE_ENV=development

API_PORT=3000

DATABASE_URL=

STORAGE_ENDPOINT=

STORAGE_BUCKET=

STORAGE_ACCESS_KEY=

STORAGE_SECRET_KEY=
```

---

# 15. Validation de Environment

Backend deve validar configurações no startup.

Se variável obrigatória estiver ausente:

```text
fail fast
```

Preferir falha explícita a aplicação parcialmente configurada.

---

# 16. Secrets

Secrets incluem:

```text
database passwords

JWT/session secrets

OIDC client secrets

storage credentials

SMTP credentials

API keys

private keys
```

---

# 17. Secret Management

Produção deve utilizar mecanismo seguro de secret management.

Tecnologia depende da infraestrutura escolhida.

Possibilidades:

```text
cloud secret manager

container platform secrets

dedicated vault
```

Não escolher fornecedor antes da decisão de infraestrutura.

---

# 18. Secret Rotation

Infraestrutura deve permitir rotação de secrets sem alteração do código-fonte.

---

# 19. Frontend Environment Variables

Toda variável incluída no bundle frontend deve ser considerada:

```text
PUBLIC
```

Nunca colocar no frontend:

```text
database password

client secret

private API key

storage secret
```

---

# 20. Docker

Docker deve ser utilizado para tornar desenvolvimento e execução reproduzíveis.

---

# 21. Docker Local

Estrutura possível:

```text
docker-compose.yml
```

com:

```text
postgres

object storage

redis
```

somente quando cada serviço for necessário.

---

# 22. Frontend e Backend no Docker Local

Pode-se executar:

```text
frontend/backend diretamente no host
```

e dependências via Docker.

Isso costuma facilitar:

```text
hot reload

debugging

IDE integration
```

Não é obrigatório containerizar toda aplicação durante desenvolvimento.

---

# 23. Dockerfile

Build de produção deve utilizar Dockerfile previsível quando containers forem estratégia aprovada.

Preferir:

```text
multi-stage build
```

quando apropriado.

---

# 24. Docker Image

Imagem de produção deve conter apenas o necessário para execução.

Evitar incluir:

```text
source maps privados sem necessidade

test fixtures

development dependencies

local secrets

.env files

Git metadata
```

---

# 25. Container User

Evitar executar processo da aplicação como:

```text
root
```

quando não houver necessidade.

---

# 26. Image Tag

Não depender exclusivamente de:

```text
latest
```

para produção.

Preferir identificação imutável como:

```text
Git SHA

release version
```

---

# 27. PostgreSQL

Banco principal:

```text
PostgreSQL
```

conforme `DEC-003`.

---

# 28. Database per Environment

Cada ambiente deve possuir banco independente.

Exemplo:

```text
lgpd_local

lgpd_test

lgpd_staging

lgpd_production
```

Nomes são apenas ilustrativos.

---

# 29. Database Credentials

Credenciais devem ser diferentes entre ambientes.

---

# 30. Database Permissions

Aplicação deve utilizar usuário de banco com privilégios necessários para sua função.

Evitar executar aplicação permanentemente como superuser do PostgreSQL.

---

# 31. Migration User

Se necessário, deploy pode utilizar credencial separada para migrations.

Decisão depende da infraestrutura.

---

# 32. Migrations

Schema deve evoluir exclusivamente por migrations controladas.

---

# 33. Migration no Deploy

Fluxo conceitual:

```text
Build
↓
Tests
↓
Artifact
↓
Deploy Preparation
↓
Migration
↓
Application Deployment
↓
Health Validation
```

A ordem exata deve considerar compatibilidade entre versão antiga e nova.

---

# 34. Backward-Compatible Migrations

Preferir mudanças compatíveis com deploy gradual.

Exemplo:

Em vez de:

```text
rename column imediatamente
```

pode ser necessário:

```text
add new column
↓
deploy compatible code
↓
migrate data
↓
remove old column later
```

quando disponibilidade exigir.

---

# 35. Migration Destrutiva

Mudanças como:

```text
DROP TABLE

DROP COLUMN

data type incompatible

NOT NULL sobre dados existentes
```

exigem revisão explícita.

---

# 36. Migration Rollback

Não assumir que toda migration possui rollback simples.

Algumas mudanças destrutivas podem exigir:

```text
backup restore
```

ou migration corretiva.

---

# 37. Migration em Produção

Nunca executar automaticamente algo equivalente a:

```text
schema push
```

destrutivo sem migration revisada.

---

# 38. Seed

Seeds possuem finalidades diferentes.

Separar:

```text
reference data

development demo data

test fixtures
```

---

# 39. Production Seed

Somente dados necessários ao funcionamento devem ser inseridos em produção.

Exemplo possível:

```text
system catalogs
```

quando definidos.

---

# 40. Demo Data

Nunca inserir automaticamente em produção:

```text
fake companies

fake activities

test users

example suppliers
```

---

# 41. Seed Idempotency

Seeds de referência devem ser idempotentes quando possível.

---

# 42. Test Database

Integration tests devem possuir banco isolado.

Aplicar `11-TESTING.md`.

---

# 43. Test Isolation

Testes não devem depender da ordem de execução.

Cada teste deve preparar estado necessário.

---

# 44. Object Storage

Arquivos devem utilizar object storage compatível com requisitos definidos em:

```text
09-SECURITY.md
```

e:

```text
DEC-017
```

---

# 45. Possíveis Implementações

Arquitetura pode utilizar:

```text
S3-compatible storage
```

Exemplo local:

```text
MinIO
```

Produção pode utilizar serviço equivalente aprovado.

---

# 46. Storage Abstraction

Código de domínio não deve depender diretamente de SDK específico de cloud.

Preferir interface conceitual:

```ts
interface FileStorage {
  upload(...): Promise<StoredFile>;
  getDownloadUrl(...): Promise<string>;
  delete(...): Promise<void>;
}
```

---

# 47. Private Storage

Buckets/containers devem ser:

```text
private
```

por padrão.

---

# 48. File Access

Fluxo:

```text
User
↓
Backend authorization
↓
File ownership/tenant validation
↓
Temporary access
```

---

# 49. Signed URLs

Quando utilizadas:

```text
short-lived

resource-specific

generated after authorization
```

---

# 50. File Path

Object keys devem evitar dependência de filename fornecido pelo usuário.

Exemplo conceitual:

```text
organizations/{organizationId}/files/{fileId}
```

---

# 51. Filename

Nome original pode ser metadata.

Nunca utilizar filename do usuário diretamente como path sem sanitização.

---

# 52. Storage Tenant Isolation

Objetos devem possuir associação inequívoca com:

```text
organizationId
```

---

# 53. Storage Environments

Separar storage de:

```text
development

test

staging

production
```

---

# 54. Redis

Redis não é dependência obrigatória inicial.

---

# 55. Quando usar Redis

Possíveis necessidades:

```text
queue

distributed cache

rate limiting

session storage
```

somente quando arquitetura exigir.

---

# 56. Não usar Redis como fonte primária

Dados de domínio não devem depender exclusivamente de Redis.

---

# 57. BullMQ

BullMQ pode ser considerado para:

```text
large exports

notifications

long-running jobs
```

quando necessário.

---

# 58. Jobs

Job deve possuir identificador e contexto suficiente.

Exemplo:

```ts
{
  jobId,
  organizationId,
  requestedBy,
  resourceId
}
```

quando aplicável.

---

# 59. Tenant Isolation em Jobs

Worker nunca deve buscar recurso apenas por:

```text
resourceId
```

se o recurso for tenant-bound.

---

# 60. Job Idempotency

Jobs sujeitos a retry devem ser projetados para evitar efeitos duplicados indevidos.

---

# 61. Job Retry

Retries devem distinguir:

```text
temporary failure

permanent validation failure
```

---

# 62. Dead Letter / Failed Jobs

Se queues forem introduzidas, deve existir estratégia para jobs definitivamente falhos.

---

# 63. ROPA Export

Export pode começar síncrono se volume permitir.

Estratégia depende de:

```text
APIQ-006
ROPAQ-005
```

---

# 64. Export Assíncrono

Se necessário:

```text
Request Export
↓
Create Export Job
↓
Worker
↓
Generate File
↓
Private Storage
↓
Authorized Download
```

---

# 65. Export Security

Job e arquivo devem manter:

```text
organizationId

requesting user

scope

filters

snapshot/version
```

quando necessário.

---

# 66. Build Frontend

Build deve produzir artefato estático otimizado.

---

# 67. Build Backend

Build deve produzir artefato executável sem depender do TypeScript compiler em runtime quando não necessário.

---

# 68. Reproducible Builds

Utilizar lockfile versionado.

Exemplo:

```text
package-lock.json
```

ou equivalente escolhido pelo projeto.

---

# 69. Package Manager

Escolher um único package manager.

Exemplos:

```text
npm

pnpm

yarn
```

Não misturar lockfiles.

---

# 70. Node Version

Versão do Node deve ser definida explicitamente.

Possibilidades:

```text
.nvmrc

.node-version

package.json engines
```

---

# 71. CI

Pipeline deve seguir `14-IMPLEMENTATION-PLAN.md`.

Mínimo:

```text
install

lint

typecheck

unit tests

build
```

---

# 72. CI Integration Tests

Adicionar:

```text
PostgreSQL

integration tests
```

ao pipeline quando persistência estiver implementada.

---

# 73. CI E2E

E2E crítico deve rodar:

```text
PR

merge

release
```

conforme custo e duração definidos.

---

# 74. Pipeline Security

CI não deve imprimir secrets.

---

# 75. Dependency Cache

Cache de dependências pode ser utilizado para acelerar pipeline.

Não armazenar:

```text
secrets

private artifacts
```

em cache inseguro.

---

# 76. Artifact

Build aprovado deve gerar artefato identificável.

---

# 77. Build Once

Preferir conceito:

```text
build once
↓
promote same artifact
```

entre ambientes quando infraestrutura permitir.

Evitar recompilar código diferente para produção.

---

# 78. Deploy

Estratégia específica depende de:

```text
INFRAQ-001
INFRAQ-002
```

---

# 79. Deploy Automation

Produção deve evitar processos manuais não rastreáveis.

Preferir pipeline auditável.

---

# 80. Deploy Authorization

Somente usuários/processos autorizados devem realizar deploy em produção.

---

# 81. Deployment Strategy

Possibilidades futuras:

```text
rolling

blue/green

replace
```

Escolher conforme infraestrutura e necessidade.

Não implementar complexidade antes de requisito.

---

# 82. Health Check

Aplicação deve expor endpoint operacional.

Exemplo:

```http
GET /health
```

---

# 83. Liveness

Liveness responde:

```text
processo está vivo?
```

---

# 84. Readiness

Readiness responde:

```text
aplicação está pronta para receber tráfego?
```

---

# 85. Health Information

Endpoints não devem expor:

```text
database credentials

internal hostnames desnecessários

stack traces

secret values
```

---

# 86. Database Health

Readiness pode validar conectividade essencial com banco quando apropriado.

---

# 87. Storage Health

Não necessariamente consultar object storage em todo health request.

Definir checks que não causem carga ou dependências desnecessárias.

---

# 88. Startup

Aplicação deve falhar claramente se configuração essencial estiver inválida.

---

# 89. Graceful Shutdown

Backend deve permitir encerramento controlado.

Objetivo:

```text
stop accepting new requests

finish appropriate work

close connections
```

---

# 90. Reverse Proxy

Produção pode utilizar:

```text
Nginx

cloud load balancer

platform proxy
```

dependendo da infraestrutura.

---

# 91. HTTPS

Produção deve utilizar:

```text
HTTPS
```

---

# 92. TLS Termination

Pode ocorrer:

```text
load balancer

reverse proxy

container platform
```

conforme infraestrutura.

---

# 93. CORS

Produção deve permitir apenas origins necessárias.

Evitar:

```text
Access-Control-Allow-Origin: *
```

para APIs autenticadas sem análise específica.

---

# 94. Authentication Configuration

Configuração de autenticação deve ser independente por ambiente.

Exemplo:

```text
redirect URLs

issuer

client ID

client secret

cookie domain
```

---

# 95. Cookies

Se sessão utilizar cookies:

Produção deve avaliar:

```text
Secure

HttpOnly

SameSite

Domain

Path
```

conforme `09-SECURITY.md`.

---

# 96. CSRF

Estratégia depende de:

```text
SECQ-002
```

e mecanismo de sessão escolhido.

---

# 97. Logging

Produção deve utilizar logs estruturados.

---

# 98. Log Levels

Utilizar:

```text
ERROR

WARN

INFO

DEBUG
```

conforme biblioteca escolhida.

Produção não deve usar DEBUG indiscriminadamente.

---

# 99. Request Correlation

Requests devem possuir identificador de correlação quando útil.

Exemplo:

```text
requestId
```

---

# 100. Log Context

Logs podem incluir:

```text
requestId

actorId

organizationId

resourceId

event
```

quando apropriado.

---

# 101. Log Privacy

Não logar body completo automaticamente.

Especialmente endpoints contendo:

```text
legal basis justification

security measures

supplier metadata

consent documents

attachments
```

---

# 102. AuditLog ≠ Application Log

Aplicar `DEC-015`.

Logs operacionais podem ser descartados conforme retenção operacional.

AuditLog possui finalidade própria.

---

# 103. Observability

Produção deve possuir capacidade de observar:

```text
availability

errors

latency

resource consumption

database health

job failures
```

---

# 104. Error Tracking

Utilizar ferramenta de error tracking quando infraestrutura for definida.

Não enviar dados sensíveis sem sanitização.

---

# 105. Metrics

Métricas técnicas possíveis:

```text
HTTP request count

HTTP latency

5xx count

database connection usage

job failures

export duration
```

---

# 106. Business Metrics

Não misturar observabilidade técnica com Dashboard LGPD.

Exemplo:

```text
processing_activity_count
```

pode ser métrica técnica/produto.

Mas Dashboard oficial deve usar seus próprios read models e regras.

---

# 107. Alerts

Alertas técnicos devem focar condições acionáveis.

Exemplos:

```text
API unavailable

high error rate

database unavailable

backup failed

job failure spike
```

---

# 108. Backup

Produção deve possuir backup do PostgreSQL.

---

# 109. Backup Strategy

Resolver:

```text
INFRAQ-007
```

incluindo:

```text
frequency

retention

encryption

storage location

restore process
```

---

# 110. Backup Encryption

Backups devem possuir proteção adequada em repouso e trânsito.

---

# 111. Backup Access

Acesso deve ser restrito.

Backup contém potencialmente todo estado do produto.

---

# 112. Object Storage Backup

Definir separadamente se arquivos necessitam:

```text
versioning

replication

backup

retention
```

conforme infraestrutura.

---

# 113. Restore Test

Backup só deve ser considerado operacionalmente confiável quando restore for testado.

---

# 114. Restore Procedure

Documentar:

```text
who

where

how

validation

estimated time
```

---

# 115. RPO

Definir futuramente:

```text
Recovery Point Objective
```

---

# 116. RTO

Definir futuramente:

```text
Recovery Time Objective
```

---

# 117. Nova Open Question

Adicionar:

```text
INFRAQ-009
```

Pergunta:

```text
Qual RPO esperado para produção?
```

Priority:

```text
HIGH
```

---

# 118. Nova Open Question

Adicionar:

```text
INFRAQ-010
```

Pergunta:

```text
Qual RTO esperado para produção?
```

Priority:

```text
HIGH
```

---

# 119. Disaster Recovery

Estratégia completa depende de:

```text
RPO

RTO

cloud/provider

database architecture

storage architecture
```

Não criar infraestrutura multi-region automaticamente.

---

# 120. Rollback

Deploy deve possuir estratégia de recuperação.

---

# 121. Application Rollback

Quando schema for compatível:

```text
deploy version N
↓
problem
↓
deploy previous artifact
```

---

# 122. Database Rollback

Não assumir:

```text
application rollback = database rollback
```

São problemas diferentes.

---

# 123. Migration Compatibility

Deploy deve considerar:

```text
old app + new schema

new app + new schema
```

quando rollback for necessário.

---

# 124. Feature Flags

Podem ajudar em mudanças complexas, mas não são obrigatórias na V1.

Não criar plataforma de feature flags sem necessidade.

---

# 125. Release Version

Aplicação deve possuir identificação de versão/build.

Exemplo:

```text
Git SHA
```

---

# 126. Version Endpoint

Pode existir endpoint operacional:

```http
GET /version
```

ou informação equivalente em health metadata.

Não expor detalhes sensíveis.

---

# 127. Database Connection Pool

Configurar pool apropriado ao ambiente.

Não utilizar defaults sem observar capacidade do PostgreSQL.

---

# 128. Horizontal Scaling

Backend deve evitar estado local que impeça múltiplas instâncias quando possível.

---

# 129. Local Filesystem

Não usar filesystem local do container como armazenamento permanente de:

```text
consent files

ROPA exports

attachments
```

---

# 130. Session State

Se sessão exigir estado compartilhado entre instâncias, arquitetura deve fornecer mecanismo apropriado.

Depende de:

```text
SECQ-002
```

---

# 131. Cache Tenant Isolation

Toda cache tenant-bound deve incluir tenant na chave.

Exemplo:

```text
organization:{organizationId}:dashboard:summary
```

---

# 132. Cache Invalidation

Não introduzir cache sem definir como será invalidado.

---

# 133. Database Cache

Não usar cache para mascarar query mal projetada antes de medir.

---

# 134. ROPA Performance

Primeiro:

```text
query optimization

indexes

pagination
```

Depois considerar:

```text
materialized read model

cache
```

se necessário.

---

# 135. Dashboard Performance

Mesma regra:

```text
measure
↓
optimize query
↓
index
↓
consider cache
```

---

# 136. Dependency Updates

Dependências devem ser atualizadas de forma controlada.

---

# 137. Lockfile

Lockfile deve fazer parte do Git.

---

# 138. Vulnerability Scanning

CI pode incluir scanner de dependências.

Estratégia/ferramenta depende do ambiente.

---

# 139. Container Scanning

Se produção utilizar containers, considerar scan das imagens.

---

# 140. Base Images

Preferir imagens:

```text
maintained

minimal

pinned
```

quando possível.

---

# 141. Production Debugging

Não habilitar ferramentas administrativas/debug publicamente.

---

# 142. Database Exposure

PostgreSQL de produção não deve ficar publicamente acessível sem necessidade.

---

# 143. Redis Exposure

Mesma regra para Redis.

---

# 144. Object Storage Exposure

Bucket privado não deve possuir listagem pública.

---

# 145. Admin Interfaces

Ferramentas administrativas de infraestrutura devem possuir acesso restrito.

---

# 146. Infrastructure as Code

Pode ser adotado após definição de:

```text
INFRAQ-001
INFRAQ-002
```

Possibilidades incluem ferramentas específicas do provedor ou independentes.

Não escolher automaticamente.

---

# 147. Staging Data

Preferir:

```text
synthetic data
```

para homologação.

---

# 148. Production Support

Acesso humano direto ao banco de produção deve ser:

```text
restrito

justificado

auditável quando possível
```

---

# 149. Manual Database Changes

Evitar alterações manuais de schema em produção.

Schema deve evoluir por migration.

---

# 150. Data Correction

Correções manuais de dados devem utilizar procedimento controlado.

Preferir:

```text
script versionado

migration de dados

admin use case
```

dependendo do caso.

---

# 151. Deployment Checklist

Antes do deploy:

```text
[ ] CI green

[ ] migrations revisadas

[ ] secrets disponíveis

[ ] environment validation correta

[ ] artifact identificado

[ ] backup disponível quando necessário

[ ] rollback considerado

[ ] release notes quando aplicável
```

---

# 152. Post-Deployment Checklist

```text
[ ] health check OK

[ ] readiness OK

[ ] login OK

[ ] database connectivity OK

[ ] storage access OK

[ ] migrations aplicadas

[ ] error rate normal

[ ] logs sem erros críticos

[ ] fluxo crítico validado quando necessário
```

---

# 153. Production Incident

Em incidente:

```text
Detect
↓
Assess
↓
Contain
↓
Recover
↓
Validate
↓
Document
```

Procedimento detalhado será definido em runbook específico quando necessário.

---

# 154. Audit durante incidentes

Não alterar ou apagar AuditLog para ocultar/corrigir eventos.

---

# 155. Clock

Servidores e serviços devem possuir relógios sincronizados.

Importante para:

```text
AuditLog

ActivityVersion

authentication

signed URLs

incident analysis
```

---

# 156. UTC

Persistência técnica deve preferir UTC.

Frontend converte para timezone de apresentação.

---

# 157. Local Development Setup

Objetivo ideal:

```text
clone
↓
install
↓
copy .env.example
↓
start dependencies
↓
migrate
↓
seed
↓
run
```

---

# 158. Comandos

Projeto deve disponibilizar scripts claros.

Exemplo conceitual:

```text
dev

build

lint

typecheck

test

test:integration

test:e2e

db:migrate

db:seed
```

Nomes exatos podem variar.

---

# 159. README

README principal deve explicar apenas onboarding essencial.

Detalhes arquiteturais permanecem em:

```text
/docs
```

---

# 160. Developer Setup Validation

Um novo desenvolvedor deve conseguir iniciar ambiente utilizando documentação, sem conhecimento implícito da máquina de outro desenvolvedor.

---

# 161. Agent Setup

Agentes de IA não devem alterar infraestrutura apenas porque não conseguem executar um comando imediatamente.

Primeiro identificar:

```text
missing dependency?

missing environment variable?

service not running?

documented setup?
```

---

# 162. Prohibited Infrastructure Patterns

Não introduzir sem decisão/requisito:

```text
microservices

Kafka

Kubernetes

multi-region

multiple databases per module

public buckets

public database

production secrets in Git

production data in tests

Redis as primary database

manual schema changes

unversioned migrations

latest-only production images

permanent local container storage for uploads
```

---

# 163. Open Questions existentes relevantes

Consultar em:

```text
12-OPEN-QUESTIONS.md
```

principalmente:

```text
INFRAQ-001
INFRAQ-002
INFRAQ-003
INFRAQ-004
INFRAQ-005
INFRAQ-006
INFRAQ-007
INFRAQ-008

SECQ-001
SECQ-002
SECQ-005

APIQ-006
APIQ-007
```

---

# 164. Novas Open Questions

Adicionar ao documento central:

```text
INFRAQ-009
```

```text
Qual RPO esperado para produção?
```

Priority:

```text
HIGH
```

---

Adicionar:

```text
INFRAQ-010
```

```text
Qual RTO esperado para produção?
```

Priority:

```text
HIGH
```

---

Adicionar:

```text
INFRAQ-011
```

Pergunta:

```text
O deploy de produção exige zero downtime?
```

Priority:

```text
MEDIUM
```

Impacta:

```text
migration strategy

deployment strategy

rollback
```

---

Adicionar:

```text
INFRAQ-012
```

Pergunta:

```text
Será necessário ambiente STAGING permanente?
```

Priority:

```text
MEDIUM
```

---

Adicionar:

```text
INFRAQ-013
```

Pergunta:

```text
Qual política de retenção dos arquivos e exports armazenados no object storage?
```

Priority:

```text
HIGH
```

Relacionado a:

```text
ROPAQ-005
INFRAQ-013
```

---

# 165. Acceptance Criteria

Este documento é considerado aplicado quando:

```text
[ ] ambientes estão separados

[ ] configuração é externa ao código

[ ] secrets não estão no Git

[ ] environment validation existe

[ ] PostgreSQL usa migrations

[ ] test database é isolado

[ ] object storage é privado

[ ] uploads não dependem de filesystem local permanente

[ ] CI executa validações

[ ] artifacts são identificáveis

[ ] deploy é rastreável

[ ] health checks existem

[ ] logs são estruturados

[ ] backup está definido antes de produção

[ ] restore foi testado antes de depender operacionalmente do backup

[ ] rollback foi considerado

[ ] tenant isolation existe em jobs/cache/storage

[ ] produção utiliza HTTPS
```

---

# 166. Definition of Done

```text
[ ] ambiente local documentado

[ ] TEST documentado

[ ] STAGING decidido

[ ] PRODUCTION definido

[ ] Docker configurado conforme necessidade

[ ] .env.example atualizado

[ ] environment validation implementada

[ ] database migrations integradas ao deploy

[ ] seed strategy definida

[ ] object storage configurado

[ ] Redis usado somente se necessário

[ ] CI configurada

[ ] CD definido

[ ] secrets management definido

[ ] health/readiness definidos

[ ] logging definido

[ ] observability definida

[ ] backup definido

[ ] restore procedure definida

[ ] rollback definido

[ ] RPO/RTO decididos

[ ] security review concluído
```

---

# 167. Regra final

A infraestrutura deve crescer conforme necessidade real.

Fluxo preferido:

```text
Simple
↓
Measured
↓
Problem Identified
↓
Decision
↓
Scale
```

e não:

```text
Possible Future Scale
↓
Complex Infrastructure Today
```

O objetivo da V1 é possuir uma infraestrutura:

```text
segura

reproduzível

observável

recuperável

simples de operar
```

sem introduzir complexidade distribuída prematuramente.

---

# 168. Próximo documento

O próximo documento recomendado é:

```text
docs/18-OBSERVABILITY.md
```

Ele deve detalhar especificamente:

```text
application logs

request correlation

metrics

error tracking

health checks

readiness

audit boundaries

alerting

dashboards técnicos

job monitoring

database monitoring

security logging

PII/log sanitization

incident diagnostics
```

Esse documento separa observabilidade operacional de `AuditLog` e do Dashboard funcional da plataforma.