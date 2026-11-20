import type { Confidence, Severity, ToolCategory, Units } from "./types.ts";

export const CATEGORY_LABEL: Record<ToolCategory, string> = {
  endmill: "End mill",
  drill: "Drill",
  tap: "Tap",
  reamer: "Reamer",
  threadmill: "Thread mill",
  chamfer: "Chamfer",
  insert: "Insert",
  gauge: "Gage",
  pin: "Pin gage",
  "thread-gauge": "Thread gage",
  stock: "Stock",
  other: "Tool",
};

export const SEVERITY_LABEL: Record<Severity, string> = {
  watch: "Watch",
  hard: "Hard",
  "special-process": "Special process",
};

export const CONFIDENCE_LABEL: Record<Confidence, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

export function unitsLabel(units: Units): string {
  if (units === "inch") return "Inch";
  if (units === "mm") return "Millimeter";
  return "Units not read";
}
