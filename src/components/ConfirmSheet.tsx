export function ConfirmSheet({
  title = 'Confirm delete',
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="sheet-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-title">{title}</h2>
        <p id="confirm-message">{message}</p>
        <div className="btn-row">
          <button type="button" className="btn btn-danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
