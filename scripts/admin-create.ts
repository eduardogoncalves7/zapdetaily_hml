import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { getDb } from "../lib/db";
import { hashPassword } from "../lib/password";

async function ask(name: string, fallback?: string): Promise<string> {
  if (fallback) return fallback;
  const readline = createInterface({ input, output });
  const value = (await readline.question(`${name}: `)).trim();
  readline.close();
  return value;
}

async function askSecret(name: string, fallback?: string): Promise<string> {
  if (fallback) return fallback;
  if (!input.isTTY) throw new Error("Defina ADMIN_PASSWORD em execução sem terminal.");
  output.write(`${name}: `);
  input.setRawMode?.(true);
  input.resume();
  return new Promise((resolve, reject) => {
    let value = "";
    const onData = (chunk: Buffer) => {
      const text = chunk.toString();
      if (text === "\u0003") {
        cleanup();
        reject(new Error("Operação cancelada."));
      } else if (text === "\r" || text === "\n") {
        cleanup();
        output.write("\n");
        resolve(value);
      } else if (text === "\u007f") {
        value = value.slice(0, -1);
      } else {
        value += text;
      }
    };
    const cleanup = () => {
      input.setRawMode?.(false);
      input.off("data", onData);
    };
    input.on("data", onData);
  });
}

async function main() {
  const email = await ask("E-mail", process.env.ADMIN_EMAIL);
  const password = await askSecret("Senha", process.env.ADMIN_PASSWORD);
  const nome = await ask("Nome", process.env.ADMIN_NAME ?? "Administrador");
  const tenantSlug = await ask("Slug do tenant", process.env.ADMIN_TENANT_SLUG ?? "tenant-demo");
  if (!email || !password || !nome || !tenantSlug) throw new Error("E-mail, senha, nome e tenant são obrigatórios.");

  const db = getDb();
  const passwordHash = await hashPassword(password);
  try {
    const result = await db.query(
      `INSERT INTO admin_users (tenant_id, email, nome, senha_hash, papel)
       SELECT id, lower($1), $2, $3, 'owner' FROM tenants WHERE slug = $4
       RETURNING email`,
      [email, nome, passwordHash, tenantSlug],
    );
    if (!result.rowCount) throw new Error("Tenant não encontrado.");
    console.log(`Administrador criado: ${result.rows[0].email}`);
  } finally {
    await db.end();
  }
}

main().catch((error) => {
  console.error("Falha ao criar administrador:", error instanceof Error ? error.message : "erro desconhecido");
  process.exitCode = 1;
});
