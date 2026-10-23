import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, CheckCircle2, EyeOff, Trash2 } from 'lucide-react'
import { requireUser, isTrusted } from '@/lib/auth'
import type { FeedAnswer, FeedPost } from '@/lib/types'
import { AuthorLine } from '@/components/AuthorLine'
import { Tag } from '@/components/Tag'
import { VoteButton } from '@/components/VoteButton'
import { FlagButton } from '@/components/FlagButton'
import { ActionForm } from '@/components/ActionForm'
import { SubmitButton } from '@/components/SubmitButton'
import { createAnswer, deleteAnswer, deletePost, setEndorsed, toggleAnswerVote, togglePostVote } from '../actions'

export default async function PostPage({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params
  const { supabase, profile } = await requireUser()

  const [{ data: post }, { data: answers }] = await Promise.all([
    supabase.from('post_feed').select('*').eq('id', postId).maybeSingle<FeedPost>(),
    supabase
      .from('answer_feed')
      .select('*')
      .eq('post_id', postId)
      .order('is_endorsed', { ascending: false })
      .order('upvotes', { ascending: false })
      .order('created_at', { ascending: true })
      .returns<FeedAnswer[]>(),
  ])
  if (!post) notFound()

  const trusted = isTrusted(profile)
  const canDeletePost = post.is_mine || profile.is_moderator

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/forum" className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-navy">
        <ArrowLeft className="h-4 w-4" /> Back to Q&A
      </Link>

      <article className="card flex gap-3 p-5">
        <VoteButton count={post.upvotes} voted={post.has_voted} onToggle={togglePostVote.bind(null, post.id)} />
        <div className="min-w-0 flex-1">
          <AuthorLine
            authorId={post.author_id}
            name={post.author_name}
            avatar={post.author_avatar}
            mentorStatus={post.author_mentor_status}
            anonymous={post.is_anonymous}
            isMine={post.is_mine}
            createdAt={post.created_at}
          />
          <h1 className="mt-2 text-xl font-bold break-words text-gray-900">{post.title}</h1>
          {post.body && <p className="mt-3 text-[15px] leading-relaxed break-words whitespace-pre-wrap text-gray-700">{post.body}</p>}
          {post.is_hidden && (
            <p className="mt-3 flex items-center gap-1 text-sm text-red-600"><EyeOff className="h-4 w-4" /> A moderator hid this question. Only you and moderators can see it.</p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {post.tags.map((t) => (
              <Tag key={t} tag={t} href={`/forum?tag=${encodeURIComponent(t)}`} />
            ))}
            <div className="ml-auto flex items-center gap-3">
              {!post.is_mine && <FlagButton type="post" id={post.id} />}
              {canDeletePost && (
                <form action={deletePost.bind(null, post.id)}>
                  <button className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-red-600">
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </article>

      <h2 className="mt-8 mb-3 font-semibold text-gray-800">
        {answers?.length ?? 0} {answers?.length === 1 ? 'answer' : 'answers'}
      </h2>
      <div className="space-y-3">
        {answers?.map((a) => (
          <div key={a.id} className={`card flex gap-3 p-4 ${a.is_endorsed ? 'border-emerald-300 ring-1 ring-emerald-200' : ''}`}>
            <VoteButton count={a.upvotes} voted={a.has_voted} onToggle={toggleAnswerVote.bind(null, a.id)} />
            <div className="min-w-0 flex-1">
              {a.is_endorsed && (
                <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" /> Endorsed by a mentor
                </p>
              )}
              <AuthorLine
                authorId={a.author_id}
                name={a.author_name}
                avatar={a.author_avatar}
                mentorStatus={a.author_mentor_status}
                anonymous={a.is_anonymous}
                isMine={a.is_mine}
                createdAt={a.created_at}
              />
              <p className="mt-2 text-[15px] leading-relaxed break-words whitespace-pre-wrap text-gray-700">{a.body}</p>
              {a.is_hidden && <p className="mt-2 text-xs text-red-600">Hidden by a moderator.</p>}
              <div className="mt-3 flex items-center justify-end gap-3">
                {trusted && (
                  <form action={setEndorsed.bind(null, a.id, post.id, !a.is_endorsed)}>
                    <button className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline">
                      <CheckCircle2 className="h-3.5 w-3.5" /> {a.is_endorsed ? 'Remove endorsement' : 'Endorse'}
                    </button>
                  </form>
                )}
                {!a.is_mine && <FlagButton type="answer" id={a.id} />}
                {(a.is_mine || profile.is_moderator) && (
                  <form action={deleteAnswer.bind(null, a.id, post.id)}>
                    <button className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-red-600">
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <ActionForm action={createAnswer} resetOnSuccess className="card mt-6 space-y-3 p-5">
        <input type="hidden" name="post_id" value={post.id} />
        <label className="label" htmlFor="answer">Your answer</label>
        <textarea id="answer" name="body" rows={4} required maxLength={10000} className="input" placeholder="Share what worked for you…" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" name="is_anonymous" defaultChecked={post.is_mine && post.is_anonymous} className="h-4 w-4 accent-navy" /> Answer anonymously
          </label>
          <SubmitButton pendingText="Posting…">Post answer</SubmitButton>
        </div>
      </ActionForm>
    </div>
  )
}
