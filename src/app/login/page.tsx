"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, Suspense } from "react";

interface FieldErrors {
  email: string;
  password: string;
}

function validateEmail(email: string): string {
  if (!email) return "Email é obrigatório";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Digite um email válido";
  return "";
}

function validatePassword(password: string): string {
  if (!password) return "Senha é obrigatória";
  if (password.length < 6) return "Senha deve ter pelo menos 6 caracteres";
  return "";
}

interface LoginAttempt {
  timestamp: number;
}

const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutos

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailInputRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({ email: "", password: "" });
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTimeRemaining, setLockoutTimeRemaining] = useState(0);

  // Auto-focus no email input
  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  // Carregar tentativas de login do localStorage
  useEffect(() => {
    const stored = localStorage.getItem("login_attempts");
    if (stored) {
      const attempts = JSON.parse(stored) as LoginAttempt[];
      const now = Date.now();
      
      // Remove tentativas antigas (fora da janela de lockout)
      const recentAttempts = attempts.filter(
        (attempt) => now - attempt.timestamp < LOCKOUT_TIME
      );
      
      setLoginAttempts(recentAttempts);
      localStorage.setItem("login_attempts", JSON.stringify(recentAttempts));

      if (recentAttempts.length >= MAX_ATTEMPTS) {
        const oldestAttempt = recentAttempts[0];
        const timeUntilUnlock = Math.ceil(
          (LOCKOUT_TIME - (now - oldestAttempt.timestamp)) / 1000 / 60
        );
        setIsLocked(true);
        setLockoutTimeRemaining(timeUntilUnlock);
      }
    }
  }, []);

  // Atualizar contador de desbloqueio
  useEffect(() => {
    if (!isLocked) return;
    
    const interval = setInterval(() => {
      setLockoutTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsLocked(false);
          setLoginAttempts([]);
          localStorage.removeItem("login_attempts");
          return 0;
        }
        return prev - 1;
      });
    }, 60000); // Update a cada minuto

    return () => clearInterval(interval);
  }, [isLocked]);

  // Validação em tempo real - Email
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: validateEmail(value) }));
    }
    if (generalError) setGeneralError("");
  };

  // Validação em tempo real - Senha
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: validatePassword(value) }));
    }
    if (generalError) setGeneralError("");
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (isLocked) {
      setGeneralError(`Muitas tentativas. Tente novamente em ${lockoutTimeRemaining} minuto(s).`);
      return;
    }

    // Validar campos
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (emailError || passwordError) {
      setErrors({ email: emailError, password: passwordError });
      return;
    }

    setLoading(true);
    setGeneralError("");
    setErrors({ email: "", password: "" });

    const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        // Adicionar tentativa de login falhada
        const newAttempts = [
          ...loginAttempts,
          { timestamp: Date.now() },
        ];
        
        if (newAttempts.length >= MAX_ATTEMPTS) {
          setIsLocked(true);
          setLockoutTimeRemaining(Math.ceil(LOCKOUT_TIME / 1000 / 60));
          setGeneralError(`Muitas tentativas. Tente novamente em ${Math.ceil(LOCKOUT_TIME / 1000 / 60)} minuto(s).`);
        } else {
          const remaining = MAX_ATTEMPTS - newAttempts.length;
          setGeneralError(
            remaining > 0
              ? `Email ou senha inválidos. ${remaining} tentativa(s) restante(s).`
              : "Email ou senha inválidos"
          );
        }
        
        setLoginAttempts(newAttempts);
        localStorage.setItem("login_attempts", JSON.stringify(newAttempts));
      } else if (result?.url) {
        // Login bem-sucedido - limpar tentativas
        localStorage.removeItem("login_attempts");
        
        if (rememberMe) {
          localStorage.setItem("rememberEmail", email);
        }
        
        router.push(result.url);
      }
    } catch (error) {
      setGeneralError("Erro ao conectar. Tente novamente.");
      console.error("Login error:", error);
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
            <img
              src="/logo-oficial.png"
              alt="Posthumous"
              className="w-10 h-10 object-contain"
            />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
            Posthumous
          </h1>
          <p className="text-gray-600 mt-1 text-sm">
            Gestão de Serviços Póstumos
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Error message */}
          {generalError && (
            <div
              role="alert"
              id="form-error"
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
            >
              {generalError}
            </div>
          )}

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Email
            </label>
            <input
              ref={emailInputRef}
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={handleEmailChange}
              disabled={loading || isLocked}
              aria-describedby={errors.email ? "email-error" : undefined}
              aria-invalid={!!errors.email}
              className={`w-full px-4 py-2.5 bg-white border rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:border-transparent outline-none disabled:opacity-50 disabled:cursor-not-allowed transition text-sm ${
                errors.email
                  ? "border-red-300 focus:ring-red-400"
                  : "border-gray-300 focus:ring-blue-400"
              }`}
              placeholder="seu@email.com"
              required
            />
            {errors.email && (
              <p id="email-error" className="text-red-600 text-xs mt-1">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Senha
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={handlePasswordChange}
                disabled={loading || isLocked}
                aria-describedby={errors.password ? "password-error" : undefined}
                aria-invalid={!!errors.password}
                className={`w-full px-4 py-2.5 bg-white border rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:border-transparent outline-none disabled:opacity-50 disabled:cursor-not-allowed transition text-sm pr-10 ${
                  errors.password
                    ? "border-red-300 focus:ring-red-400"
                    : "border-gray-300 focus:ring-blue-400"
                }`}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading || isLocked}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50 transition"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856A3.375 3.375 0 1115.75 12M15 12a3 3 0 11-6 0m6 0a3 3 0 1-6 0m6 0a3 3 0 11-6 0m6 0a3 3 0 1-6 0" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <p id="password-error" className="text-red-600 text-xs mt-1">
                {errors.password}
              </p>
            )}
          </div>

          {/* Remember me */}
          <div className="flex items-center">
            <input
              id="remember"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={loading || isLocked}
              className="w-4 h-4 rounded border-gray-300 bg-white text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
            />
            <label
              htmlFor="remember"
              className="ml-2 text-sm text-gray-700 cursor-pointer hover:text-gray-900 transition disabled:opacity-50"
            >
              Manter-me conectado
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || isLocked}
            aria-busy={loading}
            className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2 text-sm"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
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
                <span>Entrando...</span>
              </>
            ) : isLocked ? (
              `Bloqueado por ${lockoutTimeRemaining} min`
            ) : (
              "Entrar"
            )}
          </button>

          {/* Links */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <a
              href="/auth/reset-password"
              className="text-sm text-blue-600 hover:text-blue-700 transition font-medium"
            >
              Esqueci minha senha
            </a>
            <a
              href="/support"
              className="text-sm text-gray-600 hover:text-gray-700 transition"
            >
              Suporte
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}
