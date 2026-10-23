import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function initials(name: string | null | undefined) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return (parts[0]?.[0] ?? '?').toUpperCase() + (parts.length > 1 ? parts[parts.length - 1][0].toUpperCase() : '')
}

/** Parse "a, #b c" style tag input into a clean, de-duplicated list. */
export function parseTags(raw: FormDataEntryValue | null, extra: FormDataEntryValue[] = []): string[] {
  const typed = String(raw ?? '')
    .split(/[,\n]/)
    .map((t) => t.trim().replace(/^#/, ''))
  const all = [...extra.map(String), ...typed].map((t) => t.trim()).filter(Boolean)
  return Array.from(new Set(all)).slice(0, 8)
}

export function str(form: FormData, key: string) {
  return String(form.get(key) ?? '').trim()
}

export function isHttpUrl(value: string) {
  try {
    const u = new URL(value)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}
