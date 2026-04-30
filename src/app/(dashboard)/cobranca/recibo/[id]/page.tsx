"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Printer, CheckCircle } from "lucide-react";

interface PaymentData {
  id: string;
  paidAmount: number;
  paidAt: string;
  paymentMethod: string;
  paymentLocation: string;
  notes: string | null;
  receivedBy: {
    name: string;
  } | null;
  installment: {
    numero: number;
    valor: number;
    carne: {
      year: number;
      client: {
        name: string;
        address: string;
        neighborhood: string;
      };
    };
  };
}

export default function ReciboPage() {
  const params = useParams();
  const paymentId = params.id as string;
  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (paymentId) {
      loadPaymentData();
    }
  }, [paymentId]);

  async function loadPaymentData() {
    try {
      const res = await fetch(`/api/payments/${paymentId}`);
      const data = await res.json();
      if (data.payment) {
        setPayment(data.payment);
      }
    } catch (error) {
      console.error("Erro ao carregar pagamento:", error);
    } finally {
      setLoading(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  function getPaymentMethodLabel(method: string) {
    const labels: Record<string, string> = {
      CASH: "Dinheiro",
      PIX: "PIX",
      CARD: "Cartão",
      BANK_TRANSFER: "Transferência",
      OTHER: "Outro",
    };
    return labels[method] || method;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-600">Recibo não encontrado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-8 print:bg-white print:py-0">
      {/* Print Button - hidden when printing */}
      <div className="max-w-md mx-auto px-4 mb-4 print:hidden">
        <button
          onClick={handlePrint}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium flex items-center justify-center gap-2"
        >
          <Printer size={20} />
          Imprimir Recibo
        </button>
      </div>

      {/* Receipt */}
      <div className="max-w-md mx-auto bg-white shadow-lg print:shadow-none">
        {/* Header */}
        <div className="bg-blue-600 text-white p-6 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold">RECIBO DE PAGAMENTO</h1>
          <p className="text-blue-100 mt-1">Nº {payment.id.slice(-8).toUpperCase()}</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Amount */}
          <div className="text-center py-4 border-b border-slate-200">
            <p className="text-sm text-slate-500 mb-1">VALOR RECEBIDO</p>
            <p className="text-4xl font-bold text-slate-900">
              R$ {payment.paidAmount.toFixed(2)}
            </p>
          </div>

          {/* Details */}
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Data</span>
              <span className="font-medium">
                {format(new Date(payment.paidAt), "dd/MM/yyyy HH:mm", {
                  locale: ptBR,
                })}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Forma de Pagamento</span>
              <span className="font-medium">
                {getPaymentMethodLabel(payment.paymentMethod)}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Parcela</span>
              <span className="font-medium">
                {payment.installment.numero}ª Parcela - {payment.installment.carne.year}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Recebido por</span>
              <span className="font-medium">
                {payment.receivedBy?.name || "Cobrador"}
              </span>
            </div>
          </div>

          {/* Client Info */}
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-sm text-slate-500 mb-2">CLIENTE</p>
            <p className="font-semibold text-slate-900">
              {payment.installment.carne.client.name}
            </p>
            <p className="text-sm text-slate-600">
              {payment.installment.carne.client.address}
            </p>
            {payment.installment.carne.client.neighborhood && (
              <p className="text-sm text-slate-600">
                {payment.installment.carne.client.neighborhood}
              </p>
            )}
          </div>

          {payment.notes && (
            <div className="bg-amber-50 rounded-xl p-4">
              <p className="text-sm text-amber-800">
                <strong>Observações:</strong> {payment.notes}
              </p>
            </div>
          )}

          {/* Signature */}
          <div className="pt-8 border-t border-slate-200">
            <div className="flex justify-between items-end">
              <div className="flex-1">
                <div className="border-b border-slate-400 pb-2 mb-2"></div>
                <p className="text-xs text-slate-500 text-center">
                  Assinatura do Cliente
                </p>
              </div>
              <div className="w-16"></div>
              <div className="flex-1">
                <div className="border-b border-slate-400 pb-2 mb-2"></div>
                <p className="text-xs text-slate-500 text-center">
                  Assinatura do Cobrador
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center pt-6 border-t border-slate-200">
            <p className="text-xs text-slate-400">
              Documento gerado eletronicamente
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Posthumous - Sistema de Gestão Funerária
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
