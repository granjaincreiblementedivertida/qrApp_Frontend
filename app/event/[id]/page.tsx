"use client"

import { useEffect, useState } from "react"
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google"
import { Navbar } from "@/components/navbar"
import { EventHeader } from "@/components/event-header"
import { PhotoGrid } from "@/components/photo-grid"
import { StoryViewer } from "@/components/story-viewer"
import { UploadModal } from "@/components/upload-modal"
import {
  getEventByIdOrSlug,
  getGallery,
  loginWithGoogle,
  uploadPhotos,
  type EventSummary,
  type GalleryPhoto,
} from "@/lib/api-client"
import { getAuthToken, getStoredUser, saveSession } from "@/lib/auth-storage"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Download, SquarePen } from "lucide-react"

const PHOTOS_PER_PAGE = 24

type EventPageProps = {
  params: Promise<{ id: string }>
}

function formatEventDate(value?: string | null) {
  if (!value) return "Fecha por confirmar"
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  const date = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function mapPhoto(photo: GalleryPhoto) {
  const raw = photo.created_at ?? photo.createdAt
  const date = raw ? new Date(raw) : null
  const created_at =
    date && !Number.isNaN(date.getTime())
      ? date.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })
      : (typeof raw === "string" ? raw : "—")
  return {
    id: photo.id,
    src: photo.cloudinary_secure_url || photo.cloudinary_url,
    alt: `Foto de ${photo.User?.name || "Invitado"}`,
    username: photo.User?.name || "Invitado",
    created_at,
    status: photo.status,
  }
}

