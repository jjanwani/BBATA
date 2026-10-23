'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { RESOURCE_CATEGORIES } from '@/lib/constants'
import type { ActionState } from '@/lib/types'
import { isHttpUrl, parseTags, str } from '@/lib/utils'

function readResource(form: FormData) {
  return {
    title: str(form, 'title'),
    description: str(form, 'description'),
    url: str(form, 'url'),
    category: str(form, 'category'),
    tags: parseTags(form.get('tags')),
  }
}

function validate(r: ReturnType<typeof readResource>) {
  if (r.title.length < 3) return 'Give the resource a title.'
  if (!isHttpUrl(r.url)) return 'Add a link starting with https:// (Google Doc, Drive folder, website…).'
  if (!(r.category in RESOURCE_CATEGORIES)) return 'Choose a category.'
  return null
}

export async function createResource(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { supabase, user } = await requireUser()
  const r = readResource(form)
  const problem = validate(r)
  if (problem) return { error: problem }

  const { data, error } = await supabase.from('resources').insert({ ...r, uploader_id: user.id }).select('is_approved').single()
  if (error) return { error: error.message }

  revalidatePath('/resources')
  redirect(data.is_approved ? '/resources' : '/resources?submitted=1')
}

export async function updateResource(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireUser()
  const id = str(form, 'id')
  const r = readResource(form)
  const problem = validate(r)
  if (problem) return { error: problem }

  const { data, error } = await supabase
    .from('resources')
    .update({ ...r, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id')
  if (error) return { error: error.message }
  if (!data?.length) return { error: "You don't have permission to edit this resource." }

  revalidatePath('/resources')
  redirect('/resources')
}

export async function toggleResourceVote(resourceId: string, voted: boolean) {
  const { supabase, user } = await requireUser()
  if (voted) await supabase.from('resource_votes').delete().eq('resource_id', resourceId).eq('user_id', user.id)
  else await supabase.from('resource_votes').insert({ resource_id: resourceId, user_id: user.id })
  revalidatePath('/resources')
}

export async function deleteResource(resourceId: string) {
  const { supabase } = await requireUser()
  await supabase.from('resources').delete().eq('id', resourceId)
  revalidatePath('/resources')
}
