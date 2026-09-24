# Segurança

> **Documento:** Segurança da aplicação  
> **Status:** Draft  
> **Projeto:** LGPD Data Mapping Platform  
> **Documentos relacionados:** `01-ARCHITECTURE.md`, `03-DATABASE.md`, `04-AUTHORIZATION.md`, `05-BUSINESS-RULES.md`, `07-API.md`, `08-FRONTEND.md`

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

Seções de proposta legadas deste documento devem ser interpretadas sob estas decisões: não constituem aprovação de permissões de escrita, scopes adicionais, fornecedor, topologia do banco ou herança hierárquica. RLS foi aprovado posteriormente em DEC-046. Questões decididas continuam referenciadas para rastreabilidade; pendências parciais estão identificadas no registro central.


## Persistência e defesa tenant-aware aprovadas — 2026-09-18

DEC-044 (DBQ-001): Drizzle é o ORM/query builder aprovado. Queries ficam em repository/persistence; SQL específico é parametrizado, localizado e versionado. Migrations são revisáveis e reproduzíveis desde banco vazio. Não reduzir garantias PostgreSQL para acomodar o ORM.

DEC-045 (DBQ-008): validar relações/autorização na aplicação e garantir coerência tenant-bound por constraints PostgreSQL. Quando necessário, filhos e associações carregam organization_id NOT NULL, unicidades/FKs compostas e índices adequados; usar checks declarativos quando aplicáveis. FK somente por UUID não prova mesmo tenant. organization_id vem do contexto autorizado e não é campo livre para transferência. Preferir constraint declarativa simples a trigger equivalente.

DEC-046 (DBQ-009): RLS adicional nas tabelas tenant-bound, com contexto local à transação, todas as queries da operação no mesmo contexto, ausência de contexto negando acesso e nenhum tenant persistente na conexão. Considerar pooling. Runtime sem superuser/BYPASSRLS/propriedade das tabelas protegidas/alteração de policies; FORCE ROW LEVEL SECURITY quando adequado. Credencial de migration separada do runtime.

Defesa aprovada: Authentication → Membership → Permission → Scope → Repository tenant-aware → PostgreSQL constraints → PostgreSQL RLS. Nenhuma camada substitui outra. Scope de Business Unit continua na autorização da aplicação.

User, ExternalIdentity e Session são globais, sem organization_id artificial nem acesso runtime irrestrito.

DEC-057 define a fronteira PostgreSQL de ExternalIdentity e Session:

```text
administrative bootstrap
→ cria lgpd_auth_persistence

structural migration
→ cria tabelas, FKs, constraints e índices

administrative auth provisioning
→ valida a role e configura auth_private/functions/grants

runtime
→ executa somente os primitives concedidos
```

`lgpd_auth_persistence` é NOLOGIN e não é concedida ao runtime ou migrator. Runtime não possui DML direto em external_identities, sessions ou users. PUBLIC não possui acesso ao schema privado ou EXECUTE nas functions.

### Criação de primitives SECURITY DEFINER

Quando uma primitive `SECURITY DEFINER` possuir uma role dedicada como owner, o provisionamento administrativo deve, sempre que tecnicamente aplicável, criar/substituir a function sob `SET LOCAL ROLE` da role dedicada, em vez de criá-la como administrador e posteriormente transferir ownership. O estado final não deve exigir membership persistente, `CREATE` persistente ou privilégios administrativos para a role dedicada.

As tabelas globais permanecem sem RLS porque não são tenant-bound. Isso não altera RLS/FORCE RLS das tabelas tenant-bound. Na S3.2, a fundação PostgreSQL da DEC-056 foi implementada por `auth_private.resolve_membership(authenticated_user_id, requested_organization_id)`, com retorno restrito a membershipId + organizationId da Membership ativa correspondente. A function é `SECURITY DEFINER`, pertence à role NOLOGIN `lgpd_membership_bootstrap` e é criada sob `SET LOCAL ROLE` durante provisionamento administrativo, com CREATE em `auth_private` apenas temporário e transacional. Runtime e migrator não são membros da role dedicada; PUBLIC não possui EXECUTE e runtime recebe apenas o EXECUTE específico.

`memberships` continua com ENABLE/FORCE RLS. `tenant_isolation` é direcionada explicitamente ao runtime e `membership_bootstrap_select` aplica-se somente à role dedicada. Essa role recebe apenas SELECT nas colunas `id`, `organization_id`, `user_id` e `active`, sem table-level SELECT, escrita, ownership de `memberships`, BYPASSRLS ou acesso a `users`, `organizations`, `external_identities` e `sessions`. O provisionamento fica separado das migrations e não exigiu migration 0003. A primitive não completa o pipeline HTTP da DEC-052: Session válida, authenticatedUserId, Organization solicitada e contexto autorizado ainda precisam ser ligados pela aplicação.

Referências legadas a Prisma/Drizzle ou a RLS como alternativas pendentes são históricas: estas três questões estão decididas em DEC-044 a DEC-046. Políticas funcionais, autenticação e features posteriores continuam sujeitas às questões específicas. A topologia física de produção não é escolhida por este registro.

---

---


---

## 1. Objetivo

Este documento define os requisitos técnicos de segurança da plataforma.

Abrange:

