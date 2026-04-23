'use client'

import { Product } from '@/types'
import { useCartStore } from '@/stores/cartStore'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem)

  return (
    <div className="relative bg-[#141414] rounded-2xl overflow-hidden shadow-[0_0_0_1px_rgba(255,255,255,0.06)] flex flex-col transition-transform duration-200 hover:scale-[1.02] hover:bg-[#1E1E1E]">
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

        {/* Add button — overlay bottom right */}
        <button
          onClick={() => addItem(product)}
          className="absolute bottom-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-lg transition-all duration-200 active:scale-90 hover:brightness-110 shadow-[0_2px_8px_rgba(0,0,0,0.4)]"
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
  )
}
