'use client'

import { useOptimistic, useTransition } from 'react'
import { ArrowBigUp, Heart } from 'lucide-react'
import { cn } from '@/lib/utils'

export function VoteButton({
  count,
  voted,
  onToggle,
  variant = 'upvote',
  layout = 'vertical',
}: {
  count: number
  voted: boolean
  onToggle: (voted: boolean) => Promise<void>
  variant?: 'upvote' | 'favorite'
  layout?: 'vertical' | 'horizontal'
}) {
  const [, startTransition] = useTransition()
  const [state, setOptimistic] = useOptimistic({ count, voted })
  const Icon = variant === 'favorite' ? Heart : ArrowBigUp

  function click() {
    startTransition(async () => {
      setOptimistic({ count: state.count + (state.voted ? -1 : 1), voted: !state.voted })
      await onToggle(state.voted)
    })
  }

  return (
    <button
      type="button"
      onClick={click}
      aria-pressed={state.voted}
      aria-label={variant === 'favorite' ? 'Favorite' : 'Upvote'}
      className={cn(
        'flex shrink-0 items-center gap-1 self-start rounded-lg px-2 py-1 text-sm font-semibold transition',
        layout === 'vertical' && 'flex-col gap-0',
        state.voted
          ? variant === 'favorite'
            ? 'text-rose-600'
            : 'bg-maize/30 text-navy'
          : 'text-gray-500 hover:bg-gray-100'
      )}
    >
      <Icon className={cn('h-6 w-6', state.voted && 'fill-current')} />
      <span>{state.count}</span>
    </button>
  )
}
