# LGPD Data Mapping Platform

> **Documento:** Visão e escopo do projeto  
> **Status:** Draft  
> **Fonte funcional:** Ferramenta de Mapeamento de Dados Pessoais — Desenho Funcional, agosto de 2026  
> **Público:** Produto, desenvolvimento, arquitetura, QA e agentes de IA


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

Construir uma aplicação web para apoiar o mapeamento, a documentação, a verificação de conformidade e o acompanhamento de atividades de tratamento de dados pessoais no contexto da LGPD.

A ferramenta transforma o processo de mapeamento em um fluxo estruturado e auditável. As áreas de negócio cadastram suas atividades de tratamento e o sistema conduz o preenchimento por meio de um wizard condicional, complementado por metadados, definição de base legal e verificações de conformidade.

Ao final do processo, as atividades consideradas aptas alimentam automaticamente o Registro de Operações de Tratamento (ROPA), permitindo ao Encarregado/DPO acompanhar a situação da organização por meio de uma visão consolidada.

O sistema deve funcionar como produto de apoio ao serviço de DPO as a Service, reduzindo a dependência de atividades manuais e aumentando a escalabilidade do processo de mapeamento.

---

## 2. Problema que o produto resolve

O mapeamento de dados pessoais pode depender de entrevistas, planilhas, documentos e controles manuais distribuídos entre diferentes áreas da organização.

Isso dificulta:

- padronização do levantamento;
- acompanhamento das pendências;
- atualização contínua do ROPA;
- identificação de atividades com riscos ou requisitos adicionais;
- rastreabilidade das alterações;
- acompanhamento do nível de conformidade;
- consolidação das informações pelo DPO.

A plataforma deve centralizar esse processo em um fluxo estruturado.

---

## 3. Objetivos do produto

A aplicação deve permitir:

1. organizar o mapeamento por organização e área/unidade de negócio;
2. cadastrar atividades de tratamento de dados pessoais;
3. identificar categorias de dados pessoais envolvidas;
4. registrar a origem e o momento da coleta;
5. identificar documentos, formulários, sistemas ou ferramentas utilizados;
6. registrar operações realizadas sobre os dados;
7. identificar áreas, sistemas e terceiros envolvidos nas operações;
8. registrar transferências internas, externas e internacionais;
9. documentar finalidade, titulares e destinatários;
10. registrar prazo de retenção;
11. registrar medidas técnicas e organizacionais de segurança;
12. determinar a base legal aplicável;
13. registrar informações relacionadas a consentimento quando aplicável;
14. executar verificações de conformidade antes da conclusão do mapeamento;
15. sinalizar atividades que exijam avaliação adicional;
16. consolidar automaticamente as atividades no ROPA;
17. permitir acompanhamento gerencial pelo DPO;
18. preservar histórico e rastreabilidade das alterações;
19. exportar informações para auditorias e solicitações formais.

---

## 4. Princípios do produto

### P-001 — ROPA derivado

O ROPA não deve ser mantido como um cadastro independente.

Ele deve ser uma visão consolidada derivada das atividades de tratamento cadastradas na plataforma.

### P-002 — Conformidade antes da conclusão

Nenhuma atividade deve ser considerada concluída sem passar pelo gate de conformidade.

O gate mínimo verifica:

- base legal;
- medidas de segurança;
- prazo de retenção.

### P-003 — Rastreabilidade

Alterações relevantes em atividades já cadastradas devem preservar o histórico.

Uma alteração relevante não deve simplesmente eliminar a informação anterior.

### P-004 — Fluxo orientado

O cadastro da atividade deve ocorrer por meio de um fluxo orientado e condicional, evitando um formulário único excessivamente longo.

### P-005 — Informação reutilizável

Informações cadastradas durante o wizard devem ser reutilizadas nas etapas posteriores, evitando preenchimento duplicado.

### P-006 — Visibilidade por responsabilidade

Usuários operacionais trabalham principalmente dentro de suas áreas, enquanto o DPO necessita de visão consolidada da organização.

### P-007 — Auditoria

Informações relevantes sobre criação, alteração e evolução das atividades devem ser rastreáveis.

### P-008 — Privacy by Design

Novos sistemas ou fornecedores identificados durante o processo de mapeamento devem permanecer como pendência quando o respectivo mapeamento ainda não estiver completo.

