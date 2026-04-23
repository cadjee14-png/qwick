import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

interface DailyRevenue {
  date: string
  total: number
  count: number
}

interface TopProduct {
  product_name: string
  total_quantity: number
  total_revenue: number
}

export default async function StatsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: shop } = await supabase
    .from('shops')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!shop) {
    redirect('/dashboard')
  }

  // Last 7 days date range
  const now = new Date()
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(now.getDate() - 6)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  // Fetch completed orders in last 7 days
  const { data: ordersData } = await supabase
    .from('orders')
    .select('id, total_amount, created_at')
    .eq('shop_id', shop.id)
    .eq('status', 'completed')
    .gte('created_at', sevenDaysAgo.toISOString())
    .order('created_at', { ascending: true })

  // Fetch all completed orders for total count
  const { count: totalCompleted } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('shop_id', shop.id)
    .eq('status', 'completed')

  // Fetch order items for top products (from completed orders)
  const { data: itemsData } = await supabase
    .from('order_items')
    .select('product_name, unit_price, quantity, order_id')
    .in(
      'order_id',
      (ordersData ?? []).map((o: { id: string }) => o.id)
    )

  // Build daily revenue map for last 7 days
  const dailyMap: Record<string, DailyRevenue> = {}

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    dailyMap[key] = { date: key, total: 0, count: 0 }
  }

  for (const order of ordersData ?? []) {
    const key = (order.created_at as string).slice(0, 10)
    if (dailyMap[key]) {
      dailyMap[key].total += order.total_amount as number
      dailyMap[key].count += 1
    }
  }

  const dailyRevenue = Object.values(dailyMap)

  // Build top products map
  const productMap: Record<string, TopProduct> = {}
  for (const item of itemsData ?? []) {
    const key = item.product_name as string
    if (!productMap[key]) {
      productMap[key] = { product_name: key, total_quantity: 0, total_revenue: 0 }
    }
    productMap[key].total_quantity += item.quantity as number
    productMap[key].total_revenue += (item.unit_price as number) * (item.quantity as number)
  }

  const topProducts = Object.values(productMap)
    .sort((a, b) => b.total_quantity - a.total_quantity)
    .slice(0, 5)

  const totalRevenue7d = dailyRevenue.reduce((sum, d) => sum + d.total, 0)
  const totalOrders7d = dailyRevenue.reduce((sum, d) => sum + d.count, 0)
  const avgTicket7d = totalOrders7d > 0 ? totalRevenue7d / totalOrders7d : 0
  const maxDaily = Math.max(...dailyRevenue.map((d) => d.total), 1)

  function formatDate(dateStr: string) {
    const d = new Date(dateStr + 'T12:00:00')
    return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  const kpiCards = [
    {
      label: 'CA sur 7 jours',
      value: totalRevenue7d.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-[#22C55E]">
          <path d="M10.75 10.818v2.614A3.13 3.13 0 0 0 11.888 13c.482-.315.612-.648.612-.875 0-.227-.13-.56-.612-.875a3.13 3.13 0 0 0-1.138-.432ZM8.33 8.62c.053.055.115.11.184.164.208.16.46.284.736.363V6.603a2.45 2.45 0 0 0-.35.13c-.14.065-.27.143-.386.233-.377.292-.514.627-.514.909 0 .184.058.39.33.576Z" />
          <path fillRule="evenodd" d="M9.75 1.75a.75.75 0 0 0-1.5 0v.535a5.116 5.116 0 0 0-2.048.872A2.817 2.817 0 0 0 5 5.331c0 .719.235 1.387.688 1.933.453.546 1.11.903 1.829 1.105.337.095.68.162 1.021.208v2.692a5.252 5.252 0 0 1-1.57-.523l-.001-.001a4.61 4.61 0 0 1-.363-.245.75.75 0 0 0-.889 1.208 6.13 6.13 0 0 0 .474.319 6.755 6.755 0 0 0 2.349.778V18.25a.75.75 0 0 0 1.5 0v-.634a5.752 5.752 0 0 0 2.215-.86 2.99 2.99 0 0 0 1.285-2.381c0-.77-.253-1.487-.747-2.066-.494-.58-1.204-.948-1.972-1.16a7.62 7.62 0 0 0-.781-.166V8.301a4.04 4.04 0 0 1 .99.358.75.75 0 0 0 .703-1.322 5.547 5.547 0 0 0-1.693-.574V5.75a.75.75 0 0 0-1.5 0v.338a2.842 2.842 0 0 0-.35.13c-.14.065-.27.143-.386.233-.377.292-.514.627-.514.909 0 .184.058.39.33.576Z" clipRule="evenodd" />
        </svg>
      ),
      accent: 'bg-[#22C55E]/10 border-[#22C55E]/20',
    },
    {
      label: 'Commandes (7j)',
      value: String(totalOrders7d),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-[#3B82F6]">
          <path d="M2.5 3A1.5 1.5 0 0 0 1 4.5v4A1.5 1.5 0 0 0 2.5 10h6A1.5 1.5 0 0 0 10 8.5v-4A1.5 1.5 0 0 0 8.5 3h-6ZM2.5 11A1.5 1.5 0 0 0 1 12.5v4A1.5 1.5 0 0 0 2.5 18h6a1.5 1.5 0 0 0 1.5-1.5v-4A1.5 1.5 0 0 0 8.5 11h-6Zm8 1A1.5 1.5 0 0 0 9 13.5v4A1.5 1.5 0 0 0 10.5 19h6a1.5 1.5 0 0 0 1.5-1.5v-4A1.5 1.5 0 0 0 16.5 12h-6ZM11 4.5A1.5 1.5 0 0 1 12.5 3h6A1.5 1.5 0 0 1 20 4.5v4A1.5 1.5 0 0 1 18.5 10h-6A1.5 1.5 0 0 1 11 8.5v-4Z" />
        </svg>
      ),
      accent: 'bg-[#3B82F6]/10 border-[#3B82F6]/20',
    },
    {
      label: 'Total complétées',
      value: String(totalCompleted ?? 0),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-[#F59E0B]">
          <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
        </svg>
      ),
      accent: 'bg-[#F59E0B]/10 border-[#F59E0B]/20',
    },
    {
      label: 'Ticket moyen (7j)',
      value: avgTicket7d.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-[#FF6B35]">
          <path fillRule="evenodd" d="M15.5 2A1.5 1.5 0 0 0 14 3.5v13a1.5 1.5 0 0 0 3 0v-13A1.5 1.5 0 0 0 15.5 2ZM9.5 6A1.5 1.5 0 0 0 8 7.5v9a1.5 1.5 0 0 0 3 0v-9A1.5 1.5 0 0 0 9.5 6ZM3.5 10A1.5 1.5 0 0 0 2 11.5v5a1.5 1.5 0 0 0 3 0v-5A1.5 1.5 0 0 0 3.5 10Z" clipRule="evenodd" />
        </svg>
      ),
      accent: 'bg-[#FF6B35]/10 border-[#FF6B35]/20',
    },
  ]

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Statistiques</h1>
        <p className="text-[#71717A] text-sm mt-0.5">Activité des 7 derniers jours</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <div key={card.label} className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-5">
            <div className={`inline-flex p-2 rounded-xl border mb-4 ${card.accent}`}>
              {card.icon}
            </div>
            <p className="text-2xl font-bold text-white tabular-nums">{card.value}</p>
            <p className="text-xs text-[#71717A] mt-1.5 font-medium">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Daily revenue chart */}
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#2A2A2A]">
          <h2 className="text-sm font-bold text-white">CA par jour</h2>
          <p className="text-xs text-[#71717A] mt-0.5">7 derniers jours — commandes complétées</p>
        </div>

        <div className="px-6 py-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="pb-4 pr-4 text-xs font-semibold text-[#71717A] uppercase tracking-wider whitespace-nowrap">
                  Date
                </th>
                <th className="pb-4 pr-4 text-xs font-semibold text-[#71717A] uppercase tracking-wider">
                  Volume
                </th>
                <th className="pb-4 pr-4 text-xs font-semibold text-[#71717A] uppercase tracking-wider text-right whitespace-nowrap">
                  CA (€)
                </th>
                <th className="pb-4 text-xs font-semibold text-[#71717A] uppercase tracking-wider text-right whitespace-nowrap">
                  Cmd.
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2A2A]">
              {dailyRevenue.map((day) => {
                const barWidth = maxDaily > 0 ? (day.total / maxDaily) * 100 : 0
                const isToday = day.date === now.toISOString().slice(0, 10)
                return (
                  <tr key={day.date} className={isToday ? 'opacity-100' : 'opacity-90'}>
                    <td className="py-3.5 pr-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-white text-sm">{formatDate(day.date)}</span>
                        {isToday && (
                          <span className="text-xs px-2 py-0.5 bg-[#FF6B35]/10 text-[#FF6B35] border border-[#FF6B35]/20 rounded-full font-semibold">
                            Auj.
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 pr-4 w-full">
                      <div className="h-2 bg-[#1A1A1A] rounded-full overflow-hidden min-w-[60px]">
                        <div
                          className="h-full bg-[#FF6B35] rounded-full transition-all"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-3.5 pr-4 text-right font-semibold text-white tabular-nums whitespace-nowrap">
                      {day.total > 0 ? (
                        (day.total / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
                      ) : (
                        <span className="text-[#71717A] font-normal">—</span>
                      )}
                    </td>
                    <td className="py-3.5 text-right text-[#71717A] tabular-nums">
                      {day.count > 0 ? (
                        <span className="text-white font-medium">{day.count}</span>
                      ) : (
                        <span>—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top products */}
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#2A2A2A]">
          <h2 className="text-sm font-bold text-white">Top produits</h2>
          <p className="text-xs text-[#71717A] mt-0.5">5 produits les plus commandés sur 7 jours</p>
        </div>

        <div className="px-6 py-5">
          {topProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <p className="text-[#71717A] text-sm">Aucune donnée disponible pour cette période</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {topProducts.map((product, index) => {
                const maxQty = topProducts[0]?.total_quantity ?? 1
                const barWidth = (product.total_quantity / maxQty) * 100
                const rankColors = ['text-[#FF6B35]', 'text-[#F59E0B]', 'text-[#71717A]', 'text-[#71717A]', 'text-[#71717A]']
                return (
                  <div key={product.product_name} className="flex items-center gap-4">
                    <span className={`text-sm font-bold w-5 shrink-0 text-right tabular-nums ${rankColors[index]}`}>
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <span className="text-sm text-white font-medium truncate">{product.product_name}</span>
                        <span className="text-xs text-[#71717A] shrink-0 tabular-nums">
                          {product.total_quantity} vendu{product.total_quantity > 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="h-1.5 bg-[#1A1A1A] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${barWidth}%`,
                            backgroundColor: index === 0 ? '#FF6B35' : index === 1 ? '#F59E0B' : '#3B82F6',
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-white tabular-nums shrink-0 w-20 text-right">
                      {(product.total_revenue / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
