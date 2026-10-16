import { hasCapability } from "@/lib/plans";

export default function FinancePage() {
  if (!hasCapability("finance")) {
    return <main className="mx-auto max-w-2xl px-6 py-16"><h1>Recurso não disponível neste plano</h1></main>;
  }
  return <main className="mx-auto max-w-2xl px-6 py-16"><h1>Financeiro</h1><p>O módulo financeiro está disponível no plano atual.</p></main>;
}
