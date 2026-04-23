import { createClient } from '@/lib/supabase/server'

interface UpdateProductBody {
  name?: string
  description?: string | null
  price?: number
  is_available?: boolean
  category_id?: string
  image_url?: string | null
  position?: number
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params
    const body: UpdateProductBody = await request.json()

    const hasUpdate =
      body.name !== undefined ||
      body.description !== undefined ||
      body.price !== undefined ||
      body.is_available !== undefined ||
      body.category_id !== undefined ||
      body.image_url !== undefined ||
      body.position !== undefined

    if (!hasUpdate) {
      return Response.json({ error: 'Aucune donnée à mettre à jour' }, { status: 400 })
    }

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Verify ownership via shop
    const { data: product } = await supabase
      .from('products')
      .select('id, shop_id')
      .eq('id', productId)
      .single()

    if (!product) {
      return Response.json({ error: 'Produit introuvable' }, { status: 404 })
    }

    const { data: shop } = await supabase
      .from('shops')
      .select('id')
      .eq('id', product.shop_id)
      .eq('owner_id', user.id)
      .single()

    if (!shop) {
      return Response.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const updateData: UpdateProductBody = {}
    if (body.name !== undefined) updateData.name = body.name.trim()
    if (body.description !== undefined) updateData.description = body.description?.trim() ?? null
    if (body.price !== undefined) updateData.price = body.price
    if (body.is_available !== undefined) updateData.is_available = body.is_available
    if (body.category_id !== undefined) updateData.category_id = body.category_id
    if (body.image_url !== undefined) updateData.image_url = body.image_url?.trim() || null
    if (body.position !== undefined) updateData.position = body.position

    const { data: updated, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', productId)
      .select('*')
      .single()

    if (error || !updated) {
      console.error('[PATCH /api/products/:id] error:', error)
      return Response.json({ error: 'Impossible de mettre à jour le produit' }, { status: 500 })
    }

    return Response.json({ product: updated })
  } catch (err) {
    console.error('[PATCH /api/products/:id] unexpected error:', err)
    return Response.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { data: product } = await supabase
      .from('products')
      .select('id, shop_id')
      .eq('id', productId)
      .single()

    if (!product) {
      return Response.json({ error: 'Produit introuvable' }, { status: 404 })
    }

    const { data: shop } = await supabase
      .from('shops')
      .select('id')
      .eq('id', product.shop_id)
      .eq('owner_id', user.id)
      .single()

    if (!shop) {
      return Response.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)

    if (error) {
      console.error('[DELETE /api/products/:id] error:', error)
      return Response.json({ error: 'Impossible de supprimer le produit' }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/products/:id] unexpected error:', err)
    return Response.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
