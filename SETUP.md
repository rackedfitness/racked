# Racked — local setup

## 1. Create a Supabase project
1. Go to https://supabase.com/dashboard and create a free account/project.
2. In the new project, go to **Project Settings > Data API** and copy the **Project URL**.
3. In **Project Settings > API Keys**, copy the **anon public** (or **publishable**) key.

## 2. Configure environment variables
Copy `.env.local.example` to `.env.local` and fill in the two values from step 1:

```bash
cp .env.local.example .env.local
```

## 3. Run the database schema
1. In the Supabase dashboard, open **SQL Editor > New query**.
2. Paste the entire contents of `supabase/schema.sql` and run it.
   This creates all tables, row-level security policies, the auto-profile-creation trigger, and seeds a starter exercise library.
3. **The whole file is safe to re-run any time** (e.g. after pulling schema changes) — every table uses `IF NOT EXISTS`, every policy is dropped and recreated, and the seed insert uses `ON CONFLICT DO NOTHING`. If you ever add tables here later, re-run the full file rather than pasting just the new section.

## 4. (Recommended for testing) Disable email confirmation
By default Supabase requires users to click a confirmation email before they can log in. For quick local testing:
- Go to **Authentication > Sign In / Providers > Email** and turn off "Confirm email".
- Turn it back on before shipping to real users.

## 5. Run the app
```bash
npm run dev
```
Visit http://localhost:3000 — you'll be redirected to `/login`.

### Windows note: `--use-system-ca`
If `npm run dev` (or `build`) throws `fetch failed` / `UNABLE_TO_VERIFY_LEAF_SIGNATURE` when talking to Supabase, it means Node isn't trusting this machine's certificate store (common behind corporate security software). Fix: set `NODE_OPTIONS=--use-system-ca` as a user environment variable (already done on this machine), or run `node --use-system-ca node_modules/next/dist/bin/next dev` directly.

## What's built
- Email/password auth (Supabase Auth), with a profile auto-created per user
- **Dashboard** (`/`) — workout count, total volume, this-week count, daily streak (with best streak), recent sessions with PR badges
- **Workout logging** (`/workout/new`) — add exercises, add sets (weight in kg / reps), finish workout
- **Plans/templates** (`/workouts`) — save a workout as a reusable plan (`?savePlan=1`), start a new workout pre-filled from a plan (`?template=<id>`)
- **Progress** (`/progress`) — volume-over-time chart, estimated-1RM-per-exercise chart (Epley formula), body weight measurement log
- **History** (`/history`) — full workout history with PR/volume/duration
- **Body map** (`/history/body-map`) — front/back muscle heatmap by category, worked-in-last-7-days breakdown
- **Feed** (`/feed`) — your own + followed users' finished workouts
- **Find friends** (`/people`) — search users, follow/unfollow
- **Profile** (`/profile/[username]`) — follower/following counts, stats, workout history, gear icon to Settings for your own profile
- **Settings** (`/settings`) — display name/email edit, accent color picker (persisted to localStorage, applied via CSS variable), local PIN app-lock (device-only, not a real auth boundary), JSON data export, delete-my-data danger zone, log out
- Dark theme with a bottom tab bar (Home/Workouts/Progress/Feed/Profile), tuned to avoid horizontal overflow down to 360px-wide phones
- All data access enforced via Postgres Row Level Security (see `supabase/schema.sql`) — a user can only see their own workouts/plans/measurements and the workouts of people they follow

## Not built yet (next steps)
- Stripe / RevenueCat subscriptions and paywalling premium features
- Capacitor iOS/Android wrapper
- Real account deletion (currently "delete my data" wipes workouts/plans/measurements via the anon key; deleting the actual auth user requires the Supabase service-role key, which shouldn't live in client-reachable code — do this via a Supabase Edge Function or the dashboard)
- Likes/comments on workouts, rest timers, superset support
