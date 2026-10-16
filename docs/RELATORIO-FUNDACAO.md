# Relatório da validação da fundação

Data: 2026-10-15  
Branch: `feat/fundacao`  
Commits verificados: `d969bf8`, `1245697`, `bfc18e2`

## Resumo executivo

**Executei** a instalação limpa das dependências, lint, typecheck, testes unitários e build da aplicação. Todos passaram ao final. O Vitest precisou de uma correção de configuração para funcionar no Windows; o teste passou fora do sandbox depois da correção.

**Executei** uma revisão estática do Dockerfile e corrigi a cópia de `public/`, pois essa pasta não existe na fundação.

**Não executei** os testes que dependem de Postgres ou Docker: o comando `docker` não está instalado/disponível neste ambiente. Portanto, não há evidência local de `docker compose up`, migração contra Postgres, build da imagem, execução do container, lock concorrente ou rollback transacional.

## O que executei

### Aplicação

| Comando | Resultado resumido |
|---|---|
| `npm ci` | Passou; 419 pacotes instalados. Houve aviso de `eslint` depreciado e de scripts de instalação não aprovados para `esbuild`/`unrs-resolver`. |
| `npm run lint` | Passou, sem erros. |
| `npm run typecheck` | Passou quando executado isoladamente. Uma execução paralela com `build` falhou porque o build regenerou `.next/types` durante o typecheck; a repetição sequencial passou. |
| `npm test` | Passou fora do sandbox: 1 arquivo e 1 teste aprovados. Dentro do sandbox, o esbuild recebeu `Acesso negado` ao resolver a configuração. |
| `npm run build` | Passou; Next.js 16.4.2, compilação, TypeScript, páginas estáticas e rotas `/api/health` e `/api/ready` gerados. |

### Correções realizadas

**Executei** duas correções em commits separados:

- `1245697 fix(test): tornar configuracao do vitest portavel`: troca de `vitest.config.ts` por `vitest.config.mjs`, configuração explícita no script `test` e import relativo no teste de health.
- `bfc18e2 fix(docker): remover copia de public inexistente`: remoção do `COPY /app/public`, pois não existe diretório `public/` no repositório atual.

### Docker/Postgres local

**Executei** a tentativa de:

```text
docker compose up -d db
```

Resultado: falhou imediatamente com `docker : o termo 'docker' não é reconhecido`. A verificação fora do sandbox produziu o mesmo resultado. Não usei Coolify, banco remoto ou qualquer banco externo.

Por causa desse bloqueio, ficaram **não executados**:

- `npm run db:migrate` duas vezes contra Postgres local;
- consulta de `schema_migrations`;
- build e execução da imagem Docker;
- cenário do container sem banco (`/api/health = 200`, `/api/ready = 503`);
- cenário do container com banco (`/api/ready = 200`);
- duas instâncias simultâneas do runner;
- migração deliberadamente falha e verificação de rollback.

## O que li ou presumi

**Li no código** que o runner:

- lê `db/migrations/*.sql` em ordem lexicográfica;
- cria `schema_migrations`;
- usa advisory lock com uma conexão dedicada;
- abre uma transação por arquivo, grava o nome aplicado e faz rollback em erro;
- tenta conexão até 10 vezes, com intervalo de 3 segundos;
- possui timeout total configurável por `DB_MIGRATION_TIMEOUT_MS`;
- encerra com erro no runner, enquanto o Dockerfile usa `node scripts/migrate.mjs || true` e inicia o servidor.

**Li no código** que `/api/health` não consulta o banco e `/api/ready` consulta o banco e exige a existência de `schema_migrations`.

**Li no código** que a migração inicial cria `tenants` e `tenant_settings`, usa `pgcrypto` e possui constraints de chave primária, estrangeira e unicidade.

**Li no código** que o Dockerfile usa Node 20 Alpine, build standalone e usuário não-root.

**Presumi**, sem poder executar por falta do Docker, que o volume do compose e o Postgres 16 estão adequados para o primeiro teste. Isso precisa ser confirmado quando o Docker Desktop estiver disponível.

## Busca de segredos e dados do Aurum

**Executei** busca por candidatos a senha, token, secret, chave privada, `DATABASE_URL` e URLs de conexão nos arquivos do projeto, excluindo dependências e `.git`. Não encontrei segredo real.

**Executei** busca por telefones, preços, domínios externos e dados do Aurum. Não encontrei telefone, preço, endereço, foto ou segredo real nos arquivos da fundação.

**Li no código** referências neutras esperadas, como `localhost`, `zapdetaily` e o documento de auditoria que cita Aurum como referência de estudo. Não removi essas referências documentais porque não contêm dados reais e identificam a origem da análise.

**Li no estado do Git** que `AGENTS.md` está não rastreado. Ele foi fornecido no workspace e não foi incluído nos commits.

## Divergências em relação ao AGENTS.md

- **Executei/confirmado:** branch `feat/fundacao` e commits seguem o formato Conventional Commits.
- **Executei/confirmado:** `lint`, `typecheck`, `test` e `build` passaram ao final, observadas as condições descritas acima.
- **Divergência de validação:** Docker e Postgres local não puderam ser validados porque o CLI Docker não está disponível.
- **Estado esperado da fundação:** ainda não existe `lib/plans.ts`, pasta de services nem módulos de catálogo, agendamento, financeiro ou assistente. Isso não é uma falha do escopo da fundação, mas será obrigatório antes dos módulos de negócio.
- **Teste E2E:** existe configuração e teste Playwright, mas `npm run test:e2e` não foi solicitado na bateria principal e não foi executado nesta rodada.
- **Ambiente:** `instrumentation.ts` registra erro de ambiente, mas não derruba o processo; isso é compatível com a exigência de startup tolerante, porém precisa ser confirmado no container.
- **Dockerfile:** a cópia de `public/` foi corrigida porque o diretório não existe. O build da imagem ainda precisa ser executado com Docker disponível.

## Próximos passos objetivos

1. Disponibilizar Docker Desktop/CLI no ambiente local.
2. Reexecutar exatamente os cenários de Postgres, container, advisory lock e rollback listados acima.
3. Rodar `npm run test:e2e` com o servidor local.
4. Só depois iniciar o primeiro módulo de negócio.

## Publicação da branch

**Executei** `git push origin feat/fundacao`, conforme solicitado. O push não foi possível porque este repositório não possui nenhum remote configurado; `git remote` não retornou remotes. Nenhum merge foi feito.
