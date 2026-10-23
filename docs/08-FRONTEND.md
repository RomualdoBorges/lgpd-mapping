# Frontend — Arquitetura, UX e Padrões

> **Documento:** Especificação do frontend  
> **Status:** Draft  
> **Projeto:** LGPD Data Mapping Platform  
> **Stack proposta:** React + TypeScript + Vite + Tailwind CSS  
> **Documentos relacionados:** `01-ARCHITECTURE.md`, `04-AUTHORIZATION.md`, `05-BUSINESS-RULES.md`, `06-WORKFLOWS.md`, `07-API.md`

> **Question IDs:** referências canônicas em `12-OPEN-QUESTIONS.md`; migrações dos IDs locais registradas por documento de origem no registro central. Perguntas e recomendações locais não encerram essas questões.


## Primeiro frontend shell — recorte aprovado

[DEC-071](13-DECISIONS.md#dec-071--escolhas-técnicas-e-escopo-do-primeiro-frontend-shell), aprovada em 2026-10-23, registra Tailwind CSS com plugin Vite, componentes próprios e HTML semântico exclusivamente para o primeiro shell, React Router declarativo para a base frontend, Lucide React e Vitest + Testing Library para testes comportamentais. FEQ-013 está DECIDED; FEQ-001 permanece OPEN para a biblioteca global.

Direção visual: SaaS moderno e minimalista, tema claro, cores neutras e detalhes em azul/índigo. Tokens locais e provisórios; FEQ-002 e FEQ-010 continuam OPEN. Não se afirma existência de design system corporativo aprovado ou de Figma oficial.

Escopo aprovado: App, AppLayout, Sidebar responsiva, Header, HomePage informativa, EmptyState reutilizável, NotFoundPage, rota `/` e fallback, com acessibilidade básica. Não inclui login ou autenticação fictícia, autenticação real, seletor de Organization (FEQ-015 OPEN), permissões funcionais, métricas simuladas, endpoints não existentes ou navegação para módulos indisponíveis. A lista candidata de módulos em seções legadas não autoriza exibi-los neste shell.

Estado: escolhas registradas; implementação, instalação de dependências e testes do shell ainda pendentes. Este registro não altera a conclusão estrutural da S3.5 nem declara autenticação ou autorização frontend implementadas.

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

Este documento define a arquitetura e os padrões do frontend da plataforma.

Abrange:

- estrutura do projeto;
- páginas;
- navegação;
- componentes;
- formulários;
- wizard;
- estado local;
- estado remoto;
- autorização visual;
- tratamento de erros;
- loading;
- acessibilidade;
- responsividade;
- padrões para agentes de IA.

O frontend deve representar as regras definidas pelo backend, e não recriar uma segunda fonte de verdade para regras de negócio.

---

# 2. Stack

Stack inicial proposta:

```text
React
TypeScript
Vite
Tailwind CSS
TanStack Query
React Hook Form
Zod
Zustand
```

Responsabilidades:

```text
React
    UI

TypeScript
    tipagem

Vite
    build/dev server

Tailwind
    estilos

TanStack Query
    server state

React Hook Form
    formulários

Zod
    validação estrutural

Zustand
    estado global exclusivamente quando necessário
```

---

# 3. Princípio principal

Separar:

```text
Server State
```

de:

```text
Client State
```

Server State inclui:

```text
atividades
usuários
áreas
sistemas
fornecedores
ROPA
dashboard
compliance
```

Esses dados pertencem ao backend.

Devem preferencialmente ser gerenciados por:

```text
TanStack Query
```

---

# 4. Estado local

Estado exclusivamente de interface pode permanecer no React.

Exemplos:

```text
modal aberto
aba selecionada
step atual
menu aberto
campo temporário
```

Utilizar:

```text
useState
```

ou estado do componente quando suficiente.

---

# 5. Zustand

Não utilizar Zustand como substituto do TanStack Query.

Bom uso:

```text
preferências temporárias de UI
estado compartilhado entre componentes distantes
estado global puramente frontend
```

Evitar:

```text
activitiesStore
suppliersStore
systemsStore
usersStore
```

quando esses dados já são obtidos pela API.

---

# 6. Estrutura sugerida

```text
src/
├── app/
│   ├── router/
│   ├── providers/
│   └── layouts/
│
├── components/
│   ├── ui/
│   ├── feedback/
│   └── layout/
│
├── features/
│   ├── auth/
│   ├── organizations/
│   ├── business-units/
│   ├── processing-activities/
│   ├── mapping-wizard/
│   ├── compliance/
│   ├── ropa/
│   ├── dashboard/
│   ├── systems/
│   ├── suppliers/
│   ├── users/
│   └── audit/
│
├── hooks/
├── lib/
├── services/
├── types/
└── main.tsx
```

---

# 7. Organização por feature

Cada domínio relevante deve possuir estrutura própria.

Exemplo:

```text
features/
└── processing-activities/
    ├── api/
    ├── components/
    ├── hooks/
    ├── pages/
    ├── schemas/
    ├── types/
    └── utils/
```

Não criar todas as funcionalidades dentro de:

```text
components/
```

global.

---

# 8. Components/UI

`components/ui` deve conter componentes genéricos.

Exemplos:

```text
Button
Input
Select
Checkbox
Radio
Textarea
Modal
Drawer
Table
Badge
Tabs
Tooltip
Pagination
Skeleton
Alert
```

Esses componentes não devem conhecer regras específicas de LGPD.

---

# 9. Componentes de domínio

Componentes específicos pertencem à feature.

Exemplo:

```text
features/compliance/components/ComplianceStatusBadge.tsx

features/processing-activities/components/ActivityStatusBadge.tsx

features/ropa/components/RopaTable.tsx
```

---

# 10. Pages

Uma página coordena:

```text
route
queries
layout
componentes
ações
```

Evitar colocar toda a implementação da feature diretamente na page.

Exemplo ruim:

```text
ProcessingActivityPage.tsx
3000 linhas
```

Preferir composição.

---

# 11. Rotas principais

Estrutura inicial:

```text
/login

/dashboard

/activities
/activities/new
/activities/:activityId
/activities/:activityId/mapping
/activities/:activityId/history

/ropa

/systems
/systems/:systemId

/suppliers
/suppliers/:supplierId

/admin/users
/admin/business-units
```

Rotas finais dependem das permissões e decisões de produto.

---

# 12. Layout autenticado

Estrutura sugerida:

```text
┌────────────────────────────────────────────┐
│ Header                                     │
├──────────────┬─────────────────────────────┤
│              │                             │
│ Sidebar      │ Content                     │
│              │                             │
│              │                             │
└──────────────┴─────────────────────────────┘
```

Sidebar pode conter:

```text
Dashboard
Atividades
ROPA
Sistemas
Fornecedores
Administração
```

Itens devem respeitar as permissões do usuário.

---

# 13. Navegação por permissão

Exemplo:

Usuário sem:

```text
dashboard:read
```

não deve visualizar:

```text
Dashboard
```

no menu.

Isso melhora a UX, mas não substitui autorização no backend.

---

# 14. Tela inicial

Após autenticação, a aplicação deve carregar o contexto do usuário.

Endpoint sugerido:

```text
GET /api/v1/me
```

Informações:

```text
user
organization
roles
permissions
businessUnits
```

Somente depois disso a aplicação deve montar a navegação autorizada.

---

# 15. Contexto da organização

Caso usuários possam pertencer a múltiplas organizações, deve existir seletor explícito.

Exemplo:

```text
┌────────────────────────────┐
│ Empresa ABC             ▼  │
└────────────────────────────┘
```

Ao trocar organização:

```text
invalidar queries
limpar caches dependentes do tenant
carregar permissões
carregar áreas
redirecionar se necessário
```

Não implementar até que multi-organização seja confirmado.

---

# 16. Lista de atividades

Página:

```text
/activities
```

Deve permitir visualizar inicialmente:

```text
Nome
Área
Status
Compliance
Última atualização
```

Possíveis filtros:

```text
Busca
Área
Status
Compliance
Dados sensíveis
Menores
Transferência internacional
```

---

# 17. Exemplo conceitual

```text
Atividades de tratamento

[ Buscar atividade... ]  [Área ▼] [Status ▼]

┌───────────────────────────────────────────────────────────┐
│ Atividade           Área       Status      Compliance    │
├───────────────────────────────────────────────────────────┤
│ Recrutamento        RH         Ativa       Completo      │
│ Folha pagamento     RH         Mapeando    Pendente      │
│ Newsletter          Marketing  Revisão     Pendente      │
└───────────────────────────────────────────────────────────┘
```

---

# 18. Status visual

Não utilizar apenas cor para representar estado.

Exemplo:

```text
● Completo
```

deve possuir também texto.

Estados possíveis:

```text
DRAFT
MAPPING
PENDING_REVIEW
COMPLIANCE_PENDING
ACTIVE
UNDER_REVIEW
ARCHIVED
```

A interface deve traduzir os códigos.

Exemplo:

```text
DRAFT → Rascunho
MAPPING → Em mapeamento
ACTIVE → Ativa
```

---

# 19. Compliance visual

Representação inicial:

```text
COMPLETE → Completo
PENDING  → Pendente
BLOCKED  → Bloqueado
```

O desenho funcional prevê representação semelhante a:

```text
Verde
Amarelo
Vermelho
```

Mas sempre acompanhar cor com:

```text
texto
ícone
```

para acessibilidade.

---

# 20. Criação de atividade

Fluxo:

```text
Atividades
    ↓
Nova atividade
    ↓
Nome
Área
Descrição?
    ↓
Criar
    ↓
DRAFT
    ↓
Wizard
```

---

# 21. Wizard

O wizard é uma das interfaces centrais do produto.

Objetivos:

```text
reduzir complexidade
mostrar somente perguntas relevantes
salvar progresso
permitir retomada
mostrar pendências
```

---

# 22. Estrutura visual sugerida

```text
Mapeamento da atividade

1. Dados da atividade          ✓
2. Dados pessoais              ✓
3. Titulares                   ✓
4. Origem da coleta            ●
5. Operações
6. Destinatários
7. Retenção
8. Segurança
9. Base legal
10. Revisão

────────────────────────────────

[ conteúdo da etapa ]

────────────────────────────────

[ Voltar ]              [ Salvar e continuar ]
```

A ordem final deve seguir o fluxo funcional aprovado.

---

# 23. Etapas condicionais

Nem todas as etapas devem aparecer sempre.

Exemplo:

```text
Transferência internacional
```

somente deve exigir detalhes quando existir uma operação correspondente.

---

# 24. Estado do wizard

O frontend pode manter temporariamente:

```text
currentStep
```

localmente.

Mas os dados relevantes preenchidos devem ser persistidos no backend.

Evitar:

```text
wizard inteiro somente no Zustand
```

porque refresh/navegação poderia perder o trabalho.

---

# 25. Autosave

Autosave pode ser considerado futuramente.

Se implementado:

```text
usuário altera campo
       ↓
debounce
       ↓
PATCH API
       ↓
Saved
```

Porém, autosave introduz:

```text
concorrência
erros silenciosos
muitas requests
feedback de salvamento
```

Não implementar automaticamente sem decisão explícita.

---

# 26. Salvamento manual

Para a V1, uma abordagem simples e segura pode ser:

```text
[Salvar]

ou

[Salvar e continuar]
```

Após sucesso:

```text
Dados salvos
```

Não avançar silenciosamente quando o backend rejeitar a operação.

---

# 27. Navegação entre etapas

O usuário deve poder retornar a etapas anteriores.

Exemplo:

```text
Etapa 7
  ↓
Voltar para etapa 3
  ↓
alterar dado
```

Se a alteração invalidar etapas posteriores, o sistema deve conseguir sinalizar a necessidade de revisão.

---

# 28. Alterações que afetam o fluxo

Exemplo:

Usuário inicialmente informa:

```text
Transferência internacional = Não
```

Depois altera para:

```text
Transferência internacional = Sim
```

A interface deve passar a exigir:

```text
país
destinatário
mecanismo quando aplicável
```

---

# 29. Dados pessoais

Interface inicial pode utilizar seleção múltipla.

Exemplo:

```text
Quais categorias de dados são tratadas?

☑ Identificação
☐ Financeiro
☑ Saúde
☐ Biometria
☐ Imagem/Voz
☐ Opinião política
☐ Outra
```

---

# 30. Dados sensíveis

Categorias sensíveis devem receber destaque visual.

Exemplo:

```text
☑ Saúde       [Dado sensível]
```

Não utilizar mensagens alarmistas.

A interface deve apenas informar a classificação e eventual necessidade de revisão.

---

# 31. Titulares

Exemplo:

```text
Quem são os titulares?

☑ Colaboradores
☑ Candidatos
☐ Clientes
☐ Fornecedores
☐ Menores
☐ Outros
```

Quando menores forem selecionados, apresentar sinalização correspondente.

---

# 32. Origem da coleta

Pergunta principal:

```text
Os dados são coletados por meio de documento?

( ) Sim
( ) Não
```

---

# 33. Coleta por documento

Quando:

```text
Sim
```

mostrar:

```text
Tipo de documento

Momento da coleta

Documento de exemplo (opcional)
```

---

# 34. Coleta sem documento

Quando:

```text
Não
```

mostrar:

```text
Sistema/ferramenta

[ Selecionar sistema ▼ ]

Não encontrou?
[ Cadastrar novo sistema ]

Os dados são coletados diretamente do titular?

( ) Sim
( ) Não
```

---

# 35. Cadastro rápido

Cadastro rápido deve evitar tirar o usuário do wizard.

Preferir:

```text
Modal
```

ou:

```text
Drawer
```

Exemplo:

```text
Novo sistema

Nome *
Fornecedor
Descrição

[Cancelar] [Cadastrar]
```

Após cadastrar:

```text
modal fecha
↓
novo sistema fica selecionado
```

---

# 36. Sistema pendente

Caso o sistema seja criado durante o wizard:

```text
Sistema XYZ
[Pendente de mapeamento]
```

A interface deve comunicar que o cadastro ainda possui pendências.

---

# 37. Operações

Pode utilizar checkboxes:

```text
O que acontece com os dados?

☑ Uso
☑ Atualização/Modificação
☐ Transferência interna
☑ Transferência externa
☐ Transferência internacional
☑ Eliminação
```

---

# 38. Detalhes por operação

Ao selecionar uma operação, apresentar os campos aplicáveis.

Exemplo:

```text
Transferência externa

Fornecedor:
[ Empresa XYZ ▼ ]

Sistema:
[ Sistema ABC ▼ ]

Descrição:
[                         ]
```

---

# 39. Transferência internacional

Quando selecionada:

```text
Transferência internacional

País de destino *
[ Estados Unidos ▼ ]

Destinatário
[ ... ]

Mecanismo
[ ... ]
```

Não permitir conclusão da etapa sem país quando a transferência estiver ativa.

---

# 40. Finalidade

A interface deve solicitar descrição clara da finalidade.

Exemplo:

```text
Finalidade

Descreva por que os dados são tratados.

[________________________________________]
```

Evitar placeholder que incentive texto genérico.

---

# 41. Retenção

Exemplo:

```text
Por quanto tempo os dados são mantidos?

[ 2 ] [ Anos ▼ ]

A partir de qual evento?

[ Encerramento do contrato                  ]
```

---

# 42. Segurança

Exemplo:

```text
Quais medidas de segurança são utilizadas?

☑ Controle de acesso
☑ Criptografia
☐ Pseudonimização
☑ Backup
☐ Outro
```

Quando:

```text
Outro
```

for selecionado, solicitar descrição.

---

# 43. Base legal

Exemplo:

```text
Base legal

[ Selecione ▼ ]
```

Quando:

```text
LEGITIMATE_INTEREST
```

mostrar:

```text
Justificativa *

[________________________________________]
```

---

# 44. Consentimento

Quando aplicável:

```text
Termo de consentimento

Versão *
[ 1.0 ]

Vigência *
[ dd/mm/aaaa ]

Meio de coleta *
[ Aceite eletrônico ▼ ]

Documento *
[ Selecionar arquivo ]
```

A interface não deve sugerir registro individual de titulares na V1.

---

# 45. Revisão antes da submissão

Antes de concluir o wizard, apresentar resumo.

Exemplo:

```text
Revisão

Dados da atividade          ✓
Dados pessoais              ✓
Titulares                   ✓
Origem da coleta            ✓
Operações                   ✓
Destinatários               ✓
Retenção                    ⚠
Segurança                   ✓
Base legal                  ✓
```

O usuário deve poder clicar na seção para corrigir.

---

# 46. Erros de submissão

Quando o backend retornar:

```text
RETENTION_POLICY_REQUIRED
```

o frontend deve:

```text
mostrar mensagem
identificar etapa
permitir navegar até ela
```

Não apresentar apenas:

```text
Erro 422
```

---

# 47. Compliance Gate

Tela/componente deve apresentar cada check.

Exemplo:

```text
Compliance Gate

✓ Base legal
✓ Retenção
✓ Medidas de segurança
— Transferência internacional
⚠ Dados sensíveis — revisão necessária
```

---

# 48. Detalhes do check

Cada check pode possuir:

```text
nome
status
explicação
ação necessária
```

Exemplo:

```text
Retenção

Status: Pendente

A política de retenção ainda não foi definida.

[Corrigir retenção]
```

---

# 49. Não decidir compliance no frontend

Proibido:

```ts
const compliant =
    legalBasis &&
    retention &&
    securityMeasures.length > 0;
```

como fonte definitiva.

O backend retorna o resultado do gate.

O frontend apenas representa esse resultado.

---

# 50. Página da atividade

Sugestão:

```text
Atividade: Recrutamento de candidatos

[Em mapeamento] [Compliance pendente]

Área: RH
Última atualização: ...

──────────────────────────────

[Resumo]
[Mapeamento]
[Compliance]
[Histórico]
```

---

# 51. Ações disponíveis

Ações dependem de:

```text
status
+
permissions
```

Exemplo:

```text
ACTIVE

[Visualizar]
[Propor alteração]
[Arquivar]
```

Mas somente renderizar ações autorizadas.

---

# 52. Histórico

Página/aba:

```text
Histórico
```

Exemplo:

```text
v3 — 17/09/2026 — Usuário A
Versão vigente

v2 — 02/08/2026 — Usuário B

v1 — 10/06/2026 — Usuário A
```

---

# 53. Comparação de versões

Pode ser adicionada futuramente:

```text
v2
vs
v3
```

mostrando alterações.

Não é requisito obrigatório da V1 salvo decisão posterior.

---

# 54. ROPA

Página:

```text
/ropa
```

Estrutura:

```text
ROPA

[Busca]
[Área]
[Status]
[Categoria]
[Base legal]

[Exportar PDF]
[Exportar Excel]

┌─────────────────────────────────────────────┐
│ tabela                                      │
└─────────────────────────────────────────────┘
```

---

# 55. Colunas do ROPA

Inicialmente:

```text
Área
Atividade
Finalidade
Dados pessoais
Titulares
Destinatários
Transferência internacional
Retenção
Base legal
Gate
Última atualização
```

Como existem muitas colunas, considerar:

```text
scroll horizontal
colunas configuráveis
detalhes expansíveis
```

Não reduzir informações obrigatórias apenas para fazer a tabela caber.

---

# 56. ROPA responsivo

Em telas menores, uma tabela muito larga pode ser inadequada.

Possível representação:

```text
cards
```

ou:

```text
tabela com scroll horizontal
```

A escolha visual pode ser feita durante design.

---

# 57. Exportação

Botões:

```text
[Exportar PDF]
[Exportar Excel]
```

Durante processamento:

```text
Gerando arquivo...
```

Se assíncrono:

```text
Exportação em processamento
```

Não bloquear toda a aplicação enquanto o arquivo é gerado.

---

# 58. Dashboard

Página:

```text
/dashboard
```

Indicadores previstos no desenho funcional:

```text
% de atividades completas

pendências antigas

atividades com dados sensíveis

atividades envolvendo menores

transferências internacionais

sistemas não mapeados

fornecedores não mapeados
```

---

# 59. Cards do dashboard

Exemplo:

```text
┌─────────────────────┐
│ Conformidade        │
│                     │
│       82%           │
│                     │
│ 98 de 120           │
└─────────────────────┘
```

---

# 60. Dashboard deve ser acionável

Quando possível, cards devem permitir navegação.

Exemplo:

```text
12 transferências internacionais
```

clicar:

```text
/activities?hasInternationalTransfer=true
```

---

# 61. Sistemas

Página:

```text
/systems
```

Campos de listagem:

```text
Nome
Fornecedor
Status
Mapping Status
Última atualização
```

Filtros:

```text
Busca
Status
Mapping Status
Fornecedor
```

---

# 62. Fornecedores

Página:

```text
/suppliers
```

Campos possíveis:

```text
Nome
País
Status
Mapping Status
Última atualização
```

---

# 63. Administração

Área administrativa pode conter:

```text
Usuários
Áreas
Configurações
```

Somente usuários autorizados devem visualizar.

---

# 64. Formulários

Utilizar:

```text
React Hook Form
+
Zod
```

para validação estrutural.

Exemplo:

```ts
const schema = z.object({
  name: z.string().min(1),
});
```

---

# 65. Regra de negócio no formulário

Zod pode validar:

```text
required
tipo
formato
limites estruturais
```

Mas regras de negócio críticas continuam no backend.

Exemplo:

Frontend pode validar:

```text
justification obrigatório quando LEGITIMATE_INTEREST
```

para UX.

Mas backend deve validar novamente.

---

# 66. Erros backend → formulário

Exemplo de API:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "legalBasis.justification",
        "code": "LEGITIMATE_INTEREST_JUSTIFICATION_REQUIRED"
      }
    ]
  }
}
```

O frontend deve mapear o erro para o campo correspondente quando possível.

---

# 67. Loading

Toda operação assíncrona deve possuir feedback adequado.

Exemplo:

```text
carregando página
salvando formulário
executando gate
exportando arquivo
```

Evitar interface aparentemente congelada.

---

# 68. Skeleton

Para carregamento inicial de páginas, preferir skeleton quando melhorar a experiência.

Exemplo:

```text
Dashboard
████████
████
```

Não utilizar spinner para absolutamente tudo.

---

# 69. Botões durante mutation

Ao enviar:

```text
[Salvar]
```

alterar para algo equivalente:

```text
[Salvando...]
```

e impedir submissões duplicadas quando necessário.

---

# 70. Empty states

Listas vazias devem possuir mensagem útil.

Exemplo:

```text
Nenhuma atividade de tratamento cadastrada.

