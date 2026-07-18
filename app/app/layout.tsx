import type { Metadata } from "next";
import appIcon from "../app_icon_chess_study.png";
import "./globals.css";

export const metadata: Metadata = {
  title: "Catalan Atelier · Complete Chapters",
  description: "Markdown-authored Catalan lessons with navigable chess variations and analysis.",
  icons: {
    icon: [{ url: appIcon.src, type: "image/png", sizes: "1024x1024" }],
    shortcut: appIcon.src,
    apple: [{ url: appIcon.src, type: "image/png", sizes: "1024x1024" }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
