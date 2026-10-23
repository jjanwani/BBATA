'use server'

import { requireUser } from '@/lib/auth'
import type { ActionState } from '@/lib/types'
import { str } from '@/lib/utils'

export async function flagContent(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { supabase, user } = await requireUser()
  const target_type = str(form, 'target_type')
  const target_id = str(form, 'target_id')
  const reason = str(form, 'reason')
  if (!['post', 'answer', 'resource'].includes(target_type)) return { error: 'Unknown content type.' }
  if (!reason) return { error: 'Pick a reason.' }

  const { error } = await supabase.from('flags').insert({ target_type, target_id, reporter_id: user.id, reason })
  if (error?.code === '23505') return { ok: true } // already reported
  if (error) return { error: error.message }
  return { ok: true }
}
