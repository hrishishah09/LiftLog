import { useEffect, useState } from 'react'
import type { ExerciseConfig, Routine, RoutineTheme } from '../types'
import { EXERCISES } from '../exercises'
import { CheckIcon, CloseIcon } from './icons'

interface CreateWorkoutModalProps {
  open: boolean
  onClose: () => void
  onCreate: (routine: Routine) => void
}

const THEME_CYCLE: RoutineTheme[] = ['indigo', 'violet', 'emerald', 'amber', 'rose', 'sky']

export function CreateWorkoutModal({ open, onClose, onCreate }: CreateWorkoutModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selected, setSelected] = useState<Record<string, { sets: number; weight: number }>>({})

  useEffect(() => {
    if (open) {
      setName('')
      setDescription('')
      setSelected({})
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const toggleExercise = (id: string) => {
    setSelected((prev) => {
      const next = { ...prev }
      if (next[id]) {
        delete next[id]
      } else {
        next[id] = { sets: 3, weight: 20 }
      }
      return next
    })
  }

  const setSets = (id: string, delta: number) => {
    setSelected((prev) => ({
      ...prev,
      [id]: { ...prev[id], sets: Math.max(1, Math.min(10, prev[id].sets + delta)) },
    }))
  }

  const canCreate = name.trim().length > 0 && Object.keys(selected).length > 0

  const handleCreate = () => {
    if (!canCreate) return
    const exercises: ExerciseConfig[] = Object.entries(selected).map(([exerciseId, cfg]) => ({
      exerciseId,
      sets: cfg.sets,
      weight: cfg.weight,
    }))
    const theme = THEME_CYCLE[Math.floor(Math.random() * THEME_CYCLE.length)]
    onCreate({
      id: `r-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || undefined,
      theme,
      exercises,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 animate-fade-in bg-gray-900/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[88vh] w-full max-w-2xl animate-scale-in flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Create Custom Workout</h2>
            <p className="text-xs text-gray-400">Name your routine and pick exercises.</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
            aria-label="Close"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-400">
                Workout Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Upper Body Blast"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 outline-none transition-all placeholder:text-gray-300 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-400">
                Description <span className="font-normal text-gray-300">(optional)</span>
              </label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A short note about this routine"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 outline-none transition-all placeholder:text-gray-300 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-400">
                Exercises <span className="font-normal text-gray-300">({Object.keys(selected).length} selected)</span>
              </label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {EXERCISES.map((ex) => {
                  const isSel = !!selected[ex.id]
                  return (
                    <div
                      key={ex.id}
                      onClick={() => toggleExercise(ex.id)}
                      className={`cursor-pointer rounded-xl border p-3 transition-all ${
                        isSel
                          ? 'border-indigo-300 bg-indigo-50/60 ring-1 ring-indigo-200'
                          : 'border-gray-100 bg-white hover:border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border transition-all ${
                            isSel ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-gray-300 bg-white'
                          }`}
                        >
                          {isSel && <CheckIcon className="h-3 w-3" />}
                        </span>
                        <span className="flex-1 text-sm font-semibold text-gray-800">{ex.name}</span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                            ex.placement === 'WRIST'
                              ? 'bg-indigo-100 text-indigo-600'
                              : 'bg-violet-100 text-violet-600'
                          }`}
                        >
                          {ex.placement}
                        </span>
                      </div>
                      {isSel && (
                        <div
                          className="mt-2.5 flex items-center justify-between pl-7"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="text-[11px] font-medium text-gray-400">Sets</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSets(ex.id, -1)}
                              className="flex h-6 w-6 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50"
                            >
                              <span className="text-sm leading-none">−</span>
                            </button>
                            <span className="w-5 text-center text-sm font-bold text-gray-800">
                              {selected[ex.id].sets}
                            </span>
                            <button
                              onClick={() => setSets(ex.id, 1)}
                              className="flex h-6 w-6 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50"
                            >
                              <span className="text-sm leading-none">+</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50/50 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-500 transition-colors hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!canCreate}
            className="rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  )
}
