# Checklist antes da implementação

Data da revisão: 2026-09-18. Este documento organiza pendências; não aprova alternativas nem substitui as especificações.

## Diagnóstico histórico — anterior ao saneamento

O registro central contém **173 questões reais: 169 OPEN e 4 DEFERRED**. Entre as abertas, são **37 CRITICAL, 53 HIGH, 62 MEDIUM e 17 LOW**. O template XXXQ-001 não entra na contagem. Há **90 identificadores adicionais** referenciados fora do registro central. Eles não representam necessariamente 90 decisões independentes: há duplicações de assuntos e referências sem registro completo.

Há 30 decisões DEC-001 a DEC-030 em [13-DECISIONS.md](13-DECISIONS.md). Elas estabelecem princípios, mas não encerram as questões estruturais relacionadas. Não é necessário fechar todas as pendências antes do primeiro código; fechar as que afetam cada entrega.

## 1. Corrigir a rastreabilidade antes de delegar programação

- [x] Unificar IDs e significados usando o registro central como referência, preservando aliases e migrações de IDs.
- [x] Corrigir as referências conflitantes originalmente identificadas em AGENTS.md e nos documentos de banco.
- [x] Reconciliar as referências conflitantes originalmente identificadas em features/ORGANIZATIONS.md.
- [x] Incorporar ou vincular os IDs adicionais do inventário, agrupando assuntos equivalentes sem apagar a rastreabilidade.
- [x] Estabelecer [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md) como registro central e [13-DECISIONS.md](13-DECISIONS.md) como registro das decisões. Novas decisões continuam seguindo esse processo.

## 2. Fechar a primeira entrega e a fundação técnica

- [x] Primeira entrega utilizável definida: primeira publicação de uma Activity pelo caminho de coleta por documento até sua visualização no ROPA atual, com ambiente controlado e dados fictícios, autenticação/autorização reais, isolamento tenant, Draft persistida, Mapping Wizard retomável, Submit, workflow e Compliance Gate necessários, correção de pendências, auditoria persistente e testes acompanhando os slices.
- [x] Registrar os limites da primeira entrega: sem Systems, Suppliers, transferências, dados sensíveis, menores, upload de documentos, Dashboard, Notifications, exportação, revisão de Activity publicada ou telas administrativas completas. Branding e domínio próprio também não integram o recorte. Essas exclusões não excluem automaticamente as features da V1.
- [x] PRODQ-001 decidida pela DEC-034: SaaS multi-tenant, com cada Organization como tenant independente; Business Unit não é tenant.
- [x] Organização do repositório, pnpm, runtimes, configuração local e scripts de lint, format, typecheck, build, desenvolvimento, banco, testes e smoke estabelecidos. Fornecedor/configuração definitiva de CI permanece pendente e não invalida a fundação local.
- [x] Resolver DBQ-001 antes de implementar persistência com ORM: Drizzle aprovado em DEC-044.
- [x] PostgreSQL local e de testes, migrations oficiais Drizzle, dados fictícios, configuração de ambiente e validação de variáveis implementados e validados nos Slices 1 e 2.
- [x] Primeira tarefa vertical e critérios `D1-AC-001` a `D1-AC-016` aprovados. Isso não autoriza gerar antecipadamente todo o schema de negócio.
- [x] Slice 1 concluído: aplicações executáveis e PostgreSQL 17.11 Alpine independente do projeto.
- [x] Slice 2 concluído: persistência estrutural Identity/Tenant, constraints tenant-aware, RLS/FORCE RLS, `withTenant()`, migrations oficiais e testes PostgreSQL reais.

## 3. Identidade, organizações e autorização