[+ Nova atividade]
```

quando o usuário possuir permissão.

---

# 71. Error states

Falha de carregamento:

```text
Não foi possível carregar as atividades.

[Tentar novamente]
```

Não exibir stack trace.

---

# 72. Confirmações

Operações com impacto relevante devem solicitar confirmação quando apropriado.

Exemplo:

```text
Arquivar atividade?

A atividade deixará de aparecer como vigente no ROPA.

[Cancelar] [Arquivar]
```

---

# 73. Toasts

Utilizar notificações curtas para confirmações.

Exemplo:

```text
Atividade salva.
```

```text
Fornecedor cadastrado.
```

Não utilizar toast como único local para erros importantes de formulário.

---

# 74. Modais

Utilizar modal para ações curtas e focadas.

Exemplo:

```text
cadastro rápido de sistema
confirmação de arquivamento
```

Evitar formulários enormes dentro de modal.

---

# 75. URL como estado

Filtros de listagem devem preferencialmente estar na URL.

Exemplo:

```text
/activities?status=ACTIVE&businessUnitId=123
```

Benefícios:

```text
refresh preserva filtro
URL compartilhável
navegação back/forward funciona
```

---

# 76. TanStack Query

Query keys devem incluir contexto relevante.

Exemplo:

```ts
[
  'processing-activities',
  organizationId,
  filters
]
```

Se multi-organização existir, nunca reutilizar cache entre tenants indevidamente.

---

# 77. Invalidação

Após criar atividade:

```text
invalidate processing activities
```

Após alterar atividade:

```text
invalidate activity detail
invalidate activities list
invalidate ROPA quando necessário
invalidate dashboard quando necessário
```

Evitar invalidar todo o cache da aplicação indiscriminadamente.

---

# 78. Optimistic updates

Não utilizar optimistic update em operações críticas sem necessidade.

Evitar inicialmente em:

```text
Compliance Gate
aprovação
arquivamento
mudança de estado
```

Aguardar confirmação do backend.

---

# 79. Permissões

Criar mecanismo central.

Exemplo conceitual:

```ts
can('processing_activity:update')
```

ou:

```tsx
<Can permission="processing_activity:update">
  <EditButton />
