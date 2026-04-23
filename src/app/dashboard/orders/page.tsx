'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Order, Shop } from '@/types'
import { KDSBoard } from '@/components/dashboard/KDSBoard'
import { SoundToggle } from '@/components/dashboard/SoundToggle'

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [shop, setShop] = useState<Shop | null>(null)
  const [loading, setLoading] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(false)
  const audioCtxRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    async function init() {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data: shopData } = await supabase
        .from('shops')
        .select('*')
        .eq('owner_id', user.id)
        .single()

      if (!shopData) return

      setShop(shopData as Shop)

      const { data: ordersData } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('shop_id', shopData.id)
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false })
        .limit(100)

      setOrders((ordersData ?? []) as Order[])
      setLoading(false)
    }

    init()
  }, [])

  function handleAudioUnlocked() {
    setSoundEnabled(true)
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-[#71717A]">
          <svg className="w-5 h-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm">Chargement des commandes…</span>
        </div>
      </div>
    )
  }

  if (!shop) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[#71717A] text-sm">Impossible de charger le shop.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Kitchen Display</h1>
          <p className="text-[#71717A] text-sm mt-0.5">Commandes en temps réel</p>
        </div>
        <SoundToggle
          onAudioUnlocked={handleAudioUnlocked}
          onToggle={setSoundEnabled}
        />
      </div>

      {/* KDS Board */}
      <div className="flex-1">
        <KDSBoard
          initialOrders={orders}
          shopId={shop.id}
          soundEnabled={soundEnabled}
        />
      </div>
    </div>
  )
}
