import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Calendar, LayoutDashboard, Users, Menu, X, Dumbbell, Bell, Settings, BarChart2, Activity, Package } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useOrientationStore } from '@/store/orientations-store'

const nav = [
  { to: '/', label: 'Inicio', icon: LayoutDashboard, end: true },
  { to: '/orientaciones', label: 'Orientaciones', icon: Calendar },
  { to: '/monitores', label: 'Monitores', icon: Users },
  { to: '/material', label: 'Material', icon: Package },
  { to: '/informes', label: 'Informes', icon: BarChart2 },
  { to: '/actividad', label: 'Actividad', icon: Activity },
  { to: '/configuracion', label: 'Configuración', icon: Settings },
]

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const { orientations } = useOrientationStore()
  const pendingCount = orientations.filter(o => o.status === 'pending').length

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-sidebar border-r border-border fixed inset-y-0 left-0 z-30">
        <SidebarContent pendingCount={pendingCount} />
      </aside>

      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-14 bg-sidebar border-b border-border">
        <div className="flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-primary" />
          <span className="font-display text-lg text-foreground">FIBRA MAX</span>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <span className="relative">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                {pendingCount}
              </span>
            </span>
          )}
          <button
            onClick={() => setOpen(true)}
            className="p-2 rounded-md hover:bg-accent text-muted-foreground"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="relative w-72 bg-sidebar border-r border-border flex flex-col animate-fade-in">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-md hover:bg-accent text-muted-foreground"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent pendingCount={pendingCount} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 lg:pl-64 pt-14 lg:pt-0 min-h-screen">
        <div className="p-4 lg:p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}

function SidebarContent({ pendingCount, onNavigate }: { pendingCount: number; onNavigate?: () => void }) {
  return (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
        <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center fibra-glow">
          <Dumbbell className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-display text-xl text-foreground leading-none">FIBRA MAX</p>
          <p className="text-xs text-muted-foreground mt-0.5">Orientaciones</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
            {label === 'Orientaciones' && pendingCount > 0 && (
              <span className="ml-auto bg-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-border">
        <p className="text-xs text-muted-foreground">Recepción · FibraMax</p>
      </div>
    </>
  )
}
