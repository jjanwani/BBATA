'use client'

import { useOptimistic, useTransition } from 'react'
import { Check, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

export function RsvpButton({ going, count, onToggle }: { going: boolean; count: number; onToggle: (going: boolean) => Promise<void> }) {
  const [, startTransition] = useTransition()
  const [state, setOptimistic] = useOptimistic({ going, count })

  return (
    <button
      type="button"
      aria-pressed={state.going}
      onClick={() =>
        startTransition(async () => {
          setOptimistic({ going: !state.going, count: state.count + (state.going ? -1 : 1) })
          await onToggle(state.going)
        })
      }
      className={cn('btn px-3 py-1.5', state.going ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'btn-ghost')}
    >
      {state.going ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
      {state.going ? 'Going' : 'RSVP'}
      <span className={cn('text-xs font-normal', state.going ? 'text-white/80' : 'text-gray-500')}>· {state.count}</span>
    </button>
  )
}
