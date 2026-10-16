import { redirect } from "next/navigation";
import { getCurrentAdminFromCookies } from "@/lib/admin-auth";
import { getTenantSettingsForTenant } from "@/lib/tenant-settings";
import { TenantSettingsEditor } from "./tenant-settings-editor";
import { hasCapability } from "@/lib/plans";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export default async function TenantSettingsPage() { if (!hasCapability("adminPanel")) notFound(); const admin = await getCurrentAdminFromCookies(); if (!admin) redirect("/admin/login"); return <main className="mx-auto min-h-screen max-w-4xl px-5 py-10"><a href="/admin" className="text-sm text-[var(--zd-color-accent)]">← Painel</a><h1 className="mt-4 text-3xl font-semibold">Configurações do tenant</h1><p className="mt-2 text-[var(--zd-color-accent)]">Dados públicos, horários, grade e capacidade.</p><div className="mt-8"><TenantSettingsEditor initial={await getTenantSettingsForTenant(admin.tenantId)} /></div></main>; }
