import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  APP_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL é obrigatória"),
  DB_MIGRATION_TIMEOUT_MS: z.coerce.number().int().positive().default(120000),
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
