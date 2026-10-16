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
- **Autenticação administrativa por sessão** — senhas usam scrypt com salt aleatório; o cookie HttpOnly guarda o token opaco e o banco guarda somente seu SHA-256. Sessões expiram e logout grava `revogado_em`.
- **Defesa contra tentativa de login** — cada usuário é bloqueado após 5 falhas por 15 minutos; há também rate limit por IP em memória de processo para reduzir rajadas. A proteção persistente por usuário é a autoridade do bloqueio.
- **CSRF por Origin** — toda mutação administrativa exige `Origin` igual à origem efetiva da requisição; login e logout são as únicas mutações administrativas atuais, sendo login a exceção natural ao guard de sessão.
- **Reserva pública transacional** — o agendamento grava itens com snapshot de nome, porte, preço e duração; a disponibilidade é recalculada no servidor e a criação usa advisory lock por tenant e dia local antes de contar sobreposições.
- **Histórico por chave privada** — o telefone participa apenas da criação e identificação operacional; o histórico e o cancelamento exigem o token opaco do cookie HttpOnly, cujo hash é armazenado por tenant. Não existe busca de histórico por telefone.
- **Confirmação após persistência** — a tela de confirmação só é exibida depois do retorno bem-sucedido da API; falhas mantêm o estado do wizard para permitir nova tentativa idempotente.
