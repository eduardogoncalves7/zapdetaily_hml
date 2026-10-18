import { redirect } from "next/navigation";
import { getCurrentAdminFromCookies } from "@/lib/admin-auth";
import { hasCapability } from "@/lib/plans";
export const dynamic = "force-dynamic";
export default async function AdminAssistantPage() { if (!await getCurrentAdminFromCookies()) redirect("/admin/login"); if (!hasCapability("assistant")) return <main className="mx-auto max-w-2xl px-6 py-16"><h1>Recurso não disponível neste plano</h1></main>; return <main className="mx-auto max-w-2xl space-y-4 px-6 py-16"><p className="text-sm uppercase tracking-[0.25em] text-[var(--zd-color-primary)]">Plus</p><h1 className="text-3xl font-semibold">Assistente</h1><p>Em breve / não configurado.</p><p className="text-sm text-slate-400">Nenhum provedor de WhatsApp, voz ou calendário está conectado.</p></main>; }
