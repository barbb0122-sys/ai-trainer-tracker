'use client'

import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTracker } from '@/hooks/use-tracker'
import { ContractsSection } from './contracts-section'
import { PaymentsSection } from './payments-section'
import { WeeklyGoalSection } from './weekly-goal-section'

const navItems = [
  { href: '#weekly-goal', label: 'Weekly goal' },
  { href: '#contracts', label: 'Contracts' },
  { href: '#payments', label: 'Payments' },
]

export function TrackerApp() {
  const tracker = useTracker()
  const { data, ready } = tracker
  const hasData =
    data.contracts.length > 0 || data.payments.length > 0 || data.hours.length > 0 || data.weeklyGoal > 0

  function handleSample() {
    if (hasData && !window.confirm('Replace your current entries with sample data?')) return
    tracker.loadSampleData()
  }

  function handleClear() {
    if (!window.confirm('Clear all contracts, payments, hours, and your goal from this browser?')) return
    tracker.clearAll()
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="bg-primary text-primary-foreground">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-8 md:px-6 md:py-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex max-w-2xl flex-col gap-2">
              <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
                AI Trainer Pay &amp; Hours Tracker
              </h1>
              <p className="text-pretty leading-relaxed text-primary-foreground/80">
                Keep contracts, payments, and weekly income goals in one place across every
                AI training project. Entries are saved in this browser only.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleSample}
                className="h-10 bg-primary-foreground px-4 text-primary hover:bg-primary-foreground/90"
              >
                <Sparkles aria-hidden="true" />
                Try sample data
              </Button>
              {hasData ? (
                <Button
                  variant="ghost"
                  onClick={handleClear}
                  className="h-10 px-4 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                >
                  Clear all
                </Button>
              ) : null}
            </div>
          </div>
          <nav aria-label="Sections">
            <ul className="flex flex-wrap gap-2 text-sm">
              {navItems.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="inline-flex rounded-full border border-primary-foreground/25 px-3 py-1 text-primary-foreground/90 transition-colors hover:bg-primary-foreground/10 focus-visible:outline-2 focus-visible:outline-primary-foreground"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
        {ready ? (
          <>
            <WeeklyGoalSection tracker={tracker} />
            <ContractsSection tracker={tracker} />
            <PaymentsSection tracker={tracker} />
          </>
        ) : (
          <p className="py-16 text-center text-sm text-muted-foreground" role="status">
            Loading your saved entries…
          </p>
        )}
      </main>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto w-full max-w-6xl px-4 py-5 text-sm text-muted-foreground md:px-6">
          Created by Barbara Hood
        </div>
      </footer>
    </div>
  )
}
