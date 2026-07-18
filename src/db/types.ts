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
  cadence: Cadence
  nextDue: string
  materials: string
  createdAt: string
}

export interface CompletionLog {
  id: string
  taskId: string
  completedAt: string
  nextDueSet: string
}

export interface WeekendTodo {
  id: string
  title: string
  done: boolean
  sortOrder: number
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

export const SCHEMA_VERSION = 2

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
