"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"
import {
  createCheckoutSession,
  createEvent,
  getPaymentStatus,
  confirmPaymentSession,
} from "@/lib/api-client"
import { getAuthToken, getStoredUser, clearSession, getUserDisplayName, getUserInitial } from "@/lib/auth-storage"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Loader2, CreditCard, CheckCircle, Calendar, LogOut } from "lucide-react"

const PENDING_STORAGE_KEY = "crear-evento-pending"

const INITIAL_FORM = {
  name: "",
  event_location: "",
  event_date: "",
  description: "",
  event_type: "other" as "wedding" | "birthday" | "party" | "corporate" | "other",
  moderation_enabled: true,
  require_login_to_upload: true,
  allow_anonymous_view: true,
  allow_uploads: true,
  auto_moderation_enabled: false,
  max_photo_size_mb: 5,
  max_photos_per_user: 50,
}

const PRICE_MXN = Number(process.env.NEXT_PUBLIC_EVENT_PRICE_CENTS) || 70000
const PRICE_DISPLAY = PRICE_MXN >= 100 ? PRICE_MXN / 100 : PRICE_MXN

function CrearEventoForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [token, setToken] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<{
    canCreateEvent: boolean
    eventCredits: number
    isAdmin: boolean
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [user, setUser] = useState<{ id: string; email: string; name?: string | null; avatar_url?: string | null } | null>(null)
  const [payLoading, setPayLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState(INITIAL_FORM)
  const [createdEventId, setCreatedEventId] = useState<string | null>(null)

  const year = new Date().getFullYear()
  useEffect(() => {
    const t = getAuthToken()
    setToken(t)
    setUser(getStoredUser())
    if (!t) {
      setLoading(false)
      router.replace(`/login?next=${encodeURIComponent("/crear-evento")}`)
      return
    }
    const run = async () => {
      setError(null)
      const success = searchParams.get("success") === "true"
      const sessionId = searchParams.get("session_id")
      if (success && sessionId) {
        try {
          await confirmPaymentSession(t, sessionId)
          setSuccessMessage("¡Pago confirmado!")
          try {
            const status = await getPaymentStatus(t)
            setPaymentStatus(status)
          } catch {
            setPaymentStatus(null)
          }
          const pending = typeof window !== "undefined" ? sessionStorage.getItem(PENDING_STORAGE_KEY) : null
          if (pending) {
            try {
              const data = JSON.parse(pending) as typeof INITIAL_FORM
              sessionStorage.removeItem(PENDING_STORAGE_KEY)
              const currentUser = getStoredUser()
              const event = await createEvent(t, {
                name: data.name.trim(),
                description: data.description || undefined,
                event_location: data.event_location || undefined,
                event_date: data.event_date || undefined,
                event_type: data.event_type || "other",
                moderation_enabled: data.moderation_enabled !== false,
                event_admin_emails: currentUser?.email ? [currentUser.email] : undefined,
                event_config: {
                  require_login_to_upload: data.require_login_to_upload,
                  allow_anonymous_view: data.allow_anonymous_view,
                  allow_uploads: data.allow_uploads,
                  auto_moderation_enabled: data.auto_moderation_enabled,
                  max_photo_size_mb: Number(data.max_photo_size_mb) || 5,
                  max_photos_per_user: Number(data.max_photos_per_user) || 50,
                },
              })
              setCreatedEventId(event.id)
              setCreateForm(INITIAL_FORM)
            } catch (createErr) {
              setError(createErr instanceof Error ? createErr.message : "No se pudo crear el evento")
            }
          }
          window.history.replaceState({}, "", "/crear-evento")
        } catch {
          setError("No se pudo confirmar el pago. Recarga la página.")
        }
      }
      try {
        const status = await getPaymentStatus(t)
        setPaymentStatus(status)
      } catch {
        setPaymentStatus(null)
      } finally {
        setLoading(false)
      }
    }
    void run()
  }, [searchParams, router])

  const buildPayload = () => {
    return {
      name: createForm.name.trim(),
      description: createForm.description || undefined,
      event_location: createForm.event_location || undefined,
      event_date: createForm.event_date || undefined,
      event_type: createForm.event_type || "other",
      moderation_enabled: createForm.moderation_enabled !== false,
      event_admin_emails: user?.email ? [user.email] : undefined,
      event_config: {
        require_login_to_upload: createForm.require_login_to_upload,
        allow_anonymous_view: createForm.allow_anonymous_view,
        allow_uploads: createForm.allow_uploads,
        auto_moderation_enabled: createForm.auto_moderation_enabled,
        max_photo_size_mb: Number(createForm.max_photo_size_mb) || 5,
        max_photos_per_user: Number(createForm.max_photos_per_user) || 50,
      },
    }
  }

  const handlePayAndCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !createForm.name.trim()) return
    setError(null)

    const canCreate = paymentStatus?.canCreateEvent ?? false
    if (canCreate) {
      setCreating(true)
      try {
        const event = await createEvent(token, buildPayload())
        setCreatedEventId(event.id)
        setCreateForm(INITIAL_FORM)
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo crear el evento")
      } finally {
        setCreating(false)
      }
      return
    }

    setPayLoading(true)
    try {
      if (typeof window !== "undefined") {
        sessionStorage.setItem(PENDING_STORAGE_KEY, JSON.stringify(createForm))
      }
      const { url } = await createCheckoutSession(token)
      if (url) window.location.href = url
      else setError("No se recibió la URL de pago")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar el pago")
    } finally {
      setPayLoading(false)
    }
  }

  const canceled = searchParams.get("canceled") === "true"

  return (
    <div className="min-h-screen bg-brand-dark text-white font-sans overflow-x-hidden scroll-smooth">
      {/* Navigation - mismo estilo que page.tsx */}
      <nav className="fixed top-0 w-full z-50 glass-effect border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-accent to-brand-vibrant rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight">{process.env.NEXT_PUBLIC_APP_NAME}<span className="text-brand-accent">QR</span></span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
              Inicio
            </Link>
            <Link href="/#eventos" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
              Eventos
            </Link>
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-300 truncate max-w-[120px] md:max-w-[180px]" title={user.email || ""}>
                  {getUserDisplayName(user) || user.email || "Usuario"}
                </span>
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover border border-white/10"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-brand-accent flex items-center justify-center text-white text-sm font-bold">
                    {getUserInitial(user)}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    clearSession()
                    setToken(null)
                    setUser(null)
                    router.push("/login?next=/crear-evento")
                  }}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login?next=/crear-evento"
                className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                Iniciar sesión
              </Link>
            )}
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-20 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero */}
          <section className="text-center mb-12 ">
            <div className="absolute left-1/2 -translate-x-1/2 w-full max-w-md h-64 bg-brand-accent/20 blur-[100px] rounded-full -z-10 pointer-events-none" />
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
              Crea tu evento
            </h1>
            <p className="text-gray-400 text-lg">
              Paga una vez y obtén tu galería con QR para que tus invitados suban fotos al instante.
            </p>
          </section>

          {successMessage && (
            <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {canceled && (
            <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              Pago cancelado. Cuando quieras puedes volver a intentarlo.
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-brand-accent" />
            </div>
          ) : (
            <section className="rounded-2xl border border-white/10 bg-brand-card p-8 shadow-xl ">
              {createdEventId ? (
                <div className="text-center py-6">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h2 className="text-xl font-bold mb-2">Evento creado</h2>
                  <p className="text-gray-400 mb-6">
                    Tu galería está lista. Comparte el enlace o el QR con tus invitados.
                  </p>
                  <Link
                    href={`/event/${createdEventId}`}
                    className="inline-block bg-brand-accent hover:bg-brand-vibrant text-white font-bold px-6 py-3 rounded-xl"
                  >
                    Ver mi evento
                  </Link>
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => setCreatedEventId(null)}
                      className="text-sm text-gray-400 hover:text-white"
                    >
                      Crear otro evento
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-6">
                    <Calendar className="w-5 h-5 text-brand-accent" />
                    <h2 className="text-xl font-bold">Crear tu evento</h2>
                  </div>
                  {paymentStatus && (paymentStatus.eventCredits > 0 || paymentStatus.isAdmin) && (
                    <p className="text-sm text-gray-400 mb-4">
                      {paymentStatus.isAdmin
                        ? "Tienes créditos ilimitados (admin)."
                        : `Tienes ${paymentStatus.eventCredits} crédito${paymentStatus.eventCredits !== 1 ? "s" : ""} para crear evento${paymentStatus.eventCredits !== 1 ? "s" : ""}.`}
                    </p>
                  )}

                  <form onSubmit={handlePayAndCreate} className="space-y-4">
                    <div>
                      <Label htmlFor="event-name" className="text-gray-300">Nombre del evento *</Label>
                      <Input
                        id="event-name"
                        value={createForm.name}
                        onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                        placeholder="Ej. Boda de Ana y Luis"
                        className="mt-1.5 bg-brand-dark border-white/10 text-white placeholder:text-gray-500"
                        required
                      />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="event-location" className="text-gray-300">Ubicación</Label>
                        <Input
                          id="event-location"
                          value={createForm.event_location}
                          onChange={(e) => setCreateForm((p) => ({ ...p, event_location: e.target.value }))}
                          placeholder="Salón Primavera"
                          className="mt-1.5 bg-brand-dark border-white/10 text-white placeholder:text-gray-500"
                        />
                      </div>
                      <div>
                        <Label htmlFor="event-date" className="text-gray-300">Fecha</Label>
                        <Input
                          id="event-date"
                          type="date"
                          value={createForm.event_date}
                          onChange={(e) => setCreateForm((p) => ({ ...p, event_date: e.target.value }))}
                          className="mt-1.5 bg-brand-dark border-white/10 text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="event-type" className="text-gray-300">Tipo de evento</Label>
                      <select
                        id="event-type"
                        value={createForm.event_type}
                        onChange={(e) => setCreateForm((p) => ({ ...p, event_type: e.target.value as typeof p.event_type }))}
                        className="mt-1.5 w-full rounded-lg bg-brand-dark border border-white/10 text-white px-3 py-2"
                      >
                        <option value="wedding">Boda</option>
                        <option value="birthday">Cumpleaños</option>
                        <option value="party">Fiesta</option>
                        <option value="corporate">Corporativo</option>
                        <option value="other">Otro</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="event-desc" className="text-gray-300">Descripción</Label>
                      <Input
                        id="event-desc"
                        value={createForm.description}
                        onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
                        placeholder="Breve descripción del evento"
                        className="mt-1.5 bg-brand-dark border-white/10 text-white placeholder:text-gray-500"
                      />
                    </div>

                    <div className="rounded-xl border border-white/10 bg-brand-dark/50 p-4 space-y-3">
                      <p className="text-sm font-medium text-gray-300">Configuración del evento</p>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="cfg-moderation" className="text-gray-400 text-sm">Moderación de fotos</Label>
                        <Switch
                          id="cfg-moderation"
                          checked={createForm.moderation_enabled}
                          onCheckedChange={(c) => setCreateForm((p) => ({ ...p, moderation_enabled: c }))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="cfg-login" className="text-gray-400 text-sm">Login obligatorio para subir</Label>
                        <Switch
                          id="cfg-login"
                          checked={createForm.require_login_to_upload}
                          onCheckedChange={(c) => setCreateForm((p) => ({ ...p, require_login_to_upload: c }))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="cfg-anon" className="text-gray-400 text-sm">Permitir vista anónima</Label>
                        <Switch
                          id="cfg-anon"
                          checked={createForm.allow_anonymous_view}
                          onCheckedChange={(c) => setCreateForm((p) => ({ ...p, allow_anonymous_view: c }))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="cfg-uploads" className="text-gray-400 text-sm">Permitir subidas</Label>
                        <Switch
                          id="cfg-uploads"
                          checked={createForm.allow_uploads}
                          onCheckedChange={(c) => setCreateForm((p) => ({ ...p, allow_uploads: c }))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="cfg-auto-mod" className="text-gray-400 text-sm">Auto-moderación</Label>
                        <Switch
                          id="cfg-auto-mod"
                          checked={createForm.auto_moderation_enabled}
                          onCheckedChange={(c) => setCreateForm((p) => ({ ...p, auto_moderation_enabled: c }))}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="cfg-max-mb" className="text-gray-400 text-sm">Máx. MB por foto</Label>
                          <Input
                            id="cfg-max-mb"
                            type="number"
                            min={1}
                            value={createForm.max_photo_size_mb}
                            onChange={(e) => setCreateForm((p) => ({ ...p, max_photo_size_mb: Number(e.target.value) || 1 }))}
                            className="mt-1 bg-brand-dark border-white/10 text-white"
                          />
                        </div>
                        <div>
                          <Label htmlFor="cfg-max-photos" className="text-gray-400 text-sm">Máx. fotos por usuario</Label>
                          <Input
                            id="cfg-max-photos"
                            type="number"
                            min={1}
                            value={createForm.max_photos_per_user}
                            onChange={(e) => setCreateForm((p) => ({ ...p, max_photos_per_user: Number(e.target.value) || 1 }))}
                            className="mt-1 bg-brand-dark border-white/10 text-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-brand-dark p-5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400">Coste por crear un evento</span>
                        <span className="text-2xl font-bold text-white">${PRICE_DISPLAY.toFixed(0)} MXN</span>
                      </div>
                      <p className="text-xs text-gray-500 mb-4">
                        {paymentStatus?.canCreateEvent
                          ? "Tienes crédito; al enviar se creará el evento sin cobro adicional."
                          : "Al continuar serás redirigido a pagar de forma segura con Stripe. Tras el pago se creará tu evento."}
                      </p>
                      <Button
                        type="submit"
                        disabled={creating || payLoading || !createForm.name.trim()}
                        className="w-full bg-brand-accent hover:bg-brand-vibrant text-white font-bold py-6 rounded-xl flex items-center justify-center gap-2"
                      >
                        {creating ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Creando evento...
                          </>
                        ) : payLoading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Redirigiendo a pago...
                          </>
                        ) : paymentStatus?.canCreateEvent ? (
                          "Crear mi evento"
                        ) : (
                          <>
                            <CreditCard className="w-5 h-5" />
                            Pagar ${PRICE_DISPLAY.toFixed(0)} MXN y crear evento
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </>
              )}
            </section>
          )}
        </div>

        <section className="py-24" id="crear">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-brand-accent via-brand-vibrant to-brand-blue p-12 text-center shadow-2xl shadow-brand-vibrant/20">
              <div className="absolute inset-0 bg-black/10" />
              <div className="relative z-10">
                <h2 className="text-4xl md:text-5xl font-extrabold mb-6">¿Ya creaste tu evento? Genera tu QR para compartirlo</h2>
                <p className="text-lg text-white/80 max-w-xl mx-auto mb-10">
                  Genera tu QR para compartirlo con tus invitados y empezar a recibir fotos de tus eventos. No te olvides de crear tu evento antes de generar el QR.
                </p>
                <Link href={`/event/`} className="inline-block bg-white text-brand-dark px-10 py-5 rounded-2xl font-black text-xl hover:scale-105 transition-all shadow-xl">
                  Ir a mi evento
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 border-t border-white/5 bg-brand-dark">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          <Link href="/" className="hover:text-white transition-colors">{process.env.NEXT_PUBLIC_APP_NAME}</Link>
          {" · "}
          <span>© {year} Todos los derechos reservados.</span>
        </div>
      </footer>
    </div>
  )
}

export default function CrearEventoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-accent" />
      </div>
    }>
      <CrearEventoForm />
    </Suspense>
  )
}
