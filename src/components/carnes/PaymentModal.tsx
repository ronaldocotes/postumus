"use client";

import { useState, useEffect } from "react";
import { DollarSign, QrCode, CreditCard, X } from "lucide-react";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPayment: (method: string) => void;
  installmentValue: number;
  clientName: string;
  pixData?: {
    keyType?: string;
    key?: string;
    name?: string;
    city?: string;
  };
}

export default function PaymentModal({
  isOpen,
  onClose,
  onPayment,
  installmentValue,
  clientName,
  pixData,
}: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedMethod(null);
      setQrCodeUrl(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedMethod === "PIX" && pixData?.key) {
      generateQrCode();
    }
  }, [selectedMethod]);

  const generateQrCode = async () => {
    try {
      const QRCode = (await import("qrcode")).default;
      const payload = generatePixPayload();
      const url = await QRCode.toDataURL(payload, { width: 200, margin: 2 });
      setQrCodeUrl(url);
    } catch (err) {
      console.error("Erro ao gerar QR Code:", err);
    }
  };

  const generatePixPayload = () => {
    const pixKey = pixData?.key || "";
    const pixName = (pixData?.name || "Empresa").slice(0, 25);
    const pixCity = (pixData?.city || "Cidade").slice(0, 15);
    const value = installmentValue.toFixed(2);
    const payload = `00020126${(26 + pixKey.length).toString().padStart(2, "0")}0014BR.GOV.BCB.PIX01${pixKey.length.toString().padStart(2, "0")}${pixKey}52040000530398654${value.length.toString().padStart(2, "0")}${value}5802BR59${pixName.length.toString().padStart(2, "0")}${pixName}60${pixCity.length.toString().padStart(2, "0")}${pixCity}6304`;
    return payload;
  };

  if (!isOpen) return null;

  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  return (
    <div className="fixed inset-0 bg-black/50 z-[999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header - Claro */}
        <div className="p-5 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Registrar Pagamento</h2>
            <p className="text-sm text-gray-500 mt-0.5">{clientName}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Value Display */}
        <div className="bg-gray-50 border-b border-gray-200 py-6 text-center flex-shrink-0">
          <p className="text-sm text-gray-500 mb-1">Valor da Parcela</p>
          <p className="text-3xl font-bold text-gray-900">{fmt(installmentValue)}</p>
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Payment Options */}
          {!selectedMethod ? (
            <div className="space-y-3">
              {/* Dinheiro */}
              <button
                onClick={() => setSelectedMethod("CASH")}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-emerald-200 bg-emerald-50/50 hover:border-emerald-500 hover:bg-emerald-100 hover:shadow-md transition-all duration-200 group"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-200 group-hover:scale-110 transition-all">
                  <DollarSign size={24} className="text-emerald-600" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-bold text-gray-900">Dinheiro</p>
                  <p className="text-xs text-gray-500">Pagamento em espécie</p>
                </div>
                <div className="text-emerald-400 group-hover:text-emerald-600 transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9,18 15,12 9,6"/></svg>
                </div>
              </button>

              {/* PIX */}
              <button
                onClick={() => setSelectedMethod("PIX")}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-cyan-200 bg-cyan-50/50 hover:border-cyan-500 hover:bg-cyan-100 hover:shadow-md transition-all duration-200 group"
              >
                <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center flex-shrink-0 group-hover:bg-cyan-200 group-hover:scale-110 transition-all">
                  <QrCode size={24} className="text-cyan-600" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-bold text-gray-900">PIX</p>
                  <p className="text-xs text-gray-500">Transferência instantânea</p>
                </div>
                <div className="text-cyan-400 group-hover:text-cyan-600 transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9,18 15,12 9,6"/></svg>
                </div>
              </button>

              {/* Cartão */}
              <button
                onClick={() => setSelectedMethod("CARD")}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-violet-200 bg-violet-50/50 hover:border-violet-500 hover:bg-violet-100 hover:shadow-md transition-all duration-200 group"
              >
                <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0 group-hover:bg-violet-200 group-hover:scale-110 transition-all">
                  <CreditCard size={24} className="text-violet-600" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-bold text-gray-900">Cartão</p>
                  <p className="text-xs text-gray-500">Débito ou crédito</p>
                </div>
                <div className="text-violet-400 group-hover:text-violet-600 transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9,18 15,12 9,6"/></svg>
                </div>
              </button>
            </div>
          ) : selectedMethod === "PIX" && qrCodeUrl ? (
            <div className="flex flex-col items-center space-y-4">
              <img src={qrCodeUrl} alt="QR Code PIX" className="w-44 h-44 rounded-lg border border-gray-200" />
              <div className="text-center w-full">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Chave PIX</p>
                <p className="font-mono text-xs bg-gray-50 p-2 rounded-lg border border-gray-200 truncate text-gray-700">
                  {pixData?.key || "Não configurada"}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-3">
                {selectedMethod === "CASH" && <DollarSign size={28} className="text-green-600" />}
                {selectedMethod === "CARD" && <CreditCard size={28} className="text-blue-600" />}
              </div>
              <p className="font-bold text-lg text-gray-900">
                {selectedMethod === "CASH" ? "Dinheiro" : "Cartão"}
              </p>
              <p className="text-sm text-gray-500 mt-1">Confirme o pagamento abaixo</p>
            </div>
          )}
        </div>

        {/* Footer - Sempre visível */}
        <div className="p-4 border-t border-gray-200 flex gap-3 flex-shrink-0">
          <button
            onClick={() => {
              if (selectedMethod) {
                setSelectedMethod(null);
                setQrCodeUrl(null);
              } else {
                onClose();
              }
            }}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors"
          >
            {selectedMethod ? "Voltar" : "Cancelar"}
          </button>
          {selectedMethod && (
            <button
              onClick={() => onPayment(selectedMethod)}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors"
            >
              Confirmar Pagamento
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
