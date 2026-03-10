"use client"

import { Suspense, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Camera, Loader2, ShieldCheck } from "lucide-react"
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { issueEventAdminToken, loginWithGoogle, loginWithPassword } from "@/lib/api-client"
import { saveEventToken, saveSession } from "@/lib/auth-storage"

function EventLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [eventId, setEventId] = useState(searchParams.get("eventId") || "")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""
  const redirectPath = useMemo(() => {
    const fromQuery = searchParams.get("redirect")
    return fromQuery && fromQuery.startsWith("/") ? fromQuery : "/event/moderation"
  }, [searchParams])

  const finishLogin = async (token: string) => {
    const id = eventId.trim()
    if (!id) {
      setMessage("Sesión iniciada. Ingresa un Event ID para generar token de admin del evento.")
      return
    }
    const scoped = await issueEventAdminToken(token, id)
    saveEventToken(id, scoped.token)
    let target = redirectPath
    if (target === "/event/moderation") target = `/event/${id}/moderation`
    else if (target === "/event/settings") target = `/event/${id}/settings`
    else if (target.startsWith("/event/moderation") || target.startsWith("/event/settings")) target = target.replace(/^\/event\/(moderation|settings)/, `/event/${id}/$1`)
    router.push(target)
  }

  const handlePasswordLogin = async () => {
    setLoading(true)
    setError(null)
    setMessage(null)
    try {
      const session = await loginWithPassword(email.trim(), password)
      saveSession(session)
      setMessage(`Bienvenido ${session.user.name || session.user.email}`)
      await finishLogin(session.token)
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "No se pudo iniciar sesion")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    setError(null)
    if (!credentialResponse.credential) {
      setError("Google no devolvio credenciales validas.")
      return
    }
    setLoading(true)
    setMessage(null)
    try {
      const session = await loginWithGoogle(credentialResponse.credential)
      saveSession(session)
      setMessage(`Bienvenido ${session.user.name || session.user.email}`)
      await finishLogin(session.token)
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "No se pudo iniciar sesion con Google")
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
            <h1 className="text-xl font-semibold text-foreground">Acceso a Event Admin</h1>
            <p className="text-sm text-muted-foreground">Inicia sesion para moderar fotos</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="eventId">Event ID</Label>
            <Input
              id="eventId"
              placeholder="UUID del evento"
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="mt-1.5"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Se usa para emitir el token de admin de evento.
            </p>
          </div>

          {/* <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@evento.com"
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
          </div> */}

          <Button
            className="w-full"
            disabled={loading || !email.trim() || !password}
            onClick={handlePasswordLogin}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Iniciando sesion...
              </>
            ) : (
              "Iniciar sesion"
            )}
          </Button>

          <div className="w-full flex justify-center">
            {googleClientId ? (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() =>
                  setError("Google bloqueo el origen actual o no se pudo completar el inicio de sesion.")
                }
                theme="outline"
                text="continue_with"
                shape="pill"
                width="320"
              />
            ) : (
              <Button variant="outline" className="w-full" disabled>
                Falta NEXT_PUBLIC_GOOGLE_CLIENT_ID
              </Button>
            )}
          </div>
        </div>

        {message && (
          <div className="mt-4 rounded-lg border border-accent/30 bg-accent/10 p-3 text-sm text-foreground flex gap-2 items-start">
            <ShieldCheck className="h-4 w-4 mt-0.5 text-accent shrink-0" />
            <span>{message}</span>
          </div>
        )}
        {error && (
          <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}

export default function EventLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <EventLoginForm />
    </Suspense>
  )
}
