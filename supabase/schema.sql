-- Racked schema: run this in the Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- Safe to re-run in full: tables use IF NOT EXISTS, policies are dropped and recreated,
-- functions/triggers use CREATE OR REPLACE / DROP ... IF EXISTS.

-- =========================================
-- profiles
-- =========================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- used for strength-standard percentile / rank calculations
alter table public.profiles add column if not exists sex text check (sex in ('male', 'female'));
alter table public.profiles add column if not exists age int check (age > 0 and age < 120);

-- display-only preference — every stored/computed weight stays in kg
-- regardless of this setting
alter table public.profiles add column if not exists weight_unit text not null default 'kg' check (weight_unit in ('kg', 'lbs'));

-- grants access to /admin (report review, moderation tools) — set manually,
-- there is no in-app way to grant this to another account
alter table public.profiles add column if not exists is_admin boolean not null default false;

-- Private account: following needs approval, and the follower/following
-- lists and public plans are only visible to approved followers. Accounts
-- that existed before this column stayed public; new sign-ups default to
-- private (the default flips after the column has been added).
alter table public.profiles add column if not exists is_private boolean not null default false;
alter table public.profiles alter column is_private set default true;

alter table public.profiles enable row level security;

drop policy if exists "profiles are viewable by any authenticated user" on public.profiles;
create policy "profiles are viewable by any authenticated user"
  on public.profiles for select
  to authenticated
  using (true);

-- profiles are only ever created by the handle_new_user() trigger below
drop policy if exists "users can insert their own profile" on public.profiles;

drop policy if exists "users can update their own profile" on public.profiles;
create policy "users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Column-level privileges on top of RLS: RLS decides WHICH rows, these
-- decide WHICH columns. Without them a user could update their own
-- is_admin/username, and read every other user's sex/age/is_admin.
-- Your own private columns are read via my_private_profile() instead.
revoke insert, update on public.profiles from anon, authenticated;
grant update (display_name, avatar_url, sex, age, weight_unit, is_private) on public.profiles to authenticated;
revoke select on public.profiles from anon, authenticated;
grant select (id, username, display_name, avatar_url, weight_unit, created_at, is_private) on public.profiles to authenticated;

alter table public.profiles drop constraint if exists profiles_display_name_length;
alter table public.profiles add constraint profiles_display_name_length
  check (display_name is null or char_length(display_name) <= 50) not valid;

create or replace function public.my_private_profile()
returns table (sex text, age int, is_admin boolean)
language sql stable security definer set search_path = public
as $$
  select p.sex, p.age, p.is_admin from public.profiles p where p.id = auth.uid();
$$;
revoke all on function public.my_private_profile() from public, anon;
grant execute on function public.my_private_profile() to authenticated;

-- Admin actions require both the is_admin flag and a two-factor (aal2) session.
create or replace function public.is_admin_with_mfa()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce(auth.jwt() ->> 'aal', '') = 'aal2'
     and exists (select 1 from public.profiles where id = auth.uid() and is_admin);
$$;
revoke all on function public.is_admin_with_mfa() from public, anon;
grant execute on function public.is_admin_with_mfa() to authenticated;

-- Visibility helpers used by RLS policies throughout this file. plpgsql so
-- they can be defined before the follows/blocks tables they query exist.
-- Both only ever answer questions about the CALLER's own relationships.
create or replace function public.blocked_with(other uuid)
returns boolean
language plpgsql stable security definer set search_path = public
as $$
begin
  return exists (
    select 1 from public.blocks
    where (blocker_id = auth.uid() and blocked_id = other)
       or (blocker_id = other and blocked_id = auth.uid())
  );
end;
$$;

create or replace function public.can_see_workout_of(owner_id uuid, workout_is_public boolean)
returns boolean
language plpgsql stable security definer set search_path = public
as $$
begin
  if owner_id = auth.uid() then
    return true;
  end if;
  return workout_is_public
    and not public.blocked_with(owner_id)
    and exists (select 1 from public.follows f where f.follower_id = auth.uid() and f.following_id = owner_id);
end;
$$;

create or replace function public.is_private_account(p_user_id uuid)
returns boolean
language plpgsql stable security definer set search_path = public
as $$
begin
  return coalesce((select is_private from public.profiles where id = p_user_id), false);
end;
$$;

-- Whether the caller may see a user's followers/following lists and public
-- plans: it's you, the account is public, or you're an approved follower.
create or replace function public.can_see_profile_details(owner_id uuid)
returns boolean
language plpgsql stable security definer set search_path = public
as $$
begin
  return owner_id = auth.uid()
    or not public.is_private_account(owner_id)
    or exists (select 1 from public.follows f where f.follower_id = auth.uid() and f.following_id = owner_id);
end;
$$;

-- auto-create a profile row whenever a new auth user signs up.
-- collision-proof: falls back to base_username_1, _2, ... if the derived
-- username is already taken, instead of throwing a unique-violation that
-- surfaces to the client as an opaque "Database error saving new user".
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  base_username text;
  final_username text;
  suffix int := 0;
begin
  base_username := coalesce(nullif(new.raw_user_meta_data->>'username', ''), split_part(new.email, '@', 1));
  base_username := regexp_replace(lower(base_username), '[^a-z0-9_]', '', 'g');
  if base_username = '' then
    base_username := 'user';
  end if;

  final_username := base_username;
  while exists (select 1 from public.profiles where username = final_username) loop
    suffix := suffix + 1;
    final_username := base_username || '_' || suffix::text;
  end loop;

  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    final_username,
    coalesce(nullif(new.raw_user_meta_data->>'display_name', ''), base_username)
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =========================================
-- exercises (shared library + user-created custom exercises)
-- =========================================
create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text, -- e.g. 'chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio'
  equipment text, -- e.g. 'barbell', 'dumbbell', 'machine', 'bodyweight', 'weighted_bodyweight'
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.exercises enable row level security;

-- Custom exercises used to be visible (and name-squattable) for everyone.
-- Names now only need to be unique within the shared library, or within
-- one user's own custom exercises. The select policy lives after the
-- workout_template_exercises section, since it references that table.
drop policy if exists "exercises are viewable by any authenticated user" on public.exercises;
alter table public.exercises drop constraint if exists exercises_name_key;
create unique index if not exists exercises_library_name_key on public.exercises (name) where created_by is null;
create unique index if not exists exercises_custom_name_key on public.exercises (created_by, name) where created_by is not null;
alter table public.exercises drop constraint if exists exercises_name_length;
alter table public.exercises add constraint exercises_name_length
  check (char_length(name) between 1 and 80) not valid;

