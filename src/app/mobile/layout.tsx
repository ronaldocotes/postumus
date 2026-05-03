import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Posthumous Mobile",
  description: "Acesso rápido ao sistema Posthumous no celular",
};

export const viewport: Viewport = {
  themeColor: "#4a6fa5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="max-w-md mx-auto min-h-screen"
      style={{ overscrollBehavior: "none", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {children}
    </div>
  );
}
