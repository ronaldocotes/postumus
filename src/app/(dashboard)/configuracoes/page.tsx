"use client";

import { Settings } from "lucide-react";

export default function ConfiguracoesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Configurações</h1>
          <p className="text-slate-500">Gerencie as configurações gerais do sistema</p>
        </div>
      </div>

      {/* Placeholder */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
        <Settings size={64} className="mx-auto mb-4 text-slate-200" />
        <h3 className="text-lg font-medium text-slate-900 mb-2">Configurações do Sistema</h3>
        <p className="text-slate-500">Em desenvolvimento</p>
      </div>
    </div>
  );
}
