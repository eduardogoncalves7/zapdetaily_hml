"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
    });
    setLoading(false);
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? "Não foi possível entrar.");
      return;
    }
    router.push("/admin");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6 py-16">
      <div><p className="text-sm uppercase tracking-[0.25em] text-[var(--zd-color-primary)]">Administração</p><h1 className="text-3xl font-semibold">Entrar</h1></div>
      <form className="flex flex-col gap-4" onSubmit={submit}>
        <label className="flex flex-col gap-2">E-mail<input className="rounded border p-3 text-slate-900" name="email" type="email" autoComplete="username" required /></label>
        <label className="flex flex-col gap-2">Senha<input className="rounded border p-3 text-slate-900" name="password" type="password" autoComplete="current-password" required /></label>
        {error ? <p role="alert">{error}</p> : null}
        <button className="rounded bg-[var(--zd-color-primary)] p-3 text-slate-950" disabled={loading} type="submit">{loading ? "Entrando…" : "Entrar"}</button>
      </form>
    </main>
  );
}
