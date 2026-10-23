'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import type { ActionState } from '@/lib/types'
import { parseTags, str } from '@/lib/utils'

export async function createPost(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { supabase, user } = await requireUser()
  const title = str(form, 'title')
  const body = str(form, 'body')
  const tags = parseTags(form.get('custom_tags'), form.getAll('tags'))
  const is_anonymous = form.get('is_anonymous') === 'on'

  if (title.length < 5) return { error: 'Give your question a title of at least 5 characters.' }
  if (title.length > 200) return { error: 'Keep the title under 200 characters.' }

  const { data, error } = await supabase
    .from('posts')
    .insert({ author_id: user.id, title, body, tags, is_anonymous })
    .select('id')
    .single()
  if (error) return { error: error.message }

  revalidatePath('/forum')
  redirect(`/forum/${data.id}`)
}

export async function createAnswer(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { supabase, user } = await requireUser()
  const post_id = str(form, 'post_id')
  const body = str(form, 'body')
  const is_anonymous = form.get('is_anonymous') === 'on'
  if (!body) return { error: 'Write an answer first.' }

  const { error } = await supabase.from('answers').insert({ post_id, author_id: user.id, body, is_anonymous })
  if (error) return { error: error.message }

  revalidatePath(`/forum/${post_id}`)
  return { ok: true }
}

export async function togglePostVote(postId: string, voted: boolean) {
  const { supabase, user } = await requireUser()
  if (voted) await supabase.from('post_votes').delete().eq('post_id', postId).eq('user_id', user.id)
  else await supabase.from('post_votes').insert({ post_id: postId, user_id: user.id })
  revalidatePath('/forum')
  revalidatePath(`/forum/${postId}`)
}

export async function toggleAnswerVote(answerId: string, voted: boolean) {
  const { supabase, user } = await requireUser()
  if (voted) await supabase.from('answer_votes').delete().eq('answer_id', answerId).eq('user_id', user.id)
  else await supabase.from('answer_votes').insert({ answer_id: answerId, user_id: user.id })
  revalidatePath('/forum/[postId]', 'page')
}

export async function setEndorsed(answerId: string, postId: string, endorsed: boolean) {
  const { supabase } = await requireUser()
  await supabase.rpc('set_answer_endorsed', { p_answer_id: answerId, p_endorsed: endorsed })
  revalidatePath(`/forum/${postId}`)
}

export async function deletePost(postId: string) {
  const { supabase } = await requireUser()
  await supabase.from('posts').delete().eq('id', postId)
  revalidatePath('/forum')
  redirect('/forum')
}

export async function deleteAnswer(answerId: string, postId: string) {
  const { supabase } = await requireUser()
  await supabase.from('answers').delete().eq('id', answerId)
  revalidatePath(`/forum/${postId}`)
}
