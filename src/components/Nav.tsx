'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, MessagesSquare, Users, CalendarDays, BookOpen, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

const LINKS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/forum', label: 'Q&A', icon: MessagesSquare },
  { href: '/mentors', label: 'Mentors', icon: Users },
  { href: '/events', label: 'Events', icon: CalendarDays },
  { href: '/resources', label: 'Resources', icon: BookOpen },
]

function useActive() {
  const pathname = usePathname()
  return (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href))
}

export function SideNav({ isModerator, pendingRequests, openFlags }: { isModerator: boolean; pendingRequests: number; openFlags: number }) {
  const isActive = useActive()
  const links = isModerator ? [...LINKS, { href: '/moderation', label: 'Moderation', icon: Shield }] : LINKS
  return (
    <nav className="space-y-1">
      {links.map(({ href, label, icon: Icon }) => {
        const badge = href === '/mentors' ? pendingRequests : href === '/moderation' ? openFlags : 0
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
              isActive(href) ? 'bg-navy text-white' : 'text-gray-700 hover:bg-gray-100'
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="flex-1">{label}</span>
            {badge > 0 && <span className="rounded-full bg-maize px-2 text-xs font-bold text-navy">{badge}</span>}
          </Link>
        )
      })}
    </nav>
  )
}

export function BottomNav({ pendingRequests }: { pendingRequests: number }) {
  const isActive = useActive()
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
      {LINKS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn('relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium', isActive(href) ? 'text-navy' : 'text-gray-500')}
        >
          <Icon className="h-5 w-5" />
          {label}
          {href === '/mentors' && pendingRequests > 0 && (
            <span className="absolute top-1 right-1/4 h-2 w-2 rounded-full bg-maize ring-2 ring-white" />
          )}
        </Link>
      ))}
    </nav>
  )
}
