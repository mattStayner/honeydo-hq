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
  /** ISO date (yyyy-mm-dd) when the asset was purchased. */
  purchaseDate?: string
  /** Amount paid at purchase. */
  purchaseAmount?: number
  /** Warranty, maintenance notes, and other freeform details. */
  description?: string
  specs: Record<string, string>
  createdAt: string
}

export interface Task {
  id: string
  title: string
  assetId?: string
  /** Present when the task repeats on a regular schedule. */
  cadence?: Cadence
  nextDue?: string
  materials?: string
  createdAt: string
}

export interface CompletionLog {
  id: string
  taskId: string
  /** Snapshot so the haul still labels tasks removed after complete. */
  title?: string
  completedAt: string
  /** Next due chosen after complete; omit when the task was finished for good. */
  nextDueSet?: string
  note?: string
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

export const SCHEMA_VERSION = 7

export interface BackupPayload {
  schemaVersion: number
  exportedAt: string
  spaces: Space[]
  assets: Asset[]
  tasks: Task[]
  completions: CompletionLog[]
  shoppingLists: ShoppingList[]
  shoppingItems: ShoppingItem[]
}
