import { getDb } from "@/lib/db";
import { getEnv } from "@/lib/env";

export type TenantColors = {
  primary: string;
  accent: string;
  background: string;
  foreground: string;
  surface: string;
};

export type VehicleSize = { key: string; label: string };
export type BusinessHours = Record<string, { abertura?: string; fechamento?: string; fechado?: boolean }>;

export type TenantSettings = {
  nome: string;
  slogan: string;
  logoUrl: string;
  cores: TenantColors;
  whatsapp: string;
  endereco: string;
  instagram: string;
  horarioFuncionamento: BusinessHours;
  fusoHorario: string;
  portesVeiculo: VehicleSize[];
  intervaloGradeMinutos: number;
  capacidadeSimultanea: number;
};

const DEFAULT_COLORS: TenantColors = {
  primary: "#94a3b8",
  accent: "#cbd5e1",
  background: "#0f172a",
  foreground: "#e2e8f0",
  surface: "#1e293b",
};

const DEFAULT_VEHICLE_SIZES: VehicleSize[] = [
  { key: "moto", label: "Moto" },
  { key: "pequeno", label: "Pequeno" },
  { key: "medio", label: "Médio" },
  { key: "grande", label: "Grande" },
];

function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function getTenantSettingsFromEnv(): TenantSettings {
  const env = getEnv();
  return {
    nome: env.ZD_TENANT_NAME,
    slogan: env.ZD_TENANT_SLOGAN,
    logoUrl: env.ZD_TENANT_LOGO_URL,
    cores: { ...DEFAULT_COLORS, ...parseJson<Partial<TenantColors>>(env.ZD_TENANT_COLORS, {}) },
    whatsapp: env.ZD_TENANT_WHATSAPP,
    endereco: env.ZD_TENANT_ADDRESS,
    instagram: env.ZD_TENANT_INSTAGRAM,
    horarioFuncionamento: parseJson<BusinessHours>(env.ZD_TENANT_BUSINESS_HOURS, {}),
    fusoHorario: env.ZD_TENANT_TIMEZONE,
    portesVeiculo: parseJson<VehicleSize[]>(env.ZD_TENANT_VEHICLE_SIZES, DEFAULT_VEHICLE_SIZES),
    intervaloGradeMinutos: env.ZD_BOOKING_INTERVAL_MINUTES,
    capacidadeSimultanea: env.ZD_BOOKING_CAPACITY,
  };
}

export async function getTenantSettings(): Promise<TenantSettings> {
  const fallback = getTenantSettingsFromEnv();
  try {
    const result = await getDb().query<{
      nome_publico: string;
      slogan: string;
      logo_url: string;
      cores: TenantColors;
      whatsapp: string;
      endereco: string;
      instagram: string;
      horario_funcionamento: BusinessHours;
      fuso_horario: string;
      portes_veiculo: VehicleSize[];
      intervalo_grade_minutos: number;
      capacidade_simultanea: number;
    }>(`SELECT nome_publico, slogan, logo_url, cores, whatsapp, endereco,
               instagram, horario_funcionamento, fuso_horario, portes_veiculo, intervalo_grade_minutos, capacidade_simultanea
          FROM tenant_settings ORDER BY atualizado_em ASC LIMIT 1`);
    const row = result.rows[0];
    if (!row) return fallback;
    return {
      nome: row.nome_publico,
      slogan: row.slogan,
      logoUrl: row.logo_url,
      cores: { ...fallback.cores, ...row.cores },
      whatsapp: row.whatsapp,
      endereco: row.endereco,
      instagram: row.instagram,
      horarioFuncionamento: row.horario_funcionamento,
      fusoHorario: row.fuso_horario,
      portesVeiculo: row.portes_veiculo,
      intervaloGradeMinutos: row.intervalo_grade_minutos,
      capacidadeSimultanea: row.capacidade_simultanea,
    };
  } catch {
    return fallback;
  }
}

export async function getTenantSettingsForTenant(tenantId: string): Promise<TenantSettings> {
  const fallback = getTenantSettingsFromEnv();
  try {
    const result = await getDb().query<{
      nome_publico: string; slogan: string; logo_url: string; cores: TenantColors; whatsapp: string;
      endereco: string; instagram: string; horario_funcionamento: BusinessHours; fuso_horario: string; portes_veiculo: VehicleSize[]; intervalo_grade_minutos: number; capacidade_simultanea: number;
    }>(`SELECT nome_publico, slogan, logo_url, cores, whatsapp, endereco, instagram,
               horario_funcionamento, fuso_horario, portes_veiculo, intervalo_grade_minutos, capacidade_simultanea
          FROM tenant_settings WHERE tenant_id = $1`, [tenantId]);
    const row = result.rows[0];
    if (!row) return fallback;
    return { nome: row.nome_publico, slogan: row.slogan, logoUrl: row.logo_url,
      cores: { ...fallback.cores, ...row.cores }, whatsapp: row.whatsapp, endereco: row.endereco,
      instagram: row.instagram, horarioFuncionamento: row.horario_funcionamento,
      fusoHorario: row.fuso_horario, portesVeiculo: row.portes_veiculo,
      intervaloGradeMinutos: row.intervalo_grade_minutos, capacidadeSimultanea: row.capacidade_simultanea };
  } catch { return fallback; }
}

export function tenantSettingsToCssVariables(settings: TenantSettings): Record<`--${string}`, string> {
  return {
    "--zd-color-primary": settings.cores.primary,
    "--zd-color-accent": settings.cores.accent,
    "--zd-color-background": settings.cores.background,
    "--zd-color-foreground": settings.cores.foreground,
    "--zd-color-surface": settings.cores.surface,
  };
}
