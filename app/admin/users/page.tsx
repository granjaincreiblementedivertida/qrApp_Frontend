"use client"

import { useEffect, useMemo, useState } from "react"
import { Search, UserCircle, Calendar, Shield, Ban, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { getAuthToken } from "@/lib/auth-storage"
import { listAdminUsers, setUserBlocked, setUserRole, type AdminUser } from "@/lib/api-client"

const roleLabels = {
  admin: { label: "Admin", className: "bg-accent/10 text-accent border-accent/30" },
  user: { label: "Guest/User", className: "bg-muted text-muted-foreground border-border" },
}

export default function UsersPage() {
  const [search, setSearch] = useState("")
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadUsers = async () => {
    const token = getAuthToken()
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const response = await listAdminUsers(token, 1, 100, search)
      setUsers(response.users)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No se pudieron cargar usuarios")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadUsers()
    }, 250)
    return () => clearTimeout(timeout)
  }, [search])

  const filteredUsers = useMemo(
    () =>
      users.filter(
        (user) =>
          (user.name || "").toLowerCase().includes(search.toLowerCase()) ||
          user.email.toLowerCase().includes(search.toLowerCase())
      ),
    [users, search]
  )

  const toggleBlock = async (id: string) => {
    const token = getAuthToken()
    const current = users.find((user) => user.id === id)
    if (!token || !current) return
    try {
      await setUserBlocked(id, token, !current.is_blocked)
      await loadUsers()
    } catch (blockError) {
      setError(blockError instanceof Error ? blockError.message : "No se pudo actualizar el estado")
    }
  }

  const toggleRole = async (id: string) => {
    const token = getAuthToken()
    const current = users.find((user) => user.id === id)
    if (!token || !current) return
    const nextRole = current.role === "admin" ? "user" : "admin"
    try {
      await setUserRole(id, token, nextRole)
      await loadUsers()
    } catch (roleError) {
      setError(roleError instanceof Error ? roleError.message : "No se pudo cambiar el rol")
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Users
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage users and their permissions
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive mb-6">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Users</p>
          <p className="text-2xl font-bold text-foreground mt-1">{users.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Active</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {users.filter((u) => !u.is_blocked).length}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Blocked</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {users.filter((u) => u.is_blocked).length}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Users Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  User
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Role
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Events
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Joined
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Status
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-muted">
                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                          {(user.name || user.email).slice(0, 2).toUpperCase()}
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{user.name || "Sin nombre"}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={cn("inline-flex px-2.5 py-1 rounded-full text-xs font-medium border", roleLabels[user.role].className)}>
                      {roleLabels[user.role].label}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-muted-foreground">-</span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">{new Date(user.created_at).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                      !user.is_blocked
                        ? "bg-accent/10 text-accent"
                        : "bg-destructive/10 text-destructive"
                    )}>
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        !user.is_blocked ? "bg-accent" : "bg-destructive"
                      )} />
                      {!user.is_blocked ? "Active" : "Blocked"}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <UserCircle className="h-4 w-4 mr-2" />
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleRole(user.id)}>
                          <Shield className="h-4 w-4 mr-2" />
                          Cambiar a {user.role === "admin" ? "user" : "admin"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className={!user.is_blocked ? "text-destructive focus:text-destructive" : ""}
                          onClick={() => toggleBlock(user.id)}
                        >
                          <Ban className="h-4 w-4 mr-2" />
                          {!user.is_blocked ? "Block User" : "Unblock User"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-border">
          {filteredUsers.map((user) => (
            <div key={user.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-muted shrink-0">
                  <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                    {(user.name || user.email).slice(0, 2).toUpperCase()}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-medium text-foreground">{user.name || "Sin nombre"}</h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                    <span className={cn(
                      "shrink-0 w-2 h-2 rounded-full mt-2",
                      !user.is_blocked ? "bg-accent" : "bg-destructive"
                    )} />
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-medium",
                      roleLabels[user.role].className
                    )}>
                      {roleLabels[user.role].label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      View Profile
                    </Button>
                    <Button
                      variant={!user.is_blocked ? "ghost" : "outline"}
                      size="sm"
                      className={!user.is_blocked ? "text-destructive hover:text-destructive" : ""}
                      onClick={() => toggleBlock(user.id)}
                    >
                      <Ban className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {!loading && filteredUsers.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <UserCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No users found</p>
          </div>
        )}
        {loading && (
          <div className="p-8 text-center text-muted-foreground">Cargando usuarios...</div>
        )}
      </div>
    </div>
  )
}
