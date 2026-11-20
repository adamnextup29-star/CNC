# Blueprint Reader

A shop-floor web app for CNC machinists. Photograph a blueprint or drop the PDF. The app reads the title block, dimensions, GD&T, threads, holes, finishes, and notes, checks that reading against the sheet, then builds a tooling and stock list plus a printable checklist.

It is a static [Vite](https://vite.dev/) + React + TypeScript + Tailwind app. `npm install && npm run build` writes the site to `dist/`. There is no custom Node server, so it can be imported into Bolt from GitHub and published on Bolt hosting.

## Run it locally

```bash
npm install
npm run dev
```

`npm run build` typechecks and writes `dist/`. `npm run preview` serves that folder.

## How a job runs

1. **Read.** PDF pages are rendered in the browser with pdfjs. Photos are resized to JPEG. The images go to a vision model, which returns structured JSON.
2. **Verify.** A second call gets the images again plus the first JSON. It corrects mistakes, marks each item high / medium / low confidence, and lists anything it could not read or that conflicts. Hard features (tight limits, deep small holes, thin walls, odd thread classes, CMM, coatings, and the like) are flagged from that corrected read, with a why and a way to approach them.
3. **Source.** A third call uses the xAI Responses API with the `web_search` tool (`POST https://api.x.ai/v1/responses`) to look up each tool and the stock on McMaster-Carr, MSC Direct, or Haas Tooling. A link is shown as an exact product page only when the URL is on one of those hosts, looks like a product page, and was actually cited by the search. Anything else becomes a labeled search link:

   - `https://www.mcmaster.com/<url-encoded spec>`
   - `https://www.mscdirect.com/browse/tn?searchterm=<spec>`
   - `https://www.haastooling.com/search?q=<spec>`

The drawing stays in a side panel on a wide screen and in a corner thumbnail on a phone. Tap it to pan the sheet.

## API key

The default model is `grok-4`. Change it in Settings. The key is saved only in this browser's `localStorage` and is sent only to `api.x.ai`.

Do not put the key in a `VITE_` variable or in Bolt's environment. Those values are compiled into the public JavaScript.

With no key, open **Open the sample job**. That packet is labeled DEMO. It is a sample flange adapter (FA-4417), not a reading of an uploaded file. One tooling row points at a real Haas Tooling page for a 1/2 inch 3-flute carbide end mill (`03-0393`). Every other demo link is a catalog search.

## CORS

Checked 20 Nov 2026 from this environment. Preflight `OPTIONS` and unauthenticated `POST` to both `https://api.x.ai/v1/chat/completions` and `https://api.x.ai/v1/responses` return `access-control-allow-origin: *`, and the requested method and headers are allowed. The app calls xAI directly from the browser. No Supabase function or other proxy is required.

If a locked-down network blocks that call, set **API base URL** in Settings to an HTTPS proxy you control. The app appends `/chat/completions` and `/responses`.

## Bolt

Nothing has to be configured in Bolt for a published demo. After the site is live, each machinist opens Settings and pastes their own xAI key.

Build command: `npm install && npm run build`. Publish the `dist/` folder.

Screenshots of the upload screen and the demo job, at desktop and phone width, are in `docs/screenshots/`.
