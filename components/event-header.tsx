"use client"

import Image from "next/image"
import { Calendar, MapPin } from "lucide-react"

interface EventHeaderProps {
  name: string
  date: string
  location?: string
  coverImage: string
  description?: string
}

export function EventHeader({ name, date, location, coverImage, description }: EventHeaderProps) {
  return (
    <div className="relative">
      <div className="relative h-100 sm:h-120 md:h-140 overflow-hidden">
        <Image
          src={coverImage}
          alt={name}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/40 to-transparent" />
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary-foreground text-balance">
          {name}
        </h1>
        {description ? (
            <p className="text-lg text-muted-foreground mb-4 text-primary-foreground/90">{description}</p>
          ) : null}
        <div className="flex flex-wrap gap-4 mt-3 text-primary-foreground/90">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4" />
            <span>{date}</span>
          </div>
          {location && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4" />
              <span>{location}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