drop policy if exists "users can create custom exercises" on public.exercises;
create policy "users can create custom exercises"
  on public.exercises for insert
  to authenticated
  with check (created_by = auth.uid());

-- =========================================
-- follows (friend graph, directional)
-- =========================================
create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

alter table public.follows enable row level security;

-- A private account's follower/following lists are only visible to its
-- approved followers (counts stay public via follow_counts() below).
drop policy if exists "follow edges are viewable by any authenticated user" on public.follows;
drop policy if exists "follow edges are viewable unless an account is private" on public.follows;
create policy "follow edges are viewable unless an account is private"
  on public.follows for select
  to authenticated
  using (
    follower_id = auth.uid()
    or following_id = auth.uid()
    or (public.can_see_profile_details(follower_id) and public.can_see_profile_details(following_id))
  );

-- Private accounts can't be followed directly — that goes through
-- follow_requests and accept_follow_request() instead.
drop policy if exists "users can follow as themselves" on public.follows;
create policy "users can follow as themselves"
  on public.follows for insert
  to authenticated
  with check (
    follower_id = auth.uid()
    and not public.blocked_with(following_id)
    and not public.is_private_account(following_id)
  );

drop policy if exists "users can unfollow as themselves" on public.follows;
create policy "users can unfollow as themselves"
  on public.follows for delete
  to authenticated
  using (follower_id = auth.uid());

create or replace function public.follow_counts(p_user_id uuid)
returns table (followers bigint, following bigint)
language sql stable security definer set search_path = public
as $$
  select (select count(*) from public.follows where following_id = p_user_id),
         (select count(*) from public.follows where follower_id = p_user_id);
$$;
revoke all on function public.follow_counts(uuid) from public, anon;
grant execute on function public.follow_counts(uuid) to authenticated;

-- =========================================
-- follow_requests (pending follows of private accounts)
-- =========================================
create table if not exists public.follow_requests (
  requester_id uuid not null references public.profiles(id) on delete cascade,
  target_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (requester_id, target_id),
  check (requester_id <> target_id)
);

alter table public.follow_requests enable row level security;

drop policy if exists "users can view requests they sent or received" on public.follow_requests;
create policy "users can view requests they sent or received"
  on public.follow_requests for select
  to authenticated
  using (requester_id = auth.uid() or target_id = auth.uid());

drop policy if exists "users can request to follow private accounts" on public.follow_requests;
create policy "users can request to follow private accounts"
  on public.follow_requests for insert
  to authenticated
  with check (
    requester_id = auth.uid()
    and public.is_private_account(target_id)
    and not public.blocked_with(target_id)
  );

-- the requester cancels, or the target declines
drop policy if exists "either side can remove a request" on public.follow_requests;
create policy "either side can remove a request"
  on public.follow_requests for delete
  to authenticated
  using (requester_id = auth.uid() or target_id = auth.uid());

-- Accepting creates a follows row owned by the REQUESTER, which RLS would
-- never let the target insert directly — hence a narrow definer function.
create or replace function public.accept_follow_request(p_requester_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not exists (
    select 1 from public.follow_requests where requester_id = p_requester_id and target_id = auth.uid()
  ) then
    raise exception 'No such follow request';
  end if;

  if not public.blocked_with(p_requester_id) then
    insert into public.follows (follower_id, following_id)
    values (p_requester_id, auth.uid())
    on conflict do nothing;
  end if;

  delete from public.follow_requests where requester_id = p_requester_id and target_id = auth.uid();
end;
$$;
revoke all on function public.accept_follow_request(uuid) from public, anon;
grant execute on function public.accept_follow_request(uuid) to authenticated;

-- switching private -> public accepts every pending request
create or replace function public.handle_privacy_change()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if old.is_private and not new.is_private then
    insert into public.follows (follower_id, following_id)
    select r.requester_id, r.target_id from public.follow_requests r
    where r.target_id = new.id and not exists (
      select 1 from public.blocks b
      where (b.blocker_id = r.requester_id and b.blocked_id = r.target_id)
         or (b.blocker_id = r.target_id and b.blocked_id = r.requester_id)
    )
    on conflict do nothing;
    delete from public.follow_requests where target_id = new.id;
  end if;
  return new;
end;
$$;
drop trigger if exists on_privacy_change on public.profiles;
create trigger on_privacy_change after update of is_private on public.profiles
  for each row execute procedure public.handle_privacy_change();

-- =========================================
-- workouts
-- =========================================
create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'Workout',
  notes text,
  photo_url text,
  is_public boolean not null default true,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.workouts add column if not exists is_public boolean not null default true;
alter table public.workouts add column if not exists photo_url text;
alter table public.workouts add column if not exists gym_name text;
alter table public.workouts add column if not exists gym_address text;
alter table public.workouts add column if not exists gym_place_id text;

-- Computed once (in saveWorkout) and stored, instead of recomputed from a
-- caller's full workout history on every read — the Feed used to refetch
-- every unique author's entire history per page view just to badge PRs.
-- Null means "not backfilled yet" (see admin_backfill_pr_counts below), not
-- "zero PRs".
alter table public.workouts add column if not exists pr_count int;

alter table public.workouts enable row level security;

create index if not exists workouts_public_started_idx
  on public.workouts (is_public, started_at desc) where finished_at is not null;
create index if not exists workouts_gym_place_started_idx
  on public.workouts (gym_place_id, started_at desc) where finished_at is not null;
create index if not exists workouts_user_started_idx
  on public.workouts (user_id, started_at desc) where finished_at is not null;

drop policy if exists "users can view own workouts or workouts of people they follow" on public.workouts;
drop policy if exists "users can view own workouts or public workouts of people they follow" on public.workouts;
create policy "users can view own workouts or public workouts of people they follow"
  on public.workouts for select
  to authenticated
  using (public.can_see_workout_of(user_id, is_public));

drop policy if exists "users can insert their own workouts" on public.workouts;
create policy "users can insert their own workouts"
  on public.workouts for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "users can update their own workouts" on public.workouts;
create policy "users can update their own workouts"
  on public.workouts for update
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "users can delete their own workouts" on public.workouts;
create policy "users can delete their own workouts"
  on public.workouts for delete
  to authenticated
  using (user_id = auth.uid());

-- =========================================
-- workout_exercises (an exercise within a workout, in order)
-- =========================================
create table if not exists public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id),
  order_index int not null default 0,
  notes text
);

