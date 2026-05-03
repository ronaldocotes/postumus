"use client";

import { useState } from "react";
import { IdCard, RotateCw, Users, Phone, MapPin, Calendar, Shield, X } from "lucide-react";

interface Dependent {
  id: string;
  name: string;
  relationship?: string;
  birthDate?: string | Date;
}

interface ClientCardProps {
  client: {
    id: string;
    code?: string;
    name: string;
    cpf?: string;
    cellphone?: string;
    phone?: string;
    address?: string;
    number?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    contractDate?: string | Date;
    isAssured?: boolean;
    dependents?: Dependent[];
  };
  onClose?: () => void;
}

function fmtDate(d: string | Date | undefined) {
  if (!d) return "-";
  try {
    return new Intl.DateTimeFormat("pt-BR").format(new Date(d));
  } catch {
    return "-";
  }
}

function fmtCPF(cpf?: string) {
  if (!cpf) return "-";
  const cleaned = cpf.replace(/\D/g, "");
  if (cleaned.length !== 11) return cpf;
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

export default function ClientCard({ client, onClose }: ClientCardProps) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="relative">
        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute -top-3 -right-3 z-10 bg-white text-gray-600 hover:text-gray-900 rounded-full p-1.5 shadow-lg border border-gray-200"
          >
            <X size={18} />
          </button>
        )}

        <div
          className="relative w-[340px] h-[520px] cursor-pointer"
          style={{ perspective: "1000px" }}
          onClick={() => setFlipped(!flipped)}
        >
          <div
            className="relative w-full h-full transition-transform duration-700"
            style={{
              transformStyle: "preserve-3d",
              transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            }}
          >
            {/* FRENTE */}
            <div
              className="absolute inset-0 rounded-2xl shadow-2xl border-2 border-[#4a6fa5] overflow-hidden flex flex-col"
              style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                background: "linear-gradient(160deg, #ffffff 0%, #f0f4fa 100%)",
              }}
            >
              {/* Header */}
              <div className="bg-[#4a6fa5] text-white px-5 py-4 flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <IdCard size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider">Carteira do Associado</h3>
                  <p className="text-[10px] text-white/80">Posthumous</p>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 px-5 py-5 flex flex-col gap-4">
                {/* Code badge */}
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-[#4a6fa5] bg-[#d4e4f7] px-2 py-1 rounded uppercase tracking-wide">
                    Nº {client.code || "-"}
                  </span>
                  {client.isAssured && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded">
                      <Shield size={10} /> Assegurado
                    </span>
                  )}
                </div>

                {/* Name */}
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold">Nome do Associado</p>
                  <p className="text-base font-bold text-gray-900 leading-tight mt-0.5">{client.name}</p>
                </div>

                {/* CPF */}
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold">CPF</p>
                  <p className="text-sm font-medium text-gray-800">{fmtCPF(client.cpf)}</p>
                </div>

                {/* Contact */}
                <div className="flex items-center gap-2 text-sm text-gray-800">
                  <Phone size={14} className="text-[#4a6fa5]" />
                  <span>{client.cellphone || client.phone || "-"}</span>
                </div>

                {/* Address */}
                <div className="flex items-start gap-2 text-sm text-gray-800">
                  <MapPin size={14} className="text-[#4a6fa5] mt-0.5 shrink-0" />
                  <span>
                    {client.address || "-"}
                    {client.number ? `, ${client.number}` : ""}
                    {client.neighborhood ? ` - ${client.neighborhood}` : ""}
                    <br />
                    <span className="text-gray-500 text-xs">
                      {client.city || "-"}/{client.state || "-"}
                    </span>
                  </span>
                </div>

                {/* Contract date */}
                <div className="flex items-center gap-2 text-xs text-gray-600 mt-auto">
                  <Calendar size={14} className="text-[#4a6fa5]" />
                  <span>Contrato: {fmtDate(client.contractDate)}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-[#f0f4fa] px-5 py-3 border-t border-[#d4e4f7] flex items-center justify-between">
                <span className="text-[10px] text-gray-500">Válida mediante apresentação</span>
                <div className="flex items-center gap-1 text-[10px] text-[#4a6fa5] font-medium">
                  <RotateCw size={10} /> Toque para verso
                </div>
              </div>
            </div>

            {/* VERSO */}
            <div
              className="absolute inset-0 rounded-2xl shadow-2xl border-2 border-[#4a6fa5] overflow-hidden flex flex-col"
              style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
                background: "linear-gradient(160deg, #f0f4fa 0%, #ffffff 100%)",
              }}
            >
              {/* Header */}
              <div className="bg-[#4a6fa5] text-white px-5 py-4 flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Users size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider">Dependentes</h3>
                  <p className="text-[10px] text-white/80">Posthumous</p>
                </div>
              </div>

              {/* Dependents list */}
              <div className="flex-1 px-5 py-4 overflow-y-auto">
                {client.dependents && client.dependents.length > 0 ? (
                  <div className="space-y-2">
                    {client.dependents.map((dep) => (
                      <div
                        key={dep.id}
                        className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2.5"
                      >
                        <span className="text-sm font-medium text-gray-900">{dep.name}</span>
                        <span className="text-[10px] uppercase tracking-wide text-[#4a6fa5] font-semibold bg-[#d4e4f7] px-2 py-0.5 rounded">
                          {dep.relationship || "Dependente"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                    <Users size={32} className="opacity-40" />
                    <p className="text-sm">Nenhum dependente cadastrado</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-[#f0f4fa] px-5 py-3 border-t border-[#d4e4f7] flex items-center justify-between">
                <span className="text-[10px] text-gray-500">Carteira do Associado</span>
                <div className="flex items-center gap-1 text-[10px] text-[#4a6fa5] font-medium">
                  <RotateCw size={10} /> Toque para frente
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
