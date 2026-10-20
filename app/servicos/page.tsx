import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ImagePlaceholder } from "@/components/image-placeholder";
import { SiteHeader } from "@/components/site-header";
import { hasCapability } from "@/lib/plans";
import { getTenantSettings } from "@/lib/tenant-settings";
import { getDefaultTenantId, listServices } from "@/services/catalog";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Servicos", description: "Conheca os servicos de estetica automotiva." };

export default async function ServicesPage() {
  if (!hasCapability("booking")) notFound();
  const settings = await getTenantSettings();
  let services = [] as Awaited<ReturnType<typeof listServices>>;
  try { const tenantId = await getDefaultTenantId(); if (tenantId) services = await listServices(tenantId); } catch { services = []; }
  return <main><SiteHeader settings={settings} /><section className="site-shell py-14 sm:py-24"><div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-end"><div><p className="eyebrow">Catalogo de cuidados</p><h1 className="display-title mt-5">Servicos para cada momento.</h1></div><p className="muted max-w-lg text-base leading-7 lg:justify-self-end">Escolha o servico, o porte do veiculo e o melhor horario para voce. As imagens podem ser adicionadas depois pelo painel.</p></div><div className="mt-14 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">{services.map((service) => <Link key={service.id} href={"/servicos/" + service.slug} className="service-card"><ImagePlaceholder label="Imagem do servico" compact /><div className="service-card__body"><div className="service-card__meta"><span>{service.categoriaNome ?? "Cuidado"}</span><span>{service.duracaoMinutos} min</span></div><h2>{service.nome}</h2><p className="muted line-clamp-3">{service.descricao}</p><span className="mt-5 inline-block text-xs font-bold uppercase tracking-[.12em] underline underline-offset-4">Ver detalhes ↗</span></div></Link>)}{services.length === 0 && <div className="sm:col-span-2 lg:col-span-3"><ImagePlaceholder label="Seu catalogo aparecera aqui" /></div>}</div></section></main>;
}
