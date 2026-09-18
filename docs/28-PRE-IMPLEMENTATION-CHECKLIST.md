# Checklist antes da implementação

Data da revisão: 2026-09-18. Este documento organiza pendências; não aprova alternativas nem substitui as especificações.

## Diagnóstico histórico — anterior ao saneamento

O registro central contém **173 questões reais: 169 OPEN e 4 DEFERRED**. Entre as abertas, são **37 CRITICAL, 53 HIGH, 62 MEDIUM e 17 LOW**. O template XXXQ-001 não entra na contagem. Há **90 identificadores adicionais** referenciados fora do registro central. Eles não representam necessariamente 90 decisões independentes: há duplicações de assuntos e referências sem registro completo.

Há 30 decisões DEC-001 a DEC-030 em [13-DECISIONS.md](13-DECISIONS.md). Elas estabelecem princípios, mas não encerram as questões estruturais relacionadas. Não é necessário fechar todas as pendências antes do primeiro código; fechar as que afetam cada entrega.

## 1. Corrigir a rastreabilidade antes de delegar programação

- [ ] Unificar IDs e significados usando o registro central como referência. Em [03-DATABASE.md](03-DATABASE.md), DBQ-002 a DBQ-009 têm significados diferentes dos mesmos IDs no documento central. Exemplo: DBQ-004 significa múltiplas finalidades no documento de banco, mas soft delete no central.
- [ ] Corrigir AGENTS.md: concorrência aponta para DBQ-004, que no central é soft delete; preservação/soft delete aponta para DBQ-003, que no central é snapshot. Concorrência está em APIQ-004.
- [ ] Revisar a lista de questões em features/ORGANIZATIONS.md: AUTHQ-005 aparece como ADMIN, mas é Membership; SECQ-006 aparece como PLATFORM_ADMIN, mas é RLS. No central, ADMIN é AUTHQ-003 e PLATFORM_ADMIN é AUTHQ-009.
- [ ] Incorporar ou vincular os 90 IDs adicionais do inventário abaixo, agrupando assuntos equivalentes sem apagar a rastreabilidade.
- [ ] Para cada decisão necessária, definir responsável, prazo, entrega bloqueada, alternativas, decisão, justificativa, impacto e data. Registrar em 13-DECISIONS.md e atualizar as especificações afetadas.

## 2. Fechar a primeira entrega e a fundação técnica

- [ ] Confirmar qual é a primeira entrega utilizável e quais itens da V1 entram nela. O escopo atual inclui documentos, exportação, histórico, auditoria e dashboard; não tratar esses itens como opcionais sem registrar redução de escopo.
- [ ] Confirmar PRODQ-001: modelo multi-tenant e Organization como fronteira do tenant.
- [ ] Definir organização do repositório, gerenciador de pacotes, versões de runtime, configuração local, scripts de lint/typecheck/test/build e CI. São escolhas técnicas locais quando não alteram contratos ou comportamento.
- [x] Resolver DBQ-001 antes de implementar persistência com ORM: Drizzle aprovado em DEC-044.
- [ ] Definir PostgreSQL local e de testes, migrations, dados fictícios, configuração de ambiente e validação de variáveis.
- [ ] Escolher a primeira tarefa vertical e seus critérios de aceite. Não gerar todo o schema a partir de cardinalidades propostas.

## 3. Identidade, organizações e autorização

- [ ] Resolver PRODQ-002, AUTHQ-005/006/007/008: usuário multi-organização, role no membership, quantidade de roles e áreas por membership.
- [ ] Resolver SECQ-001/002/003/004, AUTHQ-010 e APIQ-002: provedor, SSO, transporte de autenticação, sessão, MFA, expiração, refresh e revogação.
- [ ] Aprovar matriz de permission + scope para cada operação e recurso: AUTHQ-001/002/003/004/009 e DASHQ-001.
- [ ] Definir como o tenant ativo é selecionado e validado, sem confiar no organizationId enviado pelo cliente.
- [ ] Definir criação de organização, convites/provisionamento, administração de memberships e áreas, desligamento de usuário e revogação de acesso.
- [ ] Resolver ORGQ-001 a ORGQ-005 antes das operações correspondentes: unicidade de área, inativação de área com atividades, permissões de gestão, onboarding e inativação de organização.
- [ ] Aprovar comportamento de recurso fora do escopo dentro do tenant (ERRQ-004). Manter proteção contra exposição de recursos de outro tenant.

