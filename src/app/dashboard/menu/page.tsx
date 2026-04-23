import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Category, Product } from '@/types'
import { MenuManager } from '@/components/dashboard/MenuManager'

export default async function MenuPage() {
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

  const [{ data: categoriesData }, { data: productsData }] = await Promise.all([
    supabase
      .from('categories')
      .select('*')
      .eq('shop_id', shop.id)
      .order('position', { ascending: true }),
    supabase
      .from('products')
      .select('*')
      .eq('shop_id', shop.id)
      .order('position', { ascending: true }),
  ])

  return (
    <MenuManager
      initialCategories={(categoriesData ?? []) as Category[]}
      initialProducts={(productsData ?? []) as Product[]}
      shopId={shop.id}
    />
  )
}
