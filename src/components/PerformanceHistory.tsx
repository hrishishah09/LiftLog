import type { SessionRecord } from '../types'
import { ROUTINE_THEMES } from '../themes'

interface PerformanceHistoryProps {
  records: SessionRecord[]
}

export function PerformanceHistory({ records }: PerformanceHistoryProps) {
  return (
    <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-baseline justify-between border-b border-gray-100 px-6 py-5">
        <div>
          <h2 className="text-base font-bold text-gray-900">Performance History</h2>
          <p className="text-xs text-gray-400">Recent completed sessions</p>
        </div>
        <span className="text-xs font-medium text-gray-400">{records.length} sessions</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-50 bg-gray-50/40">
              <th className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">Date</th>
              <th className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">Workout</th>
              <th className="px-6 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-gray-400">Total Reps</th>
              <th className="px-6 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-gray-400">Duration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {records.map((r) => {
              const theme = ROUTINE_THEMES[r.theme]
              return (
                <tr key={r.id} className="transition-colors hover:bg-gray-50/40">
                  <td className="px-6 py-3.5 text-sm font-medium text-gray-600">
                    {new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${theme.badge}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${theme.dot}`} />
                      {r.workout}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right text-sm font-bold text-gray-900">{r.totalReps}</td>
                  <td className="px-6 py-3.5 text-right text-sm font-medium text-gray-500">{r.duration}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