- [x] PRODQ-002 é alias de AUTHQ-006; AUTHQ-005/006/007/008 foram decididas pelas DEC-035 a DEC-038: User global multi-organização, roles via Membership, múltiplos RoleAssignments com scopes preservados e acesso explícito a Business Units.
- [x] SECQ-002, AUTHQ-010 e APIQ-002 decididas pelas DEC-041/042 e decisões complementares de Session/cookie. SECQ-004 foi encerrada pelas DEC-067/068/069: 12 horas de validade absoluta, idle timeout de 30 minutos, persistência de atividade com intervalo de cinco minutos, sem sliding/renovação automática e logout com revogação server-side antes de remover o cookie.
- [ ] SECQ-001 permanece IN_ANALYSIS quanto ao fornecedor OIDC gerenciado; SECQ-003 permanece OPEN quanto a MFA.
- [ ] Aprovar permission + scope para as operações da primeira entrega, inclusive criação, edição, Submit, Gate e publicação: AUTHQ-001/002/003/009 e questões específicas relacionadas. AUTHQ-004 já define a leitura de Activities/ROPA no D1; sua parte remanescente e DASHQ-001 tratam de Dashboard, Systems e Suppliers, fora da primeira entrega.
- [x] Tenant Request Context implementado na S3.4: após `AuthenticatedIdentity`, o boundary valida `X-Organization-Id`, resolve a Membership pelo primitive restrito, cria `AuthorizedTenantContext` somente no resultado positivo e abre `withTenant()` com a Organization autorizada.
- [ ] Definir criação de organização, convites/provisionamento, administração de memberships e áreas, desligamento de usuário e revogação de acesso.
- [ ] Resolver ORGQ-001 a ORGQ-005 antes das operações correspondentes: unicidade de área, inativação de área com atividades, permissões de gestão, onboarding e inativação de organização.
- [x] Aprovar DEC-066: recurso inexistente, cross-tenant ou fora do scope de visibilidade usa o mesmo 404 no endpoint; recurso legitimamente visível com ação negada usa 403. Manter proteção contra enumeração na implementação.

## 4. Modelo de dados e catálogos

- [ ] Resolver DQ-001/002/003/004/005: categoria versus item de dado, quantidade de bases legais e finalidades, associação da base legal e granularidade de retenção.
- [ ] Resolver DQ-006/007/008/009, PAQ-002/003 e MWQ-004: catálogos, hierarquia, responsável individual, áreas participantes e fontes de coleta.
- [ ] Resolver DBQ-002/003/004/005/006/007 conforme o escopo: versões, snapshot, exclusão, catálogos, documentos e finalidade.
- [x] DBQ-008 e DBQ-009 decididas pelas DEC-045/046 e implementadas na fundação do Slice 2: constraints compostas tenant-aware e RLS/FORCE RLS com contexto transaction-local e runtime restrito.
- [ ] Definir relacionamentos Activity/System/Supplier/Operation, incluindo SYSQ-004/005/006 e SUPQ-003/004. Não cristalizar cardinalidades apenas porque aparecem em exemplos.
- [ ] Aprovar campos, nullability, limites, unicidade, FKs, índices e regras de exclusão dos recursos da primeira entrega.
- [ ] Resolver CATQ-001 a CATQ-012 conforme os catálogos efetivamente implementados. Questões exclusivas de menores, transferências, consentimento ou outros ramos excluídos não bloqueiam a primeira entrega, mas o backend deve impedir sua publicação como se os checks fossem automaticamente `NOT_APPLICABLE`.

## 5. Workflow, revisão e versão vigente

- [ ] Resolver WFQ-001/002/003/004/005/006 e BRQ-006/007: estados, destino do submit, revisores, aprovação, REVIEW_REQUIRED e BLOCKED.
- [ ] Aprovar tabela de transições com estado de origem/destino, permission/scope, pré-condições, efeitos e evento de auditoria.
- [ ] Resolver WFQ-007/008, PAQ-007 e DQ-010: edição de ACTIVE, alterações relevantes e manutenção da versão publicada durante revisão.
- [ ] Resolver WFQ-009/010/011/012, BRQ-008/009 e WFQ-013 quando essas operações entrarem na entrega: rejeição, cancelamento, reativação, exclusão, arquivo e revisão periódica.
- [ ] Resolver AUDQ-010/011/012/013: numeração, revisão rejeitada, snapshot de entidades externas e criação da primeira versão.
- [ ] Definir transação e concorrência para publicação, versão vigente e auditoria. Auditoria de mutations não pode esperar uma fase posterior para ser garantida.

