import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/health/route";

describe("health", () => {
  it("reports the application as alive without a database", async () => {
    const response = GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "ok" });
  });
});
