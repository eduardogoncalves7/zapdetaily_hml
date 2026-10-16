import { notFound } from "next/navigation";
import { hasCapability } from "@/lib/plans";
import { getDefaultTenantId, listServices } from "@/services/catalog";
import { getTenantSettings } from "@/lib/tenant-settings";
import { BookingWizard } from "./booking-wizard";
import Link from "next/link";

export const dynamic = "force-dynamic";
export default async function BookingPage() {
  if (!hasCapability("booking")) notFound();
  const settings = await getTenantSettings(); let services = [] as Awaited<ReturnType<typeof listServices>>;
  try { const tenantId = await getDefaultTenantId(); if (tenantId) services = await listServices(tenantId); } catch { services = []; }
  return <main className="mx-auto min-h-screen max-w-xl px-5 py-10 sm:py-16"><p className="text-sm uppercase tracking-[0.25em] text-[var(--zd-color-primary)]">{settings.nome}</p><h1 className="mt-3 text-3xl font-semibold">Agende seu atendimento</h1><p className="mt-2 text-[var(--zd-color-accent)]">Uma etapa por vez, sem complicação.</p><div className="mt-8"><BookingWizard services={services} vehicleSizes={settings.portesVeiculo} /></div><Link href="/agendamento/historico" className="mt-8 inline-block text-sm text-[var(--zd-color-accent)]">Ver meus agendamentos neste dispositivo</Link></main>;
}
