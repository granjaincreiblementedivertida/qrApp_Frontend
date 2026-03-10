"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { AdminSidebar } from "@/components/admin-sidebar"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getSession } from "@/lib/api-client"
import { clearSession, getAuthToken, getStoredUser } from "@/lib/auth-storage"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [checking, setChecking] = useState(true)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const validate = async () => {
      if (pathname.startsWith("/admin/login")) {
        setChecking(false)
        return
      }
      const token = getAuthToken()
      const user = getStoredUser()
      if (!token || !user) {
        router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`)
        return
      }
      try {
        const me = await getSession(token)
        if (me.user.role !== "admin") {
          clearSession()
          router.replace("/admin/login")
          return
        }
      } catch {
        clearSession()
        router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`)
        return
      }
      setChecking(false)
    }
    void validate()
  }, [pathname, router])

  const signOut = () => {
    clearSession()
    router.push("/admin/login")
  }

  if (pathname.startsWith("/admin/login")) {
    return <>{children}</>
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
        Verificando sesion de administrador...
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background h-screen">
      <AdminSidebar
        variant="general"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSignOut={signOut}
      />
      
      <div className="flex-1 flex flex-col">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-30 bg-background border-b border-border px-4 h-14 flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <span className="ml-3 font-semibold text-foreground">Admin Panel</span>
        </header>
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
