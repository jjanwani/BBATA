import Link from 'next/link'
import { RESOURCE_CATEGORIES } from '@/lib/constants'
import type { ActionState, FeedResource } from '@/lib/types'
import { ActionForm } from './ActionForm'
import { SubmitButton } from './SubmitButton'

export function ResourceForm({
  action,
  resource,
  submitLabel,
}: {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>
  resource?: FeedResource
  submitLabel: string
}) {
  return (
    <ActionForm action={action} className="card space-y-4 p-6">
      {resource && <input type="hidden" name="id" value={resource.id} />}
      <div>
        <label className="label" htmlFor="title">Title</label>
        <input id="title" name="title" className="input" required maxLength={200} defaultValue={resource?.title} placeholder="e.g. Case interview prep guide" />
      </div>
      <div>
        <label className="label" htmlFor="url">Link</label>
        <input id="url" name="url" type="url" className="input" required defaultValue={resource?.url} placeholder="https://docs.google.com/…" />
        <p className="mt-1 text-xs text-gray-500">Make sure anyone at umich.edu with the link can view it.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="category">Category</label>
          <select id="category" name="category" className="input" required defaultValue={resource?.category ?? ''}>
            <option value="" disabled>Choose…</option>
            {Object.entries(RESOURCE_CATEGORIES).map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="tags">Tags (comma-separated)</label>
          <input id="tags" name="tags" className="input" defaultValue={resource?.tags.join(', ')} placeholder="syllabus, STRAT 390" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="description">What is it and who is it for?</label>
        <textarea id="description" name="description" rows={4} className="input" defaultValue={resource?.description} />
      </div>
      <div className="flex justify-end gap-2">
        <Link href="/resources" className="btn-ghost">Cancel</Link>
        <SubmitButton pendingText="Saving…">{submitLabel}</SubmitButton>
      </div>
    </ActionForm>
  )
}