## 6. Validação, wizard e Compliance Gate

- [ ] Aprovar lista exata dos campos obrigatórios para salvar draft, submeter e executar/concluir o Gate: PAQ-006 e VALQ-003. Draft deve poder permanecer incompleto.
- [ ] A primeira entrega limita-se a dados comuns de adultos, sem transferências e sem fluxos condicionais adicionais de consentimento ou legítimo interesse. BRQ-001/002/003/004/005 permanecem pendentes para os ramos futuros correspondentes e não autorizam tratá-los como `NOT_APPLICABLE` durante publicação no D1.
- [ ] Para cada check, definir aplicabilidade, entradas, PASS, FAIL, REVIEW_REQUIRED, NOT_APPLICABLE e evidências.
- [ ] Definir agregação em ComplianceStatus, condição de BLOCKED e requisitos de ativação no backend.
- [ ] Resolver CGQ-001/002/003/004/005: resolução humana, justificativa, histórico de execuções, invalidação/reexecução e versão/snapshot avaliado.
- [ ] Resolver CGQ-006/007 e APIQ-010 conforme a entrega: configuração, versão de regras e execução automática.
- [ ] Resolver MWQ-001, UXQ-005, FEQ-003/006: dados condicionais antigos, autosave e alterações não salvas.
- [ ] Resolver MWQ-002/003/005, FEQ-004/005 e UXQ-002/006: retomada, progresso, evento de retenção, URLs e cadastro rápido.

## 7. Sistemas e fornecedores

Systems e Suppliers estão fora da primeira entrega. Os itens abaixo permanecem pendentes para a entrega futura correspondente e não bloqueiam o D1 aprovado.

- [ ] Aprovar critérios objetivos de MAPPED: SYSQ-002 e SUPQ-002.
- [ ] Aprovar impacto de PENDING sobre submit, Gate e ativação: BRQ-010, SYSQ-007 e SUPQ-006.
- [ ] Aprovar campos e permissões de Quick Create: SYSQ-011 e SUPQ-011. O cadastro já foi decidido como persistente em DEC-012.
- [ ] Definir papel de privacidade do fornecedor e onde é registrado: SUPQ-003.
- [ ] Definir unicidade, inativação/exclusão, versionamento e efeito sobre atividades publicadas: SYSQ-009/010/012, SUPQ-008/009/010/012 e AUDQ-012.
- [ ] Definir demais campos de sistemas/fornecedores e regras para pendências antigas conforme os IDs do inventário.

## 8. API, documentos e frontend

- [ ] Fechar contrato da primeira entrega: endpoints, DTOs permitidos, responses, enums, datas, paginação, filtros, erros e OpenAPI.
- [ ] Resolver APIQ-003/004/005 e ERRQ-001: PATCH, concorrência, idempotência e repetição de operações. Aplicar DEC-063 para a separação já decidida entre 400 e 422.
- [x] ERRQ-002/003/004 decididas pelas DEC-063/064/066: separação 400/422, mensagens públicas em português com códigos estáveis e política 403/404 contra enumeração de recursos tenant-bound.
- [ ] Resolver APIQ-011 a APIQ-019 antes de consolidar os contratos correspondentes: envelopes, paginação, filtros, parâmetros desconhecidos, resumos, allowedActions, /me, campos desconhecidos e tipos gerados.
- [ ] Resolver APIQ-007, SECQ-005/007/008/009/010, VALQ-004 e INFRAQ-002 antes da futura implementação de uploads. Upload/storage não bloqueia a primeira entrega aprovada.
- [ ] Aprovar estados loading/error/empty, mensagens e preservação dos dados do formulário.
- [ ] Definir biblioteca de componentes, design, idiomas, suporte mobile e acessibilidade: FEQ-001/002/007/008/010/011/012 e UXQ-001/004/007.

## 9. ROPA da primeira entrega; exportações e dashboard em entregas futuras

