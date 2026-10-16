import process from "node:process";
import pg from "pg";

const { Pool } = pg;
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL ausente");

const jsonEnv = (name, fallback) => {
  try {
    return JSON.parse(process.env[name] ?? fallback);
  } catch {
    throw new Error(`${name} deve conter JSON vÃ¡lido`);
  }
};

const tenant = {
  nome: process.env.ZD_TENANT_NAME ?? "Tenant Demo",
  slogan: process.env.ZD_TENANT_SLOGAN ?? "Seu cuidado, do seu jeito.",
  logoUrl: process.env.ZD_TENANT_LOGO_URL ?? "",
  cores: jsonEnv("ZD_TENANT_COLORS", "{}"),
  whatsapp: process.env.ZD_TENANT_WHATSAPP ?? "",
  endereco: process.env.ZD_TENANT_ADDRESS ?? "",
  instagram: process.env.ZD_TENANT_INSTAGRAM ?? "",
  horario: jsonEnv("ZD_TENANT_BUSINESS_HOURS", "{}"),
  timezone: process.env.ZD_TENANT_TIMEZONE ?? "America/Sao_Paulo",
  portes: jsonEnv("ZD_TENANT_VEHICLE_SIZES", "[{\"key\":\"moto\",\"label\":\"Moto\"},{\"key\":\"pequeno\",\"label\":\"Pequeno\"},{\"key\":\"medio\",\"label\":\"MÃ©dio\"},{\"key\":\"grande\",\"label\":\"Grande\"}]"),
};

const pool = new Pool({ connectionString: databaseUrl });
try {
  await pool.query("BEGIN");
  if (process.argv.includes("--clean")) {
    await pool.query("TRUNCATE tenant_settings, tenants CASCADE");
    console.log("Seed limpo.");
  } else {
    await pool.query(
      `INSERT INTO tenants (nome, slug) VALUES ($1, $2)
       ON CONFLICT (slug) DO NOTHING`,
      [tenant.nome, "tenant-demo"],
    );
    await pool.query(
      `INSERT INTO tenant_settings
         (tenant_id, nome_publico, slug, slogan, logo_url, cores, whatsapp, endereco,
          instagram, horario_funcionamento, fuso_horario, portes_veiculo)
       SELECT id, $1, slug, $2, $3, $4::jsonb, $5, $6, $7, $8::jsonb, $9, $10::jsonb
         FROM tenants WHERE slug = $11
       ON CONFLICT (tenant_id) DO UPDATE SET
         nome_publico = EXCLUDED.nome_publico,
         slogan = EXCLUDED.slogan,
         logo_url = EXCLUDED.logo_url,
         cores = EXCLUDED.cores,
         whatsapp = EXCLUDED.whatsapp,
         endereco = EXCLUDED.endereco,
         instagram = EXCLUDED.instagram,
         horario_funcionamento = EXCLUDED.horario_funcionamento,
         fuso_horario = EXCLUDED.fuso_horario,
         portes_veiculo = EXCLUDED.portes_veiculo,
         atualizado_em = now()`,
      [tenant.nome, tenant.slogan, tenant.logoUrl, JSON.stringify(tenant.cores), tenant.whatsapp,
        tenant.endereco, tenant.instagram, JSON.stringify(tenant.horario), tenant.timezone,
        JSON.stringify(tenant.portes), "tenant-demo"],
    );
    console.log("Seed demo aplicado.");
  }
  await pool.query("COMMIT");
} catch (error) {
  await pool.query("ROLLBACK");
  throw error;
} finally {
  await pool.end();
}
