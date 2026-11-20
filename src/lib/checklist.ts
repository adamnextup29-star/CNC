import { unitsLabel } from "./labels.ts";
import type { JobResult } from "./types.ts";

export interface ChecklistLine {
  id: string;
  text: string;
  detail: string | null;
}

export interface ChecklistGroup {
  id: string;
  title: string;
  items: ChecklistLine[];
}

function line(id: string, text: string, detail: string | null = null): ChecklistLine {
  return { id, text, detail };
}

export function buildChecklist(job: JobResult): ChecklistGroup[] {
  const { analysis, hardFeatures, tooling } = job;
  const title = analysis.titleBlock;
  const identity: ChecklistLine[] = [
    line(
      "id-part",
      `Confirm the packet is ${title.partNumber ?? "the part"}${title.revision ? ` rev ${title.revision}` : ""}.`,
      title.partName,
    ),
    line("id-material", `Material on the cert matches ${title.material ?? "the print"}.`, title.materialSpec),
    line(
      "id-finish",
      `Finish: ${title.finish ?? "none read on the title block"}.`,
      title.heatTreat ? `Heat treat: ${title.heatTreat}` : null,
    ),
    line(
      "id-tol",
      `General tolerance: ${title.generalTolerances ?? "not in the title block"}.`,
      `${unitsLabel(title.units)} · scale ${title.scale ?? "not read"}`,
    ),
  ];
  for (const note of analysis.notes) {
    identity.push(line(`note-${note.id}`, note.text, note.category));
  }
  for (const spec of analysis.specs) {
    identity.push(line(`spec-${spec.id}`, spec.standard, spec.description));
  }

  const stock = tooling
    .filter((item) => item.kind === "stock")
    .map((item) => line(item.id, `Pull ${item.name}.`, `${item.spec}${item.note ? ` · ${item.note}` : ""}`));

  const tools = tooling
    .filter((item) => item.kind === "tool")
    .map((item) =>
      line(
        item.id,
        `Pull ${item.name}${item.quantity ? ` × ${item.quantity}` : ""}.`,
        item.spec,
      ),
    );

  const callouts: ChecklistLine[] = [];
  for (const dimension of analysis.dimensions) {
    callouts.push(
      line(
        `cut-${dimension.id}`,
        `${dimension.description}: ${dimension.nominal}${dimension.tolerance ? ` ${dimension.tolerance}` : ""}.`,
        dimension.feature,
      ),
    );
  }
  for (const hole of analysis.holes) {
    const extra = [hole.counterbore, hole.countersink, hole.thread, hole.tolerance].filter(Boolean).join(" · ");
    callouts.push(
      line(
        `cut-${hole.id}`,
        `${hole.quantity ? `${hole.quantity}× ` : ""}${hole.diameter}${hole.depth ? ` × ${hole.depth}` : ""}.`,
        extra || hole.note,
      ),
    );
  }
  for (const thread of analysis.threads) {
    callouts.push(
      line(
        `cut-${thread.id}`,
        `${thread.quantity ? `${thread.quantity}× ` : ""}${thread.callout}.`,
        thread.threadType,
      ),
    );
  }
  for (const finish of analysis.surfaceFinishes) {
    callouts.push(line(`cut-${finish.id}`, `Finish ${finish.value} on ${finish.appliesTo}.`, finish.units));
  }
  for (const frame of analysis.gdt) {
    const datums = frame.datums.length ? ` to ${frame.datums.join("|")}` : "";
    callouts.push(
      line(
        `cut-${frame.id}`,
        `${frame.symbol} ${frame.tolerance}${frame.modifier ? ` ${frame.modifier}` : ""}${datums}.`,
        frame.appliesTo,
      ),
    );
  }

  const hard = hardFeatures.map((feature) =>
    line(feature.id, feature.feature, `${feature.why} ${feature.approach}`),
  );

  const finishSteps = analysis.coatings.map((coating) =>
    line(
      `finish-${coating.id}`,
      coating.process,
      [coating.spec, coating.appliesTo].filter(Boolean).join(" · ") || null,
    ),
  );
  finishSteps.push(
    line(
      "finish-tag",
      `Bag and tag ${title.partNumber ?? "the part"}${title.revision ? ` rev ${title.revision}` : ""}.`,
      null,
    ),
  );

  return [
    { id: "identity", title: "Before the spindle", items: identity },
    { id: "stock", title: "Stock", items: stock },
    { id: "tools", title: "Tools to pull", items: tools },
    { id: "callouts", title: "Callouts to hit", items: callouts },
    { id: "hard", title: "Read before you cut", items: hard },
    { id: "finish", title: "Finish and close", items: finishSteps },
  ].filter((group) => group.items.length > 0);
}
