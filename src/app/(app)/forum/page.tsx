import Link from 'next/link'
import { MessagesSquare, Plus, Search } from 'lucide-react'
import { requireUser } from '@/lib/auth'
import { FORUM_TAGS } from '@/lib/constants'
import type { FeedPost } from '@/lib/types'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/PageHeader'
import { PostCard } from '@/components/PostCard'
import { Tag } from '@/components/Tag'
import { EmptyState } from '@/components/EmptyState'

type Search = { sort?: string; tag?: string; q?: string; filter?: string }

function href(params: Search) {
  const sp = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => v && sp.set(k, v))
  const s = sp.toString()
  return s ? `/forum?${s}` : '/forum'
}

export default async function ForumPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams
  const sort = params.sort === 'new' ? 'new' : 'top'
  const { supabase } = await requireUser()

  let query = supabase.from('post_feed').select('*').limit(50)
  if (params.tag) query = query.contains('tags', [params.tag])
  if (params.q) {
    const q = params.q.replace(/[%,()"\\]/g, ' ').trim()
    if (q) query = query.or(`title.ilike."%${q}%",body.ilike."%${q}%"`)
  }
  if (params.filter === 'unanswered') query = query.eq('answer_count', 0)
  if (params.filter === 'mine') query = query.eq('is_mine', true)
  query = sort === 'new'
    ? query.order('created_at', { ascending: false })
    : query.order('upvotes', { ascending: false }).order('created_at', { ascending: false })

  const { data: posts } = await query.returns<FeedPost[]>()

  return (
    <div>
      <PageHeader
        title="Q&A Forum"
        subtitle="Ask about classes, clubs, recruiting, or anything else. No question is a dumb question."
        action={
          <Link href="/forum/new" className="btn-primary">
            <Plus className="h-4 w-4" /> Ask a question
          </Link>
        }
      />

      <form className="mb-4 flex gap-2" action="/forum">
        {params.tag && <input type="hidden" name="tag" value={params.tag} />}
        <input type="hidden" name="sort" value={sort} />
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input name="q" defaultValue={params.q} placeholder="Search questions…" className="input pl-9" />
        </div>
        <button className="btn-ghost">Search</button>
      </form>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(['top', 'new'] as const).map((s) => (
          <Link
            key={s}
            href={href({ ...params, sort: s })}
            className={cn('rounded-lg px-3 py-1.5 text-sm font-medium', sort === s ? 'bg-navy text-white' : 'bg-white text-gray-700 ring-1 ring-gray-200')}
          >
            {s === 'top' ? 'Top' : 'New'}
          </Link>
        ))}
        {[
          { key: 'unanswered', label: 'Unanswered' },
          { key: 'mine', label: 'My questions' },
        ].map((f) => (
          <Link
            key={f.key}
            href={href({ ...params, filter: params.filter === f.key ? undefined : f.key })}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-medium',
              params.filter === f.key ? 'bg-maize text-navy' : 'bg-white text-gray-700 ring-1 ring-gray-200'
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="mb-6 flex flex-wrap gap-1.5">
        {FORUM_TAGS.map((t) => (
          <Tag key={t} tag={t} active={params.tag === t} href={href({ ...params, tag: params.tag === t ? undefined : t })} />
        ))}
        {params.tag && !FORUM_TAGS.includes(params.tag as (typeof FORUM_TAGS)[number]) && (
          <Tag tag={params.tag} active href={href({ ...params, tag: undefined })} />
        )}
      </div>

      {posts && posts.length > 0 ? (
        <div className="space-y-3">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      ) : (
        <EmptyState icon={MessagesSquare} title="No questions here yet">
          <Link href="/forum/new" className="font-medium text-navy underline">Be the first to ask</Link>
        </EmptyState>
      )}
    </div>
  )
}
