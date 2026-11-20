import { Loader2 } from "lucide-react";
import type { Phase } from "../lib/types.ts";
import { Button } from "./ui/button.tsx";

const STEPS: { id: Phase; label: string }[] = [
  { id: "reading", label: "Read the print" },
  { id: "verifying", label: "Check every callout" },
  { id: "sourcing", label: "Search the catalogs" },
];

const ORDER: Phase[] = ["rendering", "reading", "verifying", "sourcing", "done"];

export function ProgressPanel({
  phase,
  detail,
  onCancel,
}: {
  phase: Phase;
  detail: string;
  onCancel: () => void;
}) {
  const current = ORDER.indexOf(phase);

  return (
    <section className="rounded-lg border border-line bg-panel p-5">
      <div className="flex items-center gap-3">
        <Loader2 className="animate-spin text-blue" />
        <div>
          <p className="font-display text-3xl leading-none tracking-wide">Working the sheet</p>
          <p className="mt-1 text-sm text-muted">{detail || "Preparing the image."}</p>
        </div>
      </div>
      <ol className="mt-5 space-y-2">
        {STEPS.map((step) => {
          const stepIndex = ORDER.indexOf(step.id);
          const state = current > stepIndex ? "done" : current === stepIndex ? "now" : "wait";
          return (
            <li
              key={step.id}
              className={`flex min-h-11 items-center justify-between rounded-md border px-3 ${
                state === "now" ? "border-blue text-blue" : "border-line text-muted"
              }`}
            >
              <span>{step.label}</span>
              <span className="font-mono text-xs uppercase">
                {state === "done" ? "Done" : state === "now" ? "Now" : "Next"}
              </span>
            </li>
          );
        })}
      </ol>
      <Button variant="ghost" className="mt-4" onClick={onCancel}>
        Cancel
      </Button>
    </section>
  );
}
