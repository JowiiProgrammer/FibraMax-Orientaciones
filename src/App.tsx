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
import { MaterialPage } from '@/pages/MaterialPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000,
      retry: 1,
      // Auto-refresh: los datos se actualizan solos, sin recargar la página.
      refetchOnWindowFocus: true,   // al volver a la pestaña
      refetchOnReconnect: true,     // al recuperar conexión
      refetchInterval: 15_000,      // sondeo en segundo plano (cambios de otros equipos)
      refetchIntervalInBackground: false,
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
              <Route path="/material" element={<MaterialPage />} />
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
