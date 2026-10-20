import Link from "next/link";
import { getMenuItems } from "@/lib/plans";
import type { TenantSettings } from "@/lib/tenant-settings";

export function SiteHeader({ settings }: { settings: TenantSettings }) {
  const menuItems = getMenuItems();
  return (
    <header className="site-header">
      <div className="site-shell site-header__inner">
        <Link href="/" className="brand" aria-label={`${settings.nome}, página inicial`}>
          <span className="brand__symbol" aria-hidden="true">ZD</span>
          <span className="brand__name">{settings.nome}</span>
        </Link>
        <nav aria-label="Principal" className="site-nav">
          <Link href="/servicos">Serviços</Link>
          <Link href="/agendamento" className="site-nav__booking">Agendar <span aria-hidden="true">↗</span></Link>
          {menuItems.filter((item) => item.key !== "booking").map((item) => <Link key={item.key} href={item.href} className="hidden lg:inline">{item.label}</Link>)}
        </nav>
      </div>
    </header>
  );
}
