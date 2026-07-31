"use client"

import { useEffect, useMemo, useState } from "react"
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google"
import { Navbar } from "@/components/navbar"
import { EventHeader } from "@/components/event-header"
import { PhotoGrid } from "@/components/photo-grid"
import { StoryViewer } from "@/components/story-viewer"
import { UploadModal } from "@/components/upload-modal"
import {
  getEventByIdOrSlug,
  getGallery,
  getUploadLimits,
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
import { ChevronLeft, ChevronRight } from "lucide-react"

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
  const [uploadMaxFiles, setUploadMaxFiles] = useState(50)
  const [uploadMaxSizeMb, setUploadMaxSizeMb] = useState(5)
  const [galleryNeedsLogin, setGalleryNeedsLogin] = useState(false)
  const [loginPurpose, setLoginPurpose] = useState<"upload" | "view">("upload")

  const eventConfig = eventInfo?.EventConfig
  const allowUploads = eventConfig?.allow_uploads !== false
  const requireLoginToUpload = eventConfig?.require_login_to_upload !== false
  /** Activo: pendientes visibles. Inactivo: solo aprobadas. */
  const showUnapprovedPhotos = !!eventConfig?.show_unapproved_photos
  const maxPhotoSizeMb = eventConfig?.max_photo_size_mb ?? 5
  const maxPhotosPerUser = eventConfig?.max_photos_per_user ?? 50

  /** Galería según show_unapproved_photos. */
  const visiblePhotos = useMemo(() => {
    if (showUnapprovedPhotos) return photos
    return photos.filter((p) => p.status === "approved")
  }, [photos, showUnapprovedPhotos])

  const visibleTotal = useMemo(() => {
    if (showUnapprovedPhotos) return totalPhotos
    if (photos.length === 0) return totalPhotos
    const hiddenOnPage = photos.length - visiblePhotos.length
    return Math.max(0, totalPhotos - hiddenOnPage)
  }, [showUnapprovedPhotos, totalPhotos, photos.length, visiblePhotos.length])

  useEffect(() => {
    setUser(getStoredUser())
  }, [])

  useEffect(() => {
    const loadData = async () => {
      const resolved = await params
      const routeId = resolved.id
      setLoadingEvent(true)
      setEventError(null)
      setGalleryNeedsLogin(false)
      try {
        const event = await getEventByIdOrSlug(routeId)
        setEventInfo(event)
        setEventId(event.id)
        setUploadMaxFiles(event.EventConfig?.max_photos_per_user ?? 50)
        setUploadMaxSizeMb(event.EventConfig?.max_photo_size_mb ?? 5)

        const token = getAuthToken() || undefined
        const canViewAnonymously = event.EventConfig?.allow_anonymous_view !== false
        if (!canViewAnonymously && !token) {
          setGalleryNeedsLogin(true)
          setPhotos([])
          setTotalPhotos(0)
          return
        }

        const gallery = await getGallery(event.id, 1, PHOTOS_PER_PAGE, token)
        setPhotos(gallery.photos.map(mapPhoto))
        setTotalPhotos(gallery.total)
        setGalleryPage(1)
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : "No se pudo cargar el evento"
        if (/iniciar sesión|login|autentic/i.test(message)) {
          setGalleryNeedsLogin(true)
          setEventError(null)
        } else {
          setEventError(message)
        }
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
    setGalleryNeedsLogin(false)
  }

  const refreshUploadLimits = async (id: string) => {
    const token = getAuthToken()
    try {
      const limits = await getUploadLimits(id, token)
      setUploadMaxFiles(limits.photos_remaining)
      setUploadMaxSizeMb(limits.max_photo_size_mb)
    } catch {
      setUploadMaxFiles(maxPhotosPerUser)
      setUploadMaxSizeMb(maxPhotoSizeMb)
    }
  }

  const totalPages = Math.max(1, Math.ceil(visibleTotal / PHOTOS_PER_PAGE))

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

  const openUploadModal = async () => {
    if (eventId) await refreshUploadLimits(eventId)
    setUploadModalOpen(true)
  }

  const handleUploadClick = () => {
    if (!allowUploads) return
    if (requireLoginToUpload && !getAuthToken()) {
      setLoginPurpose("upload")
      setLoginError(null)
      setLoginModalOpen(true)
      return
    }
    void openUploadModal()
  }

  const handleViewLoginClick = () => {
    setLoginPurpose("view")
    setLoginError(null)
    setLoginModalOpen(true)
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
      if (eventId) {
        await refreshGallery(eventId)
      }
      if (loginPurpose === "upload" && allowUploads) {
        await openUploadModal()
      }
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "No se pudo iniciar sesión con Google")
    }
  }

  const handlePhotoClick = (photo: { id: string }) => {
    const index = visiblePhotos.findIndex((p) => p.id === photo.id)
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

  const handleUpload = async (files: File[]) => {
    if (!eventId) throw new Error("Evento no encontrado")
    if (!allowUploads) throw new Error("Las subidas están deshabilitadas para este evento")
    const token = getAuthToken()
    if (requireLoginToUpload && !token) {
      throw new Error("Debes iniciar sesión para subir fotos")
    }
    if (files.length === 0) return
    const oversized = files.filter((f) => f.size > uploadMaxSizeMb * 1024 * 1024)
    if (oversized.length > 0) {
      throw new Error(`Cada foto puede pesar máximo ${uploadMaxSizeMb} MB`)
    }
    if (files.length > uploadMaxFiles) {
      throw new Error(`Solo puedes subir ${uploadMaxFiles} foto(s) más`)
    }
    await uploadPhotos(eventId, files, token)
    await refreshGallery(eventId)
    await refreshUploadLimits(eventId)
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
        showUpload={allowUploads}
        user={user}
      />

      <Dialog open={loginModalOpen} onOpenChange={setLoginModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {loginPurpose === "view"
                ? "Inicia sesión para ver la galería"
                : "Inicia sesión para subir fotos"}
            </DialogTitle>
            <DialogDescription>
              {loginPurpose === "view"
                ? "Este evento no permite ver la galería de forma anónima."
                : `Este evento requiere cuenta de Google para subir fotos (hasta ${maxPhotosPerUser} por usuario, máx. ${maxPhotoSizeMb} MB c/u).`}
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
          {galleryNeedsLogin ? (
            <div className="rounded-xl border border-border bg-muted/30 p-8 text-center space-y-4">
              <p className="font-medium text-foreground">Galería privada</p>
              <p className="text-sm text-muted-foreground">
                Este evento no permite vista anónima. Inicia sesión para ver las fotos.
              </p>
              <Button onClick={handleViewLoginClick}>Iniciar sesión</Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
                <h2 className="text-lg font-semibold text-foreground">
                  {visibleTotal <= PHOTOS_PER_PAGE
                    ? `${visibleTotal} Fotos`
                    : `${(galleryPage - 1) * PHOTOS_PER_PAGE + 1}-${Math.min(galleryPage * PHOTOS_PER_PAGE, visibleTotal)} de ${visibleTotal} Fotos`}
                </h2>
              </div>
              <PhotoGrid
                photos={visiblePhotos}
                onPhotoClick={handlePhotoClick}
                selectionMode={selectionMode}
                selectedIds={selectedPhotoIds}
                onSelectionChange={handleSelectionChange}
                showPendingBadge={showUnapprovedPhotos}
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
            </>
          )}
        </div>
      </main>

      {storyIndex !== null && (
        <StoryViewer
          photos={visiblePhotos}
          currentIndex={Math.min(storyIndex, Math.max(0, visiblePhotos.length - 1))}
          onClose={() => setStoryIndex(null)}
          onPrev={() => setStoryIndex((i) => (i !== null && i > 0 ? i - 1 : i))}
          onNext={() =>
            setStoryIndex((i) =>
              i !== null && i < visiblePhotos.length - 1 ? i + 1 : i
            )
          }
        />
      )}

      <UploadModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        onUpload={handleUpload}
        maxFiles={uploadMaxFiles}
        maxPhotoSizeMb={uploadMaxSizeMb}
        moderationEnabled={!!eventInfo.moderation_enabled}
        showUnapprovedPhotos={showUnapprovedPhotos}
      />
    </div>
  )
}
