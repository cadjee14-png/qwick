'use client'

import { useState, useRef, useCallback } from 'react'
import { Product } from '@/types'
import { useCartStore } from '@/stores/cartStore'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem)

  // Modal state
  const [isOpen, setIsOpen] = useState(false)
  const [modalQty, setModalQty] = useState(1)
  const [notes, setNotes] = useState('')

  // Swipe-to-close state
  const sheetRef = useRef<HTMLDivElement>(null)
  const dragStartY = useRef<number | null>(null)
  const dragCurrentY = useRef<number>(0)

  const openModal = useCallback(() => {
    if (!product.is_available) return
    setModalQty(1)
    setNotes('')
    setIsOpen(true)
    window.dispatchEvent(new Event('qwick:modal:open'))
  }, [product.is_available])

  const closeModal = useCallback(() => {
    setIsOpen(false)
    window.dispatchEvent(new Event('qwick:modal:close'))
  }, [])

  const handleAddFromModal = useCallback(() => {
    addItem(product, modalQty, notes)
    closeModal()
  }, [addItem, product, modalQty, notes, closeModal])

  // Touch drag handlers for swipe-to-close
  const handleTouchStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY
    dragCurrentY.current = 0
    if (sheetRef.current) {
      sheetRef.current.style.transition = 'none'
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragStartY.current === null) return
    const delta = e.touches[0].clientY - dragStartY.current
    if (delta < 0) return // prevent pulling up
    dragCurrentY.current = delta
    if (sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${delta}px)`
    }
  }

  const handleTouchEnd = () => {
    if (sheetRef.current) {
      sheetRef.current.style.transition = ''
      sheetRef.current.style.transform = ''
    }
    if (dragCurrentY.current > 100) {
      closeModal()
    }
    dragStartY.current = null
    dragCurrentY.current = 0
  }

  return (
    <>
      {/* ── CARD ─────────────────────────────────────────────────── */}
      <div
        onClick={product.is_available ? openModal : undefined}
        className={[
          'relative bg-[#141414] rounded-2xl overflow-hidden shadow-[0_0_0_1px_rgba(255,255,255,0.06)] flex flex-col transition-transform duration-200',
          product.is_available
            ? 'hover:scale-[1.02] hover:bg-[#1E1E1E] cursor-pointer'
            : 'opacity-40 cursor-default',
        ].join(' ')}
      >
        {/* Image */}
        <div className="relative w-full aspect-square bg-[#1E1E1E] overflow-hidden">
          {product.image_url ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#2A2A2A]">
              <svg
                className="w-12 h-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}

          {/* Unavailable badge */}
          {!product.is_available && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-[#1E1E1E] border border-[#2A2A2A] text-[#A0A0A0] text-xs font-semibold px-2.5 py-1 rounded-full">
                Indisponible
              </span>
            </div>
          )}

          {/* Add button — overlay bottom right */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (product.is_available) addItem(product)
            }}
            disabled={!product.is_available}
            className={[
              'absolute bottom-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-lg transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.4)]',
              product.is_available
                ? 'active:scale-90 hover:brightness-110'
                : 'opacity-40 cursor-not-allowed',
            ].join(' ')}
            style={{ backgroundColor: 'var(--brand, #FF6B35)' }}
            aria-label={`Ajouter ${product.name}`}
          >
            +
          </button>
        </div>

        {/* Content */}
        <div className="p-3 flex flex-col gap-1">
          <h3 className="font-semibold text-white text-sm leading-snug line-clamp-2">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-[#A0A0A0] text-xs line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          )}
          <span
            className="mt-1 text-base font-extrabold tabular-nums"
            style={{ color: 'var(--brand, #FF6B35)' }}
          >
            {product.price.toFixed(2)} €
          </span>
        </div>
      </div>

      {/* ── BOTTOM SHEET MODAL ───────────────────────────────────── */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeModal}
            aria-hidden="true"
          />

          {/* Sheet — layout fixe : contenu scrollable + bouton CTA collé en bas */}
          <div
            ref={sheetRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="relative z-10 bg-[#141414] rounded-t-3xl shadow-[0_-4px_32px_rgba(0,0,0,0.6)] flex flex-col max-h-[90dvh]"
            style={{ animation: 'slideUp 0.28s cubic-bezier(0.32,0.72,0,1)' }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-[#2A2A2A]" />
            </div>

            {/* Close button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-[#1E1E1E] border border-[#2A2A2A] text-[#A0A0A0] hover:text-white transition-colors z-10"
              aria-label="Fermer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1">
              {/* Product image */}
              <div className="mx-4 mt-2 rounded-2xl overflow-hidden aspect-video bg-[#1E1E1E]">
                {product.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#2A2A2A]">
                    <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Nom, description, prix */}
              <div className="px-4 pt-4 pb-2 space-y-1.5">
                <h2 className="text-white text-xl font-bold leading-snug">{product.name}</h2>
                {product.description && (
                  <p className="text-[#A0A0A0] text-sm leading-relaxed">{product.description}</p>
                )}
                <span className="block text-lg font-extrabold tabular-nums pt-1" style={{ color: 'var(--brand, #FF6B35)' }}>
                  {product.price.toFixed(2)} €
                </span>
              </div>

              {/* Quantité */}
              <div className="px-4 py-3 flex items-center gap-4">
                <span className="text-[#A0A0A0] text-sm font-medium flex-1">Quantité</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => setModalQty((q) => Math.max(1, q - 1))}
                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#1E1E1E] border border-[#2A2A2A] text-white font-bold text-lg hover:bg-[#2A2A2A] transition-all active:scale-90">−</button>
                  <span className="text-white font-bold text-lg w-6 text-center tabular-nums">{modalQty}</span>
                  <button onClick={() => setModalQty((q) => q + 1)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-lg transition-all active:scale-90 hover:brightness-110"
                    style={{ backgroundColor: 'var(--brand, #FF6B35)' }}>+</button>
                </div>
              </div>

              {/* Instructions / Allergies */}
              <div className="px-4 pb-4">
                <label className="block text-[#A0A0A0] text-xs font-medium mb-2 uppercase tracking-wide">
                  Instructions / Allergies <span className="normal-case text-[#555]">(optionnel)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: sans oignon, allergie arachides, bien cuit..."
                  rows={3}
                  className="w-full rounded-xl bg-[#1E1E1E] border border-[#2A2A2A] text-white placeholder:text-[#555] text-sm px-3 py-2.5 resize-none focus:outline-none focus:border-[#FF6B35]/40 transition-colors"
                />
              </div>
            </div>

            {/* CTA fixé en bas — jamais caché */}
            <div className="px-4 py-4 border-t border-[#1E1E1E] bg-[#141414] shrink-0">
              <button
                onClick={handleAddFromModal}
                className="w-full rounded-2xl py-4 text-white font-bold text-base transition-all active:scale-[0.98] hover:brightness-110 shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
                style={{ backgroundColor: 'var(--brand, #FF6B35)' }}
              >
                Ajouter au panier — {(product.price * modalQty).toFixed(2)} €
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-up keyframe */}
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
      `}</style>
    </>
  )
}
