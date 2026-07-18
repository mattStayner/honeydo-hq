import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ConfirmSheet } from './ConfirmSheet'

export type KebabMenuItem =
  | {
      label: string
      onSelect: () => void
      danger?: false
      confirmMessage?: undefined
    }
  | {
      label: string
      onSelect: () => void
      danger: true
      /** Shown in the in-app confirm sheet before onSelect. */
      confirmMessage: string
    }

type PendingConfirm = {
  message: string
  onConfirm: () => void
}

export function KebabMenu({
  items,
  'aria-label': ariaLabel = 'More actions',
}: {
  items: KebabMenuItem[]
  'aria-label'?: string
}) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState<PendingConfirm | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return

    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  function handleSelect(item: KebabMenuItem) {
    setOpen(false)
    if (item.danger) {
      setPending({
        message: item.confirmMessage,
        onConfirm: item.onSelect,
      })
      return
    }
    item.onSelect()
  }

  return (
    <>
      <div className="todo-menu" ref={rootRef}>
        <button
          type="button"
          className="kebab-btn"
          aria-label={ariaLabel}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? menuId : undefined}
          onClick={() => setOpen((v) => !v)}
        >
          <KebabIcon />
        </button>
        {open ? (
          <div className="kebab-menu" id={menuId} role="menu">
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                className={`kebab-menu-item${item.danger ? ' danger' : ''}`}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleSelect(item)
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {pending
        ? createPortal(
            <ConfirmSheet
              message={pending.message}
              onConfirm={() => {
                const action = pending.onConfirm
                setPending(null)
                action()
              }}
              onCancel={() => setPending(null)}
            />,
            document.body,
          )
        : null}
    </>
  )
}

function KebabIcon(): ReactNode {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="3" r="1.5" fill="currentColor" />
      <circle cx="8" cy="8" r="1.5" fill="currentColor" />
      <circle cx="8" cy="13" r="1.5" fill="currentColor" />
    </svg>
  )
}
