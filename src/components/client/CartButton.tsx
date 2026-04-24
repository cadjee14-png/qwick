'use client'

import { useRouter } from 'next/navigation'
import { useCartStore } from '@/stores/cartStore'
import { useEffect, useState } from 'react'

interface CartButtonProps {
  shopSlug: string
}

export function CartButton({ shopSlug }: CartButtonProps) {
  const itemCount = useCartStore((s) => s.itemCount())
  const total = useCartStore((s) => s.total())
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    const show = () => setModalOpen(true)
    const hide = () => setModalOpen(false)
    window.addEventListener('qwick:modal:open', show)
    window.addEventListener('qwick:modal:close', hide)
    return () => {
      window.removeEventListener('qwick:modal:open', show)
      window.removeEventListener('qwick:modal:close', hide)
    }
  }, [])

  if (itemCount === 0 || modalOpen) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/90 to-transparent pointer-events-none">
      <div className="max-w-md mx-auto pointer-events-auto">
        <button
          onClick={() => router.push(`/${shopSlug}/cart`)}
          className="w-full rounded-full px-5 py-4 text-white flex items-center justify-between transition-all duration-200 active:scale-95 hover:brightness-110 shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
          style={{ backgroundColor: 'var(--brand, #FF6B35)' }}
        >
          {/* Left: item count badge */}
          <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold tabular-nums">
            {itemCount}
          </span>

          {/* Center: label */}
          <span className="text-base font-bold">Voir mon panier</span>

          {/* Right: total */}
          <span className="text-base font-bold tabular-nums">
            {total.toFixed(2)} €
          </span>
        </button>
      </div>
    </div>
  )
}
