import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Catalan Atelier · Chapters 1–2",
  description: "Source-grounded Catalan lessons with board, diagrams, review, and PDF import verification.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