- autenticação;
- autorização;
- isolamento multi-tenant;
- sessões e tokens;
- proteção de dados;
- uploads;
- object storage;
- APIs;
- banco de dados;
- logs;
- auditoria;
- secrets;
- headers HTTP;
- CORS;
- CSRF;
- XSS;
- SQL Injection;
- rate limiting;
- dependências;
- infraestrutura;
- backups;
- incidentes.

A aplicação trata metadados relacionados ao mapeamento de dados pessoais e documentos potencialmente sensíveis.

Segurança deve ser considerada requisito transversal.

---

# 2. Princípios

Princípios mínimos:

```text
SEC-001  Least Privilege

SEC-002  Defense in Depth

SEC-003  Secure by Default

SEC-004  Deny by Default

SEC-005  Tenant Isolation

SEC-006  Minimize Data

SEC-007  Audit Relevant Actions

SEC-008  Never Trust Client Input

SEC-009  Secrets Outside Source Code

SEC-010  Fail Securely
```

---

# 3. Modelo de ameaça

A aplicação deve considerar pelo menos:

```text
usuário não autenticado

usuário autenticado sem permissão

usuário tentando acessar outro tenant

usuário tentando acessar outra área

IDOR

SQL Injection

XSS

CSRF

upload malicioso

roubo de sessão/token

credential stuffing

brute force

mass assignment

exposição de arquivos

exposição de logs

configuração incorreta

dependência vulnerável

vazamento de secrets
```

---

# 4. Prioridade máxima — isolamento multi-tenant

O risco arquitetural mais crítico é:

```text
Organization A
      ↓
acessa dados
      ↓
Organization B
```

Isso nunca deve ocorrer.

---

# 5. Tenant não vem do cliente

Não confiar em:

```json
{
  "organizationId": "..."
}
```

para definir o tenant efetivo.

O tenant deve ser determinado ou validado a partir do contexto autenticado.

---

# 6. Consultas tenant-aware

Toda consulta de entidade pertencente a uma organização deve considerar o tenant.

Evitar:

```ts
findUnique({
  where: {
    id: activityId
  }
});
```

quando isso puder ignorar o tenant.

Preferir semanticamente:

```text
find activity
WHERE
    id = activityId
AND
    organizationId = currentOrganizationId
```

A implementação concreta depende do ORM escolhido.

---

# 7. Repositórios

Repositórios de entidades tenant-bound devem exigir contexto da organização.

Exemplo conceitual:

```ts
activityRepository.findById({
  organizationId,
  activityId,
});
```

Evitar APIs internas que facilitem consultas sem tenant.

---

# 8. IDOR

UUID não impede IDOR.

Mesmo que IDs sejam difíceis de adivinhar:

```text
GET /activities/:id
```

deve verificar:

```text
autenticação
tenant
permissão
scope
recurso
```

---

# 9. Recurso de outro tenant

Quando um recurso não pertence ao tenant atual, preferir comportamento que não revele sua existência.

Exemplo:

```http
404 Not Found
```

em vez de revelar:

```text
Esse recurso pertence a outra organização.
```

---

# 10. Autenticação

A estratégia definitiva ainda precisa ser escolhida.

Possibilidades:

```text
OIDC
SSO corporativo
sessão
JWT
```

A arquitetura deve permitir evolução para SSO.

---

# 11. Senhas

Se autenticação local for implementada, nunca armazenar:

```text
senha em texto puro
senha criptografada reversivelmente
```

Armazenar somente hash apropriado.

Algoritmos aceitáveis devem ser escolhidos conforme biblioteca/framework de autenticação adotado.

Não implementar algoritmo criptográfico próprio.

---

# 12. Política de senha

Caso exista senha local, política definitiva deve ser definida.

Não criar arbitrariamente regras como:

```text
1 maiúscula
1 minúscula
1 símbolo
trocar a cada 30 dias
```

sem decisão documentada.

Preferir integração com provedor de identidade quando aplicável.

---

# 13. MFA

Suporte a MFA deve ser considerado principalmente para:

```text
DPO
ADMIN
SUPER_ADMIN
```

A obrigatoriedade na V1 ainda deve ser definida.

Se autenticação estiver delegada a IdP/SSO, MFA deve preferencialmente ser controlado pelo provedor.

---

# 14. Sessões

Sessões devem possuir:

```text
expiração
revogação quando suportada
proteção contra reutilização indevida
```

O mecanismo depende da estratégia de autenticação.

Pela DEC-060, somente após validar a Session o mecanismo de autenticação cria `AuthenticatedIdentity`, contendo exclusivamente `sessionId` e `authenticatedUserId`. O valor pode existir temporariamente na request HTTP, mas o controller o passa explicitamente à aplicação. Application, domain e repositories não descobrem identidade ou tenant por `Request`, provider request-scoped, AsyncLocalStorage ou estado global. Organization, Membership e autorização permanecem em fases posteriores.

Pela DEC-061, endpoint protegido retorna sempre 401 com `AUTHENTICATION_REQUIRED` para cookie ausente/inválido ou Session inexistente, expirada ou revogada. A causa específica permanece interna e nunca inclui segredo, cookie, digest ou header `Cookie`. Cookie ausente não é removido; cookie presente que não autentica é expirado conforme o perfil da DEC-059, sem revogação server-side. Endpoints públicos não rejeitam ou limpam cookies apenas por ausência ou invalidade.

