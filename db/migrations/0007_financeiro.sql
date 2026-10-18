CREATE TABLE IF NOT EXISTS financeiro_categorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  nome text NOT NULL,
  slug text NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  ordem integer NOT NULL DEFAULT 0 CHECK (ordem >= 0),
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, id),
  UNIQUE (tenant_id, tipo, slug)
);
CREATE INDEX IF NOT EXISTS idx_financeiro_categorias_tenant_tipo ON financeiro_categorias (tenant_id, tipo, ativo, ordem);

CREATE TABLE IF NOT EXISTS financeiro_lancamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  status text NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'estornado', 'excluido')),
  categoria_id uuid,
  forma_pagamento text NOT NULL DEFAULT 'nao_informado',
  data_lancamento date NOT NULL,
  valor_centavos integer NOT NULL CHECK (valor_centavos > 0),
  descricao text NOT NULL,
  origem text NOT NULL CHECK (origem IN ('manual', 'agendamento')),
  agendamento_id uuid REFERENCES agendamentos(id) ON DELETE RESTRICT,
  criado_por uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  excluido_por uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  excluido_em timestamptz,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, id),
  FOREIGN KEY (tenant_id, categoria_id) REFERENCES financeiro_categorias (tenant_id, id),
  CHECK ((origem = 'agendamento' AND agendamento_id IS NOT NULL) OR (origem = 'manual' AND agendamento_id IS NULL))
);
CREATE INDEX IF NOT EXISTS idx_financeiro_lancamentos_periodo ON financeiro_lancamentos (tenant_id, data_lancamento, tipo, status);
CREATE INDEX IF NOT EXISTS idx_financeiro_lancamentos_categoria ON financeiro_lancamentos (tenant_id, categoria_id, data_lancamento);
CREATE UNIQUE INDEX IF NOT EXISTS ux_financeiro_receita_agendamento ON financeiro_lancamentos (tenant_id, agendamento_id) WHERE tipo = 'receita' AND origem = 'agendamento' AND agendamento_id IS NOT NULL;
