import { Settings } from "lucide-react";
import { useRef, useState } from "react";
import { analyzePrint } from "./lib/analyze.ts";
import { buildDemoJob } from "./lib/demo.ts";
import { fileToPages } from "./lib/images.ts";
import { loadSettings, saveSettings } from "./lib/settings.ts";
import type { JobResult, PageImage, Phase, Settings as ShopSettings } from "./lib/types.ts";
import { explainFailure, isAbortError } from "./lib/xai.ts";
import { DrawingDock, SheetView } from "./components/DrawingDock.tsx";
import { ProgressPanel } from "./components/ProgressPanel.tsx";
import { SettingsDialog } from "./components/SettingsDialog.tsx";
import {
  ChecklistSection,
  DetailsSection,
  HardSection,
  SummarySection,
  ToolingSection,
  VerificationSection,
} from "./components/sections.tsx";
import { UploadHero } from "./components/UploadHero.tsx";
import { Button } from "./components/ui/button.tsx";
import { Modal } from "./components/ui/modal.tsx";

const SECTIONS = [
  ["summary", "Summary"],
  ["details", "Details"],
  ["verification", "Verification"],
  ["hard", "Hard features"],
  ["tooling", "Tooling"],
  ["checklist", "Checklist"],
] as const;

const startOnDemo =
  typeof window !== "undefined" &&
  (window.location.hash === "#demo" || new URLSearchParams(window.location.search).get("demo") === "1");

