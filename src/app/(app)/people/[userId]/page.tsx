import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Link2, Mail } from 'lucide-react'
import { requireUser } from '@/lib/auth'
import { CLASS_YEARS, MENTOR_STATUS } from '@/lib/constants'
import type { FeedPost, Profile } from '@/lib/types'
import { Avatar } from '@/components/Avatar'
import { MentorBadge } from '@/components/MentorBadge'
import { PostCard } from '@/components/PostCard'

export default async function PersonPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const { supabase, profile: me } = await requireUser()

  const [{ data: person }, { data: posts }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle<Profile>(),
    // post_feed blanks author_id on anonymous posts, so they never show up here.
    supabase.from('post_feed').select('*').eq('author_id', userId).eq('is_anonymous', false).order('created_at', { ascending: false }).limit(10).returns<FeedPost[]>(),
  ])
  if (!person) notFound()

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="card p-6">
        <div className="flex flex-wrap items-start gap-4">
          <Avatar name={person.full_name} url={person.avatar_url} size={72} />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold break-words text-navy">{person.full_name}</h1>
            <p className="text-gray-600">
              {person.class_year && CLASS_YEARS[person.class_year]}
              {person.major && ` · ${person.major}`}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <MentorBadge status={person.mentor_status} moderator={person.is_moderator} />
              <span className="text-xs text-gray-500">{MENTOR_STATUS[person.mentor_status]}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <a href={`mailto:${person.email}`} className="btn-ghost px-3" title="Email"><Mail className="h-4 w-4" /></a>
            {person.linkedin_url && (
              <a href={person.linkedin_url} target="_blank" rel="noreferrer" className="btn-ghost px-3" title="LinkedIn"><Link2 className="h-4 w-4" /></a>
            )}
          </div>
        </div>
        {person.interests.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-1.5">
            {person.interests.map((i) => (
              <span key={i} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-sm capitalize text-gray-700">{i}</span>
            ))}
          </div>
        )}
        {person.goals && (
          <div className="mt-5">
            <h2 className="text-sm font-semibold text-gray-500">Goals</h2>
            <p className="mt-1 break-words whitespace-pre-wrap text-gray-800">{person.goals}</p>
          </div>
        )}
        {person.bio && (
          <div className="mt-4">
            <h2 className="text-sm font-semibold text-gray-500">About</h2>
            <p className="mt-1 break-words whitespace-pre-wrap text-gray-800">{person.bio}</p>
          </div>
        )}
        {person.id === me.id && (
          <Link href="/profile" className="btn-ghost mt-5">Edit profile</Link>
        )}
      </div>

      {posts && posts.length > 0 && (
        <section>
          <h2 className="mb-3 font-semibold text-gray-800">Questions</h2>
          <div className="space-y-3">
            {posts.map((p) => <PostCard key={p.id} post={p} />)}
          </div>
        </section>
      )}
    </div>
  )
}
