export const INTERESTS = [
  'consulting',
  'finance',
  'investment banking',
  'tech',
  'product management',
  'marketing',
  'entrepreneurship',
  'accounting',
  'supply chain',
  'real estate',
  'nonprofit',
  'law school',
] as const

export const FORUM_TAGS = [
  'consulting',
  'IB',
  'PM',
  'tech',
  'finance',
  'clubs',
  'internships',
  'classes',
  'recruiting',
  'BBA application',
  'resume',
] as const

export const CLASS_YEARS = {
  first_year: 'First year',
  sophomore: 'Sophomore',
  junior: 'Junior',
  senior: 'Senior',
  graduate: 'Graduate / MBA',
} as const
export type ClassYear = keyof typeof CLASS_YEARS

export const YEAR_RANK: Record<ClassYear, number> = {
  first_year: 1,
  sophomore: 2,
  junior: 3,
  senior: 4,
  graduate: 5,
}

export const MENTOR_ELIGIBLE: ClassYear[] = ['junior', 'senior', 'graduate']

export const MENTOR_STATUS = {
  mentee: 'Looking for a mentor',
  mentor: 'Mentoring',
  both: 'Mentoring & looking for a mentor',
} as const
export type MentorStatus = keyof typeof MENTOR_STATUS

export const EVENT_TYPES = {
  recruiting: { label: 'Recruiting', className: 'bg-blue-100 text-blue-800' },
  networking: { label: 'Networking', className: 'bg-emerald-100 text-emerald-800' },
  academic: { label: 'Academic', className: 'bg-purple-100 text-purple-800' },
  social: { label: 'Social', className: 'bg-orange-100 text-orange-800' },
} as const
export type EventType = keyof typeof EVENT_TYPES

export const RESOURCE_CATEGORIES = {
  consulting: 'Consulting',
  tech: 'Tech',
  finance: 'Finance',
  entrepreneurship: 'Entrepreneurship',
  academics: 'Academics',
  general: 'General',
} as const
export type ResourceCategory = keyof typeof RESOURCE_CATEGORIES
