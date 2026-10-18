import { spawn } from "node:child_process";
const plan = process.argv[2];
if (!["basic", "standard", "plus"].includes(plan)) throw new Error("Informe basic, standard ou plus");
const windows = process.platform === "win32";
const command = windows ? (process.env.ComSpec ?? "cmd.exe") : "npx";
const args = windows ? ["/d", "/s", "/c", "npx playwright test --config=playwright.config.ts"] : ["playwright", "test", "--config=playwright.config.ts"];
const child = spawn(command, args, { stdio: "inherit", env: { ...process.env, E2E_PLAN: plan } });
child.on("exit", (code) => process.exit(code ?? 1));
