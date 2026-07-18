import { useState } from 'react'
import type { MaintenanceTask } from '../db/types'
import { formatCadence, suggestNextDue, toDateInputValue } from '../lib/cadence'

export function ScheduleNextSheet({
  task,
  onConfirm,
  onCancel,
  onFinish,
}: {
  task: MaintenanceTask
  onConfirm: (nextDue: string, note: string) => void
  onCancel: () => void
  /** One-time tasks: log completion and remove without scheduling again. */
  onFinish?: (note: string) => void
}) {
  const hasCadence = Boolean(task.cadence)
  const suggested = task.cadence
    ? toDateInputValue(suggestNextDue(new Date(), task.cadence))
    : ''
  const [nextDue, setNextDue] = useState(suggested)
  const [note, setNote] = useState('')

  return (
    <div className="sheet-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="sheet"
        role="dialog"
        aria-labelledby="schedule-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="schedule-title">{hasCadence ? 'Schedule next' : 'Mark done'}</h2>
        <p>
          Marked done: <strong>{task.title}</strong>.
          {hasCadence
            ? ` Suggested from cadence (${formatCadence(task.cadence)}).`
            : ' One-time task — set another date only if you want to do it again.'}
        </p>
        <div className="field">
          <label htmlFor="completion-note">Notes</label>
          <textarea
            id="completion-note"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What you did, parts used, anything to remember…"
          />
        </div>
        <div className="field">
          <label htmlFor="next-due">{hasCadence ? 'Next due' : 'Due again (optional)'}</label>
          <input
            id="next-due"
            type="date"
            value={nextDue}
            onChange={(e) => setNextDue(e.target.value)}
          />
        </div>
        <div className="btn-row">
          {hasCadence || nextDue ? (
            <button
              type="button"
              className="btn btn-primary"
              disabled={!nextDue}
              onClick={() => onConfirm(nextDue, note.trim())}
            >
              Set next date
            </button>
          ) : null}
          {!hasCadence && onFinish ? (
            <button
              type="button"
              className={`btn ${nextDue ? 'btn-ghost' : 'btn-primary'}`}
              onClick={() => onFinish(note.trim())}
            >
              Done for good
            </button>
          ) : null}
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
