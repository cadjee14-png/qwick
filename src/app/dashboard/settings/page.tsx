'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Shop } from '@/types'
import QRCode from 'qrcode'

export default function SettingsPage() {
  const [shop, setShop] = useState<Shop | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [welcomeMessage, setWelcomeMessage] = useState('')
  const [brandColor, setBrandColor] = useState('#ffffff')

  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    async function loadShop() {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data } = await supabase
        .from('shops')
        .select('*')
        .eq('owner_id', user.id)
        .single()

      if (data) {
        const typed = data as Shop
        setShop(typed)
        setName(typed.name)
        setWelcomeMessage(typed.welcome_message ?? '')
        setBrandColor(typed.brand_color ?? '#ffffff')
      }

      setLoading(false)
    }

    loadShop()
  }, [])

  // Generate QR code whenever shop slug is available
  useEffect(() => {
    if (!shop?.slug || !canvasRef.current) return

    const clientUrl = `${window.location.origin}/${shop.slug}`

    QRCode.toCanvas(canvasRef.current, clientUrl, {
      width: 180,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    }).catch((err) => {
      console.error('[Settings] QR code generation error:', err)
    })
  }, [shop])

  async function handleSave() {
    if (!name.trim()) {
      setError('Le nom du shop est requis')
      return
    }

    setSaving(true)
    setError(null)
    setSaved(false)

    try {
      const res = await fetch('/api/shops', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          welcome_message: welcomeMessage.trim() || null,
          brand_color: brandColor,
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erreur lors de la sauvegarde')

      setShop(json.shop as Shop)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setSaving(false)
    }
  }

  function handleDownloadQR() {
    if (!canvasRef.current || !shop) return

    const link = document.createElement('a')
    link.download = `qr-${shop.slug}.png`
    link.href = canvasRef.current.toDataURL('image/png')
    link.click()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-[#71717A]">
          <svg className="w-5 h-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm">Chargement des paramètres…</span>
        </div>
      </div>
    )
  }

  if (!shop) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[#71717A] text-sm">Impossible de charger les paramètres.</p>
      </div>
    )
  }

  const clientUrl = typeof window !== 'undefined' ? `${window.location.origin}/${shop.slug}` : `/${shop.slug}`

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Paramètres</h1>
        <p className="text-[#71717A] text-sm mt-0.5">Configurez votre shop et votre QR code</p>
      </div>

      {/* Feedback banners */}
      {error && (
        <div className="flex items-start gap-2.5 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-xl px-4 py-3 text-[#EF4444] text-sm">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0 mt-0.5">
            <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}
      {saved && (
        <div className="flex items-center gap-2.5 bg-[#22C55E]/10 border border-[#22C55E]/20 rounded-xl px-4 py-3 text-[#22C55E] text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
            <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
          </svg>
          Paramètres sauvegardés avec succès
        </div>
      )}

      {/* Shop info section */}
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#2A2A2A]">
          <h2 className="text-sm font-bold text-white">Informations du shop</h2>
          <p className="text-xs text-[#71717A] mt-0.5">Nom, message d&apos;accueil et couleur de marque</p>
        </div>

        <div className="px-6 py-5 flex flex-col gap-5">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-[#71717A] uppercase tracking-wider mb-1.5">
              Nom du shop *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mon Restaurant"
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-[#71717A] focus:outline-none focus:border-[#FF6B35]/50 focus:ring-1 focus:ring-[#FF6B35]/20 transition"
            />
          </div>

          {/* Welcome message */}
          <div>
            <label className="block text-xs font-semibold text-[#71717A] uppercase tracking-wider mb-1.5">
              Message de bienvenue
            </label>
            <textarea
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              placeholder="Bienvenue ! Scannez pour commander."
              rows={3}
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-[#71717A] focus:outline-none focus:border-[#FF6B35]/50 focus:ring-1 focus:ring-[#FF6B35]/20 transition resize-none"
            />
          </div>

          {/* Brand color */}
          <div>
            <label className="block text-xs font-semibold text-[#71717A] uppercase tracking-wider mb-1.5">
              Couleur principale
            </label>
            <div className="flex items-center gap-3">
              {/* Color preview swatch */}
              <div
                className="w-10 h-10 rounded-xl border-2 border-[#2A2A2A] shrink-0 shadow-inner cursor-pointer relative overflow-hidden"
                style={{ backgroundColor: brandColor }}
              >
                <input
                  type="color"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  title="Choisir une couleur"
                />
              </div>
              <input
                type="text"
                value={brandColor}
                onChange={(e) => {
                  const val = e.target.value
                  if (/^#[0-9a-fA-F]{0,6}$/.test(val)) setBrandColor(val)
                }}
                placeholder="#ffffff"
                maxLength={7}
                className="w-32 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-[#71717A] focus:outline-none focus:border-[#FF6B35]/50 focus:ring-1 focus:ring-[#FF6B35]/20 transition font-mono"
              />
              <span className="text-xs text-[#71717A]">Apparait sur la page client</span>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end px-6 py-4 border-t border-[#2A2A2A]">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition"
          >
            {saving ? (
              <>
                <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Sauvegarde…
              </>
            ) : (
              <>
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path d="M13.75 7h-7.5A2.25 2.25 0 0 0 4 9.25v7.5A2.25 2.25 0 0 0 6.25 19h7.5A2.25 2.25 0 0 0 16 16.75v-7.5A2.25 2.25 0 0 0 13.75 7Z" />
                  <path fillRule="evenodd" d="M6.75 1A2.75 2.75 0 0 0 4 3.75V4.5a.75.75 0 0 0 1.5 0V3.75c0-.69.56-1.25 1.25-1.25h6.5c.69 0 1.25.56 1.25 1.25v.75H8.5a.75.75 0 0 0 0 1.5h6.25a.75.75 0 0 0 .75-.75v-1.5A2.75 2.75 0 0 0 13.25 1h-6.5Z" clipRule="evenodd" />
                </svg>
                Sauvegarder
              </>
            )}
          </button>
        </div>
      </div>

      {/* QR Code section */}
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#2A2A2A]">
          <h2 className="text-sm font-bold text-white">QR Code client</h2>
          <p className="text-xs text-[#71717A] mt-0.5">
            Partagez ce code avec vos clients pour qu&apos;ils accèdent à votre menu
          </p>
        </div>

        <div className="px-6 py-5">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* QR code canvas */}
            <div className="bg-white rounded-2xl p-3 shrink-0 shadow-lg">
              <canvas ref={canvasRef} width={180} height={180} />
            </div>

            {/* Info + download */}
            <div className="flex flex-col gap-4 flex-1 pt-1">
              <div>
                <p className="text-xs font-semibold text-[#71717A] uppercase tracking-wider mb-2">URL du menu</p>
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3.5 py-2.5 flex items-center gap-2">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-[#71717A] shrink-0">
                    <path d="M12.232 4.232a2.5 2.5 0 0 1 3.536 3.536l-1.225 1.224a.75.75 0 0 0 1.061 1.06l1.224-1.224a4 4 0 0 0-5.656-5.656l-3 3a4 4 0 0 0 .225 5.865.75.75 0 0 0 .977-1.138 2.5 2.5 0 0 1-.142-3.667l3-3Z" />
                    <path d="M11.603 7.963a.75.75 0 0 0-.977 1.138 2.5 2.5 0 0 1 .142 3.667l-3 3a2.5 2.5 0 0 1-3.536-3.536l1.225-1.224a.75.75 0 0 0-1.061-1.06l-1.224 1.224a4 4 0 1 0 5.656 5.656l3-3a4 4 0 0 0-.225-5.865Z" />
                  </svg>
                  <span className="text-sm text-white break-all font-mono">{clientUrl}</span>
                </div>
              </div>

              <button
                onClick={handleDownloadQR}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#1A1A1A] border border-[#2A2A2A] text-sm font-semibold text-white rounded-xl hover:bg-[#2A2A2A] transition w-fit"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-[#FF6B35]">
                  <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" />
                  <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
                </svg>
                Télécharger en PNG
              </button>

              <p className="text-xs text-[#71717A]">
                Imprimez ce QR code et placez-le sur vos tables ou au comptoir.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
