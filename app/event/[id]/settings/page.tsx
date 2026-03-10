"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  deleteEvent,
  getEventByIdOrSlug,
  getEventStats,
  setEventModeration,
  updateEvent,
  updateEventConfig,
  uploadEventCover,
} from "@/lib/api-client"
import { getEventToken } from "@/lib/auth-storage"
import Swal from "sweetalert2"
import { QRCodeSVG } from "qrcode.react"
import { ImageIcon, Loader2, Upload, Download } from "lucide-react"

type PageProps = { params: Promise<{ id: string }> }

export default function EventSettingsPage({ params }: PageProps) {
  const router = useRouter()
  const [eventId, setEventId] = useState<string | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

  const [settings, setSettings] = useState({
    name: "",
    date: "",
    location: "",
    description: "",
    coverImageUrl: "" as string | null,
    moderationEnabled: true,
    allowGuestUploads: true,
    allowAnonymousView: true,
    requireLoginToUpload: true,
    autoModerationEnabled: false,
    maxPhotoSizeMb: 5,
    maxPhotosPerUser: 50,
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [deletingEvent, setDeletingEvent] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const qrRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    params.then((p) => {
      if (!cancelled) setEventId(p.id)
    })
    return () => { cancelled = true }
  }, [params])

  useEffect(() => {
    if (!eventId) return
    const token = getEventToken(eventId)
    setAuthChecked(true)
    if (!token) {
      router.replace(`/event?eventId=${encodeURIComponent(eventId)}&redirect=${encodeURIComponent(`/event/${eventId}/settings`)}`)
      return
    }
  }, [eventId, router])

  const getToken = () => (eventId ? getEventToken(eventId) : null)

  useEffect(() => {
    const loadSettings = async () => {
      if (!eventId) return
      const token = getToken()
      if (!token) return
      setLoading(true)
      setError(null)
      try {
        const [event, stats] = await Promise.all([
          getEventByIdOrSlug(eventId),
          getEventStats(eventId, token),
        ])
        const config = stats.config as {
          allow_uploads?: boolean
          allow_anonymous_view?: boolean
          require_login_to_upload?: boolean
          max_photo_size_mb?: number
          max_photos_per_user?: number
          auto_moderation_enabled?: boolean
        } | undefined
        setSettings((prev) => ({
          ...prev,
          name: event.name || "",
          date: event.event_date ? String(event.event_date).slice(0, 10) : "",
          location: event.event_location || "",
          description: event.description || "",
          coverImageUrl: event.cover_image_url ?? prev.coverImageUrl,
          moderationEnabled: event.moderation_enabled ?? prev.moderationEnabled,
          allowGuestUploads: config?.allow_uploads ?? prev.allowGuestUploads,
          allowAnonymousView: config?.allow_anonymous_view ?? prev.allowAnonymousView,
          requireLoginToUpload: config?.require_login_to_upload ?? prev.requireLoginToUpload,
          autoModerationEnabled: config?.auto_moderation_enabled ?? prev.autoModerationEnabled,
          maxPhotoSizeMb: config?.max_photo_size_mb ?? prev.maxPhotoSizeMb,
          maxPhotosPerUser: config?.max_photos_per_user ?? prev.maxPhotosPerUser,
        }))
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "No se pudo cargar la configuración")
      } finally {
        setLoading(false)
      }
    }
    void loadSettings()
  }, [eventId])

  const handleSave = async () => {
    if (!eventId) return
    const token = getToken()
    if (!token) {
      setError("Inicia sesión para guardar.")
      return
    }
    setSaving(true)
    setMessage(null)
    setError(null)
    try {
      await Promise.all([
        updateEventConfig(eventId, token, {
          allow_uploads: settings.allowGuestUploads,
          allow_anonymous_view: settings.allowAnonymousView,
          require_login_to_upload: settings.requireLoginToUpload,
          max_photo_size_mb: settings.maxPhotoSizeMb,
          max_photos_per_user: settings.maxPhotosPerUser,
          auto_moderation_enabled: settings.autoModerationEnabled,
        }),
        setEventModeration(eventId, token, settings.moderationEnabled),
        updateEvent(eventId, token, {
          name: settings.name || undefined,
          description: settings.description || undefined,
          event_location: settings.location || undefined,
          event_date: settings.date ? `${settings.date}T12:00:00.000Z` : undefined,
        }),
      ])
      setMessage("Configuración actualizada correctamente.")
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudo guardar la configuración")
    } finally {
      setSaving(false)
    }
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !eventId) return
    const token = getToken()
    if (!token) return
    setUploadingCover(true)
    setError(null)
    try {
      const result = await uploadEventCover(file, token)
      await updateEvent(eventId, token, { cover_image_url: result.secure_url })
      setSettings((prev) => ({ ...prev, coverImageUrl: result.secure_url }))
      setMessage("Portada del evento actualizada.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir la portada")
    } finally {
      setUploadingCover(false)
      e.target.value = ""
    }
  }

  if (!authChecked || !eventId) {
    return (
      <div className="max-w-2xl mx-auto py-12 flex items-center justify-center text-muted-foreground">
        Cargando...
      </div>
    )
  }

  if (!getEventToken(eventId)) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center">
          <p className="text-destructive font-medium">Solo administradores del evento pueden acceder</p>
          <p className="text-sm text-muted-foreground mt-2">
            Obtén un token de admin en{" "}
            <Link href={`/event?eventId=${encodeURIComponent(eventId)}&redirect=${encodeURIComponent(`/event/${eventId}/settings`)}`} className="underline">
              /event
            </Link>
            .
          </p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href={`/event?eventId=${encodeURIComponent(eventId)}&redirect=${encodeURIComponent(`/event/${eventId}/settings`)}`}>
              Ir a obtener token
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Configuración del evento
        </h1>
        <p className="text-muted-foreground mt-1">
          Detalles y preferencias del evento
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 mb-6 text-sm">
        <p className="text-muted-foreground">
          Evento: <span className="text-foreground font-medium">{eventId}</span>
        </p>
      </div>

      {eventId && (() => {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? ""
        const eventUrl = baseUrl ? `${baseUrl.replace(/\/$/, "")}/event/${eventId}` : ""
        const handleDownloadQr = () => {
          const wrapper = qrRef.current
          const svg = wrapper?.querySelector("svg")
          if (!svg) return
          const svgStr = new XMLSerializer().serializeToString(svg)
          const blob = new Blob([svgStr], { type: "image/svg+xml" })
          const url = URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = `qr-evento-${eventId}.svg`
          a.click()
          URL.revokeObjectURL(url)
        }
        return eventUrl ? (
          <div className="rounded-xl border border-border bg-card p-6 mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-2">Enlace del evento (QR)</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Escanea el código para ir a la galería del evento
            </p>
            <div className="flex flex-wrap items-start gap-6">
              <div ref={qrRef} className="flex-shrink-0 rounded-lg border border-border bg-white p-3">
                <QRCodeSVG value={eventUrl} size={180} level="M" />
              </div>
              <div className="min-w-0 flex flex-col gap-2">
                <p className="text-sm font-medium text-foreground mb-1">URL</p>
                <a
                  href={eventUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline break-all"
                >
                  {eventUrl}
                </a>
                <Button type="button" variant="outline" size="sm" onClick={handleDownloadQr} className="w-fit mt-2">
                  <Download className="h-4 w-4 mr-2" />
                  Descargar QR
                </Button>
              </div>
            </div>
          </div>
        ) : null
      })()}

      <div className="space-y-8">
        {/* Basic Info */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Basic Information
          </h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Event Name</Label>
              <Input
                id="name"
                disabled={loading}
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                className="mt-1.5"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  disabled={loading}
                  value={settings.date}
                  onChange={(e) => setSettings({ ...settings, date: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  disabled={loading}
                  value={settings.location}
                  onChange={(e) => setSettings({ ...settings, location: e.target.value })}
                  className="mt-1.5"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                disabled={loading}
                value={settings.description}
                onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                className="mt-1.5"
                rows={3}
              />
            </div>
            <div className="border-t border-border pt-4">
              <Label className="text-foreground">Portada del evento</Label>
              <p className="text-sm text-muted-foreground mt-1 mb-3">
                Imagen de portada del evento (cover_image_url)
              </p>
              {settings.coverImageUrl ? (
                <div className="mb-3 rounded-lg overflow-hidden border border-border max-w-xs">
                  <img src={settings.coverImageUrl} alt="Portada" className="w-full h-32 object-cover" />
                </div>
              ) : (
                <div className="mb-3 flex items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 h-32 max-w-xs text-muted-foreground">
                  <ImageIcon className="h-10 w-10" />
                </div>
              )}
              <div className="flex items-center gap-2">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    disabled={loading || uploadingCover}
                    onChange={handleCoverUpload}
                  />
                  <span className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4">
                    {uploadingCover ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Subiendo…
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Subir nueva portada
                      </>
                    )}
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* EventConfig: require_login_to_upload, allow_anonymous_view, allow_uploads, max_photo_size_mb, max_photos_per_user, auto_moderation_enabled */}
        {/* <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-1">
            Configuración de fotos del evento
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Según EventConfig (allow_uploads, allow_anonymous_view, require_login_to_upload, max_photo_size_mb, max_photos_per_user, auto_moderation_enabled)
          </p>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Moderación (Event)</p>
                <p className="text-sm text-muted-foreground">
                  Revisar fotos antes de que aparezcan en la galería (moderation_enabled)
                </p>
              </div>
              <Switch
                checked={settings.moderationEnabled}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, moderationEnabled: checked })
                }
                disabled={loading}
              />
            </div>
            <div className="border-t border-border pt-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Allow Guest Uploads</p>
                <p className="text-sm text-muted-foreground">
                  Let guests upload photos to the event
                </p>
              </div>
              <Switch
                checked={settings.allowGuestUploads}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, allowGuestUploads: checked })
                }
                disabled={loading}
              />
            </div>
            <div className="border-t border-border pt-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Allow Anonymous View</p>
                <p className="text-sm text-muted-foreground">
                  Permite ver la galeria sin iniciar sesion
                </p>
              </div>
              <Switch
                checked={settings.allowAnonymousView}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, allowAnonymousView: checked })
                }
                disabled={loading}
              />
            </div>
            <div className="border-t border-border pt-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Require Login to Upload</p>
                <p className="text-sm text-muted-foreground">
                  Solo usuarios autenticados podran subir fotos
                </p>
              </div>
              <Switch
                checked={settings.requireLoginToUpload}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, requireLoginToUpload: checked })
                }
                disabled={loading}
              />
            </div>
            <div className="border-t border-border pt-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Auto Moderation (AI)</p>
                <p className="text-sm text-muted-foreground">
                  Rechaza automaticamente contenido marcado
                </p>
              </div>
              <Switch
                checked={settings.autoModerationEnabled}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, autoModerationEnabled: checked })
                }
                disabled={loading}
              />
            </div>
            <div className="border-t border-border pt-4 grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="maxPhotoSize">Max photo size (MB)</Label>
                <Input
                  id="maxPhotoSize"
                  type="number"
                  min={1}
                  value={settings.maxPhotoSizeMb}
                  onChange={(e) =>
                    setSettings({ ...settings, maxPhotoSizeMb: Number(e.target.value) || 1 })
                  }
                  className="mt-1.5"
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="maxPhotosPerUser">Max photos per user</Label>
                <Input
                  id="maxPhotosPerUser"
                  type="number"
                  min={1}
                  value={settings.maxPhotosPerUser}
                  onChange={(e) =>
                    setSettings({ ...settings, maxPhotosPerUser: Number(e.target.value) || 1 })
                  }
                  className="mt-1.5"
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        </div> */}

        {/* Danger Zone */}
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
          <h2 className="text-lg font-semibold text-destructive mb-4">
            Danger Zone
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Delete Event</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete this event and all photos
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              disabled={deletingEvent || loading || !eventId}
              onClick={async () => {
                const token = getToken()
                if (!token || !eventId) return
                const { isConfirmed } = await Swal.fire({
                  title: "¿Eliminar evento?",
                  text: "Se eliminarán todas las fotos del evento en Cloudinary y todos los datos. Esta acción no se puede deshacer.",
                  icon: "warning",
                  showCancelButton: true,
                  confirmButtonColor: "#dc2626",
                  cancelButtonColor: "#6b7280",
                  confirmButtonText: "Sí, eliminar",
                  cancelButtonText: "Cancelar",
                })
                if (!isConfirmed) return
                setDeletingEvent(true)
                setError(null)
                try {
                  await deleteEvent(eventId, token)
                  await Swal.fire({
                    title: "Evento eliminado",
                    icon: "success",
                    timer: 1500,
                    showConfirmButton: false,
                  })
                  router.push("/")
                } catch (err) {
                  setDeletingEvent(false)
                  Swal.fire({
                    title: "Error",
                    text: err instanceof Error ? err.message : "No se pudo eliminar el evento",
                    icon: "error",
                  })
                }
              }}
            >
              {deletingEvent ? "Eliminando…" : "Delete Event"}
            </Button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving || loading || !eventId}>
            {saving ? "Guardando..." : "Save Changes"}
          </Button>
        </div>
        {message && (
          <div className="rounded-lg border border-accent/30 bg-accent/10 p-3 text-sm text-foreground">
            {message}
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
