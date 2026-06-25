import { useEffect, useState } from 'react'
import type { Routine, SessionRecord, Unit, ExerciseRecord, SetRecord } from '../types'
import { exerciseName, placementFor } from '../exercises'
import { startTracking, stopTracking } from '../api'

interface LiveTrackingHubProps {
  routine: Routine | null
  unit: Unit
  onExitRoutine: () => void
  onWorkoutComplete: (session: SessionRecord) => void
}

type Phase = 'idle' | 'tracking' | 'rest' | 'complete'

interface CompletedSet {
  exerciseId: string
  setNumber: number
  weight: number
  reps: number
}

export function LiveTrackingHub({ routine, unit, onExitRoutine, onWorkoutComplete }: LiveTrackingHubProps) {
  const queue = routine?.exercises ?? []

  const [exerciseIdx, setExerciseIdx] = useState(0)
  const [activeSet, setActiveSet] = useState(1)
  const [reps, setReps] = useState(0)
  const [phase, setPhase] = useState<Phase>('idle')
  const [weightInput, setWeightInput] = useState('')
  const [backendAck, setBackendAck] = useState<string | null>(null)
  const [completed, setCompleted] = useState<CompletedSet[]>([])

  // When the active routine changes, reset everything
  useEffect(() => {
    setExerciseIdx(0)
    setActiveSet(1)
    setReps(0)
    setPhase('idle')
    setWeightInput('')
    setBackendAck(null)
    setCompleted([])
  }, [routine?.id])

  const currentConfig = queue[exerciseIdx]
  const exerciseId = currentConfig?.exerciseId ?? ''
  const totalSets = currentConfig?.sets ?? 0
  const placement = exerciseId ? placementFor(exerciseId) : 'WRIST'

  const handleStartSet = async () => {
    const weight = parseFloat(weightInput) || 0
    setPhase('tracking')
    setReps(0)
    const res = await startTracking(exerciseName(exerciseId), activeSet, weight, unit)
    if (res) {
      setBackendAck(`${res.exercise} · ${res.state} · ${res.unit}`)
    }
  }

  const handleStopSet = async () => {
    await stopTracking()
    setPhase('rest')
  }

  const handleCompleteSet = async () => {
    if (phase === 'tracking') {
      await stopTracking()
    }

    const weight = parseFloat(weightInput) || 0
    const newCompleted: CompletedSet = { exerciseId, setNumber: activeSet, weight, reps }
    const allCompleted = [...completed, newCompleted]
    setCompleted(allCompleted)

    if (activeSet < totalSets) {
      setActiveSet((s) => s + 1)
      setPhase('idle')
      setWeightInput('')
      return
    }
    // Final set of this exercise — advance to next exercise in the routine queue
    const nextIdx = exerciseIdx + 1
    if (nextIdx < queue.length) {
      setExerciseIdx(nextIdx)
      setActiveSet(1)
      setReps(0)
      setPhase('idle')
      setWeightInput('')
    } else {
      // Routine complete — build session record and fire callback
      const exercises = buildExerciseRecords(allCompleted)
      const totalReps = allCompleted.reduce((sum, s) => sum + s.reps, 0)
      const session: SessionRecord = {
        id: `s-${Date.now()}`,
        date: new Date().toISOString(),
        workout: routine?.name ?? 'Custom Workout',
        theme: routine?.theme ?? 'indigo',
        totalReps,
        duration: `${allCompleted.length} sets`,
        exercises,
      }
      setPhase('complete')
      onWorkoutComplete(session)
    }
  }

  const isRoutineComplete = phase === 'complete'

  // Group completed sets by exercise for the summary
  const completedByExercise = completed.reduce<Record<string, CompletedSet[]>>((acc, s) => {
    (acc[s.exerciseId] ??= []).push(s)
    return acc
  }, {})

  return (
    <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
      {/* Hub header: current exercise + placement badge + exit button */}
      <div className="flex flex-col gap-3 border-b border-gray-100 bg-gradient-to-br from-gray-50/80 to-white px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 text-white">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </span>
          <div>
            <h2 className="text-base font-bold text-gray-900">Live Tracking Hub</h2>
            <p className="text-[11px] text-gray-400">
              {routine
                ? isRoutineComplete
                  ? `${routine.name} · Complete`
                  : `${routine.name} · Exercise ${exerciseIdx + 1} of ${queue.length}`
                : 'No routine started'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {routine && currentConfig && !isRoutineComplete && (
            <>
              <span className="rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-800">
                {exerciseName(exerciseId)}
              </span>
              <div
                className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-bold ${
                  placement === 'WRIST'
                    ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200'
                    : 'bg-violet-50 text-violet-700 ring-1 ring-violet-200'
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${placement === 'WRIST' ? 'bg-indigo-500' : 'bg-violet-500'}`}
                />
                {placement === 'WRIST' ? 'Wear on WRIST' : 'Clip to WAIST'}
              </div>
            </>
          )}
          {routine && (
            <button
              onClick={onExitRoutine}
              className="rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-gray-500 transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
            >
              {isRoutineComplete ? 'Back to Routines' : 'Exit Workout'}
            </button>
          )}
        </div>
      </div>

      {!routine ? (
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <p className="text-sm font-semibold text-gray-500">No routine active</p>
          <p className="mt-1 text-xs text-gray-400">
            Select a routine from the left and click "Start Workout" to begin tracking.
          </p>
        </div>
      ) : isRoutineComplete ? (
        <WorkoutSummary completed={completed} unit={unit} routineName={routine.name} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* LEFT: rep counter + tracking status */}
          <div className="flex flex-col items-center justify-center border-b border-gray-100 px-6 py-10 lg:border-b-0 lg:border-r">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Reps This Set
            </span>
            <div
              key={`${exerciseId}-${activeSet}`}
              className="animate-scale-in font-mono text-[120px] font-extrabold leading-none tracking-tighter text-gray-900"
            >
              {String(reps).padStart(2, '0')}
            </div>
            <div className={`mt-4 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 ${
              phase === 'tracking'
                ? 'border-emerald-100 bg-emerald-50'
                : 'border-gray-100 bg-gray-50'
            }`}>
              {phase === 'tracking' ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-pulse-dot rounded-full bg-emerald-400" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  <span className="text-xs font-semibold text-emerald-700">Live Tracking</span>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-gray-300" />
                  <span className="text-xs font-semibold text-gray-400">
                    {phase === 'rest' ? 'Set paused' : 'Ready to start'}
                  </span>
                </>
              )}
            </div>
            {backendAck && phase === 'tracking' && (
              <p className="mt-3 text-[11px] font-medium text-gray-300">
                Backend tracker: {backendAck}
              </p>
            )}
          </div>

          {/* RIGHT: set checklist + controls + completed exercises */}
          <div className="flex flex-col px-6 py-7">
            <div className="mb-4 flex items-baseline justify-between">
              <h3 className="text-sm font-bold text-gray-900">Set Progress</h3>
              <span className="text-xs font-medium text-gray-400">
                {exerciseName(exerciseId)} · {totalSets} sets
              </span>
            </div>

            <ul className="flex flex-col gap-2">
              {Array.from({ length: totalSets }).map((_, i) => {
                const setNum = i + 1
                const isComplete = setNum < activeSet
                const isActive = setNum === activeSet
                const completedSet = completed.find(
                  (s) => s.exerciseId === exerciseId && s.setNumber === setNum,
                )
                return (
                  <li
                    key={i}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all ${
                      isActive && phase === 'tracking'
                        ? 'border-indigo-200 bg-indigo-50/60 shadow-sm'
                        : isActive
                          ? 'border-indigo-200 bg-white'
                          : isComplete
                            ? 'border-gray-100 bg-gray-50/50'
                            : 'border-gray-100 bg-white'
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${
                        isComplete
                          ? 'border-indigo-500 bg-indigo-500 text-white'
                          : isActive
                            ? 'border-indigo-500 bg-white'
                            : 'border-gray-200 bg-white'
                      }`}
                    >
                      {isComplete && (
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      )}
                      {isActive && <span className="h-2 w-2 rounded-full bg-indigo-500" />}
                    </span>
                    <span
                      className={`text-sm font-semibold ${
                        isActive ? 'text-indigo-700' : isComplete ? 'text-gray-400' : 'text-gray-600'
                      }`}
                    >
                      Set {setNum}
                    </span>
                    {isComplete && completedSet && (
                      <span className="ml-auto flex items-center gap-2 text-xs font-semibold text-gray-500">
                        <span className="rounded-md bg-gray-100 px-2 py-0.5">
                          {completedSet.weight > 0
                            ? `${completedSet.weight} ${unit}`
                            : 'Bodyweight'}
                        </span>
                        <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-indigo-600">
                          {completedSet.reps} reps
                        </span>
                      </span>
                    )}
                    {isActive && phase === 'tracking' && (
                      <span className="ml-auto rounded-md bg-indigo-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                        Tracking
                      </span>
                    )}
                    {isActive && phase !== 'tracking' && (
                      <span className="ml-auto rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                        Active
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>

            {/* Weight input + Start Set */}
            {phase === 'idle' && (
              <div className="mt-5 flex flex-col gap-2.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Weight ({unit})
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 outline-none transition-all placeholder:text-gray-300 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                />
                <button
                  onClick={handleStartSet}
                  className="w-full rounded-xl bg-indigo-500 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-600 hover:shadow-indigo-500/40 active:scale-[0.99]"
                >
                  Start Set {activeSet}
                </button>
              </div>
            )}

            {/* Stop + Complete Set when tracking */}
            {phase === 'tracking' && (
              <div className="mt-5 flex flex-col gap-2.5">
                <button
                  onClick={handleStopSet}
                  className="w-full rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-600 transition-all hover:bg-gray-50 active:scale-[0.99]"
                >
                  Stop Tracking
                </button>
                <button
                  onClick={handleCompleteSet}
                  className="w-full rounded-xl bg-violet-500 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition-all hover:bg-violet-600 hover:shadow-violet-500/40 active:scale-[0.99]"
                >
                  Complete Set {activeSet}
                </button>
              </div>
            )}

            {/* Complete Set when paused after stop */}
            {phase === 'rest' && (
              <button
                onClick={handleCompleteSet}
                className="mt-5 w-full rounded-xl bg-violet-500 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition-all hover:bg-violet-600 hover:shadow-violet-500/40 active:scale-[0.99]"
              >
                Complete Set {activeSet}
              </button>
            )}

            {/* Completed exercises from this routine (below the controls) */}
            {Object.keys(completedByExercise).length > 0 && (
              <div className="mt-5 border-t border-gray-100 pt-4">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Completed Exercises
                </h4>
                <div className="flex flex-col gap-3">
                  {Object.entries(completedByExercise)
                    .filter(([id]) => id !== exerciseId)
                    .map(([id, sets]) => (
                      <div key={id} className="rounded-xl border border-gray-100 bg-gray-50/40 px-4 py-3">
                        <p className="mb-1.5 text-xs font-bold text-gray-700">
                          {exerciseName(id)}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {sets.map((s, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-500 ring-1 ring-gray-100"
                            >
                              <span className="text-gray-400">S{s.setNumber}</span>
                              {s.weight > 0 ? `${s.weight} ${unit}` : 'BW'}
                              <span className="text-indigo-500">{s.reps}r</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

function buildExerciseRecords(completed: CompletedSet[]): ExerciseRecord[] {
  const byExercise = completed.reduce<Record<string, CompletedSet[]>>((acc, s) => {
    (acc[s.exerciseId] ??= []).push(s)
    return acc
  }, {})
  return Object.entries(byExercise).map(([exerciseId, sets]) => ({
    exerciseId,
    sets: sets
      .sort((a, b) => a.setNumber - b.setNumber)
      .map<SetRecord>((s) => ({ setNumber: s.setNumber, weight: s.weight, reps: s.reps })),
  }))
}

function WorkoutSummary({
  completed,
  unit,
  routineName,
}: {
  completed: CompletedSet[]
  unit: Unit
  routineName: string
}) {
  const byExercise = completed.reduce<Record<string, CompletedSet[]>>((acc, s) => {
    (acc[s.exerciseId] ??= []).push(s)
    return acc
  }, {})
  const totalReps = completed.reduce((sum, s) => sum + s.reps, 0)
  const totalSets = completed.length

  return (
    <div className="px-6 py-8">
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
          <svg viewBox="0 0 24 24" className="h-7 w-7 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h3 className="text-lg font-extrabold text-gray-900">Workout Complete!</h3>
        <p className="mt-0.5 text-sm text-gray-400">{routineName}</p>
        <div className="mt-4 flex gap-6">
          <div className="text-center">
            <p className="text-2xl font-extrabold text-indigo-600">{totalSets}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Sets</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-extrabold text-indigo-600">{totalReps}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Total Reps</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-extrabold text-indigo-600">{Object.keys(byExercise).length}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Exercises</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {Object.entries(byExercise).map(([exerciseId, sets]) => (
          <div key={exerciseId} className="rounded-2xl border border-gray-100 bg-gray-50/40 px-5 py-4">
            <h4 className="mb-3 text-sm font-bold text-gray-900">{exerciseName(exerciseId)}</h4>
            <div className="flex flex-col gap-1.5">
              {sets
                .sort((a, b) => a.setNumber - b.setNumber)
                .map((s, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white text-xs font-bold text-gray-500 ring-1 ring-gray-100">
                      {s.setNumber}
                    </span>
                    <span className="flex-1 font-medium text-gray-600">
                      {s.weight > 0 ? `${s.weight} ${unit}` : 'Bodyweight'}
                    </span>
                    <span className="font-bold text-indigo-600">{s.reps} reps</span>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
