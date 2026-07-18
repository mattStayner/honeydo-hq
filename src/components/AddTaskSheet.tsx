import { useState, type FormEvent } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import { createId } from '../lib/ids'
import type { Task } from '../db/types'

export function AddTaskSheet({
  onClose,
  defaultAssetId,
}: {
  onClose: () => void
  defaultAssetId?: string
}) {
  const assets = useLiveQuery(async () => {
    const [assetList, spaces] = await Promise.all([
      db.assets.toArray(),
      db.spaces.toArray(),
    ])
    const spaceMap = new Map(spaces.map((s) => [s.id, s.name]))
    return assetList
      .map((a) => ({
        id: a.id,
        label: `${a.name} · ${spaceMap.get(a.spaceId) ?? 'Space'}`,
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [])

  const [title, setTitle] = useState('')
  const [nextDue, setNextDue] = useState('')
  const [materials, setMaterials] = useState('')
  const [assetId, setAssetId] = useState(defaultAssetId ?? '')

  async function submit(e: FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return

    const task: Task = {
      id: createId(),
      title: trimmed,
      createdAt: new Date().toISOString(),
      ...(nextDue ? { nextDue } : {}),
      ...(materials.trim() ? { materials: materials.trim() } : {}),
      ...(assetId ? { assetId } : {}),
    }
    await db.tasks.add(task)
    onClose()
  }

  return (
    <div className="sheet-backdrop" role="presentation" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-labelledby="add-task-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="add-task-title">Add task</h2>
        <form onSubmit={(e) => void submit(e)}>
          <div className="field">
            <label htmlFor="add-task-name">Title</label>
            <input
              id="add-task-name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs doing?"
              required
              autoFocus
            />
          </div>
          <div className="field">
            <label htmlFor="add-task-due">Due date</label>
            <input
              id="add-task-due"
              type="date"
              value={nextDue}
              onChange={(e) => setNextDue(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="add-task-description">Description</label>
            <textarea
              id="add-task-description"
              rows={3}
              value={materials}
              onChange={(e) => setMaterials(e.target.value)}
              placeholder="Notes, materials, details…"
            />
          </div>
          <div className="field">
            <label htmlFor="add-task-asset">Asset</label>
            <select
              id="add-task-asset"
              value={assetId}
              onChange={(e) => setAssetId(e.target.value)}
            >
              <option value="">None</option>
              {(assets ?? []).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>
          <div className="btn-row">
            <button type="submit" className="btn btn-primary" disabled={!title.trim()}>
              Add task
            </button>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
