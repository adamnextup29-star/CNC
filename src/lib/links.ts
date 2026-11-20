import type { ToolCategory, Vendor } from "./types.ts";

export const VENDORS: Vendor[] = ["mcmaster", "msc", "haas"];

export const VENDOR_LABEL: Record<Vendor, string> = {
  mcmaster: "McMaster-Carr",
  msc: "MSC Direct",
  haas: "Haas Tooling",
};

const MC_PRODUCT = /^\/(?:products\/)?\d{3,7}[a-z]\d{1,4}\/?$/i;
const MSC_PRODUCT = /^\/product\/details\/\d{5,12}\/?$/i;
const HAAS_PRODUCT = /^\/p\/\d{2}-\d{3,6}\/?$/i;

export interface ClassifiedUrl {
  ok: boolean;
  vendor: Vendor | null;
  product: boolean;
  href: string;
  partNumber: string | null;
  key: string | null;
}

function looseKey(raw: string): string | null {
  try {
    const url = new URL(raw.trim());
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    return `${host}${url.pathname.replace(/\/+$/, "").toLowerCase()}`;
  } catch {
    return null;
  }
}

export function classifyCatalogUrl(raw: string): ClassifiedUrl {
  const fail = (href = raw): ClassifiedUrl => ({
    ok: false,
    vendor: null,
    product: false,
    href,
    partNumber: null,
    key: null,
  });

  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return fail();
  }
  if (url.protocol !== "https:") return fail(url.href);

  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const vendor: Vendor | null =
    host === "mcmaster.com" ? "mcmaster" : host === "mscdirect.com" ? "msc" : host === "haastooling.com" ? "haas" : null;
  if (!vendor) return fail(url.href);

  const path = url.pathname;
  let product = false;
  let partNumber: string | null = null;
  if (vendor === "mcmaster") {
    product = MC_PRODUCT.test(path);
    const match = path.match(/(\d{3,7}[a-z]\d{1,4})\/?$/i);
    partNumber = product && match ? match[1].toUpperCase() : null;
  } else if (vendor === "msc") {
    product = MSC_PRODUCT.test(path);
    const match = path.match(/\/details\/(\d{5,12})\/?$/);
    partNumber = product && match ? match[1] : null;
  } else {
    product = HAAS_PRODUCT.test(path);
    const match = path.match(/\/p\/(\d{2}-\d{3,6})\/?$/i);
    partNumber = product && match ? match[1] : null;
  }

  return {
    ok: true,
    vendor,
    product,
    href: url.href,
    partNumber,
    key: looseKey(url.href),
  };
}

export function citationKeys(urls: string[]): Set<string> {
  const keys = new Set<string>();
  for (const raw of urls) {
    const key = looseKey(raw);
    if (key) keys.add(key);
  }
  return keys;
}

export function searchUrl(vendor: Vendor, spec: string): string {
  const query = encodeURIComponent(spec.trim());
  if (vendor === "mcmaster") return `https://www.mcmaster.com/${query}`;
  if (vendor === "msc") return `https://www.mscdirect.com/browse/tn?searchterm=${query}`;
  return `https://www.haastooling.com/search?q=${query}`;
}

export function defaultVendor(category: ToolCategory): Vendor {
  if (
    category === "stock" ||
    category === "gauge" ||
    category === "pin" ||
    category === "thread-gauge"
  ) {
    return "mcmaster";
  }
  return "haas";
}
