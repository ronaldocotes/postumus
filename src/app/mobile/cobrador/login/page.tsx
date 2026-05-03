"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function CobradorLoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) {
      setError("Digite pelo menos 4 dígitos");
      return;
    }
    setLoading(true);
    setError("");

    // Try to find user by PIN via API, then sign in
    try {
      const res = await fetch("/api/cobrador/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "PIN inválido");
      }

      const { email } = await res.json();

      // Sign in with email + a dummy password that the API will validate
      const signInRes = await signIn("credentials", {
        email,
        password: "__PIN_AUTH__",
        redirect: false,
      });

      if (signInRes?.error) {
        throw new Error("Erro ao autenticar");
      }

      router.push("/mobile/cobrador");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const addDigit = (d: string) => {
    if (pin.length >= 6) return;
    setPin((p) => p + d);
    setError("");
  };

  const removeDigit = () => {
    setPin((p) => p.slice(0, -1));
    setError("");
  };

  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "←"];

  return (
    <div className="min-h-screen bg-blue-600 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-xs">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Cobrador</h1>
          <p className="text-blue-200 text-sm mt-1">Digite seu PIN</p>
        </div>

        {/* PIN Display */}
        <div className="flex justify-center gap-3 mb-8">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all ${
                i < pin.length ? "bg-white scale-110" : "bg-white/30"
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-red-200 text-sm text-center mb-4 font-medium">{error}</p>
        )}

        {/* Keypad */}
        <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-3">
          {digits.map((d, i) => {
            if (d === "") {
              return <div key={i} />;
            }
            if (d === "←") {
              return (
                <button
                  key={i}
                  type="button"
                  onClick={removeDigit}
                  className="h-16 rounded-2xl bg-white/10 text-white text-xl font-medium active:bg-white/20 transition-colors flex items-center justify-center"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                    <line x1="18" y1="9" x2="12" y2="15" />
                    <line x1="12" y1="9" x2="18" y2="15" />
                  </svg>
                </button>
              );
            }
            return (
              <button
                key={i}
                type="button"
                onClick={() => addDigit(d)}
                className="h-16 rounded-2xl bg-white/10 text-white text-2xl font-medium active:bg-white/20 transition-colors"
              >
                {d}
              </button>
            );
          })}

          <button
            type="submit"
            disabled={loading || pin.length < 4}
            className="col-span-3 mt-2 h-14 rounded-2xl bg-white text-blue-600 font-bold text-lg active:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <a
          href="/login"
          className="block text-center text-blue-200 text-sm mt-6 active:text-white"
        >
          Entrar com email e senha
        </a>
      </div>
    </div>
  );
}
