import Link from 'next/link'
import { BookOpen, Clock, ExternalLink, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { requireUser, isTrusted } from '@/lib/auth'
import { RESOURCE_CATEGORIES, type ResourceCategory } from '@/lib/constants'
import type { FeedResource } from '@/lib/types'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/EmptyState'
import { VoteButton } from '@/components/VoteButton'
import { FlagButton } from '@/components/FlagButton'
import { Tag } from '@/components/Tag'
import { deleteResource, toggleResourceVote } from './actions'

type Search = { category?: string; q?: string; sort?: string; saved?: string; submitted?: string }

function href(p: Search) {
  const sp = new URLSearchParams()
  Object.entries(p).forEach(([k, v]) => v && k !== 'submitted' && sp.set(k, v))
  const s = sp.toString()
  return s ? `/resources?${s}` : '/resources'
}

export default async function ResourcesPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams
  const { supabase, profile } = await requireUser()
  const category = params.category && params.category in RESOURCE_CATEGORIES ? (params.category as ResourceCategory) : undefined
  const sort = params.sort === 'new' ? 'new' : 'top'

  let query = supabase.from('resource_feed').select('*').limit(100)
  if (category) query = query.eq('category', category)
  if (params.saved) query = query.eq('has_voted', true)
  if (params.q) {
    const q = params.q.replace(/[%,()"\\]/g, ' ').trim()
    if (q) query = query.or(`title.ilike."%${q}%",description.ilike."%${q}%"`)
  }
  query = sort === 'new'
    ? query.order('created_at', { ascending: false })
    : query.order('upvotes', { ascending: false }).order('created_at', { ascending: false })
  const { data: resources } = await query.returns<FeedResource[]>()

  const chip = (active: boolean) =>
    cn('rounded-lg px-3 py-1.5 text-sm font-medium', active ? 'bg-navy text-white' : 'bg-white text-gray-700 ring-1 ring-gray-200')
  const trusted = isTrusted(profile)

  return (
    <div>
      <PageHeader
        title="Resources Hub"
        subtitle="Recruiting guides, syllabi, and tips from students who've been through it."
        action={
          <Link href="/resources/new" className="btn-primary">
            <Plus className="h-4 w-4" /> Share a resource
          </Link>
        }
      />

      {params.submitted && (
        <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Thanks! A moderator will review your resource before it&apos;s visible to everyone.
        </p>
      )}

      <form className="mb-4 flex gap-2" action="/resources">
        {category && <input type="hidden" name="category" value={category} />}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input name="q" defaultValue={params.q} placeholder="Search resources…" className="input pl-9" />
        </div>
        <button className="btn-ghost">Search</button>
      </form>

      <div className="mb-6 flex flex-wrap gap-2">
        <Link href={href({ ...params, category: undefined })} className={chip(!category)}>All</Link>
        {Object.entries(RESOURCE_CATEGORIES).map(([k, label]) => (
          <Link key={k} href={href({ ...params, category: k })} className={chip(category === k)}>{label}</Link>
        ))}
        <span className="mx-1 hidden w-px bg-gray-200 sm:block" />
        <Link href={href({ ...params, sort: sort === 'top' ? 'new' : undefined })} className={chip(false)}>
          Sort: {sort === 'top' ? 'Most favorited' : 'Newest'}
        </Link>
        <Link href={href({ ...params, saved: params.saved ? undefined : '1' })} className={cn(chip(false), params.saved && 'bg-maize text-navy ring-0')}>
          My favorites
        </Link>
      </div>

      {resources && resources.length > 0 ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {resources.map((r) => {
            const canEdit = r.uploader_id === profile.id || trusted
            const canDelete = r.uploader_id === profile.id || profile.is_moderator
            return (
              <article key={r.id} className="card flex flex-col p-4">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-semibold tracking-wide text-gray-500 uppercase">{RESOURCE_CATEGORIES[r.category]}</span>
                    <a href={r.url} target="_blank" rel="noreferrer" className="group mt-0.5 flex items-start gap-1">
                      <h3 className="font-semibold break-words text-gray-900 group-hover:text-navy group-hover:underline">{r.title}</h3>
                      <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0 text-gray-400" />
                    </a>
                  </div>
                  <VoteButton variant="favorite" layout="horizontal" count={r.upvotes} voted={r.has_voted} onToggle={toggleResourceVote.bind(null, r.id)} />
                </div>
                {r.description && <p className="mt-2 line-clamp-3 text-sm break-words text-gray-600">{r.description}</p>}
                {r.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {r.tags.map((t) => <Tag key={t} tag={t} />)}
                  </div>
                )}
                <div className="mt-auto flex flex-wrap items-center gap-3 pt-3 text-xs text-gray-500">
                  <span className="min-w-0 truncate">Shared by {r.uploader_name ?? 'Ross Reddit'}</span>
                  {!r.is_approved && (
                    <span className="flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 font-medium text-amber-700">
                      <Clock className="h-3 w-3" /> Awaiting review
                    </span>
                  )}
                  <span className="ml-auto flex items-center gap-3">
                    {canEdit && (
                      <Link href={`/resources/${r.id}/edit`} className="flex items-center gap-1 hover:text-navy">
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Link>
                    )}
                    {canDelete && (
                      <form action={deleteResource.bind(null, r.id)}>
                        <button className="flex items-center gap-1 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                      </form>
                    )}
                    {r.uploader_id !== profile.id && <FlagButton type="resource" id={r.id} />}
                  </span>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <EmptyState icon={BookOpen} title="No resources found">
          <Link href="/resources/new" className="font-medium text-navy underline">Share the first one</Link>
        </EmptyState>
      )}
    </div>
  )
}