---

# 15. Cookies

Para o cookie de Session aprovado em DEC-055, a DEC-059 fixa dois perfis.

Desenvolvimento e teste em HTTP:

```text
name = lgpd_session
HttpOnly = true
SameSite = Lax
Path = /
Secure = false
Domain ausente
```

Produção em HTTPS:

```text
name = __Host-lgpd_session
HttpOnly = true
SameSite = Lax
Path = /
Secure = true
Domain ausente
```

Os nomes são definidos pelo projeto; não criar `SESSION_COOKIE_NAME` arbitrariamente configurável. O backend seleciona o perfil pelo ambiente e deve falhar explicitamente se produção tentar utilizar parâmetros incompatíveis. O frontend não conhece, lê ou persiste o segredo. `__Host-` acrescenta hardening do navegador, mas não substitui CSRF, CORS, revogação server-side ou os demais requisitos da DEC-055.

O segredo bruto não é persistido, conforme DEC-053. Pela DEC-058, o backend calcula `tokenDigest = SHA-256(sessionSecret)`; somente o digest é persistido e fornecido a `resolve_session`. HMAC, Argon2, novo secret operacional, quantidade de bytes, encoding e geração concreta do segredo não foram adotados nesta etapa.

---

# 16. Tokens

Se tokens forem utilizados, não registrar:

```text
access token
refresh token
authorization header
```

em logs.

---

# 17. JWT

Caso JWT seja escolhido:

```text
validar assinatura
validar expiração
validar issuer
validar audience quando aplicável
```

Não apenas decodificar o token.

---

# 18. Refresh Token

Caso exista refresh token:

```text
possuir expiração
possuir mecanismo de revogação quando necessário
ser protegido contra exposição
```

Rotação deve ser considerada conforme solução de autenticação.

---

# 19. LocalStorage

Evitar armazenar tokens sensíveis em:

```text
localStorage
```

quando houver arquitetura mais segura disponível.

A decisão depende do modelo de autenticação escolhido.

---

# 20. Logout

Logout deve invalidar a sessão de acordo com o mecanismo utilizado.

Não tratar logout exclusivamente como:

```ts
localStorage.removeItem('token');
```

quando existir sessão/token revogável no servidor ou IdP.

---

# 21. Autorização

Backend é a fonte de verdade.

Frontend pode ocultar:

```text
botões
menus
ações
```

mas isso não constitui segurança.

---

# 22. Ordem de autorização

Fluxo recomendado:

```text
Authentication
      ↓
Tenant Context
      ↓
Permission
      ↓
Scope
      ↓
Resource
      ↓
Business Rule
```

---

# 23. Deny by default

Se uma permissão não estiver explicitamente concedida:

```text
DENY
```

Não utilizar lógica:

```text
se não encontramos regra, deixa passar
```

---

# 24. Roles

Roles podem agrupar permissões.

Exemplo:

```text
COLLABORATOR
MANAGER
DPO
ADMIN
```

Mas regras de backend devem preferencialmente trabalhar com:

```text
permissions
```

em vez de dezenas de:

```ts
if (role === 'DPO')
```

espalhados.

---

# 25. Escopo por área

Quando o usuário possuir acesso limitado a áreas:

```text
permission
+
businessUnit scope
```

devem ser validados.

Possuir:

```text
processing_activity:read
```

não significa necessariamente poder ler atividades de todas as áreas.

---

# 26. Super Admin

Caso exista `SUPER_ADMIN`, seu acesso deve ser tratado explicitamente.

Não criar automaticamente:

```text
SUPER_ADMIN bypassa tudo
```

sem regra definida.

Especialmente em ambiente multi-tenant, acesso administrativo global exige controles adicionais.

---

# 27. Impersonation

Se futuramente existir:

```text
Entrar como cliente
```

para suporte administrativo, deve existir:

```text
permissão específica
auditoria
identificação clara
motivo quando aplicável
```

Não faz parte automaticamente da V1.

---

# 28. Validação de input

Todo input externo deve ser considerado não confiável.

Inclui:

```text
body
query params
route params
headers
cookies
uploads
webhooks futuros
```

---

# 29. DTO

Backend deve aceitar somente propriedades explicitamente definidas.

Evitar:

```ts
Object.assign(entity, req.body);
```

---

# 30. Mass assignment

Exemplo de ataque:

```json
{
  "name": "Teste",
  "status": "ACTIVE",
  "organizationId": "organization-b",
  "role": "ADMIN"
}
```

Campos não permitidos devem ser ignorados ou rejeitados conforme padrão definido.

---

# 31. SQL Injection

Utilizar:

```text
ORM
queries parametrizadas
prepared statements
```

Não concatenar input em SQL.

Evitar:

```ts
`SELECT * FROM activities WHERE name = '${search}'`
```

---

# 32. Ordenação dinâmica

Mesmo com ORM, parâmetros como:

```text
sort
```

devem utilizar whitelist.

Exemplo:

```text
allowedSortFields = [
  "name",
  "createdAt",
  "updatedAt"
]
```

---

# 33. XSS

Dados digitados por usuários devem ser considerados potencialmente maliciosos.

Exemplo:

```html
<script>alert('xss')</script>
```

React já escapa texto normalmente.

Não utilizar:

```tsx
dangerouslySetInnerHTML
```

