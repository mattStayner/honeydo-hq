import { useState } from 'react'
import { format, parseISO } from 'date-fns'

export type HaulItem = {
  id: string
  title: string
  assetName: string
  spaceName: string
  completedAt: string
}

export type HaulWeek = {
  weekKey: string
  label: string
  isCurrent: boolean
  items: HaulItem[]
}

function formatCompletedAt(iso: string): string {
  return format(parseISO(iso), 'EEE MMM d · h:mm a')
}

export function HaulSheet({ weeks, onClose }: { weeks: HaulWeek[]; onClose: () => void }) {
  const current = weeks.find((w) => w.isCurrent)
  const past = weeks.filter((w) => !w.isCurrent)
  const [openWeek, setOpenWeek] = useState<string | null>(past[0]?.weekKey ?? null)

  const totalAll = weeks.reduce((sum, w) => sum + w.items.length, 0)

  return (
    <div className="sheet-backdrop" role="presentation" onClick={onClose}>
      <div
        className="sheet sheet-haul"
        role="dialog"
        aria-labelledby="haul-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="haul-title">Honey bank</h2>
        <p>
          {totalAll === 0
            ? 'Nothing deposited yet — complete a Hive job and it shows up here.'
            : `${totalAll} job${totalAll === 1 ? '' : 's'} deposited across ${weeks.length} week${weeks.length === 1 ? '' : 's'}.`}
        </p>

        <div className="haul-weeks">
          <section className="haul-week">
            <div className="haul-week-head">
              <span>{current?.label ?? 'This week'}</span>
              <strong>{current?.items.length ?? 0}</strong>
            </div>
            {(current?.items.length ?? 0) === 0 ? (
              <p className="haul-empty muted">No completions this week yet.</p>
            ) : (
              <ul className="haul-list">
                {current!.items.map((item) => (
                  <li key={item.id}>
                    <div className="card-title">{item.title}</div>
                    <div className="card-meta">
                      {item.assetName} · {item.spaceName}
                    </div>
                    <div className="card-meta">{formatCompletedAt(item.completedAt)}</div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {past.map((week) => {
            const open = openWeek === week.weekKey
            return (
              <section key={week.weekKey} className="haul-week">
                <button
                  type="button"
                  className="haul-week-toggle"
                  aria-expanded={open}
                  onClick={() => setOpenWeek(open ? null : week.weekKey)}
                >
                  <span>{week.label}</span>
                  <strong>{week.items.length}</strong>
                </button>
                {open ? (
                  <ul className="haul-list">
                    {week.items.map((item) => (
                      <li key={item.id}>
                        <div className="card-title">{item.title}</div>
                        <div className="card-meta">
                          {item.assetName} · {item.spaceName}
                        </div>
                        <div className="card-meta">{formatCompletedAt(item.completedAt)}</div>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            )
          })}
        </div>

        <div className="btn-row">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
