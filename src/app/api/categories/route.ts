import { createClient } from '@/lib/supabase/server'

interface CreateCategoryBody {
  name: string
  shop_id: string
  position?: number
}

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { data: shop } = await supabase
      .from('shops')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (!shop) {
      return Response.json({ error: 'Shop introuvable' }, { status: 404 })
    }

    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .eq('shop_id', shop.id)
      .order('position', { ascending: true })

    if (error) {
      console.error('[GET /api/categories] error:', error)
      return Response.json({ error: 'Impossible de charger les catégories' }, { status: 500 })
    }

    return Response.json({ categories: categories ?? [] })
  } catch (err) {
    console.error('[GET /api/categories] unexpected error:', err)
    return Response.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body: CreateCategoryBody = await request.json()
    const { name, shop_id, position } = body

    if (!name || !shop_id) {
      return Response.json({ error: 'Données manquantes' }, { status: 400 })
    }

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Verify the shop belongs to the authenticated user
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
        .from('categories')
        .select('id', { count: 'exact', head: true })
        .eq('shop_id', shop_id)
      finalPosition = count ?? 0
    }

    const { data: category, error } = await supabase
      .from('categories')
      .insert({
        name: name.trim(),
        shop_id,
        position: finalPosition,
        is_visible: true,
      })
      .select('*')
      .single()

    if (error || !category) {
      console.error('[POST /api/categories] error:', error)
      return Response.json({ error: 'Impossible de créer la catégorie' }, { status: 500 })
    }

    return Response.json({ category }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/categories] unexpected error:', err)
    return Response.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
