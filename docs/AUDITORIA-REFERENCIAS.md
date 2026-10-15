# Auditoria das referências

Data da leitura: 2026-10-15  
Referências lidas somente como material de estudo:

- [Aurum site](C:/Users/Eduardo/Documents/aurum-detailing)
- [Aurum Sheets Spark](C:/Users/Eduardo/Documents/planilha_financeira/aurum-sheets-spark)

Legenda obrigatória desta auditoria:

- **li no código**: comportamento, campo, tela ou risco observável diretamente nos arquivos lidos.
- **inferi**: proposta, interpretação ou risco deduzido a partir do código; precisa de decisão antes de virar implementação.

Nenhum preço, telefone, endereço, foto ou segredo real foi reproduzido neste documento.

## 1. Padrões do Aurum a reaproveitar

| Padrão | Classificação | Recomendação e motivo |
|---|---|---|
| Migrações SQL versionadas e aditivas, com tabela `_migrations`, transação por migração, `advisory lock`, `lock_timeout`, `statement_timeout` e rollback | **li no código** | Reaproveitar. O histórico fica explícito, a execução concorrente é evitada e uma falha não deixa DDL parcialmente aplicado. A migração canônica preserva colunas JSON/legadas durante a transição em vez de apagar o passado. |
| Runner com reconexão ao Postgres, limite de tempo e logs sem URL, credenciais ou valores de linhas | **li no código** | Reaproveitar. Reduz falhas de primeiro deploy e evita vazar informação operacional. |
| Container inicia migração, conversão de uploads e servidor em sequência com separador `;` | **li no código** | Reaproveitar a ideia de servidor subir em modo degradado quando a migração falhar; substituir a implementação por um estado explícito de prontidão (`/api/ready`) para observabilidade. |
| Upload valida MIME/extensão, limita tamanho e megapixels, rejeita imagem inválida/animação, gera nome UUID e converte para WebP com `sharp` | **li no código** | Reaproveitar. Reduz payload, evita colisão de nomes e limita entradas perigosas. Manter storage persistente fora da camada efêmera do container. |
| Endpoint de leitura de upload aceita somente nome UUID com extensão conhecida e define `Content-Type`/cache | **li no código** | Reaproveitar. O nome não deve ser tratado como caminho arbitrário. Acrescentar autorização/escopo quando as fotos deixarem de ser públicas. |
| Histórico de catálogo em tabela própria e trigger com ator, antes/depois e data | **li no código** | Reaproveitar no `audit_log`. O valor está em permitir investigação de alteração sem depender do estado atual. |
| Histórico privado de agendamento por `acesso_hash` parcial/privado, em vez de expor todo o histórico por telefone | **li no código** | Reaproveitar. O telefone sozinho é um identificador fraco; um token aleatório de acesso deve ser separado do dado de contato e armazenado somente como hash. |
| Agendamento público com seleção de serviço, veículo, data, horário, forma de entrega, resumo e confirmação | **li no código** | Reaproveitar como fluxo mobile-first. A sequência conversa por etapas, tem resumo antes do envio e trata estados de carregamento/erro. |
| Formato textual de fallback para WhatsApp com snapshot dos serviços e total | **li no código** | Reaproveitar como integração opcional, não como fonte financeira. O registro transacional deve nascer no banco antes de abrir o WhatsApp. |
| Docker multi-stage, runtime Node mínimo, usuário não-root, `output: standalone`, volume em `public/uploads`, `PORT`/`HOSTNAME` explícitos | **li no código** | Reaproveitar. Reduz imagem e privilégio, melhora cache de dependências e torna o contrato de execução claro. |
| Testes de migração isolados, testes unitários de catálogo, upload, histórico, submissão e links admin | **li no código** | Reaproveitar a estratégia. Testar invariantes do banco fora de produção e manter testes de regras separados de testes de browser. |

## 2. Acoplamentos que não devem ir para a base