</Can>
```

---

# 80. Permissão + recurso

Em alguns casos, apenas a permissão global não é suficiente.

Exemplo:

```text
processing_activity:update
```

mas a atividade pertence a outra área.

O backend continua responsável pela decisão final.

O frontend pode utilizar metadados retornados pela API como:

```json
{
  "allowedActions": [
    "VIEW",
    "EDIT",
    "SUBMIT"
  ]
}
```

---

# 81. allowedActions

Para recursos com workflow complexo, é recomendável considerar o backend retornando ações permitidas.

Exemplo:

```json
{
  "id": "...",
  "status": "MAPPING",
  "allowedActions": [
    "EDIT",
    "SUBMIT"
  ]
}
```

Isso reduz duplicação de regras como:

```text
status
+
role
+
permission
+
scope
```

no frontend.

A decisão deve ser alinhada com `07-API.md`.

---

# 82. Segurança

Nunca armazenar informações sensíveis desnecessariamente em:

```text
localStorage
sessionStorage
Zustand persist
```

Tokens e sessões devem seguir a estratégia definida em `09-SECURITY.md`.

---

# 83. Logs frontend

Não registrar indiscriminadamente:

```text
tokens
dados de formulários
documentos
respostas completas da API
```

em console ou ferramentas de logging.

---

# 84. Acessibilidade

A aplicação deve buscar compatibilidade com WCAG.

Requisitos mínimos:

```text
navegação por teclado
labels em formulários
focus visível
contraste adequado
aria quando necessário
mensagens de erro associadas aos campos
```

---

# 85. Cor

Nunca utilizar somente:

```text
verde
amarelo
vermelho
```

para transmitir informação.

Utilizar:

```text
cor
+
ícone
+
texto
```

---

# 86. Formulários acessíveis

Evitar:

```text
placeholder como único label
```

Preferir:

```text
label visível
campo
mensagem auxiliar
erro
```

---

# 87. Responsividade

A aplicação deve funcionar prioritariamente em desktop, mas não deve quebrar em telas menores.

Contexto esperado:

```text
sistema corporativo
uso principal desktop/notebook
```

O wizard deve permanecer utilizável em tablet e mobile quando possível.

---

# 88. Breakpoints

Utilizar os breakpoints padronizados pelo Tailwind.

Não criar breakpoints arbitrários em cada componente.

---

# 89. Internacionalização

Mesmo que a V1 seja apenas:

```text
pt-BR
```

evitar espalhar códigos de negócio como texto visual.

Exemplo:

Backend:

```text
LEGITIMATE_INTEREST
```

Frontend:

```text
Legítimo interesse
```

Uma camada de labels central facilita futura internacionalização.

---

# 90. Formatação de datas

Exibir ao usuário:

```text
17/09/2026
```

quando apropriado ao locale `pt-BR`.

API continua utilizando ISO 8601.

---

# 91. Números e percentuais

Utilizar:

```text
Intl.NumberFormat
```

ou mecanismo equivalente.

Exemplo:

```text
82,5%
```

Não implementar formatação manual espalhada.

---

# 92. Componentes grandes

Se um componente acumular:

```text
fetch
form
modal
tabela
regra
layout
transformação
```

considerar divisão.

Separar por responsabilidade, não apenas por quantidade de linhas.

---

# 93. Hooks

Hooks customizados podem encapsular comportamento reutilizável.

Exemplo:

```text
useProcessingActivity()
useProcessingActivities()
usePermissions()
```

Não criar hook para cada função trivial.

---

# 94. API layer

Exemplo:

```text
features/
└── processing-activities/
    └── api/
        ├── getProcessingActivities.ts
        ├── getProcessingActivity.ts
        ├── createProcessingActivity.ts
        └── updateProcessingActivity.ts