---

## 5. Visão macro do fluxo

```text
Nova atividade de tratamento
        ↓
Identificação dos dados pessoais
        ↓
Origem da coleta
        ↓
Documento?
   ┌────┴────┐
  Sim       Não
   ↓         ↓
Documento   Formulário/Sistema
   └────┬────┘
        ↓
Processamento além do armazenamento?
        ↓
Identificação das operações
        ↓
Metadados da atividade
        ↓
Base legal
        ↓
Gate de conformidade
   ┌────┴────┐
Pendência   Completo
   ↓          ↓
Correção     ROPA
              ↓
      Atividade monitorada
```

O caminho pode variar conforme as respostas fornecidas pelo usuário.

---

## 6. Módulos funcionais

### M01 — Acesso e Seleção de Área

Responsável pelo acesso do usuário e definição do contexto de área/unidade de negócio.

### M02 — Wizard de Identificação de Atividade de Tratamento

Responsável pelo fluxo guiado de identificação da atividade, dados pessoais, origem da coleta, documentos, sistemas, processamento, operações e transferências.

### M03 — Metadados da Atividade

Responsável por:

- controlador/operador;
- finalidade;
- categorias de titulares;
- categorias de destinatários;
- transferências;
- retenção;
- medidas de segurança.

### M04 — Base Legal e Consentimento

Responsável pela definição da base legal e, quando aplicável, pelo registro das informações relacionadas ao consentimento.

### M05 — ROPA Consolidado e Painel do Encarregado

Responsável pela visão consolidada das atividades e pelo acompanhamento gerencial do DPO.

---

## 7. Atores

### Colaborador da área

Usuário operacional responsável pelo preenchimento das informações relacionadas às atividades de tratamento da sua área.

### Gestor da área

Responsável pelo acompanhamento das atividades da sua área/unidade de negócio.

### Encarregado / DPO

Possui visão consolidada das atividades de tratamento e das pendências de conformidade.

### Administrador

Perfil proposto para administração de:

- usuários;
- áreas;
- configurações;
- cadastros estruturais.

> **Pendente de validação:** este perfil não está definido explicitamente no desenho funcional original.

As permissões detalhadas serão definidas em `04-AUTHORIZATION.md`.

---

## 8. Escopo funcional da V1

A primeira versão da aplicação deve contemplar:

- autenticação;
- usuários e papéis;
- áreas/unidades de negócio;
- atividades de tratamento;
- wizard condicional;
- categorias de dados pessoais;
- documentos;
- sistemas/ferramentas de coleta;
- operações de tratamento;
- transferências;
- metadados da atividade;
- finalidade;
- titulares;
- destinatários;
- retenção;
- medidas de segurança;
- base legal;
- metadados de consentimento;
- gate de conformidade;
- ROPA;
- dashboard básico do DPO;
- histórico/versionamento;
- auditoria;
- exportação do ROPA.

---

## 9. Fora do escopo inicial

Até decisão específica em contrário, não fazem parte do escopo inicial:

- armazenamento dos dados pessoais reais dos titulares;
- gestão individual de cada aceite de consentimento;
- RIPD/DPIA completo dentro da plataforma;
- LIA completo;
- descoberta automática de dados nos sistemas do cliente;
- integrações automáticas com RH, CRM e ERP;
- bloqueio técnico da entrada em produção de sistemas externos (DEC-031);
- API pública;
- automação completa de transferências internacionais.

Esses itens podem fazer parte da evolução do produto.

---

## 10. Regras globais

### BR-GLOBAL-001 — Gate obrigatório

Nenhuma atividade de tratamento pode ser considerada concluída sem passar pelo gate de conformidade.

### BR-GLOBAL-002 — Requisitos mínimos do gate

O gate exige, no mínimo:

- base legal definida;
- medidas de segurança definidas;
- prazo de retenção definido.

### BR-GLOBAL-003 — Dados sensíveis e menores

Atividades envolvendo dados sensíveis ou dados de crianças/adolescentes devem gerar sinalização para avaliação da necessidade de RIPD/DPIA.

### BR-GLOBAL-004 — Transferência internacional

Atividades envolvendo transferência internacional devem gerar verificação do mecanismo de transferência aplicável.

### BR-GLOBAL-005 — Sistemas e fornecedores pendentes

