'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, Send } from 'lucide-react'
import type { RealtimeChannel, RealtimePostgresInsertPayload } from '@supabase/supabase-js'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type { Message } from '@/lib/types'
import { cn } from '@/lib/utils'
import { TIME_ZONE } from '@/lib/time'

const timeFmt = new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

export function ChatThread({ matchId, meId, initial, otherName }: { matchId: string; meId: string; initial: Message[]; otherName: string }) {
  const [messages, setMessages] = useState<Message[]>(initial)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    const topic = `match-${matchId}`
    const existing = supabase.getChannels().find((c: RealtimeChannel) => c.topic === `realtime:${topic}`)
    if (existing) supabase.removeChannel(existing)

    const channel = supabase
      .channel(topic)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` },
        (payload: RealtimePostgresInsertPayload<Message>) => {
          const msg = payload.new
          setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]))
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [matchId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length])

  async function send(e: React.FormEvent) {
    e.preventDefault()
    const body = draft.trim()
    if (!body) return
    setSending(true)
    setError(null)
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase.from('messages').insert({ match_id: matchId, sender_id: meId, body }).select().single()
    setSending(false)
    if (error) {
      setError(error.message)
      return
    }
    setDraft('')
    setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [...prev, data as Message]))
  }

  return (
    <div className="card flex h-[calc(100dvh-16rem)] min-h-96 flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="py-10 text-center text-sm text-gray-500">Say hi to {otherName}. Suggest a time for a coffee chat.</p>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === meId
          return (
            <div key={m.id} className={cn('flex flex-col', mine ? 'items-end' : 'items-start')}>
              <div
                className={cn(
                  'max-w-[85%] rounded-2xl px-3.5 py-2 text-sm break-words whitespace-pre-wrap',
                  mine ? 'rounded-br-sm bg-navy text-white' : 'rounded-bl-sm bg-gray-100 text-gray-800'
                )}
              >
                {m.body}
              </div>
              <span className="mt-0.5 text-[11px] text-gray-400">{timeFmt.format(new Date(m.created_at))}</span>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} className="flex gap-2 border-t border-gray-100 p-3">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              e.currentTarget.form?.requestSubmit()
            }
          }}
          rows={1}
          maxLength={4000}
          placeholder="Write a message…"
          className="input resize-none"
          aria-label="Message"
        />
        <button disabled={sending || !draft.trim()} className="btn-primary px-3" aria-label="Send">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </form>
      {error && <p className="px-3 pb-3 text-sm text-red-600">{error}</p>}
    </div>
  )
}
