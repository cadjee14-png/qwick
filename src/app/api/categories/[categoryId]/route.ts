import { createClient } from '@/lib/supabase/server'

interface UpdateCategoryBody {
  name?: string
  position?: number
  is_visible?: boolean
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const { categoryId } = await params
    const body: UpdateCategoryBody = await request.json()

    if (!body.name && body.position === undefined && body.is_visible === undefined) {
      return Response.json({ error: 'Aucune donnée à mettre à jour' }, { status: 400 })
    }

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Verify ownership via shop join
    const { data: category } = await supabase
      .from('categories')
      .select('id, shop_id')
      .eq('id', categoryId)
      .single()

    if (!category) {
      return Response.json({ error: 'Catégorie introuvable' }, { status: 404 })
    }

    const { data: shop } = await supabase
      .from('shops')
      .select('id')
      .eq('id', category.shop_id)
      .eq('owner_id', user.id)
      .single()

    if (!shop) {
      return Response.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const updateData: UpdateCategoryBody = {}
    if (body.name !== undefined) updateData.name = body.name.trim()
    if (body.position !== undefined) updateData.position = body.position
    if (body.is_visible !== undefined) updateData.is_visible = body.is_visible

    const { data: updated, error } = await supabase
      .from('categories')
      .update(updateData)
      .eq('id', categoryId)
      .select('*')
      .single()

    if (error || !updated) {
      console.error('[PATCH /api/categories/:id] error:', error)
      return Response.json({ error: 'Impossible de mettre à jour la catégorie' }, { status: 500 })
    }

    return Response.json({ category: updated })
  } catch (err) {
    console.error('[PATCH /api/categories/:id] unexpected error:', err)
    return Response.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const { categoryId } = await params

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { data: category } = await supabase
      .from('categories')
      .select('id, shop_id')
      .eq('id', categoryId)
      .single()

    if (!category) {
      return Response.json({ error: 'Catégorie introuvable' }, { status: 404 })
    }

    const { data: shop } = await supabase
      .from('shops')
      .select('id')
      .eq('id', category.shop_id)
      .eq('owner_id', user.id)
      .single()

    if (!shop) {
      return Response.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId)

    if (error) {
      console.error('[DELETE /api/categories/:id] error:', error)
      return Response.json({ error: 'Impossible de supprimer la catégorie' }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/categories/:id] unexpected error:', err)
    return Response.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
