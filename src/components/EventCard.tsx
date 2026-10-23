import { CalendarPlus, ExternalLink, MapPin, Trash2, Users } from 'lucide-react'
import { EVENT_TYPES } from '@/lib/constants'
import { formatTime, formatShort, googleCalendarUrl } from '@/lib/time'
import type { FeedEvent } from '@/lib/types'
import { cn } from '@/lib/utils'
import { RsvpButton } from './RsvpButton'
import { deleteEvent, toggleRsvp } from '@/app/(app)/events/actions'

export function EventCard({ event, canDelete, compact }: { event: FeedEvent; canDelete?: boolean; compact?: boolean }) {
  const type = EVENT_TYPES[event.event_type]
  return (
    <article className="card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', type.className)}>{type.label}</span>
            <span className="text-sm font-medium text-gray-700">
              {compact ? formatShort(event.starts_at) : formatTime(event.starts_at)}
              {!compact && event.ends_at && ` – ${formatTime(event.ends_at)}`}
            </span>
          </div>
          <h3 className="mt-1.5 font-semibold break-words text-gray-900">{event.title}</h3>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
            {event.host && (
              <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {event.host}</span>
            )}
            {event.location && (
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {event.location}</span>
            )}
          </div>
          {!compact && event.description && <p className="mt-2 text-sm break-words whitespace-pre-wrap text-gray-600">{event.description}</p>}
        </div>
        <RsvpButton going={event.has_rsvped} count={event.rsvp_count} onToggle={toggleRsvp.bind(null, event.id)} />
      </div>
      {!compact && (
        <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-gray-100 pt-3 text-xs">
          <a href={googleCalendarUrl(event)} target="_blank" rel="noreferrer" className="flex items-center gap-1 font-medium text-navy hover:underline">
            <CalendarPlus className="h-3.5 w-3.5" /> Add to Google Calendar
          </a>
          {event.link && (
            <a href={event.link} target="_blank" rel="noreferrer" className="flex items-center gap-1 font-medium text-navy hover:underline">
              <ExternalLink className="h-3.5 w-3.5" /> Event link
            </a>
          )}
          {canDelete && (
            <form action={deleteEvent.bind(null, event.id)} className="ml-auto">
              <button className="flex items-center gap-1 text-gray-500 hover:text-red-600">
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </form>
          )}
        </div>
      )}
    </article>
  )
}
