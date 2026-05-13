import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { headers } from "next/headers";
import { cookies } from "next/headers";
import "./globals.css";
import { APP_NAME, APP_DESCRIPTION, APP_TAGLINE } from "@/lib/constants";
import { ToastProvider } from "@/components/ui/toast";
import { PostHogProvider } from "@/components/providers/posthog-provider";
import { ThemeProvider } from "@/context/theme-context";

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  keywords: ["artist management","music manager","music business","music industry","tour management","music marketing","record label","music royalties"],
  authors: [{ name: "ROSTER" }],
  creator: "ROSTER",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: APP_NAME },
  openGraph: {
    type: "website", locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: `${APP_NAME} — ${APP_TAGLINE}`,
    description: APP_DESCRIPTION,
    siteName: APP_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} — ${APP_TAGLINE}`,
    description: APP_DESCRIPTION,
  },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#08070A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const nonce = headersList.get("x-nonce") ?? "";

  const cookieStore = await cookies();
  const uiLang = cookieStore.get("roster_ui_language")?.value ?? "en";
  const htmlDir = uiLang === "ar" ? "rtl" : "ltr";

  return (
    <html lang={uiLang} dir={htmlDir} suppressHydrationWarning data-palette="bordeaux">
      <head>
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('roster_theme')||'dark';if(t==='system'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
          }}
        />
        {/* Fonts — Sora (display) + JetBrains Mono (metadata) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased" style={{ background: "var(--bg)", color: "var(--ink)" }}>
        <ThemeProvider>
        <PostHogProvider>
        <ToastProvider>
          {children}
          <Script
            id="sw-register"
            strategy="afterInteractive"
            nonce={nonce}
            dangerouslySetInnerHTML={{
              __html: `if('serviceWorker'in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js');})}`,
            }}
          />
        </ToastProvider>
        </PostHogProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
