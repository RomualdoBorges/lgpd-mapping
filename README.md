# LGPD Data Mapping Platform

## Execução local — Foundation Slices 1 e 2

Foundation mínima: React/Vite, NestJS, PostgreSQL e Drizzle. Contém schema estrutural de Identity/Tenant, constraints compostas e RLS tenant-level. Não contém autenticação, autorização funcional ou features de negócio. `GET /health` confirma que o processo da API está ativo; não representa uma política definitiva de readiness. A API verifica a conexão PostgreSQL na inicialização.

### Pré-requisitos

- Node.js 22.22.3 (consulte `.nvmrc`).
- pnpm 11.7.0.
- Docker com Compose e permissão para acessar o daemon.

### Instalação e execução

```sh
pnpm install --frozen-lockfile
cp .env.example .env
pnpm db:up
pnpm build
pnpm db:check
```

Em terminais separados:

```sh
pnpm dev:api
pnpm dev:web
```

Frontend: <http://127.0.0.1:5173>. Health da API: <http://127.0.0.1:3000/health>. Para executar a API compilada: `pnpm --filter @lgpd/api start`.

### Ambiente

`.env` é ignorado pelo Git. O exemplo contém somente credenciais fictícias locais. Não utilizar esses valores em ambientes compartilhados ou de produção. Os scripts da API leem o `.env` da raiz; o frontend não recebe credenciais de banco.

| Variável                                     | Uso                                                                         |
| -------------------------------------------- | --------------------------------------------------------------------------- |
| `API_HOST`, `API_PORT`                       | Endereço e porta da API                                                     |
| `DB_HOST`, `DB_PORT`, `DB_NAME`              | PostgreSQL local; porta publicada somente em loopback                       |
| `DB_ADMIN_PASSWORD`                          | Inicialização e provisionamento de bancos de testes; não utilizada pela API |
| `DB_RUNTIME_USER`, `DB_RUNTIME_PASSWORD`     | Conexão da aplicação                                                        |
| `DB_MIGRATION_USER`, `DB_MIGRATION_PASSWORD` | Conexão das migrations                                                      |

Configuração obrigatória ausente ou inválida encerra a API com código 1 e mensagem que identifica a variável, sem imprimir seu valor. Erros de conexão também produzem mensagem segura.

### Banco e migrations

Compose define explicitamente o projeto `lgpd`, usa PostgreSQL 17.11 Alpine e volume persistente próprio. Não utiliza imagens ou recursos de outros projetos. O init cria roles distintas: runtime sem superuser, BYPASSRLS, criação de roles ou criação no schema `public`; migrator com permissão de criação nesse schema e CREATE apenas no database LGPD provisionado. A API não utiliza a credencial administrativa ou de migration. As migrations do Slice 2 criam somente tabelas estruturais e policies tenant-level. Não existem tabelas de features de negócio.

`pnpm db:check` verifica as duas conexões e seus privilégios. O diretório `apps/api/drizzle/migrations/` contém migrations estruturais versionadas, geradas pelo Drizzle Kit, e uma migration SQL explícita de RLS/grants. `drizzle.config.ts` utiliza somente a configuração de migration. Para aplicar o schema estrutural no banco local LGPD, execute `pnpm --filter @lgpd/api db:migrate`. Esse entry point fornece o nome validado da role runtime à migration em uma conexão exclusiva de migration; não configura tenant globalmente. Não use `drizzle-kit migrate` diretamente, pois a migration de grants exige essa configuração. Geração: `pnpm --filter @lgpd/api db:generate`.

O entry point usa o `migrate()` oficial de `drizzle-orm/node-postgres/migrator`, com `migrationsSchema: "public"` e `migrationsTable: "__drizzle_migrations"`. Drizzle cria o journal, identifica migrations pendentes, executa SQL e registra aplicações. Não há runner próprio ou comparação histórica de checksums.

A conexão exclusiva de migration adquire advisory lock de sessão antes de chamar o migrator, cobrindo CREATE SCHEMA/journal, leitura do histórico e transação oficial. A conexão é descartada no `finally`; seu encerramento libera o lock tanto em sucesso quanto em erro. Todos os executores devem usar esse entry point para compartilhar a coordenação. A configuração auxiliar `lgpd.migration_runtime_role` existe apenas nessa sessão de migration; nunca configura tenant globalmente.

