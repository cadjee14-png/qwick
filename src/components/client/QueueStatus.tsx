'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { subscribeToPush } from '@/lib/pushNotification'
import { OrderStatus } from '@/types'

interface QueueStatusProps {
  orderId: string
  orderNumber: number
  customerName: string
  initialStatus: OrderStatus
}

function StatusIcon({ status }: { status: OrderStatus }) {
  if (status === 'pending') {
    return (
      <div className="relative flex items-center justify-center w-20 h-20">
        {/* Outer ring spin */}
        <div
          className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--brand, #FF6B35)', borderTopColor: 'transparent' }}
        />
        {/* Inner ring */}
        <div
          className="absolute inset-2 rounded-full border border-[#2A2A2A]"
        />
        <svg className="w-8 h-8 relative z-10 text-[#A0A0A0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
        </svg>
      </div>
    )
  }

  if (status === 'preparing') {
    return (
      <div className="relative flex items-center justify-center w-20 h-20">
        <div
          className="absolute inset-0 rounded-full opacity-20 animate-pulse"
          style={{ backgroundColor: 'var(--brand, #FF6B35)' }}
        />
        <svg
          className="w-10 h-10 relative z-10 animate-pulse"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          style={{ color: 'var(--brand, #FF6B35)' }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.047 8.287 8.287 0 009 9.601a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
        </svg>
      </div>
    )
  }

  if (status === 'ready') {
    return (
      <div className="relative flex items-center justify-center w-24 h-24">
        {/* Pulse ring */}
        <div className="absolute inset-0 rounded-full bg-[#22C55E]/20 animate-ping" />
        <div className="absolute inset-2 rounded-full bg-[#22C55E]/10 animate-pulse" />
        <div className="relative z-10 w-16 h-16 rounded-full bg-[#22C55E]/20 border border-[#22C55E]/50 flex items-center justify-center"
          style={{ animation: 'scaleIn 0.4s ease both' }}
        >
          <svg className="w-8 h-8 text-[#22C55E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
      </div>
    )
  }

  if (status === 'completed') {
    return (
      <div className="relative flex items-center justify-center w-20 h-20">
        <div className="w-16 h-16 rounded-full bg-[#1E1E1E] border border-[#2A2A2A] flex items-center justify-center">
          <svg className="w-8 h-8 text-[#A0A0A0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
      </div>
    )
  }

  if (status === 'cancelled') {
    return (
      <div className="relative flex items-center justify-center w-20 h-20">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      </div>
    )
  }

  return null
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'En attente de paiement',
  preparing: 'En préparation...',
  ready: 'Commande prête !',
  completed: 'Merci et à bientôt !',
  cancelled: 'Commande annulée',
}

const STATUS_SUB: Record<OrderStatus, string | null> = {
  pending: 'Votre commande a bien été reçue. Elle sera préparée sous peu.',
  preparing: 'Nos équipes s\'activent pour vous ! Encore un instant...',
  ready: 'Venez récupérer votre commande au comptoir.',
  completed: 'Merci de votre visite. À très bientôt !',
  cancelled: 'Veuillez contacter le comptoir pour plus d\'informations.',
}

export function QueueStatus({
  orderId,
  orderNumber,
  customerName,
  initialStatus,
}: QueueStatusProps) {
  const [status, setStatus] = useState<OrderStatus>(initialStatus)
  const [pushEnabled, setPushEnabled] = useState(false)
  const subscribedRef = useRef(false)

  // S'abonner aux push notifications une seule fois au montage
  useEffect(() => {
    if (subscribedRef.current) return
    subscribedRef.current = true
    subscribeToPush(orderId).then(setPushEnabled)
  }, [orderId])

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          const newStatus = payload.new.status as OrderStatus
          if (newStatus) setStatus(newStatus)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orderId])

  const isReady = status === 'ready'
  const statuses: OrderStatus[] = ['pending', 'preparing', 'ready', 'completed']
  const currentIdx = statuses.indexOf(status)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-[#0A0A0A] relative overflow-hidden">
      {/* Radial gradient background */}
      <div
        className="pointer-events-none fixed inset-0 opacity-10 transition-opacity duration-1000"
        style={{
          background: isReady
            ? 'radial-gradient(ellipse 60% 50% at 50% 50%, #22C55E, transparent)'
            : 'radial-gradient(ellipse 60% 50% at 50% 50%, var(--brand, #FF6B35), transparent)',
        }}
      />

      <div className="relative w-full max-w-md space-y-8 text-center">
        {/* Customer greeting */}
        <p className="text-[#A0A0A0] text-base">
          Bonjour{' '}
          <span className="text-white font-semibold">{customerName}</span> !
        </p>

        {/* Order number — huge */}
        <div>
          <p className="text-[#A0A0A0] text-xs font-medium uppercase tracking-widest mb-1">
            Commande
          </p>
          <span
            className="text-8xl font-black tabular-nums leading-none"
            style={{ color: isReady ? '#22C55E' : 'var(--brand, #FF6B35)' }}
          >
            #{orderNumber}
          </span>
        </div>

        {/* Status icon */}
        <div className="flex justify-center">
          <StatusIcon status={status} />
        </div>

        {/* Status label + sub */}
        <div className="space-y-2">
          <p className="text-xl font-bold text-white tracking-tight">
            {STATUS_LABEL[status]}
          </p>
          {STATUS_SUB[status] && (
            <p
              className={[
                'text-sm leading-relaxed',
                isReady ? 'text-[#22C55E] font-medium animate-pulse' : 'text-[#A0A0A0]',
              ].join(' ')}
            >
              {STATUS_SUB[status]}
            </p>
          )}
        </div>

        {/* Progress dots */}
        <div className="flex justify-center items-center gap-2 pt-2">
          {statuses.map((s, idx) => {
            const isPast = idx <= currentIdx
            return (
              <div
                key={s}
                className="h-1.5 rounded-full transition-all duration-500"
                style={{
                  width: isPast ? '24px' : '6px',
                  backgroundColor: isPast
                    ? isReady
                      ? '#22C55E'
                      : 'var(--brand, #FF6B35)'
                    : '#2A2A2A',
                }}
              />
            )
          })}
        </div>
      </div>

      <style>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.6); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
