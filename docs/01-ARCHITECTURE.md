# Arquitetura da Aplicação

> **Documento:** Arquitetura técnica  
> **Status:** Draft  
> **Projeto:** LGPD Data Mapping Platform  
> **Documento relacionado:** `00-PROJECT.md`


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

Seções de proposta legadas deste documento devem ser interpretadas sob estas decisões: não constituem aprovação de permissões de escrita, scopes adicionais, fornecedor, topologia do banco ou herança hierárquica. RLS foi aprovado posteriormente em DEC-046. Questões decididas continuam referenciadas para rastreabilidade; pendências parciais estão identificadas no registro central.


## Persistência e defesa tenant-aware aprovadas — 2026-09-18

DEC-044 (DBQ-001): Drizzle é o ORM/query builder aprovado. Queries ficam em repository/persistence; SQL específico é parametrizado, localizado e versionado. Migrations são revisáveis e reproduzíveis desde banco vazio. Não reduzir garantias PostgreSQL para acomodar o ORM.

DEC-045 (DBQ-008): validar relações/autorização na aplicação e garantir coerência tenant-bound por constraints PostgreSQL. Quando necessário, filhos e associações carregam organization_id NOT NULL, unicidades/FKs compostas e índices adequados; usar checks declarativos quando aplicáveis. FK somente por UUID não prova mesmo tenant. organization_id vem do contexto autorizado e não é campo livre para transferência. Preferir constraint declarativa simples a trigger equivalente.

DEC-046 (DBQ-009): RLS adicional nas tabelas tenant-bound, com contexto local à transação, todas as queries da operação no mesmo contexto, ausência de contexto negando acesso e nenhum tenant persistente na conexão. Considerar pooling. Runtime sem superuser/BYPASSRLS/propriedade das tabelas protegidas/alteração de policies; FORCE ROW LEVEL SECURITY quando adequado. Credencial de migration separada do runtime.

Defesa aprovada: Authentication → Membership → Permission → Scope → Repository tenant-aware → PostgreSQL constraints → PostgreSQL RLS. Nenhuma camada substitui outra. Scope de Business Unit continua na autorização da aplicação.

User, ExternalIdentity, Session e outras entidades globais não recebem organization_id artificial; sua proteção específica será definida posteriormente. Descoberta dos próprios Memberships exige caminho restrito, sem policy irrestrita. Estes detalhes não estão implementados nem decididos por exemplos deste documento.

Referências legadas a Prisma/Drizzle ou a RLS como alternativas pendentes são históricas: estas três questões estão decididas em DEC-044 a DEC-046. Políticas funcionais, autenticação e features posteriores continuam sujeitas às questões específicas. A topologia física de produção não é escolhida por este registro.

---

---


---

## 1. Objetivo

Este documento define a arquitetura técnica inicial da plataforma de mapeamento de dados pessoais.

A arquitetura deve suportar:

- múltiplas organizações;
- múltiplas áreas por organização;
- usuários com diferentes permissões;
- wizard de mapeamento;
- atividades de tratamento;
- sistemas e fornecedores;
- compliance gate;
- versionamento;
- auditoria;
- ROPA;
- dashboard;
- armazenamento de documentos;
- futuras integrações externas.

A prioridade inicial é manter a solução simples, modular e evolutiva.

---

## 2. Estilo arquitetural

A aplicação deve iniciar como um:

**Monólito Modular**

Isso significa que haverá uma única aplicação backend implantável, porém internamente organizada em módulos independentes de domínio.

```text
                    ┌───────────────────────┐
                    │       Frontend        │
                    │                       │
                    │   React + TypeScript  │
                    └───────────┬───────────┘
                                │
                              HTTPS
                                │
                    ┌───────────▼───────────┐
                    │        Backend        │
                    │                       │
                    │   Monólito Modular    │
                    │                       │
                    │  Auth                 │
                    │  Organizations        │
                    │  Users                │
                    │  Mapping              │
                    │  Compliance           │
                    │  ROPA                 │
                    │  Systems              │
                    │  Suppliers            │
                    │  Documents            │
                    │  Audit                │
                    │  Notifications        │
                    └───────────┬───────────┘
                                │
             ┌──────────────────┼──────────────────┐
             │                  │                  │
             ▼                  ▼                  ▼
        PostgreSQL         Object Storage      Redis/Queue
                              S3/MinIO
```

Não devem ser utilizados microserviços na primeira versão sem uma necessidade técnica concreta.

---

## 3. Princípios arquiteturais

### ARCH-001 — Separação por domínio

O backend deve ser dividido por módulos funcionais.

