import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  APP_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL é obrigatória"),
  DB_MIGRATION_TIMEOUT_MS: z.coerce.number().int().positive().default(120000),
  ZD_PLAN: z.string().default("basic"),
  ZD_TENANT_NAME: z.string().default("Tenant Demo"),
  ZD_TENANT_SLOGAN: z.string().default("Seu cuidado, do seu jeito."),
  ZD_TENANT_LOGO_URL: z.string().default(""),
  ZD_TENANT_COLORS: z.string().default("{}"),
  ZD_TENANT_WHATSAPP: z.string().default(""),
  ZD_TENANT_ADDRESS: z.string().default(""),
  ZD_TENANT_INSTAGRAM: z.string().default(""),
  ZD_TENANT_BUSINESS_HOURS: z.string().default("{}"),
  ZD_TENANT_TIMEZONE: z.string().default("America/Sao_Paulo"),
  ZD_ADMIN_SESSION_TTL_SECONDS: z.coerce.number().int().positive().default(28800),
  ZD_BOOKING_INTERVAL_MINUTES: z.coerce.number().int().positive().default(30),
  ZD_BOOKING_CAPACITY: z.coerce.number().int().positive().default(1),
  ASSISTANT_ENABLED: z.enum(["true", "false"]).default("false").transform((value) => value === "true"),
  ASSISTANT_OWNER_ALLOWLIST: z.string().default(""),
  ASSISTANT_DAILY_LIMIT: z.coerce.number().int().positive().default(100),
  ASSISTANT_MONTHLY_LIMIT: z.coerce.number().int().positive().default(3000),
  ZD_TENANT_VEHICLE_SIZES: z.string().default("[{\"key\":\"moto\",\"label\":\"Moto\"},{\"key\":\"pequeno\",\"label\":\"Pequeno\"},{\"key\":\"medio\",\"label\":\"Médio\"},{\"key\":\"grande\",\"label\":\"Grande\"}]"),
});

export type AppEnv = z.infer<typeof envSchema>;

let cachedEnv: AppEnv | undefined;

export function getEnv(): AppEnv {
  if (!cachedEnv) {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
      throw new Error(`Ambiente inválido: ${parsed.error.issues.map((issue) => issue.path.join(".")).join(", ")}`);
    }
    cachedEnv = parsed.data;
  }
  return cachedEnv;
}

export function validateEnvironment(): void {
  getEnv();
}
