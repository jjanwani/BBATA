import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { Logo } from '@/components/Logo'
import { ProfileForm } from '@/components/ProfileForm'

export default async function OnboardingPage() {
  const { profile } = await requireUser()
  if (profile.onboarded) redirect('/')

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <Logo className="text-xl" />
        <div className="card mt-6 p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-navy">Welcome to Ross Reddit</h1>
          <p className="mt-1 text-sm text-gray-600">Tell us a bit about yourself so we can suggest mentors and content for you.</p>
          <div className="mt-6">
            <ProfileForm profile={profile} submitLabel="Finish setup" />
          </div>
        </div>
      </div>
    </main>
  )
}