Um novo sistema ou fornecedor cadastrado durante o wizard deve permanecer pendente enquanto o respectivo mapeamento não estiver concluído.

### BR-GLOBAL-006 — Versionamento

Alterações relevantes em atividades já cadastradas devem gerar histórico/versionamento, preservando a informação anterior.

### BR-GLOBAL-007 — ROPA automático

O ROPA deve ser atualizado a partir das atividades cadastradas, sem exigir recadastro manual das mesmas informações.

---

## 11. Premissas de arquitetura

> As premissas desta seção são propostas técnicas e devem ser validadas nos documentos de arquitetura.

### A-001 — Aplicação web

O produto será desenvolvido como aplicação web.

### A-002 — Backend como fonte de verdade

Validações de autorização e regras críticas de negócio devem ser aplicadas no backend.

### A-003 — Multi-organização

A arquitetura deve ser preparada para suportar múltiplas organizações/clientes.

### A-004 — Isolamento

Dados pertencentes a uma organização não podem ser acessados por usuários de outra organização sem autorização explícita.

### A-005 — Monólito modular

A arquitetura inicial recomendada é um monólito modular, evitando complexidade prematura de microserviços.

### A-006 — Banco relacional

Os dados estruturados do domínio devem ser persistidos em banco de dados relacional.

### A-007 — Arquivos separados do banco

Uploads de documentos devem ser armazenados em object storage, mantendo no banco apenas metadados e referências.

---

## 12. Requisitos não funcionais iniciais

### Segurança

- comunicação via HTTPS;
- controle de acesso por usuário e papel;
- isolamento entre organizações;
- proteção de arquivos enviados;
- auditoria de operações relevantes;
- princípio do menor privilégio.

### Rastreabilidade

Alterações relevantes devem permitir identificar:

- usuário;
- data/hora;
- entidade alterada;
- versão;
- alteração realizada.

### Usabilidade

O processo de mapeamento deve priorizar:

- wizard passo a passo;
- salvamento de progresso;
- reutilização de informações;
- indicação clara de pendências;
- mensagens de validação objetivas.

### Evolução

A arquitetura deve permitir adicionar novas regras de conformidade sem exigir reestruturação completa do fluxo.

---

## 13. Fonte da verdade das especificações

A documentação em `/docs` representa a especificação técnica utilizada durante o desenvolvimento.

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

Detalhes específicos de uma funcionalidade devem ser documentados no arquivo correspondente em `features/`.

---

## 14. Regra para decisões não especificadas

Quando uma regra necessária para implementação não estiver definida na documentação:

1. não assumir silenciosamente um comportamento;
2. verificar `12-OPEN-QUESTIONS.md`;
3. registrar a dúvida quando necessário;
4. obter uma decisão;
5. atualizar a documentação;
6. somente então implementar a regra dependente da decisão.

Agentes de IA não devem inventar regras jurídicas ou de negócio para preencher lacunas da especificação.

---

## 15. Critério geral de conclusão

Uma funcionalidade somente deve ser considerada concluída quando:

- comportamento funcional estiver implementado;
- validações estiverem implementadas;
- autorização estiver aplicada;
- regras de negócio relacionadas estiverem atendidas;
- testes automatizados relevantes estiverem passando;
- requisitos de auditoria estiverem atendidos;
- documentação afetada estiver atualizada.

---

## 16. Documentos relacionados

Este documento apresenta apenas a visão geral e o escopo do produto.

Detalhes devem ser mantidos nos documentos especializados:

- `01-ARCHITECTURE.md` — arquitetura técnica;
- `02-DOMAIN.md` — entidades e conceitos de domínio;
- `03-DATABASE.md` — modelo de persistência;
- `04-AUTHORIZATION.md` — usuários, papéis e permissões;
- `05-BUSINESS-RULES.md` — regras de negócio;
- `06-WORKFLOWS.md` — estados e fluxos;
- `07-API.md` — contratos da API;
- `08-FRONTEND.md` — estrutura e comportamento da interface;
- `09-SECURITY.md` — requisitos de segurança;
- `10-AUDIT.md` — auditoria e versionamento;
- `11-TESTING.md` — estratégia e critérios de testes;
- `12-OPEN-QUESTIONS.md` — decisões ainda não fechadas.