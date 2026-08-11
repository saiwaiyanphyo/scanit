import QRCode from "qrcode";

export type DotStyle = "square" | "rounded" | "dots" | "classy" | "diamond";
export type EyeFrameStyle = "square" | "rounded" | "circle" | "leaf";
export type EyeBallStyle = "square" | "rounded" | "circle" | "leaf";
export type ErrorLevel = "L" | "M" | "Q" | "H";
export type FillKind = "solid" | "linear" | "radial";

export interface Fill {
  kind: FillKind;
  color: string;
  color2: string;
  /** degrees, only used for linear gradients */
  angle: number;
}

export interface QROptions {
  data: string;
  errorLevel: ErrorLevel;
  /** quiet zone, in modules */
  margin: number;
  dotStyle: DotStyle;
  eyeFrameStyle: EyeFrameStyle;
  eyeBallStyle: EyeBallStyle;
  bodyFill: Fill;
  /** null = inherit body fill */
  eyeFrameFill: Fill | null;
  eyeBallFill: Fill | null;
  background: string;
  transparentBackground: boolean;
  /** 0..1, how much of the module the dot occupies */
  dotScale: number;
  logo: string | null;
  /** fraction of the QR width the logo occupies, 0..0.4 */
  logoSize: number;
  logoMargin: number;
  logoRounded: boolean;
  /** punch a hole in the modules behind the logo */
  logoExcavate: boolean;
}

export interface Matrix {
  size: number;
  get(x: number, y: number): boolean;
}

export function buildMatrix(data: string, errorLevel: ErrorLevel): Matrix {
  const qr = QRCode.create(data, { errorCorrectionLevel: errorLevel });
  const size = qr.modules.size;
  const bits = qr.modules.data;
  return {
    size,
    get: (x, y) =>
      x >= 0 && y >= 0 && x < size && y < size && !!bits[y * size + x],
  };
}

const FINDER = 7;

function isFinder(x: number, y: number, size: number): boolean {
  return (
    (x < FINDER && y < FINDER) ||
    (x >= size - FINDER && y < FINDER) ||
    (x < FINDER && y >= size - FINDER)
  );
}

/**
 * Rounded rect path where each corner is only rounded when it isn't
 * touching a neighbouring module — this is what makes adjacent dots
 * read as one continuous, connected shape rather than a bag of pills.
 */
function roundedModule(
  x: number,
  y: number,
  s: number,
  r: number,
  tl: boolean,
  tr: boolean,
  br: boolean,
  bl: boolean,
): string {
  const x2 = x + s;
  const y2 = y + s;
  let d = `M ${x + (tl ? r : 0)} ${y}`;
  d += ` H ${x2 - (tr ? r : 0)}`;
  if (tr) d += ` A ${r} ${r} 0 0 1 ${x2} ${y + r}`;
  d += ` V ${y2 - (br ? r : 0)}`;
  if (br) d += ` A ${r} ${r} 0 0 1 ${x2 - r} ${y2}`;
  d += ` H ${x + (bl ? r : 0)}`;
  if (bl) d += ` A ${r} ${r} 0 0 1 ${x} ${y2 - r}`;
  d += ` V ${y + (tl ? r : 0)}`;
  if (tl) d += ` A ${r} ${r} 0 0 1 ${x + r} ${y}`;
  return d + " Z";
}

function circleModule(cx: number, cy: number, r: number): string {
  return `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0 Z`;
}

function diamondModule(x: number, y: number, s: number): string {
  const h = s / 2;
  return `M ${x + h} ${y} L ${x + s} ${y + h} L ${x + h} ${y + s} L ${x} ${y + h} Z`;
}

interface Excavation {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

function buildBodyPath(
  m: Matrix,
  style: DotStyle,
  scale: number,
  offset: number,
  excavate: Excavation | null,
): string {
  const parts: string[] = [];
  const size = m.size;

  const skip = (x: number, y: number) =>
    excavate !== null &&
    x >= excavate.x0 &&
    x <= excavate.x1 &&
    y >= excavate.y0 &&
    y <= excavate.y1;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!m.get(x, y) || isFinder(x, y, size) || skip(x, y)) continue;

      const px = x + offset;
      const py = y + offset;

