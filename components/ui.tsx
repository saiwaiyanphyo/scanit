"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Help } from "./Icons";

/* ---- Help tooltip --------------------------------------------------- */

export function HelpTip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const ref = useRef<HTMLSpanElement>(null);

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

  return (
    <span ref={ref} className="relative inline-flex align-middle">
      <button
        type="button"
        aria-label="More information"
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="focusable rounded-full text-[var(--text-secondary)] transition-colors hover:text-[var(--text)]"
      >
        <Help className="h-3.5 w-3.5" />
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-max max-w-[240px] -translate-x-1/2 rounded-lg bg-[var(--tooltip-bg)] px-2.5 py-2 text-xs leading-snug font-normal tracking-normal normal-case text-[var(--tooltip-text)] shadow-lg"
        >
          {text}
          <span className="absolute top-full left-1/2 -ml-1 border-4 border-transparent border-t-[var(--tooltip-bg)]" />
        </span>
      )}
    </span>
  );
}

export function Label({ children, help }: { children: React.ReactNode; help?: string }) {
  return (
    <span className="label mb-1.5 flex items-center gap-1.5">
      {children}
      {help ? <HelpTip text={help} /> : null}
    </span>
  );
}

/* ---- Layout --------------------------------------------------------- */

export function Section({
  title,
  hint,
  children,
  right,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <section className="space-y-3 border-t border-[var(--border)] pt-6 first:border-0 first:pt-0">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          {hint ? <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{hint}</p> : null}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

/* ---- Inputs --------------------------------------------------------- */

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  help,
  icon,
  trailing,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  help?: string;
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <div>
      <Label help={help}>{label}</Label>
      <div className="relative">
        {icon ? (
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[var(--text-secondary)]">
            {icon}
          </span>
        ) : null}
        <input
          className="field"
          style={{
            paddingLeft: icon ? "2.25rem" : undefined,
            paddingRight: trailing ? "2.5rem" : undefined,
          }}
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
        {trailing ? (
          <span className="absolute top-1/2 right-2 -translate-y-1/2">{trailing}</span>
        ) : null}
      </div>
    </div>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  help,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  help?: string;
}) {
  return (
    <div>
      <Label help={help}>{label}</Label>
      <textarea
        className="field resize-y"
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

/* ---- Pills ---------------------------------------------------------- */

/**
 * Four-option rows fall to a clean 2×2 on phones; five-option rows to 3.
 * Anything already narrow keeps its column count.
 */
function narrowColumns(columns: number): number {
  if (columns <= 3) return columns;
  return columns === 4 ? 2 : 3;
}

export function PillGroup<T extends string>({
  label,
  value,
  options,
  onChange,
  columns,
  mobileColumns,
  help,
}: {
  label?: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  columns: number;
  mobileColumns?: number;
  help?: string;
}) {
  return (
    <div>
      {label ? <Label help={help}>{label}</Label> : null}
      <div
        className="pill-grid gap-2"
        style={
          {
            "--cols": columns,
            "--cols-sm": mobileColumns ?? narrowColumns(columns),
          } as React.CSSProperties
        }
      >
        {options.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(o.value)}
              className={`focusable rounded-[0.625rem] border px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "border-[var(--bg-accent)] bg-[var(--bg-accent-subtle)] text-[var(--bg-accent)]"
                  : "border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text)]"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Solid-accent variant used for the primary Type selector and tabs. */
export function SolidPillGroup<T extends string>({
  value,
  options,
  onChange,
  columns,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  columns: number;
}) {
  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={`focusable rounded-[0.625rem] border px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "border-[var(--bg-accent)] bg-[var(--bg-accent)] text-[var(--text-on-accent)]"
                : "border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text)]"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Inset track, used for the Content/Design tabs and the PNG size row. */
export function SegmentedTrack<T extends string>({
  value,
  options,
  onChange,
  label,
  help,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  label?: string;
  help?: string;
}) {
  return (
    <div>
      {label ? <Label help={help}>{label}</Label> : null}
      <div
        className="grid gap-1 rounded-xl bg-[var(--bg-muted)] p-1"
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        {options.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(o.value)}
              className={`focusable rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-[var(--bg-surface)] text-[var(--text)] shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text)]"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---- Slider, color, toggle ------------------------------------------ */

export function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
  help,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  help?: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="label mb-0 flex items-center gap-1.5">
          {label}
          {help ? <HelpTip text={help} /> : null}
        </span>
        <span className="text-xs font-semibold tabular-nums text-[var(--text)]">
          {format ? format(value) : value}
        </span>
      </div>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          background: `linear-gradient(to right, var(--bg-accent) ${
            ((value - min) / (max - min)) * 100
          }%, var(--bg-muted) ${((value - min) / (max - min)) * 100}%)`,
        }}
      />
    </div>
  );
}

export function ColorField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className={disabled ? "opacity-40" : undefined}>
      <span className="label mb-1.5">{label}</span>
      <div
        className={`flex items-center gap-2 rounded-[0.625rem] border border-[var(--border)] bg-[var(--bg-surface)] px-2 py-1.5 ${
          disabled ? "pointer-events-none" : "focus-within:border-[var(--border-focus)]"
        }`}
      >
        <label
          htmlFor={id}
          className="h-6 w-6 shrink-0 cursor-pointer rounded-md border border-[var(--border)]"
          style={{ background: value }}
        >
          <input
            id={id}
            type="color"
            className="sr-only"
            value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000"}
            onChange={(e) => onChange(e.target.value)}
          />
          <span className="sr-only">{label}</span>
        </label>
        <input
          className="w-full bg-transparent font-mono text-xs tracking-wide text-[var(--text)] uppercase outline-none"
          value={value}
          onChange={(e) => {
            const v = e.target.value.trim();
            if (/^#?[0-9a-fA-F]{0,6}$/.test(v)) onChange(v.startsWith("#") ? v : `#${v}`);
          }}
        />
      </div>
    </div>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="focusable flex w-full items-center justify-between gap-3 rounded-lg py-1 text-left"
    >
      <span className="text-sm">{label}</span>
      <span
        className={`relative inline-block h-5 w-9 shrink-0 rounded-full transition-colors ${
          checked ? "bg-[var(--bg-accent)]" : "bg-[var(--bg-muted)]"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 block h-4 w-4 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-4" : ""
          }`}
        />
      </span>
    </button>
  );
}

/* ---- Buttons -------------------------------------------------------- */

export function Button({
  children,
  onClick,
  variant = "secondary",
  disabled,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`focusable inline-flex items-center justify-center gap-2 rounded-[0.625rem] px-3 py-2.5 text-sm font-medium transition-opacity disabled:cursor-not-allowed disabled:opacity-40 ${
        variant === "primary"
          ? "bg-[var(--bg-accent)] text-[var(--text-on-accent)] hover:opacity-90"
          : "border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text)] hover:opacity-80"
      } ${className ?? ""}`}
    >
      {children}
    </button>
  );
}
