"use client"

import { Suspense, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Camera, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getSession, loginWithGoogle, loginWithPassword } from "@/lib/api-client"
import { clearSession, saveSession } from "@/lib/auth-storage"

function AdminLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const nextPath = useMemo(() => {
    const next = searchParams.get("next")
    return next && next.startsWith("/admin") ? next : "/admin"
  }, [searchParams])

  const finishLogin = async (token: string) => {
    const me = await getSession(token)
    if (me.user.role !== "admin") {
      clearSession()
      throw new Error("Tu cuenta no tiene permisos de administrador")
    }
    router.push(nextPath)
  }

  const handlePasswordLogin = async () => {
    setLoading(true)
    setError(null)
    try {
      const session = await loginWithPassword(email.trim(), password)
      saveSession(session)
      await finishLogin(session.token)
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "No se pudo iniciar sesion")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center">
            <Camera className="h-5 w-5 text-background" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Admin Login</h1>
            <p className="text-sm text-muted-foreground">Ingresa para administrar eventos</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="password">Contrasena</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              className="mt-1.5"
            />
          </div>

          <Button
            className="w-full"
            onClick={handlePasswordLogin}
            disabled={loading || !email.trim() || !password}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Iniciando...
              </>
            ) : (
              "Iniciar sesion"
            )}
          </Button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <AdminLoginForm />
    </Suspense>
  )
}
