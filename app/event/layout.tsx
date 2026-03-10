"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { AdminSidebar } from "@/components/admin-sidebar"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function EventAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Rutas obsoletas sin [id]: redirigir a /event
  useEffect(() => {
    if (pathname === "/event/moderation" || pathname === "/event/settings") {
      router.replace("/event")
    }
  }, [pathname, router])

  // Rutas sin [id] (moderation/settings): redirigir; mientras tanto no mostrar sidebar
  if (pathname === "/event/moderation" || pathname === "/event/settings") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
        Redirigiendo...
      </div>
    )
  }

  // Sin sidebar: login (/event) y galería pública (/event/[id] con un solo segmento que no sea moderation/settings)
  const isEventLogin = pathname === "/event" || pathname === "/event/"
  const isEventGallery = /^\/event\/[^/]+$/.test(pathname) // un solo segmento = galería (moderation/settings ya redirigen)
  if (isEventLogin || isEventGallery) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen bg-background h-screen">
      <AdminSidebar
        variant="event"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      
      <div className="flex-1 flex flex-col lg:ml-64">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-30 bg-background border-b border-border px-4 h-14 flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <span className="ml-3 font-semibold text-foreground">Event Admin</span>
        </header>
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