Exemplo:

```text
modules/
├── auth/
├── organizations/
├── users/
├── business-units/
├── processing-activities/
├── data-mapping/
├── systems/
├── suppliers/
├── legal-bases/
├── compliance/
├── ropa/
├── documents/
├── audit/
└── notifications/
```

Cada módulo deve possuir responsabilidades claramente definidas.

---

### ARCH-002 — Backend como fonte de verdade

O frontend não deve ser responsável por garantir regras críticas.

Devem ser validados pelo backend:

- autorização;
- isolamento entre organizações;
- transições de estado;
- compliance gate;
- regras de versionamento;
- integridade das atividades;
- regras de negócio.

O frontend pode repetir validações para melhorar UX, mas elas não substituem as validações do backend.

---

### ARCH-003 — Baixo acoplamento

Um módulo não deve acessar diretamente detalhes internos de outro módulo.

A comunicação deve ocorrer através de:

- serviços públicos;
- interfaces;
- casos de uso;
- eventos internos quando apropriado.

Evitar dependências circulares.

---

### ARCH-004 — Regras de negócio fora dos controllers

Controllers devem ser responsáveis principalmente por:

1. receber requisição;
2. validar entrada;
3. identificar usuário/contexto;
4. chamar o caso de uso;
5. retornar resposta.

Não devem conter regras complexas de negócio.

---

### ARCH-005 — Independência da interface

Regras de negócio não devem depender de React, HTTP ou componentes de interface.

Uma regra como:

> "Uma atividade não pode ficar ACTIVE sem Compliance Gate completo."

deve existir no backend independentemente da tela que iniciou a operação.

---

## 4. Arquitetura frontend

Stack sugerida:

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

### Responsabilidades

#### TanStack Query

Utilizar para estado vindo do servidor:

- atividades;
- organizações;
- usuários;
- sistemas;
- fornecedores;
- ROPA;
- dashboard;
- configurações.

#### Zustand

Utilizar apenas quando houver necessidade de estado global de interface.

Exemplos:

- contexto visual;
- estado temporário do wizard;
- preferências locais.

Não duplicar dados da API dentro do Zustand sem necessidade.

#### React Hook Form

Utilizar para formulários e etapas do wizard.

#### Zod

Utilizar para validação de schemas no frontend.

---

## 5. Organização frontend

Estrutura inicial sugerida:

```text
src/
├── app/
│   ├── router/
│   ├── providers/
│   └── layouts/
│
├── features/
│   ├── auth/
│   ├── organizations/
│   ├── users/
│   ├── processing-activities/
│   ├── mapping-wizard/
│   ├── systems/
│   ├── suppliers/
│   ├── compliance/
│   ├── ropa/
│   └── dashboard/
│
├── components/
│   └── ui/
│
├── hooks/
├── lib/
├── services/
├── types/
└── utils/
```

Código específico de uma feature deve permanecer dentro da própria feature sempre que possível.

Exemplo:

```text
features/
└── processing-activities/
    ├── api/
    ├── components/
    ├── hooks/
    ├── schemas/
    ├── types/
    └── pages/
```

---

## 6. Arquitetura backend

Stack sugerida:

```text
Node.js
TypeScript
NestJS
PostgreSQL
Drizzle ORM
Redis
BullMQ
S3/MinIO
```

Drizzle foi aprovado em DEC-044; DBQ-001 está DECIDED.

---

## 7. Camadas do backend

Cada módulo pode seguir aproximadamente:

```text
module/
├── domain/
├── application/
├── infrastructure/
└── presentation/
```

### Domain

Contém conceitos e regras centrais do domínio.

Exemplos:

```text
ProcessingActivity
ComplianceStatus
ActivityStatus
RetentionPolicy
LegalBasis
```

Não deve depender de:

- HTTP;
- controllers;
- ORM;
- banco de dados;
- framework de interface.

---

### Application

Contém casos de uso.

Exemplos:

```text
CreateProcessingActivity
UpdateProcessingActivity
SubmitActivityForReview
RunComplianceGate
ActivateProcessingActivity
ArchiveProcessingActivity
```

É responsável por coordenar:

- entidades;
- repositórios;
- políticas;
- autorização contextual;
- eventos.

---

### Infrastructure

Contém implementações técnicas.

Exemplos:

```text
PostgreSQL repositories
S3 storage
Redis
BullMQ
e-mail provider
ORM
```

---

### Presentation

Contém interfaces externas.

Inicialmente:

```text
REST Controllers
DTOs
Request validation
Response serialization
```

---

## 8. Organização backend

Estrutura sugerida:

```text
src/
├── modules/
│   ├── auth/
│   ├── organizations/
│   ├── users/
│   ├── business-units/
│   ├── processing-activities/
│   ├── data-mapping/
│   ├── systems/
│   ├── suppliers/
│   ├── legal-bases/
│   ├── compliance/
│   ├── ropa/
│   ├── documents/
│   ├── audit/
│   └── notifications/
│
├── shared/
│   ├── database/
│   ├── storage/
│   ├── queue/
│   ├── auth/
│   ├── errors/
│   └── utils/
│
└── main.ts
```

`shared/` não deve se transformar em um local genérico para regras de negócio.

Regras específicas devem permanecer dentro dos respectivos módulos.

---

## 9. Banco de dados

Banco recomendado:

```text
PostgreSQL
```

Motivos:

- domínio altamente relacional;
- necessidade de integridade referencial;
- relacionamentos entre atividades, áreas, sistemas e fornecedores;
- consultas consolidadas para ROPA;
- histórico/versionamento;
- auditoria;
- suporte maduro a transações.

O modelo detalhado será definido em:

`03-DATABASE.md`

---

## 10. Identificadores

Entidades expostas externamente devem utilizar identificadores não sequenciais.

Sugestão:

```text
UUID
```

Exemplo:

```text
processing_activity.id = UUID
organization.id = UUID
supplier.id = UUID
system.id = UUID
```

IDs sequenciais internos podem existir caso exista justificativa técnica, mas não devem ser utilizados como mecanismo de autorização.

---

## 11. Multi-tenancy

A aplicação deve ser preparada para atender múltiplas organizações.

Modelo inicial recomendado:

```text
Organization
     │
     ├── Users
     ├── BusinessUnits
     ├── ProcessingActivities
     ├── Systems
     └── Suppliers
```

Entidades pertencentes a um cliente devem possuir associação explícita com a organização.

Exemplo:

```text
ProcessingActivity
    organizationId
```

---

## 12. Isolamento entre organizações

O isolamento entre organizações é requisito crítico.

Uma requisição autenticada deve possuir contexto semelhante a:

```text
AuthenticatedUser
├── userId
├── organizationId
├── roles
└── permissions
```

Consultas devem considerar o contexto da organização.

Exemplo conceitual:

```text
findProcessingActivity({
    id,
    organizationId
})
```

Evitar:

```text
findProcessingActivity({
    id
})
```

quando a entidade for isolada por organização.

---

## 13. Autenticação

A arquitetura deve permitir inicialmente autenticação tradicional ou integração com provedor externo.

Também deve ser preparada para SSO corporativo.

Possíveis provedores futuros:

```text
Microsoft Entra ID
Google Workspace
OIDC
SAML
```

A decisão de implementação da V1 deve ser registrada nas dúvidas técnicas.

---

## 14. Autorização

Autenticação responde:

> Quem é o usuário?

Autorização responde:

> O que esse usuário pode fazer?

A autorização deve considerar:

```text
usuário
+
organização
+
papel
+
área
+
operação solicitada
```

Exemplo:

```text
Colaborador RH
    ↓
pode editar atividade do RH
    ↓
não pode editar atividade do Financeiro
```

O modelo completo será definido em:

`04-AUTHORIZATION.md`

---

## 15. API

A comunicação inicial entre frontend e backend deve utilizar:

```text
REST + JSON
```

Exemplo:

```text
/api/v1/processing-activities
/api/v1/systems
/api/v1/suppliers
/api/v1/ropa
```

A API deve ser versionada.

Detalhes serão definidos em:

`07-API.md`

---

## 16. Wizard

O wizard não deve existir apenas como estado temporário do navegador.

O progresso deve poder ser persistido.

Exemplo:

```text
ProcessingActivity
status = DRAFT
```

O usuário poderá:

```text
iniciar
↓
preencher parcialmente
↓
salvar
↓
sair
↓
retornar posteriormente
↓
continuar
```

A API deve permitir atualização parcial das etapas.

---

## 17. Compliance Gate

O Compliance Gate deve ser implementado como componente de domínio/aplicação independente da interface.

Exemplo conceitual:

```text
ComplianceGate
    │
    ├── LegalBasisCheck
    ├── RetentionCheck
    ├── SecurityMeasuresCheck
    ├── InternationalTransferCheck
    └── SensitiveDataCheck
```

Cada verificação deve produzir um resultado estruturado.

Exemplo:

```json
{
  "check": "LEGAL_BASIS",
  "status": "PASS"
}
```

ou:

