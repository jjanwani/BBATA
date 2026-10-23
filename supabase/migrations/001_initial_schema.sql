-- Ross Reddit — initial schema
-- Postgres Row-Level Security is the real authorization boundary.
-- The UI hides buttons for convenience only; every rule is enforced here.

-- ───────────────────────────── Profiles ─────────────────────────────

create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  email         text not null unique,
  full_name     text not null default '',
  avatar_url    text,
  class_year    text check (class_year in ('first_year', 'sophomore', 'junior', 'senior', 'graduate')),
  major         text not null default '',
  interests     text[] not null default '{}',
  goals         text not null default '',
  bio           text not null default '',
  linkedin_url  text,
  -- mentee: looking for a mentor; mentor: offering mentorship; both: either
  mentor_status text not null default 'mentee' check (mentor_status in ('mentee', 'mentor', 'both')),
  -- Faculty/staff or trusted student moderators. Set by SQL only (see README).
  is_moderator  boolean not null default false,
  onboarded     boolean not null default false,
  created_at    timestamptz not null default now(),
  -- Only upperclassmen (juniors and up) can mentor.
  constraint mentors_are_upperclassmen check (
    mentor_status = 'mentee' or class_year in ('junior', 'senior', 'graduate')
  )
);

-- Rank used by matching: a mentor must be further along than their mentee.
create or replace function public.year_rank(y text)
returns int language sql immutable as $$
  select case y
    when 'first_year' then 1 when 'sophomore' then 2 when 'junior' then 3
    when 'senior' then 4 when 'graduate' then 5 else 0 end
$$;

create or replace function public.is_moderator()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_moderator from profiles where id = auth.uid()), false)
$$;

-- Trusted contributors: mentors and moderators (PRD: "mentors/faculty").
create or replace function public.is_trusted()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(
    (select is_moderator or mentor_status in ('mentor', 'both') from profiles where id = auth.uid()),
    false)
$$;

alter table public.profiles enable row level security;

create policy profiles_select on public.profiles
  for select to authenticated using (true);
create policy profiles_update_own on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Users may edit their own profile fields, but never is_moderator/email.
revoke update on public.profiles from authenticated;
grant update (full_name, avatar_url, class_year, major, interests, goals, bio,
              linkedin_url, mentor_status, onboarded)
  on public.profiles to authenticated;

-- First sign-in: only @umich.edu accounts may join.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.email is null or lower(new.email) not like '%@umich.edu' then
    raise exception 'Ross Reddit is only open to @umich.edu accounts';
  end if;

  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    lower(new.email),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────────────────────────── Q&A forum ─────────────────────────────

create table public.posts (
  id           uuid primary key default gen_random_uuid(),
  author_id    uuid not null references public.profiles (id) on delete cascade,
  title        text not null check (char_length(title) between 5 and 200),
  body         text not null default '' check (char_length(body) <= 10000),
  tags         text[] not null default '{}',
  is_anonymous boolean not null default false,
  is_hidden    boolean not null default false,  -- set by moderators
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index posts_created_idx on public.posts (created_at desc);
create index posts_tags_idx on public.posts using gin (tags);

create table public.answers (
  id           uuid primary key default gen_random_uuid(),
  post_id      uuid not null references public.posts (id) on delete cascade,
  author_id    uuid not null references public.profiles (id) on delete cascade,
  body         text not null check (char_length(body) between 1 and 10000),
  is_anonymous boolean not null default false,
  is_endorsed  boolean not null default false,  -- set by mentors/moderators
  is_hidden    boolean not null default false,  -- set by moderators
  created_at   timestamptz not null default now()
);
create index answers_post_idx on public.answers (post_id, created_at);

create table public.post_votes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  primary key (post_id, user_id)
);

create table public.answer_votes (
  answer_id uuid not null references public.answers (id) on delete cascade,
  user_id   uuid not null references public.profiles (id) on delete cascade,
  primary key (answer_id, user_id)
);

alter table public.posts enable row level security;
alter table public.answers enable row level security;
alter table public.post_votes enable row level security;
alter table public.answer_votes enable row level security;

-- Raw rows (which carry the real author_id) are only readable by their
-- author and moderators. Everyone else reads through post_feed/answer_feed,
-- which blank out the author of anonymous content.
create policy posts_select on public.posts for select to authenticated
  using (author_id = auth.uid() or public.is_moderator());
create policy posts_insert on public.posts for insert to authenticated
  with check (author_id = auth.uid());