alter table public.workout_exercises enable row level security;

drop policy if exists "workout_exercises follow parent workout visibility" on public.workout_exercises;
create policy "workout_exercises follow parent workout visibility"
  on public.workout_exercises for select
  to authenticated
  using (
    exists (
      select 1 from public.workouts w
      where w.id = workout_exercises.workout_id and public.can_see_workout_of(w.user_id, w.is_public)
    )
  );

drop policy if exists "users can manage workout_exercises on their own workouts" on public.workout_exercises;
create policy "users can manage workout_exercises on their own workouts"
  on public.workout_exercises for insert
  to authenticated
  with check (
    exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = auth.uid())
  );

drop policy if exists "users can update workout_exercises on their own workouts" on public.workout_exercises;
create policy "users can update workout_exercises on their own workouts"
  on public.workout_exercises for update
  to authenticated
  using (
    exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = auth.uid())
  );

drop policy if exists "users can delete workout_exercises on their own workouts" on public.workout_exercises;
create policy "users can delete workout_exercises on their own workouts"
  on public.workout_exercises for delete
  to authenticated
  using (
    exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = auth.uid())
  );

-- =========================================
-- workout_sets (individual sets within a workout_exercise)
-- =========================================
create table if not exists public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  workout_exercise_id uuid not null references public.workout_exercises(id) on delete cascade,
  set_index int not null default 0,
  weight numeric,
  reps int,
  distance_km numeric,
  duration_seconds int,
  is_warmup boolean not null default false,
  completed boolean not null default true
);

alter table public.workout_sets enable row level security;

drop policy if exists "workout_sets follow parent workout visibility" on public.workout_sets;
create policy "workout_sets follow parent workout visibility"
  on public.workout_sets for select
  to authenticated
  using (
    exists (
      select 1 from public.workout_exercises we
      join public.workouts w on w.id = we.workout_id
      where we.id = workout_sets.workout_exercise_id and public.can_see_workout_of(w.user_id, w.is_public)
    )
  );

drop policy if exists "users can manage workout_sets on their own workouts" on public.workout_sets;
create policy "users can manage workout_sets on their own workouts"
  on public.workout_sets for insert
  to authenticated
  with check (
    exists (
      select 1 from public.workout_exercises we
      join public.workouts w on w.id = we.workout_id
      where we.id = workout_exercise_id and w.user_id = auth.uid()
    )
  );

drop policy if exists "users can update workout_sets on their own workouts" on public.workout_sets;
create policy "users can update workout_sets on their own workouts"
  on public.workout_sets for update
  to authenticated
  using (
    exists (
      select 1 from public.workout_exercises we
      join public.workouts w on w.id = we.workout_id
      where we.id = workout_exercise_id and w.user_id = auth.uid()
    )
  );

drop policy if exists "users can delete workout_sets on their own workouts" on public.workout_sets;
create policy "users can delete workout_sets on their own workouts"
  on public.workout_sets for delete
  to authenticated
  using (
    exists (
      select 1 from public.workout_exercises we
      join public.workouts w on w.id = we.workout_id
      where we.id = workout_exercise_id and w.user_id = auth.uid()
    )
  );

-- =========================================
-- workout_likes
-- =========================================
create table if not exists public.workout_likes (
  workout_id uuid not null references public.workouts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (workout_id, user_id)
);

alter table public.workout_likes enable row level security;

drop policy if exists "workout_likes follow parent workout visibility" on public.workout_likes;
create policy "workout_likes follow parent workout visibility"
  on public.workout_likes for select
  to authenticated
  using (
    exists (
      select 1 from public.workouts w
      where w.id = workout_likes.workout_id and public.can_see_workout_of(w.user_id, w.is_public)
    )
  );

drop policy if exists "users can like visible workouts as themselves" on public.workout_likes;
create policy "users can like visible workouts as themselves"
  on public.workout_likes for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.workouts w
      where w.id = workout_id and public.can_see_workout_of(w.user_id, w.is_public)
    )
  );

drop policy if exists "users can unlike their own likes" on public.workout_likes;
create policy "users can unlike their own likes"
  on public.workout_likes for delete
  to authenticated
  using (user_id = auth.uid());

-- =========================================
-- workout_comments
-- =========================================
create table if not exists public.workout_comments (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.workout_comments enable row level security;

drop policy if exists "workout_comments follow parent workout visibility" on public.workout_comments;
create policy "workout_comments follow parent workout visibility"
  on public.workout_comments for select
  to authenticated
  using (
    exists (
      select 1 from public.workouts w
      where w.id = workout_comments.workout_id and public.can_see_workout_of(w.user_id, w.is_public)
    )
  );

drop policy if exists "users can comment on visible workouts as themselves" on public.workout_comments;
create policy "users can comment on visible workouts as themselves"
  on public.workout_comments for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and length(trim(body)) > 0
    and exists (
      select 1 from public.workouts w
      where w.id = workout_id and public.can_see_workout_of(w.user_id, w.is_public)
    )
  );

alter table public.workout_comments drop constraint if exists workout_comments_body_length;
alter table public.workout_comments add constraint workout_comments_body_length
  check (char_length(body) <= 500) not valid;

drop policy if exists "users can delete their own comments" on public.workout_comments;
create policy "users can delete their own comments"
  on public.workout_comments for delete
  to authenticated
  using (user_id = auth.uid());

-- =========================================
-- notifications (likes/comments/follows — recipient-only reads)
-- =========================================
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  workout_id uuid references public.workouts(id) on delete cascade,
  comment_id uuid references public.workout_comments(id) on delete cascade,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

drop policy if exists "users can view their own notifications" on public.notifications;
create policy "users can view their own notifications"
  on public.notifications for select
  to authenticated
  using (user_id = auth.uid());

-- No client insert policy: notifications are written only by the triggers
-- below. A client-side insert policy let anyone send anyone a fake
-- like/comment/follow notification, including people who'd blocked them.
drop policy if exists "users can create notifications as themselves" on public.notifications;
revoke insert on public.notifications from anon, authenticated;

alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in ('like', 'comment', 'follow', 'follow_request', 'follow_accepted'));

