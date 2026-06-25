const API_BASE = '/api'

export interface SelectExerciseResponse {
  ok: boolean
  exercise: string
  placement: 'WRIST' | 'WAIST'
  tracker: string
}

export interface TrackingResponse {
  ok: boolean
  exercise: string
  set_number: number
  weight: number
  unit: string
  reps: number
  state: string
}

async function postJSON<T>(path: string, body: unknown): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(`status ${res.status}`)
    return (await res.json()) as T
  } catch (err) {
    console.warn(`[LiftLog] backend bridge unreachable (${path}):`, err)
    return null
  }
}

export function selectExercise(
  exerciseName: string,
): Promise<SelectExerciseResponse | null> {
  return postJSON<SelectExerciseResponse>('/select-exercise', {
    exercise_name: exerciseName,
  })
}

export function startTracking(
  exercise: string,
  setNumber: number,
  weight: number,
  unit: string,
): Promise<TrackingResponse | null> {
  return postJSON<TrackingResponse>('/start-set', {
    exercise_name: exercise,
    set_number: setNumber,
    weight,
    unit,
  })
}

export function stopTracking(): Promise<{ ok: boolean } | null> {
  return postJSON<{ ok: boolean }>('/stop-set', {})
}

export interface SessionStatus {
  active: boolean
  tracking: boolean
  bluetooth_connected?: boolean
}

export async function checkConnection(): Promise<SessionStatus | null> {
  try {
    const res = await fetch(`${API_BASE}/session`, { method: 'GET' })
    if (!res.ok) throw new Error(`status ${res.status}`)
    return (await res.json()) as SessionStatus
  } catch (err) {
    console.warn('[LiftLog] backend unreachable (session):', err)
    return null
  }
}
