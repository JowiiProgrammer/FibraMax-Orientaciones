import { useState } from 'react'
import { Star, X, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FeedbackModalProps {
  open: boolean
  title: string          // "Feedback de la orientación" | "Feedback del tour"
  subtitle: string       // Nombre abonado o monitor
  color: string          // Color del monitor
  existingRating?: number | null
  existingComment?: string | null
  onSave: (rating: number, comment?: string) => void
  onSkip?: () => void
  onClose: () => void
}

const LABELS = ['', 'Muy mal', 'Regular', 'Bien', 'Muy bien', '¡Excelente!']
const EMOJIS = ['', '😞', '😐', '🙂', '😊', '🤩']

export function FeedbackModal({
  open, title, subtitle, color,
  existingRating, existingComment,
  onSave, onSkip, onClose,
}: FeedbackModalProps) {
  const [rating, setRating] = useState(existingRating ?? 0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState(existingComment ?? '')

  if (!open) return null

  const displayRating = hovered || rating

  function handleSave() {
    if (rating === 0) return
    onSave(rating, comment.trim() || undefined)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={cn(
        'relative w-full sm:max-w-sm bg-card border border-border shadow-2xl',
        'rounded-t-2xl sm:rounded-xl animate-scale-in'
      )}>
        {/* Barra de color */}
        <div className="h-1 rounded-t-2xl sm:rounded-t-xl" style={{ backgroundColor: color }} />

        {/* Header */}
        <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              <h2 className="font-display text-lg text-foreground">{title.toUpperCase()}</h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-md hover:bg-accent text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Emoji + label dinámico */}
          <div className="text-center space-y-1">
            <div className="text-4xl transition-all duration-150">
              {displayRating ? EMOJIS[displayRating] : '⭐'}
            </div>
            <p className="text-sm font-medium text-foreground h-5">
              {displayRating ? LABELS[displayRating] : 'Selecciona una valoración'}
            </p>
          </div>

          {/* Estrellas */}
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-125 active:scale-110"
              >
                <Star
                  className={cn(
                    'w-8 h-8 transition-colors',
                    star <= displayRating
                      ? 'fill-warning text-warning'
                      : 'text-muted-foreground/30'
                  )}
                />
              </button>
            ))}
          </div>

          {/* Comentario */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Comentario (opcional)
            </label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="¿Algo que destacar sobre esta sesión?"
              rows={2}
              className="w-full px-3 py-2.5 text-sm bg-input border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
          </div>

          {/* Acciones */}
          <div className="flex gap-2">
            {onSkip && (
              <Button variant="ghost" size="sm" className="flex-1 text-muted-foreground" onClick={() => { onSkip(); onClose() }}>
                Omitir
              </Button>
            )}
            <Button
              className="flex-1"
              onClick={handleSave}
              disabled={rating === 0}
            >
              <Star className="w-4 h-4" />
              Guardar valoración
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Componente pequeño para mostrar estrellas ──────────────────────────
export function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const starSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star
          key={s}
          className={cn(
            starSize,
            s <= rating ? 'fill-warning text-warning' : 'text-muted-foreground/20'
          )}
        />
      ))}
    </div>
  )
}
