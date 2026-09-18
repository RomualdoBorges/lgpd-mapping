# LGPD Data Mapping Platform

## Slice 1: execução local

Foundation mínima: React/Vite, NestJS, PostgreSQL e Drizzle. Não contém autenticação, schema funcional, autorização ou RLS. `GET /health` confirma que o processo da API está ativo; não representa uma política definitiva de readiness. A API verifica a conexão PostgreSQL na inicialização.

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

| Variável                                     | Uso                                                   |
| -------------------------------------------- | ----------------------------------------------------- |
| `API_HOST`, `API_PORT`                       | Endereço e porta da API                               |
| `DB_HOST`, `DB_PORT`, `DB_NAME`              | PostgreSQL local; porta publicada somente em loopback |
| `DB_ADMIN_PASSWORD`                          | Inicialização do container; não utilizada pela API    |
| `DB_RUNTIME_USER`, `DB_RUNTIME_PASSWORD`     | Conexão da aplicação                                  |
| `DB_MIGRATION_USER`, `DB_MIGRATION_PASSWORD` | Conexão do Drizzle Kit/migrations                     |

Configuração obrigatória ausente ou inválida encerra a API com código 1 e mensagem que identifica a variável, sem imprimir seu valor. Erros de conexão também produzem mensagem segura.

### Banco e migrations

Compose define explicitamente o projeto `lgpd`, usa PostgreSQL 17.11 Alpine e volume persistente próprio. Não utiliza imagens ou recursos de outros projetos. O init cria roles distintas: runtime sem superuser, BYPASSRLS, criação de roles ou criação no schema `public`; migrator com permissão de criação nesse schema. A API não utiliza a credencial administrativa ou de migration. Não existem tabelas funcionais nem policies RLS.

`pnpm db:check` verifica as duas conexões e seus privilégios. O diretório `apps/api/drizzle/migrations/` está preparado, sem migrations de negócio. `drizzle.config.ts` utiliza somente a configuração de migration. Os comandos `pnpm --filter @lgpd/api db:generate` e `db:migrate` estão preparados para slices futuros; não precisam ser executados neste slice.

O init roda somente em um volume vazio. Alterar credenciais no `.env` não altera roles já existentes. `pnpm db:down` para o container sem apagar o volume. Não remover volumes que contenham dados a preservar.

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

`pnpm smoke` requer build, `.env` e PostgreSQL iniciado. Usa checks técnicos em Node.js, sem escolher runner backend para `TESTQ-011`. Inicia e encerra processos próprios nas portas 43117/43118; verifica health, entrega do frontend, ausência de rota funcional e falhas por variável ausente, porta inválida e credencial incorreta, sem exposição do secret utilizado no check.

`pnpm format` formata somente arquivos deste bootstrap. Nenhuma plataforma de CI foi configurada. Os testes tenant-aware de DEC-046 pertencem aos slices seguintes e não são declarados executados aqui.

### Estado da validação deste slice

A validação oficial do PostgreSQL 17.11 definido neste Compose foi **CONCLUÍDA** no ambiente independente LGPD: container `lgpd-postgres-1`, network `lgpd_default`, volume `lgpd_postgres_data` e porta `127.0.0.1:5432`. `pnpm db:check` e `pnpm smoke` passaram nesse ambiente. O diagnóstico anterior com PostgreSQL reaproveitado não compõe essa validação e não é dependência do projeto.

`pnpm smoke:local` executa somente os checks independentes de PostgreSQL: configuração obrigatória ausente, porta inválida, ausência de exposição de secrets e entrega do frontend. Não declara conectividade ao banco ou readiness.
