export const runtime = 'nodejs'

import webpush from 'web-push'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function POST(request: Request) {
  try {
    const { orderId } = await request.json()

    // Vérifie que le gérant est authentifié
    const supabaseAuth = await createClient()
    const { data: { user } } = await supabaseAuth.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = createAdminClient()

    // Récupère l'abonnement push lié à cette commande
    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('order_id', orderId)

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ sent: false, reason: 'No subscription' })
    }

    // Récupère le numéro de commande
    const { data: order } = await supabase
      .from('orders')
      .select('order_number, customer_name')
      .eq('id', orderId)
      .single()

    const payload = JSON.stringify({
      title: '🍽️ Votre commande est prête !',
      body: `Commande #${order?.order_number} — ${order?.customer_name}, venez récupérer votre commande !`,
      url: `/queue?orderId=${orderId}`,
    })

    // Envoie la notif à tous les abonnements de cette commande
    await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification(sub.subscription, payload)
      )
    )

    return NextResponse.json({ sent: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
