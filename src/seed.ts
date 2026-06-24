import type { Routine, SessionRecord } from './types'

export const SEED_ROUTINES: Routine[] = [
  {
    id: 'r-push',
    name: 'Push Day',
    description: 'Chest, shoulders & triceps focus.',
    theme: 'indigo',
    exercises: [
      { exerciseId: 'chest_press', sets: 4, weight: 60 },
      { exerciseId: 'shoulder_press', sets: 3, weight: 25 },
      { exerciseId: 'tricep_pushdowns', sets: 3, weight: 30 },
      { exerciseId: 'pushups', sets: 3, weight: 0 },
    ],
  },
  {
    id: 'r-pull',
    name: 'Pull Day',
    description: 'Back & biceps hypertrophy.',
    theme: 'violet',
    exercises: [
      { exerciseId: 'deadlift', sets: 4, weight: 80 },
      { exerciseId: 'lat_pulldowns', sets: 4, weight: 45 },
      { exerciseId: 'bicep_curls', sets: 3, weight: 15 },
      { exerciseId: 'rear_delt', sets: 3, weight: 10 },
    ],
  },
  {
    id: 'r-leg',
    name: 'Leg Day',
    description: 'Quads, hamstrings & calves.',
    theme: 'emerald',
    exercises: [
      { exerciseId: 'squat', sets: 4, weight: 70 },
      { exerciseId: 'leg_press', sets: 3, weight: 120 },
      { exerciseId: 'leg_extension', sets: 3, weight: 40 },
      { exerciseId: 'leg_curl', sets: 3, weight: 35 },
      { exerciseId: 'calf_raises', sets: 4, weight: 50 },
    ],
  },
]

export const SEED_HISTORY: SessionRecord[] = [
  { id: 'h1', date: '2026-06-23', workout: 'Push Day', theme: 'indigo', totalReps: 48, duration: '42 min' },
  { id: 'h2', date: '2026-06-22', workout: 'Pull Day', theme: 'violet', totalReps: 52, duration: '38 min' },
  { id: 'h3', date: '2026-06-21', workout: 'Leg Day', theme: 'emerald', totalReps: 60, duration: '51 min' },
  { id: 'h4', date: '2026-06-20', workout: 'Push Day', theme: 'indigo', totalReps: 44, duration: '40 min' },
  { id: 'h5', date: '2026-06-18', workout: 'Pull Day', theme: 'violet', totalReps: 50, duration: '36 min' },
]
