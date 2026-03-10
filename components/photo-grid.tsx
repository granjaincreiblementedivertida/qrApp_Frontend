"use client"

import { PhotoCard } from "./photo-card"

interface Photo {
  id: string
  src: string
  alt: string
  username: string
  created_at: string
  status?: "pending" | "approved" | "rejected"
}

interface PhotoGridProps {
  photos: Photo[]
  onPhotoClick?: (photo: Photo) => void
  selectionMode?: boolean
  selectedIds?: Set<string>
  onSelectionChange?: (id: string) => void
}

export function PhotoGrid({ photos, onPhotoClick, selectionMode, selectedIds, onSelectionChange }: PhotoGridProps) {
  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-sm font-medium">No photos yet</p>
        <p className="text-xs mt-1">Be the first to share a moment</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-1 sm:gap-2">
      {photos.map((photo) => (
        <PhotoCard
          key={photo.id}
          src={photo.src}
          alt={photo.alt}
          username={photo.username}
          created_at={photo.created_at}
          status={photo.status}
          onClick={() => onPhotoClick?.(photo)}
          selectionMode={selectionMode}
          selected={selectedIds?.has(photo.id)}
          onSelect={() => onSelectionChange?.(photo.id)}
        />
      ))}
    </div>
  )
}
