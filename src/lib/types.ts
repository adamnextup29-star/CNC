export type Units = "inch" | "mm" | "unknown";

export type Confidence = "high" | "medium" | "low";

export type CheckStatus = "confirmed" | "corrected" | "unreadable" | "conflict";

export type Severity = "watch" | "hard" | "special-process";

export type ToolCategory =
  | "endmill"
  | "drill"
  | "tap"
  | "reamer"
  | "threadmill"
  | "chamfer"
  | "insert"
  | "gauge"
  | "pin"
  | "thread-gauge"
  | "stock"
  | "other";

export type Vendor = "mcmaster" | "msc" | "haas";

export type LinkType = "product" | "search";

export type NoteCategory =
  | "general"
  | "machining"
  | "inspection"
  | "material"
  | "finish"
  | "other";

export interface TitleBlock {
  partName: string | null;
  partNumber: string | null;
  revision: string | null;
  drawingNumber: string | null;
  material: string | null;
  materialSpec: string | null;
  finish: string | null;
  heatTreat: string | null;
  scale: string | null;
  units: Units;
  generalTolerances: string | null;
  company: string | null;
  drawnBy: string | null;
  date: string | null;
  weight: string | null;
}

export interface Dimension {
  id: string;
  description: string;
  nominal: string;
  tolerance: string | null;
  units: string | null;
  feature: string | null;
}

export interface GdtCallout {
  id: string;
  symbol: string;
  tolerance: string;
  datums: string[];
  modifier: string | null;
  appliesTo: string;
}

export interface ThreadCallout {
  id: string;
  size: string;
  pitch: string | null;
  threadClass: string | null;
  depth: string | null;
  callout: string;
  quantity: number | null;
  threadType: string | null;
}

export interface HoleCallout {
  id: string;
  diameter: string;
  depth: string | null;
  quantity: number | null;
  counterbore: string | null;
  countersink: string | null;
  thread: string | null;
  tolerance: string | null;
  note: string | null;
}

export interface SurfaceFinish {
  id: string;
  value: string;
  units: string | null;
  appliesTo: string;
}

export interface Coating {
  id: string;
  process: string;
  spec: string | null;
  appliesTo: string | null;
}

export interface NoteItem {
  id: string;
  text: string;
  category: NoteCategory;
}

export interface SpecItem {
  id: string;
  standard: string;
  description: string | null;
}

export interface PrintAnalysis {
  titleBlock: TitleBlock;
  dimensions: Dimension[];
  gdt: GdtCallout[];
  threads: ThreadCallout[];
  holes: HoleCallout[];
  surfaceFinishes: SurfaceFinish[];
  coatings: Coating[];
  notes: NoteItem[];
  specs: SpecItem[];
}

export interface Correction {
  itemId: string;
  field: string;
  from: string;
  to: string;
  reason: string;
}

export interface UnreadableItem {
  location: string;
  description: string;
}

export interface ConflictItem {
  description: string;
  values: string[];
}

export interface VerificationCheck {
  id: string;
  section: string;
  confidence: Confidence;
  status: CheckStatus;
  note: string | null;
}

export interface Verification {
  verified: boolean;
  summary: string;
  corrections: Correction[];
  unreadable: UnreadableItem[];
  conflicts: ConflictItem[];
  checks: VerificationCheck[];
}

export interface HardFeature {
  id: string;
  feature: string;
  severity: Severity;
  why: string;
  approach: string;
  relatedIds: string[];
}

export interface CatalogSearch {
  vendor: Vendor;
  url: string;
}

export interface ToolItem {
  id: string;
  kind: "tool" | "stock";
  category: ToolCategory;
  name: string;
  spec: string;
  why: string;
  quantity: number | null;
  linkType: LinkType;
  vendor: Vendor | null;
  partNumber: string | null;
  productUrl: string | null;
  searches: CatalogSearch[];
  note: string | null;
}

export interface JobResult {
  analysis: PrintAnalysis;
  verification: Verification;
  hardFeatures: HardFeature[];
  tooling: ToolItem[];
  toolingNote: string;
  warnings: string[];
  generatedLabel: string;
  demo: boolean;
}

export interface PageImage {
  id: string;
  name: string;
  dataUrl: string;
  width: number;
  height: number;
}

export type Phase = "idle" | "rendering" | "reading" | "verifying" | "sourcing" | "done" | "error";

export interface Settings {
  apiKey: string;
  model: string;
  baseUrl: string;
}
