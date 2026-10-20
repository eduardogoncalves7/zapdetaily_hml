import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ImagePlaceholder } from "@/components/image-placeholder";
import { SiteHeader } from "@/components/site-header";
import { hasCapability } from "@/lib/plans";
import { getTenantSettings } from "@/lib/tenant-settings";
import { getDefaultTenantId, getPriceForVehicleSize, getServiceBySlug } from "@/services/catalog";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };
async function load(slug: string) { const tenantId = await getDefaultTenantId(); return tenantId ? getServiceBySlug(tenantId, slug) : null; }
export async function generateMetadata({ params }: Props): Promise<Metadata> { const service = await load((await params).slug).catch(() => null); return { title: service?.nome ?? "Servico", description: service?.descricao ?? "Detalhes do servico." }; }

export default async function ServiceDetailPage({ params }: Props) {
  if (!hasCapability("booking")) notFound();
  const service = await load((await params).slug).catch(() => null);
  if (!service) notFound();
  const settings = await getTenantSettings();
  const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  return <main><SiteHeader settings={settings} /><section className="site-shell py-12 sm:py-20"><Link href="/servicos" className="text-xs font-bold uppercase tracking-[.14em] opacity-60">Voltar ao catalogo</Link><div className="mt-8 grid gap-10 lg:grid-cols-[1.1fr_.9fr] lg:items-start lg:gap-16"><ImagePlaceholder label="Espaco reservado para foto do servico" className="min-h-[390px] sm:min-h-[520px]" /><div><p className="eyebrow">{service.categoriaNome ?? settings.nome}</p><h1 className="section-title mt-5">{service.nome}</h1><p className="muted mt-6 text-lg leading-8">{service.descricao}</p><div className="mt-8 flex items-center gap-4 border-y border-black/15 py-5 text-sm"><span className="font-bold uppercase tracking-[.12em]">Duracao</span><span className="muted">{service.duracaoMinutos} minutos</span></div><div className="mt-8"><p className="eyebrow">A partir de</p><div className="mt-4 grid gap-2">{settings.portesVeiculo.map((size) => { const price = getPriceForVehicleSize(service, size.key); return <div key={size.key} className="flex justify-between border-b border-black/10 py-3 text-sm"><span>{size.label}</span><span className="font-semibold">{price ? money.format(price.valorCentavos / 100) : "Sob consulta"}</span></div>; })}</div></div><Link href="/agendamento" className="button-primary mt-8 w-full sm:w-auto">Escolher este cuidado <span aria-hidden="true">↗</span></Link></div></div>{service.itensInclusos.length > 0 && <div className="mt-16 max-w-2xl"><p className="eyebrow">O que esta incluso</p><div className="mt-5">{service.itensInclusos.map((item, index) => <div className="numbered-row" key={item}><span className="numbered-row__number">0{index + 1}</span><span>{item}</span></div>)}</div></div>}</section></main>;
}
