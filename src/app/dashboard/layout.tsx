import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Shop } from '@/types'
import { ShopToggle } from '@/components/dashboard/ShopToggle'
import { logout } from '@/app/auth/actions'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: shop } = await supabase
    .from('shops')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  if (!shop) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-8 text-center space-y-4 max-w-sm w-full">
          <div className="w-12 h-12 rounded-2xl bg-[#EF4444]/10 border border-[#EF4444]/20 flex items-center justify-center mx-auto">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-[#EF4444]">
              <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-white text-base font-semibold">Aucun shop associé à ce compte.</p>
          <form action={logout}>
            <button type="submit" className="text-[#71717A] text-sm hover:text-white transition">
              Se déconnecter
            </button>
          </form>
        </div>
      </div>
    )
  }

  const typedShop = shop as Shop

  const navLinks = [
    {
      href: '/dashboard/orders',
      label: 'Commandes',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <path d="M2.5 3A1.5 1.5 0 0 0 1 4.5v4A1.5 1.5 0 0 0 2.5 10h6A1.5 1.5 0 0 0 10 8.5v-4A1.5 1.5 0 0 0 8.5 3h-6ZM2.5 11A1.5 1.5 0 0 0 1 12.5v4A1.5 1.5 0 0 0 2.5 18h6a1.5 1.5 0 0 0 1.5-1.5v-4A1.5 1.5 0 0 0 8.5 11h-6Zm8 1A1.5 1.5 0 0 0 9 13.5v4A1.5 1.5 0 0 0 10.5 19h6a1.5 1.5 0 0 0 1.5-1.5v-4A1.5 1.5 0 0 0 16.5 12h-6ZM11 4.5A1.5 1.5 0 0 1 12.5 3h6A1.5 1.5 0 0 1 20 4.5v4A1.5 1.5 0 0 1 18.5 10h-6A1.5 1.5 0 0 1 11 8.5v-4Z" />
        </svg>
      ),
    },
    {
      href: '/dashboard/menu',
      label: 'Menu',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <path fillRule="evenodd" d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75ZM2 10a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Zm0 5.25a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
        </svg>
      ),
    },
    {
      href: '/dashboard/stats',
      label: 'Stats',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <path d="M15.5 2A1.5 1.5 0 0 0 14 3.5v13a1.5 1.5 0 0 0 3 0v-13A1.5 1.5 0 0 0 15.5 2ZM9.5 6A1.5 1.5 0 0 0 8 7.5v9a1.5 1.5 0 0 0 3 0v-9A1.5 1.5 0 0 0 9.5 6ZM3.5 10A1.5 1.5 0 0 0 2 11.5v5a1.5 1.5 0 0 0 3 0v-5A1.5 1.5 0 0 0 3.5 10Z" />
        </svg>
      ),
    },
    {
      href: '/dashboard/settings',
      label: 'Paramètres',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <path fillRule="evenodd" d="M7.84 1.804A1 1 0 0 1 8.82 1h2.36a1 1 0 0 1 .98.804l.331 1.652a6.993 6.993 0 0 1 1.929 1.115l1.598-.54a1 1 0 0 1 1.186.447l1.18 2.044a1 1 0 0 1-.205 1.251l-1.267 1.113a7.047 7.047 0 0 1 0 2.228l1.267 1.113a1 1 0 0 1 .206 1.25l-1.18 2.045a1 1 0 0 1-1.187.447l-1.598-.54a6.993 6.993 0 0 1-1.929 1.115l-.33 1.652a1 1 0 0 1-.98.804H8.82a1 1 0 0 1-.98-.804l-.331-1.652a6.993 6.993 0 0 1-1.929-1.115l-1.598.54a1 1 0 0 1-1.186-.447l-1.18-2.044a1 1 0 0 1 .205-1.251l1.267-1.114a7.05 7.05 0 0 1 0-2.227L1.821 7.773a1 1 0 0 1-.206-1.25l1.18-2.045a1 1 0 0 1 1.187-.447l1.598.54A6.992 6.992 0 0 1 7.51 3.456l.33-1.652ZM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" />
        </svg>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col">
      {/* Top header */}
      <header className="h-14 border-b border-[#2A2A2A] bg-[#111111] flex items-center justify-between px-4 gap-3 shrink-0 z-10">
        {/* Left: brand */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-[#FF6B35]/10 border border-[#FF6B35]/20 flex items-center justify-center group-hover:bg-[#FF6B35]/20 transition">
              <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 text-[#FF6B35]" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <span className="text-base font-bold text-white tracking-tight">Qwick</span>
          </Link>
          <span className="text-[#2A2A2A] select-none hidden sm:block">/</span>
          <span className="text-[#71717A] font-medium text-sm truncate max-w-[160px] hidden sm:block">
            {typedShop.name}
          </span>
        </div>

        {/* Right: controls */}
        <div className="flex items-center gap-2">
          <ShopToggle shopId={typedShop.id} initialIsOpen={typedShop.is_open} />
          <div className="w-px h-5 bg-[#2A2A2A] mx-1 hidden sm:block" />
          <form action={logout}>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[#71717A] hover:text-white hover:bg-[#1A1A1A] rounded-lg transition"
              title="Se déconnecter"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 0 1 5.25 2h5.5A2.25 2.25 0 0 1 13 4.25v2a.75.75 0 0 1-1.5 0v-2a.75.75 0 0 0-.75-.75h-5.5a.75.75 0 0 0-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 0 0 .75-.75v-2a.75.75 0 0 1 1.5 0v2A2.25 2.25 0 0 1 10.75 18h-5.5A2.25 2.25 0 0 1 3 15.75V4.25Z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M6 10a.75.75 0 0 1 .75-.75h9.546l-1.048-.943a.75.75 0 1 1 1.004-1.114l2.5 2.25a.75.75 0 0 1 0 1.114l-2.5 2.25a.75.75 0 1 1-1.004-1.114l1.048-.943H6.75A.75.75 0 0 1 6 10Z" clipRule="evenodd" />
              </svg>
              <span className="text-xs font-medium hidden sm:block">Déconnexion</span>
            </button>
          </form>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-56 border-r border-[#2A2A2A] bg-[#111111] flex flex-col shrink-0 hidden sm:flex">
          <nav className="flex flex-col gap-1 px-3 py-4 flex-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-[#71717A] hover:text-white hover:bg-[#1A1A1A] transition group"
              >
                <span className="group-hover:text-white transition">{link.icon}</span>
                <span className="font-medium">{link.label}</span>
              </Link>
            ))}
          </nav>

          {/* Sidebar footer */}
          <div className="px-3 py-4 border-t border-[#2A2A2A]">
            <div className="px-3 py-2.5 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A]">
              <p className="text-xs text-[#71717A] font-medium truncate">{typedShop.name}</p>
              <p className="text-xs text-[#71717A]/60 mt-0.5">/{typedShop.slug}</p>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto bg-[#0A0A0A] p-4 sm:p-6">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="sm:hidden border-t border-[#2A2A2A] bg-[#111111] flex items-center justify-around px-2 py-2 shrink-0 safe-area-bottom">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex flex-col items-center gap-1 px-3 py-1.5 text-[#71717A] hover:text-white transition rounded-xl"
          >
            {link.icon}
            <span className="text-xs font-medium">{link.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
