import { createAdminClient } from '@/lib/supabase/admin'

interface OrderItemInput {
  productId: string
  productName: string
  unitPrice: number
  quantity: number
  notes?: string
}

interface CreateOrderBody {
  shopId: string
  customerName: string
  items: OrderItemInput[]
}

export async function POST(request: Request) {
  try {
    const body: CreateOrderBody = await request.json()
    const { shopId, customerName, items } = body

    if (!shopId || !customerName || !items || items.length === 0) {
      return Response.json({ error: 'Données manquantes' }, { status: 400 })
    }

    const totalAmount = items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    )

    const supabase = createAdminClient()

    // Insert the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        shop_id: shopId,
        customer_name: customerName,
        total_amount: totalAmount,
        status: 'pending',
        payment_status: 'unpaid',
        // order_number is auto-set by trigger
        order_number: 0,
      })
      .select('id, order_number')
      .single()

    if (orderError || !order) {
      console.error('[POST /api/orders] order insert error:', orderError)
      return Response.json({ error: 'Impossible de créer la commande' }, { status: 500 })
    }

    // Insert order items
    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      product_name: item.productName,
      unit_price: item.unitPrice,
      quantity: item.quantity,
      item_notes: item.notes ?? null,
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error('[POST /api/orders] order_items insert error:', itemsError)
      // Order was created — still return the orderId so the client can track
      // but log the issue
    }

    return Response.json({
      orderId: order.id,
      orderNumber: order.order_number,
    })
  } catch (err) {
    console.error('[POST /api/orders] unexpected error:', err)
    return Response.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