```

Ou estrutura equivalente centralizada.

Manter consistência em todo o projeto.

---

# 95. Tipos

Evitar duplicar manualmente tipos que podem ser derivados de contratos compartilhados ou OpenAPI.

Exemplo problemático:

```text
Backend ProcessingActivityDto

Frontend ProcessingActivity

Frontend Activity

Frontend ActivityResponse
```

todos representando a mesma estrutura de formas incompatíveis.

---

# 96. Testes

Frontend deve possuir:

```text
unit tests
component tests
integration tests
E2E
```

conforme necessidade.

---

# 97. Vitest

Utilizar para:

```text
utils
hooks
schemas
componentes
```

quando adequado.

---

# 98. Testing Library

Testes de componentes devem priorizar comportamento do usuário.

Preferir:

```text
usuário encontra botão "Salvar"
usuário preenche campo
usuário envia formulário
mensagem aparece
```

Evitar testar detalhes internos de implementação.

---

# 99. Playwright

Fluxos críticos devem possuir E2E.

Exemplos:

```text
login

criar atividade

preencher wizard

submeter atividade

corrigir pendência

executar fluxo de compliance

consultar ROPA

exportar ROPA
```

---

# 100. E2E multi-tenant

Teste crítico:

```text
Usuário Organization A
       ↓
