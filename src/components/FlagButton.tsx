'use client'

import { useActionState, useState } from 'react'
import { Flag } from 'lucide-react'
import { flagContent } from '@/app/flag-actions'
import { SubmitButton } from './SubmitButton'

const REASONS = ['Spam or self-promotion', 'Disrespectful or harassing', 'Inaccurate or misleading', 'Off-topic', 'Other']

export function FlagButton({ type, id }: { type: 'post' | 'answer' | 'resource'; id: string }) {
  const [open, setOpen] = useState(false)
  const [state, action] = useActionState(flagContent, undefined)

  if (state?.ok) return <span className="text-xs text-gray-500">Reported. Thanks.</span>

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-red-600">
        <Flag className="h-3.5 w-3.5" /> Report
      </button>
      {open && (
        <form action={action} className="card absolute right-0 z-20 mt-2 w-64 space-y-2 p-3 shadow-lg">
          <input type="hidden" name="target_type" value={type} />
          <input type="hidden" name="target_id" value={id} />
          <p className="text-sm font-semibold">Why are you reporting this?</p>
          {REASONS.map((r) => (
            <label key={r} className="flex items-center gap-2 text-sm">
              <input type="radio" name="reason" value={r} required /> {r}
            </label>
          ))}
          {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost px-3 py-1">Cancel</button>
            <SubmitButton className="btn-primary px-3 py-1">Report</SubmitButton>
          </div>
        </form>
      )}
    </div>
  )
}
