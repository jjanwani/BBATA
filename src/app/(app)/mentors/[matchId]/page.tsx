import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Link2, Mail } from 'lucide-react'
import { requireUser } from '@/lib/auth'
import { CLASS_YEARS } from '@/lib/constants'
import type { Match, Message, Profile } from '@/lib/types'
import { Avatar } from '@/components/Avatar'
import { ChatThread } from '@/components/ChatThread'
import { endMatch } from '../actions'

export default async function MatchChatPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params
  const { supabase, profile } = await requireUser()

  const { data: match } = await supabase.from('matches').select('*').eq('id', matchId).maybeSingle<Match>()
  if (!match || match.status !== 'accepted') notFound()

  const otherId = match.mentee_id === profile.id ? match.mentor_id : match.mentee_id
  const [{ data: other }, { data: messages }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', otherId).single<Profile>(),
    supabase.from('messages').select('*').eq('match_id', matchId).order('created_at').returns<Message[]>(),
  ])
  if (!other) notFound()

  const role = match.mentor_id === profile.id ? 'Your mentee' : 'Your mentor'

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/mentors" className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-navy">
        <ArrowLeft className="h-4 w-4" /> Back to mentorship
      </Link>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Avatar name={other.full_name} url={other.avatar_url} size={44} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">{role}</p>
          <Link href={`/people/${other.id}`} className="text-lg font-bold text-navy hover:underline">{other.full_name}</Link>
          <p className="text-sm text-gray-500">
            {other.class_year && CLASS_YEARS[other.class_year]}
            {match.shared_interests.length > 0 && ` · Both into ${match.shared_interests.join(', ')}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a href={`mailto:${other.email}`} className="btn-ghost px-3" title="Email"><Mail className="h-4 w-4" /></a>
          {other.linkedin_url && (
            <a href={other.linkedin_url} target="_blank" rel="noreferrer" className="btn-ghost px-3" title="LinkedIn"><Link2 className="h-4 w-4" /></a>
          )}
        </div>
      </div>
      {match.intro_message && (
        <p className="mb-3 rounded-lg bg-maize/20 p-3 text-sm break-words whitespace-pre-wrap text-navy">
          <span className="font-semibold">Intro:</span> {match.intro_message}
        </p>
      )}
      <ChatThread matchId={match.id} meId={profile.id} initial={messages ?? []} otherName={other.full_name.split(' ')[0] || 'them'} />
      <form action={endMatch.bind(null, match.id)} className="mt-4 text-right">
        <button className="text-xs text-gray-500 hover:text-red-600">End mentorship</button>
      </form>
    </div>
  )
}
