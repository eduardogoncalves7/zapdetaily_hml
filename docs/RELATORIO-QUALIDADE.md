# Relatório de qualidade

## Executado

- Branch: `chore/qualidade`.
- `npm run lint`: passou.
- `npm run typecheck`: passou.
- `npm test`: passou, 35 testes; 2 testes de integração ficaram condicionados à presença de PostgreSQL.
- `npm run build`: passou com Next.js 16.4.2.
- `npm run test:e2e:basic`: executado; health e acesso ao financeiro no `basic` passaram, demais cenários foram explicitamente pulados por falta de seed/credenciais.
- `npm run test:e2e:standard`: executado; health passou e os cenários dependentes de ambiente foram explicitamente pulados.
- `npm run test:e2e:plus`: executado; health passou e os cenários dependentes de ambiente foram explicitamente pulados.
- `npm audit --audit-level=high`: executado após atualizar Vitest para 5.0.5. Permanecem 5 vulnerabilidades altas transitivas em `braces`, originadas por `eslint-config-next`/`fast-glob`.
- Foram adicionados headers globais: CSP básica, `nosniff`, `DENY` para frame, Referrer-Policy e Permissions-Policy.
- Foram adicionados rate limits para criação de agendamento e leitura de disponibilidade/histórico.
- O upload continua validando conteúdo por `sharp`, formato JPG/PNG/WebP, bytes e megapixels; a rota agora exige `adminPanel`.
- O CI executa migrações contra PostgreSQL 16 e roda uma matriz E2E `basic`, `standard` e `plus`.

## Sem cobertura ou pendências

- O Postgres local não foi executado nesta máquina: Docker não está instalado. A integração real está configurada no CI e usa o service PostgreSQL 16; localmente o teste permanece skipped quando não há `DATABASE_URL`.
- Os fluxos E2E completos de cliente, admin, financeiro e assistente não foram executados localmente porque exigem tenant migrado, seed, admin e flags de ambiente. Os skips são condicionais e visíveis, não substituem os testes.
- Axe e a métrica mobile de `domContentLoaded` estão implementados nos E2E, mas ficaram sem execução local por falta de `E2E_BOOKING_READY`.
- `npm audit` permanece vermelho por dependência transitiva de `braces`. `npm audit fix --force` propõe downgrade incompatível de `eslint-config-next`; não foi aplicado automaticamente.
- O rate limit é em memória por processo. Para múltiplas réplicas, a limitação deverá migrar para armazenamento compartilhado.
- A CSP ainda permite `unsafe-inline` e `unsafe-eval` por compatibilidade com o runtime atual; deve ser endurecida após eliminar essas necessidades.

## Evidências de revisão

- As rotas administrativas existentes fazem `requireApiAdmin` antes de operar sobre dados; login e logout são exceções de ciclo de sessão.
- Consultas SQL revisadas usam parâmetros; filtros dinâmicos só adicionam fragmentos fixos e mantêm os valores parametrizados.
- O acesso ao financeiro no plano `basic` foi coberto por teste unitário e E2E.
