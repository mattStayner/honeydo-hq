import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { db } from '../db/database'
import { useLiveQuery } from 'dexie-react-hooks'
import { createId } from '../lib/ids'
import { EmptyState } from '../components/EmptyState'

export function SpacesPage() {
  const spaces = useLiveQuery(() => db.spaces.orderBy('name').toArray(), [])
  const assetCounts = useLiveQuery(async () => {
    const assets = await db.assets.toArray()
    const map = new Map<string, number>()
    for (const a of assets) {
      map.set(a.spaceId, (map.get(a.spaceId) ?? 0) + 1)
    }
    return map
  }, [])

  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [kind, setKind] = useState<'room' | 'space'>('room')

  async function addSpace(e: FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    await db.spaces.add({
      id: createId(),
      name: trimmed,
      kind,
      createdAt: new Date().toISOString(),
    })
    setName('')
    setShowForm(false)
  }

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <h1>Spaces</h1>
          <p>Rooms and outdoor areas that hold your assets.</p>
        </div>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Close' : 'Add'}
        </button>
      </header>

      {showForm ? (
        <form className="inline-form" onSubmit={(e) => void addSpace(e)}>
          <div className="field">
            <label htmlFor="space-name">Name</label>
            <input
              id="space-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Utility Room"
              autoFocus
              required
            />
          </div>
          <div className="field">
            <label htmlFor="space-kind">Type</label>
            <select
              id="space-kind"
              value={kind}
              onChange={(e) => setKind(e.target.value as 'room' | 'space')}
            >
              <option value="room">Room</option>
              <option value="space">Outdoor / other</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary">
            Save space
          </button>
        </form>
      ) : null}

      {!spaces ? (
        <p className="muted">Loading…</p>
      ) : spaces.length === 0 ? (
        <EmptyState title="No spaces yet">
          Add a room or yard area to start tracking assets.
        </EmptyState>
      ) : (
        <div className="card-list">
          {spaces.map((space) => (
            <Link key={space.id} to={`/spaces/${space.id}`} className="card link-card">
              <div className="card-top">
                <div>
                  <div className="card-title">{space.name}</div>
                  <div className="card-meta">
                    {space.kind === 'room' ? 'Room' : 'Space'} ·{' '}
                    {assetCounts?.get(space.id) ?? 0} assets
                  </div>
                </div>
                <span className="badge">Open</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
