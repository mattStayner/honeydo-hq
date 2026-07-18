import { NavLink } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'

export function BottomNav() {
  const weekendOpen = useLiveQuery(
    () => db.weekendTodos.filter((t) => !t.done).count(),
    [],
    0,
  )
  const shopOpen = useLiveQuery(
    () => db.shoppingItems.filter((i) => !i.checked).count(),
    [],
    0,
  )

  return (
    <nav className="bottom-nav" aria-label="Main">
      <div className="bottom-nav-inner">
        <NavLink to="/" end className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <HiveIcon />
          Hive
        </NavLink>
        <NavLink
          to="/spaces"
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <SpacesIcon />
          Spaces
        </NavLink>
        <NavLink
          to="/tasks"
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <TasksIcon />
          Tasks
          {(weekendOpen ?? 0) > 0 ? <span className="nav-badge">{weekendOpen}</span> : null}
        </NavLink>
        <NavLink to="/shop" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <ShopIcon />
          Shop
          {(shopOpen ?? 0) > 0 ? <span className="nav-badge">{shopOpen}</span> : null}
        </NavLink>
        <NavLink
          to="/settings"
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <SettingsIcon />
          Settings
        </NavLink>
      </div>
    </nav>
  )
}

function HiveIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" />
      <path d="M12 12l8-4.5M12 12v9M12 12L4 7.5" />
    </svg>
  )
}

function SpacesIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 10l8-6 8 6v10H4V10z" />
      <path d="M10 20v-6h4v6" />
    </svg>
  )
}

function TasksIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ShopIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 7h12l-1 12H7L6 7z" />
      <path d="M9 7V5a3 3 0 016 0v2" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  )
}
