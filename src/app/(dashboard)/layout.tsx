import Sidebar from "@/components/layout/Sidebar";
import { ToastProvider } from "@/components/ui/Toast";
import { CompanyProvider } from "@/hooks/useCompany";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <CompanyProvider>
        <div className="min-h-screen bg-[#fafafa]">
          <Sidebar />
          <main className="md:ml-64 p-6 pt-16 md:pt-6">{children}</main>
        </div>
      </CompanyProvider>
    </ToastProvider>
  );
}
