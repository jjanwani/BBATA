import { requireUser, isTrusted } from '@/lib/auth'
import { PageHeader } from '@/components/PageHeader'
import { ResourceForm } from '@/components/ResourceForm'
import { createResource } from '../actions'

export default async function NewResourcePage() {
  const { profile } = await requireUser()
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Share a resource"
        subtitle={
          isTrusted(profile)
            ? 'As a mentor, your resources are published right away.'
            : 'A moderator will review it before it appears for everyone.'
        }
      />
      <ResourceForm action={createResource} submitLabel="Share resource" />
    </div>
  )
}