```json
{
  "check": "RETENTION",
  "status": "FAIL",
  "reason": "RETENTION_POLICY_NOT_DEFINED"
}
```

Isso permite adicionar novos checks futuramente sem transformar o gate em um conjunto grande de condicionais espalhadas pelo sistema.

---

## 18. ROPA

O ROPA deve ser uma projeção das atividades existentes.

Não criar fluxo independente para cadastrar manualmente as mesmas informações.

Conceitualmente:

```text
ProcessingActivities
        +
LegalBasis
        +
DataCategories
        +
Subjects
        +
Recipients
        +
Retention
        +
Transfers
        +
Compliance
        ↓
       ROPA
```

A estratégia de implementação pode começar com consultas relacionais e evoluir para projeções/materialized views caso existam necessidades de performance.

Não otimizar antecipadamente.

---

## 19. Versionamento das atividades

Atividades relevantes precisam preservar histórico.

Modelo conceitual:

```text
ProcessingActivity
       │
       ├── versão atual
       │
       └── ActivityVersion
              ├── v1
              ├── v2
              └── v3
```

O mecanismo exato de armazenamento será definido em `03-DATABASE.md` e `10-AUDIT.md`.

---

## 20. Auditoria

Eventos relevantes devem gerar registros de auditoria.

Exemplos:

```text
ACTIVITY_CREATED
ACTIVITY_UPDATED
ACTIVITY_SUBMITTED
ACTIVITY_ACTIVATED
ACTIVITY_ARCHIVED

LEGAL_BASIS_CHANGED

SUPPLIER_CREATED
SYSTEM_CREATED

COMPLIANCE_GATE_EXECUTED
```

Um registro deve permitir identificar:

```text
actor
organization
action
entity
entityId
timestamp
metadata
```

Detalhes serão definidos em:

`10-AUDIT.md`

---

## 21. Arquivos

Documentos enviados pelos usuários não devem ser armazenados diretamente como blobs no banco relacional.

Arquitetura:

```text
Frontend
    ↓
Backend
    ↓
Object Storage
```

Sugestões:

```text
AWS S3
MinIO
ou serviço compatível com S3
```

O banco mantém:

```text
id
organizationId
storageKey
originalName
mimeType
size
createdBy
createdAt
```

---

## 22. Upload seguro

O backend deve validar:

- tamanho;
- MIME type permitido;
- extensão;
- organização proprietária;
- usuário responsável.

A necessidade de antivírus/malware scanning deve ser definida antes de disponibilizar uploads em produção.

---

## 23. Processamento assíncrono

Redis/BullMQ somente deve ser utilizado para tarefas que realmente se beneficiem de processamento assíncrono.

Exemplos futuros:

```text
geração de relatório pesado
envio de notificações
processamento de exportações
integrações externas
```

Não utilizar filas para operações simples que podem ser executadas sincronamente.

---

## 24. Notificações

A arquitetura deve permitir futuramente:

```text
notificação interna
e-mail
```

Eventos do domínio podem originar notificações.

Exemplo:

```text
ActivityPendingTooLong
        ↓
NotificationHandler
        ↓
E-mail / notificação interna
```

O mecanismo exato não faz parte da arquitetura mínima da primeira implementação.

---

## 25. Erros

O backend deve possuir estrutura padronizada de erros.

Exemplo:

```json
{
  "error": {
    "code": "PROCESSING_ACTIVITY_NOT_FOUND",
    "message": "Atividade de tratamento não encontrada."
  }
}
```

Não utilizar textos da interface como identificadores de erro.

Utilizar códigos estáveis.

---

## 26. Observabilidade

A aplicação deve produzir logs estruturados.

Logs devem permitir identificar, quando aplicável:

```text
timestamp
requestId
userId
organizationId
module
operation
error
```

Nunca registrar dados pessoais sensíveis desnecessariamente nos logs.

---

## 27. Configuração

Configurações sensíveis devem vir de variáveis de ambiente ou mecanismo equivalente.

Exemplos:

```text
DATABASE_URL
REDIS_URL
S3_ENDPOINT
S3_BUCKET
AUTH_SECRET
```

Credenciais nunca devem ser armazenadas no código-fonte.

---

## 28. Ambientes

A arquitetura deve prever pelo menos:

```text
development
staging
production
```

Cada ambiente deve possuir recursos e configurações independentes.

---

## 29. Containers

A aplicação deve ser compatível com Docker.

Ambiente local sugerido:

```text
docker compose

├── frontend
├── backend
├── postgres
├── redis
└── minio
```

Serviços opcionais não precisam ser executados caso ainda não sejam utilizados pela versão atual.

---

