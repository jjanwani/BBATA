import Link from 'next/link'
import { MessageCircle, CheckCircle2, EyeOff } from 'lucide-react'
import type { FeedPost } from '@/lib/types'
import { AuthorLine } from './AuthorLine'
import { Tag } from './Tag'
import { VoteButton } from './VoteButton'
import { togglePostVote } from '@/app/(app)/forum/actions'

export function PostCard({ post }: { post: FeedPost }) {
  return (
    <article className="card flex gap-3 p-4">
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
        <Link href={`/forum/${post.id}`} className="mt-1 block">
          <h2 className="font-semibold break-words text-gray-900 hover:text-navy">{post.title}</h2>
          {post.body && <p className="mt-1 line-clamp-2 text-sm break-words text-gray-600">{post.body}</p>}
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {post.tags.map((t) => (
            <Tag key={t} tag={t} href={`/forum?tag=${encodeURIComponent(t)}`} />
          ))}
          <span className="ml-auto flex items-center gap-3 text-xs text-gray-500">
            {post.is_hidden && (
              <span className="flex items-center gap-1 text-red-600"><EyeOff className="h-3.5 w-3.5" /> Hidden by a moderator</span>
            )}
            {post.has_endorsed && (
              <span className="flex items-center gap-1 text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> Mentor-endorsed</span>
            )}
            <Link href={`/forum/${post.id}`} className="flex items-center gap-1 hover:text-navy">
              <MessageCircle className="h-3.5 w-3.5" /> {post.answer_count} {post.answer_count === 1 ? 'answer' : 'answers'}
            </Link>
          </span>
        </div>
      </div>
    </article>
  )
}
