"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoginSchema } from "@/_lib/definitions";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  // Estados del flujo claro: "check" (ingresar email), "password" (ingresar contraseña) o "verification-sent"
  const [step, setStep] = useState<"email" | "password" | "verification-sent">("email");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setLoading(true);

    if (!email.endsWith("@patprimo.com.co")) {
      setError("Solo se permiten correos con dominio @patprimo.com.co");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al verificar el correo.");
      }

      if (data.action === "verification-sent") {
        setSuccessMessage(data.message);
        setStep("verification-sent");
      } else if (data.action === "set-password") {
        // Redirigir a asignación de contraseña (flujo de registro inicial limpio)
        router.push(`/set-password?email=${encodeURIComponent(email)}`);
      } else if (data.action === "login") {
        // Mostrar campo de contraseña
        setStep("password");
      }
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setLoading(true);

    // Validar esquema en cliente
    const result = LoginSchema.safeParse({ email, password });
    if (!result.success) {
      setFieldErrors(result.error.flatten().fieldErrors);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        // Extraer mensaje de error plano si viene como objeto de validación
        if (data.error && typeof data.error === "object") {
          const firstErrKey = Object.keys(data.error)[0];
          const firstErrMessage = data.error[firstErrKey]?.[0];
          throw new Error(firstErrMessage || "Datos inválidos");
        }
        throw new Error(data.error || "Contraseña o credenciales inválidas.");
      }

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl relative overflow-hidden backdrop-blur-md bg-opacity-70 animate-fade-in-up">
      {/* Glow Effect */}
      <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl pointer-events-none" />

      <h2 className="text-2xl font-medium tracking-tight text-white mb-2 text-center">
        Eli informes diarios
      </h2>
      <p className="text-gray-400 text-sm mb-8 text-center">
        {step === "email" 
          ? "Ingresa con tu correo corporativo" 
          : "Introduce tu contraseña para acceder"
        }
      </p>

      {error && (
        <div className="p-3 mb-6 bg-red-950/50 border border-red-900/50 text-red-200 text-sm rounded-lg text-center animate-shake">
          {error}
        </div>
      )}

      {step === "email" ? (
        <form onSubmit={handleEmailSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2" htmlFor="email">
              Correo Electrónico
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-black/50 border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all text-sm"
              placeholder="usuario@patprimo.com.co"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 focus:outline-none transition-all flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>Continuar</span>
            )}
          </button>
        </form>
      ) : step === "verification-sent" ? (
        <div className="space-y-6 text-center animate-fade-in">
          <div className="w-16 h-16 bg-white/10 text-white border border-white/20 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l8-5.333a2 2 0 012.22 0l8 5.333A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-2.25-1.5a2 2 0 00-2.22 0l-2.25 1.5" />
            </svg>
          </div>
          <div className="space-y-2">
            <h3 className="font-bold text-white text-lg">Revisa tu bandeja</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              {successMessage || "Hemos enviado un correo de verificación. Activa tu cuenta para poder asignar tu contraseña."}
            </p>
          </div>
          <button
            onClick={() => setStep("email")}
            className="text-xs text-gray-400 hover:text-white underline transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      ) : (
        <form onSubmit={handleLoginSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2" htmlFor="email">
              Correo Electrónico
            </label>
            <input
              id="email"
              type="email"
              value={email}
              disabled
              className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-lg text-gray-500 text-sm opacity-60 cursor-not-allowed"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400" htmlFor="password">
                Contraseña
              </label>
              <button
                type="button"
                onClick={() => setStep("email")}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                Cambiar correo
              </button>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-4 pr-10 py-3 bg-black/50 border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all text-sm"
                placeholder="••••••••"
                required
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="text-red-400 text-xs mt-1">{fieldErrors.password[0]}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 focus:outline-none transition-all flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>Ingresar</span>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
