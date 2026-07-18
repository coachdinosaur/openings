import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Catalan Atelier · Complete Chapters",
  description: "Markdown-authored Catalan lessons with navigable chess variations and analysis.",
  icons: {
    icon: [{ url: "/app_icon_chess_study.png", type: "image/png", sizes: "1024x1024" }],
    shortcut: "/app_icon_chess_study.png",
    apple: [{ url: "/app_icon_chess_study.png", type: "image/png", sizes: "1024x1024" }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