- [ ] Resolver ROPAQ-001/002/003: granularidade, estados incluídos e significado da última atualização.
- [ ] Garantir dependências de domínio e versão vigente resolvidas, especialmente WFQ-008 e AUDQ-012/013.
- [ ] Resolver ROPAQ-004/005/008 e APIQ-006 antes da futura exportação: filtros, execução síncrona/assíncrona, snapshot consistente, armazenamento e expiração. Exportação não bloqueia a primeira entrega.
- [ ] Decidir ROPA histórico e auditoria de leitura/download/export antes dessas capacidades futuras: ROPAQ-006/007 e AUDQ-005/006/007. A primeira entrega exige somente o ROPA atual.
- [ ] Os itens DASHQ abaixo permanecem para a futura entrega de Dashboard e não bloqueiam a primeira entrega.
- [ ] Aprovar fórmula do percentual e seu denominador: DASHQ-002/003.
- [ ] Definir pendência, início e antiguidade: DASHQ-006/007/008.
- [ ] Definir tratamento de archived, versões em revisão, transferência e compliance pendente/bloqueado: DASHQ-004/005/010/011.
- [ ] Aprovar filtros, escopo e origem das métricas. Dashboard não representa certificação jurídica.

## 10. Auditoria, notificações, testes e operação

- [ ] Definir eventos persistentes, metadata permitida, before/after e transações necessárias antes das mutations correspondentes. Nunca registrar secrets.
- [ ] Definir retenção de auditoria, logs, arquivos e exports: AUDQ-001, OBSQ-004 e INFRAQ-013; separar AuditLog de versões e de logs técnicos.
- [ ] Resolver NOTIFQ-001 a NOTIFQ-009 antes da futura entrega de Notifications. Notifications estão fora da primeira entrega aprovada.
- [ ] Definir casos positivos/negativos, tenant, permission, workflow e audit por entrega. Testes de isolamento continuam obrigatórios por AGENTS.md, mesmo com TESTQ-006 aberto.
- [ ] Resolver TESTQ-001/002/005/006/007/008/009/010 conforme banco real de integração, jornadas, IdP, tipos e volume esperado.
- [ ] Antes de produção, resolver cloud, ambientes, CI/CD, storage, backup e restauração: INFRAQ-001/002/005/006/007/009/010/011/012/013.
- [ ] Antes de produção, definir readiness, logs, métricas, observabilidade e alertas: OBSQ-001 a OBSQ-008; avaliar requisitos de criptografia e gravação de sessão: SECQ-014/016.
- [ ] Definir aprovação operacional de release (RELQ-003), executar a checklist de release e validar restauração/rollback. RPO/RTO e zero downtime não bloqueiam automaticamente a criação do esqueleto local.

## O que já pode começar

Os Slices 1 e 2 já concluíram frontend/backend iniciais, estrutura modular, lint, typecheck, build, ambiente local, health técnico, PostgreSQL, Drizzle, migrations oficiais, persistência estrutural e defesa tenant-aware. A infraestrutura Vitest e os testes PostgreSQL reais também existem. Fornecedor/configuração de CI permanece pendente.

S3.1 e S3.2 implementaram a persistência global restrita de ExternalIdentity/Session e o bootstrap PostgreSQL restrito de Membership. A S3.3 implementou o boundary HTTP que transforma cookie de Session válido em `AuthenticatedIdentity`, sem antecipar tenant. A S3.4 implementou o pipeline HTTP tenant e `AuthorizedTenantContext`, sempre depois de `resolve_membership()`, com abertura de `withTenant()` somente após autorização positiva. Autorização funcional posterior por roles/scopes permanece pendente.

Modelo de negócio, permission matrix, workflow, Compliance Gate específico da entrega, Activity Draft, Mapping Wizard e ROPA ainda dependem das questões correspondentes. O progresso da fundação não transforma essas pendências em decisões de produto.

Não precisam bloquear essa fundação: merge de sistemas/fornecedores, contatos de fornecedores, API pública, clone, tags, design refinado, Redis e filas sem requisito. Quatro itens já estão DEFERRED; os outros só podem ser adiados quando a entrega não depender deles.

