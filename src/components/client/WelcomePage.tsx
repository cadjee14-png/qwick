'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/stores/cartStore'
import { useShop } from './ShopContext'

interface WelcomePageProps {
  shopSlug: string
}

export function WelcomePage({ shopSlug }: WelcomePageProps) {
  const { shop } = useShop()
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [focused, setFocused] = useState(false)
  const setCustomerName = useCartStore((s) => s.setCustomerName)
  const router = useRouter()

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Veuillez entrer votre prénom.')
      return
    }
    setCustomerName(trimmed)
    router.push(`/${shopSlug}/menu`)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-[#0A0A0A]">
      {/* Radial glow in background */}
      <div
        className="pointer-events-none fixed inset-0 opacity-20"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 50%, var(--brand, #FF6B35), transparent)',
        }}
      />

      <div
        className="relative w-full max-w-md space-y-10"
        style={{ animation: 'fadeSlideUp 0.4s ease both' }}
      >
        {/* Header */}
        <div className="text-center space-y-3">
          {shop.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={shop.logo_url}
              alt={shop.name}
              className="mx-auto h-16 w-auto object-contain mb-4"
            />
          )}
          <h1
            className="text-4xl font-bold tracking-tight text-white"
          >
            {shop.name}
          </h1>
          {shop.welcome_message && (
            <p className="text-[#A0A0A0] text-base leading-relaxed">
              {shop.welcome_message}
            </p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              id="customer-name"
              type="text"
              autoComplete="given-name"
              autoFocus
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (error) setError('')
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Votre prénom…"
              className="w-full rounded-2xl bg-[#141414] border px-5 py-4 text-white text-lg placeholder:text-[#A0A0A0] focus:outline-none transition-all duration-200"
              style={{
                borderColor: focused
                  ? 'var(--brand, #FF6B35)'
                  : '#2A2A2A',
                boxShadow: focused
                  ? '0 0 0 3px color-mix(in srgb, var(--brand, #FF6B35) 20%, transparent)'
                  : '0 0 0 1px rgba(255,255,255,0.06)',
              }}
            />
            {error && (
              <p className="mt-2 text-sm text-red-400 pl-1">{error}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full rounded-full px-6 py-4 text-base font-bold text-white transition-all duration-200 active:scale-95 hover:brightness-110 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]"
            style={{ backgroundColor: 'var(--brand, #FF6B35)' }}
          >
            Commencer →
          </button>
        </form>
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
