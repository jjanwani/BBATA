import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')

  if (!code) {
    const message = searchParams.get('error_description') || searchParams.get('error') || 'Sign-in was cancelled.'
    return NextResponse.redirect(`${origin}/auth/error?message=${encodeURIComponent(message)}`)
  }

  const supabase = await getSupabaseServerClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return NextResponse.redirect(`${origin}/auth/error?message=${encodeURIComponent(error.message)}`)
  }
  return NextResponse.redirect(`${origin}/`)
}
