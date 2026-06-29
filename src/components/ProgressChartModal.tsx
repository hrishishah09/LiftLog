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

interface PlottedPoint {
  date: string
  dateLabel: string
  setIndex: number
  weight: number
  reps: number
  oneRM: number
  x: number
  yWeight: number
  yReps: number
  sessionIndex: number
}

interface SetLine {
  setIndex: number
  color: string
  points: PlottedPoint[]
  pathWeight: string
  pathReps: string
}

const SET_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#0ea5e9', '#8b5cf6', '#ec4899', '#14b8a6']

function epley1RM(weight: number, reps: number): number {
  return weight * (1 + reps / 30)
}

export function ProgressChartModal({ routine, sessions, unit, onClose }: ProgressChartModalProps) {
  const routineExerciseIds = routine.exercises.map((e) => e.exerciseId)
  const [selectedExercise, setSelectedExercise] = useState(routineExerciseIds[0] ?? '')
  const [viewMode, setViewMode] = useState<'sets' | '1rm'>('sets')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [hiddenSets, setHiddenSets] = useState<Set<number>>(new Set())
  const [hovered, setHovered] = useState<PlottedPoint | null>(null)

  const theme = ROUTINE_THEMES[routine.theme]

  const filteredSessions = useMemo(
    () => sessions.filter((s) => s.workout === routine.name),
    [sessions, routine.name],
  )

  const sessionDates = useMemo(() => {
    const dates: { date: string; dateLabel: string }[] = []
    for (const session of filteredSessions) {
      const exRecord = session.exercises.find((e) => e.exerciseId === selectedExercise)
      if (!exRecord || exRecord.sets.length === 0) continue
      dates.push({
        date: session.date,
        dateLabel: new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      })
    }
    return dates
  }, [filteredSessions, selectedExercise])

  const sessionCount = sessionDates.length
  const maxSetIndex = useMemo(() => {
    let max = 0
    for (const session of filteredSessions) {
      const exRecord = session.exercises.find((e) => e.exerciseId === selectedExercise)
      if (exRecord) max = Math.max(max, exRecord.sets.length)
    }
    return max
  }, [filteredSessions, selectedExercise])

  const chartWidth = 780
  const chartHeight = 340
  const padding = { top: 30, right: viewMode === '1rm' ? 50 : 55, bottom: 50, left: 55 }
  const plotWidth = chartWidth - padding.left - padding.right
  const plotHeight = chartHeight - padding.top - padding.bottom

  const slotWidth = plotWidth / Math.max(sessionCount, 1)

  const allPlottedPoints = useMemo<PlottedPoint[]>(() => {
    const points: PlottedPoint[] = []
    filteredSessions.forEach((session, si) => {
      const exRecord = session.exercises.find((e) => e.exerciseId === selectedExercise)
      if (!exRecord || exRecord.sets.length === 0) return
      const dateLabel = sessionDates[si]?.dateLabel ?? ''
      exRecord.sets.forEach((s, setIdx) => {
        const w = convertWeight(s.weight, 'kg', unit)
        points.push({
          date: session.date,
          dateLabel,
          setIndex: setIdx,
          weight: w,
          reps: s.reps,
          oneRM: epley1RM(w, s.reps),
          x: 0,
          yWeight: 0,
          yReps: 0,
          sessionIndex: si,
        })
      })
    })
    return points
  }, [filteredSessions, selectedExercise, unit, sessionDates])

  const allWeights = allPlottedPoints.map((p) => p.weight)
  const allReps = allPlottedPoints.map((p) => p.reps)
  const all1RMs = allPlottedPoints.map((p) => p.oneRM)

  const weightMax = allWeights.length > 0 ? Math.max(...allWeights) : 0
  const repsMax = allReps.length > 0 ? Math.max(...allReps) : 0
  const oneRMMax = all1RMs.length > 0 ? Math.max(...all1RMs) : 0

  const yWeightMax = Math.max(weightMax * 1.15, 10)
  const yRepsMax = Math.max(repsMax * 1.15, 10)
  const y1RMMax = Math.max(oneRMMax * 1.15, 10)

  const yTicks = 5
  const yWeightTicks = Array.from({ length: yTicks + 1 }, (_, i) => Math.round((yWeightMax / yTicks) * i))
  const yRepsTicks = Array.from({ length: yTicks + 1 }, (_, i) => Math.round((yRepsMax / yTicks) * i))
  const y1RMTicks = Array.from({ length: yTicks + 1 }, (_, i) => Math.round((y1RMMax / yTicks) * i))

  const getX = (sessionIndex: number) => padding.left + sessionIndex * slotWidth + slotWidth / 2
  const getYWeight = (value: number) => padding.top + plotHeight - (value / yWeightMax) * plotHeight
  const getYReps = (value: number) => padding.top + plotHeight - (value / yRepsMax) * plotHeight
  const getY1RM = (value: number) => padding.top + plotHeight - (value / y1RMMax) * plotHeight

  const plottedWithCoords: PlottedPoint[] = allPlottedPoints.map((p) => ({
    ...p,
    x: getX(p.sessionIndex),
    yWeight: getYWeight(p.weight),
    yReps: getYReps(p.reps),
  }))

  const setLines: SetLine[] = useMemo(() => {
    const lines: SetLine[] = []
    for (let si = 0; si < maxSetIndex; si++) {
      const pts = plottedWithCoords.filter((p) => p.setIndex === si).sort((a, b) => a.sessionIndex - b.sessionIndex)
      if (pts.length === 0) continue
      const pathWeight = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yWeight}`).join(' ')
      const pathReps = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yReps}`).join(' ')
      lines.push({
        setIndex: si,
        color: SET_COLORS[si % SET_COLORS.length],
        points: pts,
        pathWeight,
        pathReps,
      })
    }
    return lines
  }, [plottedWithCoords, maxSetIndex])

  const oneRMPoints = useMemo(() => {
    const result: { x: number; y: number; oneRM: number; dateLabel: string; date: string; weight: number; reps: number; setIndex: number }[] = []
    filteredSessions.forEach((session, si) => {
      const exRecord = session.exercises.find((e) => e.exerciseId === selectedExercise)
      if (!exRecord || exRecord.sets.length === 0) return
      let bestSet = exRecord.sets[0]
      let best1RM = epley1RM(convertWeight(bestSet.weight, 'kg', unit), bestSet.reps)
      let bestSetIdx = 0
      exRecord.sets.forEach((s, sIdx) => {
        const w = convertWeight(s.weight, 'kg', unit)
        const est = epley1RM(w, s.reps)
        if (est > best1RM) { best1RM = est; bestSet = s; bestSetIdx = sIdx }
      })
      const dateLabel = sessionDates[si]?.dateLabel ?? ''
      result.push({
        x: getX(si),
        y: getY1RM(best1RM),
        oneRM: best1RM,
        dateLabel,
        date: session.date,
        weight: convertWeight(bestSet.weight, 'kg', unit),
        reps: bestSet.reps,
        setIndex: bestSetIdx,
      })
    })
    return result
  }, [filteredSessions, selectedExercise, unit, sessionDates])

  const oneRMPath = oneRMPoints.length > 0
    ? oneRMPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    : ''

  const oneRMAreaPath = oneRMPoints.length > 0
    ? `${oneRMPath} L ${oneRMPoints[oneRMPoints.length - 1].x} ${padding.top + plotHeight} L ${oneRMPoints[0].x} ${padding.top + plotHeight} Z`
    : ''

  const toggleSet = (setIndex: number) => {
    setHiddenSets((prev) => {
      const next = new Set(prev)
      if (next.has(setIndex)) next.delete(setIndex)
      else next.add(setIndex)
      return next
    })
  }

  const totalSets = allPlottedPoints.length

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
          <button onClick={onClose} className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100">
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
                        onClick={() => { setSelectedExercise(id); setDropdownOpen(false); setHiddenSets(new Set()) }}
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
                onClick={() => setViewMode('sets')}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  viewMode === 'sets' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'
                }`}
              >
                Set-by-Set
              </button>
              <button
                onClick={() => setViewMode('1rm')}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  viewMode === '1rm' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'
                }`}
              >
                1RM Trend
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

          {sessionCount === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50">
                <svg viewBox="0 0 24 24" className="h-6 w-6 text-gray-300" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3v18h18" />
                  <path d="m19 9-5 5-4-4-3 3" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-500">No data yet</p>
              <p className="mt-1 text-xs text-gray-400">Complete this workout to see your progress charts here.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-gray-50/30 p-2">
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full" style={{ minWidth: 520 }}>
                  <defs>
                    <linearGradient id="oneRMGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={theme.hex} stopOpacity="0.18" />
                      <stop offset="100%" stopColor={theme.hex} stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Y-axis grid + labels (left = weight, right = reps in sets mode; left = 1RM in 1rm mode) */}
                  {(viewMode === 'sets' ? yWeightTicks : y1RMTicks).map((tv, i) => {
                    const y = viewMode === 'sets' ? getYWeight(tv) : getY1RM(tv)
                    return (
                      <g key={i}>
                        <line x1={padding.left} y1={y} x2={chartWidth - padding.right} y2={y} stroke="#f0f0f0" strokeWidth="1" />
                        <text x={padding.left - 10} y={y + 4} textAnchor="end" className="fill-gray-400" style={{ fontSize: 11, fontWeight: 500 }}>
                          {tv}
                        </text>
                      </g>
                    )
                  })}

                  {/* Right Y-axis (reps) — only in sets mode */}
                  {viewMode === 'sets' && yRepsTicks.map((tv, i) => {
                    const y = getYReps(tv)
                    return (
                      <text key={i} x={chartWidth - padding.right + 10} y={y + 4} textAnchor="start" className="fill-emerald-500" style={{ fontSize: 11, fontWeight: 500 }}>
                        {tv}
                      </text>
                    )
                  })}

                  {/* X-axis date labels */}
                  {sessionDates.map((d, si) => {
                    const x = getX(si)
                    return (
                      <text key={si} x={x} y={chartHeight - padding.bottom + 22} textAnchor="middle" className="fill-gray-500" style={{ fontSize: 11, fontWeight: 600 }}>
                        {d.dateLabel}
                      </text>
                    )
                  })}

                  {/* Session boundary vertical lines */}
                  {sessionDates.map((_d, si) => {
                    const x = getX(si)
                    return (
                      <line key={`vl-${si}`} x1={x} y1={padding.top} x2={x} y2={padding.top + plotHeight} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="3 3" />
                    )
                  })}

                  {/* Axis labels */}
                  <text x={padding.left - 40} y={padding.top - 12} className="fill-gray-400" style={{ fontSize: 10, fontWeight: 600 }}>
                    {viewMode === 'sets' ? `Weight (${unit})` : `1RM (${unit})`}
                  </text>
                  {viewMode === 'sets' && (
                    <text x={chartWidth - padding.right + 10} y={padding.top - 12} className="fill-emerald-500" style={{ fontSize: 10, fontWeight: 600 }}>
                      Reps
                    </text>
                  )}

                  {/* 1RM Mode: single line + area */}
                  {viewMode === '1rm' && (
                    <>
                      {oneRMAreaPath && <path d={oneRMAreaPath} fill="url(#oneRMGradient)" />}
                      {oneRMPath && (
                        <path d={oneRMPath} fill="none" stroke={theme.hex} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      )}
                      {oneRMPoints.map((p, i) => (
                        <g key={i}>
                          <circle cx={p.x} cy={p.y} r={hovered?.x === p.x && hovered?.setIndex === p.setIndex && hovered?.date === p.date ? 7 : 4} fill="white" stroke={theme.hex} strokeWidth="2.5" className="transition-all" />
                          <circle cx={p.x} cy={p.y} r="14" fill="transparent" className="cursor-pointer"
                            onMouseEnter={() => setHovered({ date: p.date, dateLabel: p.dateLabel, setIndex: p.setIndex, weight: p.weight, reps: p.reps, oneRM: p.oneRM, x: p.x, yWeight: p.y, yReps: 0, sessionIndex: i })}
                            onMouseLeave={() => setHovered(null)}
                          />
                        </g>
                      ))}
                    </>
                  )}

                  {/* Sets Mode: independent lines per set index */}
                  {viewMode === 'sets' && setLines.map((line) => {
                    if (hiddenSets.has(line.setIndex)) return null
                    return (
                      <g key={line.setIndex}>
                        {/* Weight line (solid, left axis) */}
                        {line.pathWeight && (
                          <path d={line.pathWeight} fill="none" stroke={line.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        )}
                        {/* Reps line (dashed, right axis) */}
                        {line.pathReps && (
                          <path d={line.pathReps} fill="none" stroke={line.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="5 4" opacity="0.6" />
                        )}
                        {/* Data points */}
                        {line.points.map((p, i) => (
                          <g key={i}>
                            <circle cx={p.x} cy={p.yWeight} r={hovered === p ? 7 : 4} fill="white" stroke={line.color} strokeWidth="2.5" className="transition-all" />
                            <circle cx={p.x} cy={p.yWeight} r="14" fill="transparent" className="cursor-pointer"
                              onMouseEnter={() => setHovered(p)}
                              onMouseLeave={() => setHovered(null)}
                            />
                          </g>
                        ))}
                      </g>
                    )
                  })}

                  {/* Tooltip */}
                  {hovered && (
                    <g>
                      <rect
                        x={Math.min(hovered.x + 10, chartWidth - 175)}
                        y={Math.max(hovered.yWeight - 50, 5)}
                        width="165"
                        height="42"
                        rx="8"
                        fill="#1f2937"
                        opacity="0.95"
                      />
                      <text
                        x={Math.min(hovered.x + 18, chartWidth - 167)}
                        y={Math.max(hovered.yWeight - 33, 22)}
                        className="fill-white"
                        style={{ fontSize: 11, fontWeight: 700 }}
                      >
                        {hovered.dateLabel} - Set {hovered.setIndex + 1}: {hovered.weight} {unit} x {hovered.reps}
                      </text>
                      {viewMode === '1rm' && (
                        <text
                          x={Math.min(hovered.x + 18, chartWidth - 167)}
                          y={Math.max(hovered.yWeight - 18, 37)}
                          className="fill-gray-300"
                          style={{ fontSize: 10 }}
                        >
                          Est. 1RM: {Math.round(hovered.oneRM)} {unit}
                        </text>
                      )}
                    </g>
                  )}
                </svg>
              </div>

              {/* Interactive Legend */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                {viewMode === 'sets' ? (
                  <>
                    {setLines.map((line) => (
                      <button
                        key={line.setIndex}
                        onClick={() => toggleSet(line.setIndex)}
                        className={`flex items-center gap-2 rounded-lg px-2 py-1 text-xs font-medium transition-all ${
                          hiddenSets.has(line.setIndex) ? 'opacity-30' : 'opacity-100'
                        }`}
                      >
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: line.color }} />
                        <span className={hiddenSets.has(line.setIndex) ? 'text-gray-400 line-through' : 'text-gray-700'}>
                          Set {line.setIndex + 1}
                        </span>
                      </button>
                    ))}
                    <div className="ml-2 flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block h-0.5 w-4 rounded-full bg-gray-600" />
                        Weight
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block h-0.5 w-4 rounded-full border-t-2 border-dashed border-gray-400" />
                        Reps
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: theme.hex }} />
                    <span className="font-medium">Estimated 1-Rep Max (Epley formula)</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