## Critério para liberar uma feature

- [ ] Escopo e critérios de aceite verificáveis.
- [ ] Entidades, cardinalidades e invariantes aprovadas.
- [ ] Tenant, permission e scope definidos.
- [ ] Workflow, validações e efeitos de auditoria/versionamento definidos.
- [ ] API e UX necessárias especificadas.
- [ ] Questões estruturais dependentes resolvidas e documentos sincronizados.
- [ ] Estratégia de testes e comandos de verificação preparados.

## Inventário e saneamento — atualização

O inventário de questões e a rastreabilidade de aliases/migrações são mantidos exclusivamente em [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md). As contagens e exemplos acima retratam a revisão inicial de 2026-09-18, anterior ao saneamento; não são a situação atual. Os lotes de reconciliação de IDs foram executados e estão registrados no documento central. O checklist funcional continua sendo orientação de preparação, sem aprovar alternativas.


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

OIDC com provedor gerenciado, fornecedor pendente (Auth0 somente candidato), User interno independente e sem união automática de identidades por e-mail. SSO corporativo será parte da V1 após a primeira entrega. Sessão server-side com cookie opaco; frontend não administra tokens. A sessão identifica User; cada request solicita Organization explicitamente e o backend valida autorização atual. Campos do body não transferem recursos entre tenants. A política temporal e de atividade da Session foi decidida pelas DEC-067/068; o logout da Session atual foi decidido pela DEC-069.

Seções de proposta legadas deste documento devem ser interpretadas sob estas decisões: não constituem aprovação de permissões de escrita, scopes adicionais, fornecedor, topologia do banco ou herança hierárquica. RLS foi aprovado posteriormente em DEC-046. Questões decididas continuam referenciadas para rastreabilidade; pendências parciais estão identificadas no registro central.


## Persistência e defesa tenant-aware aprovadas — 2026-09-18

DEC-044 (DBQ-001): Drizzle é o ORM/query builder aprovado. Queries ficam em repository/persistence; SQL específico é parametrizado, localizado e versionado. Migrations são revisáveis e reproduzíveis desde banco vazio. Não reduzir garantias PostgreSQL para acomodar o ORM.

DEC-045 (DBQ-008): validar relações/autorização na aplicação e garantir coerência tenant-bound por constraints PostgreSQL. Quando necessário, filhos e associações carregam organization_id NOT NULL, unicidades/FKs compostas e índices adequados; usar checks declarativos quando aplicáveis. FK somente por UUID não prova mesmo tenant. organization_id vem do contexto autorizado e não é campo livre para transferência. Preferir constraint declarativa simples a trigger equivalente.

DEC-046 (DBQ-009): RLS adicional nas tabelas tenant-bound, com contexto local à transação, todas as queries da operação no mesmo contexto, ausência de contexto negando acesso e nenhum tenant persistente na conexão. Considerar pooling. Runtime sem superuser/BYPASSRLS/propriedade das tabelas protegidas/alteração de policies; FORCE ROW LEVEL SECURITY quando adequado. Credencial de migration separada do runtime.

Defesa aprovada: Authentication → Membership → Permission → Scope → Repository tenant-aware → PostgreSQL constraints → PostgreSQL RLS. Nenhuma camada substitui outra. Scope de Business Unit continua na autorização da aplicação.

User, ExternalIdentity, Session e outras entidades globais não recebem organization_id artificial. A proteção restrita de ExternalIdentity/Session foi implementada na S3.1 conforme DEC-057; a descoberta da Membership própria foi implementada na fundação PostgreSQL da S3.2 conforme DEC-056, sem policy irrestrita. A S3.4 integrou esse bootstrap ao boundary HTTP; autorização funcional por roles/scopes continua pendente.

Referências legadas a Prisma/Drizzle ou a RLS como alternativas pendentes são históricas: estas três questões estão decididas em DEC-044 a DEC-046. Políticas funcionais, autenticação e features posteriores continuam sujeitas às questões específicas. A topologia física de produção não é escolhida por este registro.

---

---
