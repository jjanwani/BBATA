'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { CLASS_YEARS, MENTOR_ELIGIBLE, MENTOR_STATUS, type ClassYear, type MentorStatus } from '@/lib/constants'
import type { ActionState } from '@/lib/types'
import { isHttpUrl, str } from '@/lib/utils'

export async function saveProfile(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { supabase, user, profile } = await requireUser()

  const full_name = str(form, 'full_name')
  const class_year = str(form, 'class_year') as ClassYear
  const major = str(form, 'major')
  const goals = str(form, 'goals')
  const bio = str(form, 'bio')
  const linkedin = str(form, 'linkedin_url')
  const mentor_status = (str(form, 'mentor_status') || 'mentee') as MentorStatus
  const interests = form.getAll('interests').map(String).slice(0, 8)

  if (!full_name) return { error: 'Please enter your name.' }
  if (!(class_year in CLASS_YEARS)) return { error: 'Please choose your year.' }
  if (!(mentor_status in MENTOR_STATUS)) return { error: 'Please choose how you want to take part in mentorship.' }
  if (mentor_status !== 'mentee' && !MENTOR_ELIGIBLE.includes(class_year)) {
    return { error: 'Mentors are juniors, seniors, or graduate students. You can still find a mentor of your own.' }
  }
  if (interests.length === 0) return { error: 'Pick at least one interest so we can match you.' }
  if (linkedin && !isHttpUrl(linkedin)) return { error: 'LinkedIn should be a full link starting with https://' }

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name,
      class_year,
      major,
      goals,
      bio,
      linkedin_url: linkedin || null,
      mentor_status,
      interests,
      onboarded: true,
    })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  if (!profile.onboarded) redirect('/mentors')
  return { ok: true }
}
