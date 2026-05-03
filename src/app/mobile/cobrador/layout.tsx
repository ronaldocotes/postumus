export const metadata = {
  title: "Cobrador - Posthumous",
  description: "App do Cobrador",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Cobrador",
  },
  themeColor: "#2563eb",
};

export default function CobradorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{ maxWidth: "100vw", overflowX: "hidden", minHeight: "100svh", background: "#f9fafb" }}
    >
      {children}
    </div>
  );
}
