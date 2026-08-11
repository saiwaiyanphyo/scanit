import type { QROptions } from "./qr";

export type StyleOptions = Omit<QROptions, "data" | "logo">;

export const defaultStyle: StyleOptions = {
  errorLevel: "M",
  margin: 2,
  dotStyle: "rounded",
  eyeFrameStyle: "rounded",
  eyeBallStyle: "rounded",
  bodyFill: { kind: "solid", color: "#111827", color2: "#6366f1", angle: 45 },
  eyeFrameFill: null,
  eyeBallFill: null,
  background: "#ffffff",
  transparentBackground: false,
  dotScale: 1,
  logoSize: 0.18,
  logoMargin: 0.5,
  logoRounded: false,
  logoExcavate: true,
};

export interface Preset {
  id: string;
  name: string;
  swatch: [string, string];
  style: StyleOptions;
}

function preset(
  id: string,
  name: string,
  swatch: [string, string],
  style: Partial<StyleOptions>,
): Preset {
  return { id, name, swatch, style: { ...defaultStyle, ...style } };
}

export const presets: Preset[] = [
  preset("classic", "Classic", ["#000000", "#ffffff"], {
    dotStyle: "square",
    eyeFrameStyle: "square",
    eyeBallStyle: "square",
    bodyFill: { kind: "solid", color: "#000000", color2: "#000000", angle: 45 },
  }),
  preset("midnight", "Midnight", ["#111827", "#6366f1"], {
    bodyFill: { kind: "linear", color: "#111827", color2: "#6366f1", angle: 45 },
  }),
  preset("sunset", "Sunset", ["#f97316", "#db2777"], {
    dotStyle: "dots",
    eyeFrameStyle: "circle",
    eyeBallStyle: "circle",
    dotScale: 0.92,
    bodyFill: { kind: "linear", color: "#f97316", color2: "#db2777", angle: 120 },
  }),
  preset("forest", "Forest", ["#065f46", "#84cc16"], {
    dotStyle: "classy",
    eyeFrameStyle: "leaf",
    eyeBallStyle: "leaf",
    bodyFill: { kind: "linear", color: "#065f46", color2: "#84cc16", angle: 90 },
  }),
  preset("ocean", "Ocean", ["#0ea5e9", "#1e3a8a"], {
    dotStyle: "dots",
    eyeFrameStyle: "rounded",
    eyeBallStyle: "circle",
    dotScale: 0.85,
    bodyFill: { kind: "radial", color: "#0ea5e9", color2: "#1e3a8a", angle: 0 },
  }),
  preset("mono-invert", "Inverted", ["#ffffff", "#0a0a0a"], {
    background: "#0a0a0a",
    bodyFill: { kind: "solid", color: "#ffffff", color2: "#ffffff", angle: 0 },
  }),
  preset("candy", "Candy", ["#a855f7", "#22d3ee"], {
    dotStyle: "diamond",
    eyeFrameStyle: "circle",
    eyeBallStyle: "circle",
    dotScale: 0.95,
    bodyFill: { kind: "linear", color: "#a855f7", color2: "#22d3ee", angle: 45 },
  }),
  preset("ember", "Ember", ["#7f1d1d", "#f59e0b"], {
    dotStyle: "rounded",
    eyeFrameStyle: "rounded",
    eyeBallStyle: "rounded",
    bodyFill: { kind: "linear", color: "#7f1d1d", color2: "#f59e0b", angle: 315 },
    eyeFrameFill: { kind: "solid", color: "#7f1d1d", color2: "#7f1d1d", angle: 0 },
  }),
];
