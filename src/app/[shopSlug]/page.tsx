import { WelcomePage } from '@/components/client/WelcomePage'

export default async function ShopHomePage({
  params,
}: {
  params: Promise<{ shopSlug: string }>
}) {
  const { shopSlug } = await params
  return <WelcomePage shopSlug={shopSlug} />
}
