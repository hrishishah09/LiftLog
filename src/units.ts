import type { Unit } from './types'

const KG_PER_LB = 0.453592
const LB_PER_KG = 2.20462

/**
 * Convert a weight value from one unit to another.
 * Weights are stored in kg internally; this converts for display.
 */
export function convertWeight(weight: number, from: Unit, to: Unit): number {
  if (from === to) return Math.round(weight)
  if (from === 'kg' && to === 'lbs') return Math.round(weight * LB_PER_KG)
  return Math.round(weight * KG_PER_LB)
}

/**
 * Format a weight for display in the given unit.
 * Weight is assumed to be in kg (storage format).
 */
export function formatWeight(weightKg: number, displayUnit: Unit): string {
  if (weightKg <= 0) return 'Bodyweight'
  const value = convertWeight(weightKg, 'kg', displayUnit)
  return `${value} ${displayUnit}`
}
