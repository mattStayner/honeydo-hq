import { addDays, addMonths, addWeeks, formatISO, parseISO, startOfDay } from 'date-fns'
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

export function formatCadence(cadence: Cadence): string {
  const unit =
    cadence.every === 1 ? cadence.unit.slice(0, -1) : cadence.unit
  return `Every ${cadence.every} ${unit}`
}

export function toDateInputValue(isoDate: string): string {
  return isoDate.slice(0, 10)
}
