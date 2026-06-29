import type { Routine, SessionRecord } from './types'
import { SEED_ROUTINES } from './seed'

/**
 * Local JSON persistence layer.
 *
 * Data is stored in localStorage under a single key shaped like a
 * `mockDatabase.json` document, so the structure can be lifted directly
 * into a real production database (Postgres/MySQL/etc.) later:
 *
 * {
 *   "routines": [ { id, name, description, theme, exercises: [...] } ],
 *   "sessions": [ { id, date, workout, theme, totalReps, duration, exercises: [...] } ]
 * }
 *
 * Each routine nests its exercises as a sub-array — a denormalized shape
 * that maps cleanly onto a parent `routines` table + child
 * `routine_exercises` table when you migrate.  Each session likewise
 * nests its per-exercise set records.
 */

const STORAGE_KEY = 'liftlog.mockDatabase.json'

interface DatabaseShape {
  routines: Routine[]
  sessions: SessionRecord[]
}

function read(): DatabaseShape | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as DatabaseShape
    if (!parsed.routines || !parsed.sessions) return null
    return parsed
  } catch {
    return null
  }
}

function write(db: DatabaseShape): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db, null, 2))
  } catch (err) {
    console.error('[LiftLog] failed to persist data:', err)
  }
}

function seedIfEmpty(): DatabaseShape {
  const existing = read()
  if (existing) return existing
  const fresh: DatabaseShape = {
    routines: SEED_ROUTINES,
    sessions: [],
  }
  write(fresh)
  return fresh
}

export function loadRoutines(): Routine[] {
  return seedIfEmpty().routines
}

export function loadSessions(): SessionRecord[] {
  return seedIfEmpty().sessions
}

export function saveRoutine(routine: Routine): void {
  const db = seedIfEmpty()
  db.routines = [...db.routines, routine]
  write(db)
}

export function updateRoutine(routine: Routine): void {
  const db = seedIfEmpty()
  db.routines = db.routines.map((r) => (r.id === routine.id ? routine : r))
  write(db)
}

export function deleteRoutine(id: string): void {
  const db = seedIfEmpty()
  db.routines = db.routines.filter((r) => r.id !== id)
  write(db)
}

export function saveSession(record: SessionRecord): void {
  const db = seedIfEmpty()
  db.sessions = [record, ...db.sessions]
  write(db)
}

export function deleteSession(id: string): void {
  const db = seedIfEmpty()
  db.sessions = db.sessions.filter((s) => s.id !== id)
  write(db)
}
