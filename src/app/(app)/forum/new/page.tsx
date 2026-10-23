import Link from 'next/link'
import { EyeOff } from 'lucide-react'
import { FORUM_TAGS } from '@/lib/constants'
import { ActionForm } from '@/components/ActionForm'
import { SubmitButton } from '@/components/SubmitButton'
import { PageHeader } from '@/components/PageHeader'
import { createPost } from '../actions'

export default function NewPostPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Ask a question" subtitle="Mentors and classmates will see it in the Q&A feed." />
      <ActionForm action={createPost} className="card space-y-5 p-6">
        <div>
          <label className="label" htmlFor="title">Question</label>
          <input id="title" name="title" className="input" required minLength={5} maxLength={200} placeholder="e.g. When should sophomores start networking for IB?" />
        </div>
        <div>
          <label className="label" htmlFor="body">Details (optional)</label>
          <textarea id="body" name="body" rows={6} className="input" maxLength={10000} placeholder="Add context so people can give you a better answer." />
        </div>
        <fieldset>
          <legend className="label">Tags</legend>
          <div className="flex flex-wrap gap-2">
            {FORUM_TAGS.map((t) => (
              <label key={t} className="cursor-pointer">
                <input type="checkbox" name="tags" value={t} className="peer sr-only" />
                <span className="inline-block rounded-full border border-gray-300 px-3 py-1 text-sm text-gray-700 peer-checked:border-navy peer-checked:bg-navy peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-navy/30">
                  #{t}
                </span>
              </label>
            ))}
          </div>
          <input name="custom_tags" className="input mt-3" placeholder="Other tags, comma-separated (e.g. STRAT 390, TAMID)" />
        </fieldset>
        <label className="flex items-start gap-3 rounded-lg bg-gray-50 p-3">
          <input type="checkbox" name="is_anonymous" className="mt-1 h-4 w-4 accent-navy" />
          <span>
            <span className="flex items-center gap-1.5 text-sm font-medium"><EyeOff className="h-4 w-4" /> Post anonymously</span>
            <span className="text-xs text-gray-500">Other students won&apos;t see your name. Moderators can, to keep the forum respectful.</span>
          </span>
        </label>
        <div className="flex justify-end gap-2">
          <Link href="/forum" className="btn-ghost">Cancel</Link>
          <SubmitButton pendingText="Posting…">Post question</SubmitButton>
        </div>
      </ActionForm>
    </div>
  )
}
