import { redirect } from "next/navigation";
import { getCurrentAdminFromCookies } from "@/lib/admin-auth";
import { getTenantSettingsForTenant } from "@/lib/tenant-settings";
import { listCategories, listServices } from "@/services/catalog";
import { CatalogEditor } from "./catalog-editor";
import { hasCapability } from "@/lib/plans";

export const dynamic = "force-dynamic";
export default async function CatalogAdminPage() { if (!hasCapability("booking")) redirect("/admin"); const admin = await getCurrentAdminFromCookies(); if (!admin) redirect("/admin/login"); const [settings, categories, services] = await Promise.all([getTenantSettingsForTenant(admin.tenantId), listCategories(admin.tenantId, true), listServices(admin.tenantId, true)]); return <main className="mx-auto min-h-screen max-w-6xl px-5 py-12"><a href="/admin" className="text-sm text-[var(--zd-color-accent)]">← Painel</a><h1 className="mt-4 text-3xl font-semibold">Catálogo</h1><p className="mt-2 text-[var(--zd-color-accent)]">Gerencie os serviços publicados e seus preços por porte.</p><div className="mt-8"><CatalogEditor initialServices={services} categories={categories} vehicleSizes={settings.portesVeiculo} /></div></main>; }
