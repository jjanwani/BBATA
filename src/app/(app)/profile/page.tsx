import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { ProfileForm } from '@/components/ProfileForm'
import { PageHeader } from '@/components/PageHeader'
import { Avatar } from '@/components/Avatar'

export default async function ProfilePage() {
  const { profile } = await requireUser()
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Your profile"
        subtitle="Other students see this when you post or show up as a mentor match."
        action={<Link href={`/people/${profile.id}`} className="btn-ghost">View public profile</Link>}
      />
      <div className="card p-6">
        <div className="mb-6 flex items-center gap-3">
          <Avatar name={profile.full_name} url={profile.avatar_url} size={48} />
          <div className="min-w-0">
            <p className="font-semibold">{profile.full_name}</p>
            <p className="truncate text-sm text-gray-500">{profile.email}</p>
          </div>
        </div>
        <ProfileForm profile={profile} submitLabel="Save changes" />
      </div>
    </div>
  )
}
