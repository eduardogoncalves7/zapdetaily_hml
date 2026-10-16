import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDefaultTenantId, getPriceForVehicleSize, getServiceBySlug } from "@/services/catalog";
import { getTenantSettings } from "@/lib/tenant-settings";
import { hasCapability } from "@/lib/plans";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };
async function load(slug: string) { const tenantId = await getDefaultTenantId(); return tenantId ? getServiceBySlug(tenantId, slug) : null; }
export async function generateMetadata({ params }: Props): Promise<Metadata> { const service = await load((await params).slug).catch(() => null); return { title: service?.nome ?? "Serviço", description: service?.descricao ?? "Detalhes do serviço." }; }
export default async function ServiceDetailPage({ params }: Props) {
  if (!hasCapability("booking")) notFound();
  const service = await load((await params).slug).catch(() => null); if (!service) notFound();
  const settings = await getTenantSettings();
  return <main className="mx-auto min-h-screen max-w-4xl px-5 py-12 sm:px-8">{service.fotoPath && <Image src={service.fotoPath} alt="" width={1200} height={700} className="max-h-[28rem] w-full rounded-3xl object-cover" />}<p className="mt-8 text-sm uppercase tracking-[0.25em] text-[var(--zd-color-primary)]">{service.categoriaNome ?? settings.nome}</p><h1 className="mt-3 text-4xl font-semibold">{service.nome}</h1><p className="mt-4 text-lg text-[var(--zd-color-accent)]">{service.descricao}</p><p className="mt-5">Duração: {service.duracaoMinutos} minutos</p><section className="mt-8 rounded-2xl border border-white/10 bg-[var(--zd-color-surface)] p-5"><h2 className="text-lg font-semibold">Preços por porte</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{settings.portesVeiculo.map((size) => { const price = getPriceForVehicleSize(service, size.key); return <div key={size.key} className="flex justify-between rounded-xl border border-white/10 px-4 py-3"><span>{size.label}</span><span>{price ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(price.valorCentavos / 100) : "Preço sob consulta"}</span></div>; })}</div></section>{service.itensInclusos.length > 0 && <section className="mt-8"><h2 className="text-lg font-semibold">Itens inclusos</h2><ul className="mt-3 list-disc space-y-2 pl-5 text-[var(--zd-color-accent)]">{service.itensInclusos.map((item) => <li key={item}>{item}</li>)}</ul></section>}</main>;
}
