import type { RoutineTheme } from './types'

export interface ThemeStyle {
  badge: string
  dot: string
  soft: string
  text: string
}

export const ROUTINE_THEMES: Record<RoutineTheme, ThemeStyle> = {
  indigo: {
    badge: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
    dot: 'bg-indigo-500',
    soft: 'bg-indigo-50',
    text: 'text-indigo-700',
  },
  violet: {
    badge: 'bg-violet-50 text-violet-700 ring-violet-200',
    dot: 'bg-violet-500',
    soft: 'bg-violet-50',
    text: 'text-violet-700',
  },
  emerald: {
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    dot: 'bg-emerald-500',
    soft: 'bg-emerald-50',
    text: 'text-emerald-700',
  },
  amber: {
    badge: 'bg-amber-50 text-amber-700 ring-amber-200',
    dot: 'bg-amber-500',
    soft: 'bg-amber-50',
    text: 'text-amber-700',
  },
  rose: {
    badge: 'bg-rose-50 text-rose-700 ring-rose-200',
    dot: 'bg-rose-500',
    soft: 'bg-rose-50',
    text: 'text-rose-700',
  },
  sky: {
    badge: 'bg-sky-50 text-sky-700 ring-sky-200',
    dot: 'bg-sky-500',
    soft: 'bg-sky-50',
    text: 'text-sky-700',
  },
}
