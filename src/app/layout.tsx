import type { Metadata, Viewport } from "next";
import { AmbientBackground } from "@/components/effects/AmbientBackground";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/inter";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "./globals.css";
import { getSiteUrl } from "@/lib/env";
import { NavigationProgress } from "@/components/layout/NavigationProgress";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default: "ACOB — Applied Cognitio Olympiad Bangladesh",
    template: "%s — ACOB",
  },

  description:
    "Applied Cognitio Olympiad Bangladesh champions curiosity over memorisation — academic Olympiads and learning experiences that reward reasoning, application, and understanding.",

  keywords: [
    "Applied Cognitio Olympiad Bangladesh",
    "ACOB",
    "Bangladesh Olympiad",
    "academic olympiad",
    "critical thinking competition",
    "student olympiad Bangladesh",
  ],

  authors: [{ name: "Applied Cognitio Olympiad Bangladesh" }],

  icons: {
    icon: [
      {
        url: "/favicon_io/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png",
      },
      {
        url: "/favicon_io/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/favicon_io/favicon.ico",
        sizes: "any",
      },
    ],

    shortcut: "/favicon_io/favicon.ico",

    apple: [
      {
        url: "/favicon_io/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },

  manifest: "/favicon_io/site.webmanifest",

  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "ACOB — Applied Cognitio Olympiad Bangladesh",
    title: "ACOB — Applied Cognitio Olympiad Bangladesh",
    description:
      "Curiosity over memorisation. Academic Olympiads and learning experiences designed to reward reasoning, not recall.",
    images: [
      {
        url: "/assets/logo.png",
        width: 640,
        height: 160,
        alt: "ACOB",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "ACOB — Applied Cognitio Olympiad Bangladesh",
    description: "Curiosity over memorisation.",
    images: ["/assets/logo.png"],
  },

  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#08080a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-background font-sans text-primary antialiased">
        <NavigationProgress />
        <AmbientBackground />
        {children}
      </body>
    </html>
  );
}
