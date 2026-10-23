'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'

type Target = 'post' | 'answer' | 'resource'

async function requireModerator() {
  const ctx = await requireUser()
  if (!ctx.profile.is_moderator) throw new Error('Moderators only')
  return ctx
}

function refresh() {
  revalidatePath('/moderation')
  revalidatePath('/forum')
  revalidatePath('/resources')
}

export async function hideContent(type: Target, id: string) {
  const { supabase } = await requireModerator()
  await supabase.rpc('moderate_set_hidden', { p_type: type, p_id: id, p_hidden: true })
  refresh()
}

export async function restoreContent(type: Target, id: string) {
  const { supabase } = await requireModerator()
  await supabase.rpc('moderate_set_hidden', { p_type: type, p_id: id, p_hidden: false })
  refresh()
}

export async function dismissFlags(type: Target, id: string) {
  const { supabase } = await requireModerator()
  await supabase.from('flags').update({ status: 'resolved' }).eq('target_type', type).eq('target_id', id)
  refresh()
}

export async function approveResource(id: string) {
  const { supabase } = await requireModerator()
  await supabase.rpc('approve_resource', { p_id: id })
  refresh()
}

export async function rejectResource(id: string) {
  const { supabase } = await requireModerator()
  await supabase.from('resources').delete().eq('id', id)
  refresh()
}
