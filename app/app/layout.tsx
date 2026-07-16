import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Catalan Atelier · Complete Chapters",
        description: "Catalan opening lessons with board, diagrams, and Stockfish analysis.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
