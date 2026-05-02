"use client";

import { useEffect, useState } from "react";
import { useCompany } from "@/hooks/useCompany";
import { Building2, ChevronDown, Check } from "lucide-react";

export default function CompanySelector() {
  const { company, setCompany, companies, loadCompanies, isLoading } = useCompany();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    loadCompanies();
  }, []);

  if (companies.length <= 1) return null;

  return (
    <div className="relative px-4 mb-3">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-[#4a6fa5] hover:bg-[#d4e4f7] transition-colors text-left"
      >
        <Building2 size={16} className="text-[#4a6fa5] flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-500 truncate">Empresa</p>
          <p className="text-sm font-medium text-slate-800 truncate">
            {company?.tradeName || company?.name || "Selecionar..."}
          </p>
        </div>
        <ChevronDown
          size={14}
          className={`text-slate-400 transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-4 right-4 top-full mt-1 bg-white rounded-lg shadow-lg border border-slate-200 z-50 overflow-hidden">
            {isLoading ? (
              <div className="p-3 text-sm text-slate-500 text-center">Carregando...</div>
            ) : (
              companies.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setCompany(c);
                    setOpen(false);
                    window.location.reload(); // Recarrega para aplicar nova empresa
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-slate-50 transition-colors ${
                    company?.id === c.id ? "bg-[#d4e4f7]/50" : ""
                  }`}
                >
                  {c.logo && (
                    <img src={c.logo} alt="" className="w-6 h-6 rounded object-contain flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{c.tradeName || c.name}</p>
                    <p className="text-xs text-slate-500 truncate">{c.name}</p>
                  </div>
                  {company?.id === c.id && <Check size={14} className="text-[#4a6fa5]" />}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
