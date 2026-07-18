import { db } from './database'
import { SCHEMA_VERSION, type BackupPayload } from './types'

export async function exportBackup(): Promise<BackupPayload> {
  const [
    spaces,
    assets,
    tasks,
    completions,
    weekendTodos,
    shoppingLists,
    shoppingItems,
  ] = await Promise.all([
    db.spaces.toArray(),
    db.assets.toArray(),
    db.tasks.toArray(),
    db.completions.toArray(),
    db.weekendTodos.toArray(),
    db.shoppingLists.toArray(),
    db.shoppingItems.toArray(),
  ])

  return {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    spaces,
    assets,
    tasks,
    completions,
    weekendTodos,
    shoppingLists,
    shoppingItems,
  }
}

export function downloadBackup(payload: BackupPayload): void {
  const stamp = payload.exportedAt.slice(0, 10)
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `honeydo-hq-backup-${stamp}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function isBackupPayload(value: unknown): value is BackupPayload {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    typeof v.schemaVersion === 'number' &&
    Array.isArray(v.spaces) &&
    Array.isArray(v.assets) &&
    Array.isArray(v.tasks) &&
    Array.isArray(v.completions) &&
    Array.isArray(v.weekendTodos) &&
    Array.isArray(v.shoppingLists) &&
    Array.isArray(v.shoppingItems)
  )
}

export async function parseBackupFile(file: File): Promise<BackupPayload> {
  const text = await file.text()
  const parsed: unknown = JSON.parse(text)
  if (!isBackupPayload(parsed)) {
    throw new Error('Invalid backup file.')
  }
  if (parsed.schemaVersion > SCHEMA_VERSION) {
    throw new Error(
      `This backup is from a newer app (v${parsed.schemaVersion}). Update HoneyDo HQ first.`,
    )
  }
  return parsed
}

export async function importBackup(
  payload: BackupPayload,
  mode: 'replace' | 'merge',
): Promise<void> {
  await db.transaction(
    'rw',
    [
      db.spaces,
      db.assets,
      db.tasks,
      db.completions,
      db.weekendTodos,
      db.shoppingLists,
      db.shoppingItems,
    ],
    async () => {
      if (mode === 'replace') {
        await Promise.all([
          db.spaces.clear(),
          db.assets.clear(),
          db.tasks.clear(),
          db.completions.clear(),
          db.weekendTodos.clear(),
          db.shoppingLists.clear(),
          db.shoppingItems.clear(),
        ])
      }

      const weekendTodos = [...payload.weekendTodos]
        .sort((a, b) => {
          const ao =
            typeof a.sortOrder === 'number' ? a.sortOrder : Number.POSITIVE_INFINITY
          const bo =
            typeof b.sortOrder === 'number' ? b.sortOrder : Number.POSITIVE_INFINITY
          if (ao !== bo) return ao - bo
          return b.createdAt.localeCompare(a.createdAt)
        })
        .map((todo, index) => ({ ...todo, sortOrder: index }))

      await db.spaces.bulkPut(payload.spaces)
      await db.assets.bulkPut(payload.assets)
      await db.tasks.bulkPut(payload.tasks)
      await db.completions.bulkPut(payload.completions)
      await db.weekendTodos.bulkPut(weekendTodos)
      await db.shoppingLists.bulkPut(payload.shoppingLists)
      await db.shoppingItems.bulkPut(payload.shoppingItems)
    },
  )
}
