import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { db } from '../db/database'
import { useLiveQuery } from 'dexie-react-hooks'
import { createId } from '../lib/ids'
import { formatDisplayDate } from '../lib/cadence'
import { EmptyState } from '../components/EmptyState'
import type { WeekendTodo } from '../db/types'

export function TasksPage() {
  const todos = useLiveQuery(() => db.weekendTodos.orderBy('sortOrder').toArray(), [])
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [filter, setFilter] = useState<'open' | 'done' | 'all'>('open')
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [editingDueId, setEditingDueId] = useState<string | null>(null)
  const [editDue, setEditDue] = useState('')
  const dragIdRef = useRef<string | null>(null)
  const overIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!menuOpenId) return
    function onPointerDown(e: PointerEvent) {
      const target = e.target as HTMLElement | null
      if (target?.closest('[data-todo-menu]')) return
      setMenuOpenId(null)
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpenId(null)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpenId])

  async function addTodo(e: FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    const minOrder = todos?.reduce((min, t) => Math.min(min, t.sortOrder), 0) ?? 0
    await db.weekendTodos.add({
      id: createId(),
      title: trimmed,
      done: false,
      sortOrder: todos?.length ? minOrder - 1 : 0,
      createdAt: new Date().toISOString(),
      ...(dueDate ? { dueDate } : {}),
    })
    setTitle('')
    setDueDate('')
  }

  async function toggle(id: string, done: boolean) {
    await db.weekendTodos.update(id, { done: !done })
  }

  async function remove(id: string) {
    await db.weekendTodos.delete(id)
  }

  async function saveDueDate(id: string) {
    if (editDue) {
      await db.weekendTodos.update(id, { dueDate: editDue })
    } else {
      await db.weekendTodos
        .where('id')
        .equals(id)
        .modify((todo) => {
          delete todo.dueDate
        })
    }
    setEditingDueId(null)
    setEditDue('')
  }

  async function clearDueDate(id: string) {
    await db.weekendTodos
      .where('id')
      .equals(id)
      .modify((todo) => {
        delete todo.dueDate
      })
    setMenuOpenId(null)
    if (editingDueId === id) {
      setEditingDueId(null)
      setEditDue('')
    }
  }

  async function clearDone() {
    const done = await db.weekendTodos.filter((t) => t.done).toArray()
    await db.weekendTodos.bulkDelete(done.map((t) => t.id))
  }

  async function persistVisibleOrder(nextVisible: WeekendTodo[]) {
    const all = todos ?? []
    const visibleIds = new Set(nextVisible.map((t) => t.id))
    let index = 0
    const merged = all.map((todo) => {
      if (!visibleIds.has(todo.id)) return todo
      return nextVisible[index++]!
    })
    await db.transaction('rw', db.weekendTodos, async () => {
      await Promise.all(
        merged.map((todo, sortOrder) => db.weekendTodos.update(todo.id, { sortOrder })),
      )
    })
  }

  function reorderVisible(fromId: string, toId: string) {
    const from = visible.findIndex((t) => t.id === fromId)
    const to = visible.findIndex((t) => t.id === toId)
    if (from < 0 || to < 0 || from === to) return
    const next = [...visible]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item!)
    void persistVisibleOrder(next)
  }

  function onHandlePointerDown(e: ReactPointerEvent<HTMLButtonElement>, id: string) {
    if (e.button !== 0) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    setMenuOpenId(null)
    dragIdRef.current = id
    overIdRef.current = id
    setDraggingId(id)
    setOverId(id)
  }

  function onHandlePointerMove(e: ReactPointerEvent<HTMLButtonElement>) {
    if (!dragIdRef.current) return
    const el = document.elementFromPoint(e.clientX, e.clientY)
    const row = el?.closest('[data-todo-id]') as HTMLElement | null
    const id = row?.dataset.todoId
    if (!id || id === overIdRef.current) return
    overIdRef.current = id
    setOverId(id)
  }

  function onHandlePointerUp() {
    const fromId = dragIdRef.current
    const toId = overIdRef.current
    dragIdRef.current = null
    overIdRef.current = null
    setDraggingId(null)
    setOverId(null)
    if (!fromId || !toId || fromId === toId) return
    reorderVisible(fromId, toId)
  }

  const visible =
    todos?.filter((t) => {
      if (filter === 'open') return !t.done
      if (filter === 'done') return t.done
      return true
    }) ?? []

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <h1>Tasks</h1>
          <p>Capture jobs all week. Knock the list out on Saturday.</p>
        </div>
      </header>

      <form className="inline-form" onSubmit={(e) => void addTodo(e)}>
        <div className="field">
          <label htmlFor="todo-title">Quick add</label>
          <input
            id="todo-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Fix loose deck board"
          />
        </div>
        <div className="field">
          <label htmlFor="todo-due">Due date (optional)</label>
          <input
            id="todo-due"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary">
          Add to list
        </button>
      </form>

      <div className="chip-row">
        <button
          type="button"
          className={`chip${filter === 'open' ? ' active' : ''}`}
          onClick={() => setFilter('open')}
        >
          Open
        </button>
        <button
          type="button"
          className={`chip${filter === 'done' ? ' active' : ''}`}
          onClick={() => setFilter('done')}
        >
          Done
        </button>
        <button
          type="button"
          className={`chip${filter === 'all' ? ' active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button type="button" className="chip" onClick={() => void clearDone()}>
          Clear done
        </button>
      </div>

      {!todos ? (
        <p className="muted">Loading…</p>
      ) : visible.length === 0 ? (
        <EmptyState title={filter === 'open' ? 'List is clear' : 'Nothing here'}>
          {filter === 'open'
            ? 'Add odd jobs as you notice them during the week.'
            : 'Flip the filter to see more.'}
        </EmptyState>
      ) : (
        <div className="card-list">
          {visible.map((todo) => {
            const isDragging = draggingId === todo.id
            const isOver = overId === todo.id && draggingId !== todo.id
            return (
              <article
                key={todo.id}
                data-todo-id={todo.id}
                className={`card todo-card${isDragging ? ' dragging' : ''}${isOver ? ' drag-over' : ''}`}
              >
                <div className="todo-row">
                  <button
                    type="button"
                    className="drag-handle"
                    aria-label={`Reorder ${todo.title}`}
                    onPointerDown={(e) => onHandlePointerDown(e, todo.id)}
                    onPointerMove={onHandlePointerMove}
                    onPointerUp={onHandlePointerUp}
                    onPointerCancel={onHandlePointerUp}
                  >
                    <DragHandleIcon />
                  </button>
                  <button
                    type="button"
                    className={`check-row${todo.done ? ' done' : ''}`}
                    onClick={() => void toggle(todo.id, todo.done)}
                  >
                    <span className={`check-box${todo.done ? ' checked' : ''}`}>
                      {todo.done ? '✓' : ''}
                    </span>
                    <div>
                      <div className="card-title">{todo.title}</div>
                      {todo.dueDate ? (
                        <div className="card-meta">Due {formatDisplayDate(todo.dueDate)}</div>
                      ) : null}
                    </div>
                  </button>
                  <div className="todo-menu" data-todo-menu>
                    <button
                      type="button"
                      className="kebab-btn"
                      aria-label={`More actions for ${todo.title}`}
                      aria-haspopup="menu"
                      aria-expanded={menuOpenId === todo.id}
                      onClick={() =>
                        setMenuOpenId((open) => (open === todo.id ? null : todo.id))
                      }
                    >
                      <KebabIcon />
                    </button>
                    {menuOpenId === todo.id ? (
                      <div className="kebab-menu" role="menu">
                        <button
                          type="button"
                          role="menuitem"
                          className="kebab-menu-item"
                          onClick={() => {
                            setMenuOpenId(null)
                            setEditingDueId(todo.id)
                            setEditDue(todo.dueDate ?? '')
                          }}
                        >
                          {todo.dueDate ? 'Change due date' : 'Add due date'}
                        </button>
                        {todo.dueDate ? (
                          <button
                            type="button"
                            role="menuitem"
                            className="kebab-menu-item"
                            onClick={() => void clearDueDate(todo.id)}
                          >
                            Clear due date
                          </button>
                        ) : null}
                        <button
                          type="button"
                          role="menuitem"
                          className="kebab-menu-item danger"
                          onClick={() => {
                            setMenuOpenId(null)
                            void remove(todo.id)
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
                {editingDueId === todo.id ? (
                  <form
                    className="todo-due-edit"
                    onSubmit={(e) => {
                      e.preventDefault()
                      void saveDueDate(todo.id)
                    }}
                  >
                    <div className="field">
                      <label htmlFor={`todo-due-${todo.id}`}>Due date</label>
                      <input
                        id={`todo-due-${todo.id}`}
                        type="date"
                        value={editDue}
                        onChange={(e) => setEditDue(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <div className="btn-row">
                      <button type="submit" className="btn btn-primary btn-sm">
                        Save
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          setEditingDueId(null)
                          setEditDue('')
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : null}
              </article>
            )
          })}
        </div>
      )}
    </main>
  )
}

function DragHandleIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
      <circle cx="7" cy="5" r="1.5" fill="currentColor" />
      <circle cx="13" cy="5" r="1.5" fill="currentColor" />
      <circle cx="7" cy="10" r="1.5" fill="currentColor" />
      <circle cx="13" cy="10" r="1.5" fill="currentColor" />
      <circle cx="7" cy="15" r="1.5" fill="currentColor" />
      <circle cx="13" cy="15" r="1.5" fill="currentColor" />
    </svg>
  )
}

function KebabIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
      <circle cx="10" cy="4" r="1.5" fill="currentColor" />
      <circle cx="10" cy="10" r="1.5" fill="currentColor" />
      <circle cx="10" cy="16" r="1.5" fill="currentColor" />
    </svg>
  )
}
