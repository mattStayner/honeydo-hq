import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { db } from '../db/database'
import { useLiveQuery } from 'dexie-react-hooks'
import { createId } from '../lib/ids'
import { EmptyState } from '../components/EmptyState'

export function SpaceDetailPage() {
  const { spaceId = '' } = useParams()
  const navigate = useNavigate()
  const space = useLiveQuery(() => db.spaces.get(spaceId), [spaceId])
  const assets = useLiveQuery(
    () => db.assets.where('spaceId').equals(spaceId).sortBy('name'),
    [spaceId],
  )

  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')

  async function addAsset(e: FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    const id = createId()
    await db.assets.add({
      id,
      spaceId,
      name: trimmed,
      specs: {},
      createdAt: new Date().toISOString(),
    })
    setName('')
    setShowForm(false)
    navigate(`/assets/${id}`)
  }

  async function deleteSpace() {
    if (!space) return
    if (!confirm(`Delete "${space.name}" and all assets/tasks inside?`)) return
    const spaceAssets = await db.assets.where('spaceId').equals(spaceId).toArray()
    const assetIds = spaceAssets.map((a) => a.id)
    const tasks =
      assetIds.length > 0
        ? await db.tasks.where('assetId').anyOf(assetIds).toArray()
        : []
    const taskIds = tasks.map((t) => t.id)
    await db.transaction('rw', db.spaces, db.assets, db.tasks, db.completions, async () => {
      if (taskIds.length > 0) {
        await db.completions.where('taskId').anyOf(taskIds).delete()
        await db.tasks.bulkDelete(taskIds)
      }
      if (assetIds.length > 0) {
        await db.assets.bulkDelete(assetIds)
      }
      await db.spaces.delete(spaceId)
    })
    navigate('/spaces')
  }

  if (space === undefined) {
    return (
      <main className="page">
        <p className="muted">Loading…</p>
      </main>
    )
  }

  if (!space) {
    return (
      <main className="page">
        <EmptyState title="Space not found">
          <Link to="/spaces">Back to spaces</Link>
        </EmptyState>
      </main>
    )
  }

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <p className="muted" style={{ marginBottom: '0.35rem' }}>
            <Link to="/spaces">← Spaces</Link>
          </p>
          <h1>{space.name}</h1>
          <p>{space.kind === 'room' ? 'Room' : 'Outdoor / other'}</p>
        </div>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Close' : 'Add asset'}
        </button>
      </header>

      {showForm ? (
        <form className="inline-form" onSubmit={(e) => void addAsset(e)}>
          <div className="field">
            <label htmlFor="asset-name">Asset name</label>
            <input
              id="asset-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Furnace"
              autoFocus
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Save asset
          </button>
        </form>
      ) : null}

      {!assets || assets.length === 0 ? (
        <EmptyState title="No assets here">Add the equipment or areas you maintain.</EmptyState>
      ) : (
        <div className="card-list">
          {assets.map((asset) => (
            <Link key={asset.id} to={`/assets/${asset.id}`} className="card link-card">
              <div className="card-top">
                <div>
                  <div className="card-title">{asset.name}</div>
                  <div className="card-meta">
                    {Object.keys(asset.specs).length} specs on file
                  </div>
                </div>
                <span className="badge">Open</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="btn-row" style={{ marginTop: '1.5rem' }}>
        <button type="button" className="btn btn-danger btn-sm" onClick={() => void deleteSpace()}>
          Delete space
        </button>
      </div>
    </main>
  )
}
