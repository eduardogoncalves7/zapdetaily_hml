import { validateEnvironment } from "@/lib/env";

export async function register() {
  try {
    validateEnvironment();
    console.log("Ambiente validado.");
  } catch (error) {
    console.error("Ambiente inválido no boot:", error instanceof Error ? error.message : "erro desconhecido");
  }
}
