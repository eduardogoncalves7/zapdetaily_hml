CREATE TABLE IF NOT EXISTS assistant_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  numero_hash text NOT NULL,
  nome text NOT NULL,
  papel text NOT NULL DEFAULT 'owner' CHECK (papel IN ('owner','admin')),
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, numero_hash)
);
CREATE INDEX IF NOT EXISTS idx_assistant_contacts_allowlist ON assistant_contacts (tenant_id, numero_hash, ativo);

CREATE TABLE IF NOT EXISTS integration_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('messaging','speech_to_text','intent_parser','calendar')),
  provedor text NOT NULL,
  conta_referencia text,
  webhook_referencia text,
  configuracao_referencia text,
  ativo boolean NOT NULL DEFAULT false,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, tipo)
);

CREATE TABLE IF NOT EXISTS assistant_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  provedor text NOT NULL,
  mensagem_externa_id text NOT NULL,
  numero_hash text NOT NULL,
  texto text NOT NULL,
  status text NOT NULL CHECK (status IN ('recebida','ignorada','invalida','ambigua','confirmacao_pendente','executada','erro')),
  intent_tipo text,
  criado_em timestamptz NOT NULL DEFAULT now(),
  processado_em timestamptz,
  UNIQUE (tenant_id, provedor, mensagem_externa_id)
);
CREATE INDEX IF NOT EXISTS idx_assistant_messages_tenant_created ON assistant_messages (tenant_id, criado_em DESC);

CREATE TABLE IF NOT EXISTS assistant_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  periodo text NOT NULL CHECK (periodo IN ('dia','mes')),
  referencia date NOT NULL,
  mensagens integer NOT NULL DEFAULT 0 CHECK (mensagens >= 0),
  limite integer NOT NULL CHECK (limite > 0),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, periodo, referencia)
);
