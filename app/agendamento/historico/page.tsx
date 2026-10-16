import Link from "next/link";
import { notFound } from "next/navigation";
import { hasCapability } from "@/lib/plans";
import { CustomerHistory } from "./customer-history";

export const dynamic = "force-dynamic";
export default function BookingHistoryPage() { if (!hasCapability("booking")) notFound(); return <main className="mx-auto min-h-screen max-w-xl px-5 py-10 sm:py-16"><Link href="/agendamento" className="text-sm text-[var(--zd-color-accent)]">← Novo agendamento</Link><h1 className="mt-5 text-3xl font-semibold">Meus agendamentos</h1><p className="mt-2 text-[var(--zd-color-accent)]">Este histórico só pode ser acessado pelo seu cookie privado.</p><div className="mt-8"><CustomerHistory /></div></main>; }