| Acoplamento | Classificação | Decisão |
|---|---|---|
| Marca, logotipo, identidade visual e textos editoriais do Aurum | **li no código** | Não levar para o núcleo multi-tenant. Devem ser dados de `tenant_settings` ou tema configurável. |
| Preços, promoções, nomes, categorias e regras de preço do catálogo atual | **li no código** | Não copiar como seed da base. O núcleo deve suportar catálogo configurável, preço por porte e vigência. |
| Fotos em `public/images/services` e uploads existentes | **li no código** | Não copiar. A base deve guardar somente referências de mídia do tenant, sem dados reais do Aurum. |
| Telefone, WhatsApp, endereço, Instagram e horário de funcionamento | **li no código** | Não hardcodar. São configurações por tenant e devem ficar fora do código de aplicação. |
| Regras específicas de carro/moto, nomes de portes e categorias do Aurum | **li no código** | Generalizar para atributos configuráveis; não assumir que todo tenant terá os mesmos tipos de veículo ou portes. |
| Colunas e textos específicos da planilha Google, inclusive posição fixa de colunas | **li no código** | Não levar como contrato principal. A planilha pode ser importação/exportação ou integração legada, mas o banco deve ser a fonte transacional. |
| Supabase Auth, Redis, Google Sheets e Google Calendar do Sheets Spark | **li no código** | Não acoplar o núcleo a esses provedores. Encapsular integrações em adapters; a implantação padrão indicada pelas regras do projeto é Postgres via `pg`. |
| Fluxo de orçamento por WhatsApp como confirmação de negócio | **li no código** | Não usar como substituto de `agendamentos`, `agendamento_itens` e recebimentos. Pode existir como canal de comunicação. |

## 3. Dívidas e riscos observados

### Segurança

- **Basic Auth no admin** — **li no código**: `proxy.ts` protege `/admin` e `/api/admin` por `ADMIN_USER`/`ADMIN_PASSWORD`, faz comparação direta e falha fechado quando as variáveis faltam. **Inferi**: é aceitável como contenção temporária, mas não é uma base adequada para multi-tenant; faltam identidade de usuário persistida, papéis, revogação, MFA, rate limit e trilha por usuário.
- **Basic Auth sem proteção de tentativas visível** — **li no código**: não há rate limit ou bloqueio de tentativas no `proxy.ts`. **Inferi**: deve ser substituído por sessão com hash de senha, expiração, rotação e limitação por IP/conta.
- **Telefone como histórico legado** — **li no código**: o primeiro modelo indexa telefone e a evolução acrescenta `acesso_hash`. **Inferi**: o novo modelo deve usar token privado e não permitir enumeração de agendamentos por telefone.
- **Uploads em filesystem local** — **li no código**: uploads são escritos em `public/uploads` e dependem de volume persistente. **Inferi**: sem volume corretamente montado, há perda de mídia; sem política de remoção e limite por tenant, há risco de custo e exaustão de disco.
- **Google Sheets com escrita por linha** — **li no código**: a sincronização valida cabeçalhos e escreve campos específicos, mas a própria documentação reconhece a janela entre leitura e escrita. **Inferi**: não usar a planilha como autoridade para lançamentos concorrentes.

### Performance e consistência

- **Catálogo evoluiu com JSONB e colunas canônicas coexistentes** — **li no código**: `catalog_items` mantém `service_data`, `variantes`, `opcoes_preco`, `precos` e novos campos normalizados. **Inferi**: isso foi útil para migração, mas a base nova deve escolher colunas relacionais para filtros e deixar JSONB apenas para extensões.
- **Agendamento antigo guarda data/hora como texto e serviços como JSONB** — **li no código**: a migração inicial usa `data`, `horario` e `servicos` em texto/JSONB. **Inferi**: no núcleo, usar `date`, `timestamptz` e itens relacionais para evitar consultas frágeis e permitir duração, conflito e relatório.
- **Cache do Sheets faz snapshot completo com lock Redis** — **li no código**: há lock, staging e `RENAME` atômico do snapshot. **Inferi**: a técnica é boa para leitura externa, mas não substitui índices e consultas no banco principal.

### Testes ausentes ou insuficientes

- **Cobertura do Aurum** — **li no código**: existem muitos testes unitários de lib/DB, mas não encontrei uma suíte Playwright equivalente cobrindo o fluxo público mobile, concorrência de horários, upload real em volume e autorização ponta a ponta.
- **Cobertura financeira** — **li no código**: o Sheets Spark tem testes de KPIs, filtros, normalização, caixa e Playwright. **Inferi**: ainda faltam testes de concorrência de lançamento, idempotência de importação, fechamento mensal imutável e permissões por tenant/papel.
- **Testes de falhas de deploy** — **li no código**: há teste para migração falhar sem impedir a linha de startup; não encontrei teste de `/api/ready` porque esse endpoint não aparece implementado. **Inferi**: o contrato de liveness/readiness precisa de testes de integração.