tenta acessar URL de Activity Organization B
       ↓
não consegue visualizar conteúdo
```

Mesmo que a segurança real esteja no backend, o comportamento completo deve ser testado.

---

# 101. Data-testid

Não utilizar `data-testid` indiscriminadamente.

Preferir seletores acessíveis:

```text
role
label
text
```

Usar `data-testid` quando não houver alternativa estável.

---

# 102. Performance

Aplicar:

```text
lazy loading de rotas
paginação
cache de queries
code splitting
```

quando apropriado.

Não introduzir memoização em todos os componentes sem evidência de necessidade.

---

# 103. Lazy loading

Páginas grandes podem ser carregadas sob demanda.

Exemplo:

```text
Dashboard
ROPA
Admin
```

---

# 104. Tabelas grandes

Não carregar milhares de atividades de uma vez.

Utilizar paginação da API.

Virtualização somente quando houver necessidade concreta.

---

# 105. Erros inesperados

Utilizar Error Boundary em pontos adequados.

Exemplo:

```text
App
└── ErrorBoundary
```

Pode existir boundary adicional em áreas complexas.

---

# 106. Rotas inexistentes

Página:

```text
404
```

Exemplo:

```text
Página não encontrada.

[Voltar para início]
```

---

# 107. Acesso negado

Quando realmente apropriado:

```text
Você não possui permissão para acessar esta página.
```

Entretanto, recursos de outro tenant podem ser tratados como não encontrados conforme política da API.

---

# 108. Unsaved changes

Se o usuário possuir alterações locais ainda não persistidas e tentar sair, considerar alerta.

Exemplo:

```text
Existem alterações não salvas.

