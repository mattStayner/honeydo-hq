import Dexie, { type Table } from 'dexie'
import type {
  Asset,
  CompletionLog,
  ShoppingItem,
  ShoppingList,
  Space,
  Task,
} from './types'

export class HoneyDoDB extends Dexie {
  spaces!: Table<Space, string>
  assets!: Table<Asset, string>
  tasks!: Table<Task, string>
  completions!: Table<CompletionLog, string>
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
        const table = tx.table('weekendTodos')
        const all = await table.toArray()
        all.sort((a, b) =>
          String(b.createdAt).localeCompare(String(a.createdAt)),
        )
        await Promise.all(
          all.map((todo, index) =>
            table.update(todo.id as string, { sortOrder: index }),
          ),
        )
      })
    this.version(3).stores({
      weekendTodos: 'id, done, createdAt, sortOrder, dueDate',
    })
    this.version(4).stores({
      weekendTodos: null,
      tasks: 'id, assetId, nextDue, createdAt',
    })
  }
}

export const db = new HoneyDoDB()
