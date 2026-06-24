/*
# LiftLog schema — routines, exercises, and session history

1. Purpose
   Persist workout routines (with their exercise lists), and completed
   session history for the LiftLog fitness tracker dashboard. This is a
   single-tenant app with no sign-in, so all tables are readable/writable
   by the anon-key frontend client.

2. New Tables
   - `routines`
     - `id` (uuid, primary key)
     - `name` (text, not null) — routine display name, e.g. "Push Day"
     - `description` (text, nullable) — optional note
     - `theme` (text, not null, default 'indigo') — color theme key
     - `sort_order` (int, default 0) — ordering in the manager
     - `created_at` (timestamptz, default now())
   - `routine_exercises`
     - `id` (uuid, primary key)
     - `routine_id` (uuid, FK -> routines.id ON DELETE CASCADE)
     - `exercise_id` (text, not null) — matches the 17 frontend exercise ids
     - `sets` (int, not null, default 3)
     - `weight` (numeric, not null, default 0) — kg target, 0 = bodyweight
     - `sort_order` (int, default 0) — ordering within the routine
     - `created_at` (timestamptz, default now())
   - `sessions`
     - `id` (uuid, primary key)
     - `date` (date, not null) — day the session was completed
     - `workout` (text, not null) — routine name at time of completion
     - `theme` (text, not null, default 'indigo') — color theme key
     - `total_reps` (int, not null, default 0)
     - `duration` (text, not null) — human-readable, e.g. "42 min"
     - `created_at` (timestamptz, default now())

3. Indexes
   - `routine_exercises` on `routine_id` (FK lookups)
   - `sessions` on `date` desc (history listing)

4. Security
   - RLS enabled on all three tables.
   - Anon + authenticated CRUD allowed on all tables (single-tenant, no auth).
   - `USING (true)` is intentional and documented: the data is shared/public
     with no per-user isolation.

5. Notes
   - `routine_exercises.routine_id` cascades on delete, so deleting a
     routine automatically removes its exercise rows.
   - All ids default to `gen_random_uuid()` so the frontend can insert
     without supplying an id.
*/

-- routines
CREATE TABLE IF NOT EXISTS routines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  theme text NOT NULL DEFAULT 'indigo',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE routines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_routines" ON routines;
CREATE POLICY "anon_select_routines" ON routines FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_routines" ON routines;
CREATE POLICY "anon_insert_routines" ON routines FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_routines" ON routines;
CREATE POLICY "anon_update_routines" ON routines FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_routines" ON routines;
CREATE POLICY "anon_delete_routines" ON routines FOR DELETE
  TO anon, authenticated USING (true);

-- routine_exercises
CREATE TABLE IF NOT EXISTS routine_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id uuid NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  exercise_id text NOT NULL,
  sets int NOT NULL DEFAULT 3,
  weight numeric NOT NULL DEFAULT 0,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_routine_exercises_routine_id
  ON routine_exercises(routine_id);

ALTER TABLE routine_exercises ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_routine_exercises" ON routine_exercises;
CREATE POLICY "anon_select_routine_exercises" ON routine_exercises FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_routine_exercises" ON routine_exercises;
CREATE POLICY "anon_insert_routine_exercises" ON routine_exercises FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_routine_exercises" ON routine_exercises;
CREATE POLICY "anon_update_routine_exercises" ON routine_exercises FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_routine_exercises" ON routine_exercises;
CREATE POLICY "anon_delete_routine_exercises" ON routine_exercises FOR DELETE
  TO anon, authenticated USING (true);

-- sessions
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  workout text NOT NULL,
  theme text NOT NULL DEFAULT 'indigo',
  total_reps int NOT NULL DEFAULT 0,
  duration text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_date_desc
  ON sessions(date DESC);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_sessions" ON sessions;
CREATE POLICY "anon_select_sessions" ON sessions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_sessions" ON sessions;
CREATE POLICY "anon_insert_sessions" ON sessions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_sessions" ON sessions;
CREATE POLICY "anon_update_sessions" ON sessions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_sessions" ON sessions;
CREATE POLICY "anon_delete_sessions" ON sessions FOR DELETE
  TO anon, authenticated USING (true);
