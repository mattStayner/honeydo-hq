import { useState } from 'react'
import type { MaintenanceTask } from '../db/types'
import { formatCadence, suggestNextDue, toDateInputValue } from '../lib/cadence'

export function ScheduleNextSheet({
  task,
  onConfirm,
  onCancel,
}: {
  task: MaintenanceTask
  onConfirm: (nextDue: string) => void
  onCancel: () => void
}) {
  const suggested = suggestNextDue(new Date(), task.cadence)
  const [nextDue, setNextDue] = useState(toDateInputValue(suggested))

  return (
    <div className="sheet-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="sheet"
        role="dialog"
        aria-labelledby="schedule-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="schedule-title">Schedule next</h2>
        <p>
          Marked done: <strong>{task.title}</strong>. Suggested from cadence (
          {formatCadence(task.cadence)}).
        </p>
        <div className="field">
          <label htmlFor="next-due">Next due</label>
          <input
            id="next-due"
            type="date"
            value={nextDue}
            onChange={(e) => setNextDue(e.target.value)}
          />
        </div>
        <div className="btn-row">
          <button type="button" className="btn btn-primary" onClick={() => onConfirm(nextDue)}>
            Set next date
          </button>
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
