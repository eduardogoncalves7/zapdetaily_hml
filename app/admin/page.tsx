import { redirect } from "next/navigation";
import { getCurrentAdminFromCookies } from "@/lib/admin-auth";
import { LogoutButton } from "@/app/admin/logout-button";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await getCurrentAdminFromCookies();
  if (!admin) redirect("/admin/login");
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-16">
      <div className="flex items-center justify-between"><div><p className="text-sm uppercase tracking-[0.25em] text-[var(--zd-color-primary)]">Administração</p><h1 className="text-3xl font-semibold">Painel</h1></div><LogoutButton /></div>
      <p>Olá, {admin.nome}. Esta área exige uma sessão administrativa válida.</p>
      <a className="rounded-xl border border-white/10 bg-[var(--zd-color-surface)] p-5" href="/admin/catalogo">Abrir catálogo</a>
      <a className="rounded-xl border border-white/10 bg-[var(--zd-color-surface)] p-5" href="/admin/agenda">Abrir agenda</a>
      <a className="rounded-xl border border-white/10 bg-[var(--zd-color-surface)] p-5" href="/admin/configuracoes">Configurações do tenant</a>
    </main>
  );
}
