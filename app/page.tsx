import Link from "next/link";
import { ImagePlaceholder } from "@/components/image-placeholder";
import { SiteHeader } from "@/components/site-header";
import { getTenantSettings } from "@/lib/tenant-settings";
import { getDefaultTenantId, listServices } from "@/services/catalog";

export default async function HomePage() {
  const settings = await getTenantSettings();
  let services = [] as Awaited<ReturnType<typeof listServices>>;
  try { const tenantId = await getDefaultTenantId(); if (tenantId) services = await listServices(tenantId); } catch { services = []; }
  const featured = services.slice(0, 3);
  return <main>
    <SiteHeader settings={settings} />
    <section className="site-shell grid gap-10 py-14 sm:py-24 lg:grid-cols-[.85fr_1.15fr] lg:items-end lg:gap-16">
      <div><p className="eyebrow">Estetica automotiva · cuidado essencial</p><h1 className="display-title mt-6">Seu carro, no melhor estado.</h1><p className="muted mt-6 max-w-md text-base leading-7">Servicos pensados para preservar, renovar e valorizar cada detalhe do seu veiculo.</p><div className="mt-8 flex flex-wrap gap-3"><Link className="button-primary" href="/agendamento">Agendar atendimento <span aria-hidden="true">↗</span></Link><Link className="button-secondary" href="/servicos">Ver servicos</Link></div></div>
      <div className="lg:pb-2"><ImagePlaceholder label="Espaco reservado para imagem principal" className="min-h-[390px] sm:min-h-[510px]" /><div className="mt-3 flex justify-between text-[.68em] font-bold uppercase tracking-[.16em] opacity-55"><span>Imagem da operacao</span><span>01 / 01</span></div></div>
    </section>
    <section className="border-y border-black/10 bg-[var(--zd-color-surface)]"><div className="site-shell grid gap-10 py-14 sm:py-20 lg:grid-cols-[.75fr_1.25fr] lg:gap-20"><div><p className="eyebrow">O jeito de cuidar</p><h2 className="section-title mt-5">Menos excesso. Mais resultado.</h2></div><div><p className="muted max-w-xl text-lg leading-8">Uma experiencia objetiva, transparente e feita para a rotina de quem gosta de dirigir um carro bem cuidado.</p><div className="mt-10 grid gap-7 sm:grid-cols-3"><div><p className="text-2xl font-medium">01</p><p className="muted mt-2 text-sm leading-6">Diagnostico atento antes de cada servico.</p></div><div><p className="text-2xl font-medium">02</p><p className="muted mt-2 text-sm leading-6">Processos adequados para cada superficie.</p></div><div><p className="text-2xl font-medium">03</p><p className="muted mt-2 text-sm leading-6">Entrega com acabamento e conferencia final.</p></div></div></div></div></section>
    <section className="site-shell py-16 sm:py-24"><div className="flex flex-wrap items-end justify-between gap-5"><div><p className="eyebrow">Servicos selecionados</p><h2 className="section-title mt-4">Cuidado na medida.</h2></div><Link href="/servicos" className="button-secondary">Conhecer catalogo <span aria-hidden="true">↗</span></Link></div><div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">{featured.map((service) => <Link href={"/servicos/" + service.slug} className="service-card" key={service.id}><ImagePlaceholder label="Imagem do servico" compact /><div className="service-card__body"><div className="service-card__meta"><span>{service.categoriaNome ?? "Servico"}</span><span>{service.duracaoMinutos} min</span></div><h3>{service.nome}</h3><p className="muted line-clamp-2">{service.descricao}</p></div></Link>)}{featured.length === 0 && <div className="sm:col-span-2 lg:col-span-3"><ImagePlaceholder label="Seu catalogo aparecera aqui" /></div>}</div></section>
    <section className="bg-[var(--zd-color-foreground)] text-[var(--zd-color-background)]"><div className="site-shell grid gap-8 py-16 sm:py-24 lg:grid-cols-[1fr_auto] lg:items-end"><div><p className="eyebrow !text-[var(--zd-color-accent)]">Pronto para comecar?</p><h2 className="mt-5 max-w-2xl text-4xl font-medium tracking-[-.06em] sm:text-6xl">Seu proximo cuidado comeca aqui.</h2></div><Link href="/agendamento" className="button-secondary !border-white/30 !text-white">Agendar agora <span aria-hidden="true">↗</span></Link></div></section>
    <footer className="site-shell flex flex-wrap justify-between gap-4 py-8 text-xs uppercase tracking-[.13em] opacity-60"><span>{settings.nome}</span><span>Estetica automotiva · {new Date().getFullYear()}</span></footer>
  </main>;
}