sem necessidade e sanitização apropriada.

---

# 34. Rich Text

Se futuramente forem utilizados editores HTML/rich text:

```text
sanitização
```

torna-se obrigatória.

Não confiar no HTML enviado pelo cliente.

---

# 35. CSRF

Operações mutáveis autenticadas por cookie exigem proteção explícita contra CSRF (DEC-055); SameSite=Lax sozinho não é suficiente.

Possíveis mecanismos:

```text
SameSite
CSRF token
Origin validation
```

Validar origem confiável e empregar mecanismo CSRF apropriado; a técnica concreta continua para o desenho técnico.

---

# 36. CORS

Produção deve possuir allowlist explícita.

Exemplo conceitual:

```text
https://app.example.com
```

Evitar:

```text
Access-Control-Allow-Origin: *
```

quando credenciais estiverem envolvidas.

---

# 37. Security Headers

A aplicação deve configurar headers apropriados.

Considerar:

```text
Content-Security-Policy

X-Content-Type-Options

Referrer-Policy

Permissions-Policy

Strict-Transport-Security
```

Configuração definitiva deve considerar infraestrutura e frontend.

---

# 38. CSP

Content Security Policy deve ser adotada progressivamente.

Evitar políticas tão permissivas que eliminem sua utilidade.

Exemplo a evitar:

```text
script-src *
```

Configuração deve considerar:

```text
Vite bundles
analytics se existirem
SSO
storage
APIs externas
```

---

# 39. HTTPS

Produção deve utilizar:

```text
HTTPS
```

Tráfego HTTP deve ser redirecionado quando aplicável.

---

# 40. TLS

Configuração TLS deve ser responsabilidade da camada apropriada:

```text
load balancer
reverse proxy
cloud provider
```

Não implementar criptografia de transporte manualmente na aplicação.

---

# 41. Uploads

Uploads são superfície crítica.

Arquivos enviados devem ser tratados como não confiáveis.

---

# 42. Tipos permitidos

Cada tipo de upload deve possuir allowlist.

Exemplo para documentos:

```text
PDF
```

Outros formatos somente quando houver necessidade funcional.

Não aceitar:

```text
qualquer arquivo
```

por padrão.

---

# 43. Extensão não é suficiente

Não confiar somente em:

```text
arquivo.pdf
```

Validar também:

```text
MIME type
assinatura/magic bytes quando aplicável
```

---

# 44. Tamanho máximo

Uploads devem possuir limite de tamanho.

O valor ainda precisa ser definido.

Exemplo:

```text
MAX_UPLOAD_SIZE = configuração
```

Não hardcodar valores arbitrários sem decisão.

---

# 45. Nome do arquivo

Não utilizar diretamente o nome enviado pelo usuário como caminho físico.

Exemplo perigoso:

```text
../../config/secrets.env
```

Object storage deve utilizar chave gerada internamente.

---

# 46. Nome original

O nome original pode ser armazenado como metadata para exibição.

Exemplo:

```text
storageKey = generated-value
originalName = termo-consentimento.pdf
```

---

# 47. Object Storage

Arquivos privados não devem ser públicos por padrão.

Bucket/container:

```text
PRIVATE
```

---

# 48. Storage key

Chaves podem incorporar tenant de forma controlada.

Exemplo conceitual:

```text
organizations/{organizationId}/attachments/{uuid}
```

Mas isso não substitui autorização.

---

# 49. Download

Antes de gerar acesso ao arquivo:

```text
autenticar
validar tenant
validar permissão
validar recurso relacionado
```

---

# 50. Signed URLs

Se utilizadas:

```text
expiração curta
acesso ao objeto específico
HTTPS
```

Nunca gerar URL permanente para conteúdo privado.

---

# 51. Malware

Antivírus/malware scanning para uploads deve ser avaliado.

Especialmente se a plataforma aceitar documentos enviados por múltiplos usuários.

Decisão de V1 ainda aberta.

---

# 52. Documentos com dados pessoais reais

A plataforma não deve incentivar uploads contendo dados reais quando apenas um modelo é necessário.

Exemplo:

Preferir:

```text
modelo do formulário
```

em vez de:

```text
documento preenchido de um titular real
```

---

# 53. Metadados de arquivos

Registrar quando aplicável:

```text
id
organizationId
storageKey
originalName
mimeType
size
uploadedBy
createdAt
relatedEntity
```

---

# 54. Exclusão de arquivos

Exclusão deve considerar:

```text
auditoria
versionamento
retenção
referências
```

Não apagar automaticamente um arquivo apenas porque foi removido visualmente de um formulário.

---

# 55. Banco de dados

Banco não deve ficar publicamente exposto à internet sem necessidade.

Preferir acesso por rede privada/controlada.

---

# 56. Credenciais do banco

Nunca armazenar em:

```text
Git
Dockerfile
frontend
README público
```

Utilizar secrets/env conforme ambiente.

---

# 57. Usuário do banco

Aplicação deve utilizar credencial com privilégios necessários, evitando privilégios administrativos desnecessários.

---

# 58. Migrações

Usuário de migration pode possuir privilégios diferentes do usuário runtime da aplicação quando a infraestrutura permitir.

---

# 59. Backup

Banco deve possuir estratégia de backup.

Definir:

