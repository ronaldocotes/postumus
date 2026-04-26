"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Users,
  Truck,
  Package,
  FileText,
  BarChart3,
  DollarSign,
  LayoutDashboard,
  Shield,
  LogOut,
  Menu,
  X,
  Wrench,
  MapPin,
} from "lucide-react";
import { useState } from "react";
import { signOut } from "next-auth/react";

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/fornecedores", label: "Fornecedores", icon: Truck },
  { href: "/mercadorias", label: "Mercadorias", icon: Package },
  { href: "/servicos", label: "Serviços", icon: Wrench },
  { href: "/carnes", label: "Carnês", icon: FileText },
  { href: "/financeiro", label: "Financeiro", icon: DollarSign },
  { href: "/mapa", label: "Mapa / Rotas", icon: MapPin },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/usuarios", label: "Usuários", icon: Shield },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden bg-white text-gray-900 p-2 rounded-lg shadow-md border border-gray-200"
        onClick={() => setOpen(!open)}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen w-64 bg-white text-gray-900 border-r border-gray-200 transition-transform duration-300",
          "md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-xl font-bold">⚱️ Posthumous</h1>
            <p className="text-sm text-gray-500 mt-1">Gestão Funerária</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full transition-colors"
            >
              <LogOut size={18} />
              Sair
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
