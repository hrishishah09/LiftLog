import { useMemo, useState } from 'react'
import type { Routine, SessionRecord, Unit } from '../types'
import { exerciseName } from '../exercises'
import { convertWeight } from '../units'
import { ROUTINE_THEMES } from '../themes'
import { CloseIcon, ChevronIcon } from './icons'

interface ProgressChartModalProps {
  routine: Routine
  sessions: SessionRecord[]
  unit: Unit
  onClose: () => void
}

interface ChartPoint {
  date: string
  dateLabel: string
  setIndex: number
  weight: number
  reps: number
}

interface SessionGroup {
  dateLabel: string
  date: string
  points: ChartPoint[]
}

export function ProgressChartModal({ routine, sessions, unit, onClose }: ProgressChartModalProps) {
  const routineExerciseIds = routine.exercises.map((e) => e.exerciseId)
  const [selectedExercise, setSelectedExercise] = useState(routineExerciseIds[0] ?? '')
  const [metric, setMetric] = useState<'weight' | 'reps'>('weight')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [hovered, setHovered] = useState<(ChartPoint & { x: number; y: number }) | null>(null)

  const theme = ROUTINE_THEMES[routine.theme]

  const filteredSessions = useMemo(
    () => sessions.filter((s) => s.workout === routine.name),
    [sessions, routine.name],
  )

  const groups: SessionGroup[] = useMemo(() => {
    const result: SessionGroup[] = []
    for (const session of filteredSessions) {
      const exRecord = session.exercises.find((e) => e.exerciseId === selectedExercise)
      if (!exRecord || exRecord.sets.length === 0) continue
      const dateLabel = new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      const points: ChartPoint[] = exRecord.sets.map((s, i) => ({
        date: session.date,
        dateLabel,
        setIndex: i,
        weight: convertWeight(s.weight, 'kg', unit),
        reps: s.reps,
      }))
      result.push({ dateLabel, date: session.date, points })
    }
    return result
  }, [filteredSessions, selectedExercise, unit])

  const allValues = groups.flatMap((g) => g.points.map((p) => (metric === 'weight' ? p.weight : p.reps)))
  const maxValue = allValues.length > 0 ? Math.max(...allValues) : 0
  const yMax = Math.max(maxValue * 1.15, 10)

  const totalSets = groups.reduce((sum, g) => sum + g.points.length, 0)
  const sessionCount = groups.length

  const chartWidth = 760
  const chartHeight = 320
  const padding = { top: 30, right: 50, bottom: 50, left: 55 }
  const plotWidth = chartWidth - padding.left - padding.right
  const plotHeight = chartHeight - padding.top - padding.bottom

  const xSlotCount = Math.max(sessionCount, 1)
  const slotWidth = plotWidth / xSlotCount

  const yTicks = 5
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) => Math.round((yMax / yTicks) * i))

  const getX = (sessionIndex: number, setIndex: number, totalSetsInSession: number) => {
    const slotStart = padding.left + sessionIndex * slotWidth
    const setSpacing = totalSetsInSession > 1 ? slotWidth / (totalSetsInSession + 1) : slotWidth / 2
    return slotStart + setSpacing * (setIndex + 1)
  }

  const getY = (value: number) => padding.top + plotHeight - (value / yMax) * plotHeight

  const allPoints = groups.flatMap((g, si) =>
    g.points.map((p, pi) => ({
      ...p,
      x: getX(si, pi, g.points.length),
      y: getY(metric === 'weight' ? p.weight : p.reps),
      sessionIndex: si,
    })),
  )
  const linePath = allPoints.length > 0
    ? allPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    : ''

  const areaPath = allPoints.length > 0
    ? `${linePath} L ${allPoints[allPoints.length - 1].x} ${padding.top + plotHeight} L ${allPoints[0].x} ${padding.top + plotHeight} Z`
    : ''

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-sm">
      <div className="animate-slide-up max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Progress Charts</h2>
            <p className="text-xs text-gray-400">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${theme.badge}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${theme.dot}`} />
                {routine.name}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative">
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                className="flex w-56 items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 transition-colors hover:border-gray-300"
              >
                <span>{exerciseName(selectedExercise)}</span>
                <ChevronIcon className={`h-4 w-4 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                  <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-lg">
                    {routineExerciseIds.map((id) => (
                      <button
                        key={id}
                        onClick={() => { setSelectedExercise(id); setDropdownOpen(false) }}
                        className={`block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-gray-50 ${
                          id === selectedExercise ? 'font-bold text-indigo-600' : 'text-gray-700'
                        }`}
                      >
                        {exerciseName(id)}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-1 rounded-xl bg-gray-100 p-1">
              <button
                onClick={() => setMetric('weight')}
                className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
                  metric === 'weight' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'
                }`}
              >
                Weight ({unit})
              </button>
              <button
                onClick={() => setMetric('reps')}
                className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
                  metric === 'reps' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'
                }`}
              >
                Reps
              </button>
            </div>
          </div>

          <div className="mb-4 flex gap-6 text-xs">
            <div>
              <span className="font-bold text-gray-900">{sessionCount}</span>
              <span className="ml-1 text-gray-400">sessions</span>
            </div>
            <div>
              <span className="font-bold text-gray-900">{totalSets}</span>
              <span className="ml-1 text-gray-400">total sets</span>
            </div>
          </div>

          {groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50">
                <svg viewBox="0 0 24 24" className="h-6 w-6 text-gray-300" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3v18h18" />
                  <path d="m19 9-5 5-4-4-3 3" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-500">No data yet</p>
              <p className="mt-1 text-xs text-gray-400">
                Complete this workout to see your progress charts here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-gray-50/30 p-2">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full" style={{ minWidth: 500 }}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={theme.hex} stopOpacity="0.15" />
                    <stop offset="100%" stopColor={theme.hex} stopOpacity="0" />
                  </linearGradient>
                </defs>

                {yTickValues.map((tv, i) => {
                  const y = getY(tv)
                  return (
                    <g key={i}>
                      <line
                        x1={padding.left}
                        y1={y}
                        x2={chartWidth - padding.right}
                        y2={y}
                        stroke="#f0f0f0"
                        strokeWidth="1"
                      />
                      <text
                        x={padding.left - 10}
                        y={y + 4}
                        textAnchor="end"
                        className="fill-gray-400"
                        style={{ fontSize: 11, fontWeight: 500 }}
                      >
                        {tv}
                      </text>
                    </g>
                  )
                })}

                {groups.map((g, si) => {
                  const x = padding.left + si * slotWidth + slotWidth / 2
                  return (
                    <text
                      key={si}
                      x={x}
                      y={chartHeight - padding.bottom + 22}
                      textAnchor="middle"
                      className="fill-gray-500"
                      style={{ fontSize: 11, fontWeight: 600 }}
                    >
                      {g.dateLabel}
                    </text>
                  )
                })}

                {groups.map((_g, si) => {
                  const x = padding.left + si * slotWidth + slotWidth / 2
                  return (
                    <line
                      key={`vline-${si}`}
                      x1={x}
                      y1={padding.top}
                      x2={x}
                      y2={padding.top + plotHeight}
                      stroke="#e5e7eb"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    />
                  )
                })}

                {areaPath && <path d={areaPath} fill="url(#areaGradient)" />}

                {linePath && (
                  <path
                    d={linePath}
                    fill="none"
                    stroke={theme.hex}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {allPoints.map((p, i) => (
                  <g key={i}>
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={hovered === p ? 7 : 4}
                      fill="white"
                      stroke={theme.hex}
                      strokeWidth="2.5"
                      className="transition-all"
                    />
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="14"
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={() => setHovered(p)}
                      onMouseLeave={() => setHovered(null)}
                    />
                  </g>
                ))}

                {hovered && (
                  <g>
                    <rect
                      x={Math.min(hovered.x + 10, chartWidth - 160)}
                      y={Math.max(hovered.y - 45, 5)}
                      width="150"
                      height="38"
                      rx="8"
                      fill="#1f2937"
                      opacity="0.95"
                    />
                    <text
                      x={Math.min(hovered.x + 18, chartWidth - 152)}
                      y={Math.max(hovered.y - 28, 22)}
                      className="fill-white"
                      style={{ fontSize: 11, fontWeight: 700 }}
                    >
                      Set {hovered.setIndex + 1}: {hovered.weight} {unit} x {hovered.reps} reps
                    </text>
                    <text
                      x={Math.min(hovered.x + 18, chartWidth - 152)}
                      y={Math.max(hovered.y - 14, 36)}
                      className="fill-gray-300"
                      style={{ fontSize: 10 }}
                    >
                      {hovered.dateLabel}
                    </text>
                  </g>
                )}

                <text
                  x={padding.left - 40}
                  y={padding.top - 12}
                  className="fill-gray-400"
                  style={{ fontSize: 10, fontWeight: 600 }}
                >
                  {metric === 'weight' ? unit : 'reps'}
                </text>
              </svg>
            </div>
          )}

          <div className="mt-4 flex items-center justify-center gap-6 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: theme.hex }} />
              <span className="font-medium">{metric === 'weight' ? `Weight (${unit})` : 'Reps'} per set</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-px bg-gray-300" />
              <span>Session boundary</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
