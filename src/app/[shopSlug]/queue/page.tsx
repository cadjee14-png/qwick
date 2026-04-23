import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { QueueStatus } from '@/components/client/QueueStatus'
import { Order } from '@/types'

export default async function QueuePage({
  params,
  searchParams,
}: {
  params: Promise<{ shopSlug: string }>
  searchParams: Promise<{ orderId?: string }>
}) {
  const { orderId } = await searchParams

  if (!orderId) {
    notFound()
  }

  const supabase = createAdminClient()

  const { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single()

  if (error || !order) {
    notFound()
  }

  const typedOrder = order as Order

  return (
    <QueueStatus
      orderId={typedOrder.id}
      orderNumber={typedOrder.order_number}
      customerName={typedOrder.customer_name}
      initialStatus={typedOrder.status}
    />
  )
}
