import { validateEnvironment } from "@/lib/env";
import { validatePlanAtBoot } from "@/lib/plans";

export async function register() {
  try {
    validateEnvironment();
    validatePlanAtBoot();
    console.log("Ambiente e plano validados.");
  } catch (error) {
    console.error("Ambiente inválido no boot:", error instanceof Error ? error.message : "erro desconhecido");
    throw error;
  }
}
