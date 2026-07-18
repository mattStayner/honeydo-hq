import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { db } from '../db/database'
import type { CadenceUnit } from '../db/types'
import { useLiveQuery } from 'dexie-react-hooks'
import { createId } from '../lib/ids'
import { formatCadence, formatDisplayDate } from '../lib/cadence'
import { EmptyState } from '../components/EmptyState'
import { EditAssetDetailsSheet } from '../components/EditAssetDetailsSheet'

function formatAmount(amount: number): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(amount)
}

export function AssetDetailPage() {
  const { assetId = '' } = useParams()
  const navigate = useNavigate()

  const asset = useLiveQuery(() => db.assets.get(assetId), [assetId])
  const space = useLiveQuery(
    async () => (asset ? db.spaces.get(asset.spaceId) : undefined),
    [asset?.spaceId],
  )
  const tasks = useLiveQuery(async () => {
    const list = await db.tasks.where('assetId').equals(assetId).toArray()
    return list.sort((a, b) => {
      if (a.nextDue && b.nextDue) return a.nextDue.localeCompare(b.nextDue)
      if (a.nextDue) return -1
      if (b.nextDue) return 1
      return b.createdAt.localeCompare(a.createdAt)
    })
  }, [assetId])

  const [showDetailsEdit, setShowDetailsEdit] = useState(false)
  const [showSpecForm, setShowSpecForm] = useState(false)
  const [specKey, setSpecKey] = useState('')
  const [specValue, setSpecValue] = useState('')
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [taskTitle, setTaskTitle] = useState('')
  const [repeats, setRepeats] = useState(false)
  const [every, setEvery] = useState(3)
  const [unit, setUnit] = useState<CadenceUnit>('months')
  const [nextDue, setNextDue] = useState('')
  const [materials, setMaterials] = useState('')

  async function addSpec(e: FormEvent) {
    e.preventDefault()
    if (!asset) return
    const key = specKey.trim()
    const value = specValue.trim()
    if (!key || !value) return
    await db.assets.update(asset.id, {
      specs: { ...asset.specs, [key]: value },
    })
    setSpecKey('')
    setSpecValue('')
    setShowSpecForm(false)
  }

  async function removeSpec(key: string) {
    if (!asset) return
    const next = { ...asset.specs }
    delete next[key]
    await db.assets.update(asset.id, { specs: next })
  }

  async function addTask(e: FormEvent) {
    e.preventDefault()
    const title = taskTitle.trim()
    if (!title) return
    await db.tasks.add({
      id: createId(),
      assetId,
      title,
      ...(repeats ? { cadence: { every, unit } } : {}),
      ...(nextDue ? { nextDue } : {}),
      ...(materials.trim() ? { materials: materials.trim() } : {}),
      createdAt: new Date().toISOString(),
    })
    setTaskTitle('')
    setMaterials('')
    setNextDue('')
    setRepeats(false)
    setShowTaskForm(false)
  }

  async function deleteTask(taskId: string) {
    if (!confirm('Delete this task?')) return
    await db.transaction('rw', db.tasks, db.completions, async () => {
      await db.completions.where('taskId').equals(taskId).delete()
      await db.tasks.delete(taskId)
    })
  }

  async function deleteAsset() {
    if (!asset) return
    if (!confirm(`Delete "${asset.name}" and its tasks?`)) return
    const assetTasks = await db.tasks.where('assetId').equals(assetId).toArray()
    const taskIds = assetTasks.map((t) => t.id)
    await db.transaction('rw', db.assets, db.tasks, db.completions, async () => {
      if (taskIds.length > 0) {
        await db.completions.where('taskId').anyOf(taskIds).delete()
        await db.tasks.bulkDelete(taskIds)
      }
      await db.assets.delete(assetId)
    })
    navigate(space ? `/spaces/${space.id}` : '/spaces')
  }

  if (asset === undefined) {
    return (
      <main className="page">
        <p className="muted">Loading…</p>
      </main>
    )
  }

  if (!asset) {
    return (
      <main className="page">
        <EmptyState title="Asset not found">
          <Link to="/spaces">Back to spaces</Link>
        </EmptyState>
      </main>
    )
  }

  const specEntries = Object.entries(asset.specs)

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <p className="muted" style={{ marginBottom: '0.35rem' }}>
            <Link to={space ? `/spaces/${space.id}` : '/spaces'}>
              ← {space?.name ?? 'Spaces'}
            </Link>
          </p>
          <h1>{asset.name}</h1>
          <p>Purchase info, specs, and maintenance schedule.</p>
        </div>
      </header>

      <div className="page-header" style={{ marginTop: '0.25rem' }}>
        <h2 className="section-title" style={{ margin: 0 }}>
          Details
        </h2>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => setShowDetailsEdit(true)}
        >
          Edit
        </button>
      </div>

      {asset.purchaseDate || asset.purchaseAmount != null || asset.description ? (
        <div className="asset-details">
          {(asset.purchaseDate || asset.purchaseAmount != null) && (
            <p className="asset-details-meta">
              {[
                asset.purchaseDate
                  ? `Purchased ${formatDisplayDate(asset.purchaseDate)}`
                  : null,
                asset.purchaseAmount != null
                  ? formatAmount(asset.purchaseAmount)
                  : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}
          {asset.description ? (
            <p className="asset-details-description">{asset.description}</p>
          ) : null}
        </div>
      ) : (
        <p className="muted">No purchase details yet.</p>
      )}

      {showDetailsEdit ? (
        <EditAssetDetailsSheet
          asset={asset}
          onClose={() => setShowDetailsEdit(false)}
        />
      ) : null}

      <div className="page-header" style={{ marginTop: '0.5rem' }}>
        <h2 className="section-title" style={{ margin: 0 }}>
          Specs
        </h2>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => setShowSpecForm((v) => !v)}
        >
          {showSpecForm ? 'Close' : 'Add spec'}
        </button>
      </div>

      {showSpecForm ? (
        <form className="inline-form" onSubmit={(e) => void addSpec(e)}>
          <div className="field">
            <label htmlFor="spec-key">Label</label>
            <input
              id="spec-key"
              value={specKey}
              onChange={(e) => setSpecKey(e.target.value)}
              placeholder="Filter size"
              autoFocus
              required
            />
          </div>
          <div className="field">
            <label htmlFor="spec-value">Value</label>
            <input
              id="spec-value"
              value={specValue}
              onChange={(e) => setSpecValue(e.target.value)}
              placeholder="16x25x1"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-sm">
            Add spec
          </button>
        </form>
      ) : null}

      {specEntries.length === 0 ? (
        <p className="muted">No specs yet — add filter size, oil weight, etc.</p>
      ) : (
        <dl className="specs-grid">
          {specEntries.map(([key, value]) => (
            <div className="spec-row" key={key}>
              <dt>{key}</dt>
              <dd>
                {value}{' '}
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => void removeSpec(key)}
                  aria-label={`Remove ${key}`}
                >
                  ×
                </button>
              </dd>
            </div>
          ))}
        </dl>
      )}

      <div className="page-header" style={{ marginTop: '0.5rem' }}>
        <h2 className="section-title" style={{ margin: 0 }}>
          Tasks
        </h2>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => setShowTaskForm((v) => !v)}
        >
          {showTaskForm ? 'Close' : 'Add task'}
        </button>
      </div>

      {showTaskForm ? (
        <form className="inline-form" onSubmit={(e) => void addTask(e)}>
          <div className="field">
            <label htmlFor="task-title">Title</label>
            <input
              id="task-title"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="Change furnace filter"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="task-due">{repeats ? 'Next due' : 'Due'}</label>
            <input
              id="task-due"
              type="date"
              value={nextDue}
              onChange={(e) => setNextDue(e.target.value)}
            />
          </div>
          <label className="check-row">
            <input
              type="checkbox"
              checked={repeats}
              onChange={(e) => setRepeats(e.target.checked)}
            />
            <span>Repeats on a schedule</span>
          </label>
          {repeats ? (
            <div className="field">
              <label htmlFor="cadence-every">Every</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  id="cadence-every"
                  type="number"
                  min={1}
                  value={every}
                  onChange={(e) => setEvery(Number(e.target.value))}
                  style={{ width: '5rem' }}
                  required
                />
                <select value={unit} onChange={(e) => setUnit(e.target.value as CadenceUnit)}>
                  <option value="days">days</option>
                  <option value="weeks">weeks</option>
                  <option value="months">months</option>
                </select>
              </div>
            </div>
          ) : null}
          <div className="field">
            <label htmlFor="task-materials">Materials / notes</label>
            <textarea
              id="task-materials"
              value={materials}
              onChange={(e) => setMaterials(e.target.value)}
              placeholder="16x25x1 filter"
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Save task
          </button>
        </form>
      ) : null}

      {!tasks || tasks.length === 0 ? (
        <EmptyState title="No tasks yet">Schedule the jobs this asset needs.</EmptyState>
      ) : (
        <div className="card-list">
          {tasks.map((task) => (
            <article key={task.id} className="card">
              <div className="card-top">
                <div>
                  <div className="card-title">{task.title}</div>
                  <div className="card-meta">
                    {[
                      task.cadence ? formatCadence(task.cadence) : null,
                      task.nextDue
                        ? `${task.cadence ? 'Next' : 'Due'} ${formatDisplayDate(task.nextDue)}`
                        : 'No date',
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </div>
                  {task.materials ? <div className="card-meta">{task.materials}</div> : null}
                </div>
              </div>
              <div className="btn-row">
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => void deleteTask(task.id)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="btn-row" style={{ marginTop: '1.5rem' }}>
        <button type="button" className="btn btn-danger btn-sm" onClick={() => void deleteAsset()}>
          Delete asset
        </button>
      </div>
    </main>
  )
}
