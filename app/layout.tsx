import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TradeGuard | DevClans",
  description: "Agreements, delivery evidence and escrow in one trade workspace.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