export default function App() {
  const [settings, setSettings] = useState<ShopSettings>(loadSettings);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pages, setPages] = useState<PageImage[]>([]);
  const [demo, setDemo] = useState(startOnDemo);
  const [result, setResult] = useState<JobResult | null>(startOnDemo ? buildDemoJob() : null);
  const [phase, setPhase] = useState<Phase>(startOnDemo ? "done" : "idle");
  const [detail, setDetail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [activePage, setActivePage] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [omittedNote, setOmittedNote] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const moreRef = useRef<HTMLInputElement>(null);
  const ticket = useRef(0);

  const busy = phase === "rendering" || phase === "reading" || phase === "verifying" || phase === "sourcing";
  const showSheet = demo || pages.length > 0;

  function rememberDemo(on: boolean) {
    const next = on ? "#demo" : window.location.pathname + window.location.search;
    window.history.replaceState(null, "", next);
  }

  function openDemo() {
    ticket.current += 1;
    abortRef.current?.abort();
    rememberDemo(true);
    setDemo(true);
    setPages([]);
    setResult(buildDemoJob());
    setPhase("done");
    setError(null);
    setDetail("");
    setOmittedNote(null);
    setActivePage(0);
  }

  function cancelWork() {
    ticket.current += 1;
    abortRef.current?.abort();
    setPhase("idle");
    setDetail("");
    setError(null);
  }

  function reset() {
    cancelWork();
    rememberDemo(false);
    setDemo(false);
    setPages([]);
    setResult(null);
    setPhase("idle");
    setError(null);
    setDetail("");
    setOmittedNote(null);
    setActivePage(0);
  }

  async function addFiles(files: File[]) {
    const mine = ++ticket.current;
    abortRef.current?.abort();
    rememberDemo(false);
    setDemo(false);
    setResult(null);
    setError(null);
    setPhase("rendering");
    setDetail("Preparing the sheet.");
    try {
      const collected: PageImage[] = [];
      let omitted = 0;
      for (const file of files) {
        const rendered = await fileToPages(file);
        collected.push(...rendered.pages);
        omitted += rendered.omittedPages;
      }
      if (ticket.current !== mine) return;
      setPages((current) => [...current, ...collected].slice(0, 8));
      setOmittedNote(omitted > 0 ? `${omitted} extra PDF page${omitted === 1 ? "" : "s"} were left out.` : null);
      setActivePage(0);
      setPhase("idle");
    } catch (caught) {
      if (ticket.current !== mine) return;
      setError(explainFailure(caught));
      setPhase("error");
    }
  }

  async function run() {
    if (!settings.apiKey.trim()) {
      setSettingsOpen(true);
      setError("Add an xAI API key in Settings, or open the sample job.");
      return;
    }
    if (pages.length === 0) return;
    const mine = ++ticket.current;
    const controller = new AbortController();
    abortRef.current = controller;
    setError(null);
    setResult(null);
    try {
      const job = await analyzePrint(pages, settings, (next, text) => {
        if (ticket.current !== mine) return;
        setPhase(next);
        setDetail(text);
      }, controller.signal);
      if (ticket.current !== mine) return;
      if (omittedNote) job.warnings.unshift(omittedNote);
      setResult(job);
      setPhase("done");
    } catch (caught) {
      if (ticket.current !== mine || isAbortError(caught)) {
        if (ticket.current === mine) setPhase("idle");
        return;
      }
      setError(explainFailure(caught));
      setPhase("error");
    }
  }

  return (
    <div className="min-h-svh pb-28 lg:pb-10">
      <header className="no-print sticky top-0 z-40 border-b border-line bg-ink/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center border border-blue font-display text-lg text-blue">
              BR
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-lg leading-none tracking-[0.12em] sm:text-xl sm:tracking-[0.16em]">
                BLUEPRINT READER
              </p>
              <p className="text-xs text-muted">Shop print brief</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {showSheet ? (
              <Button variant="ghost" className="whitespace-nowrap px-3" onClick={reset}>
                <span className="sm:hidden">New</span>
                <span className="hidden sm:inline">New print</span>
              </Button>
            ) : null}
            <Button variant="outline" size="icon" aria-label="Settings" onClick={() => setSettingsOpen(true)}>
              <Settings />
            </Button>
          </div>
        </div>
      </header>

      {!showSheet && !busy ? (
        <UploadHero hasKey={Boolean(settings.apiKey.trim())} onFiles={addFiles} onDemo={openDemo} />
      ) : (
        <main className="mx-auto grid max-w-6xl gap-6 px-4 py-4 lg:grid-cols-[340px_minmax(0,1fr)]">
          <div className={`lg:sticky lg:top-20 lg:self-start ${result ? "hidden lg:block" : ""}`}>
            <DrawingDock
              demo={demo}
              pages={pages}
              active={activePage}
              onActive={setActivePage}
              onEnlarge={() => setLightbox(true)}
            />
          </div>
          <div className="min-w-0 space-y-6">
            {error ? (
              <div className="rounded-lg border border-bad/50 bg-bad/10 px-4 py-3 text-bad" role="alert">
                {error}
              </div>
            ) : null}

            {busy ? <ProgressPanel phase={phase} detail={detail} onCancel={cancelWork} /> : null}

            {!busy && !result && pages.length > 0 ? (
              <section className="rounded-lg border border-line bg-panel p-5">
                <h2 className="font-display text-4xl leading-none tracking-wide">Sheet is loaded</h2>
                <p className="mt-2 text-muted">
                  {pages.length} page{pages.length === 1 ? "" : "s"} ready.
                  {omittedNote ? ` ${omittedNote}` : ""} The drawing stays up while you read the results.
                </p>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Button onClick={run}>Read this print</Button>
                  <Button variant="outline" onClick={() => moreRef.current?.click()}>
                    Add a page
                  </Button>
                </div>
                <input
                  ref={moreRef}
                  className="hidden"
                  type="file"
                  accept="application/pdf,image/png,image/jpeg,image/webp,.pdf,.png,.jpg,.jpeg,.webp"
                  multiple
                  onChange={(event) => {
                    const files = [...(event.target.files ?? [])];
                    event.target.value = "";
                    if (files.length) void addFiles(files);
                  }}
                />
              </section>
            ) : null}

            {result ? (
              <>
                {result.demo ? (
                  <div className="rounded-lg border border-blue/50 bg-blue/10 px-4 py-3">
                    <p className="font-display text-2xl tracking-wide text-blue">DEMO</p>
                    <p className="text-sm">
                      Sample print FA-4417. This is not a reading of a file you uploaded.
                    </p>
                  </div>
                ) : null}
                {result.warnings.map((warning) => (
                  <p key={warning} className="rounded-md border border-line px-3 py-2 text-sm text-muted">
                    {warning}
                  </p>
                ))}
                <nav className="no-print sticky top-16 z-30 -mx-4 overflow-x-auto border-b border-line bg-ink/95 px-4 py-2 backdrop-blur">
                  <div className="flex gap-2">
                    {SECTIONS.map(([id, label]) => (
                      <a
                        key={id}
                        href={`#${id}`}
                        className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-line px-3 text-sm font-semibold hover:border-blue"
                      >
                        {label}
                      </a>
                    ))}
                  </div>
                </nav>
                <SummarySection job={result} />
                <DetailsSection job={result} />
                <VerificationSection job={result} />
                <HardSection job={result} />
                <ToolingSection job={result} />
                <ChecklistSection job={result} />
              </>
            ) : null}
          </div>
        </main>
      )}

      {result && showSheet ? (
        <button
          type="button"
          className="no-print fixed right-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-30 h-16 w-16 overflow-hidden rounded-md border-2 border-blue bg-cream shadow-lg lg:hidden"
          onClick={() => setLightbox(true)}
          aria-label="Enlarge the print"
        >
          <SheetView demo={demo} page={pages[activePage]} />
        </button>
      ) : null}

      <SettingsDialog
        open={settingsOpen}
        settings={settings}
        onOpenChange={setSettingsOpen}
        onSave={(next) => setSettings(saveSettings(next))}
      />

      <Modal
        open={lightbox}
        onOpenChange={setLightbox}
        wide
        title={demo ? "FA-4417" : "Print"}
        description="Pan around the sheet. Pinch or scroll if you are on a phone."
      >
        <div className={demo ? "min-w-[1040px]" : ""}>
          {demo ? (
            <SheetView demo page={undefined} />
          ) : (
            <img
              src={pages[activePage]?.dataUrl}
              alt={pages[activePage]?.name || "Uploaded print"}
              className="h-auto w-[1400px] max-w-none bg-white"
            />
          )}
        </div>
      </Modal>

      <footer className="no-print mx-auto max-w-6xl px-4 py-8 text-sm text-muted">
        Callouts are a second set of eyes. Measure the print before you cut.
      </footer>
    </div>
  );
}
