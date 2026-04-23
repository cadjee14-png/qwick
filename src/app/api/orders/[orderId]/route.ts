import { createClient } from '@/lib/supabase/server'
import { OrderStatus, PaymentStatus } from '@/types'

interface UpdateOrderBody {
  status?: OrderStatus
  payment_status?: PaymentStatus
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params
    const body: UpdateOrderBody = await request.json()

    if (!body.status && !body.payment_status) {
      return Response.json({ error: 'Aucune donnée à mettre à jour' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return Response.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const updateData: Partial<{ status: OrderStatus; payment_status: PaymentStatus; updated_at: string }> = {
      updated_at: new Date().toISOString(),
    }

    if (body.status) updateData.status = body.status
    if (body.payment_status) updateData.payment_status = body.payment_status

    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select('id, status, payment_status')
      .single()

    if (error) {
      console.error('[PATCH /api/orders/:id] error:', error)
      return Response.json({ error: 'Impossible de mettre à jour la commande' }, { status: 500 })
    }

    return Response.json(data)
  } catch (err) {
    console.error('[PATCH /api/orders/:id] unexpected error:', err)
    return Response.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
