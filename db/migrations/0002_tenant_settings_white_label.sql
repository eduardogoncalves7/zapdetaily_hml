ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS slogan text NOT NULL DEFAULT '';
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS logo_url text NOT NULL DEFAULT '';
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS cores jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS whatsapp text NOT NULL DEFAULT '';
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS endereco text NOT NULL DEFAULT '';
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS instagram text NOT NULL DEFAULT '';
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS horario_funcionamento jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS portes_veiculo jsonb NOT NULL DEFAULT '[{"key":"moto","label":"Moto"},{"key":"pequeno","label":"Pequeno"},{"key":"medio","label":"Médio"},{"key":"grande","label":"Grande"}]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_tenant_settings_atualizado_em ON tenant_settings (atualizado_em);
