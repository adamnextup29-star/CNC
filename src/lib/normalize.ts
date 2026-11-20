import {
  citationKeys,
  classifyCatalogUrl,
  defaultVendor,
  searchUrl,
  VENDORS,
} from "./links.ts";
import type {
  CheckStatus,
  Coating,
  Confidence,
  ConflictItem,
  Correction,
  Dimension,
  GdtCallout,
  HardFeature,
  HoleCallout,
  LinkType,
  NoteCategory,
  NoteItem,
  PrintAnalysis,
  Severity,
  SpecItem,
  SurfaceFinish,
  ThreadCallout,
  TitleBlock,
  ToolCategory,
  ToolItem,
  Units,
  UnreadableItem,
  Vendor,
  Verification,
  VerificationCheck,
} from "./types.ts";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function text(value: unknown, fallback = ""): string {
  return asString(value) ?? fallback;
}

function pick(obj: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    const value = obj[key];
    if (value != null && value !== "") return value;
  }
  return undefined;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asQty(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const match = value.match(/\d+(?:\.\d+)?/);
    if (!match) return null;
    const number = Number(match[0]);
    return Number.isFinite(number) ? number : null;
  }
  return null;
}

function asUnits(value: unknown): Units {
  const raw = (asString(value) ?? "").toLowerCase();
  if (raw === "inch" || raw === "in" || raw.includes("inch") || raw.includes("imperial")) return "inch";
  if (raw === "mm" || raw.includes("millimet") || raw.includes("metric")) return "mm";
  return "unknown";
}

function asConfidence(value: unknown): Confidence {
  const raw = (asString(value) ?? "").toLowerCase();
  if (raw.startsWith("h")) return "high";
  if (raw.startsWith("l")) return "low";
  return "medium";
}

function asStatus(value: unknown): CheckStatus {
  const raw = (asString(value) ?? "").toLowerCase();
  if (raw.includes("correct")) return "corrected";
  if (raw.includes("unread") || raw.includes("illeg")) return "unreadable";
  if (raw.includes("conflict") || raw.includes("disagree")) return "conflict";
  return "confirmed";
}

function asSeverity(value: unknown): Severity {
  const raw = (asString(value) ?? "").toLowerCase();
  if (raw.includes("special") || raw.includes("process")) return "special-process";
  if (raw.includes("watch") || raw.includes("caution")) return "watch";
  return "hard";
}

function asNoteCategory(value: unknown): NoteCategory {
  const raw = (asString(value) ?? "").toLowerCase();
  if (raw.includes("mach")) return "machining";
  if (raw.includes("inspect") || raw.includes("gage") || raw.includes("gauge")) return "inspection";
  if (raw.includes("material") || raw.includes("stock")) return "material";
  if (raw.includes("finish") || raw.includes("coat") || raw.includes("anod") || raw.includes("heat")) {
    return "finish";
  }
  if (raw.includes("general")) return "general";
  return "other";
}

function asCategory(value: unknown): ToolCategory {
  const raw = (asString(value) ?? "").toLowerCase().replace(/[^a-z]/g, "");
  if (raw.includes("threadmill")) return "threadmill";
  if (raw.includes("threadgage") || raw.includes("threadgauge")) return "thread-gauge";
  if (raw.includes("endmill") || raw.includes("bullnose") || raw.includes("ballnose")) return "endmill";
  if (raw.includes("ream")) return "reamer";
  if (raw.includes("drill") || raw.includes("spot")) return "drill";
  if (raw.includes("tap")) return "tap";
  if (raw.includes("chamfer") || raw.includes("countersink")) return "chamfer";
  if (raw.includes("insert")) return "insert";
  if (raw.includes("pingage") || raw === "pin" || raw.includes("pingage")) return "pin";
  if (raw.includes("pin")) return "pin";
  if (raw.includes("gage") || raw.includes("gauge") || raw.includes("micrometer")) return "gauge";
  if (raw.includes("stock") || raw.includes("material") || raw.includes("blank")) return "stock";
  return "other";
}

