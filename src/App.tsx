import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { OrientationsProvider } from '@/store/orientations-store'
import { AppLayout } from '@/components/layout/AppLayout'
import { DashboardPage } from '@/pages/DashboardPage'
import { OrientationsPage } from '@/pages/OrientationsPage'
import { MonitoresPage } from '@/pages/MonitoresPage'
import { ReportePage } from '@/pages/ReportePage'
import { SettingsPage } from '@/pages/SettingsPage'
import { ActividadPage } from '@/pages/ActividadPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,        // 30s antes de refetch
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <OrientationsProvider>
          <AppLayout>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/orientaciones" element={<OrientationsPage />} />
              <Route path="/monitores" element={<MonitoresPage />} />
              <Route path="/informes" element={<ReportePage />} />
              <Route path="/actividad" element={<ActividadPage />} />
              <Route path="/configuracion" element={<SettingsPage />} />
            </Routes>
          </AppLayout>
        </OrientationsProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
