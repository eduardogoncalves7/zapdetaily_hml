import { hasCapability } from "@/lib/plans";

export default function AssistantPage() {
  if (!hasCapability("assistant")) {
    return <main className="mx-auto max-w-2xl px-6 py-16"><h1>Recurso não disponível neste plano</h1></main>;
  }
  return <main className="mx-auto max-w-2xl px-6 py-16"><h1>Assistente</h1><p>O assistente está disponível no plano Plus.</p></main>;
}
