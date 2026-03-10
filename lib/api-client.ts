export type UserSession = {
  user: {
    id: string
    email: string
    name?: string | null
    role: "admin" | "user"
    avatar_url?: string | null
    event_credits?: number
  }
  token: string
  expiresIn: string
}

export type PaymentStatus = {
  canCreateEvent: boolean
  eventCredits: number
  isAdmin: boolean
}

export type EventSummary = {
  id: string
  name: string
  slug: string
  description?: string | null
  event_location?: string | null
  cover_image_url?: string | null
  event_date?: string | null
  moderation_enabled: boolean
  is_active: boolean
  event_admin_emails?: string[]
  EventConfig?: {
    allow_anonymous_view: boolean
    allow_uploads: boolean
    max_photo_size_mb: number
    max_photos_per_user: number
    auto_moderation_enabled: boolean
    require_login_to_upload: boolean
  }
}

export type GalleryPhoto = {
  id: string
  event_id: string
  user_id?: string | null
  cloudinary_url: string
  cloudinary_secure_url?: string | null
  status: "pending" | "approved" | "rejected"
  /** ISO date string; backend puede enviar created_at o createdAt */
  created_at?: string
  createdAt?: string
  User?: {
    id: string
    name?: string | null
    avatar_url?: string | null
  } | null
}

export type EventStats = {
  event_id: string
  total_photos: number
  approved: number
  pending: number
  rejected: number
  unique_uploaders: number
  moderation_enabled: boolean
  config?: {
    require_login_to_upload: boolean
    allow_anonymous_view: boolean
    allow_uploads: boolean
    max_photo_size_mb: number
    max_photos_per_user: number
    auto_moderation_enabled: boolean
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api"

async function readJsonSafe(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return null
  }
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  })
  if (!response.ok) {
    const errorBody = (await readJsonSafe(response)) as { error?: string } | null
    throw new Error(errorBody?.error || "Error al conectar con el backend")
  }
  return (await response.json()) as T
}

export async function register(email: string, password: string, name?: string) {
  return apiFetch<UserSession>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, name: name || null }),
  })
}

export async function loginWithPassword(email: string, password: string) {
  return apiFetch<UserSession>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
}

export async function loginWithGoogle(idToken: string) {
  return apiFetch<UserSession>("/auth/google", {
    method: "POST",
    body: JSON.stringify({ idToken }),
  })
}

