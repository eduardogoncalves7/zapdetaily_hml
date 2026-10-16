import { redirect } from "next/navigation";
import { getCurrentAdminFromCookies } from "@/lib/admin-auth";
import { getTenantSettingsForTenant } from "@/lib/tenant-settings";
import { listServices } from "@/services/catalog";
import { AdminAgenda } from "./admin-agenda";
import { hasCapability } from "@/lib/plans";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export default async function AdminAgendaPage() { if (!hasCapability("adminPanel")) notFound(); const admin = await getCurrentAdminFromCookies(); if (!admin) redirect("/admin/login"); const [settings, services] = await Promise.all([getTenantSettingsForTenant(admin.tenantId), listServices(admin.tenantId, true)]); return <main className="mx-auto min-h-screen max-w-7xl px-5 py-10"><a href="/admin" className="text-sm text-[var(--zd-color-accent)]">← Painel</a><h1 className="mt-4 text-3xl font-semibold">Agenda</h1><p className="mt-2 text-[var(--zd-color-accent)]">Acompanhe o dia, a semana e o estado de cada atendimento.</p><div className="mt-8"><AdminAgenda vehicleSizes={settings.portesVeiculo} services={services} /></div></main>; }
