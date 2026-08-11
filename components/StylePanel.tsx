"use client";

import type { StyleOptions } from "@/lib/presets";
import type { DotStyle, ErrorLevel, EyeBallStyle, EyeFrameStyle, Fill, FillKind } from "@/lib/qr";
import { ColorSwatch, Labeled, Section, Segmented, Slider, Toggle } from "./ui";

function FillEditor({
  label,
  fill,
  onChange,
}: {
  label: string;
  fill: Fill;
  onChange: (f: Fill) => void;
}) {
  return (
    <div className="space-y-3">
      <Segmented<FillKind>
        label={label}
        value={fill.kind}
        options={[
          { value: "solid", label: "Solid" },
          { value: "linear", label: "Linear" },
          { value: "radial", label: "Radial" },
        ]}
        onChange={(kind) => onChange({ ...fill, kind })}
      />
      <div className="grid grid-cols-2 gap-3">
        <ColorSwatch
          label={fill.kind === "solid" ? "Color" : "From"}
          value={fill.color}
          onChange={(color) => onChange({ ...fill, color })}
        />
        <ColorSwatch
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
}: {
  style: StyleOptions;
  onChange: (next: StyleOptions) => void;
  logo: string | null;
  onLogoChange: (logo: string | null) => void;
}) {
  const set = <K extends keyof StyleOptions>(key: K, v: StyleOptions[K]) =>
    onChange({ ...style, [key]: v });

  const readLogo = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onLogoChange(String(reader.result));
    reader.readAsDataURL(file);
  };

  return (
    <>
      <Section title="Shape">
        <Segmented<DotStyle>
          label="Dots"
          columns={3}
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
        <Segmented<EyeFrameStyle>
          label="Eye frame"
          columns={4}
          value={style.eyeFrameStyle}
          options={[
            { value: "square", label: "Square" },
            { value: "rounded", label: "Rounded" },
            { value: "circle", label: "Circle" },
            { value: "leaf", label: "Leaf" },
          ]}
          onChange={(v) => set("eyeFrameStyle", v)}
        />
        <Segmented<EyeBallStyle>
          label="Eye centre"
          columns={4}
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
          min={0.5}
          max={1}
          step={0.01}
          value={style.dotScale}
          onChange={(v) => set("dotScale", v)}
          format={(v) => `${Math.round(v * 100)}%`}
        />
        <Slider
          label="Quiet zone"
          min={0}
          max={8}
          step={1}
          value={style.margin}
          onChange={(v) => set("margin", v)}
          format={(v) => `${v} modules`}
        />
      </Section>

      <Section title="Colors">
        <FillEditor label="Body" fill={style.bodyFill} onChange={(f) => set("bodyFill", f)} />

        <div className="border-t border-[var(--color-line)] pt-3">
          <Toggle
            label="Style the eyes separately"
            checked={style.eyeFrameFill !== null || style.eyeBallFill !== null}
            onChange={(on) => {
              if (on) {
                onChange({
                  ...style,
                  eyeFrameFill: { ...style.bodyFill, kind: "solid" },
                  eyeBallFill: { ...style.bodyFill, kind: "solid" },
                });
              } else {
                onChange({ ...style, eyeFrameFill: null, eyeBallFill: null });
              }
            }}
          />
        </div>

        {style.eyeFrameFill && (
          <div className="grid grid-cols-2 gap-3">
            <ColorSwatch
              label="Eye frame"
              value={style.eyeFrameFill.color}
              onChange={(color) =>
                set("eyeFrameFill", { ...style.eyeFrameFill!, kind: "solid", color })
              }
            />
            <ColorSwatch
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

        <div className="border-t border-[var(--color-line)] pt-3">
          <Toggle
            label="Transparent background"
            checked={style.transparentBackground}
            onChange={(v) => set("transparentBackground", v)}
          />
        </div>
        {!style.transparentBackground && (
          <ColorSwatch
            label="Background"
            value={style.background}
            onChange={(v) => set("background", v)}
          />
        )}
      </Section>

      <Section title="Logo" hint="Sits in the centre. Raise error correction to keep it scannable.">
        {logo ? (
          <>
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logo}
                alt="Selected logo"
                className="h-12 w-12 rounded-md border border-[var(--color-line)] object-contain"
              />
              <button
                type="button"
                onClick={() => onLogoChange(null)}
                className="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--color-canvas)]"
              >
                Remove
              </button>
            </div>
            <Slider
              label="Size"
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
          <Labeled label="Upload">
            <input
              className="field file:mr-3 file:rounded-md file:border-0 file:bg-[var(--color-canvas)] file:px-2.5 file:py-1 file:text-xs file:font-medium file:text-[var(--color-ink)]"
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
              onChange={(e) => readLogo(e.target.files?.[0])}
            />
          </Labeled>
        )}
      </Section>

      <Section
        title="Error correction"
        hint="Higher levels survive more damage and larger logos, at the cost of a denser code."
      >
        <Segmented<ErrorLevel>
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
    </>
  );
}
