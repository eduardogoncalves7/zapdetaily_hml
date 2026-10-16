import { getDb } from "../lib/db";
import type { VehicleSize } from "../lib/tenant-settings";

export type CatalogCategory = {
  id: string;
  nome: string;
  slug: string;
  descricao: string;
  ativo: boolean;
  ordem: number;
};

export type CatalogPrice = { porte: string; valorCentavos: number };

export type CatalogService = {
  id: string;
  categoriaId: string | null;
  categoriaNome: string | null;
  nome: string;
  slug: string;
  descricao: string;
  itensInclusos: string[];
  duracaoMinutos: number;
  fotoPath: string | null;
  ativo: boolean;
  ordem: number;
  precos: CatalogPrice[];
};

export type CatalogServiceInput = {
  categoriaId?: string | null;
  nome: string;
  slug: string;
  descricao?: string;
  itensInclusos?: string[];
  duracaoMinutos: number;
  fotoPath?: string | null;
  ordem?: number;
  precos?: CatalogPrice[];
};

type ServiceRow = Omit<CatalogService, "itensInclusos" | "precos"> & { itens_inclusos: unknown };

function toService(row: ServiceRow, prices: CatalogPrice[]): CatalogService {
  return {
    id: row.id, categoriaId: row.categoriaId, categoriaNome: row.categoriaNome,
    nome: row.nome, slug: row.slug, descricao: row.descricao,
    itensInclusos: Array.isArray(row.itens_inclusos) ? row.itens_inclusos.filter((item): item is string => typeof item === "string") : [],
    duracaoMinutos: row.duracaoMinutos, fotoPath: row.fotoPath, ativo: row.ativo,
    ordem: row.ordem, precos: prices,
  };
}

const SERVICE_SELECT = `SELECT s.id, s.categoria_id AS "categoriaId", c.nome AS "categoriaNome",
  s.nome, s.slug, s.descricao, s.itens_inclusos, s.duracao_minutos AS "duracaoMinutos",
  s.foto_path AS "fotoPath", s.ativo, s.ordem
  FROM servicos s LEFT JOIN categorias c ON c.tenant_id = s.tenant_id AND c.id = s.categoria_id`;

async function withPrices(tenantId: string, rows: ServiceRow[]): Promise<CatalogService[]> {
  if (!rows.length) return [];
  const prices = await getDb().query<{ servico_id: string; porte: string; valor_centavos: number }>(
    `SELECT servico_id, porte, valor_centavos FROM servico_precos WHERE tenant_id = $1 AND servico_id = ANY($2::uuid[])`,
    [tenantId, rows.map((row) => row.id)],
  );
  const byService = new Map<string, CatalogPrice[]>();
  for (const price of prices.rows) {
    const list = byService.get(price.servico_id) ?? [];
    list.push({ porte: price.porte, valorCentavos: price.valor_centavos });
    byService.set(price.servico_id, list);
  }
  return rows.map((row) => toService(row, byService.get(row.id) ?? []));
}

export function getPriceForVehicleSize(service: CatalogService, porte: string): CatalogPrice | null {
  return service.precos.find((price) => price.porte === porte) ?? null;
}