-- A follow created by accepting a request notifies the REQUESTER that
-- they were accepted, instead of telling the accepter "X followed you".
-- (accept_follow_request / handle_privacy_change insert the follow while
-- the request row still exists, then delete it.)
create or replace function public.notify_on_follow()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.follower_id = new.following_id then
    return new;
  end if;
  if exists (
    select 1 from public.follow_requests
    where requester_id = new.follower_id and target_id = new.following_id
  ) then
    insert into public.notifications (user_id, actor_id, type)
    values (new.follower_id, new.following_id, 'follow_accepted');
  else
    insert into public.notifications (user_id, actor_id, type)
    values (new.following_id, new.follower_id, 'follow');
  end if;
  return new;
end;
$$;

create or replace function public.notify_on_follow_request()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.notifications (user_id, actor_id, type)
  values (new.target_id, new.requester_id, 'follow_request');
  return new;
end;
$$;
drop trigger if exists notify_on_follow_request on public.follow_requests;
create trigger notify_on_follow_request after insert on public.follow_requests
  for each row execute procedure public.notify_on_follow_request();

-- once a request is accepted, declined or cancelled, its notification goes too
create or replace function public.clear_follow_request_notification()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  delete from public.notifications
  where type = 'follow_request' and user_id = old.target_id and actor_id = old.requester_id;
  return old;
end;
$$;
drop trigger if exists clear_follow_request_notification on public.follow_requests;
create trigger clear_follow_request_notification after delete on public.follow_requests
  for each row execute procedure public.clear_follow_request_notification();
drop trigger if exists notify_on_follow on public.follows;
create trigger notify_on_follow after insert on public.follows
  for each row execute procedure public.notify_on_follow();

create or replace function public.notify_on_like()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  owner_id uuid;
begin
  select user_id into owner_id from public.workouts where id = new.workout_id;
  if owner_id is not null and owner_id <> new.user_id then
    insert into public.notifications (user_id, actor_id, type, workout_id)
    values (owner_id, new.user_id, 'like', new.workout_id);
  end if;
  return new;
end;
$$;
drop trigger if exists notify_on_like on public.workout_likes;
create trigger notify_on_like after insert on public.workout_likes
  for each row execute procedure public.notify_on_like();

create or replace function public.notify_on_comment()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  owner_id uuid;
begin
  select user_id into owner_id from public.workouts where id = new.workout_id;
  if owner_id is not null and owner_id <> new.user_id then
    insert into public.notifications (user_id, actor_id, type, workout_id, comment_id)
    values (owner_id, new.user_id, 'comment', new.workout_id, new.id);
  end if;
  return new;
end;
$$;
drop trigger if exists notify_on_comment on public.workout_comments;
create trigger notify_on_comment after insert on public.workout_comments
  for each row execute procedure public.notify_on_comment();

drop policy if exists "users can mark their own notifications read" on public.notifications;
create policy "users can mark their own notifications read"
  on public.notifications for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create index if not exists notifications_user_id_created_at_idx
  on public.notifications (user_id, created_at desc);

-- =========================================
-- goals (target weight on a specific lift, owner-only)
-- =========================================
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  target_weight_kg numeric not null check (target_weight_kg > 0),
  target_date date,
  created_at timestamptz not null default now()
);

alter table public.goals enable row level security;

drop policy if exists "users can view their own goals" on public.goals;
create policy "users can view their own goals"
  on public.goals for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "users can insert their own goals" on public.goals;
create policy "users can insert their own goals"
  on public.goals for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "users can delete their own goals" on public.goals;
create policy "users can delete their own goals"
  on public.goals for delete
  to authenticated
  using (user_id = auth.uid());

-- =========================================
-- workout_templates (reusable workout plans, owner-only)
-- =========================================
create table if not exists public.workout_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null default 'Plan',
  created_at timestamptz not null default now()
);

alter table public.workout_templates add column if not exists is_public boolean not null default false;

alter table public.workout_templates enable row level security;

drop policy if exists "users can view their own templates" on public.workout_templates;
create policy "users can view their own templates"
  on public.workout_templates for select
  to authenticated
  using (user_id = auth.uid() or (is_public and public.can_see_profile_details(user_id)));

drop policy if exists "users can insert their own templates" on public.workout_templates;
create policy "users can insert their own templates"
  on public.workout_templates for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "users can update their own templates" on public.workout_templates;
create policy "users can update their own templates"
  on public.workout_templates for update
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "users can delete their own templates" on public.workout_templates;
create policy "users can delete their own templates"
  on public.workout_templates for delete
  to authenticated
  using (user_id = auth.uid());

create table if not exists public.workout_template_exercises (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.workout_templates(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id),
  order_index int not null default 0,
  target_sets int not null default 3,
  target_reps int
);

alter table public.workout_template_exercises enable row level security;

drop policy if exists "template_exercises follow parent template visibility" on public.workout_template_exercises;
create policy "template_exercises follow parent template visibility"
  on public.workout_template_exercises for select
  to authenticated
  using (
    exists (
      select 1 from public.workout_templates t
      where t.id = template_id
        and (t.user_id = auth.uid() or (t.is_public and public.can_see_profile_details(t.user_id)))
    )
  );

drop policy if exists "users can manage template_exercises on their own templates" on public.workout_template_exercises;
create policy "users can manage template_exercises on their own templates"
  on public.workout_template_exercises for insert
  to authenticated
  with check (
    exists (select 1 from public.workout_templates t where t.id = template_id and t.user_id = auth.uid())
  );

drop policy if exists "users can update template_exercises on their own templates" on public.workout_template_exercises;
create policy "users can update template_exercises on their own templates"
  on public.workout_template_exercises for update
  to authenticated
  using (
    exists (select 1 from public.workout_templates t where t.id = template_id and t.user_id = auth.uid())
  );

drop policy if exists "users can delete template_exercises on their own templates" on public.workout_template_exercises;
create policy "users can delete template_exercises on their own templates"
  on public.workout_template_exercises for delete
  to authenticated
  using (
    exists (select 1 from public.workout_templates t where t.id = template_id and t.user_id = auth.uid())
  );

-- =========================================
-- body_measurements (owner-only)
-- =========================================
create table if not exists public.body_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  weight_kg numeric,
  note text,
  logged_at timestamptz not null default now()
);

alter table public.body_measurements enable row level security;

drop policy if exists "users can view their own measurements" on public.body_measurements;
create policy "users can view their own measurements"
  on public.body_measurements for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "users can insert their own measurements" on public.body_measurements;
