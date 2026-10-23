import { YEAR_RANK } from './constants'
import type { Profile } from './types'

export type MentorSuggestion = {
  mentor: Profile
  score: number
  shared: string[]
  activeMentees: number
}

const STOP_WORDS = new Set(['the', 'and', 'for', 'with', 'want', 'into', 'about', 'like', 'that', 'this', 'get', 'learn', 'more'])

function keywords(text: string) {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 3 && !STOP_WORDS.has(w))
  )
}

/**
 * Lightweight matching: rank mentors further along than the mentee by
 * shared interests first, then overlap in goals/major, and nudge toward
 * mentors who have fewer active mentees so attention spreads out.
 */
export function rankMentors(
  mentee: Profile,
  mentors: Profile[],
  activeMenteeCounts: Map<string, number>,
  excludeIds: Set<string>
): MentorSuggestion[] {
  const menteeRank = mentee.class_year ? YEAR_RANK[mentee.class_year] : 0
  const menteeWords = keywords(`${mentee.goals} ${mentee.bio}`)

  return mentors
    .filter((m) => m.id !== mentee.id && !excludeIds.has(m.id))
    .filter((m) => m.mentor_status !== 'mentee' && m.class_year && YEAR_RANK[m.class_year] > menteeRank)
    .map((mentor) => {
      const shared = mentee.interests.filter((i) => mentor.interests.includes(i))
      const mentorWords = keywords(`${mentor.goals} ${mentor.bio}`)
      const goalOverlap = [...menteeWords].filter((w) => mentorWords.has(w)).length
      const sameMajor = mentee.major && mentor.major && mentee.major.toLowerCase() === mentor.major.toLowerCase()
      const activeMentees = activeMenteeCounts.get(mentor.id) ?? 0

      const score = shared.length * 10 + Math.min(goalOverlap, 5) * 2 + (sameMajor ? 3 : 0) - activeMentees * 2
      return { mentor, score, shared, activeMentees }
    })
    .filter((s) => s.shared.length > 0 || s.score > 0)
    .sort((a, b) => b.score - a.score)
}
