"use client"

import Image from "next/image"
import { User, Calendar, Check, Download } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./ui/button"

interface PhotoCardProps {
  src: string
  alt: string
  username: string
  created_at: string
  status?: "pending" | "approved" | "rejected"
  onClick?: () => void
  selectionMode?: boolean
  selected?: boolean
  onSelect?: () => void
}

export function PhotoCard({ src, alt, username, created_at, onClick, selectionMode, selected, onSelect }: PhotoCardProps) {
  const handleClick = () => {
    if (selectionMode && onSelect) {
      onSelect()
    } else {
      onClick?.()
    }
  }

 

  return (
    <div
      className={cn(
        "group relative aspect-square overflow-hidden rounded-lg bg-muted cursor-pointer",
        selectionMode && selected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
      )}
      onClick={handleClick}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-105"
        sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 20vw"
      />
      {selectionMode && (
        <div className="absolute top-2 right-2 z-10 flex items-center justify-center size-6 rounded-full bg-background/80 border border-foreground/20">
          {selected ? (
            <Check className="size-4 text-primary" strokeWidth={3} />
          ) : (
            <div className="size-3.5 rounded-sm border-2 border-foreground/50" />
          )}
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
        <div className="flex items-center gap-2 text-primary-foreground text-sm">
          <User className="h-3.5 w-3.5" />
          <span className="truncate">{username}</span>
        </div>
        <div className="flex items-center gap-2 text-primary-foreground/70 text-xs mt-1">
          <Calendar className="h-3 w-3" />
          <span>{created_at}</span>
        </div>
        
      </div>
    </div>
  )
}
