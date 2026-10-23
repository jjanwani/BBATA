'use client'

import { useActionState, useState } from 'react'
import { Check, Send } from 'lucide-react'
import { requestMentor } from '@/app/(app)/mentors/actions'
import { SubmitButton } from './SubmitButton'

export function RequestMentorForm({ mentorId, mentorFirstName }: { mentorId: string; mentorFirstName: string }) {
  const [open, setOpen] = useState(false)
  const [state, action] = useActionState(requestMentor, undefined)

  if (state?.ok) {
    return (
      <p className="flex items-center gap-1 text-sm font-medium text-emerald-700">
        <Check className="h-4 w-4" /> Request sent
      </p>
    )
  }
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-primary w-full sm:w-auto">
        <Send className="h-4 w-4" /> Request as mentor
      </button>
    )
  }
  return (
    <form action={action} className="w-full space-y-2">
      <input type="hidden" name="mentor_id" value={mentorId} />
      <textarea
        name="intro_message"
        rows={3}
        maxLength={1000}
        className="input"
        placeholder={`Introduce yourself to ${mentorFirstName}: what you're hoping to get help with…`}
        autoFocus
      />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => setOpen(false)} className="btn-ghost">Cancel</button>
        <SubmitButton pendingText="Sending…">Send request</SubmitButton>
      </div>
    </form>
  )
}
