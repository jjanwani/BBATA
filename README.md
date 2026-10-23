# Ross Reddit

A closed community for University of Michigan Ross students: mentorship
matching, an anonymous-friendly Q&A forum, a shared events feed, and a
resources hub. Built from the *Ross Reddit* product requirements doc.

**Stack:** Next.js 16 (App Router, Server Actions) · Supabase (Postgres, Auth,
Realtime) · Tailwind CSS v4. Works on phones (bottom tab bar) and desktop.

## Features

| PRD feature | What's built |
|---|---|
| **Auth** | Google sign-in. Only `@umich.edu` accounts can join; this is enforced in the database (`handle_new_user` trigger), not just the UI. |
| **Profiles** | Name, year, major, career interests, goals, bio, LinkedIn, and mentee/mentor status. Every new user goes through onboarding first. |
| **A. Mentorship matching** | Ranks mentors who are further along than you, by shared interests, then overlapping goals/major, and favors mentors with fewer current mentees so attention spreads out (`src/lib/matching.ts`). You send a request with an intro note; the mentor accepts or declines; accepted pairs get a live 1:1 chat plus email/LinkedIn links. Only juniors, seniors, and grad students can mentor. |
| **B. Q&A forum** | Questions and answers with tags (#consulting, #IB, #PM, #clubs…), upvotes, search, Top/New sorting, and Unanswered/My questions filters. **Anonymous posting**: other students never receive the author's name or id. Moderators can see it. **Quality control**: mentors and moderators can mark an answer "Endorsed by a mentor", which pins it to the top. Anyone can report content. |
| **C. Events feed** | Upcoming/past events grouped by day, filterable by Recruiting / Networking / Academic / Social, with RSVPs (counted per event), a "My RSVPs" view, and "Add to Google Calendar". Mentors and moderators can post events. Times are entered and shown in Michigan time. |
| **D. Resources hub** | Searchable links (guides, syllabi, Drive folders) by category and tag, with favorites. Anyone can share; resources from mentors/moderators publish immediately, everyone else's wait for moderator approval. Mentors and moderators can edit any resource. |
| **Moderation** | `/moderation` (moderators only): reported content grouped by item, with Hide / Keep, plus the resource approval queue and a list of hidden content to restore. |

Not built yet (PRD "Future features", plus push/email notifications): AI mentor
suggestions, resume feedback hub, CDO integration, badges, and notifications
for new matches/replies/event reminders.

## Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com).
2. **Run the schema.** In the Supabase SQL editor, run
   [`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql)
   (or `supabase db push` with the Supabase CLI).
3. **Turn on Google sign-in.** Supabase → Authentication → Providers → Google.
   Create an OAuth client in Google Cloud Console and paste in its client
   ID/secret. Under Authentication → URL Configuration, set the Site URL to your
   deployed URL and add `http://localhost:3000/auth/callback` plus
   `https://<your-domain>/auth/callback` to the redirect URLs.
4. **Configure the app.**
   ```bash
   cp .env.example .env.local   # fill in your project URL and anon key
   npm install
   npm run dev                  # http://localhost:3000
   ```
5. **Deploy** to Vercel (import the repo and add the same two env vars).

### Making someone a moderator

Moderators (faculty/staff or trusted students) are set in SQL only, so nobody
can promote themselves:

```sql
update profiles set is_moderator = true where email = 'someone@umich.edu';
```

## How permissions work

Postgres Row-Level Security is the real security boundary. Buttons hidden in
the UI are only for convenience. Highlights:

- `posts`/`answers` rows (which store the real author) are readable only by
  their author and moderators. Everyone else reads through the `post_feed` /
  `answer_feed` views, which blank out the author of anonymous content and drop
  hidden content. (Supabase's advisor flags these as "security definer" views.
  That's intentional: they apply those rules themselves.)
- Users can edit their own profile but not `is_moderator` or `email`.
- Mentor requests are validated in the database: the mentor has to be mentoring
  and further along than the mentee. Only the mentor can accept, and messages
  can only be read or sent once a match is accepted.
- Endorsing answers, hiding content, and approving resources go through
  database functions that check the caller's role.

## Project layout

```
src/
  app/
    (app)/            signed-in pages: home, forum, mentors, events,
                      resources, people, profile, moderation
                      (each feature has its own actions.ts of Server Actions)
    login/, auth/     Google sign-in, OAuth callback, sign-out, error page
    onboarding/       first-time profile setup
  components/         shared UI (cards, vote/RSVP buttons, chat, forms)
  lib/                Supabase clients, auth helper, matching, Michigan-time helpers
  proxy.ts            sends signed-out visitors to /login (Next 16's "middleware")
supabase/migrations/  database schema + RLS policies
```
