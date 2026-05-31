import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { OrientationsProvider } from '@/store/orientations-store'
import { AppLayout } from '@/components/layout/AppLayout'
import { DashboardPage } from '@/pages/DashboardPage'
import { OrientationsPage } from '@/pages/OrientationsPage'
import { MonitoresPage } from '@/pages/MonitoresPage'
import { ReportePage } from '@/pages/ReportePage'
import { SettingsPage } from '@/pages/SettingsPage'

export default function App() {
  return (
    <BrowserRouter>
      <OrientationsProvider>
        <AppLayout>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/orientaciones" element={<OrientationsPage />} />
            <Route path="/monitores" element={<MonitoresPage />} />
            <Route path="/informes" element={<ReportePage />} />
            <Route path="/configuracion" element={<SettingsPage />} />
          </Routes>
        </AppLayout>
      </OrientationsProvider>
    </BrowserRouter>
  )
}
