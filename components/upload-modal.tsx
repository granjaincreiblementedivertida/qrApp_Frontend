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

const MAX_FILES = 5

interface UploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpload?: (files: File[]) => Promise<void>
}

type UploadStatus = "idle" | "uploading" | "success" | "review"

export function UploadModal({ open, onOpenChange, onUpload }: UploadModalProps) {
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [status, setStatus] = useState<UploadStatus>("idle")
  const [progress, setProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const imageFiles = useCallback((list: FileList | null): File[] => {
    if (!list) return []
    return Array.from(list).filter((f) => f.type.startsWith("image/")).slice(0, MAX_FILES)
  }, [])

  const handleFiles = useCallback((newFiles: File[]) => {
    if (newFiles.length === 0) return
    setFiles(newFiles)
    setError(null)
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
      const list = e.target.files
      const selected = imageFiles(list)
      if (selected.length > MAX_FILES) {
        setError(`Solo se permiten hasta ${MAX_FILES} fotos. Se tomaron las primeras ${MAX_FILES}.`)
      }
      handleFiles(selected)
      e.target.value = ""
    },
    [imageFiles, handleFiles]
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
      const dropped = imageFiles(e.dataTransfer.files)
      if (dropped.length > MAX_FILES) {
        setError(`Máximo ${MAX_FILES} fotos. Se tomaron las primeras ${MAX_FILES}.`)
      }
      handleFiles(dropped)
    },
    [imageFiles, handleFiles]
  )

  const removeFile = useCallback((index: number) => {
    const next = files.filter((_, i) => i !== index)
    setFiles(next)
    setError(null)
  }, [files])

  const handleUpload = async () => {
    if (files.length === 0) return
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
      setTimeout(() => setStatus("review"), 1500)
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

  return (
    <Dialog open={open} onOpenChange={onOpenChangeDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Subir fotos</DialogTitle>
          <DialogDescription>
            Puedes subir hasta {MAX_FILES} fotos a la vez.
          </DialogDescription>
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
            <p className="font-medium text-foreground">Fotos en revisión</p>
            <p className="text-sm text-muted-foreground mt-1">
              Aparecerán en la galería cuando sean aprobadas
            </p>
            <Button onClick={() => onOpenChangeDialog(false)} className="mt-4">
              Listo
            </Button>
          </div>
        )}

        {status !== "success" && status !== "review" && (
          <>
            {files.length === 0 ? (
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
                  multiple
                  onChange={handleInputChange}
                  className="hidden"
                  id="photo-upload"
                />
                <label htmlFor="photo-upload" className="flex flex-col items-center cursor-pointer">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    Arrastra aquí hasta {MAX_FILES} fotos
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">o haz clic para elegir</p>
                </label>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  {files.length} de {MAX_FILES} fotos seleccionadas
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
                    <p className="text-xs text-center text-muted-foreground">
                      Subiendo al backend y a la galería…
                    </p>
                  </div>
                )}
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