### Basic Auth e pontos de falha de deploy

- **Migração falha, servidor continua** — **li no código**: o `Dockerfile` usa `node scripts/migrate.js; node server.js`, e o runner tem retry, timeout e `process.exitCode` em erro. **Inferi**: isso evita indisponibilidade total, mas sem readiness explícito pode mascarar banco quebrado para o orquestrador.
- **Postgres indisponível no primeiro boot** — **li no código**: o runner tenta conexão dez vezes e o Docker mantém a inicialização do servidor mesmo se o processo de migração retornar erro. **li no código**: os testes cobrem retry, rollback, lock ocupado e falha ao gravar o carimbo da migração.
- **Troca de schema/adoção pública** — **li no código**: há guardas como `AURUM_ADOPTION_REQUIRED`, `AURUM_SCHEMA_SWITCH_REQUIRES_TRANSFER`, `AURUM_TARGET_CONFLICT` e `AURUM_SOURCE_SHAPE`. **Inferi**: essas transições foram pontos de risco operacional e devem virar procedimento separado, nunca migração automática silenciosa.
- **Build depende de `NEXT_PUBLIC_*` em build time** — **li no código**: o Dockerfile injeta WhatsApp, endereço, Instagram, telefone e horário como build args. **Inferi**: isso pode gerar imagem com configuração antiga e aumenta risco de expor configuração de tenant no bundle; preferir dados públicos lidos em runtime quando possível.
- **Não há health/readiness dedicado** — **li no código**: não encontrei rota `/api/health` ou `/api/ready` entre as rotas estudadas. **Inferi**: implementar o contrato de liveness/readiness antes de produção; liveness deve responder sem banco e readiness deve declarar migração/conexão.

## 4. Sheets Spark: módulo financeiro do plano Standard

### Entidades observadas

- **Agendamento** — **li no código**: possui identificação, cliente, telefone, veículo, data do serviço, horário, origem, status, observações, valor total, tipo de valor, valor recebido, data de pagamento, revisão, criação e atualização.
- **Item de serviço do agendamento** — **li no código**: relaciona o agendamento ao serviço, tem valor do serviço, ativo/inativo e é usado para ranking e quantidade vendida.
- **Catálogo de serviços** — **li no código**: alimenta serviços ativos, nome, categoria e preços/opções usados no orçamento e no ranking.
- **Custo/despesa** — **li no código**: possui data, competência, descrição, valor, tipo de custo, categoria, recorrência, frequência, fornecedor/funcionário, observações, origem, ativo e timestamps.
- **Orçamento, cliente, veículo e histórico de cliente** — **li no código**: aparecem nos ranges/leitura do Sheets e nas telas de orçamentos, clientes, agendamentos e integrações de cadastro.

### Indicadores a transformar em produto

- **KPIs** — **li no código**: faturamento/valor total, recebido, custos totais, custos fixos, custos variáveis, lucro realizado, margem operacional, quantidade de agendamentos, ticket médio, serviços vendidos e clientes.
- **Séries e comparativos** — **li no código**: série diária, série mensal, comparação nominal/percentual com competência anterior e preenchimento de dias sem movimento.
- **Fluxo de caixa** — **li no código**: entradas usam data de pagamento com fallback para a data de referência do serviço; saídas vêm de custos; o resultado é entradas menos saídas; a tela permite granularidade dia/semana/mês.
- **Ranking** — **li no código**: ranking de serviços por quantidade e faturamento, além de agregações por categoria.
- **Formas/status de pagamento e pendências** — **li no código**: a tela trata recebido, pendente/parcial/em aberto, status, forma de pagamento e alertas de recebimento excedente.
- **Decisão para Standard** — **inferi**: o Standard deve incluir lançamentos de receitas/despesas, categorias, recebimentos, competência, fluxo de caixa, KPIs, relatório mensal, ranking de serviços e exportação; conciliação bancária, automações avançadas e assistente ficam fora do primeiro corte.
- **Correção de modelagem** — **inferi**: substituir o único `valor_recebido`/`data_pagamento` por recebimentos parceláveis permite caixa correto e evita o limite reconhecido pela própria documentação do Spark.

## 5. Proposta de modelo de dados

### Convenções