## 4. Modelo de dados e catálogos

- [ ] Resolver DQ-001/002/003/004/005: categoria versus item de dado, quantidade de bases legais e finalidades, associação da base legal e granularidade de retenção.
- [ ] Resolver DQ-006/007/008/009, PAQ-002/003 e MWQ-004: catálogos, hierarquia, responsável individual, áreas participantes e fontes de coleta.
- [ ] Resolver DBQ-002/003/004/005/006/007/008/009 conforme o escopo: versões, snapshot, exclusão, catálogos, documentos, finalidade, integridade cross-tenant e RLS.
- [ ] Definir relacionamentos Activity/System/Supplier/Operation, incluindo SYSQ-004/005/006 e SUPQ-003/004. Não cristalizar cardinalidades apenas porque aparecem em exemplos.
- [ ] Aprovar campos, nullability, limites, unicidade, FKs, índices e regras de exclusão dos recursos da primeira entrega.
- [ ] Resolver CATQ-001 a CATQ-012 conforme os catálogos implementados: menores, customização, países, retenção, fontes, destinatários, consentimento, IDs/códigos, enums, ordenação e OTHER.

## 5. Workflow, revisão e versão vigente

- [ ] Resolver WFQ-001/002/003/004/005/006 e BRQ-006/007: estados, destino do submit, revisores, aprovação, REVIEW_REQUIRED e BLOCKED.
- [ ] Aprovar tabela de transições com estado de origem/destino, permission/scope, pré-condições, efeitos e evento de auditoria.
- [ ] Resolver WFQ-007/008, PAQ-007 e DQ-010: edição de ACTIVE, alterações relevantes e manutenção da versão publicada durante revisão.
- [ ] Resolver WFQ-009/010/011/012, BRQ-008/009 e WFQ-013 quando essas operações entrarem na entrega: rejeição, cancelamento, reativação, exclusão, arquivo e revisão periódica.
- [ ] Resolver AUDQ-010/011/012/013: numeração, revisão rejeitada, snapshot de entidades externas e criação da primeira versão.
- [ ] Definir transação e concorrência para publicação, versão vigente e auditoria. Auditoria de mutations não pode esperar uma fase posterior para ser garantida.

## 6. Validação, wizard e Compliance Gate

- [ ] Aprovar lista exata dos campos obrigatórios para salvar draft, submeter e executar/concluir o Gate: PAQ-006 e VALQ-003. Draft deve poder permanecer incompleto.
- [ ] Resolver BRQ-001/002/003/004/005 com responsáveis de produto e avaliação jurídica aplicável: sensíveis, menores, transferência, consentimento e legítimo interesse. Registrar requisitos do software sem inventar conclusões jurídicas.
- [ ] Para cada check, definir aplicabilidade, entradas, PASS, FAIL, REVIEW_REQUIRED, NOT_APPLICABLE e evidências.
- [ ] Definir agregação em ComplianceStatus, condição de BLOCKED e requisitos de ativação no backend.
- [ ] Resolver CGQ-001/002/003/004/005: resolução humana, justificativa, histórico de execuções, invalidação/reexecução e versão/snapshot avaliado.
- [ ] Resolver CGQ-006/007 e APIQ-010 conforme a entrega: configuração, versão de regras e execução automática.
- [ ] Resolver MWQ-001, UXQ-005, FEQ-003/006: dados condicionais antigos, autosave e alterações não salvas.
- [ ] Resolver MWQ-002/003/005, FEQ-004/005 e UXQ-002/006: retomada, progresso, evento de retenção, URLs e cadastro rápido.

## 7. Sistemas e fornecedores

- [ ] Aprovar critérios objetivos de MAPPED: SYSQ-002 e SUPQ-002.
- [ ] Aprovar impacto de PENDING sobre submit, Gate e ativação: BRQ-010, SYSQ-007 e SUPQ-006.
- [ ] Aprovar campos e permissões de Quick Create: SYSQ-011 e SUPQ-011. O cadastro já foi decidido como persistente em DEC-012.
- [ ] Definir papel de privacidade do fornecedor e onde é registrado: SUPQ-003.
- [ ] Definir unicidade, inativação/exclusão, versionamento e efeito sobre atividades publicadas: SYSQ-009/010/012, SUPQ-008/009/010/012 e AUDQ-012.
- [ ] Definir demais campos de sistemas/fornecedores e regras para pendências antigas conforme os IDs do inventário.

