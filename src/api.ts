const API_BASE = '/api'

export interface SelectExerciseResponse {
  ok: boolean
  exercise: string
  placement: 'WRIST' | 'WAIST'
  tracker: string
}

export async function selectExercise(
  exerciseName: string,
): Promise<SelectExerciseResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/select-exercise`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exercise_name: exerciseName }),
    })
    if (!res.ok) throw new Error(`status ${res.status}`)
    return (await res.json()) as SelectExerciseResponse
  } catch (err) {
    console.warn('[LiftLog] backend bridge unreachable:', err)
    return null
  }
}
