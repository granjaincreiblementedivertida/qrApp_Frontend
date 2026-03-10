"use client"

import { GoogleOAuthProvider } from "@react-oauth/google"

type GoogleOAuthAppProviderProps = {
  children: React.ReactNode
}

export function GoogleOAuthAppProvider({ children }: GoogleOAuthAppProviderProps) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() || ""
  // Sin clientId, el provider puede lanzar al montar hijos que usan GoogleLogin.
  // Renderizamos solo los hijos para que el resto de la app cargue (p. ej. /crear-evento).
  if (!clientId) {
    return <>{children}</>
  }
  return <GoogleOAuthProvider clientId={clientId}>{children}</GoogleOAuthProvider>
}
