import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { canvasToJpeg } from "./raster.ts";
import type { PageImage } from "./types.ts";

GlobalWorkerOptions.workerSrc = workerUrl;

const MAX_PAGES = 8;

export async function renderPdf(file: File): Promise<{ pages: PageImage[]; omittedPages: number }> {
  const data = new Uint8Array(await file.arrayBuffer());
  const task = getDocument({ data });
  try {
    const pdf = await task.promise;
    const count = Math.min(pdf.numPages, MAX_PAGES);
    const pages: PageImage[] = [];
    for (let number = 1; number <= count; number += 1) {
      const page = await pdf.getPage(number);
      const base = page.getViewport({ scale: 1 });
      const scale = Math.min(2, 1600 / Math.max(base.width, base.height));
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.floor(viewport.width));
      canvas.height = Math.max(1, Math.floor(viewport.height));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Could not draw this PDF page.");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvas, viewport }).promise;
      pages.push(canvasToJpeg(canvas, `${file.name || "print"} · page ${number}`));
    }
    return { pages, omittedPages: Math.max(0, pdf.numPages - count) };
  } catch (error) {
    if (error instanceof Error && error.name === "PasswordException") {
      throw new Error("This PDF is password protected. Export an unlocked copy or photograph the sheet.");
    }
    if (error instanceof Error && error.name === "InvalidPDFException") {
      throw new Error("That file is not a readable PDF.");
    }
    throw error instanceof Error ? error : new Error("Could not read that PDF.");
  } finally {
    await task.destroy();
  }
}