function asVendor(value: unknown): Vendor | null {
  const raw = (asString(value) ?? "").toLowerCase();
  if (raw.includes("mcmaster")) return "mcmaster";
  if (raw.includes("msc")) return "msc";
  if (raw.includes("haas")) return "haas";
  return null;
}

function emptyTitle(): TitleBlock {
  return {
    partName: null,
    partNumber: null,
    revision: null,
    drawingNumber: null,
    material: null,
    materialSpec: null,
    finish: null,
    heatTreat: null,
    scale: null,
    units: "unknown",
    generalTolerances: null,
    company: null,
    drawnBy: null,
    date: null,
    weight: null,
  };
}

function unwrapAnalysis(data: unknown): unknown {
  if (!isRecord(data)) return data;
  if (isRecord(data.analysis)) return data.analysis;
  if (isRecord(data.print)) return data.print;
  if (isRecord(data.corrected)) return data.corrected;
  return data;
}

export function featureCount(analysis: PrintAnalysis): number {
  return (
    analysis.dimensions.length +
    analysis.gdt.length +
    analysis.threads.length +
    analysis.holes.length +
    analysis.notes.length +
    analysis.surfaceFinishes.length
  );
}

export function normalizeAnalysis(data: unknown): PrintAnalysis {
  const root = isRecord(unwrapAnalysis(data)) ? (unwrapAnalysis(data) as Record<string, unknown>) : {};
  const titleRaw = isRecord(root.titleBlock)
    ? root.titleBlock
    : isRecord(root.title_block)
      ? root.title_block
      : {};

  const titleBlock: TitleBlock = {
    ...emptyTitle(),
    partName: asString(pick(titleRaw, ["partName", "part_name", "name", "title"])),
    partNumber: asString(pick(titleRaw, ["partNumber", "part_number", "number", "pn"])),
    revision: asString(pick(titleRaw, ["revision", "rev"])),
    drawingNumber: asString(pick(titleRaw, ["drawingNumber", "drawing_number", "drawing"])),
    material: asString(pick(titleRaw, ["material"])),
    materialSpec: asString(pick(titleRaw, ["materialSpec", "material_spec", "spec"])),
    finish: asString(pick(titleRaw, ["finish", "surfaceFinish"])),
    heatTreat: asString(pick(titleRaw, ["heatTreat", "heat_treat", "heatTreatment"])),
    scale: asString(pick(titleRaw, ["scale"])),
    units: asUnits(pick(titleRaw, ["units", "unit"])),
    generalTolerances: asString(
      pick(titleRaw, ["generalTolerances", "general_tolerances", "tolerances", "defaultTolerance"]),
    ),
    company: asString(pick(titleRaw, ["company", "customer", "organization"])),
    drawnBy: asString(pick(titleRaw, ["drawnBy", "drawn_by", "drawn"])),
    date: asString(pick(titleRaw, ["date", "drawnDate"])),
    weight: asString(pick(titleRaw, ["weight", "mass"])),
  };

  const dimensions: Dimension[] = asArray(root.dimensions).map((entry, index) => {
    const row = isRecord(entry) ? entry : {};
    return {
      id: asString(row.id) ?? `d${index + 1}`,
      description: text(pick(row, ["description", "name", "feature", "callout"]), "Dimension"),
      nominal: text(pick(row, ["nominal", "value", "size", "dimension"]), "—"),
      tolerance: asString(pick(row, ["tolerance", "tol"])),
      units: asString(pick(row, ["units", "unit"])),
      feature: asString(pick(row, ["feature", "location", "where"])),
    };
  });

  const gdt: GdtCallout[] = asArray(root.gdt ?? root.gdandt ?? root.geometricTolerances).map(
    (entry, index) => {
      const row = isRecord(entry) ? entry : {};
      const datumsRaw = row.datums ?? row.datum;
      const datums = Array.isArray(datumsRaw)
        ? datumsRaw.map((item) => asString(item)).filter((item): item is string => Boolean(item))
        : asString(datumsRaw)
            ?.split(/[|,/\s]+/)
            .filter(Boolean) ?? [];
      return {
        id: asString(row.id) ?? `g${index + 1}`,
        symbol: text(pick(row, ["symbol", "characteristic", "type"]), "geometric tolerance"),
        tolerance: text(pick(row, ["tolerance", "value"]), "—"),
        datums,
        modifier: asString(pick(row, ["modifier", "materialCondition"])),
        appliesTo: text(pick(row, ["appliesTo", "applies_to", "feature", "description"]), "Feature"),
      };
    },
  );

  const threads: ThreadCallout[] = asArray(root.threads).map((entry, index) => {
    const row = isRecord(entry) ? entry : {};
    const size = text(pick(row, ["size", "thread", "designation"]), "Thread");
    const threadClass = asString(pick(row, ["threadClass", "class", "fit"]));
    const depth = asString(pick(row, ["depth"]));
    return {
      id: asString(row.id) ?? `t${index + 1}`,
      size,
      pitch: asString(pick(row, ["pitch"])),
      threadClass,
      depth,
      callout: text(pick(row, ["callout", "text", "description"]), [size, threadClass, depth].filter(Boolean).join(" ")),
      quantity: asQty(pick(row, ["quantity", "qty"])),
      threadType: asString(pick(row, ["threadType", "type", "series", "form"])),
    };
  });

  const holes: HoleCallout[] = asArray(root.holes).map((entry, index) => {
    const row = isRecord(entry) ? entry : {};
    return {
      id: asString(row.id) ?? `h${index + 1}`,
      diameter: text(pick(row, ["diameter", "dia", "size"]), "Hole"),
      depth: asString(pick(row, ["depth"])),
      quantity: asQty(pick(row, ["quantity", "qty"])),
      counterbore: asString(pick(row, ["counterbore", "cbore", "cBore"])),
      countersink: asString(pick(row, ["countersink", "csk"])),
      thread: asString(pick(row, ["thread"])),
      tolerance: asString(pick(row, ["tolerance", "tol"])),
      note: asString(pick(row, ["note", "notes", "description"])),
    };
  });

  const surfaceFinishes: SurfaceFinish[] = asArray(
    root.surfaceFinishes ?? root.surface_finishes ?? root.finishes,
  ).map((entry, index) => {
    const row = isRecord(entry) ? entry : {};
    return {
      id: asString(row.id) ?? `sf${index + 1}`,
      value: text(pick(row, ["value", "finish", "roughness"]), "Finish"),
      units: asString(pick(row, ["units", "unit"])),
      appliesTo: text(pick(row, ["appliesTo", "applies_to", "feature", "where"]), "As printed"),
    };
  });

  const coatings: Coating[] = asArray(root.coatings ?? root.processes).map((entry, index) => {
    const row = isRecord(entry) ? entry : {};
    return {
      id: asString(row.id) ?? `c${index + 1}`,
      process: text(pick(row, ["process", "name", "finish", "treatment"]), "Process"),
      spec: asString(pick(row, ["spec", "specification", "standard"])),
      appliesTo: asString(pick(row, ["appliesTo", "applies_to", "where"])),
    };
  });

  const notes: NoteItem[] = asArray(root.notes).map((entry, index) => {
    if (typeof entry === "string") {
      return { id: `n${index + 1}`, text: entry, category: "general" as const };
    }
    const row = isRecord(entry) ? entry : {};
    return {
      id: asString(row.id) ?? `n${index + 1}`,
      text: text(pick(row, ["text", "note", "description"]), ""),
      category: asNoteCategory(pick(row, ["category", "type"])),
    };
  }).filter((note) => note.text.length > 0);

  const specs: SpecItem[] = asArray(root.specs ?? root.standards).map((entry, index) => {
    if (typeof entry === "string") {
      return { id: `s${index + 1}`, standard: entry, description: null };
    }
    const row = isRecord(entry) ? entry : {};
    return {
      id: asString(row.id) ?? `s${index + 1}`,
      standard: text(pick(row, ["standard", "spec", "name"]), "Spec"),
      description: asString(pick(row, ["description", "text"])),
    };
  });

  return {
    titleBlock,
    dimensions,
    gdt,
    threads,
    holes,
    surfaceFinishes,
    coatings,
    notes,
    specs,
  };
}

