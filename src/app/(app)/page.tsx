import Link from 'next/link'
import { ArrowRight, BookOpen, CalendarDays, ExternalLink, Heart, MessagesSquare, Plus, Sparkles } from 'lucide-react'
import { requireUser } from '@/lib/auth'
import { CLASS_YEARS, RESOURCE_CATEGORIES } from '@/lib/constants'
import { rankMentors } from '@/lib/matching'
import { isoFromNow } from '@/lib/time'
import type { MentorLoad, FeedEvent, FeedPost, FeedResource, Match, Profile } from '@/lib/types'
import { Avatar } from '@/components/Avatar'
import { PostCard } from '@/components/PostCard'
import { EventCard } from '@/components/EventCard'

function SectionHeader({ icon: Icon, title, href, cta }: { icon: typeof Sparkles; title: string; href: string; cta: string }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="flex items-center gap-2 font-semibold text-gray-800">
        <Icon className="h-4 w-4 text-navy" /> {title}
      </h2>
      <Link href={href} className="flex items-center gap-1 text-sm font-medium text-navy hover:underline">
        {cta} <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  )
}

export default async function HomePage() {
  const { supabase, profile } = await requireUser()
  const wantsMentor = profile.mentor_status !== 'mentor'
  const weekAgo = isoFromNow(-7 * 24 * 60 * 60 * 1000)

  const [{ data: posts }, { data: events }, { data: resources }, { data: matches }, { data: mentors }, { data: load }] = await Promise.all([
    supabase
      .from('post_feed')
      .select('*')
      .gte('created_at', weekAgo)
      .order('upvotes', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(5)
      .returns<FeedPost[]>(),
    supabase
      .from('event_feed')
      .select('*')
      .gte('starts_at', isoFromNow(0))
      .order('starts_at')
      .limit(4)
      .returns<FeedEvent[]>(),
    supabase.from('resource_feed').select('*').eq('is_approved', true).order('upvotes', { ascending: false }).limit(4).returns<FeedResource[]>(),
    supabase.from('matches').select('*').returns<Match[]>(),
    wantsMentor
      ? supabase.from('profiles').select('*').in('mentor_status', ['mentor', 'both']).eq('onboarded', true).returns<Profile[]>()
      : Promise.resolve({ data: [] as Profile[] }),
    supabase.rpc('mentor_load'),
  ])

  const myMentorIds = new Set((matches ?? []).filter((m) => m.mentee_id === profile.id).map((m) => m.mentor_id))
  const hasMentor = (matches ?? []).some((m) => m.mentee_id === profile.id && m.status === 'accepted')
  const suggestions = wantsMentor && !hasMentor
    ? rankMentors(profile, mentors ?? [], new Map(((load ?? []) as MentorLoad[]).map((l) => [l.mentor_id, l.active_mentees] as const)), myMentorIds).slice(0, 3)
    : []
  const incoming = (matches ?? []).filter((m) => m.mentor_id === profile.id && m.status === 'pending').length
  const firstName = profile.full_name.split(' ')[0] || 'there'

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-2xl bg-navy p-6 text-white sm:p-8">
        <p className="text-sm font-medium text-maize">Welcome back</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Hey {firstName} 👋</h1>
        <p className="mt-2 max-w-xl text-white/75">
          Ask a question, find a mentor, or see what&apos;s happening at Ross this week.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/forum/new" className="btn-maize"><Plus className="h-4 w-4" /> Ask a question</Link>
          <Link href="/mentors" className="btn bg-white/10 text-white hover:bg-white/20">
            {incoming > 0 ? `${incoming} mentorship request${incoming > 1 ? 's' : ''}` : 'Find a mentor'}
          </Link>
        </div>
      </section>

      {suggestions.length > 0 && (
        <section>
          <SectionHeader icon={Sparkles} title="Mentors picked for you" href="/mentors" cta="See all" />
          <div className="grid gap-3 sm:grid-cols-3">
            {suggestions.map(({ mentor, shared }) => (
              <Link key={mentor.id} href="/mentors" className="card flex flex-col gap-2 p-4 transition hover:border-navy/30 hover:shadow">
                <div className="flex items-center gap-3">
                  <Avatar name={mentor.full_name} url={mentor.avatar_url} size={40} />
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{mentor.full_name}</p>
                    <p className="text-xs text-gray-500">{mentor.class_year && CLASS_YEARS[mentor.class_year]}</p>
                  </div>
                </div>
                {shared.length > 0 && (
                  <p className="text-xs text-gray-600">
                    You both like <span className="font-semibold capitalize text-navy">{shared.slice(0, 3).join(', ')}</span>
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-8 lg:grid-cols-5">
        <section className="lg:col-span-3">
          <SectionHeader icon={MessagesSquare} title="Trending this week" href="/forum" cta="All questions" />
          {posts && posts.length > 0 ? (
            <div className="space-y-3">
              {posts.map((p) => <PostCard key={p.id} post={p} />)}
            </div>
          ) : (
            <div className="card p-6 text-center text-sm text-gray-500">
              No questions this week yet. <Link href="/forum/new" className="font-medium text-navy underline">Start the conversation</Link>.
            </div>
          )}
        </section>

        <div className="space-y-8 lg:col-span-2">
          <section>
            <SectionHeader icon={CalendarDays} title="Coming up" href="/events" cta="All events" />
            {events && events.length > 0 ? (
              <div className="space-y-3">
                {events.map((e) => <EventCard key={e.id} event={e} compact />)}
              </div>
            ) : (
              <div className="card p-6 text-center text-sm text-gray-500">No upcoming events.</div>
            )}
          </section>

          <section>
            <SectionHeader icon={BookOpen} title="Popular resources" href="/resources" cta="Browse" />
            <div className="card divide-y divide-gray-100">
              {resources && resources.length > 0 ? (
                resources.map((r) => (
                  <a key={r.id} href={r.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 hover:bg-gray-50">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{r.title}</p>
                      <p className="text-xs text-gray-500">{RESOURCE_CATEGORIES[r.category]}</p>
                    </div>
                    <span className="flex items-center gap-1 text-xs text-gray-500"><Heart className="h-3.5 w-3.5" /> {r.upvotes}</span>
                    <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
                  </a>
                ))
              ) : (
                <p className="p-6 text-center text-sm text-gray-500">No resources yet.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