Deseja sair mesmo assim?
```

Somente necessário quando o formulário realmente mantém alterações locais não salvas.

---

# 109. Design system

Mesmo sem um design system formal na V1, componentes devem possuir consistência de:

```text
spacing
tipografia
botões
inputs
badges
modais
tabelas
feedback
```

Evitar estilos específicos repetidos diretamente em cada página.

---

# 110. Tailwind

Evitar componentes com classes enormes e duplicadas.

Quando um padrão visual se repetir, criar componente ou abstração adequada.

Não criar abstrações apenas para esconder duas classes.

---

# 111. Ícones

Utilizar uma biblioteca de ícones consistente.

Não misturar múltiplas bibliotecas sem necessidade.

A escolha da biblioteca ainda pode ser definida no projeto.

---

# 112. Dashboard e gráficos

Gráficos devem ser utilizados somente quando facilitarem interpretação.

Não transformar todo indicador em gráfico.

Exemplo:

```text
82% conformidade
```

pode ser mais claro como card do que como gráfico complexo.

---

# 113. Tooltips

Tooltips podem explicar termos como:

```text
ROPA
Base legal
Retenção
Transferência internacional
```

Mas não devem ser a única forma de apresentar informação obrigatória.

---

# 114. Textos jurídicos

O frontend não deve inventar orientações jurídicas.

Textos explicativos devem vir de conteúdo previamente definido pelo produto/compliance.

Agentes de IA não devem adicionar afirmações jurídicas novas apenas para preencher a interface.

---

# 115. Questões abertas

Registrar também em `12-OPEN-QUESTIONS.md`.

### FEQ-001 — Biblioteca de componentes

A escolha global permanece OPEN. A [DEC-071](13-DECISIONS.md#dec-071--escolhas-técnicas-e-escopo-do-primeiro-frontend-shell) aprova componentes próprios e HTML semântico somente para o primeiro shell.

Será utilizada alguma biblioteca base para o restante do produto?

Exemplos:

```text
shadcn/ui
Radix
Headless UI
componentes próprios
```

**Impacto:** médio.

---

### FEQ-013 — Router

DECIDED por [DEC-071](13-DECISIONS.md#dec-071--escolhas-técnicas-e-escopo-do-primeiro-frontend-shell): React Router em modo declarativo para a base frontend. Implementação ainda pendente.

**Impacto:** baixo.

---

### FEQ-003 — Wizard

O salvamento será:

```text
manual
autosave
híbrido
```

?

**Impacto:** médio.

---

### APIQ-021 — Wizard API

O frontend salvará:

```text
cada sub-recurso
```

ou:

```text
payload por etapa
```

?

**Impacto:** médio/alto.

---

### APIQ-016 — allowedActions

A API retornará ações disponíveis por recurso?

**Recomendação:** considerar fortemente para atividades com workflow complexo.

**Impacto:** médio.

---

### FEQ-014 — ROPA

A tabela terá:

```text
colunas fixas
colunas configuráveis
```

?

**Impacto:** baixo/médio.

---

### AUDQ-009 — Comparação de versões

A V1 terá interface visual de diff entre versões?

**Impacto:** médio.

---

### FEQ-015 — Multi-organização

Será necessário seletor de organização?

**Impacto:** alto.

---

### APIQ-007 — Upload

Upload será:

```text
backend
signed URL
```

?

Depende da decisão da API/infraestrutura.

**Impacto:** médio.

---

### FEQ-010 — Design

Existe design visual/Figma oficial ou o frontend deverá construir o design system inicial?

**Impacto:** médio.

---

### FEQ-007 — Mobile

Qual o nível de suporte mobile esperado?

```text
responsivo básico
uso completo
desktop only
```

**Impacto:** médio.

---

### FEQ-012 — Idiomas

A aplicação será exclusivamente:

```text
pt-BR
```

na V1?

**Impacto:** baixo.

---

# 116. Regras para agentes de IA

Antes de implementar uma tela:

1. identificar a feature;
2. consultar `05-BUSINESS-RULES.md`;
3. consultar `06-WORKFLOWS.md`;
4. consultar `07-API.md`;
5. identificar permissões;
6. identificar estados de loading;
7. identificar empty state;
8. identificar error state;
9. identificar comportamento responsivo;
10. criar testes necessários.

---

# 117. Agentes não devem

Não:

```text
duplicar regras de compliance no frontend

