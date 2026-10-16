CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email text NOT NULL,
  nome text NOT NULL,
  senha_hash text NOT NULL,
  papel text NOT NULL DEFAULT 'admin' CHECK (papel IN ('owner', 'admin', 'staff')),
  ativo boolean NOT NULL DEFAULT true,
  failed_attempts integer NOT NULL DEFAULT 0 CHECK (failed_attempts >= 0),
  locked_until timestamptz,
  ultimo_login_em timestamptz,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_admin_users_tenant_email
  ON admin_users (tenant_id, lower(email));
CREATE INDEX IF NOT EXISTS idx_admin_users_tenant_ativo
  ON admin_users (tenant_id, ativo);

CREATE TABLE IF NOT EXISTS admin_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  criado_em timestamptz NOT NULL DEFAULT now(),
  expira_em timestamptz NOT NULL,
  revogado_em timestamptz,
  ultimo_acesso_em timestamptz
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_user_active
  ON admin_sessions (admin_user_id, expira_em)
  WHERE revogado_em IS NULL;
