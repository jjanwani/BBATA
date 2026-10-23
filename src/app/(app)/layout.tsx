import Link from 'next/link'
import { redirect } from 'next/navigation'
import { LogOut, Shield } from 'lucide-react'
import { requireUser } from '@/lib/auth'
import { Logo } from '@/components/Logo'
import { Avatar } from '@/components/Avatar'
import { SideNav, BottomNav } from '@/components/Nav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { supabase, profile } = await requireUser()
  if (!profile.onboarded) redirect('/onboarding')

  const [{ count: pendingRequests }, { count: openFlags }] = await Promise.all([
    supabase.from('matches').select('id', { count: 'exact', head: true }).eq('mentor_id', profile.id).eq('status', 'pending'),
    profile.is_moderator
      ? supabase.from('flags').select('id', { count: 'exact', head: true }).eq('status', 'open')
      : Promise.resolve({ count: 0 }),
  ])

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
          <Link href="/" aria-label="Ross Reddit home">
            <Logo />
          </Link>
          <div className="flex items-center gap-1">
            {profile.is_moderator && (
              <Link href="/moderation" className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden" aria-label="Moderation">
                <Shield className="h-5 w-5" />
              </Link>
            )}
            <Link href="/profile" className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-gray-100">
              <Avatar name={profile.full_name} url={profile.avatar_url} size={30} />
              <span className="hidden max-w-40 truncate text-sm font-medium sm:inline">{profile.full_name}</span>
            </Link>
            <form action="/auth/signout" method="post">
              <button className="rounded-lg p-2 text-gray-500 hover:bg-gray-100" aria-label="Sign out" title="Sign out">
                <LogOut className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-8 px-4 py-6 pb-24 md:pb-10">
        <aside className="sticky top-20 hidden h-fit w-52 shrink-0 md:block">
          <SideNav isModerator={profile.is_moderator} pendingRequests={pendingRequests ?? 0} openFlags={openFlags ?? 0} />
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>

      <BottomNav pendingRequests={pendingRequests ?? 0} />
    </div>
  )
}