      if (style === "square") {
        parts.push(`M ${px} ${py} h 1 v 1 h -1 Z`);
        continue;
      }

      if (style === "dots") {
        parts.push(circleModule(px + 0.5, py + 0.5, (scale * 0.5) / 1));
        continue;
      }

      if (style === "diamond") {
        const inset = (1 - scale) / 2;
        parts.push(diamondModule(px + inset, py + inset, scale));
        continue;
      }

      // Neighbour-aware rounding for `rounded` and `classy`.
      const top = m.get(x, y - 1) && !isFinder(x, y - 1, size) && !skip(x, y - 1);
      const right = m.get(x + 1, y) && !isFinder(x + 1, y, size) && !skip(x + 1, y);
      const bottom = m.get(x, y + 1) && !isFinder(x, y + 1, size) && !skip(x, y + 1);
      const left = m.get(x - 1, y) && !isFinder(x - 1, y, size) && !skip(x - 1, y);

      if (style === "classy") {
        // Leaf: only the two "outer" corners get rounded, always.
        parts.push(roundedModule(px, py, 1, 0.5, !top && !left, false, !bottom && !right, false));
        continue;
      }

      const r = Math.min(0.5, scale * 0.5);
      parts.push(
        roundedModule(px, py, 1, r, !top && !left, !top && !right, !bottom && !right, !bottom && !left),
      );
    }
  }
  return parts.join(" ");
}

function eyeFramePath(x: number, y: number, style: EyeFrameStyle): string {
  // 7x7 outer ring, 1 module thick.
  const outer = (r: number) => roundedModule(x, y, 7, r, true, true, true, true);
  const inner = (r: number) => roundedModule(x + 1, y + 1, 5, r, true, true, true, true);

  switch (style) {
    case "circle":
      return `${circleModule(x + 3.5, y + 3.5, 3.5)} ${circleModule(x + 3.5, y + 3.5, 2.5)}`;
    case "rounded":
      return `${outer(2)} ${inner(1.4)}`;
    case "leaf": {
      const o = roundedModule(x, y, 7, 3, true, false, true, false);
      const i = roundedModule(x + 1, y + 1, 5, 2.2, true, false, true, false);
      return `${o} ${i}`;
    }
    default:
      return `${outer(0)} ${inner(0)}`;
  }
}

function eyeBallPath(x: number, y: number, style: EyeBallStyle): string {
  const bx = x + 2;
  const by = y + 2;
  switch (style) {
    case "circle":
      return circleModule(bx + 1.5, by + 1.5, 1.5);
    case "rounded":
      return roundedModule(bx, by, 3, 1, true, true, true, true);
    case "leaf":
      return roundedModule(bx, by, 3, 1.5, true, false, true, false);
    default:
      return roundedModule(bx, by, 3, 0, false, false, false, false);
  }
}

