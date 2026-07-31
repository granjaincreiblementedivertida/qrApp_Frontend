"use client"

import { useState, useCallback, useEffect } from "react"
import { X, Upload, ImageIcon, Check, Clock, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface UploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpload?: (files: File[]) => Promise<void>
  /** Máximo de fotos seleccionables en esta subida (restantes / config del evento). */
  maxFiles?: number
  /** Peso máximo por foto en MB según EventConfig. */
  maxPhotoSizeMb?: number
  /** Si true (Event.moderation_enabled), las fotos quedan pendientes de revisión. */
  moderationEnabled?: boolean
  /**
   * EventConfig.show_unapproved_photos:
   * - false → mensaje de que aparecerán cuando el admin apruebe (y no se muestran aún)
   * - true → "Las imágenes están en revisión" y sí se muestran en la galería
   */
  showUnapprovedPhotos?: boolean
}

type UploadStatus = "idle" | "uploading" | "success" | "review"

function formatMb(mb: number) {
  return Number.isInteger(mb) ? String(mb) : mb.toFixed(1)
}

export function UploadModal({
  open,
  onOpenChange,
  onUpload,
  maxFiles = 50,
  maxPhotoSizeMb = 5,
  moderationEnabled = false,
  showUnapprovedPhotos = false,
}: UploadModalProps) {
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [status, setStatus] = useState<UploadStatus>("idle")
  const [progress, setProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const maxBytes = maxPhotoSizeMb * 1024 * 1024
  const effectiveMaxFiles = Math.max(1, maxFiles)

  const filterImages = useCallback(
    (list: FileList | null): { accepted: File[]; errors: string[] } => {
      if (!list) return { accepted: [], errors: [] }
      const errors: string[] = []
      const images = Array.from(list).filter((f) => f.type.startsWith("image/"))
      if (images.length === 0) {
        return { accepted: [], errors: ["Solo se permiten imágenes."] }
      }

      const withinSize = images.filter((f) => {
        if (f.size <= maxBytes) return true
        errors.push(`"${f.name}" supera ${formatMb(maxPhotoSizeMb)} MB`)
        return false
      })

      if (withinSize.length > effectiveMaxFiles) {
        errors.push(
          `Máximo ${effectiveMaxFiles} foto${effectiveMaxFiles === 1 ? "" : "s"}. Se tomaron las primeras.`
        )
      }

      return {
        accepted: withinSize.slice(0, effectiveMaxFiles),
        errors,
      }
    },
    [maxBytes, maxPhotoSizeMb, effectiveMaxFiles]
  )

  const handleFiles = useCallback((newFiles: File[], nextErrors: string[] = []) => {
    if (newFiles.length === 0 && nextErrors.length === 0) return
    setFiles(newFiles)
    setError(nextErrors.length ? nextErrors.join(". ") : null)
    setStatus("idle")
  }, [])

  useEffect(() => {
    if (!open) return
    if (files.length === 0) {
      setPreviews((prev) => {
        prev.forEach((u) => URL.revokeObjectURL(u))
        return []
      })
      return
    }
    const urls = files.map((f) => URL.createObjectURL(f))
    setPreviews(urls)
    return () => urls.forEach((u) => URL.revokeObjectURL(u))
  }, [open, files])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { accepted, errors } = filterImages(e.target.files)
      handleFiles(accepted, errors)
      e.target.value = ""
    },
    [filterImages, handleFiles]
  )

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true)
    else if (e.type === "dragleave") setDragActive(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)
      const { accepted, errors } = filterImages(e.dataTransfer.files)
      handleFiles(accepted, errors)
    },
    [filterImages, handleFiles]
  )

  const removeFile = useCallback((index: number) => {
    const next = files.filter((_, i) => i !== index)
    setFiles(next)
    setError(null)
  }, [files])

  const handleUpload = async () => {
    if (files.length === 0) return
    if (effectiveMaxFiles <= 0) {
      setError("Ya alcanzaste el límite de fotos para este evento.")
      return
    }
    setStatus("uploading")
    setProgress(0)
    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 90 ? 90 : prev + 10))
    }, 150)
    try {
      if (onUpload) {
        await onUpload(files)
      } else {
        await new Promise((r) => setTimeout(r, 1500))
      }
      clearInterval(interval)
      setProgress(100)
      setStatus("success")
      if (moderationEnabled) {
        setTimeout(() => setStatus("review"), 1500)
      } else {
        setTimeout(() => onOpenChange(false), 1500)
      }
    } catch (err) {
      clearInterval(interval)
      setError(err instanceof Error ? err.message : "Error al subir")
      setStatus("idle")
    }
  }

  const onOpenChangeDialog = useCallback(
    (o: boolean) => {
      if (!o) {
        setTimeout(() => {
          setFiles([])
          setPreviews([])
          setStatus("idle")
          setProgress(0)
          setError(null)
        }, 200)
      }
      onOpenChange(o)
    },
    [onOpenChange]
  )

  const limitHint =
    effectiveMaxFiles <= 0
      ? "Ya alcanzaste el límite de fotos de este evento."
      : `Hasta ${effectiveMaxFiles} foto${effectiveMaxFiles === 1 ? "" : "s"}, máx. ${formatMb(maxPhotoSizeMb)} MB c/u.`

  return (
    <Dialog open={open} onOpenChange={onOpenChangeDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Subir fotos</DialogTitle>
          <DialogDescription>{limitHint}</DialogDescription>
        </DialogHeader>

        {status === "success" && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-accent-foreground" />
            </div>
            <p className="font-medium text-foreground">
              {files.length === 1 ? "Foto subida" : `${files.length} fotos subidas`}
            </p>
          </div>
        )}

        {status === "review" && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 rounded-full bg-warning flex items-center justify-center mb-4">
              <Clock className="h-8 w-8 text-warning-foreground" />
            </div>
            <p className="font-medium text-foreground">
              {showUnapprovedPhotos ? "Las imágenes están en revisión" : "Fotos en revisión"}
            </p>
            <p className="text-sm text-muted-foreground mt-1 text-center px-2">
              {showUnapprovedPhotos
                ? "Ya aparecen en la galería mientras el admin las revisa"
                : "Aparecerán en la galería cuando sean aprobadas"}
            </p>
            <Button onClick={() => onOpenChangeDialog(false)} className="mt-4">
              Listo
            </Button>
          </div>
        )}

        {status !== "success" && status !== "review" && (
          <>
            {effectiveMaxFiles <= 0 ? (
              <div className="rounded-lg border border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
                Has alcanzado el máximo de fotos permitidas en este evento.
              </div>
            ) : files.length === 0 ? (
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                  dragActive ? "border-accent bg-accent/10" : "border-border"
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept="image/*"
                  multiple={effectiveMaxFiles > 1}
                  onChange={handleInputChange}
                  className="hidden"
                  id="photo-upload"
                />
                <label htmlFor="photo-upload" className="flex flex-col items-center cursor-pointer">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    Arrastra aquí hasta {effectiveMaxFiles} foto{effectiveMaxFiles === 1 ? "" : "s"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    o haz clic para elegir · máx. {formatMb(maxPhotoSizeMb)} MB c/u
                  </p>
                </label>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  {files.length} de {effectiveMaxFiles} fotos seleccionadas
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 max-h-40 overflow-y-auto">
                  {previews.map((src, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      {status === "idle" && (
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-foreground/80 text-background flex items-center justify-center hover:bg-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {status === "idle" && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFiles([])
                        setPreviews([])
                      }}
                    >
                      Limpiar
                    </Button>
                    <Button onClick={handleUpload} className="flex-1">
                      <Upload className="h-4 w-4 mr-2" />
                      Subir {files.length} {files.length === 1 ? "foto" : "fotos"}
                    </Button>
                  </div>
                )}
                {status === "uploading" && (
                  <div className="space-y-2">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent transition-all duration-200"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1.5">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Subiendo al backend y a la galería…
                    </p>
                  </div>
                )}
              </div>
            )}
            {error && status !== "uploading" && (
              <p className="text-sm text-destructive mt-2">{error}</p>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
