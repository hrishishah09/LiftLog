export type Placement = 'WRIST' | 'WAIST'

export type Unit = 'kg' | 'lbs'

export type ExerciseId = string

export interface Exercise {
  id: ExerciseId
  name: string
  placement: Placement
}

export interface ExerciseConfig {
  exerciseId: ExerciseId
  sets: number
  weight: number
}

export interface Routine {
  id: string
  name: string
  description?: string
  theme: RoutineTheme
  exercises: ExerciseConfig[]
}

export type RoutineTheme = 'indigo' | 'violet' | 'emerald' | 'amber' | 'rose' | 'sky'

export interface SetRecord {
  setNumber: number
  weight: number
  reps: number
}

export interface ExerciseRecord {
  exerciseId: ExerciseId
  sets: SetRecord[]
}

export interface SessionRecord {
  id: string
  date: string
  workout: string
  theme: RoutineTheme
  totalReps: number
  duration: string
  exercises: ExerciseRecord[]
}
