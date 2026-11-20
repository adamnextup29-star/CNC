import { Camera, FileText } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "./ui/button.tsx";

export function UploadHero({
  hasKey,
  onFiles,
  onDemo,
}: {
  hasKey: boolean;
  onFiles: (files: File[]) => void;
  onDemo: () => void;
}) {
  const libraryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-12">
      <p className="font-display text-sm tracking-[0.22em] text-blue">ON THE BENCH</p>
      <h1 className="mt-2 max-w-xl font-display text-5xl leading-[0.92] text-text sm:text-7xl">
        Read the print before you pull tools.
      </h1>
      <p className="mt-4 max-w-xl text-lg text-muted">
        Photograph a blueprint or drop the PDF. Blueprint Reader pulls the title block, every dimension,
        the threads, holes, and notes — then checks its own work against the sheet.
      </p>

      <div
        className={`mt-8 rounded-lg border-2 border-dashed px-4 py-8 text-center ${over ? "border-blue bg-blue/5" : "border-line bg-panel"}`}
        onDragOver={(event) => {
          event.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setOver(false);
          const files = [...event.dataTransfer.files];
          if (files.length) onFiles(files);
        }}
      >
        <p className="font-display text-3xl tracking-wide">Drop the print</p>
        <p className="mt-1 text-muted">PDF, PNG, or a phone photo of the sheet</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button className="w-full sm:w-auto" onClick={() => libraryRef.current?.click()}>
            <FileText />
            Choose file
          </Button>
          <Button variant="outline" className="w-full sm:w-auto" onClick={() => cameraRef.current?.click()}>
            <Camera />
            Take photo
          </Button>
        </div>
        <input
          ref={libraryRef}
          className="hidden"
          type="file"
          accept="application/pdf,image/png,image/jpeg,image/webp,.pdf,.png,.jpg,.jpeg,.webp"
          multiple
          onChange={(event) => {
            const files = [...(event.target.files ?? [])];
            event.target.value = "";
            if (files.length) onFiles(files);
          }}
        />
        <input
          ref={cameraRef}
          className="hidden"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(event) => {
            const files = [...(event.target.files ?? [])];
            event.target.value = "";
            if (files.length) onFiles(files);
          }}
        />
      </div>

      <ol className="mt-8 grid gap-3 sm:grid-cols-3">
        {[
          ["01", "Read", "Title block, dimensions, GD&T, threads, holes, notes."],
          ["02", "Verify", "A second look corrects the first and scores each callout."],
          ["03", "Source", "Exact tool and stock links, or a search when no page matches."],
        ].map(([index, title, copy]) => (
          <li key={index} className="rounded-lg border border-line bg-bench p-4">
            <p className="font-mono text-sm text-blue">{index}</p>
            <p className="mt-1 font-display text-2xl tracking-wide">{title}</p>
            <p className="mt-1 text-sm text-muted">{copy}</p>
          </li>
        ))}
      </ol>

      <div className="mt-8 rounded-lg border border-line bg-panel p-4">
        <p className="text-sm text-muted">
          {hasKey
            ? "API key is saved in this browser."
            : "No API key in this browser yet. The sample job still runs."}
        </p>
        <Button variant="outline" className="mt-3 w-full sm:w-auto" onClick={onDemo}>
          Open the sample job
        </Button>
      </div>
    </section>
  );
}
