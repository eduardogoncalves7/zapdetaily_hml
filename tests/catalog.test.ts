import { describe, expect, it } from "vitest";
import { convertCatalogImage } from "../lib/uploads";
import { getPriceForVehicleSize, type CatalogService } from "../services/catalog";

const tinyPng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");

describe("catálogo", () => {
  it("converte upload PNG válido em WebP", async () => {
    const output = await convertCatalogImage(tinyPng);
    expect(output.subarray(0, 4).toString()).toBe("RIFF");
    expect(output.subarray(8, 12).toString()).toBe("WEBP");
  });

  it("rejeita conteúdo que não é imagem", async () => {
    await expect(convertCatalogImage(Buffer.from("não é uma imagem"))).rejects.toThrow();
  });

  it("retorna nulo quando o serviço não tem preço para o porte", () => {
    const service = { precos: [{ porte: "pequeno", valorCentavos: 1000 }] } as CatalogService;
    expect(getPriceForVehicleSize(service, "grande")).toBeNull();
  });
});
