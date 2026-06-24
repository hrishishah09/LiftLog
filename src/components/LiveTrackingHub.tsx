import { useEffect, useMemo, useState } from 'react'
import type { Routine } from '../types'
import { EXERCISES, exerciseName, placementFor } from '../exercises'
import { selectExercise } from '../api'

interface LiveTrackingHubProps {
  routine: Routine | null
}

export function LiveTrackingHub({ routine }: LiveTrackingHubProps) {
  const queue = useMemo(
    () => (routine ? routine.exercises : []),
    [routine],
  )

  const [exerciseId, setExerciseId] = useState<string>(queue[0]?.exerciseId ?? EXERCISES[0].id)
  const [reps, setReps] = useState(0)
  const [activeSet, setActiveSet] = useState(1)
  const [backendAck, setBackendAck] = useState<string | null>(null)

  // Reset counter + set index when the exercise changes
  useEffect(() => {
    setReps(0)
    setActiveSet(1)
  }, [exerciseId])

  // When the active routine changes, jump to its first exercise
  useEffect(() => {
    if (queue.length > 0) {
      setExerciseId(queue[0].exerciseId)
    }
  }, [routine?.id, queue.length])

  const placement = placementFor(exerciseId)
  const currentConfig = queue.find((e) => e.exerciseId === exerciseId)
  const totalSets = currentConfig?.sets ?? 4

  // Fire POST to the Python bridge whenever the exercise changes
  useEffect(() => {
    let cancelled = false
    selectExercise(exerciseName(exerciseId)).then((res) => {
      if (!cancelled && res) {
        setBackendAck(`${res.tracker} · ${res.placement}`)
      }
    })
    return () => {
      cancelled = true
    }
  }, [exerciseId])

  const handleCompleteSet = () => {
    if (activeSet < totalSets) {
      setReps((r) => r + 1)
      setActiveSet((s) => s + 1)
      return
    }
    // Final set of this exercise — advance to next exercise in the routine queue
    setReps((r) => r + 1)
    const idx = queue.findIndex((e) => e.exerciseId === exerciseId)
    const next = queue[idx + 1]
    if (next) {
      setExerciseId(next.exerciseId)
    } else {
      // Routine complete — loop back to first exercise, reset sets
      setActiveSet(1)
      if (queue.length > 0) setExerciseId(queue[0].exerciseId)
    }
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
      {/* Hub header: selector + placement badge */}
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
              {routine ? `Active routine: ${routine.name}` : 'No routine selected'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <select
              value={exerciseId}
              onChange={(e) => setExerciseId(e.target.value)}
              className="appearance-none rounded-xl border border-gray-200 bg-white py-2.5 pl-3.5 pr-9 text-sm font-semibold text-gray-800 outline-none transition-all hover:border-gray-300 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
            >
              {EXERCISES.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name}
                </option>
              ))}
            </select>
            <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>

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
        </div>
      </div>

      {/* Split card layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* LEFT: rep counter */}
        <div className="flex flex-col items-center justify-center border-b border-gray-100 px-6 py-10 lg:border-b-0 lg:border-r">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Reps Completed
          </span>
          <div
            key={exerciseId}
            className="animate-scale-in font-mono text-[120px] font-extrabold leading-none tracking-tighter text-gray-900"
          >
            {String(reps).padStart(2, '0')}
          </div>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3.5 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-pulse-dot rounded-full bg-emerald-400" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-xs font-semibold text-emerald-700">Live Tracking</span>
          </div>
          {backendAck && (
            <p className="mt-3 text-[11px] font-medium text-gray-300">
              Backend tracker: {backendAck}
            </p>
          )}
        </div>

        {/* RIGHT: set checklist */}
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
              return (
                <li
                  key={i}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all ${
                    isActive
                      ? 'border-indigo-200 bg-indigo-50/60 shadow-sm'
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
                      isActive ? 'text-indigo-700' : isComplete ? 'text-gray-400 line-through' : 'text-gray-600'
                    }`}
                  >
                    Set {setNum}
                  </span>
                  {isActive && (
                    <span className="ml-auto rounded-md bg-indigo-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                      Active
                    </span>
                  )}
                  {isComplete && (
                    <span className="ml-auto text-[10px] font-bold uppercase tracking-wide text-gray-300">
                      Done
                    </span>
                  )}
                </li>
              )
            })}
          </ul>

          <button
            onClick={handleCompleteSet}
            className="mt-5 w-full rounded-xl bg-violet-500 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition-all hover:bg-violet-600 hover:shadow-violet-500/40 active:scale-[0.99]"
          >
            Complete Set {activeSet}
          </button>
        </div>
      </div>
    </section>
  )
}