```text
frequência
retenção
local
criptografia
teste de restauração
```

---

# 60. Backup sem restore não é garantia

A estratégia deve incluir teste periódico de restauração.

Objetivo:

```text
backup criado
+
backup restaurável
```

---

# 61. Criptografia em repouso

Banco, backups e object storage devem utilizar criptografia em repouso quando suportada pela infraestrutura escolhida.

Preferir mecanismos gerenciados pelo provedor.

---

# 62. Criptografia de campos

Não criptografar individualmente todas as colunas sem necessidade.

Field-level encryption pode ser considerada para dados especialmente sensíveis.

A necessidade deve ser avaliada após definição do modelo final.

---

# 63. Secrets

Secrets incluem:

```text
DATABASE_URL
JWT secrets
OIDC client secret
S3 credentials
SMTP credentials
API keys
encryption keys
```

---

# 64. Secrets por ambiente

Utilizar valores diferentes para:

```text
development
staging
production
```

Nunca reutilizar credenciais de produção em desenvolvimento.

---

# 65. `.env`

Arquivos locais como:

```text
.env
```

não devem ser versionados quando contiverem secrets.

Pode existir:

```text
.env.example
```

com valores fictícios.

---

# 66. Frontend secrets

Tudo que é enviado para o bundle frontend deve ser considerado público.

Nunca colocar segredo real em:

```text
VITE_SECRET
```

ou equivalente.

---

# 67. Logs

Logs devem auxiliar diagnóstico sem se tornar fonte de vazamento.

---

# 68. Não registrar

Evitar logs contendo:

```text
password
access token
refresh token
cookie
authorization header
document contents
full request body
full response body
secrets
```

---

# 69. Dados pessoais em logs

Não registrar dados pessoais desnecessariamente.

Exemplo ruim:

```text
User submitted CPF 123...
```

Preferir identificadores técnicos quando suficientes.

---

# 70. Logging estruturado

Preferir:

```json
{
  "level": "info",
  "event": "PROCESSING_ACTIVITY_UPDATED",
  "requestId": "...",
  "actorId": "...",
  "organizationId": "...",
  "activityId": "..."
}
```

---

# 71. Request ID

Cada request deve possuir identificador de correlação.

Exemplo:

```text
X-Request-Id
```

O mesmo identificador deve aparecer nos logs relacionados.

---

# 72. Stack traces

Stack traces podem ser registrados internamente.

Não devem ser retornados para o cliente em produção.

---

# 73. Auditoria != log técnico

Separar:

```text
Application Logs
```

de:

```text
Audit Logs
```

Logs técnicos:

```text
erro de conexão
tempo de request
exception
```

Audit logs:

```text
atividade alterada
usuário alterado
gate executado
atividade arquivada
```

---

# 74. Audit Log

Audit logs devem ser append-only no nível da aplicação.

Não disponibilizar endpoint comum de:

```text
UPDATE audit_log
DELETE audit_log
```

---

# 75. Integridade de auditoria

A possibilidade de controles adicionais contra alteração de audit logs deve ser avaliada conforme requisitos de compliance.

Não inventar mecanismo criptográfico próprio.

---

# 76. Rate Limiting

Aplicar principalmente em:

```text
login
password reset
MFA
convites
endpoints públicos futuros
```

Pode também existir proteção geral da API.

---

# 77. Brute Force

Se existir login local, implementar proteção contra tentativas repetidas.

Possíveis mecanismos:

```text
rate limit
progressive delay
temporary lock
IdP protection
```

A estratégia depende do sistema de autenticação.

---

# 78. Enumeração de usuários

Fluxos de recuperação de senha não devem revelar desnecessariamente se um e-mail existe.

Exemplo preferível:

```text
Se houver uma conta correspondente, enviaremos as instruções.
```

---

# 79. Convites

Se usuários forem convidados:

```text
token de convite
expiração
uso único
```

devem ser considerados.

O fluxo depende da autenticação escolhida.

---

# 80. Dependências

Dependências devem ser mantidas atualizadas.

Utilizar ferramentas automatizadas quando possível.

Exemplos:

```text
Dependabot
Renovate
npm audit
```

A ferramenta concreta ainda pode ser escolhida.

---

# 81. Nova dependência

Antes de adicionar uma dependência:

```text
ela é necessária?

o projeto já possui solução?

é mantida?

possui vulnerabilidades conhecidas relevantes?

qual impacto no bundle?
```

---

# 82. Lockfile

O lockfile deve ser versionado.

Exemplo:

```text
package-lock.json
pnpm-lock.yaml
yarn.lock
```

conforme package manager escolhido.

---

# 83. CI

Pipeline deve executar pelo menos:

```text
lint
typecheck
tests
build
```

Verificações de segurança podem ser adicionadas.

---

# 84. Secret scanning

Repositório deve considerar secret scanning.

Exemplo:

```text
GitHub secret scanning
gitleaks
```

Ferramenta concreta depende do ambiente.

---

# 85. SAST

Análise estática de segurança pode ser incorporada ao CI.

Exemplos possíveis:

```text
CodeQL
Semgrep
```

Não é obrigatório utilizar múltiplas ferramentas simultaneamente.

---

# 86. Containers

Se Docker for utilizado:

```text
imagem mínima
dependências necessárias
usuário não-root quando possível
sem secrets na imagem
```

