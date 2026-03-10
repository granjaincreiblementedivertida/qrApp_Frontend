"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Calendar, Users, Image as ImageIcon, TrendingUp, ArrowRight } from "lucide-react"
import { DashboardCard } from "@/components/dashboard-card"
import { Button } from "@/components/ui/button"
import { getAdminStats, listAdminEvents, type AdminEvent } from "@/lib/api-client"
import { getAuthToken } from "@/lib/auth-storage"

const statusStyles = {
  active: "bg-accent/10 text-accent",
  inactive: "bg-muted text-muted-foreground",
}

export default function GeneralAdminDashboard() {
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalUsers: 0,
    totalPhotos: 0,
    activeEvents: 0,
  })
  const [recentEvents, setRecentEvents] = useState<AdminEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const token = getAuthToken()
      if (!token) {
        setError("No hay sesion de administrador.")
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      try {
        const [statsRes, eventsRes] = await Promise.all([
          getAdminStats(token),
          listAdminEvents(token, 1, 6),
        ])
        setRecentEvents(eventsRes.events)
        setStats({
          totalEvents: statsRes.total_events,
          totalUsers: statsRes.total_users,
          totalPhotos: statsRes.total_photos,
          activeEvents: eventsRes.events.filter((event) => event.is_active).length,
        })
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "No se pudo cargar el dashboard")
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const cards = useMemo(() => ([
    {
      title: "Total Events",
      value: stats.totalEvents,
      icon: Calendar,
      trend: { value: 0, isPositive: true },
    },
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      trend: { value: 0, isPositive: true },
    },
    {
      title: "Total Photos",
      value: stats.totalPhotos.toLocaleString(),
      icon: ImageIcon,
      trend: { value: 0, isPositive: true },
    },
    {
      title: "Active Events",
      value: stats.activeEvents,
      icon: TrendingUp,
      subtitle: "Actualmente activos",
    },
  ]), [stats])

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Welcome back! Here{"'"}s an overview of your platform.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive mb-6">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <DashboardCard
            key={card.title}
            title={card.title}
            value={loading ? "-" : card.value}
            icon={card.icon}
            trend={card.trend}
            subtitle={card.subtitle}
          />
        ))}
      </div>

      {/* Recent Events */}
      <div className="rounded-xl border border-border bg-card">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            Recent Events
          </h2>
          <Link href="/admin/events">
            <Button variant="ghost" size="sm">
              View all
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="divide-y divide-border">
          {recentEvents.map((event) => (
            <div
              key={event.id}
              className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div>
                <h3 className="font-medium text-foreground">{event.name}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {event.event_date || "Sin fecha"} • slug: {event.slug}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusStyles[event.is_active ? "active" : "inactive"]}`}>
                  {event.is_active ? "active" : "inactive"}
                </span>
                <Link href={`/event?eventId=${encodeURIComponent(event.id)}&redirect=/event/moderation`}>
                  <Button variant="outline" size="sm">
                    Manage
                  </Button>
                </Link>
              </div>
            </div>
          ))}
          {!loading && recentEvents.length === 0 && (
            <div className="p-6 text-sm text-muted-foreground">No hay eventos recientes.</div>
          )}
        </div>
      </div>
    </div>
  )
}