## 8. API, documentos e frontend

- [ ] Fechar contrato da primeira entrega: endpoints, DTOs permitidos, responses, enums, datas, paginação, filtros, erros e OpenAPI.
- [ ] Resolver APIQ-003/004/005 e ERRQ-001/002: PATCH, concorrência, idempotência, repetição de operações e 400 versus 422.
- [ ] Resolver APIQ-011 a APIQ-019 antes de consolidar os contratos correspondentes: envelopes, paginação, filtros, parâmetros desconhecidos, resumos, allowedActions, /me, campos desconhecidos e tipos gerados.
- [ ] Resolver APIQ-007, SECQ-005/007/008/009/010, VALQ-004 e INFRAQ-002 antes de uploads: formatos, tamanho, scanning, storage, autorização, download privado e retenção.
- [ ] Aprovar estados loading/error/empty, mensagens e preservação dos dados do formulário.
- [ ] Definir biblioteca de componentes, design, idiomas, suporte mobile e acessibilidade: FEQ-001/002/007/008/010/011/012 e UXQ-001/004/007.

## 9. ROPA, exportações e dashboard — antes dessas features

- [ ] Resolver ROPAQ-001/002/003: granularidade, estados incluídos e significado da última atualização.
- [ ] Garantir dependências de domínio e versão vigente resolvidas, especialmente WFQ-008 e AUDQ-012/013.
- [ ] Resolver ROPAQ-004/005/008 e APIQ-006: filtros, execução síncrona/assíncrona, snapshot consistente, armazenamento e expiração do export.
- [ ] Decidir ROPA histórico e auditoria de leitura/download/export: ROPAQ-006/007 e AUDQ-005/006/007.
- [ ] Aprovar fórmula do percentual e seu denominador: DASHQ-002/003.
- [ ] Definir pendência, início e antiguidade: DASHQ-006/007/008, DASHQ-008 e DASHQ-008.
- [ ] Definir tratamento de archived, versões em revisão, transferência e compliance pendente/bloqueado: DASHQ-004/005/010/011.
- [ ] Aprovar filtros, escopo e origem das métricas. Dashboard não representa certificação jurídica.

## 10. Auditoria, notificações, testes e operação

- [ ] Definir eventos persistentes, metadata permitida, before/after e transações necessárias antes das mutations correspondentes. Nunca registrar secrets.
- [ ] Definir retenção de auditoria, logs, arquivos e exports: AUDQ-001, OBSQ-004 e INFRAQ-013; separar AuditLog de versões e de logs técnicos.
- [ ] Decidir se Notifications entram na primeira entrega. Resolver NOTIFQ-001 a NOTIFQ-009 conforme deduplicação, retenção, inbox multi-org, email, preferências, entrega transacional e tempo real.
- [ ] Definir casos positivos/negativos, tenant, permission, workflow e audit por entrega. Testes de isolamento continuam obrigatórios por AGENTS.md, mesmo com TESTQ-006 aberto.
- [ ] Resolver TESTQ-001/002/005/006/007/008/009/010 conforme banco real de integração, jornadas, IdP, tipos e volume esperado.
- [ ] Antes de produção, resolver cloud, ambientes, CI/CD, storage, backup e restauração: INFRAQ-001/002/005/006/007/009/010/011/012/013.
- [ ] Antes de produção, definir readiness, logs, métricas, observabilidade e alertas: OBSQ-001 a OBSQ-008; avaliar requisitos de criptografia e gravação de sessão: SECQ-014/016.
- [ ] Definir aprovação operacional de release (RELQ-003), executar a checklist de release e validar restauração/rollback. RPO/RTO e zero downtime não bloqueiam automaticamente a criação do esqueleto local.

## O que já pode começar

Segundo [14-IMPLEMENTATION-PLAN.md](14-IMPLEMENTATION-PLAN.md), a Phase 0 pode criar frontend/backend iniciais, estrutura modular, lint, typecheck, runner, CI, ambiente local, health check, erros e logging base, sem assumir regras abertas. Persistência com ORM usa Drizzle (DBQ-001 decidida em DEC-044). DBQ-008/009 também decididas em DEC-045/046. Modelo de negócio, autenticação real, autorização e transições dependem das decisões correspondentes.

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