---

# 87. Dockerfile

Evitar:

```dockerfile
ENV DATABASE_PASSWORD=production-password
```

Secrets devem ser injetados em runtime.

---

# 88. Imagens

Fixar versões adequadamente.

Evitar depender indefinidamente de:

```text
latest
```

em produção.

---

# 89. Redis

Caso Redis seja utilizado:

```text
não expor publicamente
autenticação/configuração adequada
TLS quando aplicável
```

Não armazenar informação sensível desnecessariamente.

---

# 90. Filas

Jobs devem receber apenas os dados necessários.

Evitar colocar documentos completos ou secrets diretamente no payload da fila quando uma referência segura for suficiente.

---

# 91. Exportação ROPA

Exportações podem conter informações internas relevantes.

Antes de exportar:

```text
autenticação
autorização
tenant
scope
filtros
```

devem ser aplicados.

---

# 92. Arquivo exportado

Se exportações forem armazenadas temporariamente:

```text
storage privado
expiração
download autorizado
limpeza posterior
```

devem ser considerados.

---

# 93. Cache

Caches devem considerar tenant.

Chave ruim:

```text
activity:123
```

Preferir semanticamente:

```text
organization:{orgId}:activity:{activityId}
```

quando cache compartilhado for utilizado.

---

# 94. Cache do frontend

Ao trocar organização:

```text
invalidar/remover queries relacionadas ao tenant anterior
```

Não permitir que dados da organização anterior apareçam temporariamente para a nova organização.

---

# 95. Error handling

Erros internos não devem revelar:

```text
nome de tabela
SQL
stack trace
filesystem path
storage key
secret
infraestrutura
```

---

# 96. Health endpoints

Endpoint público de health deve retornar somente o necessário.

Exemplo:

```json
{
  "status": "ok"
}
```

Evitar:

```json
{
  "database": "postgresql://user:password@..."
}
```

---

# 97. Ambiente de desenvolvimento

Segurança de desenvolvimento pode ser menos restritiva em alguns pontos, mas nunca utilizar:

```text
dados reais de produção
secrets reais de produção
```

sem processo explicitamente autorizado.

---

# 98. Seed

Seeds devem utilizar dados fictícios.

Exemplo:

```text
Empresa Exemplo Ltda.
Usuário Teste
Fornecedor Exemplo
```

---

# 99. Staging

Staging deve possuir:

```text
credenciais próprias
banco próprio
storage próprio
```

Preferencialmente sem dados pessoais reais.

---

# 100. Produção

Produção deve possuir controles adicionais:

```text
HTTPS
backup
monitoramento
logs
secrets seguros
acesso restrito
alertas
```

---

# 101. Acesso à infraestrutura

Acesso administrativo deve seguir princípio de menor privilégio.

Evitar contas compartilhadas como:

```text
admin@empresa
```

quando a infraestrutura permitir identidade individual.

---

# 102. Produção pelo desenvolvedor

Acesso direto de desenvolvedores ao banco de produção deve ser restrito.

Quando necessário:

```text
acesso autorizado
tempo limitado quando possível
auditável
```

---

# 103. Observabilidade

Monitoramento deve permitir identificar:

```text
erros
latência
indisponibilidade
falhas de jobs
falhas de login
```

sem capturar dados desnecessários.

---

# 104. Alertas de segurança

Considerar alertas para eventos como:

```text
muitas falhas de login

picos de 403

tentativas repetidas de acesso entre tenants

falhas anormais de upload

erros de autorização
```

Não interpretar automaticamente cada evento como ataque.

---

# 105. Incidentes

Deve existir processo organizacional para incidentes.

A aplicação deve facilitar investigação através de:

```text
logs
audit logs
timestamps
actorId
requestId
organizationId
```

---

# 106. Exclusão

Exclusões devem considerar:

```text
histórico
auditoria
retenção
backup
object storage
```

Não implementar:

```text
DELETE CASCADE
```

indiscriminadamente em entidades de negócio.

---

# 107. Soft Delete

Soft delete pode ser utilizado em determinadas entidades.

Exemplo:

```text
deletedAt
```

Mas não deve ser aplicado automaticamente a todas as tabelas.

A decisão por entidade deve ser definida em `03-DATABASE.md`.

---

# 108. Privacidade por design

A aplicação deve coletar apenas os dados necessários para sua finalidade.

Exemplo:

Se para cadastrar um sistema basta:

```text
nome
descrição
fornecedor
```

não solicitar informações adicionais sem necessidade.

---

# 109. Dados do usuário

Informações do usuário devem ser limitadas ao necessário.

Exemplo inicial:

```text
name
email
organization
role/membership
business units
```

---

# 110. Dados de titulares

A plataforma V1 deve mapear:

```text
categorias
fluxos
finalidades
sistemas
```

e não funcionar como banco dos titulares.

Evitar entidades como:

```text
Person
CustomerPersonalData
EmployeeCPF
```

sem requisito futuro explícito.

---

# 111. Segurança do Compliance Gate

O frontend não pode enviar:

```json
{
  "complianceStatus": "COMPLETE"
}
```

para declarar conformidade.

O status deve ser calculado/validado pelo backend.

---

# 112. Segurança de workflow

Da mesma forma:

```json
{
  "status": "ACTIVE"
}
```