create policy "users can insert their own measurements"
  on public.body_measurements for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "users can delete their own measurements" on public.body_measurements;
create policy "users can delete their own measurements"
  on public.body_measurements for delete
  to authenticated
  using (user_id = auth.uid());

-- =========================================
-- exercises select policy (defined here, not in the exercises section,
-- because it references workout_exercises / workout_template_exercises)
--
-- Library exercises are visible to everyone; a custom exercise only to
-- its creator, plus anyone who can see a workout or plan that uses it.
-- =========================================
drop policy if exists "exercises are viewable when shared or yours" on public.exercises;
create policy "exercises are viewable when shared or yours"
  on public.exercises for select
  to authenticated
  using (
    created_by is null
    or created_by = auth.uid()
    or exists (select 1 from public.workout_exercises we where we.exercise_id = exercises.id)
    or exists (select 1 from public.workout_template_exercises te where te.exercise_id = exercises.id)
  );

-- =========================================
-- seed a small default exercise library
-- =========================================
insert into public.exercises (name, category, equipment)
values
  -- chest
  ('Bench Press', 'chest', 'barbell'),
  ('Incline Bench Press', 'chest', 'barbell'),
  ('Decline Bench Press', 'chest', 'barbell'),
  ('Incline Dumbbell Press', 'chest', 'dumbbell'),
  ('Dumbbell Bench Press', 'chest', 'dumbbell'),
  ('Dumbbell Fly', 'chest', 'dumbbell'),
  ('Cable Fly', 'chest', 'machine'),
  ('Push Up', 'chest', 'bodyweight'),
  ('Chest Dip', 'chest', 'bodyweight'),
  ('Machine Chest Press', 'chest', 'machine'),
  ('Pec Deck', 'chest', 'machine'),

  -- back
  ('Barbell Row', 'back', 'barbell'),
  ('Pendlay Row', 'back', 'barbell'),
  ('T-Bar Row', 'back', 'machine'),
  ('Seated Cable Row', 'back', 'machine'),
  ('Single-Arm Dumbbell Row', 'back', 'dumbbell'),
  ('Lat Pulldown', 'back', 'machine'),
  ('Pull Up', 'back', 'bodyweight'),
  ('Chin Up', 'back', 'bodyweight'),
  ('Deadlift', 'back', 'barbell'),
  ('Rack Pull', 'back', 'barbell'),
  ('Good Morning', 'back', 'barbell'),
  ('Back Extension', 'back', 'bodyweight'),

  -- legs
  ('Barbell Squat', 'legs', 'barbell'),
  ('Front Squat', 'legs', 'barbell'),
  ('Goblet Squat', 'legs', 'dumbbell'),
  ('Bulgarian Split Squat', 'legs', 'dumbbell'),
  ('Walking Lunge', 'legs', 'dumbbell'),
  ('Leg Press', 'legs', 'machine'),
  ('Romanian Deadlift', 'legs', 'barbell'),
  ('Leg Extension', 'legs', 'machine'),
  ('Leg Curl', 'legs', 'machine'),
  ('Standing Calf Raise', 'legs', 'machine'),
  ('Seated Calf Raise', 'legs', 'machine'),
  ('Hip Thrust', 'legs', 'barbell'),

  -- shoulders
  ('Overhead Press', 'shoulders', 'barbell'),
  ('Push Press', 'shoulders', 'barbell'),
  ('Seated Dumbbell Press', 'shoulders', 'dumbbell'),
  ('Arnold Press', 'shoulders', 'dumbbell'),
  ('Lateral Raise', 'shoulders', 'dumbbell'),
  ('Front Raise', 'shoulders', 'dumbbell'),
  ('Rear Delt Fly', 'shoulders', 'dumbbell'),
  ('Face Pull', 'shoulders', 'machine'),
  ('Upright Row', 'shoulders', 'barbell'),

  -- arms
  ('Bicep Curl', 'arms', 'dumbbell'),
  ('Barbell Curl', 'arms', 'barbell'),
  ('Hammer Curl', 'arms', 'dumbbell'),
  ('Preacher Curl', 'arms', 'machine'),
  ('Tricep Pushdown', 'arms', 'machine'),
  ('Skull Crusher', 'arms', 'barbell'),
  ('Overhead Tricep Extension', 'arms', 'dumbbell'),
  ('Close-Grip Bench Press', 'arms', 'barbell'),
  ('Tricep Dip', 'arms', 'bodyweight'),

  -- core
  ('Plank', 'core', 'bodyweight'),
  ('Hanging Leg Raise', 'core', 'bodyweight'),
  ('Sit Up', 'core', 'bodyweight'),
  ('Cable Crunch', 'core', 'machine'),
  ('Russian Twist', 'core', 'dumbbell'),
  ('Ab Wheel Rollout', 'core', 'bodyweight'),

  -- cardio
  ('Running', 'cardio', 'bodyweight'),
  ('Cycling', 'cardio', 'bodyweight'),
  ('Rowing Machine', 'cardio', 'machine'),
  ('Jump Rope', 'cardio', 'bodyweight')
on conflict do nothing;

