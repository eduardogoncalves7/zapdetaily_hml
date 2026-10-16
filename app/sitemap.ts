import type { MetadataRoute } from "next";
import { getDefaultTenantId, listServices } from "@/services/catalog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> { const base = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, ""); let services = [] as Awaited<ReturnType<typeof listServices>>; try { const tenantId = await getDefaultTenantId(); if (tenantId) services = await listServices(tenantId); } catch { services = []; } return [{ url: `${base}/servicos`, changeFrequency: "daily", priority: 0.8 }, ...services.map((service) => ({ url: `${base}/servicos/${service.slug}`, changeFrequency: "daily" as const, priority: 0.7 }))]; }
