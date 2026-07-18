# HoneyDo HQ

Local-first PWA for home maintenance, task lists, and shop runs.

## Stack

- Vite + React + TypeScript
- Dexie (IndexedDB)
- vite-plugin-pwa
- React Router + date-fns

## Develop

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Features

- **Hive** — all tasks (optional asset/due date), complete + schedule next
- **Spaces** — rooms/areas → assets → specs + tasks
- **Shop** — checkable shopping lists (default Home Depot)
- **Settings** — Honey bank weekly goal, JSON export/import backup, demo data, install tip

All data stays on-device. Export a backup before switching phones.
