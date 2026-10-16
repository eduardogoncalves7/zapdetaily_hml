CREATE TABLE IF NOT EXISTS categorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nome text NOT NULL,
  slug text NOT NULL,
  descricao text NOT NULL DEFAULT '',
  ativo boolean NOT NULL DEFAULT true,
  ordem integer NOT NULL DEFAULT 0 CHECK (ordem >= 0),
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, id),
  UNIQUE (tenant_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_categorias_tenant_ativo_ordem
  ON categorias (tenant_id, ativo, ordem);

CREATE TABLE IF NOT EXISTS servicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  categoria_id uuid,
  nome text NOT NULL,
  slug text NOT NULL,
  descricao text NOT NULL DEFAULT '',
  itens_inclusos jsonb NOT NULL DEFAULT '[]'::jsonb,
  duracao_minutos integer NOT NULL CHECK (duracao_minutos > 0),
  foto_path text,
  ativo boolean NOT NULL DEFAULT true,
  ordem integer NOT NULL DEFAULT 0 CHECK (ordem >= 0),
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, id),
  UNIQUE (tenant_id, slug),
  FOREIGN KEY (tenant_id, categoria_id) REFERENCES categorias (tenant_id, id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_servicos_tenant_ativo_ordem
  ON servicos (tenant_id, ativo, ordem);
CREATE INDEX IF NOT EXISTS idx_servicos_categoria
  ON servicos (tenant_id, categoria_id, ativo, ordem);

CREATE TABLE IF NOT EXISTS servico_precos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  servico_id uuid NOT NULL,
  porte text NOT NULL CHECK (length(trim(porte)) > 0),
  valor_centavos integer NOT NULL CHECK (valor_centavos >= 0),
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, servico_id, porte),
  FOREIGN KEY (tenant_id, servico_id) REFERENCES servicos (tenant_id, id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_servico_precos_servico
  ON servico_precos (tenant_id, servico_id, porte);
