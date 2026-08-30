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

alter table public.profiles enable row level security;

drop policy if exists "profiles are viewable by any authenticated user" on public.profiles;
create policy "profiles are viewable by any authenticated user"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "users can insert their own profile" on public.profiles;
create policy "users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "users can update their own profile" on public.profiles;
create policy "users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

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
  name text not null unique,
  category text, -- e.g. 'chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio'
  equipment text, -- e.g. 'barbell', 'dumbbell', 'machine', 'bodyweight', 'weighted_bodyweight'
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.exercises enable row level security;

drop policy if exists "exercises are viewable by any authenticated user" on public.exercises;
create policy "exercises are viewable by any authenticated user"
  on public.exercises for select
  to authenticated
  using (true);

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

drop policy if exists "follow edges are viewable by any authenticated user" on public.follows;
create policy "follow edges are viewable by any authenticated user"
  on public.follows for select
  to authenticated
  using (true);

drop policy if exists "users can follow as themselves" on public.follows;
create policy "users can follow as themselves"
  on public.follows for insert
  to authenticated
  with check (follower_id = auth.uid());

drop policy if exists "users can unfollow as themselves" on public.follows;
create policy "users can unfollow as themselves"
  on public.follows for delete
  to authenticated
  using (follower_id = auth.uid());

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

alter table public.workouts enable row level security;

drop policy if exists "users can view own workouts or workouts of people they follow" on public.workouts;
drop policy if exists "users can view own workouts or public workouts of people they follow" on public.workouts;
create policy "users can view own workouts or public workouts of people they follow"
  on public.workouts for select
  to authenticated
  using (
    user_id = auth.uid()
    or (
      is_public
      and exists (
        select 1 from public.follows f
        where f.follower_id = auth.uid() and f.following_id = workouts.user_id
      )
    )
  );

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
      where w.id = workout_exercises.workout_id
        and (
          w.user_id = auth.uid()
          or exists (
            select 1 from public.follows f
            where f.follower_id = auth.uid() and f.following_id = w.user_id
          )
        )
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
      where we.id = workout_sets.workout_exercise_id
        and (
          w.user_id = auth.uid()
          or exists (
            select 1 from public.follows f
            where f.follower_id = auth.uid() and f.following_id = w.user_id
          )
        )
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
      where w.id = workout_likes.workout_id
        and (
          w.user_id = auth.uid()
          or (
            w.is_public
            and exists (
              select 1 from public.follows f
              where f.follower_id = auth.uid() and f.following_id = w.user_id
            )
          )
        )
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
      where w.id = workout_id
        and (
          w.user_id = auth.uid()
          or (
            w.is_public
            and exists (
              select 1 from public.follows f
              where f.follower_id = auth.uid() and f.following_id = w.user_id
            )
          )
        )
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
      where w.id = workout_comments.workout_id
        and (
          w.user_id = auth.uid()
          or (
            w.is_public
            and exists (
              select 1 from public.follows f
              where f.follower_id = auth.uid() and f.following_id = w.user_id
            )
          )
        )
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
      where w.id = workout_id
        and (
          w.user_id = auth.uid()
          or (
            w.is_public
            and exists (
              select 1 from public.follows f
              where f.follower_id = auth.uid() and f.following_id = w.user_id
            )
          )
        )
    )
  );

drop policy if exists "users can delete their own comments" on public.workout_comments;
create policy "users can delete their own comments"
  on public.workout_comments for delete
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

alter table public.workout_templates enable row level security;

drop policy if exists "users can view their own templates" on public.workout_templates;
create policy "users can view their own templates"
  on public.workout_templates for select
  to authenticated
  using (user_id = auth.uid());

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
    exists (select 1 from public.workout_templates t where t.id = template_id and t.user_id = auth.uid())
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
-- storage: profile picture uploads
-- =========================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatar images are publicly accessible" on storage.objects;
create policy "avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

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
create policy "workout photos are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'workout-photos');

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
