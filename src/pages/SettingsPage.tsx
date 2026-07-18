import { useRef, useState, type ChangeEvent } from 'react'
import { downloadBackup, exportBackup, importBackup, parseBackupFile } from '../db/backup'
import { seedDemoData } from '../db/seed'
import {
  DEFAULT_WEEKLY_GOAL,
  getWeeklyGoal,
  MAX_WEEKLY_GOAL,
  MIN_WEEKLY_GOAL,
  setWeeklyGoal,
} from '../lib/settings'

export function SettingsPage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [weeklyGoalInput, setWeeklyGoalInput] = useState(() => String(getWeeklyGoal()))

  function commitWeeklyGoal() {
    const parsed = Number.parseInt(weeklyGoalInput, 10)
    setWeeklyGoal(Number.isFinite(parsed) ? parsed : DEFAULT_WEEKLY_GOAL)
    setWeeklyGoalInput(String(getWeeklyGoal()))
  }

  async function handleExport() {
    setError(null)
    setBusy(true)
    try {
      const payload = await exportBackup()
      downloadBackup(payload)
      setMessage('Backup downloaded.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed.')
    } finally {
      setBusy(false)
    }
  }

  async function handleImport(mode: 'replace' | 'merge', file: File) {
    setError(null)
    setBusy(true)
    try {
      const payload = await parseBackupFile(file)
      if (mode === 'replace') {
        const ok = confirm(
          'Replace all local data with this backup? This cannot be undone.',
        )
        if (!ok) {
          setBusy(false)
          return
        }
      }
      await importBackup(payload, mode)
      setMessage(
        mode === 'replace'
          ? 'Backup restored (replaced existing data).'
          : 'Backup merged into local data.',
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed.')
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const mode = confirm(
      'OK = Replace all data\nCancel = Merge with existing data',
    )
      ? 'replace'
      : 'merge'
    await handleImport(mode, file)
  }

  async function loadDemo() {
    if (!confirm('Load demo data? This replaces everything currently stored.')) return
    setBusy(true)
    setError(null)
    try {
      await seedDemoData()
      setMessage('Demo data loaded.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Seed failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <h1>Settings</h1>
          <p>Honey bank goal, backup, and install tips.</p>
        </div>
      </header>

      <section className="card stack-gap">
        <h2>Honey bank</h2>
        <p className="muted">
          Weekly goal for completed Hive jobs. The Hive gauge shows progress toward this number.
        </p>
        <div className="field">
          <label htmlFor="weekly-goal">Jobs per week</label>
          <input
            id="weekly-goal"
            type="number"
            min={MIN_WEEKLY_GOAL}
            max={MAX_WEEKLY_GOAL}
            step={1}
            value={weeklyGoalInput}
            onChange={(e) => {
              const raw = e.target.value
              setWeeklyGoalInput(raw)
              const parsed = Number.parseInt(raw, 10)
              if (Number.isFinite(parsed)) setWeeklyGoal(parsed)
            }}
            onBlur={commitWeeklyGoal}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur()
              }
            }}
          />
        </div>
        <p className="muted" style={{ margin: 0, fontSize: '0.85rem' }}>
          Default is {DEFAULT_WEEKLY_GOAL}. Allowed range: {MIN_WEEKLY_GOAL}–{MAX_WEEKLY_GOAL}.
        </p>
      </section>

      <section className="card stack-gap" style={{ marginTop: '0.85rem' }}>
        <h2>Backup</h2>
        <p className="muted">
          All data stays on this device (IndexedDB). Export a JSON file so you can restore on
          another phone if this one dies.
        </p>
        <div className="btn-row">
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy}
            onClick={() => void handleExport()}
          >
            Export backup
          </button>
          <button
            type="button"
            className="btn"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
          >
            Import backup
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          onChange={(e) => void onFileChange(e)}
        />
      </section>

      <section className="card stack-gap" style={{ marginTop: '0.85rem' }}>
        <h2>Install app</h2>
        <p className="muted">
          In your mobile browser, use Add to Home Screen / Install app. HoneyDo HQ works offline
          once installed.
        </p>
      </section>

      <section className="card stack-gap" style={{ marginTop: '0.85rem' }}>
        <h2>Demo data</h2>
        <p className="muted">
          Load sample spaces (utility room, backyard, garage), maintenance tasks, weekend jobs, and
          a Home Depot list.
        </p>
        <button type="button" className="btn" disabled={busy} onClick={() => void loadDemo()}>
          Load demo data
        </button>
      </section>

      {message ? (
        <p className="muted" style={{ marginTop: '1rem', color: 'var(--success)' }}>
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="muted" style={{ marginTop: '1rem', color: 'var(--danger)' }}>
          {error}
        </p>
      ) : null}
    </main>
  )
}
