import { useMemo, useState } from 'react'
import {
  differenceInCalendarDays,
  endOfWeek,
  format,
  formatISO,
  parseISO,
  startOfWeek,
} from 'date-fns'
import { db } from '../db/database'
import type { Asset, MaintenanceTask, Space } from '../db/types'
import { useLiveQuery } from 'dexie-react-hooks'
import { createId } from '../lib/ids'
import { formatCadence } from '../lib/cadence'
import { getWeeklyGoal } from '../lib/settings'
import { BeeMark } from '../components/BeeMark'
import { EmptyState } from '../components/EmptyState'
import { HaulSheet, type HaulWeek } from '../components/HaulSheet'
import { HoneyGauge } from '../components/HoneyGauge'
import { ScheduleNextSheet } from '../components/ScheduleNextSheet'

type TaskRow = MaintenanceTask & {
  assetName: string
  spaceName: string
}

function dueLabel(nextDue: string): { text: string; kind: 'overdue' | 'due-soon' | 'later' } {
  const days = differenceInCalendarDays(parseISO(nextDue), new Date())
  if (days < 0) {
    return {
      text: days === -1 ? '1 day overdue' : `${Math.abs(days)} days overdue`,
      kind: 'overdue',
    }
  }
  if (days === 0) return { text: 'Due today', kind: 'due-soon' }
  if (days === 1) return { text: 'Due tomorrow', kind: 'due-soon' }
  if (days <= 14) return { text: `Due in ${days} days`, kind: 'due-soon' }
  return { text: `Due in ${days} days`, kind: 'later' }
}

export function HivePage() {
  const data = useLiveQuery(async () => {
    const [tasks, assets, spaces, completions] = await Promise.all([
      db.tasks.toArray(),
      db.assets.toArray(),
      db.spaces.toArray(),
      db.completions.toArray(),
    ])
    return { tasks, assets, spaces, completions }
  }, [])

  const [scheduling, setScheduling] = useState<MaintenanceTask | null>(null)
  const [pulseId, setPulseId] = useState<string | null>(null)
  const [haulOpen, setHaulOpen] = useState(false)

  const rows = useMemo(() => {
    if (!data) return []
    const assetMap = new Map<string, Asset>(data.assets.map((a) => [a.id, a]))
    const spaceMap = new Map<string, Space>(data.spaces.map((s) => [s.id, s]))
    return data.tasks
      .map((task): TaskRow => {
        const asset = assetMap.get(task.assetId)
        const space = asset ? spaceMap.get(asset.spaceId) : undefined
        return {
          ...task,
          assetName: asset?.name ?? 'Asset',
          spaceName: space?.name ?? 'Space',
        }
      })
      .sort((a, b) => a.nextDue.localeCompare(b.nextDue))
  }, [data])

  const haulWeeks = useMemo((): HaulWeek[] => {
    if (!data) return []
    const assetMap = new Map(data.assets.map((a) => [a.id, a]))
    const spaceMap = new Map(data.spaces.map((s) => [s.id, s]))
    const taskMap = new Map(data.tasks.map((t) => [t.id, t]))
    const currentKey = formatISO(startOfWeek(new Date(), { weekStartsOn: 1 }), {
      representation: 'date',
    })
    const byWeek = new Map<string, HaulWeek>()

    for (const completion of data.completions) {
      const completedAt = parseISO(completion.completedAt)
      const weekStart = startOfWeek(completedAt, { weekStartsOn: 1 })
      const weekKey = formatISO(weekStart, { representation: 'date' })
      const task = taskMap.get(completion.taskId)
      const asset = task ? assetMap.get(task.assetId) : undefined
      const space = asset ? spaceMap.get(asset.spaceId) : undefined
      let week = byWeek.get(weekKey)
      if (!week) {
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
        week = {
          weekKey,
          isCurrent: weekKey === currentKey,
          label:
            weekKey === currentKey
              ? 'This week'
              : `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d')}`,
          items: [],
        }
        byWeek.set(weekKey, week)
      }
      week.items.push({
        id: completion.id,
        title: task?.title ?? 'Deleted task',
        assetName: asset?.name ?? 'Asset',
        spaceName: space?.name ?? 'Space',
        completedAt: completion.completedAt,
      })
    }

    // Ensure current week always appears, even with zero completions.
    if (!byWeek.has(currentKey)) {
      byWeek.set(currentKey, {
        weekKey: currentKey,
        isCurrent: true,
        label: 'This week',
        items: [],
      })
    }

    return [...byWeek.values()]
      .map((week) => ({
        ...week,
        items: [...week.items].sort((a, b) => b.completedAt.localeCompare(a.completedAt)),
      }))
      .sort((a, b) => b.weekKey.localeCompare(a.weekKey))
  }, [data])

  const weekCompleted = haulWeeks.find((w) => w.isCurrent)?.items.length ?? 0

  async function beginComplete(task: MaintenanceTask) {
    setPulseId(task.id)
    window.setTimeout(() => setPulseId(null), 450)
    setScheduling(task)
  }

  async function confirmNext(nextDue: string) {
    if (!scheduling) return
    const completedAt = new Date().toISOString()
    await db.transaction('rw', db.tasks, db.completions, async () => {
      await db.completions.add({
        id: createId(),
        taskId: scheduling.id,
        completedAt,
        nextDueSet: nextDue,
      })
      await db.tasks.update(scheduling.id, { nextDue })
    })
    setScheduling(null)
  }

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <div className="brand-mark">
            <BeeMark />
            <span>HoneyDo HQ</span>
          </div>
          <p>Up next — knock it out, then set the next date.</p>
        </div>
      </header>

      <HoneyGauge
        completed={weekCompleted}
        goal={getWeeklyGoal()}
        onOpen={() => setHaulOpen(true)}
      />

      {!data ? (
        <p className="muted">Loading…</p>
      ) : rows.length === 0 ? (
        <EmptyState title="Hive is quiet">
          Add a space and asset, then schedule your first maintenance job.
        </EmptyState>
      ) : (
        <div className="card-list">
          {rows.map((task) => {
            const due = dueLabel(task.nextDue)
            return (
              <article
                key={task.id}
                className={`card ${due.kind === 'overdue' ? 'overdue' : due.kind === 'due-soon' ? 'due-soon' : ''}`}
              >
                <div className="card-top">
                  <div>
                    <div className="card-title">{task.title}</div>
                    <div className="card-meta">
                      {task.assetName} · {task.spaceName}
                    </div>
                    <div className="card-meta">
                      {formatCadence(task.cadence)}
                      {task.materials ? ` · ${task.materials}` : ''}
                    </div>
                  </div>
                  <span className={`badge ${due.kind}`}>{due.text}</span>
                </div>
                <div className="btn-row">
                  <button
                    type="button"
                    className={`btn btn-primary${pulseId === task.id ? ' complete-pulse' : ''}`}
                    onClick={() => void beginComplete(task)}
                  >
                    Complete
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {scheduling ? (
        <ScheduleNextSheet
          task={scheduling}
          onConfirm={(d) => void confirmNext(d)}
          onCancel={() => setScheduling(null)}
        />
      ) : null}

      {haulOpen ? <HaulSheet weeks={haulWeeks} onClose={() => setHaulOpen(false)} /> : null}
    </main>
  )
}