-- =========================================
-- seed additional trending / well-known exercises
-- =========================================
insert into public.exercises (name, category, equipment)
values
  -- chest
  ('Cable Crossover', 'chest', 'machine'),
  ('Svend Press', 'chest', 'dumbbell'),

  -- back
  ('Sumo Deadlift', 'back', 'barbell'),
  ('Trap Bar Deadlift', 'back', 'barbell'),
  ('Barbell Shrug', 'back', 'barbell'),
  ('Dumbbell Shrug', 'back', 'dumbbell'),
  ('Meadows Row', 'back', 'barbell'),
  ('Chest Supported Row', 'back', 'machine'),
  ('Inverted Row', 'back', 'bodyweight'),
  ('Straight-Arm Pulldown', 'back', 'machine'),
  ('Landmine Row', 'back', 'barbell'),
  ('Farmer''s Carry', 'back', 'dumbbell'),

  -- legs
  ('Hack Squat', 'legs', 'machine'),
  ('Pistol Squat', 'legs', 'bodyweight'),
  ('Cossack Squat', 'legs', 'bodyweight'),
  ('Step Up', 'legs', 'dumbbell'),
  ('Glute Bridge', 'legs', 'bodyweight'),
  ('Hip Abduction', 'legs', 'machine'),
  ('Hip Adduction', 'legs', 'machine'),
  ('Nordic Hamstring Curl', 'legs', 'bodyweight'),
  ('Kettlebell Swing', 'legs', 'kettlebell'),
  ('Box Jump', 'legs', 'bodyweight'),
  ('Sissy Squat', 'legs', 'bodyweight'),

  -- shoulders
  ('Cable Lateral Raise', 'shoulders', 'machine'),
  ('Landmine Press', 'shoulders', 'barbell'),
  ('Egyptian Lateral Raise', 'shoulders', 'dumbbell'),

  -- arms
  ('EZ-Bar Curl', 'arms', 'barbell'),
  ('Spider Curl', 'arms', 'dumbbell'),
  ('Concentration Curl', 'arms', 'dumbbell'),
  ('Cable Curl', 'arms', 'machine'),
  ('JM Press', 'arms', 'barbell'),
  ('Diamond Push Up', 'arms', 'bodyweight'),

  -- core
  ('Pallof Press', 'core', 'machine'),
  ('Dead Bug', 'core', 'bodyweight'),
  ('Side Plank', 'core', 'bodyweight'),
  ('V-Up', 'core', 'bodyweight'),
  ('Toes to Bar', 'core', 'bodyweight'),
  ('Mountain Climber', 'core', 'bodyweight'),
  ('Turkish Get-Up', 'core', 'kettlebell'),

  -- cardio
  ('Assault Bike', 'cardio', 'machine'),
  ('Stair Climber', 'cardio', 'machine'),
  ('Burpee', 'cardio', 'bodyweight'),
  ('Elliptical', 'cardio', 'machine')
on conflict do nothing;

-- =========================================
-- seed viral / trending gymtok exercises
-- =========================================
insert into public.exercises (name, category, equipment)
values
  ('Bear Crawl', 'core', 'bodyweight'),
  ('Copenhagen Plank', 'core', 'bodyweight'),
  ('Dead Hang', 'back', 'bodyweight'),
  ('Sled Push', 'legs', 'machine'),
  ('Sled Pull', 'legs', 'machine'),
  ('Shrimp Squat', 'legs', 'bodyweight'),
  ('Interval Walking', 'cardio', 'bodyweight')
on conflict do nothing;

-- =========================================
-- seed personal/custom-named exercises
-- =========================================
insert into public.exercises (name, category, equipment)
values
  ('Kitty Curls', 'arms', 'cable'),
  ('Keenan Flaps', 'back', 'cable'),
  ('Leon Pushdown', 'arms', 'cable')
on conflict do nothing;

-- =========================================
-- seed unilateral / single-limb variants + trending arm exercises
-- =========================================
insert into public.exercises (name, category, equipment)
values
  ('Bayesian Curl', 'arms', 'cable'),
  ('Single-Arm Cable Curl', 'arms', 'cable'),
  ('Single-Arm Tricep Pushdown', 'arms', 'cable'),
  ('Single-Arm Cable Row', 'back', 'cable'),
  ('Single-Arm Lat Pulldown', 'back', 'cable'),
  ('Single-Arm Cable Chest Press', 'chest', 'cable'),
  ('Single-Arm Lateral Raise', 'shoulders', 'dumbbell'),
  ('Single-Arm Overhead Press', 'shoulders', 'dumbbell'),
  ('Single-Arm Landmine Press', 'shoulders', 'barbell'),
  ('Single-Leg Romanian Deadlift', 'legs', 'dumbbell'),
  ('Single-Leg Press', 'legs', 'machine'),
  ('Single-Leg Calf Raise', 'legs', 'bodyweight'),
  ('Suitcase Carry', 'core', 'dumbbell')
on conflict do nothing;

-- =========================================
-- seed weighted bodyweight variants (equipment 'weighted_bodyweight' means
-- the logged weight is ADDED on top of the user's bodyweight, e.g. a dip
-- belt or weighted vest)
-- =========================================
insert into public.exercises (name, category, equipment)
values
  ('Weighted Pull Up', 'back', 'weighted_bodyweight'),
  ('Weighted Chin Up', 'back', 'weighted_bodyweight'),
  ('Weighted Dip', 'arms', 'weighted_bodyweight')
on conflict do nothing;

-- =========================================
-- seed more cardio
-- =========================================
insert into public.exercises (name, category, equipment)
values
  ('Walking', 'cardio', 'bodyweight')
on conflict do nothing;

-- =========================================
-- seed more machine exercises
-- =========================================
insert into public.exercises (name, category, equipment)
values
  ('Convergent Chest Press', 'chest', 'machine'),
  ('Lateral Raise Machine', 'shoulders', 'machine'),
  ('Shoulder Press Machine', 'shoulders', 'machine'),
  ('Ab Crunch Machine', 'core', 'machine'),
  ('Hip Abductor Machine', 'legs', 'machine'),
  ('Hip Adductor Machine', 'legs', 'machine'),
  ('Assisted Pull-Up Machine', 'back', 'machine')
on conflict do nothing;

-- =========================================
-- seed reverse-grip and forearm-focused arm exercises
-- =========================================
insert into public.exercises (name, category, equipment)
values
  ('Reverse Grip Barbell Curl', 'arms', 'barbell'),
  ('Reverse Grip Cable Curl', 'arms', 'cable'),
  ('Reverse Grip Bench Press', 'chest', 'barbell'),
  ('Reverse Grip Lat Pulldown', 'back', 'machine'),
  ('Zottman Curl', 'arms', 'dumbbell'),
  ('Cable Hammer Curl', 'arms', 'cable'),
  ('Wrist Curl', 'arms', 'barbell'),
  ('Reverse Wrist Curl', 'arms', 'barbell')
on conflict do nothing;

-- =========================================
-- seed calisthenics / skill movements
-- =========================================
insert into public.exercises (name, category, equipment)
values
  ('Muscle Up', 'back', 'bodyweight'),
  ('Ring Dip', 'arms', 'bodyweight'),
  ('Ring Row', 'back', 'bodyweight'),
  ('Handstand Push Up', 'shoulders', 'bodyweight'),
  ('Pike Push Up', 'shoulders', 'bodyweight'),
  ('Wall Handstand Hold', 'shoulders', 'bodyweight'),
  ('Archer Pull Up', 'back', 'bodyweight'),
  ('Archer Push Up', 'chest', 'bodyweight'),
  ('L-Sit', 'core', 'bodyweight'),
  ('Front Lever', 'back', 'bodyweight'),
  ('Back Lever', 'back', 'bodyweight'),
  ('Dragon Flag', 'core', 'bodyweight'),
  ('Planche Push Up', 'chest', 'bodyweight'),
  ('Skin the Cat', 'back', 'bodyweight'),
  ('Weighted Muscle Up', 'back', 'weighted_bodyweight'),
  ('Weighted Ring Dip', 'arms', 'weighted_bodyweight')