- **inferi**: todas as tabelas abaixo têm `id uuid primary key default gen_random_uuid()`, `tenant_id uuid not null`, `criado_em timestamptz not null default now()` e `atualizado_em timestamptz not null default now()`, salvo indicação. Datas de negócio são `date`; instantes são `timestamptz`; valores monetários são `integer` em centavos.
- **inferi**: toda FK de entidade do tenant deve carregar `tenant_id` e ter constraint composta ou trigger que impeça cruzamento de tenants; índices começam por `tenant_id`.
- **inferi**: exclusão operacional deve ser inativação (`ativo`/`cancelado`), preservando histórico financeiro e auditoria.

### Núcleo comercial e agendamento

| Tabela | Colunas principais | Índices/constraints |
|---|---|---|
| `tenant_settings` | `tenant_id`, `nome_publico`, `slug`, `logo_url`, `cores jsonb`, `telefone`, `whatsapp`, `endereco jsonb`, `fuso_horario` default `America/Sao_Paulo`, `horario_funcionamento jsonb`, `plano`, `ativo` | **inferi**: PK/FK em `tenant_id`; `slug` único global; `fuso_horario` não nulo; nenhum preço ou mídia real hardcodado. |
| `admin_users` | `id`, `tenant_id`, `email`, `nome`, `senha_hash`, `papel` (`owner/admin/staff`), `ativo`, `ultimo_login_em` | **inferi**: único `(tenant_id, lower(email))`; CHECK de papel; índice `(tenant_id, ativo)`. Nunca guardar senha ou Basic Auth em claro. |
| `categorias` | `id`, `tenant_id`, `slug`, `nome`, `descricao`, `ordem`, `ativo` | **inferi**: único `(tenant_id, slug)`; índice `(tenant_id, ativo, ordem)`. |
| `servicos` | `id`, `tenant_id`, `categoria_id`, `slug`, `nome`, `descricao_curta`, `descricao`, `duracao_minutos`, `tipo_preco`, `imagem_url`, `beneficios jsonb`, `ativo`, `visivel_catalogo`, `destaque`, `ordem` | **inferi**: único `(tenant_id, slug)`; `duracao_minutos > 0`; FK da categoria no mesmo tenant; índice de vitrine `(tenant_id, visivel_catalogo, ativo, ordem)`. |
| `servico_precos` | `id`, `tenant_id`, `servico_id`, `porte`/`veiculo_tipo`, `valor_centavos`, `vigente_de`, `vigente_ate`, `ativo` | **inferi**: valor `>= 0`; intervalo de vigência não invertido; índice `(tenant_id, servico_id, porte, vigente_de desc)`; excluir sobreposição para a mesma combinação, via constraint/exclusion ou regra transacional. |
| `agendamentos` | `id`, `tenant_id`, `cliente_nome`, `cliente_telefone`, `cliente_email`, `veiculo_tipo`, `veiculo_porte`, `data_servico`, `inicio_em`, `fim_em`, `forma_entrega`, `status`, `observacoes`, `acesso_hash`, `origem`, `criado_por`, `criado_em`, `atualizado_em` | **inferi**: `fim_em > inicio_em`; índice `(tenant_id, data_servico, inicio_em)`; índice parcial em `acesso_hash`; exclusão de sobreposição para status ativos se a regra for um box por vez, ou tabela de recursos se houver várias baias. |
| `agendamento_itens` | `id`, `tenant_id`, `agendamento_id`, `servico_id`, `nome_snapshot`, `porte_snapshot`, `duracao_minutos_snapshot`, `preco_unitario_centavos_snapshot`, `quantidade`, `subtotal_centavos`, `ordem` | **inferi**: snapshots obrigatórios e imutáveis após confirmação; `quantidade > 0`, valores não negativos; FK composta ao agendamento; índice `(tenant_id, agendamento_id)`. |
| `bloqueios` | `id`, `tenant_id`, `inicio_em`, `fim_em`, `motivo`, `recorrencia jsonb`, `ativo`, `criado_por` | **inferi**: `fim_em > inicio_em`; índice `(tenant_id, inicio_em, fim_em)`; impedir sobreposição com agendamentos somente na camada que conhece a capacidade/recurso. |

### Financeiro Standard

