"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { getStoredUser, clearSession } from "@/lib/auth-storage"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"

export default function HomePage() {
  const router = useRouter()
  const [user, setUser] = useState<{ id: string; email: string; name?: string | null; avatar_url?: string | null } | null>(null)
  const year = new Date().getFullYear()
  const name = process.env.NEXT_PUBLIC_APP_NAME

  useEffect(() => {
    setUser(getStoredUser())
  }, [])

  useEffect(() => {
    const observerOptions = { threshold: 0.1 }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-in")
          observer.unobserve(entry.target)
        }
      })
    }, observerOptions)
    document.querySelectorAll("section").forEach((section) => {
      section.classList.add("opacity-0")
      observer.observe(section)
    })
    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-brand-dark text-white font-sans overflow-x-hidden scroll-smooth">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-effect border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-accent to-brand-vibrant rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight">{process.env.NEXT_PUBLIC_APP_NAME}<span className="text-brand-accent">QR</span></span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <a className="hover:text-white transition-colors" href="#como-funciona">Cómo funciona</a>
            <a className="hover:text-white transition-colors" href="#beneficios">Beneficios</a>
            <a className="hover:text-white transition-colors" href="#eventos">Eventos</a>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link href="/crear-evento" className="hidden sm:inline-flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover border border-white/10" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-brand-accent flex items-center justify-center text-white text-sm font-bold">
                      {(user.name || user.email).charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="font-medium truncate max-w-[100px] md:max-w-[140px]" title={user.email}>
                    {user.name || user.email}
                  </span>
                </Link>
                <Link href="/crear-evento" className="bg-white text-black px-5 py-2 rounded-full text-sm font-bold hover:bg-gray-200 transition-all shadow-lg shadow-white/5">
                  Crear mi evento
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    clearSession()
                    setUser(null)
                    router.refresh()
                  }}
                  className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <Link href="/login?next=/crear-evento" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
                  Iniciar sesión
                </Link>
                <Link href="/crear-evento" className="bg-white text-black px-5 py-2 rounded-full text-sm font-bold hover:bg-gray-200 transition-all shadow-lg shadow-white/5">
                  Crear mi evento
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-brand-accent/20 blur-[120px] rounded-full -z-10" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400 leading-tight">
              Todas las fotos de tu evento <br className="hidden md:block" /> en un solo lugar
            </h1>
            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Tus invitados escanean un QR, toman fotos y se publican al instante. Sin apps, sin registros, solo recuerdos compartidos en tiempo real.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
              <Link href="/crear-evento" className="w-full sm:w-auto px-8 py-4 bg-brand-accent hover:bg-brand-vibrant text-white rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-xl shadow-brand-accent/20 text-center">
                Crear mi evento ahora
              </Link>
              <Link href="#crear" className="w-full sm:w-auto px-8 py-4 bg-brand-card hover:bg-gray-800 border border-white/10 text-white rounded-xl font-bold text-lg transition-all text-center">
                Ver Demo
              </Link>
            </div>
            <div className="relative max-w-5xl mx-auto animate-in">
              <div className="rounded-2xl border border-white/10 bg-brand-card p-4 shadow-2xl overflow-hidden">
                <div className="masonry-container">
                  <div className="masonry-item rounded-lg bg-gray-800 h-48 flex items-center justify-center overflow-hidden">
                    <img alt="Wedding guest" className="w-full h-full object-cover opacity-80" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAXcbavZlupgENt2EcGFoJ2BAb_Uk0REeG-pCXkZUZc2GwEhe792CAgAUGSr663_6sxJ8WiDG-V36vmTdP7AvMYr4Xr9ogwwFGqefYYkpppASmmlnRfplKSXvHrkrF1PZt2N--DI7Bmgp4mJvvqRwazqz88_UZcVjFXZFjcwpNuckYbuSo5rQzho_M26Oe-DR2-AHxp1hpYLgSiWJDUv6DeIFyTBBfquaB7_wls4ggGVzpe4yGfgvtjZiDZc3-sUwzA68Nzg46J8ZJC" />
                  </div>
                  <div className="masonry-item rounded-lg bg-gray-800 h-64 flex items-center justify-center overflow-hidden">
                    <img alt="Party" className="w-full h-full object-cover opacity-80" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAXcb21LaxK7sQ-El7g-FocHXzGq-HeLHSf7lu9FK0DBdPncz6gOyibOL3ttJPb_ocnChYmZVlN2mPHvFujNPAIQiCEDPz7kh1Iytx9Ehhea3ZXvcaHW0yYcfNQigY3KSTtzAvfINOP5pG8hQf65FLrY1NP5xOQ9rJjyh0ydK2obCqV4IqcDnn-9QteDGnWUo7Ys50omcKFUGvIH5xZwBb_Y-IItrmriJtvBCsWobklZgb7lrma2U6eJkvwH72wGudTo2dd3NyPdbMa" />
                  </div>
                  <div className="masonry-item rounded-lg bg-gray-800 h-52 flex items-center justify-center overflow-hidden">
                    <img alt="Corporate event" className="w-full h-full object-cover opacity-80" src="https://lh3.googleusercontent.com/aida-public/AB6AXuARjJZv8r72IcAP69A5HPsCDyg3NxsgC5TGlyBnQnz41L6bKxkEU76Ln26qSrAoK86nKb5xVzUcpzdH2Ko4TsVU0FyF081crq9hQT_gHD65-HTuzYNrChmoScARx9yyZ8UxPRpc6dYnPOoG0YD7GUBfVKntYCUWP6xviTw5SxQQ2CgW7pMH8wp08Z1H8oLKgw9gu_d8RGhucOyuaeqgipYcaW0qPV8Wm9PinEcE2QM6_R7d8FbfT7TtoZ0lhcRa2GEJmuKrwM7UYnEm" />
                  </div>
                  <div className="masonry-item rounded-lg bg-gray-800 h-60 flex items-center justify-center overflow-hidden">
                    <img alt="Dancing" className="w-full h-full object-cover opacity-80" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCB6JGju5jy-WQE_WOPSIuL7Eunt3WyRSHj-x_XWxioyIM0J5vFPighDqP7Bo6RF0GH1SApHUVBq43zQRePLSWeybQtaYWuK6-1fgIQh8el8ehRybSFVNNTNg2evNmGWVEee_xSTAinRuzD1xiIHg--9AvsIP1RFdf9g3UKkDBcejjlU8SzsY5X5YW3xj4pQlU_U_kvspDaTIfrFagPXUGzHquPXc245_tFpcQNtRxyy_CyXepp4CozISz_dC5d5SguczL1mqQOwrJG" />
                  </div>
                  <div className="masonry-item rounded-lg bg-gray-800 h-44 flex items-center justify-center overflow-hidden">
                    <img alt="Cocktail" className="w-full h-full object-cover opacity-80" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA4-JOhAD2mIrIOYzjBn2D8FRDdCyNUMIGm1DgO8Z9UipkYZmwIy0XnHXdmDzQaXyPsbW6nCWJ9pWOE-hHX1YR76aiWoGcpAnfop1QEXGpj9jZmFydwgNRQJCZGtXOPOhGcaNouY_8ZB3kCcGLY7Nfp9Xc3-u4qWTuRp89qrnrYYNs8xz-1-RPtinZLAtzfth69_umnrzfXfJKnC6B0kXGvfINKUYfA_cMV_33EaXUmEQpq7OQjooMwB1BHCPkVz03ISXJ5aWyfDtNn" />
                  </div>
                  <div className="masonry-item rounded-lg bg-gray-800 h-72 flex items-center justify-center overflow-hidden">
                    <img alt="Stage" className="w-full h-full object-cover opacity-80" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAERfsizBrCzyVUe57FVPE_Mq75ykBWHUosKD7El88xOztWw6DpnvFAGl-WzcXf4YfASSMD4cnZ-pL4SAz6wbnkCSchXMRpR4seiYrBPU5k50_HiGUMQAkq2hglzGW95D-KwhQZJv3J3cH5fxWt34WgfEC0k2VkQJHc6GoSMeingrH3_mEjgADLNT1UkNvQWajb6mqDeIQnnwtwiGvG3bWWGvSLkxgi9TrVr60mvXDh2Q5iSatUtG9oiBktaiT6EvgBDW4wLhwtg4Y6" />
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-10 -right-4 md:-right-10 w-48 md:w-64 animate-float">
                <div className="relative rounded-[2.5rem] border-8 border-gray-900 bg-brand-dark aspect-[9/19] shadow-2xl overflow-hidden">
                  <div className="p-4 flex flex-col h-full items-center justify-center text-center">
                    <div className="w-24 h-24 mb-4 bg-white p-2 rounded-lg">
                      <img alt="QR Code" className="w-full h-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBEcYgG7YMdhdMprqaptzltg7f9TXYHiqkxfiI0dVbYMuASlz1ut2LkQLkz4MpSCMu3y6gtQmyQ2_Fr9jFqO3JbJZWyejlKp5uxn0_deK_ZQu2cSvhYKk1gwOL6q4-gGMjTtfeVlNkKEBmUEEa19hVTbnuclbAnCzNJdymrQWCrddVbKD1hP21GHjaeAnot0bO8D8a93IfK4tpnhYDZeQncZ0pAuW0cT44HkppI1-2wAfZ3_fxc94AyzbBXjrrj4MTYRhaojMXDerKX" />
                    </div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Escanea para subir</p>
                    <div className="mt-8 w-full bg-brand-accent h-8 rounded-full flex items-center justify-center text-[10px] font-bold">Tomar Foto</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-24 bg-brand-dark" id="como-funciona">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">Recuerdos en 3 pasos</h2>
              <p className="text-gray-400">Es tan simple que hasta tu abuelo podrá participar.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-12">
              <div className="group p-8 rounded-2xl bg-brand-card/50 border border-white/5 hover:border-brand-accent/50 transition-all text-center">
                <div className="w-16 h-16 bg-brand-accent/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-brand-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3">1. Crea tu evento</h3>
                <p className="text-gray-400">Personaliza el nombre de tu galería y obtén tu código QR exclusivo en segundos.</p>
              </div>
              <div className="group p-8 rounded-2xl bg-brand-card/50 border border-white/5 hover:border-brand-accent/50 transition-all text-center">
                <div className="w-16 h-16 bg-brand-blue/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-brand-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3">2. Comparte el QR</h3>
                <p className="text-gray-400">Imprime el código en las mesas, entradas o pantallas gigantes de tu evento.</p>
              </div>
              <div className="group p-8 rounded-2xl bg-brand-card/50 border border-white/5 hover:border-brand-accent/50 transition-all text-center">
                <div className="w-16 h-16 bg-brand-vibrant/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-brand-vibrant" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3">3. Recibe fotos</h3>
                <p className="text-gray-400">Tus invitados suben fotos sin descargar nada. Todas aparecen en tu muro en vivo.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-24 bg-brand-card/30" id="beneficios">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-4xl font-bold mb-8 leading-tight">Diseñado para la <span className="text-brand-accent">mejor experiencia</span> de usuario.</h2>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold mb-1">Sin descarga de aplicaciones</h4>
                      <p className="text-gray-400">Funciona directamente en el navegador del móvil de tus invitados.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold mb-1">Velocidad instantánea</h4>
                      <p className="text-gray-400">Carga fotos en milisegundos para que nadie se pierda de nada.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold mb-1">Privacidad total</h4>
                      <p className="text-gray-400">Tú controlas quién sube y quién ve las fotos de tu evento privado.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="bg-brand-card border border-white/10 rounded-2xl p-6 shadow-2xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-brand-vibrant/20 flex items-center justify-center text-brand-vibrant">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold">Galería en vivo: Boda Ana & Luis</p>
                      <p className="text-[10px] text-gray-500">124 fotos subidas por invitados</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <img alt="Guest photo" className="rounded-lg shadow hover:scale-[1.02] transition-transform" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAwlvxB5j83R0EoU9Zf8UVxxusg9bQgwdGaL8sQkUJBLe-3ElI3UIDk77Ftakf1dZWDBSOESwyQKb9eQF4O7kCyUNdTQdcwILmQRlbFsZBDc2sXfqvUTlkOzfOYgAejPhHDijxvL3KNfcFlpMI1ZLNYo2jlrOWBYH8qhyMAe0W8RKqyhmiZ3FZWDBUIURmrote7LR4veehr2MTCI73BbzosH9tPHmK6twyuRsSVbjyIPFoU8kzYPQcG6wXXNkj15nR8r5KDvFmX1s2z" />
                    <img alt="Guest photo" className="rounded-lg shadow hover:scale-[1.02] transition-transform" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC-wBdleAhHWlEI4JA56yJxRV1qDtciboPSKCI5O-r9vrnvha9gEeyC4mefzwg6a3zEmTCFMXltQTiiZd8eG-1iswqrqtcSHGk7NpciDWpjDk2EvfQm4zGW1zxlrew0TlcmOVJsA4zNZWtn44-uNn6Z_6ScVGC-r13d9rllmEGFI0BgDxm-QMAjaNmCgrD7cxD-uGZ_DjXVMmZkvtpUJqfTLECYTyQFN14yC2jbHhnUcU1n77NjBKkJbC14RLJJ0RJYuQQdM2Ae7mBN" />
                    <img alt="Guest photo" className="rounded-lg shadow hover:scale-[1.02] transition-transform" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCW3pk-bCkiJkKrN5xCTGnEQtCrwPWRWlYiMa3I1Yfgdg72HLNEIS-CnUNHtOaUKstrReiaUQhDTxjt3--_FhJVgjOqMV-hDc-7v_Zdr6tS2WHpEjoPicD4R5MkyidXvf3JObzOJbHEYeWKIwi3ZwvDVTtjP4Fzo2RzCrx9p_eJpdChc_ZyXsP4yQ6E1PW20yab_hJFkJjv33KyNifbBdb_uaKzY1pglTldwqfrlaEU2MF9zv5hmgqEzklI9QQt7Tm69a5Q9eq-uyTA" />
                    <div className="rounded-lg bg-gray-800 flex items-center justify-center border-2 border-dashed border-white/10 text-gray-500">
                      <svg className="w-8 h-8 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-vibrant/30 blur-[60px] rounded-full -z-10" />
              </div>
            </div>
          </div>
        </section>

        {/* Event Types Grid */}
        <section className="py-24" id="eventos">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold mb-12 text-center">Perfecto para cualquier ocasión</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="relative h-64 rounded-2xl overflow-hidden group">
                <img alt="Bodas" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src="https://images.cdn-files-a.com/admin/websitesPluginsManager/63aa0b2327e4b/800_63aa0b2327e6c.jpg" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6">
                  <span className="text-xl font-bold">Bodas</span>
                </div>
              </div>
              <div className="relative h-64 rounded-2xl overflow-hidden group">
                <img alt="Cumpleaños" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src="https://www.consumer.es/app/uploads/2018/03/cumpleanos-barato.jpg" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6">
                  <span className="text-xl font-bold">Cumpleaños</span>
                </div>
              </div>
              <div className="relative h-64 rounded-2xl overflow-hidden group">
                <img alt="XV años" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSqJNVLuU8UEPdjZCrtJsfAHVtOL9stYXLVuw&s" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6">
                  <span className="text-xl font-bold">XV años</span>
                </div>
              </div>
              <div className="relative h-64 rounded-2xl overflow-hidden group">
                <img alt="Graduaciones" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTVgxdqrtuEf4suo2o0yl5cj3RtyONr5dGY8Q&s" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6">
                  <span className="text-xl font-bold">Graduaciones</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-24 bg-brand-dark overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold mb-16 text-center">Lo que dicen los anfitriones</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-8 rounded-2xl bg-brand-card border border-white/5">
                <div className="flex text-yellow-500 mb-4">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <p className="text-gray-300 italic mb-6">&quot;Fue el éxito de mi boda. Todos amaron ver las fotos proyectadas en la pantalla del salón mientras cenábamos.&quot;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-accent/20" />
                  <div>
                    <p className="font-bold text-sm">Carla Méndez</p>
                    <p className="text-[10px] text-gray-500">Boda en Madrid</p>
                  </div>
                </div>
              </div>
              <div className="p-8 rounded-2xl bg-brand-card border border-white/5">
                <p className="text-gray-300 italic mb-6">&quot;Para nuestro evento corporativo fue ideal. No queríamos que la gente perdiera tiempo bajando apps. Escanear y listo.&quot;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-blue/20" />
                  <div>
                    <p className="font-bold text-sm">Roberto S.</p>
                    <p className="text-[10px] text-gray-500">Tech Summit 2024</p>
                  </div>
                </div>
              </div>
              <div className="p-8 rounded-2xl bg-brand-card border border-white/5">
                <p className="text-gray-300 italic mb-6">&quot;Recuperé fotos de mis amigos que nunca me habrían enviado por WhatsApp. ¡El muro de fotos es adictivo!&quot;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-vibrant/20" />
                  <div>
                    <p className="font-bold text-sm">Diego García</p>
                    <p className="text-[10px] text-gray-500">Cumpleaños #30</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24" id="crear">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-brand-accent via-brand-vibrant to-brand-blue p-12 text-center shadow-2xl shadow-brand-vibrant/20">
              <div className="absolute inset-0 bg-black/10" />
              <div className="relative z-10">
                <h2 className="text-4xl md:text-5xl font-extrabold mb-6">Haz que tu evento tenga <br /> todos los recuerdos</h2>
                <p className="text-lg text-white/80 max-w-xl mx-auto mb-10">
                  Administra tu evento y comparte el QR con tus invitados.
                </p>
                <Link href="/event" className="inline-block bg-white text-brand-dark px-10 py-5 rounded-2xl font-black text-xl hover:scale-105 transition-all shadow-xl">
                  Ir a mi evento
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 bg-brand-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-brand-accent rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </div>
                <span className="text-xl font-bold tracking-tight">{name}<span className="text-brand-accent">QR</span></span>
              </div>
              <p className="text-gray-500 max-w-sm">
                Transformamos la forma en que los eventos capturan momentos. Hecho con pasión por creadores para creadores.
              </p>
            </div>
            <div>
              <h5 className="font-bold mb-6">Producto</h5>
              <ul className="space-y-4 text-gray-500 text-sm">
                <li><a className="hover:text-white transition-colors" href="#">Características</a></li>
                <li><a className="hover:text-white transition-colors" href="#">Precios</a></li>
                <li><a className="hover:text-white transition-colors" href="#">Demo en vivo</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold mb-6">Empresa</h5>
              <ul className="space-y-4 text-gray-500 text-sm">
                <li><a className="hover:text-white transition-colors" href="#">Nosotros</a></li>
                <li><a className="hover:text-white transition-colors" href="#">Privacidad</a></li>
                <li><a className="hover:text-white transition-colors" href="#">Contacto</a></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/5 text-gray-500 text-sm">
            <p>© {year} {name} Todos los derechos reservados.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a className="hover:text-white transition-colors" href="#">Twitter</a>
              <a className="hover:text-white transition-colors" href="#">Instagram</a>
              <a className="hover:text-white transition-colors" href="#">LinkedIn</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
