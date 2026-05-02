import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/layout/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Posthumous - Gestão de Serviços Póstumos",
  description: "Sistema de gestão para funerária",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Posthumous",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Posthumous",
    title: "Posthumous - Gestão de Serviços Póstumos",
    description: "Sistema de gestão para funerária",
  },
};

export const viewport: Viewport = {
  themeColor: "#4a6fa5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      style={{ colorScheme: "only light" }}
      data-theme="light"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased light`}
    >
      <head>
        <meta name="color-scheme" content="only light" />
        <link rel="icon" href="/logo-oficial.png" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        {/* iOS Splash Screens */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Posthumous" />
        {/* Android / Chrome */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Posthumous" />
        {/* MS Tiles */}
        <meta name="msapplication-TileColor" content="#4a6fa5" />
        <meta name="msapplication-TileImage" content="/icon-192x192.png" />
        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(reg) { console.log('[PWA] SW registered:', reg.scope); })
                    .catch(function(err) { console.warn('[PWA] SW registration failed:', err); });
                });
              }
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-white text-gray-900" style={{ backgroundColor: "#ffffff", color: "#111827", colorScheme: "only light" }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
