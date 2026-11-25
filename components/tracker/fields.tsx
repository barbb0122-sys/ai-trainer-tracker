import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'

const controlClass =
  'h-10 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20 aria-invalid:border-destructive disabled:opacity-50'

export function Field({
  label,
  htmlFor,
  hint,
  className,
  children,
}: {
  label: string
  htmlFor: string
  hint?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

export function TextInput({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(controlClass, className)} {...props} />
}

export function SelectInput({ className, children, ...props }: ComponentProps<'select'>) {
  return (
    <select className={cn(controlClass, 'cursor-pointer pr-8', className)} {...props}>
      {children}
    </select>
  )
}

export function FormError({ message }: { message: string }) {
  if (!message) return null
  return (
    <p role="alert" className="text-sm font-medium text-destructive">
      {message}
    </p>
  )
}

export function primaryButtonClass(extra?: string) {
  return cn('h-10 px-4 hover:bg-primary/90', extra)
}
