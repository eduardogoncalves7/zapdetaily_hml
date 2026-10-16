# Decisões da fundação

- **Postgres via `pg`, sem ORM** — mantém SQL versionado explícito e segue a decisão arquitetural do projeto.
- **Liveness separado de readiness** — `/api/health` não consulta o banco; `/api/ready` exige conexão e `schema_migrations`.
- **Startup tolerante a falha de migração** — o container registra o erro e inicia o servidor; o orquestrador pode usar readiness para não enviar tráfego dependente do banco.
- **Migrações em JavaScript operacional** — o runner precisa estar disponível no runtime standalone do Docker, sem depender de ferramentas de desenvolvimento.
- **Seed neutro** — somente um tenant demo sem marca, preço, telefone, endereço ou foto de referência.
- **Tailwind v4 via PostCSS** — reduz configuração inicial e mantém a camada visual pronta para os módulos futuros.

Estas decisões são da fundação técnica e não definem os limites comerciais dos planos.

- **Planos centralizados** — `lib/plans.ts` é a única fonte de capabilities; o plano ativo vem de `ZD_PLAN` e a UI/API consultam helpers, sem comparar o plano diretamente.
- **White-label em runtime** — `tenant_settings` recebe configurações iniciais do ambiente pelo seed e o tema é aplicado por variáveis CSS no layout, sem rebuild por tenant.
