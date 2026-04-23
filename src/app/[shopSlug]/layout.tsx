import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ShopProvider } from '@/components/client/ShopContext'
import { Shop } from '@/types'

export default async function ShopLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ shopSlug: string }>
}) {
  const { shopSlug } = await params
  const supabase = await createClient()

  const { data: shop, error } = await supabase
    .from('shops')
    .select('*')
    .eq('slug', shopSlug)
    .single()

  if (error || !shop) {
    notFound()
  }

  const typedShop = shop as Shop

  if (!typedShop.is_open) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] px-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#141414] border border-[#2A2A2A] flex items-center justify-center">
            <svg className="w-8 h-8 text-[#A0A0A0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{typedShop.name}</h1>
          <p className="text-[#A0A0A0] text-lg">Ce commerce est actuellement fermé.</p>
          <p className="text-[#A0A0A0] text-sm">Revenez plus tard !</p>
        </div>
      </div>
    )
  }

  const brandColor = typedShop.brand_color ?? '#FF6B35'

  return (
    <ShopProvider shop={typedShop}>
      <div
        style={{ '--brand': brandColor } as React.CSSProperties}
        className="min-h-screen bg-[#0A0A0A]"
      >
        {children}
      </div>
    </ShopProvider>
  )
}
