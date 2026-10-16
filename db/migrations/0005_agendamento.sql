ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS intervalo_grade_minutos integer NOT NULL DEFAULT 30 CHECK (intervalo_grade_minutos > 0);
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS capacidade_simultanea integer NOT NULL DEFAULT 1 CHECK (capacidade_simultanea > 0);

CREATE TABLE IF NOT EXISTS bloqueios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  inicio_em timestamptz NOT NULL,
  fim_em timestamptz NOT NULL,
  motivo text NOT NULL DEFAULT '',
  criado_em timestamptz NOT NULL DEFAULT now(),
  CHECK (fim_em > inicio_em)
);
CREATE INDEX IF NOT EXISTS idx_bloqueios_tenant_periodo ON bloqueios (tenant_id, inicio_em, fim_em);

CREATE TABLE IF NOT EXISTS cliente_chaves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  chave_hash text NOT NULL,
  telefone_normalizado text NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now(),
  revogado_em timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_cliente_chaves_tenant_hash ON cliente_chaves (tenant_id, chave_hash);
CREATE INDEX IF NOT EXISTS idx_cliente_chaves_tenant_telefone ON cliente_chaves (tenant_id, telefone_normalizado);

CREATE TABLE IF NOT EXISTS agendamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  cliente_chave_id uuid NOT NULL REFERENCES cliente_chaves(id) ON DELETE RESTRICT,
  idempotency_key text NOT NULL,
  nome_cliente text NOT NULL,
  telefone text NOT NULL,
  porte text NOT NULL,
  modelo_veiculo text,
  placa_veiculo text,
  inicio_em timestamptz NOT NULL,
  fim_em timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'cancelado', 'concluido')),
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  cancelado_em timestamptz,
  UNIQUE (tenant_id, idempotency_key),
  CHECK (fim_em > inicio_em)
);
CREATE INDEX IF NOT EXISTS idx_agendamentos_tenant_periodo ON agendamentos (tenant_id, inicio_em, fim_em);
CREATE INDEX IF NOT EXISTS idx_agendamentos_cliente_chave ON agendamentos (cliente_chave_id, criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_agendamentos_status ON agendamentos (tenant_id, status, inicio_em);

CREATE TABLE IF NOT EXISTS agendamento_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agendamento_id uuid NOT NULL REFERENCES agendamentos(id) ON DELETE CASCADE,
  servico_id uuid REFERENCES servicos(id) ON DELETE SET NULL,
  nome_snapshot text NOT NULL,
  porte_snapshot text NOT NULL,
  valor_centavos_snapshot integer NOT NULL CHECK (valor_centavos_snapshot >= 0),
  duracao_minutos_snapshot integer NOT NULL CHECK (duracao_minutos_snapshot > 0),
  criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_agendamento_itens_agendamento ON agendamento_itens (agendamento_id);
