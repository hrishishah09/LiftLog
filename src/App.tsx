import { useCallback, useEffect, useState } from 'react'
import type { Routine, SessionRecord, Unit } from './types'
import { loadRoutines, loadSessions, saveRoutine, updateRoutine, deleteRoutine, saveSession, deleteSession } from './db'
import { checkConnection } from './api'
import { Header } from './components/Header'
import { WorkoutManager } from './components/WorkoutManager'
import { CreateWorkoutModal } from './components/CreateWorkoutModal'
import { LiveTrackingHub } from './components/LiveTrackingHub'
import { PerformanceHistory } from './components/PerformanceHistory'
import { ProgressChartModal } from './components/ProgressChartModal'

export default function App() {
  const [routines, setRoutines] = useState<Routine[]>(() => loadRoutines())
  const [activeRoutineId, setActiveRoutineId] = useState<string | null>(null)
  const [history, setHistory] = useState<SessionRecord[]>(() => loadSessions())
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null)
  const [progressRoutine, setProgressRoutine] = useState<Routine | null>(null)
  const [unit, setUnit] = useState<Unit>('kg')
  const [connected, setConnected] = useState(false)

  const activeRoutine = routines.find((r) => r.id === activeRoutineId) ?? null
  const isWorkoutActive = activeRoutineId !== null

  // Poll the Python backend for bluetooth connection status.
  useEffect(() => {
    let cancelled = false
    const poll = async () => {
      const status = await checkConnection()
      if (!cancelled && status) {
        setConnected(status.bluetooth_connected ?? false)
      } else if (!cancelled) {
        setConnected(false)
      }
    }
    poll()
    const interval = setInterval(poll, 5000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  const handleDelete = useCallback((id: string) => {
    setRoutines((prev) => {
      const next = prev.filter((r) => r.id !== id)
      setActiveRoutineId((curr) => {
        if (curr !== id) return curr
        return null
      })
      return next
    })
    deleteRoutine(id)
  }, [])

  const handleCreate = useCallback((routine: Routine) => {
    setRoutines((prev) => [...prev, routine])
    saveRoutine(routine)
  }, [])

  const handleUpdateRoutine = useCallback((routine: Routine) => {
    setRoutines((prev) => prev.map((r) => (r.id === routine.id ? routine : r)))
    updateRoutine(routine)
  }, [])

  const handleEditRoutine = useCallback((routine: Routine) => {
    setEditingRoutine(routine)
    setModalOpen(true)
  }, [])

  const handleOpenCreate = useCallback(() => {
    setEditingRoutine(null)
    setModalOpen(true)
  }, [])

  const handleStartRoutine = useCallback((id: string) => {
    setActiveRoutineId(id)
  }, [])

  const handleExitRoutine = useCallback(() => {
    setActiveRoutineId(null)
  }, [])

  const handleWorkoutComplete = useCallback((session: SessionRecord) => {
    setHistory((prev) => [session, ...prev])
    saveSession(session)
  }, [])

  const handleDeleteSession = useCallback((id: string) => {
    setHistory((prev) => prev.filter((s) => s.id !== id))
    deleteSession(id)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50/60 text-gray-900 antialiased">
      <Header
        onCreateWorkout={handleOpenCreate}
        unit={unit}
        onToggleUnit={() => setUnit((u) => (u === 'kg' ? 'lbs' : 'kg'))}
        connected={connected}
      />

      <main className="mx-auto max-w-7xl px-6 py-8 sm:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[380px_1fr]">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <WorkoutManager
              routines={routines}
              activeRoutineId={activeRoutineId}
              locked={isWorkoutActive}
              onStartRoutine={handleStartRoutine}
              onDeleteRoutine={handleDelete}
              onEditRoutine={handleEditRoutine}
              onViewProgress={setProgressRoutine}
            />
          </div>

          <div className="flex flex-col gap-8">
            <LiveTrackingHub
              routine={activeRoutine}
              unit={unit}
              onExitRoutine={handleExitRoutine}
              onWorkoutComplete={handleWorkoutComplete}
            />
            <PerformanceHistory records={history} unit={unit} onDeleteSession={handleDeleteSession} />
          </div>
        </div>
      </main>

      <CreateWorkoutModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingRoutine(null) }}
        onCreate={handleCreate}
        editingRoutine={editingRoutine}
        onUpdate={handleUpdateRoutine}
      />
      {progressRoutine && (
        <ProgressChartModal
          routine={progressRoutine}
          sessions={history}
          unit={unit}
          onClose={() => setProgressRoutine(null)}
        />
      )}
    </div>
  )
}
