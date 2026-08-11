import type { ErrorLevel } from "./qr";

export type VerifyStatus = "idle" | "checking" | "pass" | "fail" | "unsupported";

interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<{ rawValue: string }[]>;
}

type BarcodeDetectorCtor = new (opts: { formats: string[] }) => BarcodeDetectorLike;

function getDetectorCtor(): BarcodeDetectorCtor | null {
  const ctor = (globalThis as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;
  return typeof ctor === "function" ? ctor : null;
}

let detectorPromise: Promise<BarcodeDetectorLike | null> | null = null;

function getDetector(): Promise<BarcodeDetectorLike | null> {
  if (detectorPromise) return detectorPromise;
  detectorPromise = (async () => {
    const Ctor = getDetectorCtor();
    if (!Ctor) return null;
    try {
      const supported = await (
        Ctor as unknown as { getSupportedFormats?: () => Promise<string[]> }
      ).getSupportedFormats?.();
      if (supported && !supported.includes("qr_code")) return null;
      return new Ctor({ formats: ["qr_code"] });
    } catch {
      return null;
    }
  })();
  return detectorPromise;
}

/**
 * Rasterises the code at a deliberately modest resolution and tries to decode
 * it — a decent proxy for a phone camera reading it off a screen or a page.
 * Composites onto white so transparent backgrounds are judged the way they'd
 * actually be printed.
 */
export async function verifyScannable(
  svg: string,
  expected: string,
  pixelSize = 512,
): Promise<VerifyStatus> {
  const detector = await getDetector();
  if (!detector) return "unsupported";

  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("raster failed"));
      img.src = url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = pixelSize;
    canvas.height = pixelSize;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "unsupported";
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, pixelSize, pixelSize);
    ctx.drawImage(img, 0, 0, pixelSize, pixelSize);

    const found = await detector.detect(canvas);
    return found.some((r) => r.rawValue === expected) ? "pass" : "fail";
  } catch {
    return "unsupported";
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Budgets for the share of modules a logo may cover, as a fraction of the
 * code's total modules. Calibrated by decoding a sweep of logo sizes across
 * QR versions rather than taken from the nominal ECC recovery rates, which
 * are far too optimistic — a centred logo also destroys alignment patterns.
 */
const LOGO_BUDGET: Record<ErrorLevel, number> = {
  L: 0.02,
  M: 0.045,
  Q: 0.065,
  H: 0.085,
};

/**
 * Small codes have little redundancy to spare and only one central alignment
 * pattern, so they tolerate proportionally less coverage than big ones.
 */
function budgetFor(level: ErrorLevel, moduleCount: number): number {
  const scale = moduleCount <= 25 ? 0.6 : moduleCount <= 33 ? 0.8 : 1;
  return LOGO_BUDGET[level] * scale;
}

export function logoTooLarge(
  level: ErrorLevel,
  moduleCount: number,
  excavatedFraction: number,
): boolean {
  return excavatedFraction > budgetFor(level, moduleCount);
}
