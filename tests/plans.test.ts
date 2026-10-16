import { describe, expect, it } from "vitest";
import { getCapabilities, getMenuItems, hasCapability, parsePlan } from "../lib/plans";

describe("planos", () => {
  it("mantém o basic sem financeiro e sem assistente", () => {
    expect(getCapabilities("basic")).toEqual({ booking: true, adminPanel: false, finance: false, assistant: false });
    expect(hasCapability("finance", "basic")).toBe(false);
    expect(getMenuItems("basic").map((item) => item.key)).not.toContain("finance");
  });

  it("habilita o financeiro no standard", () => {
    expect(hasCapability("finance", "standard")).toBe(true);
    expect(hasCapability("assistant", "standard")).toBe(false);
    expect(getMenuItems("standard").map((item) => item.key)).toContain("finance");
  });

  it("habilita o assistente no plus", () => {
    expect(getCapabilities("plus")).toEqual({ booking: true, adminPanel: true, finance: true, assistant: true });
    expect(getMenuItems("plus").map((item) => item.key)).toContain("assistant");
  });

  it("valida o plano configurado", () => {
    expect(parsePlan("basic")).toBe("basic");
    expect(() => parsePlan("enterprise")).toThrow();
  });
});