export function slugify(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function validateCatalogServiceInput(input: CatalogServiceInput, vehicleSizes: VehicleSize[]): void {
  if (!input.nome.trim() || !input.slug.trim()) throw new Error("Nome e slug são obrigatórios");
  if (!Number.isInteger(input.duracaoMinutos) || input.duracaoMinutos <= 0) throw new Error("A duração deve ser positiva");
  if ((input.ordem ?? 0) < 0) throw new Error("A ordem não pode ser negativa");
  if ((input.itensInclusos ?? []).some((item) => !item.trim())) throw new Error("Itens inclusos inválidos");
  const validSizes = new Set(vehicleSizes.map((size) => size.key));
  for (const price of input.precos ?? []) {
    if (!validSizes.has(price.porte)) throw new Error(`Porte inválido: ${price.porte}`);
    if (!Number.isInteger(price.valorCentavos) || price.valorCentavos < 0) throw new Error("Preço inválido");
  }
}

export async function getDefaultTenantId(): Promise<string | null> {
  const result = await getDb().query<{ tenant_id: string }>("SELECT tenant_id FROM tenant_settings ORDER BY atualizado_em ASC LIMIT 1");
  return result.rows[0]?.tenant_id ?? null;
}

export async function listCategories(tenantId: string, includeInactive = false): Promise<CatalogCategory[]> {
  const result = await getDb().query<CatalogCategory>(`SELECT id, nome, slug, descricao, ativo, ordem FROM categorias WHERE tenant_id = $1 ${includeInactive ? "" : "AND ativo = true"} ORDER BY ordem, nome`, [tenantId]);
  return result.rows;
}

export async function listServices(tenantId: string, includeInactive = false): Promise<CatalogService[]> {
  const result = await getDb().query<ServiceRow>(`${SERVICE_SELECT} WHERE s.tenant_id = $1 ${includeInactive ? "" : "AND s.ativo = true"} ORDER BY s.ordem, s.nome`, [tenantId]);
  return withPrices(tenantId, result.rows);
}

export async function getServiceBySlug(tenantId: string, slug: string): Promise<CatalogService | null> {
  const result = await getDb().query<ServiceRow>(`${SERVICE_SELECT} WHERE s.tenant_id = $1 AND s.slug = $2 AND s.ativo = true LIMIT 1`, [tenantId, slug]);
  const services = await withPrices(tenantId, result.rows);
  return services[0] ?? null;
}

export async function createCategory(tenantId: string, input: Omit<CatalogCategory, "id">): Promise<CatalogCategory> {
  const result = await getDb().query<CatalogCategory>(`INSERT INTO categorias (tenant_id, nome, slug, descricao, ativo, ordem) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, nome, slug, descricao, ativo, ordem`, [tenantId, input.nome.trim(), input.slug.trim(), input.descricao, input.ativo, input.ordem]);
  return result.rows[0];
}

export async function createService(tenantId: string, input: CatalogServiceInput, vehicleSizes: VehicleSize[]): Promise<CatalogService> {
  validateCatalogServiceInput(input, vehicleSizes);
  const client = await getDb().connect();
  try {
    await client.query("BEGIN");
    const inserted = await client.query<ServiceRow>(`INSERT INTO servicos (tenant_id, categoria_id, nome, slug, descricao, itens_inclusos, duracao_minutos, foto_path, ordem) VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9) RETURNING id, categoria_id AS "categoriaId", NULL::text AS "categoriaNome", nome, slug, descricao, itens_inclusos, duracao_minutos AS "duracaoMinutos", foto_path AS "fotoPath", ativo, ordem`, [tenantId, input.categoriaId ?? null, input.nome.trim(), input.slug.trim(), input.descricao ?? "", JSON.stringify(input.itensInclusos ?? []), input.duracaoMinutos, input.fotoPath ?? null, input.ordem ?? 0]);
    for (const price of input.precos ?? []) await client.query(`INSERT INTO servico_precos (tenant_id, servico_id, porte, valor_centavos) VALUES ($1,$2,$3,$4)`, [tenantId, inserted.rows[0].id, price.porte, price.valorCentavos]);
    await client.query("COMMIT");
    return toService(inserted.rows[0], input.precos ?? []);
  } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
}

export async function updateService(tenantId: string, id: string, input: CatalogServiceInput & { ativo?: boolean }, vehicleSizes: VehicleSize[]): Promise<void> {
  validateCatalogServiceInput(input, vehicleSizes);
  const client = await getDb().connect();
  try {
    await client.query("BEGIN");
    await client.query(`UPDATE servicos SET categoria_id=$1, nome=$2, slug=$3, descricao=$4, itens_inclusos=$5::jsonb, duracao_minutos=$6, foto_path=$7, ativo=$8, ordem=$9, atualizado_em=now() WHERE tenant_id=$10 AND id=$11`, [input.categoriaId ?? null, input.nome.trim(), input.slug.trim(), input.descricao ?? "", JSON.stringify(input.itensInclusos ?? []), input.duracaoMinutos, input.fotoPath ?? null, input.ativo ?? true, input.ordem ?? 0, tenantId, id]);
    await client.query("DELETE FROM servico_precos WHERE tenant_id=$1 AND servico_id=$2", [tenantId, id]);
    for (const price of input.precos ?? []) await client.query(`INSERT INTO servico_precos (tenant_id, servico_id, porte, valor_centavos) VALUES ($1,$2,$3,$4)`, [tenantId, id, price.porte, price.valorCentavos]);
    await client.query("COMMIT");
  } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
}

export async function setServiceActive(tenantId: string, id: string, ativo: boolean): Promise<void> {
  await getDb().query("UPDATE servicos SET ativo=$1, atualizado_em=now() WHERE tenant_id=$2 AND id=$3", [ativo, tenantId, id]);
}
