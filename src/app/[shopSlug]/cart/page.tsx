import { CartView } from '@/components/client/CartView'

export default async function CartPage({
  params,
}: {
  params: Promise<{ shopSlug: string }>
}) {
  const { shopSlug } = await params
  return <CartView shopSlug={shopSlug} />
}
