import type { HardFeature, PrintAnalysis } from "./types.ts";

const ANALYSIS_SHAPE = `{
  "titleBlock": {
    "partName": null, "partNumber": null, "revision": null, "drawingNumber": null,
    "material": null, "materialSpec": null, "finish": null, "heatTreat": null,
    "scale": null, "units": "inch|mm|unknown", "generalTolerances": null,
    "company": null, "drawnBy": null, "date": null, "weight": null
  },
  "dimensions": [{"id":"d1","description":"","nominal":"","tolerance":null,"units":null,"feature":null}],
  "gdt": [{"id":"g1","symbol":"position","tolerance":"","datums":["A"],"modifier":null,"appliesTo":""}],
  "threads": [{"id":"t1","size":"","pitch":null,"threadClass":null,"depth":null,"callout":"","quantity":null,"threadType":null}],
  "holes": [{"id":"h1","diameter":"","depth":null,"quantity":null,"counterbore":null,"countersink":null,"thread":null,"tolerance":null,"note":null}],
  "surfaceFinishes": [{"id":"sf1","value":"","units":null,"appliesTo":""}],
  "coatings": [{"id":"c1","process":"","spec":null,"appliesTo":null}],
  "notes": [{"id":"n1","text":"","category":"general|machining|inspection|material|finish|other"}],
  "specs": [{"id":"s1","standard":"","description":null}]
}`;

export const READ_SYSTEM = `You read mechanical engineering drawings for CNC machinists. Transcribe only what is printed. Do not invent dimensions, tolerances, thread classes, depths, or notes to fill gaps. If ink is unclear, leave that item out. Keep the print's units and the callout wording.

Return one JSON object with this shape:
${ANALYSIS_SHAPE}

Rules:
- titleBlock.units is "inch", "mm", or "unknown".
- generalTolerances is the title-block tolerance block as printed, for example ".XX ±.010, .XXX ±.005, angles ±0.5°".
- Give every dimension a stable id (d1, d2, ...). Put reference dimensions in the description. nominal is the size; tolerance is the ±, limit, MAX, or MIN text, or null if the title-block default applies and nothing else is printed on that dimension.
- GD&T symbol is the characteristic name: position, flatness, perpendicularity, profile, runout, total runout, cylindricity, parallelism, angularity, concentricity, circularity, or symmetry. modifier is MMC, LMC, RFS, or null. datums is the datum letters in order.
- Threads: one object per distinct thread callout. size like "1/4-20" or "M6x1.0". threadClass like "2B" or "6H". callout is the full leader text. quantity is a number.
- Holes: diameter as printed, including THRU when it is printed. Counterbore and countersink text go in those fields. Do not also invent the tap drill unless the drill diameter is printed.
- surfaceFinishes value is as printed ("63", "32 µin Ra", "Ra 1.6").
- Keep heat treat, plating, anodize, and paint in coatings, not in dimensions. heatTreat on the title block is the title-block process only.
- notes: every numbered or general note. category is general, machining, inspection, material, finish, or other.
- specs: cited standards (ASME Y14.5, AMS, ASTM, MIL, ISO).
- Use null when the print does not say, and [] for empty lists.`;

export function readUserPrompt(pageCount: number): string {
  return `The attached images are the drawing, in order, ${pageCount} page${pageCount === 1 ? "" : "s"}. Transcribe the print into the JSON object. Image order is page order.`;
}

export const VERIFY_SYSTEM = `You are the second pass on a CNC print. You receive the sheet images again plus a first-pass JSON transcription. Check every item against the pixels. Fix wrong numbers, missed tolerances, swapped thread classes, and features that are not on the print. Add callouts the first pass skipped. Do not invent ink you cannot see.

After the transcription is corrected, flag features that are hard to machine or that need a special tool or process. Flag them only from the corrected data.

Return one JSON object:
{
  "verified": true,
  "summary": "a short paragraph a machinist can read",
  "corrections": [{"itemId":"d1","field":"tolerance","from":"","to":"","reason":""}],
  "unreadable": [{"location":"","description":""}],
  "conflicts": [{"description":"","values":[""]}],
  "checks": [{"id":"d1","section":"dimensions","confidence":"high|medium|low","status":"confirmed|corrected|unreadable|conflict","note":null}],
  "analysis": ${ANALYSIS_SHAPE},
  "hardFeatures": [{"id":"hf1","feature":"","severity":"watch|hard|special-process","why":"","approach":"","relatedIds":["d1"]}]
}

Confidence is how sure you are of the pixels: high when the ink is clean, medium when a leader crosses a line or the photo is soft, low when you are unsure. Use status "corrected" when you changed the first pass. Anything you still cannot read goes in unreadable with no guessed value.

Hard-feature severity:
- watch: doable with care on a normal mill or lathe
- hard: a tight limit, a deep small hole, a thin wall, a small internal radius, an uncommon thread class, or a fine finish
- special-process: needs a CMM or special gage, grind, EDM, heat treat, coating, masking, or a 4/5-axis setup

Say why it is hard in shop language and give a practical approach (tool, setup, or inspection). Do not flag ordinary ±.005 inch work on a rigid part. The analysis object must be the corrected print, not the first pass. Include a check for every id in the corrected analysis.`;

export function verifyUserPrompt(draft: PrintAnalysis): string {
  return `First-pass transcription to check against the attached page images:
${JSON.stringify(draft)}

Compare every value to the sheet. Return the verification JSON.`;
}

export function toolingPrompt(analysis: PrintAnalysis, hardFeatures: HardFeature[]): string {
  return `You buy tools and stock for a CNC job. The verified print is below. List every cutter, drill, tap, reamer, thread mill, chamfer tool, insert, gage, pin, thread gage, and the raw stock.

Sizes must be the size the print requires. For each thread, include the standard tap drill (number, letter, or decimal) that thread actually takes. Do not substitute a nearby catalog size and call it exact. On stock, state the machining allowance (diameter and length) so the buy size is larger than the finish size. The spec field is that buy size, not a smaller finish size.

Use the web_search tool. Look only on mcmaster.com, mscdirect.com, and haastooling.com. Open the product page. If that page is this exact size and spec, set url to the page you opened and partNumber to the catalog number printed on that page. If you did not open an exact product page, set url to null and partNumber to null. Never guess a URL or a part number.

Prefer Haas Tooling for cutters, McMaster-Carr for stock and gages, and MSC Direct when the other two do not show the size.

After you finish searching, the entire final message must be one JSON object and nothing else:
{"items":[{
  "id":"t1",
  "kind":"tool",
  "category":"endmill|drill|tap|reamer|threadmill|chamfer|insert|gauge|pin|thread-gauge|stock|other",
  "name":"",
  "spec":"",
  "why":"which callout this covers",
  "quantity":1,
  "vendor":"haas|mcmaster|msc",
  "partNumber":null,
  "url":null
}]}

kind is "stock" for raw material and "tool" for everything else.

Verified print:
${JSON.stringify({ analysis, hardFeatures })}`;
}