usar Zustand como banco de dados

confiar em role para segurança

alterar status localmente sem API

inventar campos jurídicos

inventar etapas do wizard

inventar permissões

ignorar questões abertas

usar localStorage para dados sensíveis sem decisão explícita

criar chamadas HTTP diretamente em dezenas de componentes

exibir erros técnicos ao usuário

carregar coleções inteiras sem paginação
```

---

# 118. Checklist de página

Toda nova página deve considerar:

```text
[ ] rota
[ ] autorização
[ ] loading
[ ] erro
[ ] empty state
[ ] conteúdo
[ ] ações
[ ] feedback de mutation
[ ] responsividade
[ ] acessibilidade
[ ] testes
```

---

# 119. Checklist de formulário

```text
[ ] labels
[ ] tipos
[ ] schema
[ ] valores iniciais
[ ] loading
[ ] submit
[ ] erro estrutural
[ ] erro backend
[ ] feedback de sucesso
[ ] campos condicionais
[ ] acessibilidade
[ ] proteção contra submit duplicado
```

---

# 120. Definition of Done do frontend

Uma feature frontend é considerada concluída quando possui:

```text
interface funcional
+
integração com API
+
controle visual de autorização
+
loading
+
error state
+
empty state quando aplicável
+
validação
+
feedback
+
acessibilidade básica
+
responsividade definida
+
testes necessários
```

---

# 121. Próximo documento

Os requisitos de autenticação segura, sessões, uploads, proteção de dados, logs, headers, rate limiting, secrets e segurança multi-tenant serão definidos em:

`09-SECURITY.md`