| Tabela | Colunas principais | Índices/constraints |
|---|---|---|
| `financeiro_categorias` | `id`, `tenant_id`, `tipo` (`receita/despesa`), `nome`, `slug`, `cor`, `ordem`, `ativo`, `categoria_pai_id` opcional | **inferi**: único `(tenant_id, tipo, slug)`; CHECK impede pai de outro tenant; índice `(tenant_id, tipo, ativo, ordem)`. |
| `financeiro_lancamentos` | `id`, `tenant_id`, `tipo`, `status`, `categoria_id`, `descricao`, `valor_centavos`, `competencia`, `data_emissao`, `data_vencimento`, `data_pagamento`, `forma_pagamento`, `fornecedor_cliente`, `agendamento_id` opcional, `recorrente`, `frequencia`, `observacoes`, `origem`, `origem_id`, `ativo`, `criado_por` | **inferi**: valor `>= 0`; competência `YYYY-MM` representada por `date` no primeiro dia ou coluna derivada; índice `(tenant_id, data_pagamento, tipo, status)` e `(tenant_id, competencia, ativo)`; idempotência única por `(tenant_id, origem, origem_id)` quando origem tiver ID. |
| `financeiro_recebimentos` | `id`, `tenant_id`, `lancamento_id`, `valor_centavos`, `data_recebimento`, `forma_pagamento`, `referencia_externa`, `observacoes` | **inferi**: valor positivo; soma não pode exceder a receita por regra transacional; índice `(tenant_id, data_recebimento)` e `(tenant_id, lancamento_id)`. |

### Auditoria e assistente Plus

| Tabela | Colunas principais | Índices/constraints |
|---|---|---|
| `audit_log` | `id`, `tenant_id`, `ator_user_id`, `ator_tipo`, `acao`, `entidade`, `entidade_id`, `antes jsonb`, `depois jsonb`, `request_id`, `ip_hash`, `user_agent`, `criado_em` | **inferi**: append-only; índice `(tenant_id, entidade, entidade_id, criado_em desc)` e `(tenant_id, criado_em desc)`; não gravar tokens, senhas ou dados sensíveis desnecessários. |
| `assistant_threads` | `id`, `tenant_id`, `user_id`, `titulo`, `status`, `contexto jsonb`, `ultimo_evento_em`, timestamps | **inferi**: thread sempre pertence a um tenant; índice `(tenant_id, ultimo_evento_em desc)`. |
| `assistant_messages` | `id`, `thread_id`, `tenant_id`, `papel` (`user/assistant/system/tool`), `conteudo`, `modelo`, `tokens_entrada`, `tokens_saida`, `criado_em` | **inferi**: índice `(tenant_id, thread_id, criado_em)`; retenção configurável; separar conteúdo do usuário de instruções do sistema. |
| `assistant_runs` | `id`, `thread_id`, `tenant_id`, `status`, `idempotency_key`, `provider`, `modelo`, `inicio_em`, `fim_em`, `erro_codigo`, `custo_centavos` opcional | **inferi**: único `(tenant_id, idempotency_key)`; máquina de estados; não repetir efeito de ferramenta em retry. |
| `assistant_tool_calls` | `id`, `run_id`, `tenant_id`, `ferramenta`, `argumentos jsonb`, `resultado jsonb`, `status`, `aprovacao_necessaria`, `aprovado_por`, `executado_em` | **inferi**: índice `(tenant_id, run_id)`; allowlist de ferramentas; mutações financeiras/agendamento exigem confirmação ou política explícita. |
| `assistant_memories` | `id`, `tenant_id`, `chave`, `valor jsonb`, `origem`, `consentimento_em`, `expira_em`, `ativo` | **inferi**: único `(tenant_id, chave)`; retenção e exclusão por tenant; não persistir segredo ou dado pessoal sem finalidade. |

## 6. Estrutura de pastas proposta

**inferi**: manter o Next.js organizado por domínio, com regra de plano centralizada e serviços reutilizáveis:

```text
app/
  (public)/                 # site público, catálogo e agendamento mobile
  admin/                    # telas administrativas autenticadas
  api/
    public/                 # endpoints públicos limitados
    admin/                  # endpoints autenticados
    health/                 # liveness
    ready/                  # readiness/migração/banco
components/
  booking/                  # fluxo de agendamento
  catalog/                  # catálogo e preços
  finance/                  # Standard
  assistant/                # Plus
  ui/
db/
  migrations/
  ops/
  tests/
lib/
  plans.ts                  # única fonte das capacidades e limites
  auth/
  tenant/
  booking/
  catalog/
  finance/
  assistant/
  uploads/
  audit/
  integrations/
services/
  booking-service.ts
  catalog-service.ts
  finance-service.ts
  assistant-service.ts
  audit-service.ts
types/
tests/
  unit/
  integration/
  e2e/
```

