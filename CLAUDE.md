# FibraMax — Orientaciones

## Descripción
Aplicación de agendamiento de orientaciones para los monitores de FibraMax. Permite a recepción agendar orientaciones (hora, abonado, monitor, día) y a los monitores verlas en un calendario visual con el diseño premium de Fibra.

## Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS 3 + Radix UI
- **Routing**: React Router DOM v6
- **Estado**: React Context (OrientationsProvider)
- **Fechas**: date-fns con locale `es`
- **Iconos**: lucide-react
- **Notificaciones**: sonner (pendiente de instalar)
- **Deploy**: Vercel (pendiente)
- **BD**: Supabase (pendiente — actualmente mock data)

## Estado actual
🟡 **En desarrollo local** — Fase 1 MVP con datos mock. Sin Supabase ni autenticación todavía.

## Estructura
```
src/
  components/
    layout/        # AppLayout, Sidebar, header móvil
    orientations/  # OrientationCalendar, OrientationForm, OrientationDetail, WeekCalendar
    ui/            # button, badge
  lib/
    types.ts       # Tipos + STATUS_CONFIG + SERVICE_CONFIG
    mock-data.ts   # Datos de prueba (monitores, abonados, orientaciones)
    utils.ts       # cn() utility
  pages/
    DashboardPage.tsx     # Inicio: stats + orientaciones de hoy
    OrientationsPage.tsx  # Calendario semanal + lista + filtros
    MonitoresPage.tsx     # Vista de carga por monitor
  store/
    orientations-store.ts  # Context provider con estado global
```

## Comandos
```bash
npm run dev      # Dev server en localhost:5173
npm run build    # Build de producción
npm run preview  # Preview del build
```

## Cómo correr en local
```bash
cd negocio/FibraMax-Orientaciones
npm install
npm run dev
```

## Funcionalidades MVP implementadas
- [x] Dashboard con stats: pendientes, confirmadas hoy, completadas, no-shows
- [x] Calendario semanal con chips de orientaciones por slot horario
- [x] Vista lista con filtros por estado y monitor
- [x] Formulario crear orientación (fecha, hora, abonado, monitor, tipo, notas)
- [x] Hora fin automática (start + 35 min: 30 min orientación + 5 buffer)
- [x] Validación anti-solapamiento por monitor
- [x] Modal de detalle con cambio de estado
- [x] Flujo de estados: pending → confirmed → completed / cancelled / no_show
- [x] Página de monitores con carga y orientaciones próximas
- [x] Diseño premium oscuro con colores Fibra (rojo #DF3E6F)
- [x] Responsive: sidebar colapsable en móvil

## Pendiente (Fase 2)
- [ ] Conectar Supabase (schema orientations + RLS)
- [ ] Autenticación por roles (recepcionista, monitor, admin)
- [ ] Notificaciones Realtime
- [ ] Desktop notifications (Web Notifications API)
- [ ] Reminders 4h antes (Edge Function cron)
- [ ] Deploy en Vercel

## Diseño Fibra
- **Primario**: hsl(352 82% 47%) → `#DF3E6F` (rojo Fibra)
- **Fondo**: hsl(0 0% 8%) → `#141414` (muy oscuro)
- **Card**: hsl(0 0% 12%) → `#1F1F1F`
- **Tipografía display**: Bebas Neue (títulos)
- **Tipografía body**: Inter

## Convenciones
- Imports de tipos: siempre `import type { ... }` (verbatimModuleSyntax: true)
- Colores de estado en `STATUS_CONFIG` (lib/types.ts)
- Duración orientación: 30 min + 5 buffer = 35 min total
- Sin console.log en producción

## Lecciones aprendidas
- Tailwind v4 requiere `@tailwindcss/postcss` — usar v3 para consistencia con otros proyectos Fibra
- `verbatimModuleSyntax: true` en tsconfig obliga a `import type` para interfaces y tipos puros
- El preview tool de Claude Code usa el launch.json del root de sesión, no del subdirectorio

Última actualización: 2026-05-30
