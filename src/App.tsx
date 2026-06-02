import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
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
      staleTime: 30_000,
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
          <Toaster
            position="bottom-right"
            theme="dark"
            toastOptions={{
              style: { background: 'hsl(0 0% 12%)', border: '1px solid hsl(0 0% 20%)', color: 'hsl(0 0% 98%)' },
            }}
          />
        </OrientationsProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
