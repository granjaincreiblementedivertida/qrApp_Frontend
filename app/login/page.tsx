"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useState } from "react"
import {
  type UserSession,
  loginWithPassword,
  register,
  loginWithGoogle,
} from "@/lib/api-client"
import { saveSession } from "@/lib/auth-storage"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { GoogleLogin } from "@react-oauth/google"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get("next") || "/crear-evento"

  const [authMode, setAuthMode] = useState<"login" | "register">("login")
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [registerName, setRegisterName] = useState("")
  const [registerEmail, setRegisterEmail] = useState("")
  const [registerPassword, setRegisterPassword] = useState("")
  const [registerPasswordConfirm, setRegisterPasswordConfirm] = useState("")
  const [loginLoading, setLoginLoading] = useState(false)
  const [registerLoading, setRegisterLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const finishAuth = async (session: UserSession) => {
    saveSession(session)
    router.replace(next)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginLoading(true)
    setError(null)
    try {
      const session = await loginWithPassword(loginEmail.trim(), loginPassword)
      await finishAuth(session)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión")
    } finally {
      setLoginLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (registerPassword !== registerPasswordConfirm) {
      setError("Las contraseñas no coinciden")
      return
    }
    if (registerPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      return
    }
    setRegisterLoading(true)
    try {
      const session = await register(registerEmail.trim(), registerPassword, registerName.trim() || undefined)
      await finishAuth(session)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear la cuenta")
    } finally {
      setRegisterLoading(false)
    }
  }

  const handleGoogleSuccess = async (credential: string) => {
    setError(null)
    try {
      const session = await loginWithGoogle(credential)
      await finishAuth(session)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión con Google")
    }
  }

  return (
    <div className="min-h-screen bg-brand-dark text-white font-sans flex flex-col">
      <nav className="border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-accent to-brand-vibrant rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight">{process.env.NEXT_PUBLIC_APP_NAME}<span className="text-brand-accent">QR</span></span>
          </Link>
          <Link href="/" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
            Inicio
          </Link>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <section className="w-full max-w-md rounded-2xl border border-white/10 bg-brand-card p-8 shadow-xl">
          <h1 className="text-2xl font-bold mb-2">
            {authMode === "login" ? "Inicia sesión" : "Crear cuenta"}
          </h1>
          <p className="text-gray-400 text-sm mb-6">
            {authMode === "login"
              ? "Entra con tu email o con Google para continuar."
              : "Regístrate gratis para crear y gestionar tus eventos."}
          </p>

          <div className="flex rounded-xl bg-brand-dark border border-white/10 p-1 mb-6">
            <button
              type="button"
              onClick={() => setAuthMode("login")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${authMode === "login" ? "bg-brand-accent text-white" : "text-gray-400 hover:text-white"}`}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={() => setAuthMode("register")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${authMode === "register" ? "bg-brand-accent text-white" : "text-gray-400 hover:text-white"}`}
            >
              Crear cuenta
            </button>
          </div>

          {authMode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="login-email" className="text-gray-300">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="mt-1.5 bg-brand-dark border-white/10 text-white placeholder:text-gray-500"
                  required
                />
              </div>
              <div>
                <Label htmlFor="login-password" className="text-gray-300">Contraseña</Label>
                <Input
                  id="login-password"
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="********"
                  className="mt-1.5 bg-brand-dark border-white/10 text-white placeholder:text-gray-500"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-brand-accent hover:bg-brand-vibrant text-white font-bold py-6 rounded-xl"
                disabled={loginLoading}
              >
                {loginLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  "Iniciar sesión"
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <Label htmlFor="reg-name" className="text-gray-300">Nombre (opcional)</Label>
                <Input
                  id="reg-name"
                  type="text"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  placeholder="Tu nombre"
                  className="mt-1.5 bg-brand-dark border-white/10 text-white placeholder:text-gray-500"
                />
              </div>
              <div>
                <Label htmlFor="reg-email" className="text-gray-300">Email</Label>
                <Input
                  id="reg-email"
                  type="email"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="mt-1.5 bg-brand-dark border-white/10 text-white placeholder:text-gray-500"
                  required
                />
              </div>
              <div>
                <Label htmlFor="reg-password" className="text-gray-300">Contraseña (mín. 6 caracteres)</Label>
                <Input
                  id="reg-password"
                  type="password"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  placeholder="********"
                  className="mt-1.5 bg-brand-dark border-white/10 text-white placeholder:text-gray-500"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <Label htmlFor="reg-password-confirm" className="text-gray-300">Repetir contraseña</Label>
                <Input
                  id="reg-password-confirm"
                  type="password"
                  value={registerPasswordConfirm}
                  onChange={(e) => setRegisterPasswordConfirm(e.target.value)}
                  placeholder="********"
                  className="mt-1.5 bg-brand-dark border-white/10 text-white placeholder:text-gray-500"
                  required
                  minLength={6}
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-brand-accent hover:bg-brand-vibrant text-white font-bold py-6 rounded-xl"
                disabled={registerLoading}
              >
                {registerLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creando cuenta...
                  </>
                ) : (
                  "Crear cuenta"
                )}
              </Button>
            </form>
          )}

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-brand-card px-2 text-gray-500">o continúa con</span>
            </div>
          </div>

          <div className="flex justify-center">
            {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? (
              <GoogleLogin
                onSuccess={(res) => res.credential && handleGoogleSuccess(res.credential)}
                onError={() => setError("Error al iniciar sesión con Google")}
                useOneTap={false}
                theme="filled_black"
                size="large"
                text="continue_with"
              />
            ) : (
              <p className="text-sm text-gray-500">Google no configurado</p>
            )}
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-accent" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
