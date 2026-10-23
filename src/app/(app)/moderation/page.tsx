import Link from 'next/link'
import { notFound } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { Check, EyeOff, Flag, RotateCcw, ShieldCheck, Trash2 } from 'lucide-react'
import { requireUser } from '@/lib/auth'
import { RESOURCE_CATEGORIES, type ResourceCategory } from '@/lib/constants'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/EmptyState'
import { approveResource, dismissFlags, hideContent, rejectResource, restoreContent } from './actions'

type FlagRow = { id: string; target_type: 'post' | 'answer' | 'resource'; target_id: string; reason: string; created_at: string }
type Content = { title: string; body: string; href: string; author: string; anonymous: boolean; hidden: boolean }

export default async function ModerationPage() {
  const { supabase, profile } = await requireUser()
  if (!profile.is_moderator) notFound()

  const [{ data: flags }, { data: pending }, { data: hiddenPosts }, { data: hiddenAnswers }] = await Promise.all([
    supabase.from('flags').select('*').eq('status', 'open').order('created_at', { ascending: false }).returns<FlagRow[]>(),
    supabase
      .from('resources')
      .select('id, title, description, url, category, created_at, uploader:profiles!resources_uploader_id_fkey(full_name)')
      .eq('is_approved', false)
      .order('created_at'),
    supabase.from('posts').select('id, title').eq('is_hidden', true).order('created_at', { ascending: false }).limit(20),
    supabase.from('answers').select('id, post_id, body').eq('is_hidden', true).order('created_at', { ascending: false }).limit(20),
  ])

  // Group flags by the thing being reported.
  const grouped = new Map<string, { type: FlagRow['target_type']; id: string; reasons: string[]; last: string }>()
  for (const f of flags ?? []) {
    const key = `${f.target_type}:${f.target_id}`
    const g = grouped.get(key) ?? { type: f.target_type, id: f.target_id, reasons: [], last: f.created_at }
    g.reasons.push(f.reason)
    grouped.set(key, g)
  }
  const ids = (t: string) => [...grouped.values()].filter((g) => g.type === t).map((g) => g.id)
  const none = ['00000000-0000-0000-0000-000000000000']

  const [{ data: posts }, { data: answers }, { data: resources }] = await Promise.all([
    supabase.from('posts').select('id, title, body, is_anonymous, is_hidden, author:profiles!posts_author_id_fkey(full_name)').in('id', ids('post').length ? ids('post') : none),
    supabase.from('answers').select('id, post_id, body, is_anonymous, is_hidden, author:profiles!answers_author_id_fkey(full_name)').in('id', ids('answer').length ? ids('answer') : none),
    supabase.from('resources').select('id, title, description, is_approved, uploader:profiles!resources_uploader_id_fkey(full_name)').in('id', ids('resource').length ? ids('resource') : none),
  ])

  const name = (a: unknown) => (a as { full_name?: string } | null)?.full_name ?? 'Unknown'
  const content = new Map<string, Content>()
  posts?.forEach((p) => content.set(`post:${p.id}`, { title: p.title, body: p.body, href: `/forum/${p.id}`, author: name(p.author), anonymous: p.is_anonymous, hidden: p.is_hidden }))
  answers?.forEach((a) => content.set(`answer:${a.id}`, { title: 'Answer', body: a.body, href: `/forum/${a.post_id}`, author: name(a.author), anonymous: a.is_anonymous, hidden: a.is_hidden }))
  resources?.forEach((r) => content.set(`resource:${r.id}`, { title: r.title, body: r.description, href: '/resources', author: name(r.uploader), anonymous: false, hidden: !r.is_approved }))

  return (
    <div className="space-y-10">
      <PageHeader title="Moderation" subtitle="Review reported content and approve community resources. Anonymous authors are shown to moderators only." />

      <section>
        <h2 className="mb-3 flex items-center gap-2 font-semibold text-gray-800"><Flag className="h-4 w-4" /> Reported content ({grouped.size})</h2>
        {grouped.size === 0 ? (
          <EmptyState icon={ShieldCheck} title="Nothing reported">All clear.</EmptyState>
        ) : (
          <div className="space-y-3">
            {[...grouped.entries()].map(([key, g]) => {
              const c = content.get(key)
              return (
                <div key={key} className="card space-y-2 p-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 font-semibold uppercase">{g.type}</span>
                    <span className="font-semibold text-red-600">{g.reasons.length} report{g.reasons.length > 1 ? 's' : ''}</span>
                    <span className="text-gray-500">· {[...new Set(g.reasons)].join(', ')}</span>
                    <span className="text-gray-400">· {formatDistanceToNow(new Date(g.last), { addSuffix: true })}</span>
                  </div>
                  {c ? (
                    <>
                      <Link href={c.href} className="block font-semibold break-words hover:underline">{c.title}</Link>
                      {c.body && <p className="line-clamp-3 text-sm break-words text-gray-600">{c.body}</p>}
                      <p className="text-xs text-gray-500">
                        By {c.author}
                        {c.anonymous && ' (posted anonymously)'}
                        {c.hidden && ' · currently hidden'}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">This content was deleted.</p>
                  )}
                  <div className="flex flex-wrap justify-end gap-2 pt-1">
                    <form action={dismissFlags.bind(null, g.type, g.id)}>
                      <button className="btn-ghost px-3 py-1.5"><Check className="h-4 w-4" /> Keep it up</button>
                    </form>
                    {c && !c.hidden && (
                      <form action={hideContent.bind(null, g.type, g.id)}>
                        <button className="btn px-3 py-1.5 bg-red-600 text-white hover:bg-red-700"><EyeOff className="h-4 w-4" /> Hide</button>
                      </form>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-semibold text-gray-800">Resources awaiting approval ({pending?.length ?? 0})</h2>
        {!pending?.length ? (
          <EmptyState icon={ShieldCheck} title="No resources waiting" />
        ) : (
          <div className="space-y-3">
            {pending.map((r) => (
              <div key={r.id} className="card flex flex-wrap items-start gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-semibold text-gray-500 uppercase">{RESOURCE_CATEGORIES[r.category as ResourceCategory]}</span>
                  <a href={r.url} target="_blank" rel="noreferrer" className="block font-semibold break-words hover:underline">{r.title}</a>
                  {r.description && <p className="mt-1 text-sm break-words text-gray-600">{r.description}</p>}
                  <p className="mt-1 text-xs break-all text-gray-500">By {name(r.uploader)} · {r.url}</p>
                </div>
                <div className="flex gap-2">
                  <form action={rejectResource.bind(null, r.id)}>
                    <button className="btn-ghost px-3 py-1.5"><Trash2 className="h-4 w-4" /> Reject</button>
                  </form>
                  <form action={approveResource.bind(null, r.id)}>
                    <button className="btn-primary px-3 py-1.5"><Check className="h-4 w-4" /> Approve</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {(hiddenPosts?.length || hiddenAnswers?.length) ? (
        <section>
          <h2 className="mb-3 font-semibold text-gray-800">Hidden content</h2>
          <div className="card divide-y divide-gray-100">
            {hiddenPosts?.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-3 text-sm">
                <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-semibold uppercase">post</span>
                <Link href={`/forum/${p.id}`} className="min-w-0 flex-1 truncate hover:underline">{p.title}</Link>
                <form action={restoreContent.bind(null, 'post', p.id)}>
                  <button className="flex items-center gap-1 text-xs font-medium text-navy hover:underline"><RotateCcw className="h-3.5 w-3.5" /> Restore</button>
                </form>
              </div>
            ))}
            {hiddenAnswers?.map((a) => (
              <div key={a.id} className="flex items-center gap-3 p-3 text-sm">
                <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-semibold uppercase">answer</span>
                <Link href={`/forum/${a.post_id}`} className="min-w-0 flex-1 truncate hover:underline">{a.body}</Link>
                <form action={restoreContent.bind(null, 'answer', a.id)}>
                  <button className="flex items-center gap-1 text-xs font-medium text-navy hover:underline"><RotateCcw className="h-3.5 w-3.5" /> Restore</button>
                </form>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
