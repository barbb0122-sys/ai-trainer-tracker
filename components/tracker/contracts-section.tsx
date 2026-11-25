'use client'

import { useId, useState, type FormEvent } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { TrackerActions } from '@/hooks/use-tracker'
import {
  CONTRACT_STATUSES,
  formatCurrency,
  formatDate,
  newId,
  toISODate,
  type Contract,
  type ContractStatus,
} from '@/lib/tracker'
import { cn } from '@/lib/utils'
import { Field, FormError, SelectInput, TextInput, primaryButtonClass } from './fields'
import { EmptyState, Section } from './section'

interface ContractForm {
  platform: string
  project: string
  rate: string
  startDate: string
  endDate: string
  status: ContractStatus
}

const blankForm = (): ContractForm => ({
  platform: '',
  project: '',
  rate: '',
  startDate: toISODate(new Date()),
  endDate: '',
  status: 'Active',
})

const statusStyles: Record<ContractStatus, string> = {
  Active: 'bg-primary/10 text-primary',
  Paused: 'bg-amber-100 text-amber-900',
  Completed: 'bg-muted text-muted-foreground',
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', className)}>
      {status}
    </span>
  )
}

export function ContractsSection({ tracker }: { tracker: TrackerActions }) {
  const { data } = tracker
  const ids = useId()
  const [form, setForm] = useState<ContractForm>(blankForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const update = <K extends keyof ContractForm>(key: K, value: ContractForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  function resetForm() {
    setForm(blankForm())
    setEditingId(null)
    setError('')
  }

  function startEdit(contract: Contract) {
    setEditingId(contract.id)
    setForm({
      platform: contract.platform,
      project: contract.project,
      rate: String(contract.rate),
      startDate: contract.startDate,
      endDate: contract.endDate,
      status: contract.status,
    })
    setError('')
    document.getElementById(`${ids}-platform`)?.focus()
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const rate = Number(form.rate)
    const platform = form.platform.trim()
    const project = form.project.trim()
    if (!platform || !project) return setError('Enter both a platform and a project name.')
    if (!Number.isFinite(rate) || rate <= 0) return setError('Enter an hourly rate greater than 0.')
    if (!form.startDate) return setError('Choose a start date.')
    if (form.endDate && form.endDate < form.startDate) {
      return setError('The end date cannot be before the start date.')
    }
    tracker.upsertContract({
      id: editingId ?? newId(),
      platform: platform.slice(0, 80),
      project: project.slice(0, 120),
      rate,
      startDate: form.startDate,
      endDate: form.endDate,
      status: form.status,
    })
    resetForm()
  }

  function handleDelete(contract: Contract) {
    const ok = window.confirm(
      `Delete "${contract.project}"? Its logged hours and payments will also be removed.`,
    )
    if (!ok) return
    tracker.deleteContract(contract.id)
    if (editingId === contract.id) resetForm()
  }

  return (
    <Section
      id="contracts"
      title="Contracts"
      description="Every platform and project you train for, with its hourly rate and status."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Platform" htmlFor={`${ids}-platform`}>
            <TextInput
              id={`${ids}-platform`}
              placeholder="e.g. Lumenwork"
              value={form.platform}
              onChange={(e) => update('platform', e.target.value)}
              maxLength={80}
              required
            />
          </Field>
          <Field label="Project name" htmlFor={`${ids}-project`}>
            <TextInput
              id={`${ids}-project`}
              placeholder="e.g. Code Reasoning Review"
              value={form.project}
              onChange={(e) => update('project', e.target.value)}
              maxLength={120}
              required
            />
          </Field>
          <Field label="Hourly rate (USD)" htmlFor={`${ids}-rate`}>
            <TextInput
              id={`${ids}-rate`}
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              placeholder="40"
              value={form.rate}
              onChange={(e) => update('rate', e.target.value)}
              required
            />
          </Field>
          <Field label="Start date" htmlFor={`${ids}-start`}>
            <TextInput
              id={`${ids}-start`}
              type="date"
              value={form.startDate}
              onChange={(e) => update('startDate', e.target.value)}
              required
            />
          </Field>
          <Field label="End date (optional)" htmlFor={`${ids}-end`}>
            <TextInput
              id={`${ids}-end`}
              type="date"
              value={form.endDate}
              min={form.startDate || undefined}
              onChange={(e) => update('endDate', e.target.value)}
            />
          </Field>
          <Field label="Status" htmlFor={`${ids}-status`}>
            <SelectInput
              id={`${ids}-status`}
              value={form.status}
              onChange={(e) => update('status', e.target.value as ContractStatus)}
            >
              {CONTRACT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>
        <FormError message={error} />
        <div className="flex flex-wrap gap-2">
          <Button type="submit" className={primaryButtonClass()}>
            {editingId ? 'Save changes' : 'Add contract'}
          </Button>
          {editingId ? (
            <Button type="button" variant="outline" className="h-10 px-4" onClick={resetForm}>
              Cancel edit
            </Button>
          ) : null}
        </div>
      </form>

      {data.contracts.length === 0 ? (
        <EmptyState>No contracts yet. Add one above or try the sample data.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-2xl text-sm">
            <caption className="sr-only">Your contracts</caption>
            <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-2 font-medium">Project</th>
                <th scope="col" className="px-4 py-2 font-medium">Platform</th>
                <th scope="col" className="px-4 py-2 text-right font-medium">Rate</th>
                <th scope="col" className="px-4 py-2 font-medium">Dates</th>
                <th scope="col" className="px-4 py-2 font-medium">Status</th>
                <th scope="col" className="px-4 py-2"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.contracts.map((contract) => (
                <tr key={contract.id} className={editingId === contract.id ? 'bg-accent/60' : undefined}>
                  <td className="px-4 py-2.5 font-medium">{contract.project}</td>
                  <td className="px-4 py-2.5">{contract.platform}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{formatCurrency(contract.rate)}/hr</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-muted-foreground">
                    {formatDate(contract.startDate)} – {contract.endDate ? formatDate(contract.endDate) : 'Ongoing'}
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={contract.status} className={statusStyles[contract.status]} />
                  </td>
                  <td className="whitespace-nowrap px-2 py-1.5 text-right">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => startEdit(contract)}
                      aria-label={`Edit ${contract.project}`}
                    >
                      <Pencil aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDelete(contract)}
                      aria-label={`Delete ${contract.project}`}
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  )
}
