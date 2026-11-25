'use client'

import { useId, useMemo, useState, type FormEvent } from 'react'
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { TrackerActions } from '@/hooks/use-tracker'
import {
  addDays,
  contractLabel,
  formatCurrency,
  formatDate,
  newId,
  parseISODate,
  startOfWeek,
  toISODate,
} from '@/lib/tracker'
import { Field, FormError, SelectInput, TextInput, primaryButtonClass } from './fields'
import { EmptyState, Section, Stat } from './section'

export function WeeklyGoalSection({ tracker }: { tracker: TrackerActions }) {
  const { data } = tracker
  const ids = useId()
  const [weekStart, setWeekStart] = useState(() => toISODate(startOfWeek(new Date())))
  const [logDate, setLogDate] = useState(() => toISODate(new Date()))
  const [logContractId, setLogContractId] = useState('')
  const [logHours, setLogHours] = useState('')
  const [error, setError] = useState('')

  const contractsById = useMemo(
    () => new Map(data.contracts.map((c) => [c.id, c])),
    [data.contracts],
  )
  const workableContracts = data.contracts.filter((c) => c.status !== 'Completed')

  const weekEnd = toISODate(addDays(parseISODate(weekStart), 6))
  const isCurrentWeek = weekStart === toISODate(startOfWeek(new Date()))

  const weekEntries = data.hours
    .filter((h) => h.date >= weekStart && h.date <= weekEnd)
    .sort((a, b) => (a.date === b.date ? 0 : a.date < b.date ? 1 : -1))

  const earningsFor = (contractId: string, hours: number) =>
    (contractsById.get(contractId)?.rate ?? 0) * hours

  const weekHours = weekEntries.reduce((sum, h) => sum + h.hours, 0)
  const weekEarnings = weekEntries.reduce((sum, h) => sum + earningsFor(h.contractId, h.hours), 0)
  const cashReceivedThisWeek = data.payments
    .filter((p) => p.status === 'Received' && p.date >= weekStart && p.date <= weekEnd)
    .reduce((sum, p) => sum + p.amount, 0)

  const goal = data.weeklyGoal
  const remaining = Math.max(0, goal - weekEarnings)
  const progress = goal > 0 ? Math.min(100, (weekEarnings / goal) * 100) : 0

  const nextContract = contractsById.get(data.nextContractId)
  const hoursNeeded = nextContract && nextContract.rate > 0 ? remaining / nextContract.rate : null

  const selectedLogContractId = logContractId || data.nextContractId || workableContracts[0]?.id || ''

  function handleLogHours(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const hours = Number(logHours)
    if (!selectedLogContractId) return setError('Add a contract first, then choose it here.')
    if (!logDate) return setError('Choose the date you worked.')
    if (!Number.isFinite(hours) || hours <= 0 || hours > 24) {
      return setError('Enter hours between 0 and 24.')
    }
    tracker.addHours({ id: newId(), contractId: selectedLogContractId, date: logDate, hours })
    setLogHours('')
    setError('')
  }

  function shiftWeek(days: number) {
    setWeekStart(toISODate(addDays(parseISODate(weekStart), days)))
  }

  let nextMessage: string
  if (goal <= 0) nextMessage = 'Set a weekly goal to see how many hours you need.'
  else if (remaining === 0) nextMessage = 'You reached your goal for this week.'
  else if (!nextContract) nextMessage = 'Choose the project you will work on next.'
  else if (hoursNeeded === null) nextMessage = 'This project has no hourly rate yet.'
  else
    nextMessage = `${formatCurrency(remaining)} to go at ${formatCurrency(nextContract.rate)}/hr.`

  return (
    <Section
      id="weekly-goal"
      title="Weekly goal"
      description="Earnings here are estimates from hours worked × each project's hourly rate. They are tracked separately from cash received."
      action={
        <div className="flex items-center gap-1 self-start rounded-lg border border-border bg-background p-1 sm:self-auto">
          <Button variant="ghost" size="icon-sm" onClick={() => shiftWeek(-7)} aria-label="Previous week">
            <ChevronLeft aria-hidden="true" />
          </Button>
          <span className="min-w-40 px-1 text-center text-sm font-medium tabular-nums" aria-live="polite">
            {formatDate(weekStart, { month: 'short', day: 'numeric' })} –{' '}
            {formatDate(weekEnd, { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <Button variant="ghost" size="icon-sm" onClick={() => shiftWeek(7)} aria-label="Next week">
            <ChevronRight aria-hidden="true" />
          </Button>
          {!isCurrentWeek ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setWeekStart(toISODate(startOfWeek(new Date())))}
            >
              This week
            </Button>
          ) : null}
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div className="flex flex-col gap-4 rounded-lg border border-border bg-background p-4">
          <Field label="Gross weekly income goal (USD)" htmlFor={`${ids}-goal`}>
            <TextInput
              id={`${ids}-goal`}
              type="number"
              inputMode="decimal"
              min={0}
              step="1"
              placeholder="e.g. 1500"
              value={goal ? String(goal) : ''}
              onChange={(e) => {
                const value = Number(e.target.value)
                tracker.setWeeklyGoal(Number.isFinite(value) && value > 0 ? value : 0)
              }}
            />
          </Field>
          <Field label="Project you'll work on next" htmlFor={`${ids}-next`}>
            <SelectInput
              id={`${ids}-next`}
              value={nextContract ? data.nextContractId : ''}
              onChange={(e) => tracker.setNextContractId(e.target.value)}
              disabled={data.contracts.length === 0}
            >
              <option value="">
                {data.contracts.length === 0 ? 'Add a contract first' : 'Select a project'}
              </option>
              {data.contracts.map((c) => (
                <option key={c.id} value={c.id}>
                  {contractLabel(c)} — {formatCurrency(c.rate)}/hr
                  {c.status !== 'Active' ? ` (${c.status})` : ''}
                </option>
              ))}
            </SelectInput>
          </Field>
          <div className="rounded-lg bg-accent px-4 py-3 text-accent-foreground" aria-live="polite">
            <p className="text-sm font-medium">Hours still needed</p>
            <p className="text-3xl font-semibold tabular-nums">
              {goal > 0 && remaining === 0
                ? '0 hrs'
                : hoursNeeded !== null && goal > 0
                  ? `${hoursNeeded.toFixed(1)} hrs`
                  : '—'}
            </p>
            <p className="text-sm leading-relaxed">{nextMessage}</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Stat
              tone="primary"
              label="Earned from hours"
              value={formatCurrency(weekEarnings)}
              sub={`${weekHours.toFixed(2).replace(/\.?0+$/, '')} hrs logged this week`}
            />
            <Stat
              label="Left to goal"
              value={formatCurrency(remaining)}
              sub={goal > 0 ? `Goal ${formatCurrency(goal)}` : 'No goal set'}
            />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Progress to goal</span>
              <span className="tabular-nums text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <div
              className="h-3 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-label="Weekly goal progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress)}
            >
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <Stat
            tone="muted"
            label="Cash received this week (separate)"
            value={formatCurrency(cashReceivedThisWeek)}
            sub="From the Payments section. Not counted toward your hours-based goal."
          />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="text-base font-semibold">Log hours worked</h3>
        <form onSubmit={handleLogHours} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[10rem_minmax(0,1fr)_8rem_auto] lg:items-end" noValidate>
          <Field label="Date" htmlFor={`${ids}-date`}>
            <TextInput id={`${ids}-date`} type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} required />
          </Field>
          <Field label="Project" htmlFor={`${ids}-project`}>
            <SelectInput
              id={`${ids}-project`}
              value={selectedLogContractId}
              onChange={(e) => setLogContractId(e.target.value)}
              disabled={data.contracts.length === 0}
            >
              {data.contracts.length === 0 ? <option value="">Add a contract first</option> : null}
              {data.contracts.map((c) => (
                <option key={c.id} value={c.id}>
                  {contractLabel(c)}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Hours" htmlFor={`${ids}-hours`}>
            <TextInput
              id={`${ids}-hours`}
              type="number"
              inputMode="decimal"
              min={0}
              max={24}
              step="0.25"
              placeholder="2.5"
              value={logHours}
              onChange={(e) => setLogHours(e.target.value)}
              required
            />
          </Field>
          <Button type="submit" className={primaryButtonClass()} disabled={data.contracts.length === 0}>
            Log hours
          </Button>
        </form>
        <FormError message={error} />

        {weekEntries.length === 0 ? (
          <EmptyState>No hours logged for this week yet.</EmptyState>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-lg text-sm">
              <caption className="sr-only">Hours logged this week</caption>
              <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-2 font-medium">Date</th>
                  <th scope="col" className="px-4 py-2 font-medium">Project</th>
                  <th scope="col" className="px-4 py-2 text-right font-medium">Hours</th>
                  <th scope="col" className="px-4 py-2 text-right font-medium">Earned</th>
                  <th scope="col" className="px-4 py-2"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {weekEntries.map((entry) => {
                  const contract = contractsById.get(entry.contractId)
                  return (
                    <tr key={entry.id}>
                      <td className="whitespace-nowrap px-4 py-2.5">
                        {formatDate(entry.date, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-4 py-2.5">{contractLabel(contract)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{entry.hours}</td>
                      <td className="px-4 py-2.5 text-right font-medium tabular-nums">
                        {formatCurrency(earningsFor(entry.contractId, entry.hours))}
                      </td>
                      <td className="px-2 py-1.5 text-right">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => tracker.deleteHours(entry.id)}
                          aria-label={`Delete ${entry.hours} hours on ${formatDate(entry.date)}`}
                        >
                          <Trash2 aria-hidden="true" />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Section>
  )
}
