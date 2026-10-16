import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getDefaultTenantId, listServices } from "@/services/catalog";
import { getTenantSettings } from "@/lib/tenant-settings";
import { hasCapability } from "@/lib/plans";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Serviços", description: "Conheça os serviços disponíveis." };

export default async function ServicesPage() {
  if (!hasCapability("booking")) notFound();
  const settings = await getTenantSettings();
  let services = [] as Awaited<ReturnType<typeof listServices>>;
  try { const tenantId = await getDefaultTenantId(); if (tenantId) services = await listServices(tenantId); } catch { services = []; }
  return <main className="mx-auto min-h-screen max-w-5xl px-5 py-12 sm:px-8"><p className="text-sm uppercase tracking-[0.25em] text-[var(--zd-color-primary)]">{settings.nome}</p><h1 className="mt-3 text-4xl font-semibold">Serviços</h1><p className="mt-3 max-w-2xl text-[var(--zd-color-accent)]">Escolha o cuidado que combina com o seu veículo.</p><div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{services.map((service) => <Link key={service.id} href={`/servicos/${service.slug}`} className="overflow-hidden rounded-2xl border border-white/10 bg-[var(--zd-color-surface)] transition hover:border-[var(--zd-color-primary)]">{service.fotoPath ? <Image src={service.fotoPath} alt="" width={800} height={500} className="h-44 w-full object-cover" /> : <div className="h-44 bg-gradient-to-br from-[var(--zd-color-surface)] to-[var(--zd-color-background)]" />}<div className="p-5"><p className="text-xs uppercase tracking-widest text-[var(--zd-color-primary)]">{service.categoriaNome ?? "Serviço"}</p><h2 className="mt-2 text-xl font-semibold">{service.nome}</h2><p className="mt-2 line-clamp-3 text-sm text-[var(--zd-color-accent)]">{service.descricao}</p><p className="mt-5 text-sm">{service.duracaoMinutos} min</p></div></Link>)}{services.length === 0 && <p className="rounded-2xl border border-white/10 p-6 text-[var(--zd-color-accent)]">Nenhum serviço publicado no momento.</p>}</div></main>;
}
