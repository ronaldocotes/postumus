"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { X, CheckCircle, AlertCircle, Loader2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "loading" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  loading: (message: string) => string; // retorna id para atualizar depois
  dismiss: (id: string) => void;
  update: (id: string, message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = "info", duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    if (duration > 0 && type !== "loading") {
      setTimeout(() => dismiss(id), duration);
    }

    return id;
  }, [dismiss]);

  const success = useCallback((message: string, duration = 3000) => {
    return toast(message, "success", duration);
  }, [toast]);

  const error = useCallback((message: string, duration = 4000) => {
    return toast(message, "error", duration);
  }, [toast]);

  const loading = useCallback((message: string) => {
    return toast(message, "loading", 0); // 0 = não fecha automaticamente
  }, [toast]);

  const update = useCallback((id: string, message: string, type: ToastType) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, message, type } : t))
    );

    if (type !== "loading") {
      setTimeout(() => dismiss(id), 3000);
    }
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toast, success, error, loading, dismiss, update }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast deve ser usado dentro de ToastProvider");
  }
  return context;
}

// Componente de container dos toasts
function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

// Componente individual de toast
function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const icons = {
    success: <CheckCircle size={20} className="text-green-500" />,
    error: <AlertCircle size={20} className="text-red-500" />,
    loading: <Loader2 size={20} className="text-blue-500 animate-spin" />,
    info: <Info size={20} className="text-blue-500" />,
  };

  const bgColors = {
    success: "bg-white border-green-200 shadow-green-100",
    error: "bg-white border-red-200 shadow-red-100",
    loading: "bg-white border-blue-200 shadow-blue-100",
    info: "bg-white border-blue-200 shadow-blue-100",
  };

  return (
    <div
      className={cn(
        "pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg min-w-[320px] max-w-[420px]",
        "transform transition-all duration-300 ease-out",
        "animate-in slide-in-from-right-full fade-in",
        bgColors[toast.type]
      )}
    >
      <div className="shrink-0">{icons[toast.type]}</div>
      
      <p className="flex-1 text-sm font-medium text-slate-700">{toast.message}</p>
      
      {toast.type !== "loading" && (
        <button
          onClick={() => onDismiss(toast.id)}
          className="shrink-0 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
