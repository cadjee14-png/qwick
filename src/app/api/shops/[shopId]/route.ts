import { createClient } from '@/lib/supabase/server'

interface UpdateShopBody {
  is_open?: boolean
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const { shopId } = await params
    const body: UpdateShopBody = await request.json()

    if (body.is_open === undefined) {
      return Response.json({ error: 'Aucune donnée à mettre à jour' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return Response.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('shops')
      .update({ is_open: body.is_open })
      .eq('id', shopId)
      .eq('owner_id', user.id)
      .select('id, is_open')
      .single()

    if (error) {
      console.error('[PATCH /api/shops/:id] error:', error)
      return Response.json({ error: 'Impossible de mettre à jour le shop' }, { status: 500 })
    }

    return Response.json(data)
  } catch (err) {
    console.error('[PATCH /api/shops/:id] unexpected error:', err)
    return Response.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
