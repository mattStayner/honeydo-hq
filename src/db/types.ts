export type CadenceUnit = 'days' | 'weeks' | 'months'

export interface Cadence {
  every: number
  unit: CadenceUnit
}

export interface Space {
  id: string
  name: string
  kind: 'room' | 'space'
  createdAt: string
}

export interface Asset {
  id: string
  spaceId: string
  name: string
  specs: Record<string, string>
  createdAt: string
}

export interface MaintenanceTask {
  id: string
  assetId: string
  title: string
  /** Present when the task repeats on a regular schedule; omit for one-offs. */
  cadence?: Cadence
  nextDue: string
  materials: string
  createdAt: string
}

export interface CompletionLog {
  id: string
  taskId: string
  /** Snapshot so the haul still labels one-offs removed after complete. */
  title?: string
  completedAt: string
  /** Next due chosen after complete; omit when the task was finished for good. */
  nextDueSet?: string
  note?: string
}

export interface WeekendTodo {
  id: string
  title: string
  done: boolean
  sortOrder: number
  /** When set, the open todo also appears on the Hive by due date. */
  dueDate?: string
  createdAt: string
}

export interface ShoppingList {
  id: string
  name: string
  createdAt: string
}

export interface ShoppingItem {
  id: string
  listId: string
  name: string
  checked: boolean
  note: string
  createdAt: string
}

export const SCHEMA_VERSION = 5

export interface BackupPayload {
  schemaVersion: number
  exportedAt: string
  spaces: Space[]
  assets: Asset[]
  tasks: MaintenanceTask[]
  completions: CompletionLog[]
  weekendTodos: WeekendTodo[]
  shoppingLists: ShoppingList[]
  shoppingItems: ShoppingItem[]
}
