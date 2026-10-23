import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Avatar } from './Avatar'
import { MentorBadge } from './MentorBadge'
import type { MentorStatus } from '@/lib/constants'

export function AuthorLine({
  authorId,
  name,
  avatar,
  mentorStatus,
  anonymous,
  isMine,
  createdAt,
}: {
  authorId: string | null
  name: string | null
  avatar: string | null
  mentorStatus: MentorStatus | null
  anonymous: boolean
  isMine: boolean
  createdAt: string
}) {
  const hidden = !authorId
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
      <Avatar name={name} url={avatar} size={22} anonymous={hidden} />
      {hidden ? (
        <span className="font-medium text-gray-700">Anonymous</span>
      ) : (
        <Link href={`/people/${authorId}`} className="font-medium text-gray-700 hover:underline">
          {name}
        </Link>
      )}
      {anonymous && !hidden && (
        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px]">{isMine ? 'posted anonymously' : 'anonymous to others'}</span>
      )}
      {!hidden && <MentorBadge status={mentorStatus} />}
      <span>· {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}</span>
    </div>
  )
}
