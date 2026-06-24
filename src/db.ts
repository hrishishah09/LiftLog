import { supabase } from './supabase'
import type { ExerciseConfig, Routine, RoutineTheme, SessionRecord } from './types'

interface RoutineRow {
  id: string
  name: string
  description: string | null
  theme: string
  sort_order: number
}

interface RoutineExerciseRow {
  id: string
  routine_id: string
  exercise_id: string
  sets: number
  weight: number
  sort_order: number
}

interface SessionRow {
  id: string
  date: string
  workout: string
  theme: string
  total_reps: number
  duration: string
}

function asTheme(value: string): RoutineTheme {
  const allowed: RoutineTheme[] = ['indigo', 'violet', 'emerald', 'amber', 'rose', 'sky']
  return (allowed as string[]).includes(value) ? (value as RoutineTheme) : 'indigo'
}

export async function loadRoutines(): Promise<Routine[]> {
  const { data: routines, error } = await supabase
    .from('routines')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) throw error
  if (!routines || routines.length === 0) return []

  const { data: exercises, error: exError } = await supabase
    .from('routine_exercises')
    .select('*')
    .order('sort_order', { ascending: true })

  if (exError) throw exError

  const byRoutine = new Map<string, ExerciseConfig[]>()
  for (const row of (exercises ?? []) as RoutineExerciseRow[]) {
    const list = byRoutine.get(row.routine_id) ?? []
    list.push({
      exerciseId: row.exercise_id,
      sets: row.sets,
      weight: Number(row.weight),
    })
    byRoutine.set(row.routine_id, list)
  }

  return (routines as RoutineRow[]).map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description ?? undefined,
    theme: asTheme(r.theme),
    exercises: byRoutine.get(r.id) ?? [],
  }))
}

export async function createRoutine(routine: Routine): Promise<void> {
  const { error: rError } = await supabase.from('routines').insert({
    id: routine.id,
    name: routine.name,
    description: routine.description ?? null,
    theme: routine.theme,
    sort_order: 0,
  })
  if (rError) throw rError

  if (routine.exercises.length === 0) return
  const rows = routine.exercises.map((ex, i) => ({
    routine_id: routine.id,
    exercise_id: ex.exerciseId,
    sets: ex.sets,
    weight: ex.weight,
    sort_order: i,
  }))
  const { error: exError } = await supabase.from('routine_exercises').insert(rows)
  if (exError) throw exError
}

export async function deleteRoutine(id: string): Promise<void> {
  // routine_exercises cascade on delete, so only the parent row needs removing.
  const { error } = await supabase.from('routines').delete().eq('id', id)
  if (error) throw error
}

export async function loadSessions(): Promise<SessionRecord[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .order('date', { ascending: false })

  if (error) throw error
  if (!data) return []

  return (data as SessionRow[]).map((s) => ({
    id: s.id,
    date: s.date,
    workout: s.workout,
    theme: asTheme(s.theme),
    totalReps: s.total_reps,
    duration: s.duration,
  }))
}

export async function createSession(record: SessionRecord): Promise<void> {
  const { error } = await supabase.from('sessions').insert({
    id: record.id,
    date: record.date,
    workout: record.workout,
    theme: record.theme,
    total_reps: record.totalReps,
    duration: record.duration,
  })
  if (error) throw error
}
