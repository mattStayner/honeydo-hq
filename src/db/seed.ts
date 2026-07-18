import { addDays, formatISO, startOfDay } from 'date-fns'
import { createId } from '../lib/ids'
import { db } from './database'

function iso(daysFromNow: number): string {
  return formatISO(addDays(startOfDay(new Date()), daysFromNow), {
    representation: 'date',
  })
}

export async function seedDemoData(): Promise<void> {
  const now = new Date().toISOString()

  const utilityRoom = {
    id: createId(),
    name: 'Utility Room',
    kind: 'room' as const,
    createdAt: now,
  }
  const backyard = {
    id: createId(),
    name: 'Backyard',
    kind: 'space' as const,
    createdAt: now,
  }
  const garage = {
    id: createId(),
    name: 'Garage',
    kind: 'space' as const,
    createdAt: now,
  }

  const furnace = {
    id: createId(),
    spaceId: utilityRoom.id,
    name: 'Furnace',
    specs: { 'Filter size': '16x25x1', Brand: 'Filtrete' },
    createdAt: now,
  }
  const softener = {
    id: createId(),
    spaceId: utilityRoom.id,
    name: 'Water Softener',
    specs: { Salt: 'Solar salt pellets', 'Bag capacity': '40 lb' },
    createdAt: now,
  }
  const lawn = {
    id: createId(),
    spaceId: backyard.id,
    name: 'Lawn',
    specs: { Fertilizer: 'Scotts Turf Builder', Zone: 'Cool season' },
    createdAt: now,
  }
  const car = {
    id: createId(),
    spaceId: garage.id,
    name: 'Truck',
    specs: { 'Oil weight': '5W-30', Capacity: '6 qt', Filter: 'FL820S' },
    createdAt: now,
  }

  const tasks = [
    {
      id: createId(),
      assetId: furnace.id,
      title: 'Change furnace filter',
      cadence: { every: 3, unit: 'months' as const },
      nextDue: iso(-2),
      materials: '16x25x1 filter',
      createdAt: now,
    },
    {
      id: createId(),
      assetId: softener.id,
      title: 'Add softener salt',
      cadence: { every: 6, unit: 'weeks' as const },
      nextDue: iso(5),
      materials: '40 lb solar salt',
      createdAt: now,
    },
    {
      id: createId(),
      assetId: lawn.id,
      title: 'Fertilize lawn',
      cadence: { every: 8, unit: 'weeks' as const },
      nextDue: iso(12),
      materials: 'Turf Builder bag',
      createdAt: now,
    },
    {
      id: createId(),
      assetId: car.id,
      title: 'Change oil',
      cadence: { every: 6, unit: 'months' as const },
      nextDue: iso(21),
      materials: '5W-30, FL820S filter',
      createdAt: now,
    },
  ]

  const shopList = {
    id: createId(),
    name: 'Home Depot',
    createdAt: now,
  }

  const shopItems = [
    {
      id: createId(),
      listId: shopList.id,
      name: '16x25x1 furnace filter',
      checked: false,
      note: 'Filtrete if available',
      createdAt: now,
    },
    {
      id: createId(),
      listId: shopList.id,
      name: 'Solar salt pellets (40 lb)',
      checked: false,
      note: '',
      createdAt: now,
    },
    {
      id: createId(),
      listId: shopList.id,
      name: 'Wood screws #8 x 1-1/4',
      checked: false,
      note: '1 lb box',
      createdAt: now,
    },
  ]

  const weekendTodos = [
    {
      id: createId(),
      title: 'Tighten loose deck board',
      done: false,
      sortOrder: 0,
      dueDate: iso(2),
      createdAt: now,
    },
    {
      id: createId(),
      title: 'Clean gutters on south side',
      done: false,
      sortOrder: 1,
      createdAt: now,
    },
    {
      id: createId(),
      title: 'Organize garage shelf',
      done: false,
      sortOrder: 2,
      createdAt: now,
    },
  ]

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
      await Promise.all([
        db.spaces.clear(),
        db.assets.clear(),
        db.tasks.clear(),
        db.completions.clear(),
        db.weekendTodos.clear(),
        db.shoppingLists.clear(),
        db.shoppingItems.clear(),
      ])
      await db.spaces.bulkAdd([utilityRoom, backyard, garage])
      await db.assets.bulkAdd([furnace, softener, lawn, car])
      await db.tasks.bulkAdd(tasks)
      await db.shoppingLists.add(shopList)
      await db.shoppingItems.bulkAdd(shopItems)
      await db.weekendTodos.bulkAdd(weekendTodos)
    },
  )
}

export async function ensureDefaultShoppingList(): Promise<void> {
  const count = await db.shoppingLists.count()
  if (count === 0) {
    await db.shoppingLists.add({
      id: createId(),
      name: 'Home Depot',
      createdAt: new Date().toISOString(),
    })
  }
}
