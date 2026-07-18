import { useEffect, useState, type FormEvent } from 'react'
import { db } from '../db/database'
import { ensureDefaultShoppingList } from '../db/seed'
import { useLiveQuery } from 'dexie-react-hooks'
import { createId } from '../lib/ids'
import { EmptyState } from '../components/EmptyState'

export function ShopPage() {
  const lists = useLiveQuery(() => db.shoppingLists.orderBy('name').toArray(), [])
  const [activeListId, setActiveListId] = useState<string | null>(null)
  const [itemName, setItemName] = useState('')
  const [itemNote, setItemNote] = useState('')
  const [newListName, setNewListName] = useState('')
  const [showNewList, setShowNewList] = useState(false)

  useEffect(() => {
    void ensureDefaultShoppingList()
  }, [])

  useEffect(() => {
    if (!activeListId && lists && lists.length > 0) {
      setActiveListId(lists[0].id)
    }
  }, [lists, activeListId])

  const items = useLiveQuery(
    async () => {
      if (!activeListId) return []
      const rows = await db.shoppingItems.where('listId').equals(activeListId).toArray()
      return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    },
    [activeListId],
  )

  async function addItem(e: FormEvent) {
    e.preventDefault()
    if (!activeListId) return
    const name = itemName.trim()
    if (!name) return
    await db.shoppingItems.add({
      id: createId(),
      listId: activeListId,
      name,
      note: itemNote.trim(),
      checked: false,
      createdAt: new Date().toISOString(),
    })
    setItemName('')
    setItemNote('')
  }

  async function toggle(id: string, checked: boolean) {
    await db.shoppingItems.update(id, { checked: !checked })
  }

  async function clearChecked() {
    if (!activeListId) return
    const checked = await db.shoppingItems
      .where('listId')
      .equals(activeListId)
      .filter((i) => i.checked)
      .toArray()
    await db.shoppingItems.bulkDelete(checked.map((i) => i.id))
  }

  async function uncheckAll() {
    if (!activeListId) return
    const all = await db.shoppingItems.where('listId').equals(activeListId).toArray()
    await db.shoppingItems.bulkPut(all.map((i) => ({ ...i, checked: false })))
  }

  async function addList(e: FormEvent) {
    e.preventDefault()
    const name = newListName.trim()
    if (!name) return
    const id = createId()
    await db.shoppingLists.add({
      id,
      name,
      createdAt: new Date().toISOString(),
    })
    setNewListName('')
    setShowNewList(false)
    setActiveListId(id)
  }

  const openCount = items?.filter((i) => !i.checked).length ?? 0

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <h1>Shop</h1>
          <p>Build the list. Check them off at the store.</p>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => setShowNewList((v) => !v)}
        >
          New list
        </button>
      </header>

      {showNewList ? (
        <form className="inline-form" onSubmit={(e) => void addList(e)}>
          <div className="field">
            <label htmlFor="list-name">List name</label>
            <input
              id="list-name"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="Hardware store"
              autoFocus
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Create list
          </button>
        </form>
      ) : null}

      <div className="chip-row">
        {lists?.map((list) => (
          <button
            key={list.id}
            type="button"
            className={`chip${activeListId === list.id ? ' active' : ''}`}
            onClick={() => setActiveListId(list.id)}
          >
            {list.name}
          </button>
        ))}
      </div>

      <form className="inline-form" onSubmit={(e) => void addItem(e)}>
        <div className="field">
          <label htmlFor="item-name">Item</label>
          <input
            id="item-name"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="16x25x1 furnace filter"
          />
        </div>
        <div className="field">
          <label htmlFor="item-note">Note (optional)</label>
          <input
            id="item-note"
            value={itemNote}
            onChange={(e) => setItemNote(e.target.value)}
            placeholder="Aisle / brand"
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={!activeListId}>
          Add item
        </button>
      </form>

      <div className="btn-row" style={{ marginBottom: '0.9rem' }}>
        <button type="button" className="btn btn-sm" onClick={() => void clearChecked()}>
          Clear checked
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => void uncheckAll()}>
          Uncheck all
        </button>
        <span className="muted" style={{ alignSelf: 'center' }}>
          {openCount} left
        </span>
      </div>

      {!items ? (
        <p className="muted">Loading…</p>
      ) : items.length === 0 ? (
        <EmptyState title="List is empty">Add what you need before the next run.</EmptyState>
      ) : (
        <div className="card-list">
          {items.map((item) => (
            <article key={item.id} className="card">
              <button
                type="button"
                className={`check-row${item.checked ? ' done' : ''}`}
                onClick={() => void toggle(item.id, item.checked)}
              >
                <span className={`check-box${item.checked ? ' checked' : ''}`}>
                  {item.checked ? '✓' : ''}
                </span>
                <div>
                  <div className="card-title">{item.name}</div>
                  {item.note ? <div className="card-meta">{item.note}</div> : null}
                </div>
              </button>
            </article>
          ))}
        </div>
      )}
    </main>
  )
}
