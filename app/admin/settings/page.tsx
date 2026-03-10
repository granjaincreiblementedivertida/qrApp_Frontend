"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { getAdminStats, listAuditLogs, type AuditLog } from "@/lib/api-client"
import { getAuthToken } from "@/lib/auth-storage"

export default function AdminSettingsPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [settings, setSettings] = useState({
    platformName: process.env.NEXT_PUBLIC_APP_NAME,
    supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL,
    defaultModeration: true,
    allowSignups: true,
    requireEmailVerification: true,
    maxPhotoSize: "10",
    maxPhotosPerEvent: "1000",
  })

  useEffect(() => {
    const load = async () => {
      const token = getAuthToken()
      if (!token) return
      setLoading(true)
      try {
        const [stats, logs] = await Promise.all([
          getAdminStats(token),
          listAuditLogs(token, 1, 10),
        ])
        setSettings((prev) => ({
          ...prev,
          maxPhotosPerEvent: String(Math.max(1000, stats.total_photos || 1000)),
        }))
        setAuditLogs(logs.logs)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "No se pudo cargar configuracion")
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const handleSave = () => {
    setMessage("Configuracion guardada localmente en UI. (Aun no existe endpoint global en backend para persistir ajustes de plataforma).")
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Configuracion de la plataforma
        </h1>
        <p className="text-muted-foreground mt-1">
          Configura los ajustes globales para tu plataforma {process.env.NEXT_PUBLIC_APP_NAME}
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive mb-6">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-lg border border-accent/30 bg-accent/10 p-3 text-sm text-foreground mb-6">
          {message}
        </div>
      )}

      <div className="space-y-8">
        {/* General Settings */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            General
          </h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="platformName">Platform Name</Label>
              <Input
                id="platformName"
                  disabled={loading}
                value={settings.platformName}
                onChange={(e) =>
                  setSettings({ ...settings, platformName: e.target.value })
                }
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="supportEmail">Support Email</Label>
              <Input
                id="supportEmail"
                type="email"
                  disabled={loading}
                value={settings.supportEmail}
                onChange={(e) =>
                  setSettings({ ...settings, supportEmail: e.target.value })
                }
                className="mt-1.5"
              />
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Security & Access
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Allow New Signups</p>
                <p className="text-sm text-muted-foreground">
                  Allow new users to create accounts
                </p>
              </div>
              <Switch
                disabled={loading}
                checked={settings.allowSignups}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, allowSignups: checked })
                }
              />
            </div>
            <div className="border-t border-border pt-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Email Verification</p>
                <p className="text-sm text-muted-foreground">
                  Require email verification for new accounts
                </p>
              </div>
              <Switch
                disabled={loading}
                checked={settings.requireEmailVerification}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, requireEmailVerification: checked })
                }
              />
            </div>
          </div>
        </div>

        {/* Photo Settings */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Photo Settings
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Default Moderation</p>
                <p className="text-sm text-muted-foreground">
                  Enable moderation by default for new events
                </p>
              </div>
              <Switch
                disabled={loading}
                checked={settings.defaultModeration}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, defaultModeration: checked })
                }
              />
            </div>
            <div className="border-t border-border pt-4 grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="maxPhotoSize">Max Photo Size (MB)</Label>
                <Input
                  id="maxPhotoSize"
                  type="number"
                  disabled={loading}
                  value={settings.maxPhotoSize}
                  onChange={(e) =>
                    setSettings({ ...settings, maxPhotoSize: e.target.value })
                  }
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="maxPhotosPerEvent">Max Photos Per Event</Label>
                <Input
                  id="maxPhotosPerEvent"
                  type="number"
                  disabled={loading}
                  value={settings.maxPhotosPerEvent}
                  onChange={(e) =>
                    setSettings({ ...settings, maxPhotosPerEvent: e.target.value })
                  }
                  className="mt-1.5"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave}>Save Settings</Button>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Auditoria reciente</h2>
          {auditLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay logs recientes.</p>
          ) : (
            <div className="space-y-3">
              {auditLogs.map((log) => (
                <div key={log.id} className="border border-border rounded-lg p-3 text-sm">
                  <p className="font-medium text-foreground">{log.action}</p>
                  <p className="text-muted-foreground">
                    {log.target_type || "target"}: {log.target_id || "-"} • {new Date(log.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