Somente `lgpd_migrator` recebe CREATE no database LGPD correspondente para o bootstrap oficial. Isso não concede CREATEDB, SUPERUSER, BYPASSRLS ou CREATEROLE. Runtime permanece sem CREATE no database/schema e sem acesso ao journal. A aplicação não executa migrations na inicialização. User e Role globais continuam sem grants runtime neste slice. Role global, sem organization_id e com código único/estável, foi aprovado em DEC-049; catálogo definitivo e permissions continuam pendentes.

O init roda somente em um volume vazio. Para o volume LGPD já existente, o grant CREATE aprovado foi aplicado exclusivamente a `lgpd_migrator` no database configurado, sem alterar runtime. Alterar credenciais no `.env` não altera roles já existentes. `pnpm db:down` para o container sem apagar o volume. Não remover volumes que contenham dados a preservar.

### Provisionamento da persistência global de autenticação

A S3.1 separa três responsabilidades:

```text
administrative provisioning != migration != runtime
```

Em volume novo, `infra/postgres/init.sh` cria a role NOLOGIN `lgpd_auth_persistence`. A migration `0002_auth_persistence.sql` cria somente tabelas, FKs, constraints e índices.

Depois da migration, o script versionado `infra/postgres/provision-auth-persistence.sql` deve ser executado com `lgpd_admin` no database LGPD. Ele recebe os nomes validados das roles runtime e migration por settings da sessão, valida a role dedicada, confirma que runtime e migrator não são membros dela e configura `auth_private`, functions, ownership e grants.

O script falha se a role estiver ausente ou com propriedades divergentes. Ele não cria ou altera roles.

Runtime não recebe DML direto em `external_identities`, `sessions` ou `users`. Recebe somente USAGE em `auth_private` e EXECUTE individual nos quatro primitives da DEC-057.

Os testes de integração reproduzem essa ordem usando exclusivamente um database PostgreSQL de teste do projeto LGPD.

### Bootstrap restrito de Membership

A S3.2 implementa a fundação PostgreSQL das DEC-052 e DEC-056 sem criar migration estrutural adicional. Em volume novo, `infra/postgres/init.sh` cria a role NOLOGIN `lgpd_membership_bootstrap`. Depois das migrations e do provisionamento da S3.1, `infra/postgres/provision-membership-bootstrap.sql` é executado administrativamente: valida as roles e o estado de RLS, restringe `tenant_isolation` ao runtime, cria `membership_bootstrap_select` exclusivamente para a role dedicada e configura `auth_private.resolve_membership(authenticated_user_id, requested_organization_id)`.

A primitive retorna somente `membershipId` e `organizationId` para a Membership ativa do par exato User + Organization, ou ausência. `memberships` permanece com ENABLE/FORCE RLS. A role dedicada recebe apenas SELECT nas colunas necessárias de `memberships`, não acessa `users`, `organizations`, `external_identities` ou `sessions` e não é concedida ao runtime ou migrator. A function é criada sob `SET LOCAL ROLE`, com CREATE temporário e transacional em `auth_private`; ao final, PUBLIC não possui EXECUTE, runtime possui somente o EXECUTE específico e a role dedicada não conserva CREATE no schema.

O repository chama exclusivamente essa primitive. Os 28 cenários da DEC-056 passaram em PostgreSQL real, com as regressões de DEC-045/046 e DEC-057 preservadas. O estado validado possui 10 testes unitários e 52 testes de integração. Esta etapa ainda não implementa autenticação HTTP, resolução de Session no request, extração do User autenticado, `X-Organization-Id` no pipeline HTTP, AuthenticatedContext completo, autorização por RoleAssignment/BusinessUnit, OIDC ou frontend de autenticação.

### Verificações

```sh
pnpm lint
pnpm format:check
pnpm typecheck
pnpm build
pnpm db:check
pnpm smoke:local
# Após iniciar exclusivamente o PostgreSQL deste Compose:
pnpm smoke
```

`pnpm smoke` requer build, `.env` e PostgreSQL iniciado. Usa checks técnicos em Node.js, independentes do runner Vitest aprovado em DEC-047. Inicia e encerra processos próprios nas portas 43117/43118; verifica health, entrega do frontend, ausência de rota funcional e falhas por variável ausente, porta inválida e credencial incorreta, sem exposição do secret utilizado no check.

`pnpm format` formata somente arquivos deste bootstrap. Nenhuma plataforma de CI foi configurada. Os testes tenant-aware do Slice 2 estão descritos abaixo; smoke permanece uma verificação técnica separada.

### Estado da validação deste slice