## 30. Testabilidade

A arquitetura deve favorecer testes das regras sem necessidade de subir toda a aplicação.

Prioridade:

```text
Domain
    ↓
Application
    ↓
Integration
    ↓
API
    ↓
E2E
```

Regras críticas como o Compliance Gate devem possuir testes automatizados independentes da interface.

---

## 31. Dependências externas

Toda nova dependência deve possuir justificativa técnica.

Antes de adicionar uma biblioteca, verificar:

1. se o projeto já possui solução equivalente;
2. se a funcionalidade pode ser implementada de maneira simples;
3. manutenção do pacote;
4. impacto de segurança;
5. impacto no bundle/runtime;
6. licença.

Agentes de IA não devem adicionar dependências apenas por conveniência.

---

## 32. Decisões que ainda precisam ser tomadas

As seguintes decisões não devem ser assumidas silenciosamente:

- Drizzle (DEC-044);
- estratégia de autenticação da V1;
- necessidade de SSO já na V1;
- provedor de object storage em produção;
- Redis/BullMQ já na V1 ou somente quando necessário;
- estratégia exata de versionamento;
- estratégia de soft delete;
- formato de deployment;
- provedor de infraestrutura;
- necessidade de antivírus para uploads;
- política de backup;
- política de retenção dos logs;
- estratégia de recuperação de desastre.

Essas questões devem ser registradas em:

`12-OPEN-QUESTIONS.md`

---

## 33. Restrições para agentes de IA

Ao implementar funcionalidades neste projeto:

### Não fazer

- criar microserviços sem decisão arquitetural;
- colocar regras de negócio em controllers;
- confiar apenas em validações do frontend;
- consultar entidades multi-tenant sem considerar a organização;
- criar acesso direto entre módulos sem necessidade;
- adicionar dependências sem justificativa;
- armazenar arquivos como blobs no PostgreSQL sem decisão explícita;
- inventar regras jurídicas;
- inventar permissões;
- alterar estados do workflow sem consultar a especificação;
- criar abstrações genéricas antes de existir necessidade concreta.

### Fazer

- seguir os módulos definidos;
- manter regras no domínio/aplicação;
- validar autorização no backend;
- preservar isolamento entre organizações;
- criar testes para regras críticas;
- utilizar erros estruturados;
- manter código específico dentro da feature/módulo correspondente;
- atualizar documentação quando uma decisão arquitetural mudar.

---

## 34. Arquitetura alvo inicial

Resumo:

```text
┌───────────────────────────────────────────────┐
│                   Browser                     │
└───────────────────────┬───────────────────────┘
                        │ HTTPS
                        ▼
┌───────────────────────────────────────────────┐
│                 React Frontend                 │
│                                               │
│ React                                         │
│ TypeScript                                    │
│ TanStack Query                                │
│ React Hook Form                               │
│ Zod                                           │
│ Zustand                                       │
│ Tailwind                                      │
└───────────────────────┬───────────────────────┘
                        │ REST / JSON
                        ▼
┌───────────────────────────────────────────────┐
│               NestJS Backend                  │
│                                               │
│ Auth                                          │
│ Organizations                                 │
│ Users                                         │
│ Business Units                                │
│ Processing Activities                         │
│ Data Mapping                                  │
│ Systems                                       │
│ Suppliers                                     │
│ Legal Bases                                   │
│ Compliance                                    │
│ ROPA                                          │
│ Documents                                     │
│ Audit                                         │
│ Notifications                                 │
└──────────────┬────────────────┬───────────────┘
               │                │
               ▼                ▼
        ┌────────────┐    ┌──────────────┐
        │ PostgreSQL │    │ S3 / MinIO   │
        └────────────┘    └──────────────┘

                  opcional / conforme necessidade
                           │
                           ▼
                    ┌─────────────┐
                    │ Redis       │
                    │ BullMQ      │
                    └─────────────┘
```

---

## 35. Documentos relacionados

- `00-PROJECT.md` — visão e escopo;
- `02-DOMAIN.md` — modelo de domínio;
- `03-DATABASE.md` — persistência;
- `04-AUTHORIZATION.md` — RBAC e autorização;
- `05-BUSINESS-RULES.md` — regras de negócio;
- `06-WORKFLOWS.md` — estados e transições;
- `07-API.md` — contratos HTTP;
- `08-FRONTEND.md` — arquitetura da interface;
- `09-SECURITY.md` — segurança;
- `10-AUDIT.md` — auditoria e versionamento;
- `11-TESTING.md` — testes;
- `12-OPEN-QUESTIONS.md` — decisões pendentes.