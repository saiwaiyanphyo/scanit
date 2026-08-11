import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ScanIt — Customizable QR Code Generator",
  description:
    "Design QR codes with custom shapes, gradients, and logos. Everything runs in your browser — nothing is uploaded.",
  openGraph: {
    title: "ScanIt — Customizable QR Code Generator",
    description:
      "Design QR codes with custom shapes, gradients, and logos. Everything runs in your browser.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7f9" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0b0e" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