A validação oficial do PostgreSQL 17.11 definido neste Compose foi **CONCLUÍDA** no ambiente independente LGPD: container `lgpd-postgres-1`, network `lgpd_default`, volume `lgpd_postgres_data` e porta `127.0.0.1:5432`. `pnpm db:check` e `pnpm smoke` passaram nesse ambiente. O diagnóstico anterior com PostgreSQL reaproveitado não compõe essa validação e não é dependência do projeto.

`pnpm smoke:local` executa somente os checks independentes de PostgreSQL: configuração obrigatória ausente, porta inválida, ausência de exposição de secrets e entrega do frontend. Não declara conectividade ao banco ou readiness.

## Slice 2: persistência tenant-aware e testes

Schema: `organizations`, `business_units`, `users`, `memberships`, `roles`, `role_assignments` e a associação auxiliar `role_assignment_business_units`. UUIDs e timestamps com timezone; FKs sem delete em cascata. Unicidade de Membership por User/Organization e FKs compostas preservam tenant e scope da concessão. Não há matriz de permissões, hierarquia, unicidade de nome de área, soft delete ou união de identidades por e-mail.

`DatabaseService.withTenant` recebe uma Organization previamente autorizada pelo chamador e fornece a transação Drizzle à operação. `set_config(..., true)` mantém o contexto local à transação; todas as consultas da operação devem usar a transação recebida. O boundary não autentica nem verifica Membership/Permission/Scope. Ausência de contexto nega leitura/escrita tenant-bound. RLS e FORCE RLS aplicam-se à Organization e às tabelas tenant-bound; User/Role globais não recebem grant runtime neste slice.

```sh
pnpm test:unit
pnpm test:integration
```

Vitest tem projetos separados em ambiente Node. A suite de integração compila o backend com `tsc` para verificar DI/decorator metadata real do NestJS, além de testar o boundary Drizzle. Não há runner E2E/browser.

A integração requer exclusivamente o PostgreSQL LGPD iniciado pelo Compose oficial, disponível em loopback, e as credenciais do `.env`. Cria um banco vazio `lgpd_test_<UUID>` por execução, com privilégios equivalentes aos locais (migrator tem CREATE no database exclusivo e USAGE/CREATE em `public`; runtime não tem CREATE), aplica as migrations reais e usa runtime restrito nas operações de RLS. A credencial administrativa serve apenas ao provisionamento/remoção do banco exclusivo, sem conceder CREATEDB ao runtime ou migrator.

Antes de limpar dados, a infraestrutura confere o nome exato da execução, o marcador do banco no catálogo PostgreSQL e o banco conectado. A limpeza usa uma lista explícita de tabelas, sem CASCADE. Ao terminar, fecha os pools e remove apenas o banco marcado desta execução. Nunca limpa o banco local de desenvolvimento. Integração serial, com commits/rollbacks reais; fixtures são fictícios e exclusivos de teste. Não há rollback externo envolvendo a suite. Recriação de schema/banco em suites estruturais futuras continua regida por DEC-048.

Os testes verificam os dez cenários obrigatórios de isolamento/integridade, migrations em banco vazio/reaplicação, Memberships independentes de um User global, BusinessUnit vinculada a Organization, múltiplas áreas por concessão e scopes ORGANIZATION/BUSINESS_UNIT. Os testes de pool verificam o mesmo PID PostgreSQL antes de encerrar o pool.

TESTQ-001 permanece OPEN: nenhuma ferramenta de provisionamento para CI, Testcontainers, fornecedor de CI, cobertura ou paralelização futura foi escolhida.

### Regressões auditadas do Slice 2

UPDATE/DELETE combinam controles positivos em BusinessUnits específicas de A com as assertions negativas sobre B, usando runtime restrito. O bootstrap vazio executa dois processos Node independentes no entry point real. Gates SQL apenas no banco exclusivo permitem observar ambos esperando o advisory lock; depois, um executor possui o lock e espera no bootstrap do journal, enquanto o outro continua esperando o advisory lock. A liberação do gate permite sucesso de ambos e exatamente os três registros esperados no journal. Não há hooks de produção nem sleeps usados como prova de disputa; polling limitado consulta pg_stat_activity/pg_locks.

O caminho de erro usa sessão de migration read-only, sem alterar migrations: o bootstrap oficial falha após o lock, a sessão é encerrada e outro migrator adquire o lock/aplica normalmente.

O cleanup tenta encerrar todos os pools e sempre encerra o administrativo, inclusive se algum encerramento falhar. Em falha de pool, não tenta DROP. CREATE DATABASE e seu comentário não podem ser atômicos na mesma transação: se a gravação do marcador falhar, a proteção recusa DROP e preserva o banco residual para inspeção humana. Nenhuma proteção destrutiva é relaxada.
