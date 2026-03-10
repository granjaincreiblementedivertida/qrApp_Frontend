"use client"

import { GoogleOAuthProvider } from "@react-oauth/google"

type GoogleOAuthAppProviderProps = {
  children: React.ReactNode
}

export function GoogleOAuthAppProvider({ children }: GoogleOAuthAppProviderProps) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""
  return <GoogleOAuthProvider clientId={clientId}>{children}</GoogleOAuthProvider>
}
