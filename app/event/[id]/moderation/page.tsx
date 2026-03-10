"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { PhotoModerationCard } from "@/components/photo-moderation-card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { approvePhoto, deletePhoto, getModerationPhotos, rejectPhoto, type GalleryPhoto } from "@/lib/api-client"
import { getEventToken } from "@/lib/auth-storage"

type PhotoStatus = "all" | "pending" | "approved" | "rejected"

const filters: { value: PhotoStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pendientes" },
  { value: "approved", label: "Aprobadas" },
  { value: "rejected", label: "Rechazadas" },
]

type PageProps = { params: Promise<{ id: string }> }

export default function ModerationPage({ params }: PageProps) {
  const router = useRouter()
  const [eventId, setEventId] = useState<string | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [photos, setPhotos] = useState<GalleryPhoto[]>([])
  const [filter, setFilter] = useState<PhotoStatus>("all")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      router.replace(`/event?eventId=${encodeURIComponent(eventId)}&redirect=${encodeURIComponent(`/event/${eventId}/moderation`)}`)
      return
    }
  }, [eventId, router])

  const getToken = () => eventId ? getEventToken(eventId) : null

  const loadPhotos = async () => {
    if (!eventId) return
    const token = getToken()
    if (!token) {
      setError("Inicia sesión para moderar. Si eres admin del evento, usa tu sesión o obtén el token en /event.")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const response = await getModerationPhotos(eventId, token, filter === "all" ? undefined : filter)
      setPhotos(response.photos ?? [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No se pudieron cargar las fotos")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (eventId && getToken()) loadPhotos()
  }, [eventId, filter])

  const handleApprove = async (id: string) => {
    if (!eventId) return
    const token = getToken()
    if (!token) return
    try {
      setError(null)
      await approvePhoto(eventId, id, token)
      await loadPhotos()
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "No se pudo aprobar la foto")
    }
  }

  const handleReject = async (id: string) => {
    if (!eventId) return
    const token = getToken()
    if (!token) return
    try {
      setError(null)
      await rejectPhoto(eventId, id, token)
      await loadPhotos()
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "No se pudo rechazar la foto")
    }
  }

  const handleDelete = async (id: string) => {
    if (!eventId) return
    const token = getToken()
    if (!token) return
    try {
      setError(null)
      await deletePhoto(eventId, id, token)
      await loadPhotos()
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "No se pudo eliminar la foto")
    }
  }

  const pendingCount = photos.filter((p) => p.status === "pending").length
  const approvedCount = photos.filter((p) => p.status === "approved").length
  const rejectedCount = photos.filter((p) => p.status === "rejected").length

  if (!authChecked || !eventId) {
    return (
      <div className="max-w-6xl mx-auto py-12 flex items-center justify-center text-muted-foreground">
        Cargando...
      </div>
    )
  }

  if (!getEventToken(eventId)) {
    return (
      <div className="max-w-6xl mx-auto py-12">
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center">
          <p className="text-destructive font-medium">Solo administradores del evento pueden acceder</p>
          <p className="text-sm text-muted-foreground mt-2">
            Obtén un token de admin en{" "}
            <Link href={`/event?eventId=${encodeURIComponent(eventId)}&redirect=${encodeURIComponent(`/event/${eventId}/moderation`)}`} className="underline">
              /event
            </Link>
            .
          </p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href={`/event?eventId=${encodeURIComponent(eventId)}&redirect=${encodeURIComponent(`/event/${eventId}/moderation`)}`}>
              Ir a obtener token
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mt-10">
          Moderación de fotos
        </h1>
        <p className="text-muted-foreground mt-1">
          Revisa y aprueba las fotos antes de que aparezcan en la galería
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 mb-6 text-sm flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground">
          Evento: <span className="text-foreground font-medium">{eventId}</span>
        </p>
        <Button variant="outline" size="sm" onClick={() => loadPhotos()} disabled={loading}>
          Recargar fotos
        </Button>
      </div>

      {/* Stats Bar */}
      <div className="flex flex-wrap gap-4 mb-6 text-sm">
        <span className="text-muted-foreground">
          <span className="font-semibold text-foreground">{photos.length}</span> fotos
        </span>
        <span className="text-muted-foreground">
          <span className="font-semibold text-warning-foreground">{pendingCount}</span> pendientes
        </span>
        <span className="text-muted-foreground">
          <span className="font-semibold text-accent">{approvedCount}</span> aprobadas
        </span>
        <span className="text-muted-foreground">
          <span className="font-semibold text-destructive">{rejectedCount}</span> rechazadas
        </span>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {filters.map((f) => (
          <Button
            key={f.value}
            variant={filter === f.value ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f.value)}
            className={cn(
              "shrink-0",
              filter === f.value && "bg-foreground text-background"
            )}
          >
            {f.label}
            {f.value === "pending" && pendingCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-warning text-warning-foreground">
                {pendingCount}
              </span>
            )}
          </Button>
        ))}
      </div>

      {/* Photos Grid */}
      {loading ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">Cargando fotos...</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 mb-4 text-sm text-destructive">
          {error}
        </div>
      ) : photos.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-muted-foreground">No hay fotos que coincidan con este filtro</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {photos.map((photo) => (
            <PhotoModerationCard
              key={photo.id}
              id={photo.id}
              src={photo.cloudinary_secure_url || photo.cloudinary_url}
              username={photo.User?.name || "Invitado"}
              date={
                (() => {
                  const raw = photo.created_at ?? (photo as { createdAt?: string }).createdAt
                  const d = raw ? new Date(raw) : null
                  return d && !Number.isNaN(d.getTime())
                    ? d.toLocaleString("es-ES")
                    : raw && typeof raw === "string"
                      ? raw
                      : "—"
                })()
              }
              status={photo.status}
              onApprove={handleApprove}
              onReject={handleReject}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
