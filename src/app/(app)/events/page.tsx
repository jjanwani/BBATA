import Link from 'next/link'
import { CalendarDays, Plus } from 'lucide-react'
import { requireUser, isTrusted } from '@/lib/auth'
import { EVENT_TYPES, type EventType } from '@/lib/constants'
import { dayKey, formatDay, isoFromNow } from '@/lib/time'
import type { FeedEvent } from '@/lib/types'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/PageHeader'
import { EventCard } from '@/components/EventCard'
import { EmptyState } from '@/components/EmptyState'

type Search = { type?: string; when?: string; mine?: string }

function href(p: Search) {
  const sp = new URLSearchParams()
  Object.entries(p).forEach(([k, v]) => v && sp.set(k, v))
  const s = sp.toString()
  return s ? `/events?${s}` : '/events'
}

export default async function EventsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams
  const { supabase, profile } = await requireUser()
  const past = params.when === 'past'
  const type = params.type && params.type in EVENT_TYPES ? (params.type as EventType) : undefined

  // Keep an event "upcoming" until a few hours after it starts.
  const cutoff = isoFromNow(-3 * 60 * 60 * 1000)
  let query = supabase.from('event_feed').select('*').limit(100)
  query = past ? query.lt('starts_at', cutoff).order('starts_at', { ascending: false }) : query.gte('starts_at', cutoff).order('starts_at')
  if (type) query = query.eq('event_type', type)
  if (params.mine) query = query.eq('has_rsvped', true)
  const { data: events } = await query.returns<FeedEvent[]>()

  const groups = new Map<string, FeedEvent[]>()
  for (const e of events ?? []) {
    const k = dayKey(e.starts_at)
    groups.set(k, [...(groups.get(k) ?? []), e])
  }

  const chip = (active: boolean) =>
    cn('rounded-lg px-3 py-1.5 text-sm font-medium', active ? 'bg-navy text-white' : 'bg-white text-gray-700 ring-1 ring-gray-200')

  return (
    <div>
      <PageHeader
        title="Events & Opportunities"
        subtitle="Club events, coffee chats, info sessions, and deadlines, all in one place. Times are Michigan time."
        action={
          isTrusted(profile) ? (
            <Link href="/events/new" className="btn-primary">
              <Plus className="h-4 w-4" /> Post an event
            </Link>
          ) : undefined
        }
      />

      <div className="mb-3 flex flex-wrap gap-2">
        <Link href={href({ ...params, when: undefined })} className={chip(!past)}>Upcoming</Link>
        <Link href={href({ ...params, when: 'past' })} className={chip(past)}>Past</Link>
        <Link href={href({ ...params, mine: params.mine ? undefined : '1' })} className={cn(chip(false), params.mine && 'bg-maize text-navy ring-0')}>
          My RSVPs
        </Link>
      </div>
      <div className="mb-6 flex flex-wrap gap-2">
        <Link href={href({ ...params, type: undefined })} className={chip(!type)}>All types</Link>
        {Object.entries(EVENT_TYPES).map(([key, t]) => (
          <Link key={key} href={href({ ...params, type: key })} className={chip(type === key)}>
            {t.label}
          </Link>
        ))}
      </div>

      {groups.size === 0 ? (
        <EmptyState icon={CalendarDays} title={past ? 'No past events' : 'No upcoming events'}>
          {isTrusted(profile) ? 'Post one so everyone hears about it.' : 'Check back soon.'}
        </EmptyState>
      ) : (
        <div className="space-y-8">
          {[...groups.entries()].map(([day, list]) => (
            <section key={day}>
              <h2 className="mb-3 text-sm font-bold tracking-wide text-gray-500 uppercase">{formatDay(list[0].starts_at)}</h2>
              <div className="space-y-3">
                {list.map((e) => (
                  <EventCard key={e.id} event={e} canDelete={e.created_by === profile.id || profile.is_moderator} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
