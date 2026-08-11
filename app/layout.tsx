import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { themeBootstrap } from "@/lib/theme";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "ScanIt — Customizable QR Code Generator",
  description:
    "Design QR codes with custom shapes, gradients, and logos — with a live check that they still scan. Everything runs in your browser.",
  openGraph: {
    title: "ScanIt — Customizable QR Code Generator",
    description:
      "Design QR codes with custom shapes, gradients, and logos, verified scannable in the browser.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf7f0" },
    { media: "(prefers-color-scheme: dark)", color: "#1c1a17" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <head>
        {/* Applies the stored theme before first paint so there's no flash. */}
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
