'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Order } from '@/types'

interface OrderHistoryProps {
  shopId: string
}

const STATUS_BADGE: Record<string, string> = {
  completed: 'bg-[#71717A]/10 text-[#71717A] border border-[#71717A]/20',
  cancelled: 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20',
}

const STATUS_LABELS: Record<string, string> = {
  completed: 'Remis',
  cancelled: 'Annulé',
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  })
}

export function OrderHistory({ shopId }: OrderHistoryProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    async function loadHistory() {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)

      const { data } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('shop_id', shopId)
        .in('status', ['completed', 'cancelled'])
        .gte('created_at', todayStart.toISOString())
        .order('created_at', { ascending: false })

      setOrders((data ?? []) as Order[])
      setLoading(false)
    }

    loadHistory()

    const channel = supabase
      .channel(`shop-history-${shopId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `shop_id=eq.${shopId}`,
        },
        async (payload) => {
          const updatedStatus = payload.new.status as string
          if (updatedStatus === 'completed' || updatedStatus === 'cancelled') {
            const { data } = await supabase
              .from('orders')
              .select('*, order_items(*)')
              .eq('id', payload.new.id)
              .single()

            if (data) {
              setOrders((prev) => {
                const exists = prev.some((o) => o.id === data.id)
                if (exists) {
                  return prev.map((o) => (o.id === data.id ? (data as Order) : o))
                }
                return [data as Order, ...prev]
              })
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [shopId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex items-center gap-3 text-[#71717A]">
          <svg
            className="w-4 h-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span className="text-sm">Chargement de l&apos;historique…</span>
        </div>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-[#71717A] text-sm">Aucune commande terminée aujourd&apos;hui.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {orders.map((order) => (
        <div
          key={order.id}
          className="bg-[#111111] border border-[#2A2A2A] rounded-2xl px-4 py-3 flex items-center justify-between gap-4"
        >
          {/* Left: time + order number + name */}
          <div className="flex items-center gap-4 min-w-0">
            <span className="text-xs text-[#71717A] tabular-nums shrink-0">
              {formatTime(order.created_at)}
            </span>
            <span className="text-sm font-bold text-white shrink-0">
              #{order.order_number}
            </span>
            <span className="text-sm text-white/80 truncate">{order.customer_name}</span>
          </div>

          {/* Right: total + badge */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm font-bold text-white tabular-nums">
              {formatPrice(order.total_amount)}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE[order.status] ?? ''}`}
            >
              {STATUS_LABELS[order.status] ?? order.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

export function useHistoryCount(shopId: string): number {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const supabase = createClient()

    async function loadCount() {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)

      const { count: c } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('shop_id', shopId)
        .in('status', ['completed', 'cancelled'])
        .gte('created_at', todayStart.toISOString())

      setCount(c ?? 0)
    }

    loadCount()

    const channel = supabase
      .channel(`shop-history-count-${shopId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `shop_id=eq.${shopId}`,
        },
        (payload) => {
          const updatedStatus = payload.new.status as string
          if (updatedStatus === 'completed' || updatedStatus === 'cancelled') {
            setCount((prev) => prev + 1)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [shopId])

  return count
}
