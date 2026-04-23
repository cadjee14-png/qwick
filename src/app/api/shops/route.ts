import { createClient } from '@/lib/supabase/server'

interface UpdateShopBody {
  name?: string
  welcome_message?: string | null
  brand_color?: string | null
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

    const { data: shop, error } = await supabase
      .from('shops')
      .select('*')
      .eq('owner_id', user.id)
      .single()

    if (error || !shop) {
      return Response.json({ error: 'Shop introuvable' }, { status: 404 })
    }

    return Response.json({ shop })
  } catch (err) {
    console.error('[GET /api/shops] unexpected error:', err)
    return Response.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body: UpdateShopBody = await request.json()

    const hasUpdate =
      body.name !== undefined ||
      body.welcome_message !== undefined ||
      body.brand_color !== undefined

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

    const updateData: UpdateShopBody = {}
    if (body.name !== undefined) updateData.name = body.name.trim()
    if (body.welcome_message !== undefined) updateData.welcome_message = body.welcome_message?.trim() ?? null
    if (body.brand_color !== undefined) updateData.brand_color = body.brand_color

    const { data: shop, error } = await supabase
      .from('shops')
      .update(updateData)
      .eq('owner_id', user.id)
      .select('*')
      .single()

    if (error || !shop) {
      console.error('[PATCH /api/shops] error:', error)
      return Response.json({ error: 'Impossible de mettre à jour le shop' }, { status: 500 })
    }

    return Response.json({ shop })
  } catch (err) {
    console.error('[PATCH /api/shops] unexpected error:', err)
    return Response.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
