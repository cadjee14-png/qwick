'use client'

import { createContext, useContext } from 'react'
import { Shop } from '@/types'

interface ShopContextValue {
  shop: Shop
}

export const ShopContext = createContext<ShopContextValue | null>(null)

export function ShopProvider({
  shop,
  children,
}: {
  shop: Shop
  children: React.ReactNode
}) {
  return (
    <ShopContext.Provider value={{ shop }}>
      {children}
    </ShopContext.Provider>
  )
}

export function useShop(): ShopContextValue {
  const ctx = useContext(ShopContext)
  if (!ctx) {
    throw new Error('useShop must be used within a ShopProvider')
  }
  return ctx
}
