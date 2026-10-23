'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireUser, isTrusted } from '@/lib/auth'
import { EVENT_TYPES } from '@/lib/constants'
import { michiganLocalToIso } from '@/lib/time'
import type { ActionState } from '@/lib/types'
import { isHttpUrl, parseTags, str } from '@/lib/utils'

export async function createEvent(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { supabase, user, profile } = await requireUser()
  if (!isTrusted(profile)) return { error: 'Only mentors and moderators can post events.' }

  const title = str(form, 'title')
  const event_type = str(form, 'event_type')
  const starts_at = michiganLocalToIso(str(form, 'starts_at'))
  const endsRaw = str(form, 'ends_at')
  const ends_at = endsRaw ? michiganLocalToIso(endsRaw) : null
  const link = str(form, 'link')

  if (title.length < 3) return { error: 'Give the event a title.' }
  if (!(event_type in EVENT_TYPES)) return { error: 'Choose an event type.' }
  if (!starts_at) return { error: 'Choose a start time.' }
  if (endsRaw && !ends_at) return { error: 'The end time is not valid.' }
  if (ends_at && ends_at < starts_at) return { error: 'The event has to end after it starts.' }
  if (link && !isHttpUrl(link)) return { error: 'The link should start with https://' }

  const { error } = await supabase.from('events').insert({
    title,
    event_type,
    starts_at,
    ends_at,
    link: link || null,
    host: str(form, 'host'),
    location: str(form, 'location'),
    description: str(form, 'description'),
    tags: parseTags(form.get('tags')),
    created_by: user.id,
  })
  if (error) return { error: error.message }

  revalidatePath('/events')
  revalidatePath('/')
  redirect('/events')
}

export async function toggleRsvp(eventId: string, going: boolean) {
  const { supabase, user } = await requireUser()
  if (going) await supabase.from('event_rsvps').delete().eq('event_id', eventId).eq('user_id', user.id)
  else await supabase.from('event_rsvps').insert({ event_id: eventId, user_id: user.id })
  revalidatePath('/events')
  revalidatePath('/')
}

export async function deleteEvent(eventId: string) {
  const { supabase } = await requireUser()
  await supabase.from('events').delete().eq('id', eventId)
  revalidatePath('/events')
  revalidatePath('/')
}
