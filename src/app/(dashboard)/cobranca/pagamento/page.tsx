"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  DollarSign,
  Camera,
  Check,
  MapPin,
  CreditCard,
  Banknote,
  Smartphone,
  QrCode,
  X,
  ImageIcon,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Installment {
  id: string;
  numero: number;
  valor: number;
  dueDate: string;
  status: string;
}

interface Client {
  id: string;
  name: string;
  address: string;
  neighborhood: string;
  phone: string | null;
}

interface RouteStop {
  id: string;
  client: Client;
  installments: Installment[];
}

function PagamentoPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const stopId = searchParams?.get("stopId");
  const clientId = searchParams?.get("clientId");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stop, setStop] = useState<RouteStop | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedInstallments, setSelectedInstallments] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [amountReceived, setAmountReceived] = useState<number>(0);
  const [changeAmount, setChangeAmount] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [receiptPhoto, setReceiptPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (stopId && clientId) {
      loadStopData();
      getCurrentLocation();
    }
  }, [session, status, stopId, clientId]);

  async function loadStopData() {
    try {
      const res = await fetch(`/api/collection-routes/stops/${stopId}`);
      const data = await res.json();
      if (data.stop) {
        setStop(data.stop);
        setSelectedInstallments(data.stop.installments.map((i: Installment) => i.id));
        calculateTotal(data.stop.installments, data.stop.installments.map((i: Installment) => i.id));
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  }

  function getCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Erro ao obter localização:", error);
        }
      );
    }
  }

  function calculateTotal(installments: Installment[], selection: string[]) {
    const total = installments
      .filter((i) => selection.includes(i.id))
      .reduce((sum, i) => sum + i.valor, 0);
    setAmountReceived(total);
    setChangeAmount(0);
  }

  function toggleInstallment(installmentId: string) {
    const newSelection = selectedInstallments.includes(installmentId)
      ? selectedInstallments.filter((id) => id !== installmentId)
      : [...selectedInstallments, installmentId];
    
    setSelectedInstallments(newSelection);
    
    if (stop) {
      calculateTotal(stop.installments, newSelection);
    }
  }

  function handleAmountChange(value: number) {
    setAmountReceived(value);
    if (stop) {
      const total = stop.installments
        .filter((i) => selectedInstallments.includes(i.id))
        .reduce((sum, i) => sum + i.valor, 0);
      setChangeAmount(Math.max(0, value - total));
    }
  }

  // Camera functions
  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setShowCamera(true);
    } catch (error) {
      console.error("Erro ao acessar câmera:", error);
      alert("Não foi possível acessar a câmera. Tente selecionar uma foto da galeria.");
      fileInputRef.current?.click();
    }
  }

  function stopCamera() {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
  }

  function capturePhoto() {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `receipt_${Date.now()}.jpg`, { type: "image/jpeg" });
          setReceiptPhoto(file);
          setPhotoPreview(URL.createObjectURL(blob));
        }
      }, "image/jpeg", 0.8);
      
      stopCamera();
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  }

  function removePhoto() {
    setReceiptPhoto(null);
    setPhotoPreview(null);
  }

  async function handleSubmit() {
    if (selectedInstallments.length === 0) {
      alert("Selecione pelo menos uma parcela");
      return;
    }

    setSaving(true);

    try {
      const formData = new FormData();
      formData.append("stopId", stopId || "");
      formData.append("clientId", clientId || "");
      formData.append("installmentIds", JSON.stringify(selectedInstallments));
      formData.append("paymentMethod", paymentMethod);
      formData.append("amountReceived", amountReceived.toString());
      formData.append("changeAmount", changeAmount.toString());
      formData.append("notes", notes);
      if (location?.lat) formData.append("latitude", location.lat.toString());
      if (location?.lng) formData.append("longitude", location.lng.toString());
      if (receiptPhoto) formData.append("receiptPhoto", receiptPhoto);

      const res = await fetch("/api/payments", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setReceiptData(data);
        setShowSuccess(true);
      } else {
        alert(data.error || "Erro ao registrar pagamento");
      }
    } catch (error) {
      console.error("Erro ao salvar pagamento:", error);
      alert("Erro ao registrar pagamento");
    } finally {
      setSaving(false);
    }
  }

  function handleBack() {
    router.push("/cobranca");
  }

  function handleFinish() {
    router.push("/cobranca");
  }

  function handlePrintReceipt() {
    if (receiptData?.receiptId) {
      window.open(`/cobranca/recibo/${receiptData.receiptId}`, "_blank");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!stop) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-slate-600">Dados não encontrados</p>
          <button
            onClick={handleBack}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  const totalAmount = stop.installments
    .filter((i) => selectedInstallments.includes(i.id))
    .reduce((sum, i) => sum + i.valor, 0);

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="flex-1 relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>
          <div className="bg-black p-4 flex items-center justify-between">
            <button
              onClick={stopCamera}
              className="p-3 text-white"
            >
              <X size={28} />
            </button>
            <button
              onClick={capturePhoto}
              className="w-16 h-16 bg-white rounded-full border-4 border-slate-300 flex items-center justify-center"
            >
              <div className="w-12 h-12 bg-white rounded-full border-2 border-slate-900"></div>
            </button>
            <div className="w-12"></div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="p-2 -ml-2 text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Receber Pagamento</h1>
              <p className="text-sm text-slate-500">{stop.client.name}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={32} className="text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Pagamento Registrado!</h2>
            <p className="text-slate-600 mb-6">O pagamento foi registrado com sucesso.</p>
            <div className="space-y-3">
              <button
                onClick={handlePrintReceipt}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-xl font-medium"
              >
                Imprimir Recibo
              </button>
              <button
                onClick={handleFinish}
                className="w-full py-3 px-4 bg-slate-100 text-slate-700 rounded-xl font-medium"
              >
                Voltar à Rota
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 space-y-4">
        {/* Client Info Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
              <MapPin size={20} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900">{stop.client.name}</h3>
              <p className="text-sm text-slate-500">{stop.client.neighborhood}</p>
              <p className="text-xs text-slate-400">{stop.client.address}</p>
              {location && (
                <p className="text-xs text-green-600 mt-1">GPS: Localização capturada</p>
              )}
            </div>
          </div>
        </div>

        {/* Installments Selection */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-900 mb-3">Parcelas a Receber</h3>
          <div className="space-y-2">
            {stop.installments.map((installment) => (
              <label
                key={installment.id}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  selectedInstallments.includes(installment.id)
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 hover:border-blue-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedInstallments.includes(installment.id)}
                  onChange={() => toggleInstallment(installment.id)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-900">{installment.numero}ª Parcela</span>
                    <span className="font-bold text-slate-900">R$ {installment.valor.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Venc: {format(new Date(installment.dueDate), "dd/MM/yyyy")}
                    {installment.status === "LATE" && (
                      <span className="ml-2 text-red-600 font-medium">(ATRASADA)</span>
                    )}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-900 mb-3">Forma de Pagamento</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "CASH", icon: Banknote, label: "Dinheiro" },
              { id: "PIX", icon: QrCode, label: "PIX" },
              { id: "CARD", icon: CreditCard, label: "Cartão" },
              { id: "OTHER", icon: Smartphone, label: "Outro" },
            ].map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setPaymentMethod(id)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-colors ${
                  paymentMethod === id
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-slate-200 hover:border-blue-300"
                }`}
              >
                <Icon size={24} />
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Amount Received */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-900 mb-3">Valores</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Valor Total</label>
              <div className="text-2xl font-bold text-slate-900">R$ {totalAmount.toFixed(2)}</div>
            </div>
            {paymentMethod === "CASH" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Valor Recebido</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={amountReceived}
                      onChange={(e) => handleAmountChange(parseFloat(e.target.value) || 0)}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                {changeAmount > 0 && (
                  <div className="p-3 bg-green-50 rounded-xl">
                    <span className="text-sm text-slate-600">Troco: </span>
                    <span className="font-bold text-green-700">R$ {changeAmount.toFixed(2)}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Receipt Photo */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-900 mb-3">Foto do Comprovante</h3>
          
          {photoPreview ? (
            <div className="relative">
              <img
                src={photoPreview}
                alt="Comprovante"
                className="w-full h-48 object-cover rounded-xl"
              />
              <button
                onClick={removePhoto}
                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={startCamera}
                className="flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <Camera size={32} className="text-slate-400" />
                <span className="text-sm font-medium text-slate-600">Tirar Foto</span>
              </button>
              
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <ImageIcon size={32} className="text-slate-400" />
                <span className="text-sm font-medium text-slate-600">Galeria</span>
              </button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">Observações (opcional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Ex: Cliente pagou adiantado, desconto aplicado..."
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4">
        <button
          onClick={handleSubmit}
          disabled={saving || selectedInstallments.length === 0}
          className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Salvando...
            </>
          ) : (
            <>
              <DollarSign size={24} />
              Confirmar Recebimento
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function PagamentoPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <PagamentoPageContent />
    </Suspense>
  );
}
