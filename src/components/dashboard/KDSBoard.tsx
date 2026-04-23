'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Order, OrderStatus, PaymentStatus } from '@/types'
import { OrderCard } from './OrderCard'
import { playNotificationSound } from './SoundToggle'

interface KDSBoardProps {
  initialOrders: Order[]
  shopId: string
  soundEnabled: boolean
}

const COLUMNS: {
  status: OrderStatus
  label: string
  accent: string
  badgeClass: string
  emptyBorder: string
}[] = [
  {
    status: 'pending',
    label: 'En attente',
    accent: 'text-[#F59E0B]',
    badgeClass: 'bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20',
    emptyBorder: 'border-[#F59E0B]/10',
  },
  {
    status: 'preparing',
    label: 'En préparation',
    accent: 'text-[#3B82F6]',
    badgeClass: 'bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20',
    emptyBorder: 'border-[#3B82F6]/10',
  },
  {
    status: 'ready',
    label: 'Prêt',
    accent: 'text-[#22C55E]',
    badgeClass: 'bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20',
    emptyBorder: 'border-[#22C55E]/10',
  },
]

export function KDSBoard({ initialOrders, shopId, soundEnabled }: KDSBoardProps) {
  const [orders, setOrders] = useState<Order[]>(
    initialOrders.filter((o) => o.status !== 'completed' && o.status !== 'cancelled')
  )
  const audioCtxRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`shop-orders-${shopId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `shop_id=eq.${shopId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data } = await supabase
              .from('orders')
              .select('*, order_items(*)')
              .eq('id', payload.new.id)
              .single()

            if (data) {
              setOrders((prev) => [data as Order, ...prev])
              if (soundEnabled) {
                playNotificationSound(audioCtxRef)
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedStatus = payload.new.status as OrderStatus
            if (updatedStatus === 'completed' || updatedStatus === 'cancelled') {
              setOrders((prev) => prev.filter((o) => o.id !== payload.new.id))
            } else {
              setOrders((prev) =>
                prev.map((o) =>
                  o.id === payload.new.id ? { ...o, ...payload.new } : o
                )
              )
            }
          } else if (payload.eventType === 'DELETE') {
            setOrders((prev) => prev.filter((o) => o.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [shopId, soundEnabled])

  async function handleStatusChange(orderId: string, status: OrderStatus) {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    )

    try {
      await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
    } catch (e) {
      console.error('[KDSBoard] status change error:', e)
    }
  }

  async function handlePaymentChange(
    orderId: string,
    paymentStatus: PaymentStatus,
    status: OrderStatus
  ) {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, status, payment_status: paymentStatus } : o
      )
    )

    try {
      await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, payment_status: paymentStatus }),
      })
    } catch (e) {
      console.error('[KDSBoard] payment change error:', e)
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 h-[calc(100vh-120px)]">
      {COLUMNS.map((col) => {
        const colOrders = orders
          .filter((o) => o.status === col.status)
          .sort(
            (a, b) =>
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          )

        return (
          <div key={col.status} className="flex flex-col min-w-0 h-full">
            {/* Column header */}
            <div className="flex items-center justify-between px-1 mb-3 shrink-0">
              <h2 className={`text-xs font-bold uppercase tracking-widest ${col.accent}`}>
                {col.label}
              </h2>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${col.badgeClass}`}>
                {colOrders.length}
              </span>
            </div>

            {/* Cards — scrollable */}
            <div className="flex flex-col gap-3 overflow-y-auto flex-1 pr-0.5">
              {colOrders.length === 0 ? (
                <div className={`border border-dashed ${col.emptyBorder} rounded-2xl px-4 py-10 text-center`}>
                  <p className="text-[#71717A] text-sm">Aucune commande</p>
                </div>
              ) : (
                colOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onStatusChange={handleStatusChange}
                    onPaymentChange={handlePaymentChange}
                  />
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
