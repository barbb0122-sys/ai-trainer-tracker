import type { ReactNode } from 'react'

export function Section({
  id,
  title,
  description,
  action,
  children,
}: {
  id: string
  title: string
  description: string
  action?: ReactNode
  children: ReactNode
}) {
  const headingId = `${id}-heading`
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="scroll-mt-6 rounded-xl border border-border bg-card shadow-sm"
    >
      <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-end sm:justify-between md:px-6">
        <div className="flex flex-col gap-1">
          <h2 id={headingId} className="text-lg font-semibold tracking-tight text-foreground">
            {title}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>
        {action}
      </div>
      <div className="flex flex-col gap-6 px-5 py-5 md:px-6">{children}</div>
    </section>
  )
}

export function Stat({
  label,
  value,
  sub,
  tone = 'default',
}: {
  label: string
  value: string
  sub?: string
  tone?: 'default' | 'primary' | 'muted'
}) {
  const toneClass =
    tone === 'primary'
      ? 'border-primary/20 bg-primary text-primary-foreground'
      : tone === 'muted'
        ? 'border-dashed border-border bg-muted/50'
        : 'border-border bg-background'
  const subClass = tone === 'primary' ? 'text-primary-foreground/80' : 'text-muted-foreground'
  return (
    <div className={`flex flex-col gap-1 rounded-lg border p-4 ${toneClass}`}>
      <span className={`text-xs font-medium uppercase tracking-wide ${subClass}`}>{label}</span>
      <span className="text-2xl font-semibold tabular-nums">{value}</span>
      {sub ? <span className={`text-xs leading-relaxed ${subClass}`}>{sub}</span> : null}
    </div>
  )
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-border bg-muted/40 px-4 py-6 text-center text-sm text-muted-foreground">
      {children}
    </p>
  )
}