export default function EventPage({ params }: EventPageProps) {
  const [eventId, setEventId] = useState("")
  const [eventInfo, setEventInfo] = useState<EventSummary | null>(null)
  const [eventError, setEventError] = useState<string | null>(null)
  const [loadingEvent, setLoadingEvent] = useState(true)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [user, setUser] = useState<ReturnType<typeof getStoredUser>>(null)
  const [photos, setPhotos] = useState<ReturnType<typeof mapPhoto>[]>([])
  const [galleryPage, setGalleryPage] = useState(1)
  const [totalPhotos, setTotalPhotos] = useState(0)
  const [loadingGallery, setLoadingGallery] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [storyIndex, setStoryIndex] = useState<number | null>(null)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    setUser(getStoredUser())
  }, [])

  useEffect(() => {
    const loadData = async () => {
      const resolved = await params
      const routeId = resolved.id
      setLoadingEvent(true)
      setEventError(null)
      try {
        const event = await getEventByIdOrSlug(routeId)
        setEventInfo(event)
        setEventId(event.id)
        const token = getAuthToken() || undefined
        const gallery = await getGallery(event.id, 1, PHOTOS_PER_PAGE, token)
        setPhotos(gallery.photos.map(mapPhoto))
        setTotalPhotos(gallery.total)
        setGalleryPage(1)
      } catch (loadError) {
        setEventError(loadError instanceof Error ? loadError.message : "No se pudo cargar el evento")
      } finally {
        setLoadingEvent(false)
      }
    }
    void loadData()
  }, [params])

  const refreshGallery = async (id: string) => {
    const token = getAuthToken() || undefined
    const gallery = await getGallery(id, galleryPage, PHOTOS_PER_PAGE, token)
    setPhotos(gallery.photos.map(mapPhoto))
    setTotalPhotos(gallery.total)
  }

  const totalPages = Math.max(1, Math.ceil(totalPhotos / PHOTOS_PER_PAGE))

  const loadPage = async (page: number) => {
    if (!eventId || page < 1 || page > totalPages) return
    setLoadingGallery(true)
    try {
      const token = getAuthToken() || undefined
      const gallery = await getGallery(eventId, page, PHOTOS_PER_PAGE, token)
      setPhotos(gallery.photos.map(mapPhoto))
      setTotalPhotos(gallery.total)
      setGalleryPage(page)
    } finally {
      setLoadingGallery(false)
    }
  }

  const handleUploadClick = () => {
    if (!getAuthToken()) {
      setLoginError(null)
      setLoginModalOpen(true)
    } else {
      setUploadModalOpen(true)
    }
  }

  const handleGoogleLoginSuccess = async (credentialResponse: CredentialResponse) => {
    setLoginError(null)
    if (!credentialResponse.credential) {
      setLoginError("Google no devolvió credenciales válidas.")
      return
    }
    try {
      const session = await loginWithGoogle(credentialResponse.credential)
      saveSession(session)
      setUser(session.user)
      setLoginModalOpen(false)
      setUploadModalOpen(true)
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "No se pudo iniciar sesión con Google")
    }
  }

  const handlePhotoClick = (photo: { id: string }) => {
    const index = photos.findIndex((p) => p.id === photo.id)
    if (index >= 0) setStoryIndex(index)
  }

  const handleSelectionChange = (id: string) => {
    setSelectedPhotoIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleDownloadSelected = async () => {
    const selected = photos.filter((p) => selectedPhotoIds.has(p.id))
    if (selected.length === 0) return
    for (let i = 0; i < selected.length; i++) {
      const photo = selected[i]
      try {
        const res = await fetch(photo.src)
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `foto-${i + 1} - ${Date.now()}.jpg`
        a.click()
        URL.revokeObjectURL(url)
      } catch {
        // Fallback: abrir en nueva pestaña
        window.open(photo.src, "_blank")
      }
    }
  }

  const exitSelectionMode = () => {
    setSelectionMode(false)
    setSelectedPhotoIds(new Set())
  }

  const handleUpload = async (files: File[]) => {
    if (!eventId) throw new Error("Evento no encontrado")
    const token = getAuthToken()
    if (!token) throw new Error("Debes iniciar sesión para subir fotos")
    if (files.length === 0) return
    await uploadPhotos(eventId, token, files)
    await refreshGallery(eventId)
  }

  if (loadingEvent) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar showUpload={false} />
        <div className="max-w-4xl mx-auto px-4 py-10 text-muted-foreground">Cargando evento...</div>
      </div>
    )
  }

  if (eventError || !eventInfo) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar showUpload={false} />
        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive text-sm">
            {eventError || "Evento no disponible"}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        onUploadClick={handleUploadClick}
        showUpload={eventInfo.EventConfig?.allow_uploads !== false}
        user={user}
      />

      <Dialog open={loginModalOpen} onOpenChange={setLoginModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inicia sesión para subir fotos</DialogTitle>
            <DialogDescription>
              Usa tu cuenta de Google para subir fotos a la galería del evento.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-2">
            {loginError && (
              <p className="text-sm text-destructive">{loginError}</p>
            )}
            <GoogleLogin
              onSuccess={handleGoogleLoginSuccess}
              onError={() => setLoginError("Error al iniciar sesión con Google.")}
              theme="outline"
              text="continue_with"
            />
          </div>
        </DialogContent>
      </Dialog>
      
      <main>
        <EventHeader
          name={eventInfo.name}
          date={formatEventDate(eventInfo.event_date)}
          location={eventInfo.event_location || undefined}
          coverImage={
            eventInfo.cover_image_url ||
            "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&h=600&fit=crop"
          }
          description={eventInfo.description || undefined}
        />

        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
          
          <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
            <h2 className="text-lg font-semibold text-foreground">
              {totalPhotos <= PHOTOS_PER_PAGE
                ? `${totalPhotos} Fotos`
                : `${(galleryPage - 1) * PHOTOS_PER_PAGE + 1}-${Math.min(galleryPage * PHOTOS_PER_PAGE, totalPhotos)} de ${totalPhotos} Fotos`}
            </h2>
            {/* <div className="flex items-center gap-2">
              {selectionMode ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exitSelectionMode}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleDownloadSelected}
                    disabled={selectedPhotoIds.size === 0}
                    className="gap-1.5"
                  >
                    <Download className="size-4" />
                    Descargar ({selectedPhotoIds.size})
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectionMode(true)}
                  className="gap-1.5"
                >
                  <SquarePen className="size-4" />
                  Seleccionar fotos
                </Button>
              )}
            </div> */}
          </div>
          <PhotoGrid
            photos={photos}
            onPhotoClick={handlePhotoClick}
            selectionMode={selectionMode}
            selectedIds={selectedPhotoIds}
            onSelectionChange={handleSelectionChange}
          />

          {totalPages > 1 && (
            <nav
              className="mt-6 flex flex-wrap items-center justify-center gap-2"
              aria-label="Paginación de la galería"
            >
              <Button
                variant="outline"
                size="sm"
                disabled={galleryPage <= 1 || loadingGallery}
                onClick={() => loadPage(galleryPage - 1)}
                className="gap-1"
              >
                <ChevronLeft className="size-4" />
                Anterior
              </Button>
              <span className="flex items-center gap-1.5 px-2 text-sm text-muted-foreground">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => {
                    if (totalPages <= 7) return true
                    if (p === 1 || p === totalPages) return true
                    if (Math.abs(p - galleryPage) <= 1) return true
                    return false
                  })
                  .map((p, idx, arr) => {
                    const prev = arr[idx - 1]
                    const showEllipsis = prev != null && p - prev > 1
                    return (
                      <span key={p} className="flex items-center gap-1">
                        {showEllipsis && <span className="px-1">…</span>}
                        <Button
                          variant={galleryPage === p ? "default" : "ghost"}
                          size="sm"
                          className="min-w-8"
                          disabled={loadingGallery}
                          onClick={() => loadPage(p)}
                        >
                          {p}
                        </Button>
                      </span>
                    )
                  })}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={galleryPage >= totalPages || loadingGallery}
                onClick={() => loadPage(galleryPage + 1)}
                className="gap-1"
              >
                Siguiente
                <ChevronRight className="size-4" />
              </Button>
            </nav>
          )}
        </div>
      </main>

      {storyIndex !== null && (
        <StoryViewer
          photos={photos}
          currentIndex={storyIndex}
          onClose={() => setStoryIndex(null)}
          onPrev={() => setStoryIndex((i) => (i !== null && i > 0 ? i - 1 : i))}
          onNext={() =>
            setStoryIndex((i) => (i !== null && i < photos.length - 1 ? i + 1 : i))
          }
        />
      )}

      <UploadModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        onUpload={handleUpload}
      />
    </div>
  )
}
