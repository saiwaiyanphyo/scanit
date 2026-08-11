"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { encodePayload, emptyPayload, type PayloadState } from "@/lib/payload";
import { defaultStyle, presets, type StyleOptions } from "@/lib/presets";
import { renderQR, svgToPng } from "@/lib/qr";
import { logoTooLarge, verifyScannable, type VerifyStatus } from "@/lib/verify";
import { PayloadForm } from "./PayloadForm";
import { StylePanel } from "./StylePanel";
import { Section, Segmented } from "./ui";

const EXPORT_SIZES = [256, 512, 1024, 2048];

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminance(hex: string): number | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a: string, b: string): number | null {
  const la = luminance(a);
  const lb = luminance(b);
  if (la === null || lb === null) return null;
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Advice about conditions the live decode check can't see: print, distance,
 * dim light, and older scanners. The decode check answers "does this work
 * right now"; these answer "will it still work on a poster".
 */
function checkScannability(
  style: StyleOptions,
  moduleCount: number,
  excavatedFraction: number,
): string[] {
  const tips: string[] = [];

  if (!style.transparentBackground) {
    const colors =
      style.bodyFill.kind === "solid"
        ? [style.bodyFill.color]
        : [style.bodyFill.color, style.bodyFill.color2];
    const worst = colors
      .map((c) => contrastRatio(c, style.background))
      .filter((r): r is number => r !== null)
      .reduce((min, r) => Math.min(min, r), Infinity);
    // 2.5:1 is roughly where decoding starts to get unreliable off-screen.
    // Legitimate bright palettes sit around 2.8:1, so don't cry wolf there.
    if (worst !== Infinity && worst < 2.5) {
      tips.push(
        `Contrast between the dots and the background is only ${worst.toFixed(1)}:1 — darken the dots before printing.`,
      );
    }
    const bodyLum = luminance(style.bodyFill.color);
    const bgLum = luminance(style.background);
    if (bodyLum !== null && bgLum !== null && bodyLum > bgLum) {
      tips.push("Light-on-dark reads fine on phones, but some older scanners only accept dark-on-light.");
    }
  }

  if (excavatedFraction > 0 && logoTooLarge(style.errorLevel, moduleCount, excavatedFraction)) {
    tips.push(
      style.errorLevel === "H"
        ? `The logo covers about ${Math.round(excavatedFraction * 100)}% of the code — shrink it, or add more content so the code gets denser.`
        : `The logo covers about ${Math.round(excavatedFraction * 100)}% of the code — raise error correction to H, or shrink it.`,
    );
  }

  if (style.margin < 2) {
    tips.push("A quiet zone under 2 modules can stop scanners from finding the code at all.");
  }

  if (style.dotScale < 0.7 && style.dotStyle !== "square") {
    tips.push("Very small dots lose definition at a distance or in print — test before committing.");
  }

  return tips;
}

function ScanBadge({ status }: { status: VerifyStatus }) {
  if (status === "idle") return null;

  const styles: Record<Exclude<VerifyStatus, "idle">, { cls: string; text: string }> = {
    checking: {
      cls: "border-[var(--color-line)] text-[var(--color-muted)]",
      text: "Checking scannability…",
    },
    pass: {
      cls: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
      text: "Verified — decodes correctly",
    },
    fail: {
      cls: "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-400",
      text: "Failed to decode — adjust the design",
    },
    unsupported: {
      cls: "border-[var(--color-line)] text-[var(--color-muted)]",
      text: "Auto-check unavailable in this browser",
    },
  };

  const { cls, text } = styles[status];
  return (
    <div
      role="status"
      className={`mx-auto flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${cls}`}
    >
      <span aria-hidden className="text-[10px]">
        {status === "pass" ? "●" : status === "fail" ? "▲" : "○"}
      </span>
      {text}
    </div>
  );
}

export function QRStudio() {
  const [payload, setPayload] = useState<PayloadState>(emptyPayload);
  const [style, setStyle] = useState<StyleOptions>(defaultStyle);
  const [logo, setLogo] = useState<string | null>(null);
  const [exportSize, setExportSize] = useState(1024);
  const [tab, setTab] = useState<"content" | "design">("content");
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (copyTimer.current) clearTimeout(copyTimer.current);
  }, []);

  const data = useMemo(() => encodePayload(payload), [payload]);

  const { svg, moduleCount, excavatedFraction, error } = useMemo(() => {
    const empty = { svg: null, moduleCount: 0, excavatedFraction: 0 };
    if (!data) return { ...empty, error: null as string | null };
    try {
      return { ...renderQR({ ...style, data, logo }), error: null };
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not generate this QR code.";
      return {
        ...empty,
        error: /too long|big|overflow|code length/i.test(message)
          ? "That's too much data for a single QR code. Shorten it, or lower the error correction level."
          : message,
      };
    }
  }, [data, style, logo]);

  const warnings = useMemo(
    () => checkScannability(style, moduleCount, excavatedFraction),
    [style, moduleCount, excavatedFraction],
  );

  // Decode the rendered code back to confirm it still reads. Debounced so
  // dragging a slider doesn't queue up a detector run per frame.
  const [verified, setVerified] = useState<VerifyStatus>("idle");
  useEffect(() => {
    if (!svg) {
      setVerified("idle");
      return;
    }
    let cancelled = false;
    setVerified("checking");
    const t = setTimeout(() => {
      verifyScannable(svg, data).then((status) => {
        if (!cancelled) setVerified(status);
      });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [svg, data]);

  const filename = useMemo(() => {
    const base = payload.kind === "url" ? payload.url.replace(/^https?:\/\//, "") : payload.kind;
    return (base || "qr").replace(/[^a-z0-9._-]+/gi, "-").slice(0, 40).replace(/^-|-$/g, "") || "qr";
  }, [payload]);

  // A centred logo eats far more redundancy than the nominal ECC rates imply,
  // so adopting one bumps error correction to H unless it's already high.
  const handleLogoChange = useCallback((next: string | null) => {
    setLogo(next);
    if (next) {
      setStyle((s) => (s.errorLevel === "L" || s.errorLevel === "M" ? { ...s, errorLevel: "H" } : s));
    }
  }, []);

  const download = useCallback(
    async (format: "png" | "svg") => {
      if (!svg) return;
      const a = document.createElement("a");
      if (format === "svg") {
        a.href = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
        a.download = `${filename}.svg`;
      } else {
        a.href = await svgToPng(svg, exportSize);
        a.download = `${filename}-${exportSize}.png`;
      }
      a.click();
    },
    [svg, exportSize, filename],
  );

  const copyPng = useCallback(async () => {
    if (!svg) return;
    try {
      const dataUrl = await svgToPng(svg, exportSize);
      const blob = await (await fetch(dataUrl)).blob();
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard image writes are unsupported in some browsers; the download
      // button is always available as a fallback.
    }
  }, [svg, exportSize]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Scan<span className="text-[var(--color-accent)]">It</span>
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Customizable QR codes. Everything runs in your browser — nothing is uploaded.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setStyle(defaultStyle);
            handleLogoChange(null);
          }}
          className="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-xs font-medium text-[var(--color-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]"
        >
          Reset design
        </button>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* Preview */}
        <div className="lg:order-2">
          <div className="lg:sticky lg:top-8 space-y-4">
            <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
              <div className="checkerboard flex aspect-square items-center justify-center overflow-hidden rounded-lg">
                {svg ? (
                  <div
                    className="h-full w-full [&>svg]:h-full [&>svg]:w-full"
                    // The SVG is generated locally from user input by renderSVG,
                    // which escapes every interpolated value.
                    dangerouslySetInnerHTML={{ __html: svg }}
                  />
                ) : (
                  <p className="max-w-[240px] px-6 text-center text-sm text-[var(--color-muted)]">
                    {error ?? "Fill in the content on the left to generate your code."}
                  </p>
                )}
              </div>

              {data && !error ? (
                <div className="mt-3 space-y-2">
                  <p className="text-center text-xs text-[var(--color-muted)]">
                    {data.length} characters · {moduleCount}×{moduleCount} modules · level{" "}
                    {style.errorLevel}
                  </p>
                  <ScanBadge status={verified} />
                </div>
              ) : null}
            </div>

            {warnings.length > 0 && svg ? (
              <div
                className={`rounded-xl border p-3 ${
                  verified === "fail"
                    ? "border-red-500/30 bg-red-500/10"
                    : "border-amber-500/30 bg-amber-500/10"
                }`}
              >
                <p
                  className={`mb-1 text-xs font-semibold ${
                    verified === "fail"
                      ? "text-red-700 dark:text-red-400"
                      : "text-amber-700 dark:text-amber-400"
                  }`}
                >
                  {verified === "fail" ? "Likely causes" : "Before you print"}
                </p>
                <ul
                  className={`space-y-1 text-xs ${
                    verified === "fail"
                      ? "text-red-800 dark:text-red-200/90"
                      : "text-amber-800 dark:text-amber-200/90"
                  }`}
                >
                  {warnings.map((w) => (
                    <li key={w}>· {w}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <Section title="Export">
              <Segmented
                label="PNG size"
                value={String(exportSize)}
                options={EXPORT_SIZES.map((s) => ({ value: String(s), label: `${s}` }))}
                onChange={(v) => setExportSize(Number(v))}
              />
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={!svg}
                  onClick={() => download("png")}
                  className="rounded-lg bg-[var(--color-accent)] px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Download PNG
                </button>
                <button
                  type="button"
                  disabled={!svg}
                  onClick={() => download("svg")}
                  className="rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm font-medium transition-colors hover:bg-[var(--color-canvas)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Download SVG
                </button>
              </div>
              <button
                type="button"
                disabled={!svg}
                onClick={copyPng}
                className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm font-medium transition-colors hover:bg-[var(--color-canvas)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {copied ? "Copied to clipboard" : "Copy image"}
              </button>
            </Section>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-4 lg:order-1">
          <Segmented
            value={tab}
            options={[
              { value: "content" as const, label: "Content" },
              { value: "design" as const, label: "Design" },
            ]}
            onChange={setTab}
          />

          {tab === "content" ? (
            <Section title="What should this code do?">
              <PayloadForm value={payload} onChange={setPayload} />
            </Section>
          ) : (
            <>
              <Section title="Presets">
                <div className="grid grid-cols-4 gap-2">
                  {presets.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      title={p.name}
                      onClick={() =>
                        setStyle(
                          // Keep the high error correction a logo depends on.
                          logo ? { ...p.style, errorLevel: "H" } : p.style,
                        )
                      }
                      className="group flex flex-col items-center gap-1.5 rounded-lg border border-[var(--color-line)] p-2 transition-colors hover:border-[var(--color-accent)]"
                    >
                      <span
                        className="h-8 w-8 rounded-md border border-black/5"
                        style={{
                          background: `linear-gradient(135deg, ${p.swatch[0]}, ${p.swatch[1]})`,
                        }}
                      />
                      <span className="text-[10px] font-medium text-[var(--color-muted)] group-hover:text-[var(--color-ink)]">
                        {p.name}
                      </span>
                    </button>
                  ))}
                </div>
              </Section>
              <StylePanel
                style={style}
                onChange={setStyle}
                logo={logo}
                onLogoChange={handleLogoChange}
              />
            </>
          )}
        </div>
      </div>

      <footer className="mt-12 border-t border-[var(--color-line)] pt-6 text-center text-xs text-[var(--color-muted)]">
        Built with Next.js and{" "}
        <a
          href="https://github.com/soldair/node-qrcode"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2 hover:text-[var(--color-ink)]"
        >
          qrcode
        </a>
        . Static codes — no tracking, no redirects, no expiry.
      </footer>
    </main>
  );
}
