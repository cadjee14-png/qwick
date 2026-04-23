import { createClient } from '@/lib/supabase/server'

interface CreateProductBody {
  name: string
  description?: string
  price: number
  category_id: string
  shop_id: string
  image_url?: string
  is_available?: boolean
  position?: number
}

export async function POST(request: Request) {
  try {
    const body: CreateProductBody = await request.json()
    const { name, description, price, category_id, shop_id, image_url, is_available, position } = body

    if (!name || price === undefined || !category_id || !shop_id) {
      return Response.json({ error: 'Données manquantes' }, { status: 400 })
    }

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Verify shop ownership
    const { data: shop } = await supabase
      .from('shops')
      .select('id')
      .eq('id', shop_id)
      .eq('owner_id', user.id)
      .single()

    if (!shop) {
      return Response.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Determine position if not provided
    let finalPosition = position ?? 0
    if (position === undefined) {
      const { count } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('category_id', category_id)
      finalPosition = count ?? 0
    }

    const { data: product, error } = await supabase
      .from('products')
      .insert({
        name: name.trim(),
        description: description?.trim() ?? null,
        price,
        category_id,
        shop_id,
        image_url: image_url?.trim() || null,
        is_available: is_available ?? true,
        position: finalPosition,
      })
      .select('*')
      .single()

    if (error || !product) {
      console.error('[POST /api/products] error:', error)
      return Response.json({ error: 'Impossible de créer le produit' }, { status: 500 })
    }

    return Response.json({ product }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/products] unexpected error:', err)
    return Response.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