function fillDef(fill: Fill, id: string, extent: number): { def: string; ref: string } {
  if (fill.kind === "solid") return { def: "", ref: fill.color };

  if (fill.kind === "radial") {
    return {
      def: `<radialGradient id="${id}" cx="50%" cy="50%" r="70%"><stop offset="0%" stop-color="${fill.color}"/><stop offset="100%" stop-color="${fill.color2}"/></radialGradient>`,
      ref: `url(#${id})`,
    };
  }

  const rad = (fill.angle * Math.PI) / 180;
  const cx = extent / 2;
  const cy = extent / 2;
  const half = extent / 2;
  const x1 = cx - Math.cos(rad) * half;
  const y1 = cy - Math.sin(rad) * half;
  const x2 = cx + Math.cos(rad) * half;
  const y2 = cy + Math.sin(rad) * half;

  return {
    def: `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${x1.toFixed(3)}" y1="${y1.toFixed(3)}" x2="${x2.toFixed(3)}" y2="${y2.toFixed(3)}"><stop offset="0%" stop-color="${fill.color}"/><stop offset="100%" stop-color="${fill.color2}"/></linearGradient>`,
    ref: `url(#${id})`,
  };
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export interface QRResult {
  svg: string;
  /** modules per side, excluding the quiet zone */
  moduleCount: number;
  /** share of the code's modules hidden behind the logo, 0..1 */
  excavatedFraction: number;
}

/**
 * Renders to an SVG string in module units, with a viewBox — the consumer
 * decides the pixel size. Keeps export crisp at any resolution.
 */
export function renderQR(opts: QROptions): QRResult {
  const m = buildMatrix(opts.data, opts.errorLevel);
  const offset = opts.margin;
  const extent = m.size + opts.margin * 2;

  const bodyFill = fillDef(opts.bodyFill, "qr-body", extent);
  const frameFill = fillDef(opts.eyeFrameFill ?? opts.bodyFill, "qr-frame", extent);
  const ballFill = fillDef(opts.eyeBallFill ?? opts.bodyFill, "qr-ball", extent);

  // The logo obscures modules whether or not we excavate them — the covered
  // area is what matters for scannability, so measure it either way.
  const logoSpan = opts.logo ? opts.logoSize * extent + opts.logoMargin * 2 : 0;
  const excavatedFraction = opts.logo ? Math.min(1, (logoSpan * logoSpan) / (m.size * m.size)) : 0;

  let excavate: Excavation | null = null;
  if (opts.logo && opts.logoExcavate) {
    const c = extent / 2;
    excavate = {
      x0: Math.floor(c - logoSpan / 2) - offset,
      y0: Math.floor(c - logoSpan / 2) - offset,
      x1: Math.ceil(c + logoSpan / 2) - offset - 1,
      y1: Math.ceil(c + logoSpan / 2) - offset - 1,
    };
  }

  const body = buildBodyPath(m, opts.dotStyle, opts.dotScale, offset, excavate);

  const eyes: [number, number][] = [
    [offset, offset],
    [offset + m.size - FINDER, offset],
    [offset, offset + m.size - FINDER],
  ];
  const frames = eyes.map(([x, y]) => eyeFramePath(x, y, opts.eyeFrameStyle)).join(" ");
  const balls = eyes.map(([x, y]) => eyeBallPath(x, y, opts.eyeBallStyle)).join(" ");

  const defs = [bodyFill.def, frameFill.def, ballFill.def].filter(Boolean).join("");

  let logo = "";
  if (opts.logo) {
    const w = opts.logoSize * extent;
    const lx = (extent - w) / 2;
    const pad = opts.logoMargin;
    const plateR = opts.logoRounded ? (w + pad * 2) / 2 : Math.min(0.6, w * 0.12);
    const plate =
      pad > 0 && !opts.transparentBackground
        ? `<rect x="${lx - pad}" y="${lx - pad}" width="${w + pad * 2}" height="${w + pad * 2}" rx="${plateR}" fill="${opts.background}"/>`
        : "";
    const clip = opts.logoRounded
      ? `<clipPath id="qr-logo-clip"><rect x="${lx}" y="${lx}" width="${w}" height="${w}" rx="${w / 2}"/></clipPath>`
      : "";
    logo =
      `${clip ? `<defs>${clip}</defs>` : ""}${plate}` +
      `<image href="${escapeXml(opts.logo)}" x="${lx}" y="${lx}" width="${w}" height="${w}" preserveAspectRatio="xMidYMid meet"${opts.logoRounded ? ' clip-path="url(#qr-logo-clip)"' : ""}/>`;
  }

  const bg = opts.transparentBackground
    ? ""
    : `<rect width="${extent}" height="${extent}" fill="${opts.background}"/>`;

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${extent} ${extent}" shape-rendering="geometricPrecision">`,
    defs ? `<defs>${defs}</defs>` : "",
    bg,
    body ? `<path d="${body}" fill="${bodyFill.ref}"/>` : "",
    `<path d="${frames}" fill="${frameFill.ref}" fill-rule="evenodd"/>`,
    `<path d="${balls}" fill="${ballFill.ref}"/>`,
    logo,
    `</svg>`,
  ]
    .filter(Boolean)
    .join("");

  return { svg, moduleCount: m.size, excavatedFraction };
}

/** Convenience wrapper for callers that only need the markup. */
export function renderSVG(opts: QROptions): string {
  return renderQR(opts).svg;
}

/** Rasterise an SVG string to a PNG data URL at the given pixel size. */
export function svgToPng(svg: string, size: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Canvas not available"));
        return;
      }
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not rasterise the QR code"));
    };
    img.src = url;
  });
}
