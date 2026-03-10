"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Search, Plus, Calendar, MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  createEvent,
  listAdminEvents,
  setEventActive,
  updateEvent,
  uploadEventCover,
  type AdminEvent,
} from "@/lib/api-client"
import { getAuthToken } from "@/lib/auth-storage"

const statusStyles = {
  active: "bg-accent/10 text-accent border-accent/30",
  inactive: "bg-muted text-muted-foreground border-border",
}

const INITIAL_FORM = {
  name: "",
  event_location: "",
  event_date: "",
  description: "",
  cover_image_url: "",
  event_admin_emails_text: "",
  require_login_to_upload: true,
  allow_anonymous_view: true,
  allow_uploads: true,
  auto_moderation_enabled: false,
  max_photo_size_mb: 5,
  max_photos_per_user: 50,
}

export default function EventsPage() {
  const [search, setSearch] = useState("")
  const [events, setEvents] = useState<AdminEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createForm, setCreateForm] = useState(INITIAL_FORM)
  const [creating, setCreating] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingEventId, setEditingEventId] = useState<string | null>(null)

  const loadEvents = async () => {
    const token = getAuthToken()
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const response = await listAdminEvents(token, 1, 100)
      setEvents(response.events)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No se pudieron cargar eventos")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadEvents()
  }, [])

  const filteredEvents = useMemo(
    () => events.filter((event) => event.name.toLowerCase().includes(search.toLowerCase())),
    [events, search]
  )

  const handleSetActive = async (id: string, active: boolean) => {
    const token = getAuthToken()
    if (!token) return
    try {
      await setEventActive(id, token, active)
      await loadEvents()
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "No se pudo actualizar el evento")
    }
  }

  const parseAdminEmails = (text: string) =>
    text
      .split(/[\n,;]+/)
      .map((email) => email.trim())
      .filter(Boolean)

  const handleCreate = async () => {
    const token = getAuthToken()
    if (!token || !createForm.name.trim()) return
    setCreating(true)
    setError(null)
    try {
      const adminEmails = parseAdminEmails(createForm.event_admin_emails_text)
      await createEvent(token, {
        name: createForm.name.trim(),
        event_location: createForm.event_location || undefined,
        event_date: createForm.event_date || undefined,
        description: createForm.description || undefined,
        cover_image_url: createForm.cover_image_url || undefined,
        event_admin_emails: adminEmails.length > 0 ? adminEmails : undefined,
        event_config: {
          require_login_to_upload: createForm.require_login_to_upload,
          allow_anonymous_view: createForm.allow_anonymous_view,
          allow_uploads: createForm.allow_uploads,
          auto_moderation_enabled: createForm.auto_moderation_enabled,
          max_photo_size_mb: Number(createForm.max_photo_size_mb),
          max_photos_per_user: Number(createForm.max_photos_per_user),
        },
      })
      setCreateForm(INITIAL_FORM)
      setCreateModalOpen(false)
      await loadEvents()
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "No se pudo crear el evento")
    } finally {
      setCreating(false)
    }
  }

  const openCreateModal = () => {
    setCreateForm(INITIAL_FORM)
    setCreateModalOpen(true)
  }

  const openEditModal = (event: AdminEvent) => {
    setEditingEventId(event.id)
    const cfg = event.EventConfig
    setCreateForm({
      ...INITIAL_FORM,
      name: event.name,
      event_location: event.event_location || "",
      event_date: event.event_date ? String(event.event_date).slice(0, 10) : "",
      description: event.description || "",
      cover_image_url: event.cover_image_url || "",
      event_admin_emails_text: (event.event_admin_emails || []).join(", "),
      require_login_to_upload: cfg?.require_login_to_upload ?? true,
      allow_anonymous_view: cfg?.allow_anonymous_view ?? true,
      allow_uploads: cfg?.allow_uploads ?? true,
      auto_moderation_enabled: cfg?.auto_moderation_enabled ?? false,
      max_photo_size_mb: cfg?.max_photo_size_mb ?? 5,
      max_photos_per_user: cfg?.max_photos_per_user ?? 50,
    })
    setEditModalOpen(true)
  }

  const handleEdit = async () => {
    const token = getAuthToken()
    if (!token || !editingEventId || !createForm.name.trim()) return
    setCreating(true)
    setError(null)
    try {
      const adminEmails = parseAdminEmails(createForm.event_admin_emails_text)
      await updateEvent(editingEventId, token, {
        name: createForm.name.trim(),
        event_location: createForm.event_location || undefined,
        event_date: createForm.event_date || undefined,
        description: createForm.description || undefined,
        cover_image_url: createForm.cover_image_url || undefined,
        event_admin_emails: adminEmails.length > 0 ? adminEmails : undefined,
        event_config: {
          require_login_to_upload: createForm.require_login_to_upload,
          allow_anonymous_view: createForm.allow_anonymous_view,
          allow_uploads: createForm.allow_uploads,
          auto_moderation_enabled: createForm.auto_moderation_enabled,
          max_photo_size_mb: Number(createForm.max_photo_size_mb),
          max_photos_per_user: Number(createForm.max_photos_per_user),
        },
      })
      setEditModalOpen(false)
      setEditingEventId(null)
      setCreateForm(INITIAL_FORM)
      await loadEvents()
    } catch (editError) {
      setError(editError instanceof Error ? editError.message : "No se pudo editar el evento")
    } finally {
      setCreating(false)
    }
  }

  const handleCoverFileChange = async (file?: File) => {
    if (!file) return
    const token = getAuthToken()
    if (!token) return
    setUploadingCover(true)
    setError(null)
    try {
      const cloudinaryResult = await uploadEventCover(file, token)
      setCreateForm((prev) => ({
        ...prev,
        cover_image_url: cloudinaryResult.secure_url || "",
      }))
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "No se pudo subir la portada")
    } finally {
      setUploadingCover(false)
    }
  }

  const EventFormBody = (
    <>
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2">
          <Label htmlFor="eventName">Nombre del evento</Label>
          <Input
            id="eventName"
            placeholder="Boda de Ana y Luis"
            className="mt-1.5"
            value={createForm.name}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="eventLocation">Ubicacion</Label>
          <Input
            id="eventLocation"
            placeholder="Salon Primavera"
            className="mt-1.5"
            value={createForm.event_location}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, event_location: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="eventDate">Fecha</Label>
          <Input
            id="eventDate"
            type="date"
            className="mt-1.5"
            value={createForm.event_date}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, event_date: e.target.value }))}
          />
        </div>
        <div className="sm:col-span-3">
          <Label htmlFor="eventDesc">Descripcion</Label>
          <Input
            id="eventDesc"
            placeholder="Evento corporativo..."
            className="mt-1.5"
            value={createForm.description}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="eventImageFile">Portada del evento (archivo)</Label>
          <Input
            id="eventImageFile"
            type="file"
            accept="image/*"
            className="mt-1.5"
            onChange={(e) => void handleCoverFileChange(e.target.files?.[0])}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {uploadingCover
              ? "Subiendo portada a Cloudinary..."
              : createForm.cover_image_url
                ? `Portada subida: ${createForm.cover_image_url}`
                : "La URL segura de Cloudinary se guarda automaticamente."}
          </p>
        </div>
        <div className="sm:col-span-1">
          <Label htmlFor="eventAdminEmails">Correos de administradores del evento</Label>
          <Input
            id="eventAdminEmails"
            placeholder="a@correo.com,b@correo.com"
            className="mt-1.5"
            value={createForm.event_admin_emails_text}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, event_admin_emails_text: e.target.value }))}
          />
          <p className="text-xs text-muted-foreground mt-1">Puedes ingresar varios separados por coma.</p>
        </div>
      </div>
      <div className="border rounded-lg p-3 mt-4">
        <p className="text-sm font-medium text-foreground mb-3">Configuracion inicial del evento</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="cfgRequireLogin">Login obligatorio para subir</Label>
            <Switch
              id="cfgRequireLogin"
              checked={createForm.require_login_to_upload}
              onCheckedChange={(checked) => setCreateForm((prev) => ({ ...prev, require_login_to_upload: checked }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="cfgAllowAnon">Permitir vista anonima</Label>
            <Switch
              id="cfgAllowAnon"
              checked={createForm.allow_anonymous_view}
              onCheckedChange={(checked) => setCreateForm((prev) => ({ ...prev, allow_anonymous_view: checked }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="cfgAllowUploads">Permitir subidas</Label>
            <Switch
              id="cfgAllowUploads"
              checked={createForm.allow_uploads}
              onCheckedChange={(checked) => setCreateForm((prev) => ({ ...prev, allow_uploads: checked }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="cfgAutoMod">Auto moderacion</Label>
            <Switch
              id="cfgAutoMod"
              checked={createForm.auto_moderation_enabled}
              onCheckedChange={(checked) => setCreateForm((prev) => ({ ...prev, auto_moderation_enabled: checked }))}
            />
          </div>
          <div>
            <Label htmlFor="cfgMaxSize">Max MB por foto</Label>
            <Input
              id="cfgMaxSize"
              type="number"
              min={1}
              className="mt-1.5"
              value={createForm.max_photo_size_mb}
              onChange={(e) =>
                setCreateForm((prev) => ({ ...prev, max_photo_size_mb: Number(e.target.value) || 1 }))
              }
            />
          </div>
          <div>
            <Label htmlFor="cfgMaxPhotos">Max fotos por usuario</Label>
            <Input
              id="cfgMaxPhotos"
              type="number"
              min={1}
              className="mt-1.5"
              value={createForm.max_photos_per_user}
              onChange={(e) =>
                setCreateForm((prev) => ({ ...prev, max_photos_per_user: Number(e.target.value) || 1 }))
              }
            />
          </div>
        </div>
      </div>
    </>
  )

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Eventos
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona todos los eventos en tu plataforma
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          Crear evento
        </Button>
      </div>

      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto min-w-4xl">
          <DialogHeader>
            <DialogTitle>Crear evento</DialogTitle>
            <DialogDescription>Completa los campos y guarda el evento.</DialogDescription>
          </DialogHeader>
          {EventFormBody}
          <div className="pt-4">
            <Button onClick={handleCreate} disabled={creating || !createForm.name.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              {creating ? "Creando..." : "Crear evento"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto min-w-4xl">
          <DialogHeader>
            <DialogTitle>Editar evento</DialogTitle>
            <DialogDescription>Actualiza los datos del evento seleccionado.</DialogDescription>
          </DialogHeader>
          {EventFormBody}
          <div className="pt-4">
            <Button onClick={handleEdit} disabled={creating || !createForm.name.trim()}>
              <Pencil className="h-4 w-4 mr-2" />
              {creating ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive mb-6">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar eventos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Events Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  UUID
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Evento
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Fecha
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Estado
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredEvents.map((event) => (
                <tr key={event.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-4 px-4">
                    <span className="text-sm">{event.id}</span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      {event.cover_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={event.cover_image_url}
                          alt={event.name}
                          className="w-10 h-10 rounded-md object-cover border border-border"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-md border border-dashed border-border" />
                      )}
                      <span className="font-medium text-foreground">{event.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">{event.event_date || "Sin fecha"}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${statusStyles[event.is_active ? "active" : "inactive"]}`}>
                      {event.is_active ? "active" : "inactive"}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/events/${event.id}`} className="flex items-center">
                            <Eye className="h-4 w-4 mr-2" />
                            Ver evento
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditModal(event)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar evento
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleSetActive(event.id, !event.is_active)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {event.is_active ? "Desactivar evento" : "Activar evento"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-border">
          {filteredEvents.map((event) => (
            <div key={event.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-foreground truncate">
                      {event.name}
                    </h3>
                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusStyles[event.is_active ? "active" : "inactive"]}`}>
                      {event.is_active ? "active" : "inactive"}
                    </span>
                  </div>
                  <div className="mt-2">
                    {event.cover_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={event.cover_image_url}
                        alt={event.name}
                        className="w-full max-w-xs h-24 rounded-md object-cover border border-border"
                      />
                    ) : null}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span>{event.event_date || "Sin fecha"}</span>
                    <span>{event.id}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <Link href={`/admin/events/${event.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(event)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleSetActive(event.id, !event.is_active)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {!loading && filteredEvents.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No events found</p>
          </div>
        )}
        {loading && (
          <div className="p-8 text-center text-muted-foreground">Cargando eventos...</div>
        )}
      </div>
    </div>
  )
}
