import { useState } from 'react'
import type { Routine } from '../types'
import { exerciseName, placementFor } from '../exercises'
import { ROUTINE_THEMES } from '../themes'
import { ChevronIcon, TrashIcon } from './icons'

interface WorkoutManagerProps {
  routines: Routine[]
  activeRoutineId: string | null
  locked: boolean
  onStartRoutine: (id: string) => void
  onDeleteRoutine: (id: string) => void
  onEditRoutine: (routine: Routine) => void
  onViewProgress: (routine: Routine) => void
}

export function WorkoutManager({
  routines,
  activeRoutineId,
  locked,
  onStartRoutine,
  onDeleteRoutine,
  onEditRoutine,
  onViewProgress,
}: WorkoutManagerProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const toggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
          Workout Routines
        </h2>
        <span className="text-xs font-medium text-gray-400">{routines.length} saved</span>
      </div>

      {routines.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col gap-3">
          {routines.map((routine) => {
            const theme = ROUTINE_THEMES[routine.theme]
            const isActive = routine.id === activeRoutineId
            const isExpanded = routine.id === expandedId
            const isDisabled = locked && !isActive
            return (
              <article
                key={routine.id}
                className={`group overflow-hidden rounded-2xl border bg-white transition-all duration-200 ${
                  isActive
                    ? 'border-indigo-200 shadow-lg shadow-indigo-500/5'
                    : isDisabled
                      ? 'border-gray-100 opacity-50 shadow-sm'
                      : 'border-gray-100 shadow-sm hover:border-gray-200 hover:shadow-md'
                }`}
              >
                <div
                  onClick={() => !isDisabled && toggle(routine.id)}
                  className={`flex items-center gap-3 px-5 py-4 ${
                    isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  <span className={`h-9 w-1.5 rounded-full ${theme.dot}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-base font-bold text-gray-900">{routine.name}</h3>
                      {isActive && (
                        <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-600">
                          Active
                        </span>
                      )}
                    </div>
                    {routine.description && (
                      <p className="truncate text-xs text-gray-400">{routine.description}</p>
                    )}
                  </div>
                  <span className="hidden text-xs font-medium text-gray-400 sm:block">
                    {routine.exercises.length} exercises
                  </span>
                  {!locked && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onViewProgress(routine)
                        }}
                        className="rounded-lg p-2 text-gray-300 transition-colors hover:bg-indigo-50 hover:text-indigo-500"
                        aria-label={`View progress for ${routine.name}`}
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 3v18h18" />
                          <path d="m19 9-5 5-4-4-3 3" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onEditRoutine(routine)
                        }}
                        className="rounded-lg p-2 text-gray-300 transition-colors hover:bg-sky-50 hover:text-sky-500"
                        aria-label={`Edit ${routine.name}`}
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteRoutine(routine.id)
                        }}
                        className="rounded-lg p-2 text-gray-300 transition-colors hover:bg-rose-50 hover:text-rose-500"
                        aria-label={`Delete ${routine.name}`}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  <ChevronIcon
                    className={`h-4 w-4 text-gray-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </div>

                {isExpanded && (
                  <div className="animate-slide-up border-t border-gray-50 px-5 py-4">
                    <ul className="flex flex-col divide-y divide-gray-50">
                      {routine.exercises.map((ex, i) => {
                        const placement = placementFor(ex.exerciseId)
                        return (
                          <li key={i} className="flex items-center gap-3 py-2.5">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-50 text-xs font-bold text-gray-500">
                              {i + 1}
                            </span>
                            <span className="flex-1 text-sm font-medium text-gray-700">
                              {exerciseName(ex.exerciseId)}
                            </span>
                            <span
                              className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                                placement === 'WRIST'
                                  ? 'bg-indigo-50 text-indigo-600'
                                  : 'bg-violet-50 text-violet-600'
                              }`}
                            >
                              {placement}
                            </span>
                            <span className="w-16 text-right text-xs font-semibold text-gray-500">
                              {ex.sets} sets
                            </span>
                          </li>
                        )
                      })}
                    </ul>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onStartRoutine(routine.id)
                      }}
                      className="mt-4 w-full rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-600 active:scale-[0.98]"
                    >
                      {locked && isActive ? 'Workout In Progress' : 'Start Workout'}
                    </button>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white/50 px-6 py-14 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50">
        <svg viewBox="0 0 24 24" className="h-6 w-6 text-gray-300" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6.5 6.5 17.5 17.5" />
          <path d="m3 7 2-2 3 3-2 2-3-3Z" />
          <path d="m16 16 3 3 2-2-3-3-2 2Z" />
        </svg>
      </div>
      <h3 className="text-sm font-semibold text-gray-600">No routines yet</h3>
      <p className="mt-1 max-w-xs text-xs text-gray-400">
        Create a custom workout to get started. Your routines will appear here.
      </p>
    </div>
  )
}
