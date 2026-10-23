// Everyone on Ross Reddit is in Ann Arbor, so event times are entered and
// shown in Michigan time no matter where the server runs.
export const TIME_ZONE = 'America/Detroit'

function zonedParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date)
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value)
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour'), minute: get('minute'), second: get('second') }
}

/** Offset (ms) of Michigan time from UTC at a given instant. */
function offsetAt(date: Date) {
  const p = zonedParts(date)
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - date.getTime()
}

/** "2026-10-23T18:30" entered as Michigan time → ISO string in UTC. */
export function michiganLocalToIso(local: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local)
  if (!m) return null
  const asUtc = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5])
  let guess = asUtc - offsetAt(new Date(asUtc))
  guess = asUtc - offsetAt(new Date(guess)) // settle across DST changes
  return new Date(guess).toISOString()
}

/** ISO → "2026-10-23T18:30" in Michigan time, for datetime-local inputs. */
export function isoToMichiganLocal(iso: string) {
  const p = zonedParts(new Date(iso))
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`
}

/** Michigan calendar date key, e.g. "2026-10-23", for grouping. */
export function dayKey(iso: string) {
  return isoToMichiganLocal(iso).slice(0, 10)
}

export function formatDay(iso: string) {
  return new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, weekday: 'long', month: 'long', day: 'numeric' }).format(new Date(iso))
}

export function formatTime(iso: string) {
  return new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, hour: 'numeric', minute: '2-digit' }).format(new Date(iso))
}

export function formatShort(iso: string) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function googleCalendarUrl(e: { title: string; description: string; location: string; starts_at: string; ends_at: string | null }) {
  const fmt = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const end = e.ends_at ?? new Date(new Date(e.starts_at).getTime() + 60 * 60 * 1000).toISOString()
  const sp = new URLSearchParams({
    action: 'TEMPLATE',
    text: e.title,
    dates: `${fmt(e.starts_at)}/${fmt(end)}`,
    details: e.description,
    location: e.location,
  })
  return `https://calendar.google.com/calendar/render?${sp}`
}

/** ISO timestamp offset from now by `ms` (negative = in the past). */
export function isoFromNow(ms: number) {
  return new Date(Date.now() + ms).toISOString()
}
