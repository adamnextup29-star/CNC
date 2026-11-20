import { extractJson } from "./json.ts";
import { featureCount, finalizeTooling, normalizeAnalysis, normalizeVerified } from "./normalize.ts";
import { readUserPrompt, READ_SYSTEM, toolingPrompt, VERIFY_SYSTEM, verifyUserPrompt } from "./prompts.ts";
import type { JobResult, PageImage, Phase, PrintAnalysis, Settings, ToolItem } from "./types.ts";
import { chatJson, explainFailure, imageMessage, isAbortError, respondWithSearch } from "./xai.ts";

const ANALYZE_LIMIT = 6;

export async function analyzePrint(
  pages: PageImage[],
  settings: Settings,
  onPhase: (phase: Phase, detail: string) => void,
  signal?: AbortSignal,
): Promise<JobResult> {
  const selected = pages.slice(0, ANALYZE_LIMIT);
  const warnings: string[] = [];
  if (pages.length > ANALYZE_LIMIT) {
    warnings.push(`This job has ${pages.length} pages. The first ${ANALYZE_LIMIT} were sent.`);
  }

  onPhase("reading", "Reading the title block, dimensions, and notes.");
  const readText = await chatJson(
    settings,
    [
      { role: "system", content: READ_SYSTEM },
      imageMessage(readUserPrompt(selected.length), selected.map((page) => page.dataUrl)),
    ],
    signal,
  );
  const draft = normalizeAnalysis(extractJson(readText));
  if (featureCount(draft) === 0) {
    warnings.push("The first pass found no callouts. The verify pass still looked at the sheet.");
  }

  onPhase("verifying", "Checking every callout against the sheet.");
  const verifyText = await chatJson(
    settings,
    [
      { role: "system", content: VERIFY_SYSTEM },
      imageMessage(verifyUserPrompt(draft), selected.map((page) => page.dataUrl)),
    ],
    signal,
  );
  const verified = normalizeVerified(extractJson(verifyText), draft);
  if (featureCount(verified.analysis) === 0) {
    warnings.push("Nothing was transcribed. The sheet may be blank, upside down, or too soft to read.");
  }

  onPhase("sourcing", "Searching McMaster-Carr, MSC Direct, and Haas Tooling.");
  const sourced = await sourceTools(verified.analysis, verified.hardFeatures, settings, signal);
  warnings.push(...sourced.warnings);

  return {
    analysis: verified.analysis,
    verification: verified.verification,
    hardFeatures: verified.hardFeatures,
    tooling: sourced.items,
    toolingNote: sourced.note,
    warnings: warnings.filter(Boolean),
    generatedLabel: new Date().toLocaleString(),
    demo: false,
  };
}

async function sourceTools(
  analysis: PrintAnalysis,
  hardFeatures: JobResult["hardFeatures"],
  settings: Settings,
  signal?: AbortSignal,
): Promise<{ items: ToolItem[]; note: string; warnings: string[] }> {
  try {
    const search = await respondWithSearch(settings, toolingPrompt(analysis, hardFeatures), signal);
    const parsed = extractJson(search.text);
    const finalized = finalizeTooling(parsed, search.citations);
    if (finalized.items.length === 0) throw new Error("Catalog search returned no tools.");
    const exact = finalized.items.filter((item) => item.linkType === "product").length;
    const warnings: string[] = [];
    if (finalized.rejectedUrls > 0) {
      warnings.push(
        `${finalized.rejectedUrls} catalog link${finalized.rejectedUrls === 1 ? "" : "s"} were not cited product pages, so those rows use a search link.`,
      );
    }
    const note =
      exact > 0
        ? `${exact} exact product page${exact === 1 ? "" : "s"} matched a page the search actually opened. Every other link is a catalog search, not an exact match.`
        : "No cited product page matched an exact size. Every link here is a catalog search, not an exact match.";
    return { items: finalized.items, note, warnings };
  } catch (error) {
    if (isAbortError(error)) throw error;
    return {
      items: fallbackTools(analysis),
      note: "Live catalog search did not finish. These are search links, not exact product matches.",
      warnings: [`Catalog search failed (${explainFailure(error)}).`],
    };
  }
}

function fallbackTools(analysis: PrintAnalysis): ToolItem[] {
  const raw: Record<string, unknown>[] = [];
  if (analysis.titleBlock.material) {
    raw.push({
      kind: "stock",
      category: "stock",
      name: analysis.titleBlock.material,
      spec: `${analysis.titleBlock.material} with saw and finish allowance`,
      why: "Buy size must clear the finished envelope.",
      vendor: "mcmaster",
    });
  }
  for (const thread of analysis.threads) {
    raw.push({
      kind: "tool",
      category: "tap",
      name: `${thread.callout} tap`,
      spec: thread.callout,
      why: "Thread on the print.",
      vendor: "haas",
    });
    raw.push({
      kind: "tool",
      category: "thread-gauge",
      name: `${thread.size} GO/NO-GO`,
      spec: `${thread.size} ${thread.threadClass ?? ""} thread gage`.replace(/\s+/g, " ").trim(),
      why: "Prove the thread before the part leaves the vise.",
      vendor: "mcmaster",
    });
  }
  for (const hole of analysis.holes) {
    raw.push({
      kind: "tool",
      category: "drill",
      name: `${hole.diameter} drill`,
      spec: [hole.diameter, hole.depth].filter(Boolean).join(" "),
      why: hole.note ?? "Hole on the print.",
      vendor: "haas",
    });
  }
  if (raw.length === 0) {
    raw.push({
      kind: "tool",
      category: "endmill",
      name: "Carbide end mill",
      spec: "carbide end mill",
      why: "Profile and face from the finished sizes on the print.",
      vendor: "haas",
    });
  }
  return finalizeTooling(raw, []).items;
}