function featureIndex(analysis: PrintAnalysis): { id: string; section: string }[] {
  return [
    ...analysis.dimensions.map((item) => ({ id: item.id, section: "dimensions" })),
    ...analysis.gdt.map((item) => ({ id: item.id, section: "gdt" })),
    ...analysis.threads.map((item) => ({ id: item.id, section: "threads" })),
    ...analysis.holes.map((item) => ({ id: item.id, section: "holes" })),
    ...analysis.surfaceFinishes.map((item) => ({ id: item.id, section: "surfaceFinishes" })),
    ...analysis.coatings.map((item) => ({ id: item.id, section: "coatings" })),
    ...analysis.notes.map((item) => ({ id: item.id, section: "notes" })),
    ...analysis.specs.map((item) => ({ id: item.id, section: "specs" })),
  ];
}

export function normalizeVerified(data: unknown, draft?: PrintAnalysis): {
  analysis: PrintAnalysis;
  verification: Verification;
  hardFeatures: HardFeature[];
} {
  const root = isRecord(data) ? data : {};
  let analysis = normalizeAnalysis(root.analysis ?? root.print ?? root.corrected ?? data);
  if (draft && featureCount(analysis) === 0 && featureCount(draft) > 0) {
    analysis = draft;
  }

  const corrections: Correction[] = asArray(root.corrections).map((entry) => {
    const row = isRecord(entry) ? entry : {};
    return {
      itemId: text(pick(row, ["itemId", "id"]), ""),
      field: text(pick(row, ["field", "what"]), "value"),
      from: text(pick(row, ["from", "original", "before"]), "—"),
      to: text(pick(row, ["to", "corrected", "after"]), "—"),
      reason: text(pick(row, ["reason", "why", "note"]), "Corrected against the sheet."),
    };
  }).filter((item) => item.itemId || item.from !== "—");

  const unreadable: UnreadableItem[] = asArray(root.unreadable ?? root.unreadableItems).map((entry) => {
    const row = isRecord(entry) ? entry : {};
    return {
      location: text(pick(row, ["location", "where"]), "On the sheet"),
      description: text(pick(row, ["description", "text", "reason"]), "Could not read this ink."),
    };
  });

  const conflicts: ConflictItem[] = asArray(root.conflicts).map((entry) => {
    const row = isRecord(entry) ? entry : {};
    const valuesRaw = row.values ?? row.options;
    const values = Array.isArray(valuesRaw)
      ? valuesRaw.map((item) => asString(item)).filter((item): item is string => Boolean(item))
      : [];
    return {
      description: text(pick(row, ["description", "text"]), "The views disagree."),
      values,
    };
  });

  const provided = new Map<string, VerificationCheck>();
  for (const entry of asArray(root.checks ?? root.items)) {
    if (!isRecord(entry)) continue;
    const id = asString(entry.id);
    if (!id) continue;
    provided.set(id, {
      id,
      section: text(entry.section, "print"),
      confidence: asConfidence(entry.confidence),
      status: asStatus(entry.status),
      note: asString(entry.note),
    });
  }

  const correctedIds = new Set(corrections.map((item) => item.itemId));
  const checks: VerificationCheck[] = featureIndex(analysis).map((feature) => {
    const existing = provided.get(feature.id);
    const status: CheckStatus = correctedIds.has(feature.id)
      ? "corrected"
      : (existing?.status ?? "confirmed");
    return {
      id: feature.id,
      section: existing?.section || feature.section,
      confidence: existing?.confidence ?? "medium",
      status,
      note: existing?.note ?? (existing ? null : "Not individually scored."),
    };
  });

  const hardFeatures: HardFeature[] = asArray(root.hardFeatures ?? root.hard_features).map(
    (entry, index) => {
      const row = isRecord(entry) ? entry : {};
      const relatedRaw = row.relatedIds ?? row.related;
      const relatedIds = Array.isArray(relatedRaw)
        ? relatedRaw.map((item) => asString(item)).filter((item): item is string => Boolean(item))
        : [];
      return {
        id: asString(row.id) ?? `hf${index + 1}`,
        feature: text(pick(row, ["feature", "name", "callout"]), "Feature"),
        severity: asSeverity(pick(row, ["severity", "level"])),
        why: text(pick(row, ["why", "reason"]), "This callout is tighter or less common than a routine cut."),
        approach: text(pick(row, ["approach", "suggestion", "method"]), "Plan the setup before you cut it."),
        relatedIds,
      };
    },
  );

  const gaps = unreadable.length + conflicts.length;
  const verifiedFlag = root.verified === false ? false : gaps === 0;

  return {
    analysis,
    hardFeatures,
    verification: {
      verified: verifiedFlag,
      summary: text(
        root.summary,
        gaps
          ? "Checked against the sheet. Some ink still needs a human look."
          : "Checked against the sheet.",
      ),
      corrections,
      unreadable,
      conflicts,
      checks,
    },
  };
}

