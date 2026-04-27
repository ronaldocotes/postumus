import type { Metadata } from "next";
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
        <meta name="theme-color" content="#ffffff" />
        <link rel="icon" href="/logo-oficial.png" type="image/png" />
      </head>
      <body className="min-h-full flex flex-col bg-white text-gray-900" style={{ backgroundColor: "#ffffff", color: "#111827", colorScheme: "only light" }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
