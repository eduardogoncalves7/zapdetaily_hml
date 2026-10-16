import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const MAX_UPLOAD_MEGAPIXELS = 25;
const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp"]);

export async function convertCatalogImage(input: Buffer, limits = { maxBytes: MAX_UPLOAD_BYTES, maxMegapixels: MAX_UPLOAD_MEGAPIXELS }): Promise<Buffer> {
  if (input.byteLength === 0 || input.byteLength > limits.maxBytes) throw new Error("Imagem excede o limite de tamanho");
  const image = sharp(input, { failOn: "error" });
  const metadata = await image.metadata();
  if (!metadata.format || !ALLOWED_FORMATS.has(metadata.format)) throw new Error("Formato inválido; use JPG, PNG ou WebP");
  if (!metadata.width || !metadata.height || metadata.width * metadata.height > limits.maxMegapixels * 1_000_000) throw new Error("Imagem excede o limite de megapixels");
  return image.resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true }).webp({ quality: 82, effort: 4 }).toBuffer();
}

export async function saveCatalogImage(input: Buffer): Promise<string> {
  const output = await convertCatalogImage(input);
  const directory = path.join(process.cwd(), "public", "uploads");
  await mkdir(directory, { recursive: true });
  const filename = `${randomUUID()}.webp`;
  await writeFile(path.join(directory, filename), output, { flag: "wx" });
  return `/uploads/${filename}`;
}
