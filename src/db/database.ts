import Dexie, { type Table } from 'dexie'
import type {
  Asset,
  CompletionLog,
  MaintenanceTask,
  ShoppingItem,
  ShoppingList,
  Space,
  WeekendTodo,
} from './types'

export class HoneyDoDB extends Dexie {
  spaces!: Table<Space, string>
  assets!: Table<Asset, string>
  tasks!: Table<MaintenanceTask, string>
  completions!: Table<CompletionLog, string>
  weekendTodos!: Table<WeekendTodo, string>
  shoppingLists!: Table<ShoppingList, string>
  shoppingItems!: Table<ShoppingItem, string>

  constructor() {
    super('honeydo-hq')
    this.version(1).stores({
      spaces: 'id, name, kind',
      assets: 'id, spaceId, name',
      tasks: 'id, assetId, nextDue',
      completions: 'id, taskId, completedAt',
      weekendTodos: 'id, done, createdAt',
      shoppingLists: 'id, name',
      shoppingItems: 'id, listId, checked',
    })
    this.version(2)
      .stores({
        spaces: 'id, name, kind',
        assets: 'id, spaceId, name',
        tasks: 'id, assetId, nextDue',
        completions: 'id, taskId, completedAt',
        weekendTodos: 'id, done, createdAt, sortOrder',
        shoppingLists: 'id, name',
        shoppingItems: 'id, listId, checked',
      })
      .upgrade(async (tx) => {
        const table = tx.table<WeekendTodo, string>('weekendTodos')
        const all = await table.toArray()
        all.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        await Promise.all(all.map((todo, index) => table.update(todo.id, { sortOrder: index })))
      })
    this.version(3).stores({
      weekendTodos: 'id, done, createdAt, sortOrder, dueDate',
    })
  }
}

export const db = new HoneyDoDB()