export function finalizeTooling(
  raw: unknown,
  citationUrls: string[],
): { items: ToolItem[]; rejectedUrls: number } {
  const keys = citationKeys(citationUrls);
  const list = Array.isArray(raw) ? raw : isRecord(raw) && Array.isArray(raw.items) ? raw.items : [];
  const items: ToolItem[] = [];
  let rejectedUrls = 0;

  list.forEach((entry, index) => {
    if (!isRecord(entry)) return;
    const hinted = `${asString(entry.kind) ?? ""} ${asString(entry.category) ?? ""}`.toLowerCase();
    const kind: "tool" | "stock" =
      hinted.includes("stock") || hinted.includes("material") || hinted.includes("blank")
        ? "stock"
        : "tool";
    const category: ToolCategory = kind === "stock" ? "stock" : asCategory(entry.category);
    const name = text(pick(entry, ["name", "description", "tool"]), kind === "stock" ? "Stock" : "Tool");
    const spec = text(pick(entry, ["spec", "size", "exactSize", "specification"]), name);
    if (!spec.trim()) return;
    const why = text(
      pick(entry, ["why", "reason", "use", "usedFor", "covers"]),
      "Called out on the print.",
    );
    const urlRaw = asString(pick(entry, ["url", "productUrl", "link"]));

    let linkType: LinkType = "search";
    let productUrl: string | null = null;
    let partNumber: string | null = null;
    let vendor = asVendor(pick(entry, ["vendor", "supplier", "catalog"])) ?? defaultVendor(category);

    if (urlRaw) {
      const classified = classifyCatalogUrl(urlRaw);
      const cited = classified.key != null && keys.has(classified.key);
      if (classified.product && cited && classified.vendor && classified.partNumber) {
        linkType = "product";
        productUrl = classified.href;
        partNumber = classified.partNumber;
        vendor = classified.vendor;
      } else {
        rejectedUrls += 1;
      }
    }

    items.push({
      id: `tool-${index + 1}`,
      kind,
      category,
      name,
      spec,
      why,
      quantity: asQty(pick(entry, ["quantity", "qty"])),
      linkType,
      vendor,
      partNumber,
      productUrl,
      searches: VENDORS.map((item) => ({ vendor: item, url: searchUrl(item, spec) })),
      note: asString(pick(entry, ["note", "notes", "allowance"])),
    });
  });

  return { items, rejectedUrls };
}
