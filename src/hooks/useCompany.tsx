"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface Company {
  id: string;
  name: string;
  tradeName?: string;
  logo?: string;
}

interface CompanyContextType {
  company: Company | null;
  setCompany: (company: Company | null) => void;
  companies: Company[];
  loadCompanies: () => Promise<void>;
  isLoading: boolean;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [company, setCompanyState] = useState<Company | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Carrega empresa salva no localStorage ao montar
  useEffect(() => {
    const saved = localStorage.getItem("selected_company");
    if (saved) {
      try {
        setCompanyState(JSON.parse(saved));
      } catch {
        localStorage.removeItem("selected_company");
      }
    }
  }, []);

  const setCompany = (c: Company | null) => {
    setCompanyState(c);
    if (c) {
      localStorage.setItem("selected_company", JSON.stringify(c));
      // Também seta cookie para SSR
      document.cookie = `company_id=${c.id}; path=/; max-age=86400`;
    } else {
      localStorage.removeItem("selected_company");
      document.cookie = `company_id=; path=/; max-age=0`;
    }
  };

  const loadCompanies = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/empresa");
      if (res.ok) {
        const data = await res.json();
        setCompanies(data.companies || []);
      }
    } catch (err) {
      console.error("Erro ao carregar empresas:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CompanyContext.Provider value={{ company, setCompany, companies, loadCompanies, isLoading }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error("useCompany deve ser usado dentro de CompanyProvider");
  return ctx;
}
