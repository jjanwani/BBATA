import { redirect } from 'next/navigation'
import { MessagesSquare, Users, CalendarDays, BookOpen } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { LoginButton } from './LoginButton'

const FEATURES = [
  { icon: Users, title: 'Mentorship matching', text: 'Get paired with an upperclassman who shares your career interests.' },
  { icon: MessagesSquare, title: 'Q&A forum', text: 'Ask about classes, clubs, and recruiting, anonymously if you want.' },
  { icon: CalendarDays, title: 'Events feed', text: 'Every club event, coffee chat, and deadline in one place.' },
  { icon: BookOpen, title: 'Resources hub', text: 'Recruiting guides and tips from students who have been there.' },
]

export default async function LoginPage() {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) redirect('/')

  return (
    <main className="min-h-screen bg-navy text-white">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center gap-12 px-4 py-12 md:flex-row md:items-center md:gap-16">
        <div className="flex-1">
          <Logo light className="text-2xl" />
          <h1 className="mt-6 text-4xl font-extrabold leading-tight md:text-5xl">
            Recruiting advice shouldn&apos;t depend on which club you got into.
          </h1>
          <p className="mt-4 max-w-lg text-lg text-white/75">
            A Ross-only community for mentorship, peer support, and shared resources. Open to every student.
          </p>
          <div className="mt-8 max-w-sm">
            <LoginButton />
            <p className="mt-3 text-xs text-white/60">Only @umich.edu accounts can sign in.</p>
          </div>
        </div>
        <ul className="grid flex-1 gap-3 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <li key={title} className="rounded-xl bg-white/5 p-5 ring-1 ring-white/10">
              <Icon className="h-6 w-6 text-maize" />
              <p className="mt-3 font-semibold">{title}</p>
              <p className="mt-1 text-sm text-white/70">{text}</p>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