create policy posts_update on public.posts for update to authenticated
  using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy posts_delete on public.posts for delete to authenticated
  using (author_id = auth.uid() or public.is_moderator());
revoke update on public.posts from authenticated;
grant update (title, body, tags, updated_at) on public.posts to authenticated;

create policy answers_select on public.answers for select to authenticated
  using (author_id = auth.uid() or public.is_moderator());
create policy answers_insert on public.answers for insert to authenticated
  with check (author_id = auth.uid());
create policy answers_update on public.answers for update to authenticated
  using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy answers_delete on public.answers for delete to authenticated
  using (author_id = auth.uid() or public.is_moderator());
revoke update on public.answers from authenticated;
grant update (body) on public.answers to authenticated;

create policy post_votes_select on public.post_votes for select to authenticated using (true);
create policy post_votes_insert on public.post_votes for insert to authenticated with check (user_id = auth.uid());
create policy post_votes_delete on public.post_votes for delete to authenticated using (user_id = auth.uid());

create policy answer_votes_select on public.answer_votes for select to authenticated using (true);
create policy answer_votes_insert on public.answer_votes for insert to authenticated with check (user_id = auth.uid());
create policy answer_votes_delete on public.answer_votes for delete to authenticated using (user_id = auth.uid());

-- These views run with the owner's rights (bypassing the RLS above), so
-- they apply the visibility rules themselves: signed-in users only, hidden
-- content only for its author/moderators, anonymous authors blanked.
create view public.post_feed as
select
  p.id,
  case when p.is_anonymous and p.author_id <> auth.uid() and not public.is_moderator()
       then null else p.author_id end as author_id,
  case when p.is_anonymous and p.author_id <> auth.uid() and not public.is_moderator()
       then null else pr.full_name end as author_name,
  case when p.is_anonymous and p.author_id <> auth.uid() and not public.is_moderator()
       then null else pr.avatar_url end as author_avatar,
  case when p.is_anonymous and p.author_id <> auth.uid() and not public.is_moderator()
       then null else pr.mentor_status end as author_mentor_status,
  p.author_id = auth.uid() as is_mine,
  p.title, p.body, p.tags, p.is_anonymous, p.is_hidden, p.created_at, p.updated_at,
  (select count(*) from public.post_votes v where v.post_id = p.id)::int as upvotes,
  exists (select 1 from public.post_votes v where v.post_id = p.id and v.user_id = auth.uid()) as has_voted,
  (select count(*) from public.answers a where a.post_id = p.id and not a.is_hidden)::int as answer_count,
  exists (select 1 from public.answers a where a.post_id = p.id and a.is_endorsed and not a.is_hidden) as has_endorsed
from public.posts p
join public.profiles pr on pr.id = p.author_id
where auth.uid() is not null
  and (not p.is_hidden or p.author_id = auth.uid() or public.is_moderator());

create view public.answer_feed as
select
  a.id, a.post_id,
  case when a.is_anonymous and a.author_id <> auth.uid() and not public.is_moderator()
       then null else a.author_id end as author_id,
  case when a.is_anonymous and a.author_id <> auth.uid() and not public.is_moderator()
       then null else pr.full_name end as author_name,
  case when a.is_anonymous and a.author_id <> auth.uid() and not public.is_moderator()
       then null else pr.avatar_url end as author_avatar,
  case when a.is_anonymous and a.author_id <> auth.uid() and not public.is_moderator()
       then null else pr.mentor_status end as author_mentor_status,
  a.author_id = auth.uid() as is_mine,
  a.body, a.is_anonymous, a.is_endorsed, a.is_hidden, a.created_at,
  (select count(*) from public.answer_votes v where v.answer_id = a.id)::int as upvotes,
  exists (select 1 from public.answer_votes v where v.answer_id = a.id and v.user_id = auth.uid()) as has_voted
from public.answers a
join public.profiles pr on pr.id = a.author_id
where auth.uid() is not null
  and (not a.is_hidden or a.author_id = auth.uid() or public.is_moderator());

revoke all on public.post_feed, public.answer_feed from anon, public;
grant select on public.post_feed, public.answer_feed to authenticated;

-- Mentors and moderators can mark an answer as endorsed ("quality control").
create or replace function public.set_answer_endorsed(p_answer_id uuid, p_endorsed boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_trusted() then
    raise exception 'Only mentors and moderators can endorse answers';
  end if;
  update answers set is_endorsed = p_endorsed where id = p_answer_id;
end;
$$;

-- ───────────────────────────── Moderation ─────────────────────────────

create table public.flags (
  id          uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('post', 'answer', 'resource')),
  target_id   uuid not null,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reason      text not null check (char_length(reason) between 1 and 500),
  status      text not null default 'open' check (status in ('open', 'resolved')),
  created_at  timestamptz not null default now(),
  unique (target_type, target_id, reporter_id)
);

