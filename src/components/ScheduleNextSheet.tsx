import { useState } from 'react'
import type { Task } from '../db/types'
import { formatCadence, suggestNextDue, toDateInputValue } from '../lib/cadence'

export function ScheduleNextSheet({
  task,
  onConfirm,
  onSkip,
  onCancel,
}: {
  task: Task
  onConfirm: (nextDue: string, note: string) => void
  /** Log completion and remove the task without scheduling again. */
  onSkip: (note: string) => void
  onCancel: () => void
}) {
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
        <h2 id="schedule-title">Schedule next</h2>
        <p>
          Marked done: <strong>{task.title}</strong>.
          {task.cadence
            ? ` Suggested from cadence (${formatCadence(task.cadence)}).`
            : ' Set a next date, or finish without scheduling.'}
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
          <label htmlFor="next-due">Next due</label>
          <input
            id="next-due"
            type="date"
            value={nextDue}
            onChange={(e) => setNextDue(e.target.value)}
          />
        </div>
        <div className="btn-row">
          <button
            type="button"
            className="btn btn-primary"
            disabled={!nextDue}
            onClick={() => onConfirm(nextDue, note.trim())}
          >
            Set next date
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => onSkip(note.trim())}
          >
            Done — no next date
          </button>
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
