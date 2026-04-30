"use client";

import { useState } from "react";
import Link from "next/link";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const validateEmail = (value: string): string => {
    if (!value) return "Email é obrigatório";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Digite um email válido";
    return "";
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Aqui você faria uma chamada ao seu API para enviar o email de reset
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Erro ao enviar email. Tente novamente.");
        return;
      }

      setSubmitted(true);
      setEmail("");
    } catch (err) {
      setError("Erro ao conectar. Tente novamente mais tarde.");
      console.error("Reset error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-100/40 rounded-full blur-3xl" />
      </div>

      <div className="relative bg-white border border-gray-200 p-8 rounded-2xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
            Redefinir Senha
          </h1>
          <p className="text-gray-600 mt-1 text-sm">
            {submitted
              ? "Verifique seu email"
              : "Vamos ajudá-lo a recuperar sua conta"}
          </p>
        </div>

        {submitted ? (
          <div className="space-y-6">
            {/* Success message */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-green-800">
                    Email enviado com sucesso!
                  </h3>
                  <p className="text-sm text-green-700 mt-1">
                    Enviamos um link de redefinição de senha para{" "}
                    <span className="font-medium">{email}</span>. Verifique seu
                    email e siga as instruções.
                  </p>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <p className="text-xs font-medium text-blue-900 uppercase">
                Dicas úteis:
              </p>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• O link expira em 1 hora</li>
                <li>• Verifique sua pasta de spam</li>
                <li>• Se não receber, tente novamente em alguns minutos</li>
              </ul>
            </div>

            {/* Back to login */}
            <button
              onClick={() => setSubmitted(false)}
              className="w-full text-sm text-blue-600 hover:text-blue-700 transition font-medium"
            >
              ← Tentar outro email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Error message */}
            {error && (
              <div
                role="alert"
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
              >
                {error}
              </div>
            )}

            {/* Email input */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
                disabled={loading}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
                placeholder="seu@email.com"
                required
              />
              <p className="text-xs text-gray-600 mt-1.5">
                Digite o email associado à sua conta
              </p>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Enviando...</span>
                </>
              ) : (
                "Enviar Email de Redefinição"
              )}
            </button>

            {/* Back to login */}
            <div className="text-center pt-2 border-t border-gray-200">
              <Link
                href="/login"
                className="text-sm text-blue-600 hover:text-blue-700 transition font-medium"
              >
                ← Voltar ao Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
