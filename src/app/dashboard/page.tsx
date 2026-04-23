import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Shop, Order } from '@/types'

function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  })
}

const STATUS_CONFIG = {
  pending: { label: 'En attente', className: 'bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20' },
  preparing: { label: 'En préparation', className: 'bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20' },
  ready: { label: 'Prêt', className: 'bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20' },
  completed: { label: 'Remis', className: 'bg-[#71717A]/10 text-[#71717A] border border-[#71717A]/20' },
  cancelled: { label: 'Annulé', className: 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20' },
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: shop } = await supabase
    .from('shops')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  if (!shop) {
    return null
  }

  const typedShop = shop as Shop

  // Fetch today's orders
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const { data: todayOrders } = await supabase
    .from('orders')
    .select('*')
    .eq('shop_id', typedShop.id)
    .gte('created_at', startOfDay.toISOString())
    .neq('status', 'cancelled')

  const orders = (todayOrders ?? []) as Order[]
  const totalRevenue = orders.reduce((sum, o) => sum + o.total_amount, 0)
  const avgTicket = orders.length > 0 ? totalRevenue / orders.length : 0

  const activeOrders = orders.filter(
    (o) => o.status === 'pending' || o.status === 'preparing' || o.status === 'ready'
  )

  const stats = [
    {
      label: "Commandes aujourd'hui",
      value: orders.length.toString(),
      trend: null,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-[#FF6B35]">
          <path d="M2.5 3A1.5 1.5 0 0 0 1 4.5v4A1.5 1.5 0 0 0 2.5 10h6A1.5 1.5 0 0 0 10 8.5v-4A1.5 1.5 0 0 0 8.5 3h-6ZM2.5 11A1.5 1.5 0 0 0 1 12.5v4A1.5 1.5 0 0 0 2.5 18h6a1.5 1.5 0 0 0 1.5-1.5v-4A1.5 1.5 0 0 0 8.5 11h-6Zm8 1A1.5 1.5 0 0 0 9 13.5v4A1.5 1.5 0 0 0 10.5 19h6a1.5 1.5 0 0 0 1.5-1.5v-4A1.5 1.5 0 0 0 16.5 12h-6ZM11 4.5A1.5 1.5 0 0 1 12.5 3h6A1.5 1.5 0 0 1 20 4.5v4A1.5 1.5 0 0 1 18.5 10h-6A1.5 1.5 0 0 1 11 8.5v-4Z" />
        </svg>
      ),
      accentColor: 'bg-[#FF6B35]/10 border-[#FF6B35]/20',
    },
    {
      label: 'CA du jour',
      value: formatPrice(totalRevenue),
      trend: null,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-[#22C55E]">
          <path d="M10.75 10.818v2.614A3.13 3.13 0 0 0 11.888 13c.482-.315.612-.648.612-.875 0-.227-.13-.56-.612-.875a3.13 3.13 0 0 0-1.138-.432ZM8.33 8.62c.053.055.115.11.184.164.208.16.46.284.736.363V6.603a2.45 2.45 0 0 0-.35.13c-.14.065-.27.143-.386.233-.377.292-.514.627-.514.909 0 .184.058.39.33.576Z" />
          <path fillRule="evenodd" d="M9.75 1.75a.75.75 0 0 0-1.5 0v.535a5.116 5.116 0 0 0-2.048.872A2.817 2.817 0 0 0 5 5.331c0 .719.235 1.387.688 1.933.453.546 1.11.903 1.829 1.105.337.095.68.162 1.021.208v2.692a5.252 5.252 0 0 1-1.57-.523l-.001-.001a4.61 4.61 0 0 1-.363-.245.75.75 0 0 0-.889 1.208 6.13 6.13 0 0 0 .474.319 6.755 6.755 0 0 0 2.349.778V18.25a.75.75 0 0 0 1.5 0v-.634a5.752 5.752 0 0 0 2.215-.86 2.99 2.99 0 0 0 1.285-2.381c0-.77-.253-1.487-.747-2.066-.494-.58-1.204-.948-1.972-1.16a7.62 7.62 0 0 0-.781-.166V8.301a4.04 4.04 0 0 1 .99.358.75.75 0 0 0 .703-1.322 5.547 5.547 0 0 0-1.693-.574V5.75a.75.75 0 0 0-1.5 0v.338a2.842 2.842 0 0 0-.35.13c-.14.065-.27.143-.386.233-.377.292-.514.627-.514.909 0 .184.058.39.33.576Z" clipRule="evenodd" />
        </svg>
      ),
      accentColor: 'bg-[#22C55E]/10 border-[#22C55E]/20',
    },
    {
      label: 'Ticket moyen',
      value: formatPrice(avgTicket),
      trend: null,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-[#F59E0B]">
          <path fillRule="evenodd" d="M15.5 2A1.5 1.5 0 0 0 14 3.5v13a1.5 1.5 0 0 0 3 0v-13A1.5 1.5 0 0 0 15.5 2ZM9.5 6A1.5 1.5 0 0 0 8 7.5v9a1.5 1.5 0 0 0 3 0v-9A1.5 1.5 0 0 0 9.5 6ZM3.5 10A1.5 1.5 0 0 0 2 11.5v5a1.5 1.5 0 0 0 3 0v-5A1.5 1.5 0 0 0 3.5 10Z" clipRule="evenodd" />
        </svg>
      ),
      accentColor: 'bg-[#F59E0B]/10 border-[#F59E0B]/20',
    },
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Bonjour{' '}
            <span className="text-[#FF6B35]">{typedShop.name}</span>{' '}
            <span>👋</span>
          </h1>
          <p className="text-[#71717A] text-sm mt-1">
            {new Date().toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
        </div>
        <Link
          href="/dashboard/orders"
          className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white text-sm font-semibold rounded-xl transition"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M2.5 3A1.5 1.5 0 0 0 1 4.5v4A1.5 1.5 0 0 0 2.5 10h6A1.5 1.5 0 0 0 10 8.5v-4A1.5 1.5 0 0 0 8.5 3h-6Z" />
            <path d="M2.5 11A1.5 1.5 0 0 0 1 12.5v4A1.5 1.5 0 0 0 2.5 18h6a1.5 1.5 0 0 0 1.5-1.5v-4A1.5 1.5 0 0 0 8.5 11h-6Zm8 1A1.5 1.5 0 0 0 9 13.5v4A1.5 1.5 0 0 0 10.5 19h6a1.5 1.5 0 0 0 1.5-1.5v-4A1.5 1.5 0 0 0 16.5 12h-6ZM11 4.5A1.5 1.5 0 0 1 12.5 3h6A1.5 1.5 0 0 1 20 4.5v4A1.5 1.5 0 0 1 18.5 10h-6A1.5 1.5 0 0 1 11 8.5v-4Z" />
          </svg>
          Voir les commandes
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-5"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-2 rounded-xl border ${stat.accentColor}`}>
                {stat.icon}
              </div>
            </div>
            <p className="text-3xl font-bold text-white tabular-nums">{stat.value}</p>
            <p className="text-[#71717A] text-sm mt-1.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Active orders */}
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2A2A2A]">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-white">Commandes en cours</h2>
            {activeOrders.length > 0 && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-[#FF6B35]/10 text-[#FF6B35] border border-[#FF6B35]/20 rounded-full text-xs font-bold">
                {activeOrders.length}
              </span>
            )}
          </div>
          <Link
            href="/dashboard/orders"
            className="flex items-center gap-1 text-xs font-medium text-[#71717A] hover:text-white transition"
          >
            Voir tout
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
              <path fillRule="evenodd" d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>

        {activeOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <div className="w-10 h-10 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center mb-1">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-[#71717A]">
                <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-[#71717A] text-sm font-medium">Aucune commande en cours</p>
            <p className="text-[#71717A]/60 text-xs">
              {typedShop.is_open
                ? 'En attente de nouvelles commandes…'
                : 'Le shop est actuellement fermé.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#2A2A2A]">
            {activeOrders.slice(0, 5).map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between px-5 py-3 hover:bg-[#1A1A1A]/50 transition"
              >
                <div className="flex items-center gap-3">
                  <span className="text-white font-bold text-sm">#{order.order_number}</span>
                  <span className="text-[#71717A] text-sm">{order.customer_name}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      STATUS_CONFIG[order.status]?.className ?? ''
                    }`}
                  >
                    {STATUS_CONFIG[order.status]?.label ?? order.status}
                  </span>
                  <span className="text-[#71717A] text-xs tabular-nums font-medium">
                    {(order.total_amount / 100).toLocaleString('fr-FR', {
                      style: 'currency',
                      currency: 'EUR',
                    })}
                  </span>
                </div>
              </div>
            ))}
            {activeOrders.length > 5 && (
              <Link
                href="/dashboard/orders"
                className="block text-center text-sm text-[#71717A] hover:text-white py-3 transition"
              >
                + {activeOrders.length - 5} autres commandes
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
