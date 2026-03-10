"use client"

import { useEffect, useCallback } from "react"
import { X, ChevronLeft, ChevronRight, User, Calendar, Download } from "lucide-react"
import { Button } from "./ui/button"

export type StoryPhoto = {
  id: string
  src: string
  alt: string
  username: string
  created_at: string
}

interface StoryViewerProps {
  photos: StoryPhoto[]
  currentIndex: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}

export function StoryViewer({
  photos,
  currentIndex,
  onClose,
  onPrev,
  onNext,
}: StoryViewerProps) {
  const photo = photos[currentIndex]
  const hasPrev = currentIndex > 0
  const hasNext = currentIndex < photos.length - 1

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowLeft") hasPrev && onPrev()
      if (e.key === "ArrowRight") hasNext && onNext()
    },
    [onClose, onPrev, onNext, hasPrev, hasNext]
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  // Avance automático cada 4 segundos
  useEffect(() => {
    if (!hasNext) return
    const t = setInterval(() => onNext(), 4000)
    return () => clearInterval(t)
  }, [currentIndex, hasNext, onNext])

  if (!photo) return null

  const handleDownloadSelected = async () => {
    try {
      const res = await fetch(photo.src)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `foto-${Date.now()}.jpg`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // Fallback: abrir en nueva pestaña
      window.open(photo.src, "_blank")
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 h-screen w-screen"
      role="dialog"
      aria-modal="true"
      aria-label="Visor de foto"
    >
      {/* Cerrar */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-10 rounded-full p-2 text-white/90 hover:bg-white/10 hover:text-white transition-colors"
        aria-label="Cerrar"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Anterior */}
      {hasPrev && (
        <button
          type="button"
          onClick={onPrev}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 rounded-full p-2 text-white/90 hover:bg-white/10 hover:text-white transition-colors"
          aria-label="Foto anterior"
        >
          <ChevronLeft className="h-10 w-10" />
        </button>
      )}

      {/* Siguiente */}
      {hasNext && (
        <button
          type="button"
          onClick={onNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 rounded-full p-2 text-white/90 hover:bg-white/10 hover:text-white transition-colors"
          aria-label="Foto siguiente"
        >
          <ChevronRight className="h-10 w-10" />
        </button>
      )}

      {/* Zonas clicables para navegar (estilo historias: izquierda = anterior, derecha = siguiente) */}
      <div className="absolute inset-0 flex">
        <button
          type="button"
          className="flex-1 cursor-default"
          onClick={hasPrev ? onPrev : undefined}
          aria-hidden
        />
        <button
          type="button"
          className="flex-1 cursor-default"
          onClick={hasNext ? onNext : undefined}
          aria-hidden
        />
      </div>

      {/* Imagen centrada (pointer-events-none para que los clics pasen a las zonas anterior/siguiente) */}
      <div className="absolute inset-0 flex items-center justify-center pt-14 pb-24 px-4 pointer-events-none min-h-0">
        <div className="w-full max-w-5xl h-full max-h-[calc(100vh-8rem)] flex items-center justify-center min-h-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.src}
            alt={photo.alt}
            className="max-w-full max-h-full w-auto h-auto object-contain select-none rounded-lg"
            draggable={false}
          />
        </div>
      </div>

      {/* Pie de foto (usuario y fecha) */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pb-8 bg-gradient-to-t from-black/80 to-transparent rounded-b-lg">
        <div className="max-w-5xl mx-auto flex items-center gap-3 text-white/95">
          <User className="h-4 w-4 shrink-0" />
          <span className="font-medium text-xs sm:text-sm">{photo.username}</span>
          <span className="text-white/70">·</span>
          <Calendar className="h-4 w-4 shrink-0 text-white/70" />
          <span className="text-white/80 text-xs sm:text-sm">{photo.created_at}</span>
          <div>
            <button
              type="button"
              onClick={handleDownloadSelected}
              className="gap-1.5 text-white justify-center items-center flex border border-white rounded-md px-2 py-1 hover:bg-white/40 hover:text-white transition-colors hover:cursor-pointer sm:text-sm"
            >
              <Download className="size-4 text-white" />
              Descargar
            </button>
          </div>
        </div>
      </div>

      {/* Indicador de posición (puntos tipo historias) */}
      <div className="absolute top-4 left-4 right-14 flex gap-1.5 justify-center">
        {photos.map((_, i) => (
          <div
            key={photos[i].id}
            className={`h-0.5 flex-1 max-w-12 rounded-full transition-colors ${i === currentIndex ? "bg-white" : "bg-white/30"
              }`}
          />
        ))}
      </div>
    </div>
  )
}
