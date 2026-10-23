import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Check, MessageCircle, Sparkles, Users, X } from 'lucide-react'
import { requireUser } from '@/lib/auth'
import { CLASS_YEARS, INTERESTS } from '@/lib/constants'
import { rankMentors } from '@/lib/matching'
import type { MentorLoad, Match, Profile } from '@/lib/types'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/PageHeader'
import { Avatar } from '@/components/Avatar'
import { EmptyState } from '@/components/EmptyState'
import { RequestMentorForm } from '@/components/RequestMentorForm'
import { endMatch, respondToRequest } from './actions'

function PersonSummary({ person, shared }: { person: Profile; shared?: string[] }) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <Avatar name={person.full_name} url={person.avatar_url} size={44} />
      <div className="min-w-0">
        <Link href={`/people/${person.id}`} className="font-semibold text-gray-900 hover:underline">
          {person.full_name}
        </Link>
        <p className="text-sm text-gray-500">
          {person.class_year ? CLASS_YEARS[person.class_year] : ''}
          {person.major && ` · ${person.major}`}
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {person.interests.map((i) => (
            <span
              key={i}
              className={cn(
                'rounded-full px-2 py-0.5 text-xs capitalize',
                shared?.includes(i) ? 'bg-maize/40 font-semibold text-navy' : 'bg-gray-100 text-gray-600'
              )}
            >
              {i}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default async function MentorsPage({ searchParams }: { searchParams: Promise<{ interest?: string }> }) {
  const { interest } = await searchParams
  const { supabase, profile } = await requireUser()
  const wantsMentor = profile.mentor_status !== 'mentor'
  const isMentor = profile.mentor_status !== 'mentee'

  const [{ data: matches }, { data: mentors }, { data: load }] = await Promise.all([
    supabase.from('matches').select('*').order('created_at', { ascending: false }).returns<Match[]>(),
    wantsMentor
      ? supabase.from('profiles').select('*').in('mentor_status', ['mentor', 'both']).eq('onboarded', true).returns<Profile[]>()
      : Promise.resolve({ data: [] as Profile[] }),
    supabase.rpc('mentor_load'),
  ])

  const all = matches ?? []
  const otherIds = [...new Set(all.map((m) => (m.mentee_id === profile.id ? m.mentor_id : m.mentee_id)))]
  const { data: others } = otherIds.length
    ? await supabase.from('profiles').select('*').in('id', otherIds).returns<Profile[]>()
    : { data: [] as Profile[] }
  const people = new Map((others ?? []).map((p) => [p.id, p]))

  const asMentee = all.filter((m) => m.mentee_id === profile.id)
  const asMentor = all.filter((m) => m.mentor_id === profile.id)
  const incoming = asMentor.filter((m) => m.status === 'pending')
  const connections = all.filter((m) => m.status === 'accepted')
  const sent = asMentee.filter((m) => m.status !== 'accepted')

  const loadMap = new Map(((load ?? []) as MentorLoad[]).map((l) => [l.mentor_id, l.active_mentees] as const))
  let suggestions = rankMentors(profile, mentors ?? [], loadMap, new Set(asMentee.map((m) => m.mentor_id)))
  if (interest) suggestions = suggestions.filter((s) => s.mentor.interests.includes(interest))

  return (
    <div className="space-y-10">
      <PageHeader
        title="Mentorship"
        subtitle="Club-independent mentorship: get matched with upperclassmen who share your interests."
        action={<Link href="/profile" className="btn-ghost">Edit interests</Link>}
      />

      {incoming.length > 0 && (
        <section>
          <h2 className="mb-3 font-semibold text-gray-800">Mentorship requests for you</h2>
          <div className="space-y-3">
            {incoming.map((m) => {
              const mentee = people.get(m.mentee_id)
              if (!mentee) return null
              return (
                <div key={m.id} className="card space-y-3 p-4">
                  <PersonSummary person={mentee} shared={m.shared_interests} />
                  {m.intro_message && (
                    <p className="rounded-lg bg-gray-50 p-3 text-sm break-words whitespace-pre-wrap text-gray-700">&ldquo;{m.intro_message}&rdquo;</p>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs text-gray-500">{formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}</span>
                    <div className="flex gap-2">
                      <form action={respondToRequest.bind(null, m.id, false)}>
                        <button className="btn-ghost"><X className="h-4 w-4" /> Decline</button>
                      </form>
                      <form action={respondToRequest.bind(null, m.id, true)}>
                        <button className="btn-primary"><Check className="h-4 w-4" /> Accept</button>
                      </form>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 font-semibold text-gray-800">Your connections</h2>
        {connections.length === 0 ? (
          <EmptyState icon={Users} title="No connections yet">
            {wantsMentor ? 'Request a mentor below. Once they accept, you can message each other here.' : 'When a mentee requests you and you accept, they show up here.'}
          </EmptyState>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {connections.map((m) => {
              const other = people.get(m.mentee_id === profile.id ? m.mentor_id : m.mentee_id)
              if (!other) return null
              return (
                <div key={m.id} className="card flex flex-col gap-3 p-4">
                  <span className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                    {m.mentor_id === profile.id ? 'Your mentee' : 'Your mentor'}
                  </span>
                  <PersonSummary person={other} shared={m.shared_interests} />
                  <Link href={`/mentors/${m.id}`} className="btn-maize mt-auto">
                    <MessageCircle className="h-4 w-4" /> Message
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {wantsMentor && (
        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 font-semibold text-gray-800">
              <Sparkles className="h-4 w-4 text-maize" /> Suggested mentors
            </h2>
          </div>
          <div className="mb-4 flex flex-wrap gap-1.5">
            <Link href="/mentors" className={cn('rounded-full px-3 py-1 text-xs font-medium', !interest ? 'bg-navy text-white' : 'bg-white ring-1 ring-gray-200')}>
              Best matches
            </Link>
            {INTERESTS.map((i) => (
              <Link
                key={i}
                href={`/mentors?interest=${encodeURIComponent(i)}`}
                className={cn('rounded-full px-3 py-1 text-xs font-medium capitalize', interest === i ? 'bg-navy text-white' : 'bg-white ring-1 ring-gray-200')}
              >
                {i}
              </Link>
            ))}
          </div>
          {suggestions.length === 0 ? (
            <EmptyState icon={Sparkles} title="No matches yet">
              No mentors share {interest ? `"${interest}"` : 'your interests'} right now. Try adding more interests to your profile, or check back as more upperclassmen join.
            </EmptyState>
          ) : (
            <div className="space-y-3">
              {suggestions.slice(0, 12).map(({ mentor, shared, activeMentees }, idx) => (
                <div key={mentor.id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1 space-y-2">
                    {idx === 0 && !interest && (
                      <span className="inline-block rounded-full bg-maize px-2 py-0.5 text-[11px] font-bold text-navy">Top match</span>
                    )}
                    <PersonSummary person={mentor} shared={shared} />
                    {mentor.bio && <p className="line-clamp-2 text-sm break-words text-gray-600">{mentor.bio}</p>}
                    <p className="text-xs text-gray-500">
                      {shared.length > 0 ? `${shared.length} shared interest${shared.length > 1 ? 's' : ''}` : 'Similar goals'}
                      {` · ${activeMentees} current mentee${activeMentees === 1 ? '' : 's'}`}
                    </p>
                  </div>
                  <div className="sm:w-72 sm:shrink-0 sm:text-right">
                    <RequestMentorForm mentorId={mentor.id} mentorFirstName={mentor.full_name.split(' ')[0] || 'them'} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {sent.length > 0 && (
        <section>
          <h2 className="mb-3 font-semibold text-gray-800">Requests you&apos;ve sent</h2>
          <div className="card divide-y divide-gray-100">
            {sent.map((m) => {
              const mentor = people.get(m.mentor_id)
              return (
                <div key={m.id} className="flex flex-wrap items-center gap-3 p-4">
                  <Avatar name={mentor?.full_name} url={mentor?.avatar_url} size={32} />
                  <span className="min-w-0 flex-1 truncate font-medium">{mentor?.full_name}</span>
                  <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', m.status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-600')}>
                    {m.status === 'pending' ? 'Waiting for a reply' : 'Not available right now'}
                  </span>
                  <form action={endMatch.bind(null, m.id)}>
                    <button className="text-xs text-gray-500 hover:text-red-600">{m.status === 'pending' ? 'Withdraw' : 'Dismiss'}</button>
                  </form>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {isMentor && asMentor.length === 0 && (
        <p className="text-sm text-gray-500">
          You&apos;re listed as a mentor. Underclassmen who share your interests will see you in their suggestions.
        </p>
      )}
    </div>
  )
}
