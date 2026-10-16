import Link from "next/link";
import { getMenuItems } from "@/lib/plans";
import { getTenantSettings } from "@/lib/tenant-settings";

export default async function HomePage() {
  const [settings, menuItems] = await Promise.all([getTenantSettings(), Promise.resolve(getMenuItems())]);
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-6 px-6 py-16">
      <nav aria-label="Principal" className="flex flex-wrap gap-4 text-sm">
        {menuItems.map((item) => <Link key={item.key} href={item.href}>{item.label}</Link>)}
      </nav>
      <p className="text-sm font-medium uppercase tracking-[0.25em] text-[var(--zd-color-primary)]">{settings.nome}</p>
      <h1 className="text-4xl font-semibold tracking-tight text-[var(--zd-color-foreground)] sm:text-6xl">{settings.slogan}</h1>
      <p className="max-w-2xl text-lg leading-8 text-[var(--zd-color-accent)]">
        Uma base white-label com configuração por tenant e recursos habilitados pelo plano.
      </p>
    </main>
  );
}
