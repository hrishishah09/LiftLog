import { useState } from 'react'
import type { SessionRecord } from '../types'
import { exerciseName } from '../exercises'
import { ROUTINE_THEMES } from '../themes'
import { ChevronIcon, TrashIcon } from './icons'

interface PerformanceHistoryProps {
  records: SessionRecord[]
  onDeleteSession: (id: string) => void
}

export function PerformanceHistory({ records, onDeleteSession }: PerformanceHistoryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const toggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-baseline justify-between border-b border-gray-100 px-6 py-5">
        <div>
          <h2 className="text-base font-bold text-gray-900">Performance History</h2>
          <p className="text-xs text-gray-400">Completed workout sessions</p>
        </div>
        <span className="text-xs font-medium text-gray-400">{records.length} sessions</span>
      </div>

      {records.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50">
            <svg viewBox="0 0 24 24" className="h-6 w-6 text-gray-300" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18h18" />
              <path d="m19 9-5 5-4-4-3 3" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-gray-500">No workouts yet</p>
          <p className="mt-1 text-xs text-gray-400">
            Complete a workout to see your performance history here.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {records.map((r) => {
            const theme = ROUTINE_THEMES[r.theme]
            const isExpanded = r.id === expandedId
            return (
              <div key={r.id} className="transition-colors hover:bg-gray-50/30">
                <div
                  onClick={() => toggle(r.id)}
                  className="flex cursor-pointer items-center gap-3 px-6 py-4"
                >
                  <span className={`h-8 w-1.5 rounded-full ${theme.dot}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${theme.badge}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${theme.dot}`} />
                        {r.workout}
                      </span>
                      <span className="text-xs font-medium text-gray-400">
                        {new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <span className="hidden text-xs font-bold text-gray-900 sm:block">
                    {r.totalReps} reps
                  </span>
                  <span className="hidden text-xs font-medium text-gray-400 sm:block">
                    {r.exercises.length} exercises
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteSession(r.id)
                    }}
                    className="rounded-lg p-2 text-gray-300 transition-colors hover:bg-rose-50 hover:text-rose-500"
                    aria-label="Delete workout"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                  <ChevronIcon
                    className={`h-4 w-4 text-gray-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </div>

                {isExpanded && (
                  <div className="animate-slide-up border-t border-gray-50 px-6 py-4">
                    <div className="flex flex-col gap-4">
                      {r.exercises.map((ex, i) => (
                        <div key={i} className="rounded-xl border border-gray-100 bg-gray-50/40 px-4 py-3">
                          <h4 className="mb-2 text-sm font-bold text-gray-900">
                            {exerciseName(ex.exerciseId)}
                          </h4>
                          <div className="flex flex-col gap-1.5">
                            {ex.sets.map((s, j) => (
                              <div key={j} className="flex items-center gap-3 text-sm">
                                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white text-xs font-bold text-gray-500 ring-1 ring-gray-100">
                                  {s.setNumber}
                                </span>
                                <span className="flex-1 font-medium text-gray-600">
                                  {s.weight > 0 ? `${s.weight} kg` : 'Bodyweight'}
                                </span>
                                <span className="font-bold text-indigo-600">{s.reps} reps</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
