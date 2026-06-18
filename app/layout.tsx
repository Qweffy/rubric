import { type Metadata, type Viewport } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";

import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "rubric — CI for prompts",
  description:
    "Regression-gating for prompts and agents — golden sets, judge calibration, and score diffs that fail the build when quality drops.",
};

// viewport-fit=cover exposes the env(safe-area-inset-*) values the mobile tab
// bar and sheets pad against; the app is dark-only so themeColor matches the void.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#06080C",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} h-full`}
      style={{ colorScheme: "dark" }}
    >
      <body className="hr-void min-h-full">{children}</body>
    </html>
  );
}
