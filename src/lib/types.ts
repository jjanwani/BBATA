import type { ClassYear, EventType, MentorStatus, ResourceCategory } from './constants'

export type Profile = {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  class_year: ClassYear | null
  major: string
  interests: string[]
  goals: string
  bio: string
  linkedin_url: string | null
  mentor_status: MentorStatus
  is_moderator: boolean
  onboarded: boolean
  created_at: string
}

export type FeedPost = {
  id: string
  author_id: string | null
  author_name: string | null
  author_avatar: string | null
  author_mentor_status: MentorStatus | null
  is_mine: boolean
  title: string
  body: string
  tags: string[]
  is_anonymous: boolean
  is_hidden: boolean
  created_at: string
  updated_at: string
  upvotes: number
  has_voted: boolean
  answer_count: number
  has_endorsed: boolean
}

export type FeedAnswer = {
  id: string
  post_id: string
  author_id: string | null
  author_name: string | null
  author_avatar: string | null
  author_mentor_status: MentorStatus | null
  is_mine: boolean
  body: string
  is_anonymous: boolean
  is_endorsed: boolean
  is_hidden: boolean
  created_at: string
  upvotes: number
  has_voted: boolean
}

export type FeedEvent = {
  id: string
  title: string
  description: string
  event_type: EventType
  host: string
  location: string
  link: string | null
  starts_at: string
  ends_at: string | null
  tags: string[]
  created_by: string | null
  rsvp_count: number
  has_rsvped: boolean
}

export type FeedResource = {
  id: string
  title: string
  description: string
  url: string
  category: ResourceCategory
  tags: string[]
  uploader_id: string | null
  uploader_name: string | null
  is_approved: boolean
  created_at: string
  upvotes: number
  has_voted: boolean
}

export type Match = {
  id: string
  mentee_id: string
  mentor_id: string
  status: 'pending' | 'accepted' | 'declined'
  shared_interests: string[]
  intro_message: string
  created_at: string
  responded_at: string | null
}

export type Message = {
  id: string
  match_id: string
  sender_id: string
  body: string
  created_at: string
}

export type ActionState = { error?: string; ok?: boolean } | undefined

export type MentorLoad = { mentor_id: string; active_mentees: number }
