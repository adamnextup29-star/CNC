import { drawBitmap } from "./raster.ts";
import type { PageImage } from "./types.ts";

export async function fileToPages(file: File): Promise<{ pages: PageImage[]; omittedPages: number }> {
  const name = file.name || "print";
  const isPdf = file.type === "application/pdf" || name.toLowerCase().endsWith(".pdf");
  if (isPdf) {
    const { renderPdf } = await import("./pdf.ts");
    return renderPdf(file);
  }
  try {
    const bitmap = await createImageBitmap(file);
    return { pages: [drawBitmap(bitmap, name)], omittedPages: 0 };
  } catch {
    throw new Error("Could not read that picture. Use a JPG, PNG, or PDF.");
  }
}
