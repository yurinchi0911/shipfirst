import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import { routing } from "@/i18n/routing";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://shipfirst.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "ShipFirst — Your first sale starts here",
    template: "%s | ShipFirst",
  },
  description:
    "The marketplace where first-time product makers land their first paying customer. Free to list — 15% only when you sell.",
  keywords: ["marketplace", "indie maker", "first sale", "digital products", "SaaS", "vibe coding"],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: APP_URL,
    siteName: "ShipFirst",
    title: "ShipFirst — Your first sale starts here",
    description:
      "Product Hunt is for traction. Indie Hackers is for learning. ShipFirst is for your first sale.",
    images: [
      {
        url: `/api/og?title=${encodeURIComponent("ShipFirst")}&sub=${encodeURIComponent("Your first sale starts here")}`,
        width: 1200,
        height: 630,
        alt: "ShipFirst — Your first sale starts here",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ShipFirst — Your first sale starts here",
    description:
      "Product Hunt is for traction. Indie Hackers is for learning. ShipFirst is for your first sale.",
    images: [`/api/og?title=${encodeURIComponent("ShipFirst")}&sub=${encodeURIComponent("Your first sale starts here")}`],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const headersList = await headers();
  const locale =
    headersList.get("X-NEXT-INTL-LOCALE") ?? routing.defaultLocale;

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
