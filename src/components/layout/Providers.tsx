"use client";

import { SessionProvider } from "next-auth/react";
import dynamic from "next/dynamic";

const PWAInstallBanner = dynamic(() => import("@/components/PWAInstallBanner"), {
  ssr: false,
});

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <PWAInstallBanner />
    </SessionProvider>
  );
}
