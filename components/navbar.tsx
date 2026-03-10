"use client"

import Link from "next/link"
import { Camera, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"

export type NavbarUser = {
  name?: string | null
  avatar_url?: string | null
  email?: string
}

interface NavbarProps {
  onUploadClick?: () => void
  showUpload?: boolean
  user?: NavbarUser | null
}

export function Navbar({ onUploadClick, showUpload = true, user }: NavbarProps) {
  const displayName = user?.name || user?.email || null
  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2 mb-6 mt-6">
            <div className="w-8 h-8 bg-brand-accent rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
          <span className="text-xl font-bold tracking-tight">{process.env.NEXT_PUBLIC_APP_NAME}<span className="text-brand-accent">QR</span></span>

          </Link>

          <div className="flex items-center gap-3">
            {displayName && (
              <span className="text-sm text-muted-foreground truncate max-w-[120px] sm:max-w-[180px]" title={displayName}>
                {user?.avatar_url ? (
                  <span className="flex items-center gap-2">
                    <img
                      src={user.avatar_url}
                      alt=""
                      width={24}
                      height={24}
                      className="rounded-full shrink-0 w-6 h-6"
                    />
                    <span className="hidden sm:inline">{displayName}</span>
                  </span>
                ) : (
                  displayName
                )}
              </span>
            )}
            {showUpload && (
              <Button onClick={onUploadClick} size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Subir hasta 5 fotos
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
