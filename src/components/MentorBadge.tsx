import { GraduationCap, Shield } from 'lucide-react'
import type { MentorStatus } from '@/lib/constants'

export function MentorBadge({ status, moderator }: { status?: MentorStatus | null; moderator?: boolean }) {
  return (
    <>
      {moderator && (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700">
          <Shield className="h-3 w-3" /> Moderator
        </span>
      )}
      {status && status !== 'mentee' && (
        <span className="inline-flex items-center gap-1 rounded-full bg-maize/30 px-2 py-0.5 text-[11px] font-semibold text-navy">
          <GraduationCap className="h-3 w-3" /> Mentor
        </span>
      )}
    </>
  )
}
