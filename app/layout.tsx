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
  keywords: [
    "artist management",
    "music manager",
    "music business",
    "music industry",
    "tour management",
    "music marketing",
    "record label",
    "music royalties",
  ],
  authors: [{ name: "ROSTER" }],
  creator: "ROSTER",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: APP_NAME,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
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
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#080B14",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Read the per-request nonce stamped by middleware so the SW registration
  // inline script can be allowlisted in the Content-Security-Policy header.
  const headersList = await headers();
  const nonce = headersList.get("x-nonce") ?? "";

  // Read UI language from cookie (written by locale-context → applyLangToDom).
  // This sets the correct lang + dir on the server-rendered HTML, preventing
  // a flash of wrong direction on first load for Arabic users.
  const cookieStore = await cookies();
  const uiLang = cookieStore.get("roster_ui_language")?.value ?? "en";
  const htmlDir = uiLang === "ar" ? "rtl" : "ltr";

  return (
    <html lang={uiLang} dir={htmlDir} suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        {/*
          Anti-flash script: runs synchronously before any CSS so the
          correct data-theme is set on <html> before the browser paints.
          Without this, users see a brief flash of the wrong theme on load.
          Nonce is required because we removed unsafe-inline from CSP.
        */}
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('roster_theme')||'dark';if(t==='system'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-text-primary antialiased">
        <ThemeProvider>
        <PostHogProvider>
        <ToastProvider>
          {children}
          <Script
            id="sw-register"
            strategy="afterInteractive"
            nonce={nonce}
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js').then(
                      function(reg) { console.log('SW registered:', reg.scope); },
                      function(err) { console.log('SW registration failed:', err); }
                    );
                  });
                }
              `,
            }}
          />
        </ToastProvider>
        </PostHogProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
