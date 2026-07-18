export function HoneyGauge({
  completed,
  goal = 5,
  onOpen,
}: {
  completed: number
  goal?: number
  onOpen?: () => void
}) {
  const pct = Math.min(100, Math.round((completed / Math.max(goal, 1)) * 100))
  const interactive = Boolean(onOpen)

  return (
    <button
      type="button"
      className={`honey-gauge${interactive ? ' honey-gauge-button' : ''}`}
      onClick={onOpen}
      disabled={!interactive}
      aria-label={`Honey bank: ${completed} of ${goal}. Tap to see completed jobs.`}
    >
      <div className="honey-gauge-label">
        <span>Honey bank</span>
        <strong>
          {completed}/{goal}
        </strong>
      </div>
      <div className="honey-gauge-track" role="progressbar" aria-valuenow={completed} aria-valuemax={goal}>
        <div className="honey-gauge-fill" style={{ width: `${pct}%` }} />
      </div>
      {interactive ? <span className="honey-gauge-hint">Tap to see what you knocked out</span> : null}
    </button>
  )
}
