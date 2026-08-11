"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { encodePayload, emptyPayload, type PayloadState } from "@/lib/payload";
import { defaultStyle, type StyleOptions } from "@/lib/presets";
import { renderQR, svgToPng } from "@/lib/qr";
import { logoTooLarge, verifyScannable, type VerifyStatus } from "@/lib/verify";
import { Header } from "./Header";
import { Clipboard, Download } from "./Icons";
import { PayloadForm } from "./PayloadForm";
import { Advisory, QRCard, StatusBadge } from "./Preview";
import { StylePanel } from "./StylePanel";
import { Button, SegmentedTrack } from "./ui";

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
 * dim light, and older scanners.
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

export function QRStudio() {
  const [payload, setPayload] = useState<PayloadState>(emptyPayload);
  const [style, setStyle] = useState<StyleOptions>(defaultStyle);
  const [logo, setLogo] = useState<string | null>(null);
  const [exportSize, setExportSize] = useState(1024);
  const [tab, setTab] = useState<"content" | "design">("content");
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
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

  const tips = useMemo(
    () => checkScannability(style, moduleCount, excavatedFraction),
    [style, moduleCount, excavatedFraction],
  );

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

  const applyPreset = useCallback(
    (next: StyleOptions) => setStyle(logo ? { ...next, errorLevel: "H" } : next),
    [logo],
  );

  const reset = useCallback(() => {
    setStyle(defaultStyle);
    setLogo(null);
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

  const pngBlob = useCallback(async () => {
    if (!svg) return null;
    const dataUrl = await svgToPng(svg, exportSize);
    return (await fetch(dataUrl)).blob();
  }, [svg, exportSize]);

  const copyPng = useCallback(async () => {
    try {
      const blob = await pngBlob();
      if (!blob) return;
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard image writes are unsupported in some browsers; download
      // remains available as a fallback.
    }
  }, [pngBlob]);

  const share = useCallback(async () => {
    try {
      const blob = await pngBlob();
      if (!blob) return;
      const file = new File([blob], `${filename}.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "QR code" });
      }
    } catch {
      // User dismissed the share sheet, or the platform refused the payload.
    }
  }, [pngBlob, filename]);

  const heading =
    tab === "content"
      ? { title: "Configure your QR code", sub: "Choose content type, enter your data, and export." }
      : { title: "Customize appearance", sub: "Style shapes, colors, logo, and error correction." };

  return (
    <div className="flex min-h-screen flex-col">
      <Header onReset={reset} onShare={share} canShare={canShare} />

      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Preview */}
        <div className="border-b border-[var(--border)] bg-[var(--qr-preview-bg)] p-6 lg:w-[42%] lg:max-w-[560px] lg:border-r lg:border-b-0 lg:p-10">
          <div className="flex flex-col items-center gap-5 lg:sticky lg:top-10">
            <QRCard
              svg={svg}
              transparent={style.transparentBackground}
              background={style.background}
              message={error}
            />

            {svg ? (
              <>
                <p className="text-xs text-[var(--text-secondary)]">
                  {data.length} chars · {moduleCount}×{moduleCount} · Level {style.errorLevel}
                </p>
                <StatusBadge status={verified} />
              </>
            ) : null}

            {svg && tips.length > 0 ? (
              <div className="w-full max-w-[360px]">
                <Advisory
                  tone={verified === "fail" ? "error" : "amber"}
                  title={verified === "fail" ? "Likely causes" : "Before you print"}
                  items={tips}
                />
              </div>
            ) : null}
          </div>
        </div>

        {/* Controls */}
        <div className="flex-1 px-4 py-6 pb-16 sm:px-8 lg:px-10 lg:py-10">
          <div className="mx-auto max-w-[720px] space-y-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{heading.title}</h1>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{heading.sub}</p>
            </div>

            <SegmentedTrack
              value={tab}
              options={[
                { value: "content" as const, label: "Content" },
                { value: "design" as const, label: "Design" },
              ]}
              onChange={setTab}
            />

            {tab === "content" ? (
              <>
                <PayloadForm value={payload} onChange={setPayload} />

                <div className="space-y-3 border-t border-[var(--border)] pt-6">
                  <SegmentedTrack
                    label="Export"
                    help="Pixel size of the exported PNG. SVG is resolution-independent."
                    value={String(exportSize)}
                    options={EXPORT_SIZES.map((s) => ({ value: String(s), label: String(s) }))}
                    onChange={(v) => setExportSize(Number(v))}
                  />
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <Button variant="primary" disabled={!svg} onClick={() => download("png")}>
                      <Download className="h-4 w-4" />
                      PNG
                    </Button>
                    <Button disabled={!svg} onClick={() => download("svg")}>
                      <Download className="h-4 w-4" />
                      SVG
                    </Button>
                    <Button disabled={!svg} onClick={copyPng}>
                      <Clipboard className="h-4 w-4" />
                      {copied ? "Copied" : "Copy"}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <StylePanel
                style={style}
                onChange={setStyle}
                logo={logo}
                onLogoChange={handleLogoChange}
                onPreset={applyPreset}
              />
            )}
          </div>
        </div>
      </div>

      <footer className="border-t border-[var(--border)] px-4 py-4 text-center text-xs text-[var(--text-secondary)]">
        Built with ❤️ by Sai Wai Yan &amp; Claude
      </footer>
    </div>
  );
}
