'use client'

import { useState } from 'react'

interface ShopToggleProps {
  shopId: string
  initialIsOpen: boolean
}

export function ShopToggle({ shopId, initialIsOpen }: ShopToggleProps) {
  const [isOpen, setIsOpen] = useState(initialIsOpen)
  const [loading, setLoading] = useState(false)

  async function handleToggle() {
    setLoading(true)
    const next = !isOpen

    try {
      const res = await fetch(`/api/shops/${shopId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_open: next }),
      })

      if (res.ok) {
        setIsOpen(next)
      }
    } catch (e) {
      console.error('[ShopToggle] error:', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${
        isOpen
          ? 'bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20 hover:bg-[#22C55E]/20'
          : 'bg-[#1A1A1A] text-[#71717A] border border-[#2A2A2A] hover:text-white hover:bg-[#2A2A2A]'
      }`}
    >
      {/* Toggle pill */}
      <span
        className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
          isOpen ? 'bg-[#22C55E]' : 'bg-[#2A2A2A]'
        }`}
      >
        <span
          className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white shadow-sm transition-transform ${
            isOpen ? 'translate-x-3.5' : 'translate-x-0.5'
          }`}
        />
      </span>
      <span>{isOpen ? 'Ouvert' : 'Fermé'}</span>
    </button>
  )
}
