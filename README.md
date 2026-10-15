# Zap Detaily HML

Fundação do produto multi-tenant em Next.js, TypeScript strict, Tailwind e Postgres 16 via `pg`.

## Rodar localmente

```sh
copy .env.example .env.local
npm install
docker compose up -d db
npm run db:migrate
npm run db:seed
npm run dev
```

Abra <http://localhost:3000>. O liveness está em `/api/health`; o readiness em `/api/ready` exige conexão com o Postgres e a tabela de migrações.

## Scripts

`npm run dev`, `lint`, `typecheck`, `test`, `test:e2e`, `build`, `db:migrate`, `db:seed` e `seed:clean` estão definidos no `package.json`.

Para remover os dados demo: `npm run seed:clean`. O Dockerfile usa build standalone, usuário não-root e mantém o servidor subindo mesmo quando a migração falha; nesse caso `/api/health` continua disponível e `/api/ready` retorna `503`.
