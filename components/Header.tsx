"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/lib/theme";
import { Dots, Info, Moon, QrMark, Reset, Share, Sun } from "./Icons";

function ThemeToggle() {
  const { resolved, select, ready } = useTheme();

  return (
    <div
      className="flex items-center gap-0.5 rounded-[0.625rem] bg-[var(--bg-muted)] p-1"
      role="group"
      aria-label="Color theme"
    >
      {(["light", "dark"] as const).map((mode) => {
        const Icon = mode === "light" ? Sun : Moon;
        // Before hydration `ready` is false; render both inactive so the
        // markup can't disagree with the pre-paint script.
        const active = ready && resolved === mode;
        return (
          <button
            key={mode}
            type="button"
            aria-pressed={active}
            aria-label={`${mode === "light" ? "Light" : "Dark"} mode`}
            onClick={() => select(mode)}
            className={`focusable rounded-lg p-1.5 transition-colors ${
              active
                ? "bg-[var(--bg-surface)] text-[var(--text)] shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text)]"
            }`}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}

function OverflowMenu({ onReset, onShare, canShare }: { onReset: () => void; onShare: () => void; canShare: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const item =
    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-[var(--text)] transition-colors hover:bg-[var(--bg-muted)]";

  return (
    <div ref={ref} className="relative sm:hidden">
      <button
        type="button"
        aria-label="More options"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="focusable rounded-lg p-2 text-[var(--text-secondary)] transition-colors hover:text-[var(--text)]"
      >
        <Dots className="h-5 w-5" />
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-1 w-52 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-1.5 shadow-lg">
          <button
            type="button"
            className={item}
            onClick={() => {
              onReset();
              setOpen(false);
            }}
          >
            <Reset className="h-4 w-4 text-[var(--text-secondary)]" />
            Reset design
          </button>
          {canShare && (
            <button
              type="button"
              className={item}
              onClick={() => {
                onShare();
                setOpen(false);
              }}
            >
              <Share className="h-4 w-4 text-[var(--text-secondary)]" />
              Share code
            </button>
          )}
          <a
            className={item}
            href="https://github.com/saiwaiyanphyo/scanit"
            target="_blank"
            rel="noreferrer"
            onClick={() => setOpen(false)}
          >
            <Info className="h-4 w-4 text-[var(--text-secondary)]" />
            About ScanIt
          </a>
        </div>
      )}
    </div>
  );
}

export function Header({
  onReset,
  onShare,
  canShare,
}: {
  onReset: () => void;
  onShare: () => void;
  canShare: boolean;
}) {
  return (
    <header className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3.5 sm:px-6">
      <div className="flex items-center gap-2">
        <QrMark className="h-5 w-5 text-[var(--bg-accent)]" />
        <span className="text-lg font-bold tracking-tight">
          Scan<span className="text-[var(--bg-accent)]">It</span>
        </span>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <button
          type="button"
          onClick={onReset}
          className="focusable hidden items-center gap-1.5 rounded-[0.625rem] border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-sm font-medium transition-colors hover:opacity-80 sm:inline-flex"
        >
          <Reset className="h-4 w-4 text-[var(--text-secondary)]" />
          Reset
        </button>
        <OverflowMenu onReset={onReset} onShare={onShare} canShare={canShare} />
      </div>
    </header>
  );
}
