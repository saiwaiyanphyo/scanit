"use client";

import { CheckCircle, Info, QrMark, Spinner, XCircle } from "./Icons";
import type { VerifyStatus } from "@/lib/verify";

export function StatusBadge({ status }: { status: VerifyStatus }) {
  if (status === "idle") return null;

  const map = {
    checking: {
      Icon: Spinner,
      text: "Checking scannability…",
      cls: "border-[var(--border)] text-[var(--text-secondary)]",
      spin: true,
    },
    pass: {
      Icon: CheckCircle,
      text: "Verified — decodes correctly",
      cls: "border-transparent bg-[var(--success-bg)] text-[var(--success)]",
      spin: false,
    },
    fail: {
      Icon: XCircle,
      text: "Failed to decode — adjust the design",
      cls: "border-transparent bg-[var(--error-bg)] text-[var(--error)]",
      spin: false,
    },
    unsupported: {
      Icon: Info,
      text: "Auto-check unavailable in this browser",
      cls: "border-[var(--border)] text-[var(--text-secondary)]",
      spin: false,
    },
  }[status];

  return (
    <div
      role="status"
      className={`mx-auto flex w-fit items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${map.cls}`}
    >
      <map.Icon className={`h-3.5 w-3.5 shrink-0 ${map.spin ? "spin" : ""}`} />
      {map.text}
    </div>
  );
}

export function Advisory({ tone, title, items }: { tone: "amber" | "error"; title: string; items: string[] }) {
  if (items.length === 0) return null;
  const color = tone === "amber" ? "var(--amber)" : "var(--error)";
  const bg = tone === "amber" ? "var(--amber-bg)" : "var(--error-bg)";
  return (
    <div className="rounded-xl p-3.5" style={{ background: bg }}>
      <p className="mb-1.5 text-xs font-semibold" style={{ color }}>
        {title}
      </p>
      <ul className="space-y-1.5 text-xs leading-relaxed" style={{ color }}>
        {items.map((t) => (
          <li key={t} className="flex gap-1.5">
            <span aria-hidden>•</span>
            <span className="opacity-90">{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The QR "paper". Its fill is the user's chosen background — never the app
 * theme — so the preview always matches what gets exported. When the
 * background is transparent a checkerboard shows through instead, clipped to
 * the card's rounded corners.
 */
export function QRCard({
  svg,
  transparent,
  background,
  message,
}: {
  svg: string | null;
  transparent: boolean;
  background: string;
  message?: string | null;
}) {
  return (
    <div
      className={`relative aspect-square w-full max-w-[360px] overflow-hidden rounded-[20px] shadow-[0_8px_32px_-4px_rgba(0,0,0,0.07)] ${
        svg && transparent ? "checkerboard" : ""
      }`}
      style={{
        background: svg ? (transparent ? undefined : background) : "var(--bg-surface)",
      }}
    >
      {svg ? (
        <div
          className="absolute inset-0 [&>svg]:h-full [&>svg]:w-full"
          // Generated locally by renderQR, which escapes every interpolated value.
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center">
          <QrMark className="h-12 w-12 text-[var(--text-secondary)] opacity-40" />
          <p className="max-w-[260px] text-sm text-[var(--text-secondary)]">
            {message ?? "Fill in the content to generate your code."}
          </p>
        </div>
      )}
    </div>
  );
}
