"use client";

import { presets, type StyleOptions } from "@/lib/presets";
import type { DotStyle, ErrorLevel, EyeBallStyle, EyeFrameStyle, Fill, FillKind } from "@/lib/qr";
import { Info, Upload } from "./Icons";
import { Button, ColorField, Label, PillGroup, Section, Slider, Toggle } from "./ui";

function FillEditor({ fill, onChange }: { fill: Fill; onChange: (f: Fill) => void }) {
  return (
    <div className="space-y-3">
      <PillGroup<FillKind>
        label="Body"
        columns={3}
        help="Solid uses one color. Gradients blend two across the whole code."
        value={fill.kind}
        options={[
          { value: "solid", label: "Solid" },
          { value: "linear", label: "Linear" },
          { value: "radial", label: "Radial" },
        ]}
        onChange={(kind) => onChange({ ...fill, kind })}
      />
      <div className="grid grid-cols-2 gap-3">
        <ColorField
          label={fill.kind === "solid" ? "Color" : "From"}
          value={fill.color}
          onChange={(color) => onChange({ ...fill, color })}
        />
        <ColorField
          label="To"
          value={fill.color2}
          disabled={fill.kind === "solid"}
          onChange={(color2) => onChange({ ...fill, color2 })}
        />
      </div>
      {fill.kind === "linear" && (
        <Slider
          label="Angle"
          min={0}
          max={360}
          step={5}
          value={fill.angle}
          onChange={(angle) => onChange({ ...fill, angle })}
          format={(v) => `${v}°`}
        />
      )}
    </div>
  );
}

