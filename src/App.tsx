import { useCallback, useState } from 'react'
import type { Routine, SessionRecord } from './types'
import { loadRoutines, loadSessions, saveRoutine, deleteRoutine } from './db'
import { Header } from './components/Header'
import { WorkoutManager } from './components/WorkoutManager'
import { CreateWorkoutModal } from './components/CreateWorkoutModal'
import { LiveTrackingHub } from './components/LiveTrackingHub'
import { PerformanceHistory } from './components/PerformanceHistory'

export default function App() {
  const [routines, setRoutines] = useState<Routine[]>(() => loadRoutines())
  const [activeRoutineId, setActiveRoutineId] = useState<string | null>(
    () => routines[0]?.id ?? null,
  )
  const [history] = useState<SessionRecord[]>(() => loadSessions())
  const [modalOpen, setModalOpen] = useState(false)

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
    deleteRoutine(id)
  }, [])

  const handleCreate = useCallback((routine: Routine) => {
    setRoutines((prev) => [...prev, routine])
    setActiveRoutineId(routine.id)
    saveRoutine(routine)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50/60 text-gray-900 antialiased">
      <Header onCreateWorkout={() => setModalOpen(true)} />

      <main className="mx-auto max-w-7xl px-6 py-8 sm:px-8">
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
