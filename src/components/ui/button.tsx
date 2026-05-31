import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline'
  size?: 'sm' | 'md' | 'lg' | 'icon'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
          {
            primary: 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95',
            secondary: 'bg-secondary text-secondary-foreground hover:bg-accent',
            ghost: 'hover:bg-accent text-muted-foreground hover:text-foreground',
            destructive: 'bg-destructive/20 text-destructive hover:bg-destructive/30 border border-destructive/30',
            outline: 'border border-border text-foreground hover:bg-accent',
          }[variant],
          {
            sm: 'h-7 px-2.5 text-xs',
            md: 'h-9 px-4 text-sm',
            lg: 'h-11 px-6 text-base',
            icon: 'h-9 w-9',
          }[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
