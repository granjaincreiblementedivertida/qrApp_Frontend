"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getEventByIdOrSlug, type EventSummary } from "@/lib/api-client"
import { QRCodeSVG } from "qrcode.react"
import { ArrowLeft, Calendar, Download, ImageIcon, Mail, MapPin } from "lucide-react"

type PageProps = { params: Promise<{ id: string }> }

export default function AdminEventViewPage({ params }: PageProps) {
  const [eventId, setEventId] = useState<string | null>(null)
  const [event, setEvent] = useState<EventSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const qrRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    params.then((p) => {
      const id = p.id
      if (!id) return
      setEventId(id)
      getEventByIdOrSlug(id)
        .then((data) => {
          if (!cancelled) setEvent(data)
        })
        .catch((err) => {
          if (!cancelled) setError(err instanceof Error ? err.message : "Error al cargar el evento")
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    })
    return () => {
      cancelled = true
    }
  }, [params])

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? ""
  const eventUrl = eventId && baseUrl ? `${baseUrl.replace(/\/$/, "")}/event/${eventId}` : ""

  const handleDownloadQr = () => {
    const wrapper = qrRef.current
    const svg = wrapper?.querySelector("svg")
    if (!svg || !eventId) return
    const svgStr = new XMLSerializer().serializeToString(svg)
    const blob = new Blob([svgStr], { type: "image/svg+xml" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `qr-evento-${eventId}.svg`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">Cargando evento...</div>
    )
  }

  if (error || !event) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Button variant="ghost" asChild>
          <Link href="/admin/events">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a eventos
          </Link>
        </Button>
        <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center">
          <p className="text-destructive font-medium">{error || "Evento no encontrado"}</p>
        </div>
      </div>
    )
  }

  const config = event.EventConfig

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/admin/events" className="flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a eventos
          </Link>
        </Button>
      </div>

      <div className="space-y-6">
        {/* Portada y nombre */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {event.cover_image_url ? (
            <div className="aspect-video w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={event.cover_image_url}
                alt={event.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="aspect-video w-full bg-muted flex items-center justify-center">
              <ImageIcon className="h-16 w-16 text-muted-foreground" />
            </div>
          )}
          <div className="p-6">
            <h1 className="text-2xl font-bold text-foreground">{event.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">UUID: {event.id}</p>
          </div>
        </div>

        {/* Info básica */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Información</h2>
          <dl className="space-y-3 text-sm">
            {event.event_admin_emails?.length ? (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Administradores:</span>
                <span className="text-foreground">{event.event_admin_emails.join(", ")}</span>
              </div>
            ) : null}
            {event.event_date && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Fecha:</span>
                <span className="text-foreground">{String(event.event_date).slice(0, 10)}</span>
              </div>
            )}
            {event.event_location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Lugar:</span>
                <span className="text-foreground">{event.event_location}</span>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Estado: </span>
              <span className={event.is_active ? "text-accent" : "text-muted-foreground"}>
                {event.is_active ? "Activo" : "Inactivo"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Moderación: </span>
              <span className="text-foreground">
                {event.moderation_enabled ? "Activada" : "Desactivada"}
              </span>
            </div>
            {event.description && (
              <div>
                <span className="text-muted-foreground block mb-1">Descripción</span>
                <p className="text-foreground">{event.description}</p>
              </div>
            )}
          </dl>
        </div>

        {/* Config (EventConfig) */}
        {config && (
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Configuración de fotos</h2>
            <ul className="space-y-2 text-sm text-foreground">
              <li>Subidas permitidas: {config.allow_uploads ? "Sí" : "No"}</li>
              <li>Vista anónima: {config.allow_anonymous_view ? "Sí" : "No"}</li>
              <li>Requiere login para subir: {config.require_login_to_upload ? "Sí" : "No"}</li>
              <li>Auto-moderación: {config.auto_moderation_enabled ? "Sí" : "No"}</li>
              <li>Máx. tamaño (MB): {config.max_photo_size_mb}</li>
              <li>Máx. fotos por usuario: {config.max_photos_per_user}</li>
            </ul>
          </div>
        )}

        {/* QR */}
        {eventUrl && (
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold text-foreground mb-2">Enlace del evento (QR)</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Escanea el código para ir a la galería del evento
            </p>
            <div className="flex flex-wrap items-start gap-6">
              <div ref={qrRef} className="flex-shrink-0 rounded-lg border border-border bg-white p-3">
                <QRCodeSVG value={eventUrl} size={180} level="M" />
              </div>
              <div className="min-w-0 flex flex-col gap-2">
                <p className="text-sm font-medium text-foreground">URL</p>
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
        )}

        <div className="flex gap-3">
          <Button asChild>
            <Link href={`/event/${event.id}/settings`}>Ir a configuración del evento</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/event/${event.id}`} target="_blank" rel="noopener noreferrer">
              Abrir galería
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
