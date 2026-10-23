import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import type { FeedResource } from '@/lib/types'
import { PageHeader } from '@/components/PageHeader'
import { ResourceForm } from '@/components/ResourceForm'
import { updateResource } from '../../actions'

export default async function EditResourcePage({ params }: { params: Promise<{ resourceId: string }> }) {
  const { resourceId } = await params
  const { supabase } = await requireUser()
  const { data: resource } = await supabase.from('resource_feed').select('*').eq('id', resourceId).maybeSingle<FeedResource>()
  if (!resource) notFound()

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Edit resource" />
      <ResourceForm action={updateResource} resource={resource} submitLabel="Save changes" />
    </div>
  )
}
