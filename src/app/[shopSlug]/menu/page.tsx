import { createClient } from '@/lib/supabase/server'
import { CategoryNav } from '@/components/client/CategoryNav'
import { ProductCard } from '@/components/client/ProductCard'
import { CartButton } from '@/components/client/CartButton'
import { Category, Product } from '@/types'

export default async function MenuPage({
  params,
}: {
  params: Promise<{ shopSlug: string }>
}) {
  const { shopSlug } = await params
  const supabase = await createClient()

  // Get shop id from slug
  const { data: shop } = await supabase
    .from('shops')
    .select('id, name')
    .eq('slug', shopSlug)
    .single()

  if (!shop) return null

  // Fetch categories and products in parallel
  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase
      .from('categories')
      .select('*')
      .eq('shop_id', shop.id)
      .eq('is_visible', true)
      .order('position', { ascending: true }),
    supabase
      .from('products')
      .select('*')
      .eq('shop_id', shop.id)
      .eq('is_available', true)
      .order('position', { ascending: true }),
  ])

  const safeCategories: Category[] = categories ?? []
  const safeProducts: Product[] = products ?? []

  // Group products by category
  const productsByCategory = safeCategories.map((cat) => ({
    category: cat,
    products: safeProducts.filter((p) => p.category_id === cat.id),
  }))

  // Products with no category or unknown category
  const uncategorised = safeProducts.filter(
    (p) => !p.category_id || !safeCategories.find((c) => c.id === p.category_id)
  )

  return (
    <div className="max-w-md mx-auto w-full pb-32 bg-[#0A0A0A] min-h-screen">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-40 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-[#2A2A2A]">
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white tracking-tight">{shop.name}</h1>
        </div>
        {safeCategories.length > 0 && (
          <CategoryNav categories={safeCategories} />
        )}
      </div>

      {/* Product sections */}
      <div className="px-4 pt-6 space-y-8">
        {productsByCategory.map(({ category, products: catProducts }) => {
          if (catProducts.length === 0) return null
          return (
            <section key={category.id} id={`category-${category.id}`}>
              <h2 className="text-base font-bold text-white tracking-tight mb-3 uppercase text-xs text-[#A0A0A0] letter-spacing-wide">
                {category.name}
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {catProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          )
        })}

        {uncategorised.length > 0 && (
          <section id="category-uncategorised">
            <h2 className="text-base font-bold text-white tracking-tight mb-3 uppercase text-xs text-[#A0A0A0]">
              Autres
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {uncategorised.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {safeProducts.length === 0 && (
          <div className="text-center py-20 space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#141414] border border-[#2A2A2A] flex items-center justify-center">
              <svg className="w-8 h-8 text-[#A0A0A0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
              </svg>
            </div>
            <p className="text-[#A0A0A0]">Aucun produit disponible pour le moment.</p>
          </div>
        )}
      </div>

      {/* Floating cart button */}
      <CartButton shopSlug={shopSlug} />
    </div>
  )
}
