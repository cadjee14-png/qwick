'use client'

import { Order, OrderStatus, PaymentStatus } from '@/types'

interface OrderCardProps {
  order: Order
  onStatusChange: (orderId: string, status: OrderStatus) => void
  onPaymentChange: (orderId: string, paymentStatus: PaymentStatus, status: OrderStatus) => void
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'En attente',
  preparing: 'En préparation',
  ready: 'Prêt',
  completed: 'Remis',
  cancelled: 'Annulé',
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20',
  preparing: 'bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20',
  ready: 'bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20',
  completed: 'bg-[#71717A]/10 text-[#71717A] border border-[#71717A]/20',
  cancelled: 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20',
}

function getWaitBorderColor(createdAt: string, status: OrderStatus): string {
  if (status === 'completed' || status === 'cancelled') return 'border-l-[#2A2A2A]'
  const elapsed = (Date.now() - new Date(createdAt).getTime()) / 1000 / 60
  if (elapsed < 5) return 'border-l-[#22C55E]'
  if (elapsed < 10) return 'border-l-[#F59E0B]'
  return 'border-l-[#EF4444]'
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

export function OrderCard({ order, onStatusChange, onPaymentChange }: OrderCardProps) {
  const waitBorderColor = getWaitBorderColor(order.created_at, order.status)

  return (
    <div
      className={`bg-[#111111] border border-[#2A2A2A] border-l-[3px] ${waitBorderColor} rounded-2xl p-4 flex flex-col gap-3`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-base font-bold text-white">#{order.order_number}</span>
          <p className="text-sm text-white/80 font-medium mt-0.5">{order.customer_name}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[order.status]}`}
          >
            {STATUS_LABELS[order.status]}
          </span>
          <span className="text-xs text-[#71717A]">{formatTime(order.created_at)}</span>
        </div>
      </div>

      {/* Items */}
      {order.order_items && order.order_items.length > 0 && (
        <ul className="space-y-1.5 border-t border-[#2A2A2A] pt-3">
          {order.order_items.map((item) => (
            <li key={item.id} className="flex items-center justify-between text-sm gap-2">
              <span className="text-white/80">
                <span className="text-white font-semibold">{item.quantity}×</span>{' '}
                {item.product_name}
              </span>
              <span className="text-[#71717A] text-xs tabular-nums shrink-0">
                {formatPrice(item.unit_price * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Notes */}
      {order.notes && (
        <p className="text-xs text-[#71717A] italic border-t border-[#2A2A2A] pt-2">
          {order.notes}
        </p>
      )}

      {/* Total */}
      <div className="flex items-center justify-between border-t border-[#2A2A2A] pt-2.5">
        <span className="text-xs text-[#71717A] font-medium">Total</span>
        <span className="text-base font-bold text-white tabular-nums">{formatPrice(order.total_amount)}</span>
      </div>

      {/* Actions */}
      {(order.status === 'pending' || order.status === 'preparing' || order.status === 'ready') && (
        <div className="flex gap-2 mt-0.5">
          {order.status === 'pending' && (
            <>
              <button
                onClick={() => onPaymentChange(order.id, 'paid_cash', 'preparing')}
                className="flex-1 bg-[#1A1A1A] text-white border border-[#2A2A2A] hover:bg-[#2A2A2A] rounded-lg text-xs font-semibold px-3 py-1.5 transition"
              >
                Espèces
              </button>
              <button
                onClick={() => onPaymentChange(order.id, 'paid_tpe', 'preparing')}
                className="flex-1 bg-[#1A1A1A] text-white border border-[#2A2A2A] hover:bg-[#2A2A2A] rounded-lg text-xs font-semibold px-3 py-1.5 transition"
              >
                TPE
              </button>
            </>
          )}
          {order.status === 'preparing' && (
            <button
              onClick={async () => {
                onStatusChange(order.id, 'ready')
                await fetch('/api/push/notify', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ orderId: order.id }),
                })
              }}
              className="flex-1 bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20 hover:bg-[#22C55E]/20 rounded-lg text-xs font-semibold px-3 py-1.5 transition"
            >
              Marquer prêt
            </button>
          )}
          {order.status === 'ready' && (
            <button
              onClick={() => onStatusChange(order.id, 'completed')}
              className="flex-1 bg-[#71717A]/10 text-[#71717A] border border-[#71717A]/20 hover:bg-[#71717A]/20 rounded-lg text-xs font-semibold px-3 py-1.5 transition"
            >
              Remise effectuée
            </button>
          )}
        </div>
      )}
    </div>
  )
}
