import type { Exercise, Placement } from './types'

const WAIST_EXERCISES = new Set([
  'squat',
  'leg_press',
  'calf_raises',
  'leg_extension',
  'leg_curl',
  'dips',
  'pullups',
])

export const EXERCISES: Exercise[] = [
  { id: 'deadlift', name: 'Deadlift', placement: 'WRIST' },
  { id: 'chest_press', name: 'Chest Press', placement: 'WRIST' },
  { id: 'pushups', name: 'Pushups', placement: 'WRIST' },
  { id: 'bicep_curls', name: 'Bicep Curls', placement: 'WRIST' },
  { id: 'tricep_pushdowns', name: 'Tricep Pushdowns', placement: 'WRIST' },
  { id: 'skull_crushers', name: 'Skull Crushers', placement: 'WRIST' },
  { id: 'pec_fly', name: 'Pec Fly', placement: 'WRIST' },
  { id: 'rear_delt', name: 'Rear Delt', placement: 'WRIST' },
  { id: 'shoulder_press', name: 'Shoulder Press', placement: 'WRIST' },
  { id: 'lat_pulldowns', name: 'Lat Pulldowns', placement: 'WRIST' },
  { id: 'squat', name: 'Squat', placement: 'WAIST' },
  { id: 'dips', name: 'Dips', placement: 'WAIST' },
  { id: 'pullups', name: 'Pullups', placement: 'WAIST' },
  { id: 'calf_raises', name: 'Calf Raises', placement: 'WAIST' },
  { id: 'leg_press', name: 'Leg Press', placement: 'WAIST' },
  { id: 'leg_extension', name: 'Leg Extension', placement: 'WAIST' },
  { id: 'leg_curl', name: 'Leg Curl', placement: 'WAIST' },
]

export const EXERCISES_BY_ID: Record<string, Exercise> = Object.fromEntries(
  EXERCISES.map((e) => [e.id, e]),
)

export function placementFor(exerciseId: string): Placement {
  return WAIST_EXERCISES.has(exerciseId) ? 'WAIST' : 'WRIST'
}

export function exerciseName(exerciseId: string): string {
  return EXERCISES_BY_ID[exerciseId]?.name ?? exerciseId
}
