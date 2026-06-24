import { useCallback, useEffect, useState } from 'react'
import type { Routine, SessionRecord } from './types'
import { SEED_HISTORY, SEED_ROUTINES } from './seed'
import {
  createRoutine,
  createSession,
  deleteRoutine,
  loadRoutines,
  loadSessions,
} from './db'
import { Header } from './components/Header'
import { WorkoutManager } from './components/WorkoutManager'
import { CreateWorkoutModal } from './components/CreateWorkoutModal'
import { LiveTrackingHub } from './components/LiveTrackingHub'
import { PerformanceHistory } from './components/PerformanceHistory'

export default function App() {
  const [routines, setRoutines] = useState<Routine[]>([])
  const [activeRoutineId, setActiveRoutineId] = useState<string | null>(null)
  const [history, setHistory] = useState<SessionRecord[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Initial load from Supabase; seed the DB on first run if empty.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        let [dbRoutines, dbSessions] = await Promise.all([loadRoutines(), loadSessions()])

        if (dbRoutines.length === 0) {
          await Promise.all(SEED_ROUTINES.map((r) => createRoutine(r)))
          await Promise.all(SEED_HISTORY.map((s) => createSession(s)))
          dbRoutines = await loadRoutines()
          dbSessions = await loadSessions()
        }

        if (cancelled) return
        setRoutines(dbRoutines)
        setHistory(dbSessions)
        setActiveRoutineId(dbRoutines[0]?.id ?? null)
      } catch (err) {
        if (cancelled) return
        setLoadError(err instanceof Error ? err.message : String(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const activeRoutine = routines.find((r) => r.id === activeRoutineId) ?? null

  const handleDelete = useCallback((id: string) => {
    setRoutines((prev) => {
      const next = prev.filter((r) => r.id !== id)
      setActiveRoutineId((curr) => {
        if (curr !== id) return curr
        return next[0]?.id ?? null
      })
      return next
    })
    deleteRoutine(id).catch((err) => console.error('[LiftLog] delete failed:', err))
  }, [])

  const handleCreate = useCallback((routine: Routine) => {
    setRoutines((prev) => [...prev, routine])
    setActiveRoutineId(routine.id)
    createRoutine(routine).catch((err) => console.error('[LiftLog] create failed:', err))
  }, [])

  return (
    <div className="min-h-screen bg-gray-50/60 text-gray-900 antialiased">
      <Header onCreateWorkout={() => setModalOpen(true)} />

      <main className="mx-auto max-w-7xl px-6 py-8 sm:px-8">
        {loading ? (
          <LoadingState />
        ) : loadError ? (
          <ErrorState message={loadError} />
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[380px_1fr]">
            <div className="lg:sticky lg:top-24 lg:self-start">
              <WorkoutManager
                routines={routines}
                activeRoutineId={activeRoutineId}
                onSelectRoutine={setActiveRoutineId}
                onDeleteRoutine={handleDelete}
              />
            </div>

            <div className="flex flex-col gap-8">
              <LiveTrackingHub routine={activeRoutine} />
              <PerformanceHistory records={history} />
            </div>
          </div>
        )}
      </main>

      <footer className="mx-auto max-w-7xl px-6 pb-10 sm:px-8">
        <p className="text-center text-xs text-gray-300">
          LiftLog · ESP32 + MPU6050 + BLE · Python rep-counting bridge
        </p>
      </footer>

      <CreateWorkoutModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-indigo-500" />
      <p className="mt-4 text-sm font-medium text-gray-400">Loading your workouts…</p>
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-100 bg-rose-50/50 py-16 text-center">
      <p className="text-sm font-semibold text-rose-600">Couldn't load data</p>
      <p className="mt-1 max-w-md text-xs text-rose-400">{message}</p>
    </div>
  )
}
