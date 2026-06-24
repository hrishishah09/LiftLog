export type Placement = 'WRIST' | 'WAIST'

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

export interface SessionRecord {
  id: string
  date: string
  workout: string
  theme: RoutineTheme
  totalReps: number
  duration: string
}
