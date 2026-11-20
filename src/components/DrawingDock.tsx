import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PageImage } from "../lib/types.ts";
import { SampleSheet } from "./SampleSheet.tsx";
import { Button } from "./ui/button.tsx";

export function SheetView({
  demo,
  page,
}: {
  demo: boolean;
  page: PageImage | undefined;
}) {
  if (demo) return <SampleSheet />;
  if (!page) return null;
  return (
    <img
      src={page.dataUrl}
      alt={page.name || "Uploaded print"}
      className="h-auto w-full bg-white"
    />
  );
}

export function DrawingDock({
  demo,
  pages,
  active,
  onActive,
  onEnlarge,
}: {
  demo: boolean;
  pages: PageImage[];
  active: number;
  onActive: (index: number) => void;
  onEnlarge: () => void;
}) {
  const page = pages[active];
  const label = demo ? "Sample sheet · FA-4417" : page ? `Sheet ${active + 1} of ${pages.length}` : "Print";

  return (
    <div className="rounded-lg border border-line bg-bench p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="font-mono text-xs uppercase tracking-wide text-muted">{label}</p>
        <button type="button" className="text-sm font-semibold text-blue" onClick={onEnlarge}>
          Enlarge
        </button>
      </div>
      <button type="button" className="block w-full overflow-hidden rounded-sm bg-cream" onClick={onEnlarge}>
        <SheetView demo={demo} page={page} />
      </button>
      {pages.length > 1 ? (
        <div className="mt-3 flex items-center justify-between">
          <Button
            variant="outline"
            size="icon"
            aria-label="Previous page"
            disabled={active === 0}
            onClick={() => onActive(active - 1)}
          >
            <ChevronLeft />
          </Button>
          <p className="font-mono text-sm">{active + 1}</p>
          <Button
            variant="outline"
            size="icon"
            aria-label="Next page"
            disabled={active === pages.length - 1}
            onClick={() => onActive(active + 1)}
          >
            <ChevronRight />
          </Button>
        </div>
      ) : (
        <p className="mt-2 text-center text-xs text-muted">Tap the sheet to enlarge</p>
      )}
    </div>
  );
}