on conflict do nothing;

-- =========================================
-- seed Smith machine variants
-- =========================================
insert into public.exercises (name, category, equipment)
values
  ('Smith Machine Shoulder Press', 'shoulders', 'machine'),
  ('Smith Machine Squat', 'legs', 'machine'),
  ('Smith Machine Bench Press', 'chest', 'machine'),
  ('Smith Machine Incline Bench Press', 'chest', 'machine'),
  ('Smith Machine Row', 'back', 'machine'),
  ('Smith Machine Lunge', 'legs', 'machine')
on conflict do nothing;

insert into public.exercises (name, category, equipment)
values
  ('Dumbbell Shoulder Press', 'shoulders', 'dumbbell')
on conflict do nothing;

-- =========================================
-- storage: profile picture uploads
-- =========================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Public buckets already serve every file by URL with no select policy at
-- all. A bucket-wide select policy additionally lets anyone (even logged
-- out) LIST every file in the bucket, so it's scoped to your own folder —
-- which is still needed for upsert (re-uploading your avatar).
drop policy if exists "avatar images are publicly accessible" on storage.objects;
drop policy if exists "users can list their own avatars" on storage.objects;
create policy "users can list their own avatars"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "users can upload their own avatar" on storage.objects;
create policy "users can upload their own avatar"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "users can update their own avatar" on storage.objects;
create policy "users can update their own avatar"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "users can delete their own avatar" on storage.objects;
create policy "users can delete their own avatar"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- =========================================
-- storage: workout photo uploads
-- =========================================
insert into storage.buckets (id, name, public)
values ('workout-photos', 'workout-photos', true)
on conflict (id) do nothing;

