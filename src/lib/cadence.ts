import {
  addDays,
  addMonths,
  addWeeks,
  format,
  formatISO,
  parseISO,
  startOfDay,
} from 'date-fns'
import type { Cadence } from '../db/types'

export function suggestNextDue(fromDate: Date | string, cadence: Cadence): string {
  const base = startOfDay(typeof fromDate === 'string' ? parseISO(fromDate) : fromDate)
  let next: Date
  switch (cadence.unit) {
    case 'days':
      next = addDays(base, cadence.every)
      break
    case 'weeks':
      next = addWeeks(base, cadence.every)
      break
    case 'months':
      next = addMonths(base, cadence.every)
      break
  }
  return formatISO(next, { representation: 'date' })
}

export function formatCadence(cadence: Cadence | undefined): string {
  if (!cadence) return 'One-time'
  const unit =
    cadence.every === 1 ? cadence.unit.slice(0, -1) : cadence.unit
  return `Every ${cadence.every} ${unit}`
}

export function toDateInputValue(isoDate: string): string {
  return isoDate.slice(0, 10)
}

/** Display-only: 2026-10-18 → Oct 18, 2026 */
export function formatDisplayDate(isoDate: string): string {
  return format(parseISO(isoDate), 'MMM d, yyyy')
}
