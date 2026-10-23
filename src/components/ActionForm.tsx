'use client'

import { useActionState, useEffect, useRef } from 'react'
import type { ActionState } from '@/lib/types'

/** A form bound to a Server Action that shows the action's error message. */
export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess,
  successMessage,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>
  children: React.ReactNode
  className?: string
  resetOnSuccess?: boolean
  successMessage?: string
}) {
  const [state, formAction] = useActionState(action, undefined)
  const ref = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.ok && resetOnSuccess) ref.current?.reset()
  }, [state, resetOnSuccess])

  return (
    <form ref={ref} action={formAction} className={className}>
      {children}
      {state?.error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state?.ok && successMessage && (
        <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {successMessage}
        </p>
      )}
    </form>
  )
}
