import { ExternalLink, Printer, ShieldCheck } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { buildChecklist } from "../lib/checklist.ts";
import { CATEGORY_LABEL, CONFIDENCE_LABEL, SEVERITY_LABEL, unitsLabel } from "../lib/labels.ts";
import { VENDOR_LABEL } from "../lib/links.ts";
import type {
  Confidence,
  JobResult,
  Severity,
  ToolItem,
  Verification,
  VerificationCheck,
} from "../lib/types.ts";
import { Badge } from "./ui/badge.tsx";
import { Button } from "./ui/button.tsx";

function checkFor(verification: Verification, id: string): VerificationCheck | undefined {
  return verification.checks.find((check) => check.id === id);
}

function confidenceTone(confidence: Confidence): "good" | "warn" | "bad" {
  if (confidence === "high") return "good";
  if (confidence === "low") return "bad";
  return "warn";
}

function severityTone(severity: Severity): "warn" | "bad" | "info" {
  if (severity === "watch") return "warn";
  if (severity === "special-process") return "info";
  return "bad";
}

function Missing() {
  return <span className="text-muted italic">Not on the print</span>;
}

export function SummarySection({ job }: { job: JobResult }) {
  const title = job.analysis.titleBlock;
  const gaps = job.verification.unreadable.length + job.verification.conflicts.length;
  const counts = [
    [job.analysis.dimensions.length, "dimensions"],
    [job.analysis.threads.length, "threads"],
    [job.analysis.holes.length, "holes"],
    [job.hardFeatures.length, "hard features"],
    [job.tooling.length, "tools and stock"],
  ] as const;

  return (
    <section id="summary" className="scroll-mt-32">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-sm text-amber">
            {title.partNumber ?? "No part number"}
            {title.revision ? ` · REV ${title.revision}` : ""}
          </p>
          <h2 className="font-display text-5xl leading-none tracking-wide">
            {title.partName ?? "Untitled print"}
          </h2>
        </div>
        <Badge tone={gaps ? "warn" : "good"} className="min-h-10 px-3 text-sm">
          <ShieldCheck className="h-4 w-4" />
          {gaps ? "Verified, with open items" : "Verified"}
        </Badge>
      </div>
      <dl className="mt-5 grid gap-3 sm:grid-cols-2">
        <Fact label="Material" value={title.material} extra={title.materialSpec} />
        <Fact label="Finish" value={title.finish} extra={title.heatTreat ? `Heat treat: ${title.heatTreat}` : null} />
        <Fact label="Units" value={`${unitsLabel(title.units)} · scale ${title.scale ?? "—"}`} />
        <Fact label="General tolerance" value={title.generalTolerances} />
        <Fact label="Company" value={title.company} extra={[title.drawnBy, title.date].filter(Boolean).join(" · ") || null} />
        <Fact label="Drawing" value={title.drawingNumber} />
      </dl>
      <ul className="mt-4 flex flex-wrap gap-2">
        {counts.map(([count, label]) => (
          <li key={label}>
            <Badge tone="neutral">
              {count} {label}
            </Badge>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Fact({ label, value, extra }: { label: string; value: string | null; extra?: string | null }) {
  return (
    <div className="rounded-lg border border-line bg-panel px-4 py-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 font-mono text-base">{value ?? <Missing />}</dd>
      {extra ? <p className="mt-1 text-sm text-muted">{extra}</p> : null}
    </div>
  );
}

export function DetailsSection({ job }: { job: JobResult }) {
  const analysis = job.analysis;
  return (
    <section id="details" className="scroll-mt-32 space-y-6">
      <SectionTitle kicker="Print details" title="What the sheet says" />
      <Block title="Dimensions" empty="No dimensions were read.">
        {analysis.dimensions.map((item) => (
          <Callout
            key={item.id}
            check={checkFor(job.verification, item.id)}
            kicker={item.description}
            value={`${item.nominal}${item.tolerance ? `  ${item.tolerance}` : ""}`}
            detail={item.feature}
          />
        ))}
      </Block>
      <Block title="GD&T" empty="No geometric callouts were read.">
        {analysis.gdt.map((item) => (
          <Callout
            key={item.id}
            check={checkFor(job.verification, item.id)}
            kicker={item.appliesTo}
            value={`${item.symbol} ${item.tolerance}${item.modifier ? ` ${item.modifier}` : ""}${
              item.datums.length ? ` | ${item.datums.join("|")}` : ""
            }`}
          />
        ))}
      </Block>
      <Block title="Threads" empty="No threads were read.">
        {analysis.threads.map((item) => (
          <Callout
            key={item.id}
            check={checkFor(job.verification, item.id)}
            kicker={item.threadType ?? "Thread"}
            value={`${item.quantity ? `${item.quantity}× ` : ""}${item.callout}`}
            detail={[item.size, item.threadClass, item.depth].filter(Boolean).join(" · ")}
          />
        ))}
      </Block>
      <Block title="Holes" empty="No holes were read.">
        {analysis.holes.map((item) => (
          <Callout
            key={item.id}
            check={checkFor(job.verification, item.id)}
            kicker={item.note ?? "Hole"}
            value={`${item.quantity ? `${item.quantity}× ` : ""}${item.diameter}${item.depth ? ` × ${item.depth}` : ""}`}
            detail={[item.counterbore, item.countersink, item.tolerance].filter(Boolean).join(" · ") || null}
          />
        ))}
      </Block>
      <Block title="Surface finish" empty="No surface finish was read.">
        {analysis.surfaceFinishes.map((item) => (
          <Callout
            key={item.id}
            check={checkFor(job.verification, item.id)}
            kicker={item.appliesTo}
            value={item.value}
            detail={item.units}
          />
        ))}
      </Block>
      <Block title="Coatings and heat treat" empty="No coating or heat treat was read.">
        {analysis.coatings.map((item) => (
          <Callout
            key={item.id}
            check={checkFor(job.verification, item.id)}
            kicker={item.appliesTo ?? "Process"}
            value={item.process}
            detail={item.spec}
          />
        ))}
      </Block>
      <Block title="Notes" empty="No notes were read.">
        {analysis.notes.map((item, index) => (
          <Callout
            key={item.id}
            check={checkFor(job.verification, item.id)}
            kicker={`${index + 1} · ${item.category}`}
            value={item.text}
          />
        ))}
      </Block>
      <Block title="Specs" empty="No specs were cited.">
        {analysis.specs.map((item) => (
          <Callout
            key={item.id}
            check={checkFor(job.verification, item.id)}
            kicker="Spec"
            value={item.standard}
            detail={item.description}
          />
        ))}
      </Block>
    </section>
  );
}

function SectionTitle({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-amber">{kicker}</p>
      <h2 className="font-display text-4xl leading-none tracking-wide">{title}</h2>
    </div>
  );
}

function Block({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: ReactNode;
}) {
  const list = Array.isArray(children) ? children : [children];
  const present = list.some(Boolean);
  return (
    <div>
      <h3 className="mb-2 font-display text-2xl tracking-wide text-muted">{title}</h3>
      {present && list.length > 0 ? <div className="space-y-2">{children}</div> : <p className="text-muted">{empty}</p>}
    </div>
  );
}

function Callout({
  kicker,
  value,
  detail,
  check,
}: {
  kicker: string;
  value: string;
  detail?: string | null;
  check?: VerificationCheck;
}) {
  return (
    <article className="rounded-lg border border-line bg-panel px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{kicker}</p>
        {check ? (
          <span className="flex flex-wrap gap-1">
            <Badge tone={confidenceTone(check.confidence)}>{CONFIDENCE_LABEL[check.confidence]}</Badge>
            {check.status === "corrected" ? <Badge tone="warn">Corrected</Badge> : null}
          </span>
        ) : null}
      </div>
      <p className="mt-1 font-mono text-lg leading-snug">{value}</p>
      {detail ? <p className="mt-1 text-sm text-muted">{detail}</p> : null}
      {check?.note ? <p className="mt-1 text-sm text-muted">{check.note}</p> : null}
    </article>
  );
}

export function VerificationSection({ job }: { job: JobResult }) {
  const { verification } = job;
  const gaps = verification.unreadable.length + verification.conflicts.length;
  return (
    <section id="verification" className="scroll-mt-32 space-y-4">
      <SectionTitle kicker="Verification" title={gaps ? "Verified, with open items" : "Verified"} />
      <p className="text-lg text-muted">{verification.summary}</p>
      <div>
        <h3 className="mb-2 font-display text-2xl tracking-wide">Corrections</h3>
        {verification.corrections.length === 0 ? (
          <p className="text-muted">The second pass did not change the first read.</p>
        ) : (
          <ul className="space-y-2">
            {verification.corrections.map((item, index) => (
              <li key={`${item.itemId}-${index}`} className="rounded-lg border border-line bg-panel px-4 py-3">
                <p className="font-mono text-xs text-amber">
                  {item.itemId} · {item.field}
                </p>
                <p className="mt-1 font-mono">
                  <span className="text-bad line-through">{item.from}</span>
                  <span className="text-muted"> → </span>
                  <span className="text-good">{item.to}</span>
                </p>
                <p className="mt-1 text-sm text-muted">{item.reason}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <h3 className="mb-2 font-display text-2xl tracking-wide">Could not read</h3>
        {verification.unreadable.length === 0 ? (
          <p className="text-muted">Nothing was left unread.</p>
        ) : (
          <ul className="space-y-2">
            {verification.unreadable.map((item, index) => (
              <li key={index} className="rounded-lg border border-bad/40 bg-panel px-4 py-3">
                <p className="text-sm font-semibold text-bad">{item.location}</p>
                <p className="mt-1">{item.description}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <h3 className="mb-2 font-display text-2xl tracking-wide">Conflicts</h3>
        {verification.conflicts.length === 0 ? (
          <p className="text-muted">No conflicts between views.</p>
        ) : (
          <ul className="space-y-2">
            {verification.conflicts.map((item, index) => (
              <li key={index} className="rounded-lg border border-line bg-panel px-4 py-3">
                <p>{item.description}</p>
                {item.values.length > 0 ? (
                  <p className="mt-1 font-mono text-sm text-muted">{item.values.join(" · ")}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export function HardSection({ job }: { job: JobResult }) {
  return (
    <section id="hard" className="scroll-mt-32 space-y-3">
      <SectionTitle kicker="Hard features" title="What will fight you" />
      {job.hardFeatures.length === 0 ? (
        <p className="text-muted">Nothing on this print was flagged as a special setup.</p>
      ) : (
        job.hardFeatures.map((feature) => (
          <article key={feature.id} className="rounded-lg border border-line bg-panel px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-2xl leading-none tracking-wide">{feature.feature}</h3>
              <Badge tone={severityTone(feature.severity)}>{SEVERITY_LABEL[feature.severity]}</Badge>
            </div>
            <p className="mt-3">{feature.why}</p>
            <p className="mt-2 text-muted">{feature.approach}</p>
          </article>
        ))
      )}
    </section>
  );
}

export function ToolingSection({ job }: { job: JobResult }) {
  const stock = job.tooling.filter((item) => item.kind === "stock");
  const tools = job.tooling.filter((item) => item.kind === "tool");
  return (
    <section id="tooling" className="scroll-mt-32 space-y-4">
      <SectionTitle kicker="Tooling and stock" title="Pull these, at this size" />
      <p className="text-muted">{job.toolingNote}</p>
      {job.tooling.length === 0 ? <p className="text-muted">No tools came back for this print.</p> : null}
      <ToolGroup title="Stock" items={stock} />
      <ToolGroup title="Tools and gages" items={tools} />
    </section>
  );
}

function ToolGroup({ title, items }: { title: string; items: ToolItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-2">
      <h3 className="font-display text-2xl tracking-wide text-muted">{title}</h3>
      {items.map((item) => (
        <article key={item.id} className="rounded-lg border border-line bg-panel px-4 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral">{CATEGORY_LABEL[item.category]}</Badge>
            {item.quantity ? <Badge tone="neutral">Qty {item.quantity}</Badge> : null}
          </div>
          <h4 className="mt-2 text-lg font-semibold">{item.name}</h4>
          <p className="mt-1 font-mono text-sm text-amber">{item.spec}</p>
          <p className="mt-2 text-sm text-muted">{item.why}</p>
          {item.note ? <p className="mt-1 text-sm text-muted">{item.note}</p> : null}
          <ToolLinks item={item} />
        </article>
      ))}
    </div>
  );
}

function ToolLinks({ item }: { item: ToolItem }) {
  const primarySearch = item.searches.find((search) => search.vendor === item.vendor) ?? item.searches[0];
  const alternates = item.searches.filter((search) => search !== primarySearch && search.vendor !== item.vendor);

  return (
    <div className="mt-3 space-y-2">
      {item.linkType === "product" && item.productUrl && item.vendor ? (
        <a
          href={item.productUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-12 items-center gap-2 rounded-md bg-amber px-4 font-semibold text-ink"
        >
          {VENDOR_LABEL[item.vendor]}
          {item.partNumber ? ` · ${item.partNumber}` : ""}
          <ExternalLink className="h-4 w-4" />
        </a>
      ) : primarySearch ? (
        <a
          href={primarySearch.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-12 items-center gap-2 rounded-md border border-line px-4 font-semibold"
        >
          Search {VENDOR_LABEL[primarySearch.vendor]}
          <ExternalLink className="h-4 w-4" />
        </a>
      ) : null}
      <p className={`text-xs font-semibold uppercase tracking-wide ${item.linkType === "product" ? "text-good" : "text-amber"}`}>
        {item.linkType === "product" ? "Exact product page" : "Search, not an exact match"}
      </p>
      {alternates.length > 0 ? (
        <p className="text-sm text-muted">
          Also search{" "}
          {alternates.map((search, index) => (
            <span key={search.vendor}>
              {index > 0 ? " · " : ""}
              <a href={search.url} target="_blank" rel="noreferrer" className="underline">
                {VENDOR_LABEL[search.vendor]}
              </a>
            </span>
          ))}
        </p>
      ) : null}
    </div>
  );
}

export function ChecklistSection({ job }: { job: JobResult }) {
  const groups = useMemo(() => buildChecklist(job), [job]);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const title = job.analysis.titleBlock;
  const ids = groups.flatMap((group) => group.items.map((item) => item.id));

  function printChecklist() {
    document.body.classList.add("printing-checklist");
    const cleanup = () => {
      document.body.classList.remove("printing-checklist");
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    window.print();
  }

  return (
    <section id="checklist" className="scroll-mt-32">
      <div className="no-print mb-4 flex flex-wrap items-end justify-between gap-3">
        <SectionTitle kicker="Checklist" title="Job traveler" />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setChecked(Object.fromEntries(ids.map((id) => [id, true])))}>
            Check all
          </Button>
          <Button variant="ghost" onClick={() => setChecked({})}>
            Clear
          </Button>
          <Button onClick={printChecklist}>
            <Printer />
            Print
          </Button>
        </div>
      </div>
      <div id="job-checklist" className="rounded-lg border border-line bg-panel p-4 sm:p-6">
        <header className="border-b border-line pb-4">
          <p className="font-mono text-xs uppercase tracking-[0.16em]">Blueprint Reader</p>
          <h2 className="font-display text-4xl leading-none tracking-wide">
            {title.partName ?? "Print checklist"}
          </h2>
          <p className="mt-2 font-mono text-sm">
            {title.partNumber ?? "—"}
            {title.revision ? ` REV ${title.revision}` : ""} · {title.material ?? "Material not read"} ·{" "}
            {job.generatedLabel}
          </p>
          <p className="mt-2 text-sm">
            Sequence the cuts to suit the setup. Measure the print before you cut. This list is a second set of eyes.
          </p>
        </header>
        <div className="mt-4 space-y-5">
          {groups.map((group) => (
            <div key={group.id}>
              <h3 className="font-display text-2xl tracking-wide">{group.title}</h3>
              <ul className="mt-2 space-y-2">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <label className="flex items-start gap-3 rounded-md border border-line px-3 py-3">
                      <input
                        type="checkbox"
                        className="shop-check mt-1"
                        checked={Boolean(checked[item.id])}
                        onChange={(event) =>
                          setChecked((current) => ({ ...current, [item.id]: event.target.checked }))
                        }
                      />
                      <span>
                        <span className="block">{item.text}</span>
                        {item.detail ? <span className="mt-1 block text-sm text-muted">{item.detail}</span> : null}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
