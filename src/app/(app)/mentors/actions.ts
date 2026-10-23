'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import type { ActionState } from '@/lib/types'
import { str } from '@/lib/utils'

export async function requestMentor(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { supabase, user } = await requireUser()
  const mentor_id = str(form, 'mentor_id')
  const intro_message = str(form, 'intro_message').slice(0, 1000)

  const { error } = await supabase.from('matches').insert({ mentee_id: user.id, mentor_id, intro_message })
  if (error?.code === '23505') return { error: "You've already sent this person a request." }
  if (error) return { error: error.message }

  revalidatePath('/mentors')
  return { ok: true }
}

export async function respondToRequest(matchId: string, accept: boolean) {
  const { supabase, user } = await requireUser()
  await supabase
    .from('matches')
    .update({ status: accept ? 'accepted' : 'declined', responded_at: new Date().toISOString() })
    .eq('id', matchId)
    .eq('mentor_id', user.id)
  revalidatePath('/mentors')
  revalidatePath('/', 'layout')
  if (accept) redirect(`/mentors/${matchId}`)
}

export async function endMatch(matchId: string) {
  const { supabase } = await requireUser()
  await supabase.from('matches').delete().eq('id', matchId)
  revalidatePath('/mentors')
  redirect('/mentors')
}
