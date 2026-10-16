import { z } from "zod";
import { getEnv } from "./env";

export const planSchema = z.enum(["basic", "standard", "plus"]);
export type Plan = z.infer<typeof planSchema>;

export const capabilitySchema = z.enum(["booking", "adminPanel", "finance", "assistant"]);
export type Capability = z.infer<typeof capabilitySchema>;
export type PlanCapabilities = Record<Capability, boolean>;

export const PLAN_CAPABILITIES: Record<Plan, PlanCapabilities> = {
  basic: { booking: true, adminPanel: false, finance: false, assistant: false },
  standard: { booking: true, adminPanel: true, finance: true, assistant: false },
  plus: { booking: true, adminPanel: true, finance: true, assistant: true },
};

export type MenuItem = { key: Capability; label: string; href: string };

const MENU_ITEMS: readonly MenuItem[] = [
  { key: "booking", label: "Agendamento", href: "/agendamento" },
  { key: "adminPanel", label: "Administração", href: "/admin" },
  { key: "finance", label: "Financeiro", href: "/finance" },
  { key: "assistant", label: "Assistente", href: "/assistant" },
];

export function parsePlan(value: unknown): Plan {
  return planSchema.parse(value);
}

export function getCurrentPlan(): Plan {
  return parsePlan(getEnv().ZD_PLAN);
}

export function getCapabilities(plan: Plan = getCurrentPlan()): PlanCapabilities {
  return PLAN_CAPABILITIES[plan];
}

export function hasCapability(capability: Capability, plan: Plan = getCurrentPlan()): boolean {
  return getCapabilities(plan)[capability];
}

export function requireCapability(capability: Capability, plan: Plan = getCurrentPlan()): void {
  if (!hasCapability(capability, plan)) {
    throw new CapabilityUnavailableError(capability, plan);
  }
}

export function getMenuItems(plan: Plan = getCurrentPlan()): MenuItem[] {
  return MENU_ITEMS.filter((item) => hasCapability(item.key, plan));
}

export class CapabilityUnavailableError extends Error {
  constructor(public readonly capability: Capability, public readonly plan: Plan) {
    super(`Capability ${capability} is not available for plan ${plan}`);
    this.name = "CapabilityUnavailableError";
  }
}

export function validatePlanAtBoot(): Plan {
  return getCurrentPlan();
}
