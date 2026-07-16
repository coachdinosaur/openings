import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Catalan Atelier · Complete Chapters",
  description: "Markdown-authored Catalan lessons with navigable chess variations and analysis.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
