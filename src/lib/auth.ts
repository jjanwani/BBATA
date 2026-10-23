import { redirect } from 'next/navigation'
import { cache } from 'react'
import { getSupabaseServerClient } from './supabase/server'
import type { Profile } from './types'

/** Signed-in user + profile for Server Components and Server Actions. */
export const requireUser = cache(async () => {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single<Profile>()
  if (!profile) redirect('/auth/error?message=' + encodeURIComponent('No profile found for this account.'))

  return { supabase, user, profile }
})

export function isTrusted(profile: Profile) {
  return profile.is_moderator || profile.mentor_status !== 'mentee'
}
