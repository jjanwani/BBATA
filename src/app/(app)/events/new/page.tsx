import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireUser, isTrusted } from '@/lib/auth'
import { EVENT_TYPES } from '@/lib/constants'
import { ActionForm } from '@/components/ActionForm'
import { SubmitButton } from '@/components/SubmitButton'
import { PageHeader } from '@/components/PageHeader'
import { createEvent } from '../actions'

export default async function NewEventPage() {
  const { profile } = await requireUser()
  if (!isTrusted(profile)) redirect('/events')

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Post an event" subtitle="It will show up in everyone's Events feed." />
      <ActionForm action={createEvent} className="card space-y-4 p-6">
        <div>
          <label className="label" htmlFor="title">Title</label>
          <input id="title" name="title" className="input" required maxLength={200} placeholder="e.g. McKinsey coffee chats" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="event_type">Type</label>
            <select id="event_type" name="event_type" className="input" required defaultValue="">
              <option value="" disabled>Choose…</option>
              {Object.entries(EVENT_TYPES).map(([k, t]) => (
                <option key={k} value={k}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="host">Hosted by</label>
            <input id="host" name="host" className="input" placeholder="Club or person" />
          </div>
          <div>
            <label className="label" htmlFor="starts_at">Starts (Michigan time)</label>
            <input id="starts_at" name="starts_at" type="datetime-local" className="input" required />
          </div>
          <div>
            <label className="label" htmlFor="ends_at">Ends (optional)</label>
            <input id="ends_at" name="ends_at" type="datetime-local" className="input" />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="location">Location</label>
          <input id="location" name="location" className="input" placeholder="e.g. R2240, Ross or Zoom" />
        </div>
        <div>
          <label className="label" htmlFor="link">Sign-up or info link (optional)</label>
          <input id="link" name="link" type="url" className="input" placeholder="https://…" />
        </div>
        <div>
          <label className="label" htmlFor="description">Description</label>
          <textarea id="description" name="description" rows={4} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="tags">Tags (comma-separated)</label>
          <input id="tags" name="tags" className="input" placeholder="consulting, coffee chat" />
        </div>
        <div className="flex justify-end gap-2">
          <Link href="/events" className="btn-ghost">Cancel</Link>
          <SubmitButton pendingText="Posting…">Post event</SubmitButton>
        </div>
      </ActionForm>
    </div>
  )
}
