import { PlusIcon } from './icons'
import type { Unit } from '../types'

interface HeaderProps {
  onCreateWorkout: () => void
  unit: Unit
  onToggleUnit: () => void
  connected: boolean
}

export function Header({ onCreateWorkout, unit, onToggleUnit, connected }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 shadow-lg shadow-indigo-500/30">
            <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6.5 6.5 17.5 17.5" />
              <path d="m3 7 2-2 3 3-2 2-3-3Z" />
              <path d="m16 16 3 3 2-2-3-3-2 2Z" />
              <path d="m3.5 14.5 3 3M20.5 9.5l-3-3" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-gray-900">LiftLog</h1>
            <p className="text-[11px] font-medium text-gray-400">Fitness Tracker</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Unit toggle */}
          <div className="inline-flex overflow-hidden rounded-xl border border-gray-200 bg-white p-0.5">
            <button
              onClick={() => unit !== 'kg' && onToggleUnit()}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                unit === 'kg'
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              kg
            </button>
            <button
              onClick={() => unit !== 'lbs' && onToggleUnit()}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                unit === 'lbs'
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              lbs
            </button>
          </div>

          <button
            onClick={onCreateWorkout}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-600 hover:shadow-indigo-500/40 active:scale-[0.98]"
          >
            <PlusIcon className="h-4 w-4" />
            Create Custom Workout
          </button>

          {/* Wristband connection status — driven by backend bluetooth status */}
          <div
            className={`hidden items-center gap-2 rounded-full border px-3.5 py-2 sm:inline-flex ${
              connected
                ? 'border-emerald-100 bg-emerald-50'
                : 'border-gray-200 bg-gray-50'
            }`}
          >
            <span className="relative flex h-2.5 w-2.5">
              {connected && (
                <span className="absolute inline-flex h-full w-full animate-pulse-dot rounded-full bg-emerald-400" />
              )}
              <span
                className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                  connected ? 'bg-emerald-500' : 'bg-gray-400'
                }`}
              />
            </span>
            <span
              className={`text-xs font-semibold ${
                connected ? 'text-emerald-700' : 'text-gray-500'
              }`}
            >
              {connected ? 'LiftLog Wristband: Connected' : 'Wristband: Disconnected'}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
