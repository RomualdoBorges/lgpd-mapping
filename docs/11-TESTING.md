# Estratégia de Testes

> **Documento:** Estratégia de testes e qualidade  
> **Status:** Draft  
> **Projeto:** LGPD Data Mapping Platform  
> **Documentos relacionados:** `01-ARCHITECTURE.md`, `03-DATABASE.md`, `04-AUTHORIZATION.md`, `05-BUSINESS-RULES.md`, `06-WORKFLOWS.md`, `07-API.md`, `08-FRONTEND.md`, `09-SECURITY.md`, `10-AUDIT.md`

> **Question IDs:** referências canônicas em `12-OPEN-QUESTIONS.md`; migrações dos IDs locais registradas por documento de origem no registro central. Perguntas e recomendações locais não encerram essas questões.


## S3.5 — resolução estrutural implementada e auditada

AUTHQ-015 → [DEC-070](13-DECISIONS.md#dec-070--s35-como-resolução-estrutural-de-concessões-do-membership-autorizado), aprovada em 2026-10-23, delimita a S3.5 como resolução estrutural de concessões após a S3.4. Permission matrix, Role → Permission e autorização funcional pertencem a etapa posterior; a autorização funcional não está concluída. A aprovação inicial limitou-se à formalização documental; autorizações humanas posteriores permitiram implementar S3.5.1 a S3.5.4, agora concluídas no escopo estrutural. Ver o [registro de encerramento](14-IMPLEMENTATION-PLAN.md#encerramento-documental-da-s35) para commits e validações reportadas.

Os 17 critérios S3.5-AC-001 a S3.5-AC-017 estão registrados integralmente na DEC-070. Foram auditados como ATENDIDOS no escopo estrutural, com inspeção de implementação e assertions. A formalização inicial não executou testes; os resultados reportados posteriormente estão no registro de encerramento do plano. Nenhum teste foi reexecutado neste encerramento documental.

Testes unitários implementados: contrato, concessões independentes (inclusive roles repetidos), ausência de grants, BUSINESS_UNIT sem áreas, scope inválido, imutabilidade profunda e propagação de falhas sem sucesso vazio.

Integração PostgreSQL real com runtime restrito: isolamento por Organization e por Membership no mesmo tenant; áreas exatas por grant; ORGANIZATION sem áreas; atualização/remoção entre requests após commit; Membership desativada rejeitada pela S3.4; RLS sem contexto e sem filtro tenant; constraints por SQL direto; concorrência A/B; mesma conexão reutilizada após commit, rollback e exceção; ausência de SUPERUSER/BYPASSRLS/ownership/alteração de policies; leitura apenas das colunas aprovadas de Role e escrita negada. Verificar ordem S3.4 → resolver, passagem explícita de contexto e preservação dos contratos de erro sem enumeração.

Testes estruturais não comprovam permissions funcionais. Testes de ALLOW/DENY, visibilidade funcional Activities/ROPA, revisão, aprovação e arquivamento ficam para suas entregas, respeitando DEC-039/043/066 e as questões ainda pendentes.

---

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

OIDC com provedor gerenciado, fornecedor pendente (Auth0 somente candidato), User interno independente e sem união automática de identidades por e-mail. SSO corporativo será parte da V1 após a primeira entrega. Sessão server-side com cookie opaco; frontend não administra tokens. A sessão identifica User; cada request solicita Organization explicitamente e o backend valida autorização atual. Campos do body não transferem recursos entre tenants. A política temporal da Session está definida nas DEC-067/068 e o logout da Session atual na DEC-069.

Seções de proposta legadas deste documento devem ser interpretadas sob estas decisões: não constituem aprovação de permissões de escrita, scopes adicionais, fornecedor, topologia do banco ou herança hierárquica. RLS foi aprovado posteriormente em DEC-046. Questões decididas continuam referenciadas para rastreabilidade; pendências parciais estão identificadas no registro central.


## Persistência e defesa tenant-aware aprovadas — 2026-09-18

DEC-044 (DBQ-001): Drizzle é o ORM/query builder aprovado. Queries ficam em repository/persistence; SQL específico é parametrizado, localizado e versionado. Migrations são revisáveis e reproduzíveis desde banco vazio. Não reduzir garantias PostgreSQL para acomodar o ORM.

DEC-045 (DBQ-008): validar relações/autorização na aplicação e garantir coerência tenant-bound por constraints PostgreSQL. Quando necessário, filhos e associações carregam organization_id NOT NULL, unicidades/FKs compostas e índices adequados; usar checks declarativos quando aplicáveis. FK somente por UUID não prova mesmo tenant. organization_id vem do contexto autorizado e não é campo livre para transferência. Preferir constraint declarativa simples a trigger equivalente.

DEC-046 (DBQ-009): RLS adicional nas tabelas tenant-bound, com contexto local à transação, todas as queries da operação no mesmo contexto, ausência de contexto negando acesso e nenhum tenant persistente na conexão. Considerar pooling. Runtime sem superuser/BYPASSRLS/propriedade das tabelas protegidas/alteração de policies; FORCE ROW LEVEL SECURITY quando adequado. Credencial de migration separada do runtime.

Defesa aprovada: Authentication → Membership → Permission → Scope → Repository tenant-aware → PostgreSQL constraints → PostgreSQL RLS. Nenhuma camada substitui outra. Scope de Business Unit continua na autorização da aplicação.

User, ExternalIdentity, Session e outras entidades globais não recebem organization_id artificial.

Os testes da S3.1 devem executar em banco PostgreSQL exclusivo nesta ordem:

```text
provisionamento administrativo da role
→ migrations estruturais
→ provisionamento administrativo de auth_private/primitives
→ testes com runtime restrito
```

Devem comprovar:

- schema, FKs, unicidades e múltiplas identidades/sessões;
- ausência de token bruto e de campos tenant/autorização;
- ausência de DML direto do runtime;
- propriedades e memberships da role dedicada;
- ownership e privilégios de auth_private;
- SECURITY DEFINER, search_path e EXECUTE dos quatro primitives;
- retornos mínimos sem token_digest;
- revogação idempotente preservando o primeiro timestamp;
- ausência de DELETE;
- migrations em banco vazio e journal com três migrations;
- regressão integral dos dez cenários DEC-045/046 do Slice 2.

A S3.2 valida o bootstrap PostgreSQL restrito de Membership com 28 cenários da DEC-056: propriedades e separação das roles; grants mínimos; ausência de acesso às tabelas proibidas; ENABLE/FORCE RLS; policies distintas para runtime e bootstrap; retorno mínimo para vínculo ativo; ausência indistinguível para vínculo ausente, inativo ou Organization inexistente; rejeição de outro User; no máximo uma linha; chamada exclusiva pelo repository; ausência de leitura direta obtida por settings; isolamento por `search_path`; criação sob owner dedicado; CREATE temporário removido; PUBLIC sem EXECUTE; runtime com EXECUTE específico; e provisionamento idempotente e transacional. As regressões de DEC-045/046 e DEC-057 permanecem aprovadas.

O estado validado possui 10 testes unitários e 52 testes de integração em PostgreSQL real. Esses testes não afirmam que o pipeline HTTP da DEC-052 esteja pronto: resolução de Session no request, produção do authenticatedUserId, `X-Organization-Id`, AuthenticatedContext completo e autorização por RoleAssignment/BusinessUnit continuam fora da S3.2. DEC-053 ainda exige integrar o lifecycle ao fluxo HTTP; DEC-054 exige validação independente do header em requests tenant-bound; DEC-055 exige cookie seguro e proteção CSRF para mutações.

A S3.4 acrescenta testes unitários e HTTP/PostgreSQL para validação de `X-Organization-Id`, contratos 400/403, resolução positiva e negativa de Membership, separação entre `AuthenticatedIdentity` e `AuthorizedTenantContext` e abertura de `withTenant()` somente depois da autorização. O estado atual validado possui 37 testes unitários e 82 testes de integração, preservando as regressões das S3.1 a S3.3 e do Slice 2.

### Testes temporais e de logout da Session

DEC-067 exige testes determinísticos com clock controlado para os limites de 12 horas e 30 minutos, inclusive exatamente no limite; inicialização de `lastActivityAt`; persistência somente após request autenticada válida quando cinco minutos ou mais tiverem passado; ausência de UPDATE dentro da janela; ausência de escrita periódica; não regressão e concorrência entre instâncias. Session inexistente, revogada ou expirada não é tocada.

DEC-068 exige comprovar que atividade não estende `expiresAt`, não existe sliding expiration, rotação automática do segredo ou endpoint local de refresh. DEC-069 exige revogação antes da remoção do cookie, 204 no logout, preservação do primeiro `revokedAt`, 401 após o commit e ausência de promessa de cancelamento de request já autenticada. Todos os testes PostgreSQL usam a fronteira restrita da DEC-057.

Referências legadas a Prisma/Drizzle ou a RLS como alternativas pendentes são históricas: estas três questões estão decididas em DEC-044 a DEC-046. Políticas funcionais, autenticação e features posteriores continuam sujeitas às questões específicas. A topologia física de produção não é escolhida por este registro.

### Testes obrigatórios de infraestrutura tenant-aware

Executar com PostgreSQL real e credencial equivalente à de runtime:

1. Contexto A não lê linhas da B.
2. Contexto A não altera/exclui linhas da B.
3. Relação A → recurso B é rejeitada pelas constraints.
4. Query tenant-bound sem filtro explícito permanece limitada pelo RLS.
5. Ausência de contexto nega acesso tenant-bound.
6. Reutilização de conexão não conserva tenant anterior.
7. Commit e rollback não vazam contexto.
8. Runtime não consegue bypassar RLS.
9. Constraints protegem relações mesmo com validação da aplicação omitida no teste.
10. Scope de Business Unit permanece responsabilidade da autorização da aplicação, distinto do isolamento de tenant.

---

---


---

## 1. Objetivo

Este documento define a estratégia de testes da plataforma.

Os testes devem garantir principalmente:

```text
regras de negócio

isolamento multi-tenant

autorização

workflows

Compliance Gate

versionamento

auditoria

contratos da API

comportamento do frontend

fluxos críticos do usuário
```

O objetivo não é maximizar um número de cobertura, mas reduzir o risco de regressões relevantes.

---

# 2. Princípio

Quanto mais crítica for uma regra, mais diretamente ela deve ser testada.

Exemplo:

```text
"Atividade não pode ser ativada sem Compliance Gate completo"
```

deve possuir teste explícito.

Não depender apenas de um teste E2E genérico que eventualmente passe por essa regra.

---

# 3. Pirâmide

Estratégia geral:

```text
              ┌─────────────┐
              │     E2E     │
              └──────┬──────┘
                     │
             ┌───────┴───────┐
             │  Integration  │
             └───────┬───────┘
                     │
         ┌───────────┴───────────┐
         │         Unit          │
         └───────────────────────┘
```

Preferir:

```text
muitos testes unitários relevantes

bons testes de integração

poucos E2E cobrindo fluxos críticos
```

---

# 4. Tipos de teste

A estratégia possui:

```text
Unit Tests

Integration Tests

API Tests

Component Tests

E2E Tests

Security Tests
```

Algumas categorias podem compartilhar infraestrutura.

---

# 5. Ferramentas

Stack proposta:

```text
Vitest
Testing Library
Playwright
```

Runner aprovado do backend: **Vitest** (TESTQ-011 / DEC-047), para testes unitários e de integração. Configuração própria compatível com NestJS, ESM/NodeNext e TypeScript. A escolha não aprova ferramentas de frontend/E2E nem implementa o runner. Trocar o runner exige nova decisão explícita.

Evitar manter dois frameworks de testes sem necessidade.

---

# 6. Unit Tests

Testes unitários devem focar:

```text
regras de domínio

casos de uso

funções puras

validações

transições de estado

Compliance Checks

transformações
```

---

# 7. O que evitar em Unit Tests

Não testar detalhes triviais como:

```text
getter simples

setter simples

constante

biblioteca externa
```

apenas para aumentar cobertura.

---

# 8. Regra de negócio

Exemplo:

```ts
describe('ProcessingActivity', () => {
  it('does not activate when compliance is pending', () => {
    // ...
  });
});
```

Esse teste representa diretamente uma regra de negócio.

---

# 9. IDs das regras

Quando possível, relacionar testes importantes às regras documentadas.

Exemplo:

```ts
describe('BR-CG-001', () => {
  it('prevents completion without compliance gate', () => {});
});
```

Isso facilita rastreabilidade:

```text
Regra
  ↓
Código
  ↓
Teste
```

---

# 10. Compliance Gate

O Compliance Gate deve possuir suíte própria.

Exemplo:

```text
tests/
└── compliance/
    ├── legal-basis.spec.ts
    ├── retention.spec.ts
    ├── security-measures.spec.ts
    ├── international-transfer.spec.ts
    ├── sensitive-data.spec.ts
    └── minor-data.spec.ts
```

Estrutura final pode variar.

---

# 11. Legal Basis Check

Cenário:

```text
Given:
atividade sem base legal

When:
Compliance Gate executa

Then:
LEGAL_BASIS = FAIL
```

---

# 12. Legal Basis válida

```text
Given:
atividade possui base legal válida estruturalmente

When:
gate executa

Then:
LEGAL_BASIS = PASS
```

Isso não significa que o sistema esteja emitindo parecer jurídico sobre a adequação material da base legal.

---

# 13. Legítimo interesse

```text
Given:
legalBasis = LEGITIMATE_INTEREST

And:
justification está vazia

When:
validação executa

Then:
LEGITIMATE_INTEREST_JUSTIFICATION_REQUIRED
```

---

# 14. Retenção

```text
Given:
atividade sem política de retenção

When:
gate executa

Then:
RETENTION = FAIL
```

---

# 15. Segurança

```text
Given:
atividade sem medidas de segurança

When:
gate executa

Then:
SECURITY_MEASURES = FAIL
```

---

# 16. Transferência internacional não aplicável

```text
Given:
atividade não possui transferência internacional

When:
gate executa

Then:
INTERNATIONAL_TRANSFER = NOT_APPLICABLE
```

---

# 17. Transferência internacional

```text
Given:
atividade possui INTERNATIONAL_TRANSFER

And:
destinationCountry está ausente

When:
validação executa

Then:
INTERNATIONAL_TRANSFER_COUNTRY_REQUIRED
```

---

# 18. Dados sensíveis

```text
Given:
atividade possui categoria sensível

When:
gate executa

Then:
SENSITIVE_DATA gera o resultado definido pela regra vigente
```

Enquanto a resolução de `REVIEW_REQUIRED` permanecer aberta, o teste não deve inventar automaticamente:

```text
PASS
```

ou:

```text
FAIL
```

---

# 19. Menores

Mesmo princípio:

```text
MINOR_DATA
```

deve possuir teste específico assim que o comportamento definitivo for aprovado.

---

# 20. Workflow

A máquina de estados deve possuir testes dedicados.

Exemplo:

```text
DRAFT
↓
MAPPING
↓
...
↓
ACTIVE
```

---

# 21. Transição válida

```text
Given:
status = DRAFT

When:
startMapping()

Then:
status = MAPPING
```

---

# 22. Transição inválida

```text
Given:
status = DRAFT

When:
activateActivity()

Then:
INVALID_ACTIVITY_STATE_TRANSITION
```

---

# 23. Compliance e workflow

```text
Given:
status = COMPLIANCE_PENDING

And:
complianceStatus = PENDING

When:
activateActivity()

Then:
ACTIVITY_NOT_COMPLIANT
```

---

# 24. Arquivamento

```text
Given:
status = ACTIVE

When:
archiveActivity()

Then:
status = ARCHIVED
```

desde que o usuário esteja autorizado e a regra permita.

---

# 25. Autorização

Permissões devem possuir testes independentes da UI.

Exemplos:

```text
COLLABORATOR

MANAGER

DPO

ADMIN
```

conforme papéis aprovados.

---

# 26. Permission Tests

Exemplo:

```text
Given:
User não possui processing_activity:update

When:
tenta atualizar atividade

Then:
operação é rejeitada
```

---

# 27. Scope Tests

Exemplo:

```text
Given:
Manager possui acesso somente ao RH

And:
atividade pertence ao Financeiro

When:
Manager tenta editar atividade

Then:
operação é rejeitada
```

---

# 28. Multi-tenant

Isolamento multi-tenant é requisito crítico.

Deve possuir testes em múltiplas camadas.

---

# 29. Fixture multi-tenant

Criar pelo menos:

```text
Organization A
Organization B
```

Cada uma com dados próprios.

Exemplo:

```text
Organization A
├── User A
├── Business Unit A
└── Activity A

Organization B
├── User B
├── Business Unit B
└── Activity B
```

---

# 30. Leitura cross-tenant

```text
Given:
User A autenticado

When:
GET Activity B

Then:
nenhuma informação de Activity B é retornada
```

---

# 31. Atualização cross-tenant

```text
Given:
User A autenticado

When:
PATCH Activity B

Then:
Activity B permanece inalterada
```

---

# 32. Exclusão cross-tenant

Para recursos que possuírem remoção:

```text
User A
```

não pode remover recurso de:

```text
Organization B
```

---

# 33. Associação cross-tenant

Teste especialmente importante.

Exemplo:

```text
Activity A
```

não pode ser associada a:

```text
Supplier B
```

mesmo que o usuário conheça o UUID.

---

# 34. Sistema cross-tenant

```text
Activity Organization A
+
System Organization B
```

deve ser rejeitado.

---

# 35. Business Unit cross-tenant

```text
User Organization A
```

não pode criar atividade apontando para:

```text
BusinessUnit Organization B
```

---

# 36. Arquivos cross-tenant

```text
User A
```

não pode:

```text
visualizar
baixar
associar
remover
```

arquivo da Organization B.

---

# 37. Integration Tests

Testes de integração devem validar componentes reais trabalhando juntos.

Exemplo:

```text
Use Case
+
Repository
+
PostgreSQL
```

---

# 38. Banco real nos testes

Para testes de persistência importantes, preferir PostgreSQL real de teste em vez de SQLite quando produção utilizar PostgreSQL.

Isso evita diferenças em:

```text
constraints
JSONB
transactions
indexes
SQL behavior
```

---

# 39. Banco isolado

Testes nunca devem apontar para:

```text
development database
staging database
production database
```

Utilizar banco exclusivo de teste.

---

# 40. Database URL

Ambiente de testes deve possuir:

```text
DATABASE_URL
```

própria.

Adicionar proteção para impedir execução destrutiva acidental contra produção.

---

# 41. Reset

Cada suíte deve possuir estado previsível.

Estratégia híbrida aprovada (TESTQ-012 / DEC-048):

- Banco exclusivo de testes por execução.
- Migrations reais para preparar o schema.
- Limpeza dos dados entre testes de integração quando apropriado.
- Transações reais da aplicação nas suites que validam persistência, RLS, pool, commit e rollback.
- Recriação do banco/schema quando a suite precisar validar migrations ou alterações estruturais.
- Rollback externo por teste somente quando não esconder o comportamento validado.
- Inicialmente, testes de integração que compartilham o mesmo banco executam serialmente.
- Operações destinadas a validar RLS utilizam a role runtime restrita.
- Credenciais de migration/preparação não podem mascarar testes de segurança.
- A infraestrutura impede explicitamente limpeza acidental de bancos que não sejam exclusivos de teste.
- SQLite não substitui PostgreSQL nos testes de comportamento específico do PostgreSQL.

Os dez cenários de isolamento/integridade de DEC-048, derivados de DEC-045 e DEC-046, continuam obrigatórios, assim como os requisitos de autorização por scope da DEC-046. Credenciais de preparação são separadas das operações que comprovam segurança. A estratégia não escolhe provisionamento do PostgreSQL em CI, Testcontainers ou paralelização futura.

---

# 42. Migrations

Testes de integração devem utilizar schema compatível com as migrations reais.

Não manter schema de teste manualmente divergente.

---

# 43. Constraints

Testar constraints críticas.

Exemplo:

```text
foreign keys
unique constraints
tenant relationships
```

---

# 44. API Tests

Endpoints devem testar:

```text
happy path

authentication

authorization

validation

business rules

tenant isolation

status codes

response contract
```

---

# 45. GET Activity

Cenários:

```text
200 — usuário autorizado

401 — não autenticado

404/403 — conforme política de autorização

404 — outro tenant

404 — inexistente
```

---

# 46. POST Activity

Testar:

```text
criação válida

nome ausente

businessUnit inválida

businessUnit outro tenant

sem permissão

mass assignment
```

---

# 47. Mass Assignment

Request:

```json
{
  "name": "Teste",
  "businessUnitId": "uuid",
  "organizationId": "organization-b",
  "status": "ACTIVE",
  "complianceStatus": "COMPLETE"
}
```

Garantir que o cliente não consiga controlar campos protegidos.

---

# 48. PATCH Activity

Testar tentativa de alterar:

```text
organizationId
createdBy
status
complianceStatus
currentVersion
```

diretamente.

---

# 49. Workflow endpoints

Endpoints como:

```text
/start-mapping

/submit

/request-changes

/activate

/start-revision

/archive
```

devem possuir testes específicos de estado.

---

# 50. Validation Tests

Testar campos condicionais.

Exemplo:

```text
sourceType = DOCUMENT
```

deve aplicar regras correspondentes ao ramo de documento.

---

# 51. International Transfer

Quando:

```text
operation = INTERNATIONAL_TRANSFER
```

testar exigência de:

```text
destinationCountry
```

---

# 52. Legitimate Interest

Quando:

```text
legalBasis = LEGITIMATE_INTEREST
```

testar exigência da justificativa.

---

# 53. Frontend Unit Tests

Utilizar para:

```text
formatters

schemas

utils

hooks com lógica

mapeamentos de status

mapeamentos de erro
```

---

# 54. Component Tests

Utilizar Testing Library.

Testar comportamento observável.

Exemplo:

```text
renderizar formulário

preencher nome

clicar salvar

mostrar sucesso
```

---

# 55. Evitar teste de implementação

Evitar:

```text
expect(component.state.foo).toBe(...)
```

Preferir:

```text
expect(screen.getByText(...)).toBeVisible()
```

quando representar comportamento real.

---

# 56. Wizard Component Tests

Cada etapa relevante deve possuir testes.

Exemplo:

```text
Data Categories Step

Collection Source Step

Operations Step

Retention Step

Legal Basis Step
```

---

# 57. Campo condicional

Exemplo:

```text
Given:
usuário seleciona "Legítimo interesse"

Then:
campo "Justificativa" aparece
```

---

# 58. Coleta por documento

```text
Given:
usuário seleciona "Sim"

Then:
campos de documento aparecem
```

---

# 59. Coleta por sistema

```text
Given:
usuário seleciona "Não"

Then:
seletor de sistema aparece
```

---

# 60. Transferência internacional UI

```text
Given:
usuário seleciona transferência internacional

Then:
campo país de destino aparece
```

---

# 61. Error Mapping

Quando API retorna:

```text
RETENTION_POLICY_REQUIRED
```

o frontend deve conseguir apresentar mensagem na etapa apropriada.

---

# 62. Loading

Testar operações relevantes:

```text
Salvar
↓
Salvando...
↓
sucesso
```

---

# 63. Erro

Testar:

```text
API falha
↓
mensagem adequada
↓
usuário pode tentar novamente
```

---

# 64. Empty State

Exemplo:

```text
GET activities = []
```

deve exibir:

```text
Nenhuma atividade cadastrada.
```

---

# 65. Autorização visual

Exemplo:

```text
User sem processing_activity:create
```

não deve visualizar:

```text
Nova atividade
```

quando essa ação não for permitida.

Isso não substitui o teste do backend.

---

# 66. allowedActions

Se a API adotar:

```text
allowedActions
```

testar que a UI utiliza essas informações corretamente.

Exemplo:

```json
{
  "allowedActions": [
    "VIEW"
  ]
}
```

não deve exibir:

```text
Editar
Arquivar
Submeter
```

---

# 67. E2E

Playwright deve cobrir jornadas críticas.

Não tentar testar todas as combinações possíveis via E2E.

---

# 68. E2E — Login

Fluxo:

```text
abrir aplicação
↓
autenticar
↓
dashboard/tela inicial
```

A implementação depende da autenticação escolhida.

---

# 69. E2E — Criar atividade

```text
login
↓
Atividades
↓
Nova atividade
↓
nome
↓
área
↓
Criar
↓
DRAFT
```

---

# 70. E2E — Mapeamento

```text
criar atividade
↓
iniciar mapeamento
↓
dados pessoais
↓
titulares
↓
origem
↓
operações
↓
retenção
↓
segurança
↓
base legal
↓
revisão
```

---

# 71. E2E — Compliance incompleto

```text
atividade incompleta
↓
tentativa de conclusão
↓
pendências
↓
atividade não fica ACTIVE
```

---

# 72. E2E — Compliance completo

Após decisões funcionais definitivas:

```text
atividade completa
↓
gate
↓
aprovação quando aplicável
↓
ACTIVE
↓
ROPA
```

---

# 73. E2E — ROPA

```text
atividade ativa
↓
abrir ROPA
↓
atividade aparece
```

---

# 74. E2E — Versão

Quando versionamento estiver implementado:

```text
Activity v1 ACTIVE
↓
iniciar revisão
↓
alterar
↓
publicar v2
↓
v2 vigente
↓
v1 histórico
```

---

# 75. E2E — Tenant Isolation

Cenário crítico:

```text
login Organization A
↓
tentar navegar diretamente para Activity B
↓
conteúdo não aparece
```

Backend continua sendo responsável pela segurança.

---

# 76. E2E — Permissões

Exemplo:

```text
COLLABORATOR
```

não deve conseguir acessar operação administrativa não permitida.

---

# 77. E2E — Exportação

Quando implementado:

```text
ROPA
↓
Exportar Excel
↓
arquivo gerado
```

Não é necessário validar visualmente cada célula via browser se testes de integração do gerador cobrirem o conteúdo.

---

# 78. Testes de exportação

Gerador de ROPA deve possuir testes próprios.

Exemplo:

```text
filtros aplicados

tenant respeitado

colunas corretas

dados esperados

formato válido
```

---

# 79. Snapshot Testing

Evitar snapshots gigantes de:

```text
HTML
JSON
ROPA inteiro
```

que são atualizados automaticamente sem revisão.

Snapshots podem ser utilizados quando forem realmente úteis e estáveis.

---

# 80. Test Data Builders

Para domínio complexo, preferir builders.

Exemplo:

```ts
const activity = activityBuilder()
  .withLegalBasis()
  .withRetention()
  .withSecurityMeasures()
  .build();
```

Isso torna cenários explícitos.

---

# 81. Fixtures

Fixtures devem utilizar dados fictícios.

Exemplo:

```text
Empresa Alpha

Empresa Beta

RH

Financeiro

Sistema ATS

Fornecedor Cloud XPTO
```

Não utilizar dados reais de clientes.

---

# 82. Factory defaults

Factories devem produzir objetos válidos por padrão quando isso facilitar testes.

Depois sobrescrever apenas o necessário.

Exemplo:

```ts
activityFactory.create({
  complianceStatus: 'PENDING'
});
```

---

# 83. Teste de regra inválida

Para regras importantes, testar:

```text
caso válido
+
caso inválido
+
limites relevantes
```

---

# 84. Mocking

Mockar dependências externas quando necessário.

Exemplos:

```text
e-mail
object storage
IdP
```

Evitar mockar:

```text
o próprio domínio
```

a ponto de o teste deixar de testar comportamento real.

---

# 85. Banco

Unit tests não precisam de banco.

Integration tests podem utilizar banco real.

E2E deve utilizar ambiente controlado.

---

# 86. Object Storage

Para testes de integração pode ser utilizado:

```text
MinIO
```

ou solução compatível com a estratégia final.

Não depender do storage de produção.

---

# 87. E-mail

Não enviar e-mails reais durante testes automatizados.

Utilizar:

```text
fake
mock
mail catcher
```

---

# 88. SSO

E2E de SSO real pode ser complexo.

Separar:

```text
testes da aplicação
```

de:

```text
testes de integração com IdP
```

quando necessário.

Não mockar autorização interna apenas porque autenticação externa foi mockada.

---

# 89. Auditoria

Toda mutation crítica deve possuir teste verificando evento de auditoria.

Exemplos:

```text
atividade ativada
atividade arquivada
role alterada
usuário desativado
```

---

# 90. Auditoria e rollback

Teste:

```text
Given:
Audit Log crítico falha

When:
mutation é executada

Then:
operação de negócio sofre rollback
```

quando essa atomicidade for exigida.

---

# 91. Versionamento

Testar:

```text
sequência de versões

imutabilidade

versão vigente

versão histórica

nova publicação
```

---

# 92. Snapshot histórico

Exemplo:

```text
v1:
businessUnit.name = "RH"

área é renomeada para:
"Recursos Humanos"

Then:
v1 continua representando corretamente o valor histórico
```

se snapshot autossuficiente for adotado.

---

# 93. Concorrência

Se optimistic locking for implementado:

```text
User A lê version = 5

User B atualiza → version = 6

User A tenta salvar version = 5

Then:
409 RESOURCE_VERSION_CONFLICT
```

---

# 94. Requests duplicadas

Para operações com idempotência:

```text
mesma Idempotency-Key
```

não deve gerar duas operações.

Somente testar onde idempotência for adotada.

---

# 95. Upload

Testar:

```text
arquivo permitido

arquivo proibido

arquivo acima do limite

MIME inválido

nome malicioso

tenant incorreto

sem permissão
```

---

# 96. Upload filename

Exemplo:

```text
../../test.pdf
```

não deve resultar em path traversal.

---

# 97. Download

Testar:

```text
arquivo existente + autorizado

arquivo inexistente

arquivo outro tenant

arquivo sem permissão
```

---

# 98. Security Regression Tests

Sempre que uma vulnerabilidade for encontrada e corrigida:

```text
criar teste reproduzindo a vulnerabilidade
```

antes ou junto da correção quando possível.

O teste deve impedir regressão futura.

---

# 99. Coverage

Coverage é indicador, não objetivo isolado.

Não estabelecer:

```text
100%
```

como meta automática.

---

# 100. Coverage mínimo

Se a equipe decidir utilizar threshold, deve ser configurado conscientemente.

Pode existir threshold diferente para:

```text
domain
application
frontend
```

Não definir número arbitrário neste documento.

---

# 101. Código crítico

Mesmo com coverage geral baixo, módulos críticos devem possuir cobertura forte.

Prioridades:

```text
Authorization

Tenant Isolation

Compliance Gate

Workflow

Audit

Versioning
```

---

# 102. Mutation Testing

Pode ser avaliado futuramente para regras críticas.

Não é requisito inicial.

---

# 103. Testes determinísticos

Evitar dependência direta de:

```text
Date.now()

Math.random()

timezone da máquina

ordem não garantida
```

quando isso tornar testes instáveis.

---

# 104. Clock

Para regras temporais, utilizar abstração ou fake clock quando apropriado.

Exemplo:

```text
pendência > X dias
```

---

# 105. Timezone

Testar datas independentemente do timezone da máquina de CI.

Backend deve trabalhar preferencialmente com UTC.

---

# 106. Flaky Tests

Teste instável não deve ser simplesmente:

```text
retry 10 vezes
```

Investigar a causa.

Retries podem existir no E2E, mas não devem mascarar problemas reais.

---

# 107. Seletores E2E

Preferir:

```text
role
label
text
```

Exemplo:

```ts
page.getByRole('button', {
  name: 'Salvar'
});
```

---

# 108. data-testid

Utilizar somente quando não houver seletor acessível adequado.

---

# 109. Testes paralelos

Testes devem poder rodar em paralelo quando a infraestrutura permitir.

Evitar fixtures globais compartilhadas que gerem interferência.

---

# 110. IDs únicos

Factories devem gerar IDs independentes para evitar colisão entre testes.

---

# 111. CI

Pull Requests devem executar pelo menos:

```text
lint

typecheck

unit tests

integration tests essenciais

build
```

E2E pode ser executado conforme estratégia de CI definida.

---

# 112. E2E no CI

Possibilidades:

```text
todo PR

branch principal

antes de deploy

nightly
```

A frequência final depende de custo e tempo de execução.

Fluxos críticos devem ser executados antes de produção.

---

# 113. Falha de teste

Pipeline não deve permitir deploy normal quando testes obrigatórios falharem.

Não utilizar:

```text
continue-on-error
```

em testes críticos apenas para deixar o pipeline verde.

---

# 114. Ambientes

Separar:

```text
local

test

staging

production
```

Testes automatizados não devem modificar produção.

---

# 115. Seeds E2E

Pode existir seed específico:

```text
e2e-seed
```

com organizações, usuários e atividades previsíveis.

---

# 116. Usuários E2E

Exemplo:

```text
collaborator@alpha.test

manager@alpha.test

dpo@alpha.test

manager@beta.test
```

Somente dados fictícios.

---

# 117. Testes manuais

Algumas funcionalidades ainda exigirão validação manual.

Exemplos:

```text
UX do wizard

responsividade

acessibilidade visual

PDF exportado

layout Excel

SSO real
```

Testes manuais complementam, não substituem, testes automatizados críticos.

---

# 118. Browser Support

Definir browsers suportados.

Sugestão inicial para aplicação corporativa moderna:

```text
Chrome
Edge
Firefox
Safari
```

A lista definitiva deve ser aprovada conforme público real.

---

# 119. Acessibilidade

Testes devem considerar:

```text
navegação por teclado

labels

focus

erros associados

contraste
```

Automação pode ajudar, mas revisão manual continua importante.

---

# 120. Performance Tests

Não são requisito obrigatório da primeira entrega.

Devem ser introduzidos quando existirem metas concretas.

Exemplos futuros:

```text
10.000 atividades

ROPA grande

dashboard multi-área

exportação pesada
```

---

# 121. Load Testing

Não criar testes de carga sem definir:

```text
volume esperado

concorrência

SLA

dataset
```

Caso necessário futuramente, escolher ferramenta específica.

---

# 122. Testes de migration

Migrations importantes devem ser testadas em banco representativo.

Principalmente migrations que:

```text
alteram constraints

migram dados

adicionam coluna obrigatória

alteram enums

alteram relações
```

---

# 123. Migration rollback

A estratégia de rollback depende do mecanismo adotado.

Não assumir que toda migration será automaticamente reversível.

---

# 124. Dados antigos

Ao alterar modelo, testar compatibilidade com registros existentes.

Exemplo:

```text
atividade v1 criada antes de novo campo
```

não deve quebrar aplicação após migration.

---

# 125. Contract Tests

Se frontend e backend forem desenvolvidos separadamente, considerar validação automatizada do contrato OpenAPI.

Objetivo:

```text
frontend espera X
backend retorna X
```

---

# 126. OpenAPI

Mudanças na API devem atualizar:

```text
OpenAPI
```

e testes relacionados.

---

# 127. Erros estáveis

Testar `error.code` para regras importantes.

Exemplo:

```text
ACTIVITY_NOT_COMPLIANT
```

Não depender somente de texto:

```text
"A atividade não pode..."
```

que pode ser traduzido ou alterado.

---

# 128. Testes por feature

Estrutura possível:

```text
features/
├── processing-activities/
│   └── tests/
├── compliance/
│   └── tests/
├── systems/
│   └── tests/
├── suppliers/
│   └── tests/
└── ropa/
    └── tests/
```

Ou diretório central de testes.

Manter consistência.

---

# 129. Nome dos testes

Nome deve descrever comportamento.

Preferir:

```text
rejects activation when compliance is incomplete
```

Evitar:

```text
test1
activity test
should work
```

---

# 130. Arrange / Act / Assert

Quando melhorar clareza:

```text
Arrange
Act
Assert
```

Pode ser utilizado.

Não é obrigatório adicionar comentários se o teste já for autoexplicativo.

---

# 131. Teste deve explicar a regra

Um desenvolvedor deve conseguir ler:

```ts
it('rejects an international transfer without destination country')
```

e entender o comportamento esperado.

---

# 132. Não adaptar regra para teste passar

Quando um teste baseado em regra documentada falhar:

```text
investigar implementação
```

Não alterar silenciosamente a expectativa apenas para tornar o pipeline verde.

---

# 133. Mudança de regra

Quando uma regra mudar legitimamente:

```text
documentação
↓
teste
↓
implementação
```

devem ser atualizados de forma consistente.

---

# 134. Questões abertas

Registrar também em `12-OPEN-QUESTIONS.md`.

### TESTQ-011 — Runner backend

**Status:** DECIDED — DEC-047. Vitest será o runner de testes do backend.

Referência preservada para rastreabilidade; não é questão pendente.

---

### TESTQ-001 — Database strategy

Testes de integração usarão:

```text
PostgreSQL em Docker
Testcontainers
PostgreSQL dedicado
```

?

**Impacto:** médio.

---

### TESTQ-012 — Reset

**Status:** DECIDED — DEC-048. Estratégia híbrida conforme seção 41.

Referência preservada para rastreabilidade; não é questão pendente.

---

### TESTQ-013 — E2E CI

Playwright será executado:

```text
em todo PR
na main
antes do deploy
```

?

**Impacto:** médio.

---

### TESTQ-004 — Coverage

Haverá threshold mínimo?

**Impacto:** baixo.

---

### TESTQ-003 — Browser support

Quais browsers serão oficialmente suportados?

**Impacto:** baixo/médio.

---

### TESTQ-014 — Storage

Como object storage será representado em testes?

```text
MinIO
mock
serviço real de teste
```

**Impacto:** médio.

---

### TESTQ-008 — Authentication

Como E2E autenticará usuários?

Depende de:

```text
login local
OIDC
SSO
```

**Impacto:** alto.

---

### APIQ-019 — OpenAPI types

Tipos do frontend serão gerados automaticamente?

**Impacto:** médio.

---

### TESTQ-010 — Performance

Existe volume esperado de:

```text
organizações
usuários
atividades
sistemas
fornecedores
```

?

**Impacto:** médio.

---

# 135. Cenários críticos mínimos

Antes de uma primeira versão produtiva, deve existir cobertura automatizada para pelo menos:

```text
[ ] login/autenticação

[ ] isolamento entre organizações

[ ] isolamento entre áreas quando aplicável

[ ] criação de atividade

[ ] salvamento do mapeamento

[ ] campos condicionais do wizard

[ ] base legal

[ ] retenção

[ ] medidas de segurança

[ ] transferência internacional

[ ] Compliance Gate

[ ] bloqueio de ativação sem compliance

[ ] ativação

[ ] ROPA

[ ] permissões

[ ] versionamento

[ ] auditoria

[ ] upload/download quando implementados
```

---

# 136. Matriz de rastreabilidade

Regras críticas podem ser documentadas assim:

| Regra | Unit | Integration | API | E2E |
|---|---:|---:|---:|---:|
| Tenant isolation | ✓ | ✓ | ✓ | ✓ |
| Authorization | ✓ | ✓ | ✓ | ✓ |
| Compliance Gate | ✓ | ✓ | ✓ | ✓ |
| Workflow | ✓ | ✓ | ✓ | ✓ |
| Legal basis | ✓ | ✓ | ✓ | parcial |
| Retention | ✓ | ✓ | ✓ | parcial |
| Versioning | ✓ | ✓ | ✓ | ✓ |
| Audit | ✓ | ✓ | ✓ | parcial |
| UI conditional fields | — | — | — | ✓ |

A tabela é orientação inicial, não uma exigência de duplicar todo cenário em todas as camadas.

---

# 137. Testes gerados por IA

Agentes de IA podem gerar testes, mas devem utilizar as regras documentadas como fonte.

Antes de escrever um teste:

```text
consultar regra

identificar comportamento esperado

identificar cenário positivo

identificar cenário negativo

identificar autorização

identificar tenant

identificar efeitos colaterais
```

---

# 138. Agentes não devem

Não:

```text
inventar comportamento para preencher teste

alterar regra para teste passar

remover teste quebrado sem justificativa

mockar autorização em teste que deveria validá-la

usar apenas happy path

ignorar multi-tenancy

usar banco de produção

usar dados reais

depender de ordem entre testes

criar sleeps arbitrários no E2E

usar snapshot gigante como substituto de assertions
```

---

# 139. Checklist de nova regra

Ao implementar uma regra:

```text
[ ] possui ID/documentação?

[ ] cenário positivo?

[ ] cenário negativo?

[ ] depende de tenant?

[ ] depende de permission?

[ ] depende de status?

[ ] possui erro estável?

[ ] precisa de audit?

[ ] precisa de integration test?

[ ] precisa de E2E?
```

---

# 140. Checklist de endpoint

```text
[ ] happy path

[ ] não autenticado

[ ] sem permissão

[ ] outro tenant

[ ] outro scope

[ ] input inválido

[ ] recurso inexistente

[ ] regra de negócio

[ ] response contract

[ ] audit quando aplicável
```

---

# 141. Checklist de componente

```text
[ ] renderização

[ ] interação

[ ] loading

[ ] erro

[ ] empty state

[ ] permissão visual

[ ] validação

[ ] campos condicionais

[ ] acessibilidade

[ ] mutation
```

---

# 142. Definition of Done

Uma feature não é considerada concluída apenas porque:

```text
"funciona na minha máquina"
```

Definition of Done:

```text
implementação
+
validação
+
autorização
+
tenant isolation
+
tratamento de erro
+
auditoria quando aplicável
+
unit/integration tests necessários
+
E2E quando crítico
+
documentação atualizada
+
CI verde
```

---

# 143. Regra final

Prioridade de testes:

```text
1. Segurança e tenant isolation

2. Regras de negócio

3. Compliance Gate

4. Workflow

5. Autorização

6. Versionamento e auditoria

7. Contratos da API

8. Fluxos críticos da interface

9. Detalhes visuais
```

Testes devem proteger principalmente comportamentos que, se quebrados, possam causar:

```text
vazamento entre empresas

acesso indevido

atividade incorretamente considerada conforme

perda de histórico

alteração indevida de workflow

ROPA incorreto
```

---

# 144. Próximo documento

As decisões ainda não tomadas, dependências entre decisões, prioridades e questões que precisam ser respondidas antes da implementação serão consolidadas em:

`12-OPEN-QUESTIONS.md`

## Infraestrutura executável — Slice 2

Vitest backend (DEC-047), projetos `unit` e `integration`, configuração Node em `apps/api/vitest.config.ts`. Comandos: `pnpm test:unit` e `pnpm test:integration`. A integração compila TypeScript/NestJS com metadata real antes de executar a suite; não instala transformer adicional nem runner E2E.

DEC-048 implementada com banco exclusivo por execução no PostgreSQL oficial LGPD, migrations reais, fixtures fictícios e limpeza serial por lista explícita de tabelas. Proteção destrutiva verifica nome único esperado, marcador do banco no catálogo e banco conectado. Credenciais administrativas provisionam/removem somente esse banco; migration prepara schema/fixtures; runtime restrito executa os cenários de RLS. Não se limpa desenvolvimento nem se concede privilégio de preparação ao runtime.

`apps/api/test/integration/tenant-persistence.test.ts` cobre os dez cenários de isolamento/integridade, migrations desde banco vazio, relações estruturais e DI NestJS. Commit/rollback são reais; testes de pool comparam PID PostgreSQL na conexão reutilizada antes de fechar o pool. Testes unitários cobrem rejeição de tenant inválido antes da transação e proteção contra limpeza indevida. Não há SQLite ou rollback externo envolvendo a suite.

TESTQ-001 e as questões de CI, E2E, cobertura e paralelização futura continuam com seus estados anteriores. Esta infraestrutura local não escolhe Testcontainers ou Docker em CI. Ver instruções operacionais em `../README.md`.


A infraestrutura usa o migrator oficial do Drizzle, journal em `public.__drizzle_migrations` e lock de sessão em conexão exclusiva envolvendo toda a chamada, inclusive bootstrap. Somente a migration role recebe CREATE no database LGPD exclusivo, sem CREATEDB/SUPERUSER/BYPASSRLS/CREATEROLE; runtime mantém ausência de CREATE no database/schema.

A preparação executa dois migrators concorrentes desde banco vazio. A suite verifica journal oficial, ausência de registros duplicados, reaplicação idempotente, privilégios separados e rejeição de CREATE SCHEMA/objetos em public pelo runtime. Não há implementação ou política de comparação histórica de checksum. TESTQ-001 permanece OPEN.


### Controles adicionais após auditoria

DEC-049 aprova apenas a definição global de Role; não define permissions ou catálogo definitivo. Controles positivos UPDATE/DELETE usam BusinessUnits próprias dedicadas e mantêm as assertions negativas cross-tenant. O bootstrap vazio é disputado por dois processos Node independentes no entry point real; locks SQL temporários no banco exclusivo permitem observar duas esperas pelo advisory lock e, depois, somente um holder bloqueado no bootstrap enquanto o outro espera. Ambos devem terminar com sucesso, com exatamente as migrations versionadas no journal. Polling consulta o estado real, sem hooks no runner.

Uma sessão de migration read-only provoca erro no bootstrap oficial após aquisição do lock, sem modificar SQL versionado; verifica descarte da sessão e aquisição posterior por outro executor. Cleanup fecha todos os pools e garante finally administrativo; falha de fechamento ou ausência de marcador mantém o banco residual, sem relaxar proteção destrutiva. Detalhes operacionais no README.