não deve ativar diretamente uma atividade.

Utilizar caso de uso específico:

```text
activateActivity()
```

---

# 113. Auditoria de ações críticas

Devem ser auditadas quando aplicável:

```text
mudança de permissões

mudança de role

mudança de área

ativação de atividade

arquivamento

execução/aprovação de compliance

alteração relevante de atividade

upload/remoção de documento relevante

mudança de configuração de segurança
```

---

# 114. Auditoria de leitura

Auditar toda leitura pode gerar volume elevado.

A necessidade deve ser avaliada por recurso.

Pode ser relevante para:

```text
downloads
documentos
exports
acessos administrativos especiais
```

Não ativar auditoria detalhada de cada GET sem necessidade.

---

# 115. Segurança de exportações

Exportações devem aplicar exatamente o mesmo escopo de acesso da interface/API.

Exemplo:

Gestor limitado ao RH não deve conseguir exportar atividades de Financeiro manipulando parâmetros.

---

# 116. Proteção contra CSV Injection

Se houver exportação CSV futuramente, valores iniciados por caracteres interpretáveis como fórmula devem ser tratados adequadamente.

Exemplos:

```text
=
+
-
@
```

Para Excel/XLSX, dados inseridos em células também devem ser tratados de forma segura conforme biblioteca utilizada.

---

# 117. SSRF

Se futuramente a aplicação permitir importar dados a partir de URL:

```text
https://...
```

deve existir proteção contra SSRF.

Não permitir que usuários façam o backend acessar arbitrariamente:

```text
localhost
metadata services
rede interna
```

Esse fluxo não faz parte da V1 atual.

---

# 118. Webhooks

Caso existam futuramente:

```text
assinatura
secret
timestamp
proteção contra replay
idempotência
```

devem ser considerados.

---

# 119. APIs externas

Credenciais para integrações externas devem permanecer no backend.

Nunca enviar:

```text
API_SECRET
CLIENT_SECRET
```

ao navegador.

---

# 120. SSO

Quando SSO for implementado:

```text
state
nonce
PKCE
redirect URI validation
issuer validation
```

devem seguir a biblioteca/provedor escolhido.

Não implementar protocolo OIDC/SAML manualmente.

---

# 121. Open Redirect

Parâmetros como:

```text
returnUrl
redirect
```

devem ser validados.

Não permitir:

```text
/login?returnUrl=https://site-malicioso.example
```

sem regra de allowlist.

---

# 122. Clickjacking

A aplicação deve impedir embedding não autorizado quando não houver requisito para funcionar dentro de iframe.

Pode ser controlado por:

```text
Content-Security-Policy frame-ancestors
```

---

# 123. MIME sniffing

Utilizar:

```text
X-Content-Type-Options: nosniff
```

quando apropriado.

Especialmente importante para conteúdo enviado por usuários.

---

# 124. Cache HTTP

Responses contendo informações privadas não devem ser armazenadas em caches públicos.

Configurar:

```text
Cache-Control
```

adequadamente para endpoints sensíveis.

---

# 125. Dados no browser history

Evitar colocar informações sensíveis diretamente em query strings.

Exemplo ruim:

```text
?cpf=...
```

URLs podem aparecer em:

```text
history
logs
analytics
referrer
```

---

# 126. Analytics

Caso analytics seja adicionado, revisar quais dados são enviados.

Não enviar automaticamente:

```text
conteúdo de formulários
nomes de documentos
dados pessoais
tokens
```

---

# 127. Ferramentas de session replay

Ferramentas que gravam sessões devem ser avaliadas com atenção.

Se utilizadas:

```text
masking
redaction
exclusão de campos
```

devem ser configurados.

Não habilitar session replay indiscriminadamente.

---

# 128. Desenvolvimento assistido por IA

Código gerado por IA deve seguir as mesmas regras de segurança.

Agentes não devem:

```text
desabilitar autenticação para fazer teste passar

remover autorização temporariamente

usar organizationId enviado pelo frontend como verdade

criar endpoint administrativo sem permission check

adicionar secrets no código

usar SQL concatenado

tornar bucket público

desabilitar CORS/CSRF indiscriminadamente

usar dangerouslySetInnerHTML sem necessidade

registrar request.body inteiro

ignorar erro de TypeScript relacionado à segurança
```

---

# 129. Regra para correções rápidas

Nunca resolver um problema com:

```text
"temporariamente vamos liberar tudo"
```

sem que isso esteja explicitamente isolado ao ambiente de desenvolvimento.

Mesmo em desenvolvimento, não versionar bypass inseguro que possa chegar a produção.

---

# 130. Testes de segurança

Devem existir testes automatizados para regras críticas.

Especialmente:

```text
tenant isolation
authorization
scope
workflow
mass assignment
uploads
```

---

# 131. Teste crítico — tenant

```text
Given:

User A pertence à Organization A

Activity B pertence à Organization B

When:

User A solicita Activity B

Then:

nenhum dado de Activity B é retornado
```

---

# 132. Teste crítico — atualização

```text
Given:

User A pertence à Organization A

When:

PATCH Activity da Organization B

Then:

alteração é rejeitada
```

---

# 133. Teste crítico — mass assignment

Request:

```json
{
  "name": "Teste",
  "organizationId": "organization-b",
  "status": "ACTIVE"
}
```

