# ScanIt

A customizable QR code generator. Pick what the code should do, style it, and export it —
everything runs client-side, so nothing you type is ever sent to a server.

## What it does

**Content types** — link, plain text, Wi-Fi join, vCard contact, email, SMS, phone, geo location.
Each is encoded into the format scanners actually expect (`WIFI:`, `BEGIN:VCARD`, `mailto:`, …),
with the delimiter escaping those formats require.

**Styling** — five dot shapes, four eye-frame and eye-centre shapes, solid/linear/radial fills,
separate colors for the eyes, adjustable dot size and quiet zone, transparent backgrounds, and a
centre logo with optional circular crop and module excavation. Eight presets to start from.

**Live scan verification** — after every change, the rendered code is rasterised and decoded back
using the browser's `BarcodeDetector`. If a design breaks the code, the badge under the preview
says so immediately instead of leaving you to find out at the printer. Browsers without
`BarcodeDetector` (Firefox, Safari) fall back to the heuristic advice and say the check is
unavailable.

**Export** — PNG at 256–2048px, SVG at any resolution, or copy straight to the clipboard.

## Running locally

```bash
npm install
```

```bash
npm run dev
```

Then open http://localhost:3000.

## Deploying to Vercel

The app is a stock Next.js project with no server-side dependencies, environment variables, or
external services, so it deploys as-is.

```bash
npx vercel
```

Or push the repo to GitHub and import it at [vercel.com/new](https://vercel.com/new) — the
framework preset, build command, and output directory are all detected automatically.

## How the rendering works

[`lib/qr.ts`](lib/qr.ts) uses [`qrcode`](https://github.com/soldair/node-qrcode) only to compute
the module matrix (`QRCode.create`), then renders the SVG itself. That split is what makes the
styling possible — the library's own renderers only draw plain black squares.

The body path is built with neighbour-aware corner rounding: a module only rounds a corner that
isn't touching an adjacent module, so runs of dots read as one continuous shape instead of a row
of separate pills. Finder patterns are excluded from the body pass and drawn separately so the
eyes can take their own shapes and colors.

Output is in module units with a `viewBox`, so a single render is resolution-independent — the
PNG exporter just rasterises it at whatever size you pick.

## A note on logo sizes

Nominal error-correction rates (H recovers ~30%) badly overstate how much of a code a centred
logo can cover, because the logo also destroys the central alignment pattern, and small codes
have fewer spare codewords. The budgets in [`lib/verify.ts`](lib/verify.ts) were calibrated by
decoding a sweep of logo sizes across error-correction levels and QR versions rather than taken
from the spec — measured limits land closer to 4–17% of modules depending on level and code size.

Adding a logo raises error correction to H automatically. The live decode check is still the
authoritative signal; the written advice covers what decoding on a clean screen can't tell you
about print, distance, and dim light.
