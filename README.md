# ScanIt

A customizable QR code generator. Choose what the code should do, style it until it looks like
it belongs to you, and export it — with a live check that it still actually scans.

**[scanit-mocha.vercel.app](https://scanit-mocha.vercel.app)**

Everything runs in the browser. Nothing you type — a Wi-Fi password, a phone number, a contact
card — is ever sent to a server, because there is no server.

---

## Eight things a code can do

The **Content** tab decides what happens when someone scans. Each type is encoded into the format
scanners actually expect, with the delimiter escaping those formats require, so a password
containing `;` or a name containing `,` doesn't quietly corrupt the payload.

| Type | What the scanner does | Fields |
|---|---|---|
| **Link** | Opens a URL | Destination |
| **Text** | Shows plain text | Free text |
| **Wi-Fi** | Offers to join the network | SSID, security (WPA/WEP/open), password, hidden flag |
| **Contact** | Offers to save a contact | Name, org, title, phone, email, website, address |
| **Email** | Opens a pre-filled draft | To, subject, body |
| **SMS** | Opens a pre-filled message | Number, message |
| **Phone** | Starts a call | Number |
| **Location** | Opens a map pin | Latitude, longitude |

Wi-Fi and Contact are the ones worth knowing about — they save guests typing a long password, and
turn a business card into a one-scan save.

## Design

Eight presets get you a finished look in one click: **Classic, Midnight, Sunset, Forest, Ocean,
Inverted, Candy, Ember**. Every preset is a starting point, not a lock — change anything after.

**Shapes**

- **Dots** — square, rounded, dots, classy, diamond
- **Eye frame** — square, rounded, circle, leaf
- **Eye centre** — square, rounded, circle, leaf

The three eyes are styled independently of the body, so you can pair circular eyes with square
dots, or a leaf frame with a round centre. That's 80 shape combinations before color.

**Color**

- Solid, linear gradient (any angle 0–360°), or radial gradient
- Eyes can take their own colors, separate from the body
- Any background color, or fully transparent for overlaying on artwork

**Fine control**

- **Dot size**, 50–100% — tighten dots into separated points or let them merge into solid runs
- **Quiet zone**, 0–8 modules — the margin scanners need to find the code at all

## Logos

Drop in a PNG, JPEG, SVG, WebP, or GIF and it sits in the centre.

- **Size**, 10–35% of the code
- **Padding** between the logo and the surrounding modules
- **Circular crop** for round marks
- **Clear modules behind logo** — punch a clean hole rather than covering dots

Adding a logo raises error correction to **H** automatically, because that's what makes a centre
logo survive at all.

## It tells you whether it actually scans

This is the part most generators leave out. After every change, the rendered code is rasterised
and **decoded back** using the browser's `BarcodeDetector`. The badge under the preview says
whether the design you're looking at still reads:

> ● **Verified — decodes correctly**

If a color change or an oversized logo breaks it, you find out immediately rather than after
printing 500 flyers. Chrome, Edge, and Android support the check; Firefox and Safari say the
auto-check is unavailable and fall back to the written advice below.

Separately, a **Before you print** panel covers what a clean decode on a bright screen can't tell
you — how the code will hold up on paper, at distance, in dim light:

- Contrast between dots and background, with the measured ratio
- Light-on-dark designs, which some older scanners reject
- Logo coverage against a size budget for the current error-correction level
- A quiet zone too small for scanners to lock onto
- Dots shrunk small enough to lose definition in print

When the decode check fails, that panel switches to **Likely causes** — the same list, reframed as
the things to go fix.

**Error correction** is exposed directly (L 7% · M 15% · Q 25% · H 30%). Higher levels survive more
damage and bigger logos, at the cost of a denser code.

## Export

- **PNG** at 256, 512, 1024, or 2048 px
- **SVG** — resolution-independent, the right choice for print
- **Copy image** straight to the clipboard

Filenames are derived from the content, so a batch of codes doesn't land in your downloads folder
as `qrcode (3).png`.

---

## How the styling is possible

[`lib/qr.ts`](lib/qr.ts) uses [`qrcode`](https://github.com/soldair/node-qrcode) only to compute
the module matrix (`QRCode.create`), then renders the SVG itself. That split is the whole trick —
the library's own renderers only draw plain black squares.

Body paths use **neighbour-aware corner rounding**: a module rounds a corner only where it isn't
touching an adjacent module, so runs of dots read as one continuous shape instead of a row of
separate pills. Finder patterns are excluded from the body pass and drawn separately, which is
what lets the eyes take their own shapes and colors.

Output is in module units with a `viewBox`, so one render is resolution-independent — the PNG
exporter just rasterises it at whatever size you ask for.

### Why the logo budgets aren't the spec numbers

Nominal error-correction rates badly overstate how much of a code a centred logo can cover: the
logo also destroys the central alignment pattern, and small codes have fewer spare codewords to
begin with. A logo at 22% of the code with ECC M looks safe by the spec and does not scan.

The budgets in [`lib/verify.ts`](lib/verify.ts) were instead calibrated by decoding a sweep of
logo sizes across every error-correction level and QR version. Measured limits land closer to
**4–17% of modules** depending on level and code size, and the thresholds are deliberately
conservative — they warn slightly early rather than let a broken code through.