export async function getSession(token: string) {
  return apiFetch<{ user: UserSession["user"] }>("/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function createCheckoutSession(token: string) {
  return apiFetch<{ url: string; sessionId: string }>("/payments/create-checkout-session", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function getPaymentStatus(token: string) {
  return apiFetch<PaymentStatus>("/payments/status", {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function confirmPaymentSession(token: string, sessionId: string) {
  return apiFetch<PaymentStatus>("/payments/confirm-session?session_id=" + encodeURIComponent(sessionId), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function issueEventAdminToken(authToken: string, eventId: string) {
  return apiFetch<{
    tokenType: "admin" | "event_admin"
    eventId: string
    token: string
    expiresIn: string
  }>(`/auth/events/${eventId}/token`, {
    method: "POST",
    headers: { Authorization: `Bearer ${authToken}` },
  })
}

export async function getEventByIdOrSlug(eventKey: string) {
  try {
    return await apiFetch<EventSummary>(`/events/${eventKey}`)
  } catch {
    return apiFetch<EventSummary>(`/events/slug/${eventKey}`)
  }
}

export async function getGallery(eventId: string, page = 1, limit = 24, token?: string) {
  return apiFetch<{ photos: GalleryPhoto[]; total: number }>(
    `/events/${eventId}/photos?page=${page}&limit=${limit}`,
    token
      ? {
          headers: { Authorization: `Bearer ${token}` },
        }
      : {}
  )
}

export async function getUploadParams(eventId: string, token: string) {
  return apiFetch<{
    signature: string
    timestamp: number
    folder: string
    cloud_name: string
    api_key: string
    max_file_size: number
  }>(`/events/${eventId}/photos/upload-params`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  })
}

/** Subir hasta 5 fotos al backend; el backend las envía a Cloudinary y las registra. */
export async function uploadPhotos(eventId: string, token: string, files: File[]) {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api"
  const formData = new FormData()
  for (const file of files) {
    formData.append("files", file)
  }
  const response = await fetch(`${API_BASE_URL}/events/${eventId}/photos/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null
    throw new Error(body?.error || "Error al subir las fotos")
  }
  return response.json() as Promise<{ uploaded: number; photos: GalleryPhoto[] }>
}

export async function registerPhoto(
  eventId: string,
  token: string,
  payload: {
    cloudinary_public_id: string
    cloudinary_url: string
    cloudinary_secure_url: string
    metadata?: Record<string, unknown>
  }
) {
  return apiFetch<GalleryPhoto>(`/events/${eventId}/photos`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  })
}

export async function getModerationPhotos(eventId: string, token: string, status?: string) {
  const query = status ? `?status=${encodeURIComponent(status)}` : ""
  return apiFetch<{ photos: GalleryPhoto[] }>(`/events/${eventId}/photos/moderation${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function approvePhoto(eventId: string, photoId: string, token: string) {
  return apiFetch<GalleryPhoto>(`/events/${eventId}/photos/${photoId}/approve`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function rejectPhoto(eventId: string, photoId: string, token: string, reason?: string) {
  return apiFetch<GalleryPhoto>(`/events/${eventId}/photos/${photoId}/reject`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ reason }),
  })
}

export async function deletePhoto(eventId: string, photoId: string, token: string) {
  const response = await fetch(`${API_BASE_URL}/events/${eventId}/photos/${photoId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    const errorBody = (await readJsonSafe(response)) as { error?: string } | null
    throw new Error(errorBody?.error || "No se pudo eliminar la foto")
  }
}

export async function getEventStats(eventId: string, token: string) {
  return apiFetch<EventStats>(`/events/${eventId}/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function updateEventConfig(
  eventId: string,
  token: string,
  payload: {
    allow_uploads: boolean
    allow_anonymous_view: boolean
    require_login_to_upload: boolean
    max_photo_size_mb: number
    max_photos_per_user: number
    auto_moderation_enabled: boolean
  }
) {
  return apiFetch(`/events/${eventId}/config`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  })
}

/** PATCH /events/:eventId/moderation - Activar/desactivar moderación del evento (event admin). */
export async function setEventModeration(eventId: string, token: string, enabled: boolean) {
  return apiFetch<EventSummary>(`/events/${eventId}/moderation`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ enabled }),
  })
}

export type AdminStats = {
  total_events: number
  total_users: number
  total_photos: number
}

export type AdminEvent = {
  id: string
  name: string
  slug: string
  description?: string | null
  event_location?: string | null
  cover_image_url?: string | null
  event_date?: string | null
  is_active: boolean
  moderation_enabled: boolean
  created_at: string
  event_admin_emails?: string[]
  EventConfig?: {
    require_login_to_upload?: boolean
    allow_anonymous_view?: boolean
    allow_uploads?: boolean
    auto_moderation_enabled?: boolean
    max_photo_size_mb?: number
    max_photos_per_user?: number
  }
}

export type AdminUser = {
  id: string
  email: string
  name?: string | null
  role: "admin" | "user"
  is_blocked: boolean
  created_at: string
}

export type AuditLog = {
  id: string
  action: string
  target_type?: string | null
  target_id?: string | null
  event_id?: string | null
  created_at: string
  metadata?: Record<string, unknown>
}

export async function getAdminStats(token: string) {
  return apiFetch<AdminStats>("/admin/stats", {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function listAdminEvents(token: string, page = 1, limit = 50) {
  return apiFetch<{ events: AdminEvent[]; total: number }>(`/admin/events?page=${page}&limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function createEvent(
  token: string,
  payload: {
    name: string
    description?: string
    event_location?: string
    cover_image_url?: string
    event_admin_email?: string
    event_admin_emails?: string[]
    event_config?: {
      require_login_to_upload?: boolean
      allow_anonymous_view?: boolean
      allow_uploads?: boolean
      max_photo_size_mb?: number
      max_photos_per_user?: number
      auto_moderation_enabled?: boolean
    }
    event_date?: string
    event_type?: "wedding" | "birthday" | "party" | "corporate" | "other"
    moderation_enabled?: boolean
  }
) {
  return apiFetch<AdminEvent>("/events", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  })
}

export async function getEventCoverUploadParams(token: string) {
  return apiFetch<{
    signature: string
    timestamp: number
    folder: string
    cloud_name: string
    api_key: string
    max_file_size: number
  }>("/events/cover/upload-params", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function uploadEventCover(file: File, token: string) {
  const formData = new FormData()
  formData.append("file", file)
  const response = await fetch(`${API_BASE_URL}/events/cover/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })
  if (!response.ok) {
    const errorBody = (await readJsonSafe(response)) as { error?: string } | null
    throw new Error(errorBody?.error || "No se pudo subir la portada")
  }
  return (await response.json()) as {
    secure_url: string
    public_id: string
    width?: number
    height?: number
    format?: string
    bytes?: number
  }
}

export async function updateEvent(
  eventId: string,
  token: string,
  payload: {
    name?: string
    description?: string
    event_location?: string
    cover_image_url?: string
    event_admin_email?: string
    event_admin_emails?: string[]
    event_config?: {
      require_login_to_upload?: boolean
      allow_anonymous_view?: boolean
      allow_uploads?: boolean
      max_photo_size_mb?: number
      max_photos_per_user?: number
      auto_moderation_enabled?: boolean
    }
    event_date?: string
    event_type?: "wedding" | "birthday" | "party" | "corporate" | "other"
    moderation_enabled?: boolean
  }
) {
  return apiFetch<AdminEvent>(`/events/${eventId}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  })
}

export async function deleteEvent(eventId: string, token: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/events/${eventId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const body = (await readJsonSafe(res)) as { error?: string } | null
    throw new Error(body?.error || "No se pudo eliminar el evento")
  }
}

export async function setEventActive(eventId: string, token: string, active: boolean) {
  return apiFetch<AdminEvent>(`/admin/events/${eventId}/active`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ active }),
  })
}

export async function listAdminUsers(token: string, page = 1, limit = 50, search = "") {
  const query = `?page=${page}&limit=${limit}${search ? `&search=${encodeURIComponent(search)}` : ""}`
  return apiFetch<{ users: AdminUser[]; total: number }>(`/admin/users${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function setUserBlocked(userId: string, token: string, blocked: boolean) {
  return apiFetch<AdminUser>(`/admin/users/${userId}/blocked`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ blocked }),
  })
}

export async function setUserRole(userId: string, token: string, role: "admin" | "user") {
  return apiFetch<AdminUser>(`/admin/users/${userId}/role`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ role }),
  })
}

export async function listAuditLogs(token: string, page = 1, limit = 30) {
  return apiFetch<{ logs: AuditLog[]; total: number }>(`/admin/audit-logs?page=${page}&limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
}
