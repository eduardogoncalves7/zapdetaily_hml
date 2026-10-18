import { redirect } from "next/navigation";
import { getCurrentAdminFromCookies } from "@/lib/admin-auth";
import { hasCapability } from "@/lib/plans";
import FinanceDashboard from "./finance-dashboard";
export default async function FinancePage() { if (!hasCapability("finance")) return <main className="mx-auto max-w-4xl px-6 py-16"><h1>Recurso não disponível neste plano</h1></main>; if (!await getCurrentAdminFromCookies()) redirect("/admin/login"); return <FinanceDashboard />; }
