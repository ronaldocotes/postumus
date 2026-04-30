"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Users,
  Truck,
  Package,
  DollarSign,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  Wrench,
  Settings,
  ChevronDown,
  Store,
  Bike,
  Wallet,
  MapPinned,
  Receipt,
  PieChart,
  UserCog,
  Map,
  Cog,
  Navigation,
  ShoppingCart,
} from "lucide-react";
import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";

interface SubMenuItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

interface MenuItem {
  href?: string;
  label: string;
  icon: React.ElementType;
  children?: SubMenuItem[];
}

const menuItems: MenuItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clientes", label: "Clientes", icon: Users },
  {
    label: "Cobrança",
    icon: Bike,
    children: [
      { href: "/carnes", label: "Carnês", icon: Receipt },
      { href: "/mapa", label: "Mapa / Rotas", icon: MapPinned },
      { href: "/cobranca/rotas", label: "Rotas de Cobrança", icon: Navigation },
    ],
  },
  {
    label: "Estoque & Serviços",
    icon: Store,
    children: [
      { href: "/mercadorias", label: "Mercadorias", icon: Package },
      { href: "/servicos", label: "Serviços", icon: Wrench },
      { href: "/vendas", label: "Vendas", icon: ShoppingCart },
      { href: "/fornecedores", label: "Fornecedores", icon: Truck },
    ],
  },
  {
    label: "Financeiro",
    icon: Wallet,
    children: [
      { href: "/financeiro", label: "Fluxo de Caixa", icon: DollarSign },
      { href: "/relatorios", label: "Relatórios", icon: PieChart },
    ],
  },
  {
    label: "Administração",
    icon: Settings,
    children: [
      { href: "/empresa", label: "Empresa", icon: Store },
      { href: "/admin", label: "Usuários & Permissões", icon: UserCog },
      { href: "/localidades", label: "Localidades", icon: Map },
      { href: "/configuracoes", label: "Configurações", icon: Cog },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);

  useEffect(() => {
    const loadCompanyLogo = async () => {
      try {
        const res = await fetch("/api/empresa");
        if (res.ok) {
          const data = await res.json();
          const activeCompany = data.companies?.[0];
          if (activeCompany?.logo) {
            setCompanyLogo(activeCompany.logo);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar logo da empresa:", err);
      }
    };
    loadCompanyLogo();
  }, []);

  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(label)) {
        newSet.delete(label);
      } else {
        newSet.add(label);
      }
      return newSet;
    });
  };

  const isActive = (href: string) => {
    return pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
  };

  const isParentActive = (children?: SubMenuItem[]) => {
    if (!children) return false;
    return children.some((child) => isActive(child.href));
  };

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden bg-slate-800 text-amber-400 p-2 rounded-lg shadow-md border border-slate-700"
        onClick={() => setOpen(!open)}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/70 z-30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen w-64 bg-white text-slate-800 border-r border-slate-200 transition-transform duration-300 flex flex-col",
          "md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="p-6 border-b border-slate-200 bg-gradient-to-b from-[#d4e4f7] to-white shrink-0">
          {companyLogo ? (
            <img src={companyLogo} alt="Logo da Empresa" className="w-16 h-16 mx-auto mb-2 object-contain" />
          ) : (
            <img src="/logo-oficial.png" alt="Posthumous" className="w-16 h-16 mx-auto mb-2" />
          )}
          <h1 className="text-xl font-bold text-center text-[#4a6fa5]">Posthumous</h1>
          <p className="text-xs text-slate-500 mt-1 text-center">Gestão de Serviços Póstumos</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedMenus.has(item.label);
            const parentActive = isParentActive(item.children);

            if (hasChildren) {
              return (
                <div key={item.label} className="space-y-1">
                  {/* Parent Menu Item */}
                  <button
                    type="button"
                    onClick={() => toggleMenu(item.label)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                      parentActive
                        ? "bg-[#4a6fa5]/10 text-[#4a6fa5]"
                        : "text-slate-600 hover:bg-[#d4e4f7] hover:text-[#4a6fa5]"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </div>
                    <ChevronDown
                      size={16}
                      className={cn(
                        "transition-transform duration-200",
                        isExpanded ? "rotate-180" : ""
                      )}
                    />
                  </button>

                  {/* Submenu */}
                  <div
                    className={cn(
                      "overflow-hidden transition-all duration-200 ease-in-out",
                      isExpanded ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
                    )}
                  >
                    <div className="pl-4 space-y-1 border-l-2 border-slate-100 ml-4">
                      {item.children!.map((child) => {
                        const ChildIcon = child.icon;
                        const childActive = isActive(child.href);

                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setOpen(false)}
                            className={cn(
                              "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors",
                              childActive
                                ? "bg-[#4a6fa5] text-white"
                                : "text-slate-500 hover:bg-[#d4e4f7] hover:text-[#4a6fa5]"
                            )}
                          >
                            <ChildIcon size={16} />
                            <span>{child.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            }

            // Single menu item
            const itemActive = isActive(item.href!);
            return (
              <Link
                key={item.href}
                href={item.href!}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                  itemActive
                    ? "bg-[#4a6fa5] hover:bg-[#3d5a87] text-white"
                    : "text-slate-600 hover:bg-[#d4e4f7] hover:text-[#4a6fa5]"
                )}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-slate-200 shrink-0">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-600 hover:bg-[#d4e4f7] hover:text-[#4a6fa5] w-full transition-colors"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>
    </>
  );
}
