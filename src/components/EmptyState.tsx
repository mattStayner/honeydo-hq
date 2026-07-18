import type { ReactNode } from 'react'
import { BeeMark } from './BeeMark'

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="empty-state">
      <BeeMark />
      <h3>{title}</h3>
      <div>{children}</div>
      {action ? <div style={{ marginTop: '1rem' }}>{action}</div> : null}
    </div>
  )
}