export function StylePanel({
  style,
  onChange,
  logo,
  onLogoChange,
  onPreset,
}: {
  style: StyleOptions;
  onChange: (next: StyleOptions) => void;
  logo: string | null;
  onLogoChange: (logo: string | null) => void;
  onPreset: (s: StyleOptions) => void;
}) {
  const set = <K extends keyof StyleOptions>(key: K, v: StyleOptions[K]) =>
    onChange({ ...style, [key]: v });

  const readLogo = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onLogoChange(String(reader.result));
    reader.readAsDataURL(file);
  };

  const activePreset = presets.find(
    (p) => JSON.stringify(p.style) === JSON.stringify({ ...style, errorLevel: p.style.errorLevel }),
  );

  return (
    <div className="space-y-6">
      <Section title="Presets">
        <div className="grid grid-cols-4 gap-2.5">
          {presets.map((p) => {
            const active = activePreset?.id === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onPreset(p.style)}
                aria-pressed={active}
                className="focusable group flex flex-col items-center gap-1.5"
              >
                <span
                  className={`h-12 w-full rounded-[0.625rem] border-2 transition-colors ${
                    active ? "border-[var(--bg-accent)]" : "border-transparent group-hover:border-[var(--border)]"
                  }`}
                  style={{
                    // Swatch is generated from the preset's real colors, so it
                    // always previews what the preset actually produces.
                    background: `linear-gradient(135deg, ${p.swatch[0]}, ${p.swatch[1]})`,
                  }}
                />
                <span
                  className={`text-[11px] font-medium ${
                    active ? "text-[var(--text)]" : "text-[var(--text-secondary)]"
                  }`}
                >
                  {p.name}
                </span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Shape">
        <PillGroup<DotStyle>
          label="Dots"
          columns={5}
          help="The shape of each module in the body of the code."
          value={style.dotStyle}
          options={[
            { value: "square", label: "Square" },
            { value: "rounded", label: "Rounded" },
            { value: "dots", label: "Dots" },
            { value: "classy", label: "Classy" },
            { value: "diamond", label: "Diamond" },
          ]}
          onChange={(v) => set("dotStyle", v)}
        />
        <PillGroup<EyeFrameStyle>
          label="Eye frame"
          columns={4}
          help="The outer ring of the three large corner squares."
          value={style.eyeFrameStyle}
          options={[
            { value: "square", label: "Square" },
            { value: "rounded", label: "Rounded" },
            { value: "circle", label: "Circle" },
            { value: "leaf", label: "Leaf" },
          ]}
          onChange={(v) => set("eyeFrameStyle", v)}
        />
        <PillGroup<EyeBallStyle>
          label="Eye centre"
          columns={4}
          help="The solid block inside each corner square."
          value={style.eyeBallStyle}
          options={[
            { value: "square", label: "Square" },
            { value: "rounded", label: "Rounded" },
            { value: "circle", label: "Circle" },
            { value: "leaf", label: "Leaf" },
          ]}
          onChange={(v) => set("eyeBallStyle", v)}
        />
        <Slider
          label="Dot size"
          help="Shrinking dots separates them visually, but reduces contrast at a distance."
          min={0.5}
          max={1}
          step={0.01}
          value={style.dotScale}
          onChange={(v) => set("dotScale", v)}
          format={(v) => `${Math.round(v * 100)}%`}
        />
        <Slider
          label="Quiet zone"
          help="The empty border around the code. Scanners need it to find the code edges."
          min={0}
          max={8}
          step={1}
          value={style.margin}
          onChange={(v) => set("margin", v)}
          format={(v) => `${v} module${v === 1 ? "" : "s"}`}
        />
      </Section>

      <Section title="Colors">
        <FillEditor fill={style.bodyFill} onChange={(f) => set("bodyFill", f)} />

        <Toggle
          label="Style eyes separately"
          checked={style.eyeFrameFill !== null || style.eyeBallFill !== null}
          onChange={(on) =>
            onChange({
              ...style,
              eyeFrameFill: on ? { ...style.bodyFill, kind: "solid" } : null,
              eyeBallFill: on ? { ...style.bodyFill, kind: "solid" } : null,
            })
          }
        />

        {style.eyeFrameFill && (
          <div className="grid grid-cols-2 gap-3">
            <ColorField
              label="Eye frame"
              value={style.eyeFrameFill.color}
              onChange={(color) =>
                set("eyeFrameFill", { ...style.eyeFrameFill!, kind: "solid", color })
              }
            />
            <ColorField
              label="Eye centre"
              value={style.eyeBallFill?.color ?? style.eyeFrameFill.color}
              onChange={(color) =>
                set("eyeBallFill", {
                  ...(style.eyeBallFill ?? style.eyeFrameFill!),
                  kind: "solid",
                  color,
                })
              }
            />
          </div>
        )}

        <Toggle
          label="Transparent background"
          checked={style.transparentBackground}
          onChange={(v) => set("transparentBackground", v)}
        />

        {!style.transparentBackground && (
          <ColorField
            label="Background"
            value={style.background}
            onChange={(v) => set("background", v)}
          />
        )}
      </Section>

      <Section title="Logo" right={<span className="text-xs text-[var(--text-secondary)]">Sits in the centre</span>}>
        {logo ? (
          <>
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logo}
                alt="Selected logo"
                className="h-12 w-12 rounded-lg border border-[var(--border)] object-contain"
              />
              <Button onClick={() => onLogoChange(null)}>Remove</Button>
            </div>
            <Slider
              label="Size"
              help="Larger logos cover more data. The decode check below is the real test."
              min={0.1}
              max={0.35}
              step={0.01}
              value={style.logoSize}
              onChange={(v) => set("logoSize", v)}
              format={(v) => `${Math.round(v * 100)}%`}
            />
            <Slider
              label="Padding"
              min={0}
              max={4}
              step={0.5}
              value={style.logoMargin}
              onChange={(v) => set("logoMargin", v)}
            />
            <Toggle
              label="Circular crop"
              checked={style.logoRounded}
              onChange={(v) => set("logoRounded", v)}
            />
            <Toggle
              label="Clear modules behind logo"
              checked={style.logoExcavate}
              onChange={(v) => set("logoExcavate", v)}
            />
          </>
        ) : (
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-surface)] px-4 py-7 text-sm text-[var(--text-secondary)] transition-colors hover:border-[var(--bg-accent)] hover:text-[var(--text)]">
            <Upload className="h-5 w-5" />
            Upload logo image
            <input
              className="sr-only"
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
              onChange={(e) => readLogo(e.target.files?.[0])}
            />
          </label>
        )}
      </Section>

      <Section title="Error correction" hint="Higher levels survive more damage and larger logos.">
        {logo && style.errorLevel === "H" && (
          <div
            className="flex gap-2 rounded-xl p-3 text-xs leading-relaxed"
            style={{ background: "var(--bg-accent-subtle)", color: "var(--bg-accent)" }}
          >
            <Info className="mt-px h-4 w-4 shrink-0" />
            <span>A logo is present — error correction was raised to H to keep the code scannable.</span>
          </div>
        )}
        <PillGroup<ErrorLevel>
          columns={4}
          value={style.errorLevel}
          options={[
            { value: "L", label: "L · 7%" },
            { value: "M", label: "M · 15%" },
            { value: "Q", label: "Q · 25%" },
            { value: "H", label: "H · 30%" },
          ]}
          onChange={(v) => set("errorLevel", v)}
        />
      </Section>
    </div>
  );
}
