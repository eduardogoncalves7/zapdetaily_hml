ALTER TABLE agendamentos DROP CONSTRAINT IF EXISTS agendamentos_status_check;
ALTER TABLE agendamentos ADD CONSTRAINT agendamentos_status_check CHECK (status IN ('pendente', 'confirmado', 'recusado', 'cancelado', 'concluido', 'nao_compareceu'));

CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  ator_admin_id uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  entidade text NOT NULL,
  entidade_id uuid,
  acao text NOT NULL,
  status_anterior text,
  status_novo text,
  detalhes jsonb NOT NULL DEFAULT '{}'::jsonb,
  criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_log_tenant_criado ON audit_log (tenant_id, criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_entidade ON audit_log (tenant_id, entidade, entidade_id, criado_em DESC);