Resultado:

```text
organizationId não muda
status não muda
```

ou request é rejeitado conforme política escolhida.

---

# 134. Teste crítico — compliance

```text
Given:

complianceStatus = PENDING

When:

usuário tenta ativar atividade

Then:

ACTIVITY_NOT_COMPLIANT
```

---

# 135. Teste crítico — arquivo

```text
Given:

File pertence à Organization B

When:

User Organization A solicita download

Then:

arquivo não é disponibilizado
```

---

# 136. Teste crítico — área

```text
Given:

User possui acesso somente ao RH

Activity pertence ao Financeiro

When:

User tenta editar Activity

Then:

operação é rejeitada
```

---

# 137. Checklist de endpoint

Para cada novo endpoint:

```text
[ ] precisa autenticação?

[ ] qual permission?

[ ] possui tenant?

[ ] possui scope?

[ ] valida IDs?

[ ] valida input?

[ ] existe risco de mass assignment?

[ ] retorna dados desnecessários?

[ ] precisa audit log?

[ ] precisa rate limit?

[ ] possui testes negativos?
```

---

# 138. Checklist de upload

```text
[ ] usuário autenticado

[ ] tenant validado

[ ] permissão validada

[ ] MIME permitido

[ ] extensão permitida

[ ] tamanho validado

[ ] storage privado

[ ] nome seguro

[ ] metadata registrada

[ ] download protegido

[ ] malware scanning definido

[ ] política de remoção definida
```

---

# 139. Checklist de produção

```text
[ ] HTTPS

[ ] secrets fora do Git

[ ] CORS configurado

[ ] headers configurados

[ ] banco não exposto

[ ] storage privado

[ ] backups configurados

[ ] restore testado

[ ] logs configurados

[ ] audit logs configurados

[ ] rate limiting onde necessário

[ ] dependências verificadas

[ ] debug desabilitado

[ ] stack traces ocultos

[ ] usuários administrativos revisados

[ ] tenant isolation testado
```

---

# 140. Questões abertas

Registrar também em `12-OPEN-QUESTIONS.md`.

### SECQ-001 — Autenticação

Qual mecanismo será utilizado na V1?

```text
login local
OIDC
SSO
```

**Impacto:** crítico.

---

### SECQ-001 — IdP

Caso exista SSO, qual provedor?

Exemplos:

```text
Microsoft Entra ID
Keycloak
Auth0
outro
```

**Impacto:** alto.

---

### SECQ-003 — MFA

MFA será obrigatório?

Para quais perfis?

**Impacto:** alto.

---

### SECQ-002 — Sessão

Utilizar:

```text
cookie
JWT
```

?

**Impacto:** alto.

---

### AUTHQ-006 — Multi-organização

Um usuário poderá pertencer a múltiplas organizações?

**Impacto:** crítico.

---

### AUTHQ-009 / SECQ-018 — Super Admin

Existirá acesso administrativo global?

Quais controles adicionais serão exigidos?

**Impacto:** crítico.

---

### SECQ-007 — Upload

Quais formatos serão aceitos?

**Impacto:** médio.

---

### VALQ-004 — Upload size

Qual tamanho máximo?

**Impacto:** baixo.

---

### SECQ-005 — Malware scanning

A V1 terá antivírus para uploads?

**Impacto:** médio/alto.

---

### INFRAQ-002 — Storage

Qual object storage será utilizado?

```text
AWS S3
Azure Blob
MinIO
outro
```

**Impacto:** médio.

---

### AUDQ-001 — Audit retention

Por quanto tempo audit logs serão mantidos?

**Impacto:** alto.

---

### OBSQ-004 — Application logs

Qual será a retenção dos logs técnicos?

**Impacto:** médio.

---

### INFRAQ-007 — Backup

Definir:

```text
frequência
retenção
RPO
RTO
```

**Impacto:** alto.

---

### SECQ-014 — Criptografia

Existe requisito para field-level encryption?

**Impacto:** médio/alto.

---

### AUDQ-005 — Auditoria de leitura

Quais recursos exigem auditoria de leitura/download?

**Impacto:** médio.

---

### SECQ-016 — Session replay

Alguma ferramenta de gravação de sessão será utilizada?

**Impacto:** médio.

---

# 141. Definition of Done de segurança

Uma feature não deve ser considerada concluída apenas porque funciona no fluxo positivo.

Deve considerar:

```text
funcionalidade
+
autenticação
+
autorização
+
tenant isolation
+
validação
+
tratamento seguro de erros
+
auditoria quando necessária
+
testes negativos
```

---

# 142. Regra final para agentes de IA

Ao implementar qualquer funcionalidade que manipule recurso de negócio, responder internamente às seguintes perguntas:

```text
Quem está fazendo?

Em qual organização?

Possui permissão?

Possui escopo?

O recurso pertence à organização?

O estado permite a operação?

O input é válido?

A ação precisa ser auditada?
```

Se alguma dessas respostas depender de uma regra ainda não definida:

```text
NÃO inventar a regra.
```

Consultar:

```text
12-OPEN-QUESTIONS.md
```

---

# 143. Próximo documento

Os requisitos de eventos de auditoria, estrutura dos registros, histórico, rastreabilidade, diferenças entre audit log e versionamento e política de consulta serão definidos em:

`10-AUDIT.md`
