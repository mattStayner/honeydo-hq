import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { AssetDetailPage } from './pages/AssetDetailPage'
import { HivePage } from './pages/HivePage'
import { SettingsPage } from './pages/SettingsPage'
import { ShopPage } from './pages/ShopPage'
import { SpaceDetailPage } from './pages/SpaceDetailPage'
import { SpacesPage } from './pages/SpacesPage'
import { TasksPage } from './pages/TasksPage'

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HivePage />} />
          <Route path="spaces" element={<SpacesPage />} />
          <Route path="spaces/:spaceId" element={<SpaceDetailPage />} />
          <Route path="assets/:assetId" element={<AssetDetailPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="saturday" element={<Navigate to="/tasks" replace />} />
          <Route path="shop" element={<ShopPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