**inferi**: rotas, admin, site público e assistente devem chamar `services/`; nenhum deles deve duplicar regra de negócio ou testar plano com `if (plan === ...)`.

## 7. Proposta de `lib/plans.ts`

**inferi**: `lib/plans.ts` deve ser declarativo, sem conhecer componentes de UI nem detalhes do banco. Um formato inicial:

```ts
export type PlanId = "free" | "standard" | "plus";

export type PlanFeatures = {
  publicCatalog: boolean;
  booking: boolean;
  privateBookingHistory: boolean;
  financial: boolean;
  financialReports: boolean;
  assistant: boolean;
  assistantWriteActions: boolean;
  maxServices: number | null;
  maxAdmins: number | null;
  maxBookingsPerMonth: number | null;
};

export const PLANS: Record<PlanId, PlanFeatures> = {
  free: {
    publicCatalog: true,
    booking: true,
    privateBookingHistory: true,
    financial: false,
    financialReports: false,
    assistant: false,
    assistantWriteActions: false,
    maxServices: 10,
    maxAdmins: 1,
    maxBookingsPerMonth: 30,
  },
  standard: {
    publicCatalog: true,
    booking: true,
    privateBookingHistory: true,
    financial: true,
    financialReports: true,
    assistant: false,
    assistantWriteActions: false,
    maxServices: null,
    maxAdmins: 3,
    maxBookingsPerMonth: null,
  },
  plus: {
    publicCatalog: true,
    booking: true,
    privateBookingHistory: true,
    financial: true,
    financialReports: true,
    assistant: true,
    assistantWriteActions: true,
    maxServices: null,
    maxAdmins: null,
    maxBookingsPerMonth: null,
  },
};

export function hasFeature(plan: PlanId, feature: keyof PlanFeatures): boolean {
  return PLANS[plan][feature] === true;
}
```

**inferi**: os limites acima são placeholders de produto, não decisão comercial; devem ser confirmados antes de implementação. A autorização real deve combinar `tenant_id`, papel do usuário e feature do plano, sempre no servidor.

## 8. Dúvidas objetivas para o Eduardo

1. O diretório definitivo deve ser este workspace `zapdetaily-hml`, ou você quer fisicamente mover/copiar os dois projetos para um novo monorepo? **inferi**: a auditoria não moveu nenhum arquivo.
2. O commit deve ser criado neste workspace, que ainda não tinha `.git`, ou em qual repositório/branch Git existente?
3. O agendamento aceita múltiplas baias/recursos simultâneos ou existe uma única agenda por tenant? Isso muda a constraint de conflito.
4. O Standard terá recebimentos parcelados desde o início? **inferi**: é a decisão recomendada para corrigir a limitação observada no Sheets Spark.
5. Quais limites reais de `free`, `standard` e `plus` devem substituir os placeholders de `lib/plans.ts`?
6. O assistente Plus poderá apenas consultar dados ou também criar/alterar agendamentos e lançamentos após confirmação explícita?
7. Qual política de retenção/exclusão deve valer para mensagens, memória e logs do assistente?
8. A Google Sheets será somente importação/exportação de transição ou continuará sendo integração operacional para algum tenant?
9. Qual provedor de autenticação deve substituir o Basic Auth no admin?
10. O healthcheck deve considerar apenas processo vivo, e o readiness deve falhar quando migração/banco estiverem indisponíveis?

## Execução e limites desta leitura

- **li no código**: foram estudados arquivos do Aurum em `app/`, `components/`, `db/`, `lib/`, `scripts/`, `Dockerfile`, `proxy.ts` e testes; e arquivos do Sheets Spark em `src/`, `tests/`, `docs/`, Docker/configuração e integração com Sheets/Supabase.
- **li no código**: não foram alterados os dois projetos de referência.
- **li no código**: não foram executados `lint`, `typecheck`, `test` ou `build`; esta tarefa foi documental.
- **inferi**: o modelo e a estrutura propostos são arquitetura de destino, não uma descrição de schema já implementado.
