"use client";

import { useState } from "react";

interface ReciboData {
  clientName: string;
  valor: number;
  paymentMethod: string;
  parcelaNumero: number;
  data: string;
  cobradorName: string;
  endereco?: string;
}

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

interface Props {
  data: ReciboData;
  onClose: () => void;
}

export default function ReciboModal({ data, onClose }: Props) {
  const [compartilhando, setCompartilhando] = useState(false);

  const handleCompartilhar = async () => {
    setCompartilhando(true);
    try {
      const texto = `*Recibo de Pagamento - Posthumous*

Cliente: ${data.clientName}
Valor: ${fmt(data.valor)}
Parcela: ${data.parcelaNumero}
Forma: ${data.paymentMethod}
Data: ${new Date(data.data).toLocaleString("pt-BR")}
Cobrador: ${data.cobradorName}

Obrigado!`;

      if (navigator.share) {
        await navigator.share({
          title: "Recibo de Pagamento",
          text: texto,
        });
      } else {
        await navigator.clipboard.writeText(texto);
        alert("Recibo copiado para a área de transferência!");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCompartilhando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[500] flex items-end sm:items-center justify-center">
      <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Pagamento Registrado!</h2>
          <p className="text-gray-500 text-sm mt-1">{data.clientName}</p>
        </div>

        <div className="bg-gray-50 rounded-2xl p-4 space-y-3 mb-6">
          <div className="flex justify-between">
            <span className="text-gray-500 text-sm">Valor</span>
            <span className="font-bold text-gray-900">{fmt(data.valor)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 text-sm">Parcela</span>
            <span className="font-medium text-gray-900">{data.parcelaNumero}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 text-sm">Forma</span>
            <span className="font-medium text-gray-900">{data.paymentMethod}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 text-sm">Data</span>
            <span className="font-medium text-gray-900">{new Date(data.data).toLocaleString("pt-BR")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 text-sm">Cobrador</span>
            <span className="font-medium text-gray-900">{data.cobradorName}</span>
          </div>
          {data.endereco && (
            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">Local</span>
              <span className="font-medium text-gray-900 text-right max-w-[60%]">{data.endereco}</span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <button
            onClick={handleCompartilhar}
            disabled={compartilhando}
            className="w-full bg-green-500 active:bg-green-600 text-white font-bold py-3.5 rounded-2xl text-base transition-colors"
            style={{ minHeight: "52px" }}
          >
            {compartilhando ? "Enviando..." : "Compartilhar Recibo"}
          </button>
          <button
            onClick={onClose}
            className="w-full bg-gray-100 text-gray-700 font-bold py-3.5 rounded-2xl text-base active:bg-gray-200 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
