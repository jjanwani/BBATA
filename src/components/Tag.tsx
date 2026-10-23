import Link from 'next/link'
import { cn } from '@/lib/utils'

export function Tag({ tag, href, active }: { tag: string; href?: string; active?: boolean }) {
  const cls = cn(
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition',
    active ? 'bg-navy text-white' : 'bg-navy/5 text-navy hover:bg-navy/10'
  )
  return href ? (
    <Link href={href} className={cls}>
      #{tag}
    </Link>
  ) : (
    <span className={cls}>#{tag}</span>
  )
}
