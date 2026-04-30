import { useState, useEffect } from "react";
import QRCode from "qrcode";
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
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  useEffect(() => {
    if (selectedMethod === "PIX" && pixData?.key) {
      generateQRCode();
    }
  }, [selectedMethod, pixData]);

  const generateQRCode = async () => {
    try {
      // Generate EMV BR Code payload for PIX
      const payload = generatePixPayload(installmentValue);
      const qr = await QRCode.toDataURL(payload);
      setQrCodeUrl(qr);
    } catch (error) {
      console.error("Erro ao gerar QR Code:", error);
    }
  };

  const generatePixPayload = (value: number): string => {
    // EMV BR Code Structure for PIX
    // This is a simplified version - production would use brcode library
    const pixKey = pixData?.key || "";
    const pixName = pixData?.name || "";
    const pixCity = pixData?.city || "";

    // Format: 00020126360014br.gov.bcb.pix...
    // For now, returning a basic payload structure
    // In production, use @brcode/brcode library for proper encoding

    const brCode = generateBrCode({
      key: pixKey,
      name: pixName,
      city: pixCity,
      value,
    });

    return brCode;
  };

  // Simplified BR Code generator (production should use proper library)
  const generateBrCode = ({
    key,
    name,
    city,
    value,
  }: {
    key: string;
    name: string;
    city: string;
    value: number;
  }): string => {
    // This is a basic implementation
    // For production, install: npm install @brcode/brcode
    const payload = `00020126360014br.gov.bcb.pix0136${key}520400005303986540${value
      .toFixed(2)
      .replace(".", "")}5802BR5913${name.padEnd(30)}6009${city.padEnd(15)}62410503***63041D3D`;
    return payload;
  };

  if (!isOpen) return null;

  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 text-white flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Registrar Pagamento</h2>
            <p className="text-sm text-slate-300 mt-1">{clientName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Value Display */}
        <div className="bg-slate-50 border-b border-slate-200 p-6 text-center">
          <p className="text-sm text-slate-600 mb-2">Valor da Parcela</p>
          <p className="text-3xl font-bold text-slate-900">{fmt(installmentValue)}</p>
        </div>

        {/* Payment Options */}
        {!selectedMethod ? (
          <div className="p-6 space-y-3">
            {/* Dinheiro */}
            <button
              onClick={() => setSelectedMethod("CASH")}
              className="w-full group relative overflow-hidden rounded-lg border-2 border-transparent bg-gradient-to-br from-emerald-50 to-green-50 p-4 hover:border-emerald-500 transition-all hover:shadow-lg"
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                  <DollarSign size={24} className="text-emerald-600" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-900">Dinheiro</p>
                  <p className="text-sm text-slate-600">Pagamento em espécie</p>
                </div>
              </div>
            </button>

            {/* PIX */}
            {pixData?.key && (
              <button
                onClick={() => setSelectedMethod("PIX")}
                className="w-full group relative overflow-hidden rounded-lg border-2 border-transparent bg-gradient-to-br from-cyan-50 to-blue-50 p-4 hover:border-cyan-500 transition-all hover:shadow-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-cyan-100 flex items-center justify-center group-hover:bg-cyan-200 transition-colors">
                    <QrCode size={24} className="text-cyan-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-slate-900">PIX</p>
                    <p className="text-sm text-slate-600">Escaneie o QR Code</p>
                  </div>
                </div>
              </button>
            )}

            {/* Cartão */}
            <button
              onClick={() => setSelectedMethod("CARD")}
              className="w-full group relative overflow-hidden rounded-lg border-2 border-transparent bg-gradient-to-br from-blue-50 to-indigo-50 p-4 hover:border-blue-500 transition-all hover:shadow-lg"
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <CreditCard size={24} className="text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-900">Cartão</p>
                  <p className="text-sm text-slate-600">Débito ou crédito</p>
                </div>
              </div>
            </button>
          </div>
        ) : selectedMethod === "PIX" ? (
          /* PIX QR Code Display */
          <div className="p-6 space-y-4">
            <div className="bg-slate-50 rounded-lg p-6 flex flex-col items-center">
              {qrCodeUrl && (
                <img src={qrCodeUrl} alt="QR Code PIX" className="w-48 h-48 rounded-lg" />
              )}
              <div className="mt-4 text-center">
                <p className="text-sm text-slate-600 mb-2">Chave PIX</p>
                <p className="font-mono text-sm bg-white p-2 rounded border border-slate-200 truncate w-full">
                  {pixData?.key}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSelectedMethod(null);
                  setQrCodeUrl(null);
                }}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
              >
                Voltar
              </button>
              <button
                onClick={() => onPayment("PIX")}
                className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 font-medium"
              >
                Confirmar PIX
              </button>
            </div>
          </div>
        ) : (
          /* Confirmation Screen */
          <div className="p-6 space-y-4">
            <div className="bg-slate-50 rounded-lg p-4 text-center">
              <p className="text-sm text-slate-600 mb-2">Método Selecionado</p>
              <p className="font-bold text-lg text-slate-900">
                {selectedMethod === "CASH"
                  ? "Dinheiro"
                  : selectedMethod === "CARD"
                    ? "Cartão"
                    : "PIX"}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedMethod(null)}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
              >
                Voltar
              </button>
              <button
                onClick={() => onPayment(selectedMethod!)}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
              >
                Confirmar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
