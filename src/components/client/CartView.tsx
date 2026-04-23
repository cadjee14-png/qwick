'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/stores/cartStore'
import { useShop } from './ShopContext'

interface CartViewProps {
  shopSlug: string
}

export function CartView({ shopSlug }: CartViewProps) {
  const { shop } = useShop()
  const items = useCartStore((s) => s.items)
  const customerName = useCartStore((s) => s.customerName)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const removeItem = useCartStore((s) => s.removeItem)
  const total = useCartStore((s) => s.total())
  const clearCart = useCartStore((s) => s.clearCart)
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleOrder() {
    if (items.length === 0) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId: shop.id,
          customerName: customerName || 'Client',
          items: items.map((i) => ({
            productId: i.product.id,
            productName: i.product.name,
            unitPrice: i.product.price,
            quantity: i.quantity,
            notes: i.notes || '',
          })),
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Erreur lors de la commande')
      }

      const { orderId } = await res.json()
      clearCart()
      router.push(`/${shopSlug}/queue?orderId=${orderId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
      setLoading(false)
    }
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-[#0A0A0A]">
        <div className="w-full max-w-md text-center space-y-5">
          <div className="w-20 h-20 mx-auto rounded-full bg-[#141414] border border-[#2A2A2A] flex items-center justify-center shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
            <svg className="w-9 h-9 text-[#A0A0A0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Panier vide</h1>
            <p className="text-[#A0A0A0]">Vous n&apos;avez pas encore ajouté de produits.</p>
          </div>
          <Link
            href={`/${shopSlug}/menu`}
            className="inline-block mt-2 rounded-full px-8 py-3 text-white font-bold transition-all duration-200 active:scale-95 hover:brightness-110"
            style={{ backgroundColor: 'var(--brand, #FF6B35)' }}
          >
            Voir le menu
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <div className="max-w-md mx-auto w-full pb-40">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-[#2A2A2A] px-4 py-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/${shopSlug}/menu`}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#141414] border border-[#2A2A2A] text-[#A0A0A0] hover:text-white hover:bg-[#1E1E1E] transition-all duration-200 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]"
              aria-label="Retour au menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </Link>
            <h1 className="text-xl font-bold text-white tracking-tight">Mon panier</h1>
          </div>
        </div>

        {/* Items list */}
        <div className="px-4 pt-4 space-y-3">
          {items.map((item) => (
            <div
              key={item.product.id}
              className="bg-[#141414] rounded-2xl border border-[#2A2A2A] p-4 flex gap-3 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]"
            >
              {/* Product image thumbnail */}
              <div className="w-14 h-14 shrink-0 rounded-xl overflow-hidden bg-[#1E1E1E]">
                {item.product.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.product.image_url}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#2A2A2A]">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm truncate">{item.product.name}</p>
                <p className="text-[#A0A0A0] text-xs mt-0.5">
                  {item.product.price.toFixed(2)} € / unité
                </p>

                {/* Quantity controls */}
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#1E1E1E] text-white font-bold text-base hover:bg-[#2A2A2A] transition-all duration-200 active:scale-90 border border-[#2A2A2A]"
                    aria-label="Diminuer"
                  >
                    −
                  </button>
                  <span className="text-white font-semibold text-sm w-5 text-center tabular-nums">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#1E1E1E] text-white font-bold text-base hover:bg-[#2A2A2A] transition-all duration-200 active:scale-90 border border-[#2A2A2A]"
                    aria-label="Augmenter"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Line total + delete */}
              <div className="flex flex-col items-end justify-between shrink-0">
                <button
                  onClick={() => removeItem(item.product.id)}
                  className="text-[#2A2A2A] hover:text-red-400 transition-all duration-200"
                  aria-label="Supprimer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <span
                  className="font-extrabold text-sm tabular-nums"
                  style={{ color: 'var(--brand, #FF6B35)' }}
                >
                  {(item.product.price * item.quantity).toFixed(2)} €
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="mx-4 mt-4 bg-[#141414] rounded-2xl border border-[#2A2A2A] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
          <div className="flex justify-between items-center">
            <span className="text-[#A0A0A0] font-medium">Total</span>
            <span className="text-white font-extrabold text-xl tabular-nums">
              {total.toFixed(2)} €
            </span>
          </div>
        </div>
      </div>

      {/* CTA sticky bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/95 to-transparent px-4 py-4 backdrop-blur-sm">
        <div className="max-w-md mx-auto space-y-2">
          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}
          <button
            onClick={handleOrder}
            disabled={loading}
            className="w-full rounded-full px-4 py-4 text-white font-bold text-base transition-all duration-200 active:scale-95 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
            style={{ backgroundColor: 'var(--brand, #FF6B35)' }}
          >
            {loading ? 'Envoi en cours…' : 'Passer la commande'}
          </button>
        </div>
      </div>
    </div>
  )
}