drop policy if exists "workout photos are publicly accessible" on storage.objects;
drop policy if exists "users can list their own workout photos" on storage.objects;
create policy "users can list their own workout photos"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'workout-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "users can upload their own workout photos" on storage.objects;
create policy "users can upload their own workout photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'workout-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "users can update their own workout photos" on storage.objects;
create policy "users can update their own workout photos"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'workout-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "users can delete their own workout photos" on storage.objects;
create policy "users can delete their own workout photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'workout-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- =========================================
-- subscriptions (Premium status, owner-only)
--
-- Written only by server code holding the service-role key (the Stripe
-- webhook handler, and later the App Store/Play Store receipt-verification
-- routes) — those bypass RLS entirely, so no insert/update policy is needed
-- here, only read access for the owning user to check their own status.
-- =========================================
create table if not exists public.subscriptions (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  status text not null default 'none' check (status in ('none', 'trialing', 'active', 'past_due', 'canceled')),
  platform text not null default 'web' check (platform in ('web', 'ios', 'android')),
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

drop policy if exists "users can view their own subscription" on public.subscriptions;
create policy "users can view their own subscription"
  on public.subscriptions for select
  to authenticated
  using (user_id = auth.uid());

-- =========================================
-- api_rate_limits (abuse protection for paid third-party API calls —
-- the AI generator and gym search, both of which cost real money per call)
--
-- Written only by server code holding the service-role key, via the
-- increment_rate_limit() function below — no RLS policies needed since
-- that bypasses RLS entirely, same as subscriptions above.
-- =========================================
create table if not exists public.api_rate_limits (
  user_id uuid not null references public.profiles(id) on delete cascade,
  bucket text not null,
  window_start timestamptz not null,
  count int not null default 0,
  primary key (user_id, bucket, window_start)
);

alter table public.api_rate_limits enable row level security;

-- Atomic upsert-increment so concurrent requests can't race past the limit
-- the way a read-then-write from application code could.
create or replace function public.increment_rate_limit(p_user_id uuid, p_bucket text, p_window_start timestamptz)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count int;
begin
  -- security definer bypasses RLS, so this check is what stops a caller
  -- from incrementing (and exhausting) some other user's bucket.
  if p_user_id <> auth.uid() then
    raise exception 'Cannot increment another user''s rate limit';
  end if;

  insert into public.api_rate_limits (user_id, bucket, window_start, count)
  values (p_user_id, p_bucket, p_window_start, 1)
  on conflict (user_id, bucket, window_start)
  do update set count = api_rate_limits.count + 1
  returning count into new_count;
  return new_count;
end;
$$;

grant execute on function public.increment_rate_limit(uuid, text, timestamptz) to authenticated;

-- =========================================
-- blocks (owner-only — you can only ever see/manage blocks you created;
-- whether someone has blocked you is never exposed to you directly)
-- =========================================
create table if not exists public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

alter table public.blocks enable row level security;

drop policy if exists "users can view their own blocks" on public.blocks;
create policy "users can view their own blocks"
  on public.blocks for select
  to authenticated
  using (blocker_id = auth.uid() or blocked_id = auth.uid());

drop policy if exists "users can create blocks as themselves" on public.blocks;
create policy "users can create blocks as themselves"
  on public.blocks for insert
  to authenticated
  with check (blocker_id = auth.uid());

drop policy if exists "users can remove their own blocks" on public.blocks;
create policy "users can remove their own blocks"
  on public.blocks for delete
  to authenticated
  using (blocker_id = auth.uid());

-- A block ends any follow in either direction. (RLS only lets the blocker
-- delete their OWN follow, so the app couldn't remove the blocked user's
-- follow of the blocker — leaving them able to see the blocker's workouts.)
create or replace function public.handle_block_created()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  delete from public.follows
  where (follower_id = new.blocker_id and following_id = new.blocked_id)
     or (follower_id = new.blocked_id and following_id = new.blocker_id);
  delete from public.follow_requests
  where (requester_id = new.blocker_id and target_id = new.blocked_id)
     or (requester_id = new.blocked_id and target_id = new.blocker_id);
  return new;
end;
$$;
drop trigger if exists on_block_created on public.blocks;
create trigger on_block_created after insert on public.blocks
  for each row execute procedure public.handle_block_created();

-- =========================================
-- reports (insert-and-forget from the app's side — reviewed directly in
-- the Supabase dashboard for now, no in-app admin UI)
-- =========================================
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_user_id uuid references public.profiles(id) on delete cascade,
  workout_id uuid references public.workouts(id) on delete cascade,
  comment_id uuid references public.workout_comments(id) on delete cascade,
  reason text not null,
  status text not null default 'open' check (status in ('open', 'reviewed', 'dismissed')),
  created_at timestamptz not null default now()
);

alter table public.reports enable row level security;

drop policy if exists "users can view their own submitted reports" on public.reports;
create policy "users can view their own submitted reports"
  on public.reports for select
  to authenticated
  using (reporter_id = auth.uid());

drop policy if exists "users can submit reports as themselves" on public.reports;
create policy "users can submit reports as themselves"
  on public.reports for insert
  to authenticated
  with check (reporter_id = auth.uid());

-- =========================================
-- admin moderation (security definer functions, gated on profiles.is_admin)
--
-- Kept as narrow RPCs rather than broadening RLS on workouts/comments/etc
-- for admins — smaller blast radius, and every function checks is_admin
-- itself even though it also runs as security definer.
-- =========================================
create or replace function public.admin_list_reports()
returns table (
  id uuid,
  reporter_username text,
  reported_username text,
  workout_id uuid,
  workout_title text,
  comment_id uuid,
  comment_body text,
  reason text,
  status text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin_with_mfa() then
    raise exception 'Not authorized';
  end if;

  return query
  select
    r.id,
    reporter.username,
    reported.username,
    r.workout_id,
    w.title,
    r.comment_id,
    c.body,
    r.reason,
    r.status,
    r.created_at
  from public.reports r
  left join public.profiles reporter on reporter.id = r.reporter_id
  left join public.profiles reported on reported.id = r.reported_user_id
  left join public.workouts w on w.id = r.workout_id
  left join public.workout_comments c on c.id = r.comment_id
  order by r.created_at desc;
end;
$$;

grant execute on function public.admin_list_reports() to authenticated;

create or replace function public.admin_update_report_status(p_report_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin_with_mfa() then
    raise exception 'Not authorized';
  end if;
  if p_status not in ('open', 'reviewed', 'dismissed') then
    raise exception 'Invalid status';
  end if;

  update public.reports set status = p_status where id = p_report_id;
end;
$$;

grant execute on function public.admin_update_report_status(uuid, text) to authenticated;

create or replace function public.admin_delete_workout(p_workout_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin_with_mfa() then
    raise exception 'Not authorized';
  end if;

  delete from public.workouts where id = p_workout_id;
end;
$$;

grant execute on function public.admin_delete_workout(uuid) to authenticated;

create or replace function public.admin_delete_comment(p_comment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin_with_mfa() then
    raise exception 'Not authorized';
  end if;

  delete from public.workout_comments where id = p_comment_id;
end;
$$;

grant execute on function public.admin_delete_comment(uuid) to authenticated;

-- =========================================
-- gym reviews (travel-companion feature: find/rate gyms, incl. hotel gyms,
-- anywhere via the same LocationIQ place search used for workout gym-tagging)
-- =========================================
create table if not exists public.gym_reviews (
  id uuid primary key default gen_random_uuid(),
  place_id text not null,
  gym_name text not null,
  gym_address text,
  lat double precision,
  lng double precision,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  body text,
  -- short fixed vocabulary (squat_rack, hotel_gym, 24_hour, ...) rather than
  -- free-tagging, so aggregate counts on the gym page stay meaningful
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- one review per user per gym; editing overwrites it (upsert) rather than
  -- stacking duplicate reviews from the same person
  unique (place_id, user_id)
);

alter table public.gym_reviews enable row level security;

-- Reviews are anonymous to other users: tied to identity, they revealed
-- which gyms (including hotel gyms while travelling) a given person uses.
-- You can read your own rows directly; everyone else's come through the
-- identity-free functions below.
drop policy if exists "gym reviews are viewable by any authenticated user" on public.gym_reviews;
drop policy if exists "users can view their own gym reviews" on public.gym_reviews;
create policy "users can view their own gym reviews"
  on public.gym_reviews for select
  to authenticated
  using (user_id = auth.uid());

alter table public.gym_reviews drop constraint if exists gym_reviews_body_length;
alter table public.gym_reviews add constraint gym_reviews_body_length
  check (body is null or char_length(body) <= 1000) not valid;

drop policy if exists "users can insert their own gym reviews" on public.gym_reviews;
create policy "users can insert their own gym reviews"
  on public.gym_reviews for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "users can update their own gym reviews" on public.gym_reviews;
create policy "users can update their own gym reviews"
  on public.gym_reviews for update
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "users can delete their own gym reviews" on public.gym_reviews;
create policy "users can delete their own gym reviews"
  on public.gym_reviews for delete
  to authenticated
  using (user_id = auth.uid());

create index if not exists gym_reviews_place_idx on public.gym_reviews (place_id);

create or replace function public.gym_reviews_for_place(p_place_id text)
returns table (id uuid, rating int, body text, tags text[], created_at timestamptz, updated_at timestamptz, is_mine boolean)
language sql stable security definer set search_path = public
as $$
  select r.id, r.rating, r.body, r.tags, r.created_at, r.updated_at, r.user_id = auth.uid()
  from public.gym_reviews r
  where r.place_id = p_place_id
  order by r.created_at desc;
$$;
revoke all on function public.gym_reviews_for_place(text) from public, anon;
grant execute on function public.gym_reviews_for_place(text) to authenticated;

create or replace function public.reviewed_gyms()
returns table (place_id text, gym_name text, gym_address text, lat double precision, lng double precision, avg_rating numeric, review_count bigint)
language sql stable security definer set search_path = public
as $$
  select r.place_id,
         (array_agg(r.gym_name order by r.created_at))[1],
         (array_agg(r.gym_address order by r.created_at))[1],
         (array_agg(r.lat order by r.created_at) filter (where r.lat is not null))[1],
         (array_agg(r.lng order by r.created_at) filter (where r.lng is not null))[1],
         avg(r.rating),
         count(*)
  from public.gym_reviews r
  group by r.place_id;
$$;
revoke all on function public.reviewed_gyms() from public, anon;
grant execute on function public.reviewed_gyms() to authenticated;