alter table public.flags enable row level security;
create policy flags_insert on public.flags for insert to authenticated with check (reporter_id = auth.uid());
create policy flags_select on public.flags for select to authenticated
  using (reporter_id = auth.uid() or public.is_moderator());
create policy flags_update on public.flags for update to authenticated using (public.is_moderator());
revoke update on public.flags from authenticated;
grant update (status) on public.flags to authenticated;

create or replace function public.moderate_set_hidden(p_type text, p_id uuid, p_hidden boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_moderator() then
    raise exception 'Moderators only';
  end if;
  if p_type = 'post' then
    update posts set is_hidden = p_hidden where id = p_id;
  elsif p_type = 'answer' then
    update answers set is_hidden = p_hidden where id = p_id;
  elsif p_type = 'resource' then
    update resources set is_approved = not p_hidden where id = p_id;
  else
    raise exception 'Unknown content type %', p_type;
  end if;
  if p_hidden then
    update flags set status = 'resolved' where target_type = p_type and target_id = p_id;
  end if;
end;
$$;

-- ─────────────────────────── Events feed ───────────────────────────

create table public.events (
  id          uuid primary key default gen_random_uuid(),
  title       text not null check (char_length(title) between 3 and 200),
  description text not null default '',
  event_type  text not null check (event_type in ('recruiting', 'networking', 'academic', 'social')),
  host        text not null default '',          -- club or person hosting
  location    text not null default '',
  link        text,                              -- RSVP / sign-up / Zoom link
  starts_at   timestamptz not null,
  ends_at     timestamptz,
  tags        text[] not null default '{}',
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  check (ends_at is null or ends_at >= starts_at)
);
create index events_starts_idx on public.events (starts_at);

create table public.event_rsvps (
  event_id uuid not null references public.events (id) on delete cascade,
  user_id  uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

alter table public.events enable row level security;
alter table public.event_rsvps enable row level security;

create policy events_select on public.events for select to authenticated using (true);
-- PRD: "clubs or mentors" post events — mentors and moderators.
create policy events_insert on public.events for insert to authenticated
  with check (created_by = auth.uid() and public.is_trusted());
create policy events_update on public.events for update to authenticated
  using (created_by = auth.uid() or public.is_moderator());
create policy events_delete on public.events for delete to authenticated
  using (created_by = auth.uid() or public.is_moderator());

create policy rsvps_select on public.event_rsvps for select to authenticated using (true);
create policy rsvps_insert on public.event_rsvps for insert to authenticated with check (user_id = auth.uid());
create policy rsvps_delete on public.event_rsvps for delete to authenticated using (user_id = auth.uid());

create view public.event_feed with (security_invoker = true) as
select e.*,
  (select count(*) from public.event_rsvps r where r.event_id = e.id)::int as rsvp_count,
  exists (select 1 from public.event_rsvps r where r.event_id = e.id and r.user_id = auth.uid()) as has_rsvped
from public.events e;
grant select on public.event_feed to authenticated;

-- ─────────────────────────── Resources hub ───────────────────────────

create table public.resources (
  id          uuid primary key default gen_random_uuid(),
  title       text not null check (char_length(title) between 3 and 200),
  description text not null default '',
  url         text not null check (url ~* '^https?://'),
  category    text not null check (category in ('consulting', 'tech', 'finance', 'entrepreneurship', 'academics', 'general')),
  tags        text[] not null default '{}',
  uploader_id uuid references public.profiles (id) on delete set null,
  is_approved boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.resource_votes (
  resource_id uuid not null references public.resources (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  primary key (resource_id, user_id)
);

alter table public.resources enable row level security;
alter table public.resource_votes enable row level security;

-- Anyone can contribute; contributions from mentors/moderators are
-- auto-approved, everything else waits in the moderation queue.
create or replace function public.resources_set_approval()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.is_approved := public.is_trusted();
  return new;
end;
$$;
create trigger resources_before_insert before insert on public.resources
  for each row execute function public.resources_set_approval();

create policy resources_select on public.resources for select to authenticated
  using (is_approved or uploader_id = auth.uid() or public.is_moderator());
create policy resources_insert on public.resources for insert to authenticated
  with check (uploader_id = auth.uid());
-- PRD: "Editable by trusted contributors (mentors/faculty)".
create policy resources_update on public.resources for update to authenticated
  using (uploader_id = auth.uid() or public.is_trusted());
create policy resources_delete on public.resources for delete to authenticated
  using (uploader_id = auth.uid() or public.is_moderator());
revoke update on public.resources from authenticated;
grant update (title, description, url, category, tags, updated_at) on public.resources to authenticated;

create policy resource_votes_select on public.resource_votes for select to authenticated using (true);
create policy resource_votes_insert on public.resource_votes for insert to authenticated with check (user_id = auth.uid());
create policy resource_votes_delete on public.resource_votes for delete to authenticated using (user_id = auth.uid());

create view public.resource_feed with (security_invoker = true) as
select r.*,
  pr.full_name as uploader_name,
  (select count(*) from public.resource_votes v where v.resource_id = r.id)::int as upvotes,
  exists (select 1 from public.resource_votes v where v.resource_id = r.id and v.user_id = auth.uid()) as has_voted
from public.resources r
left join public.profiles pr on pr.id = r.uploader_id;
grant select on public.resource_feed to authenticated;

create or replace function public.approve_resource(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_moderator() then
    raise exception 'Moderators only';
  end if;
  update resources set is_approved = true where id = p_id;
end;
$$;

-- ─────────────────────────── Mentorship ───────────────────────────

create table public.matches (
  id               uuid primary key default gen_random_uuid(),
  mentee_id        uuid not null references public.profiles (id) on delete cascade,
  mentor_id        uuid not null references public.profiles (id) on delete cascade,
  status           text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  shared_interests text[] not null default '{}',
  intro_message    text not null default '' check (char_length(intro_message) <= 1000),
  created_at       timestamptz not null default now(),
  responded_at     timestamptz,
  unique (mentee_id, mentor_id),
  check (mentee_id <> mentor_id)
);

-- Validate the pairing and record what the two have in common.
create or replace function public.matches_before_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  mentee profiles;
  mentor profiles;
begin
  select * into mentee from profiles where id = new.mentee_id;
  select * into mentor from profiles where id = new.mentor_id;
  if mentor.mentor_status not in ('mentor', 'both') then
    raise exception 'That person is not currently mentoring';
  end if;
  if public.year_rank(mentor.class_year) <= public.year_rank(mentee.class_year) then
    raise exception 'Mentors must be further along than their mentee';
  end if;
  new.status := 'pending';
  new.responded_at := null;
  new.shared_interests := array(
    select unnest(mentee.interests) intersect select unnest(mentor.interests)
  );
  return new;
end;
$$;
create trigger matches_before_insert before insert on public.matches
  for each row execute function public.matches_before_insert();

alter table public.matches enable row level security;
create policy matches_select on public.matches for select to authenticated
  using (auth.uid() in (mentee_id, mentor_id));
create policy matches_insert on public.matches for insert to authenticated
  with check (mentee_id = auth.uid());
-- Only the mentor answers a request.
create policy matches_update on public.matches for update to authenticated
  using (mentor_id = auth.uid()) with check (mentor_id = auth.uid());
-- Either side can end the match.
create policy matches_delete on public.matches for delete to authenticated
  using (auth.uid() in (mentee_id, mentor_id));
revoke update on public.matches from authenticated;
grant update (status, responded_at) on public.matches to authenticated;

-- Active mentee count per mentor, so matching can spread mentees out.
-- Exposes counts only, never who is matched with whom.
create or replace function public.mentor_load()
returns table (mentor_id uuid, active_mentees int)
language sql stable security definer set search_path = public as $$
  select mentor_id, count(*)::int from matches
  where status = 'accepted' and auth.uid() is not null
  group by mentor_id
$$;

create table public.messages (
  id         uuid primary key default gen_random_uuid(),
  match_id   uuid not null references public.matches (id) on delete cascade,
  sender_id  uuid not null references public.profiles (id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index messages_match_idx on public.messages (match_id, created_at);

alter table public.messages enable row level security;

create or replace function public.in_accepted_match(p_match_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from matches
    where id = p_match_id and status = 'accepted' and auth.uid() in (mentee_id, mentor_id)
  )
$$;

-- Chat opens once the mentor accepts (PRD: chat_enabled).
create policy messages_select on public.messages for select to authenticated
  using (public.in_accepted_match(match_id));
create policy messages_insert on public.messages for insert to authenticated
  with check (sender_id = auth.uid() and public.in_accepted_match(match_id));

-- Live chat updates.
alter publication supabase_realtime add table public.messages;
