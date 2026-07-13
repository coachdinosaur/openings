import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Catalan Atelier · Chapter 1",
  description: "A source-grounded interactive lesson covering all of Catalan Chapter 1.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
