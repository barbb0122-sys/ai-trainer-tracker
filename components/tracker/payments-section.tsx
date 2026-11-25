'use client'

import { useId, useMemo, useState, type FormEvent } from 'react'
import { Check, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { TrackerActions } from '@/hooks/use-tracker'
import {
  PAYMENT_STATUSES,
  contractLabel,
  formatCurrency,
  formatDate,
  newId,
  round2,
  toISODate,
  type Payment,
  type PaymentStatus,
} from '@/lib/tracker'
import { Field, FormError, SelectInput, TextInput, primaryButtonClass } from './fields'
import { EmptyState, Section, Stat } from './section'
import { StatusBadge } from './contracts-section'

interface PaymentForm {
  contractId: string
  amount: string
  date: string
  status: PaymentStatus
  taxPct: string
}

const blankForm = (): PaymentForm => ({
  contractId: '',
  amount: '',
  date: toISODate(new Date()),
  status: 'Expected',
  taxPct: '25',
})

const setAsideFor = (p: Payment) => round2((p.amount * p.taxPct) / 100)

export function PaymentsSection({ tracker }: { tracker: TrackerActions }) {
  const { data } = tracker
  const ids = useId()
  const [form, setForm] = useState<PaymentForm>(blankForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const contractsById = useMemo(
    () => new Map(data.contracts.map((c) => [c.id, c])),
    [data.contracts],
  )

  const selectedContractId = form.contractId || data.contracts[0]?.id || ''

  const sortedPayments = [...data.payments].sort((a, b) =>
    a.date === b.date ? 0 : a.date < b.date ? 1 : -1,
  )

  const received = data.payments.filter((p) => p.status === 'Received')
  const receivedTotal = received.reduce((sum, p) => sum + p.amount, 0)
  const setAsideTotal = received.reduce((sum, p) => sum + setAsideFor(p), 0)
  const expectedTotal = data.payments
    .filter((p) => p.status === 'Expected')
    .reduce((sum, p) => sum + p.amount, 0)

  const update = <K extends keyof PaymentForm>(key: K, value: PaymentForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const previewAmount = Number(form.amount)
  const previewTax = Number(form.taxPct)
  const showPreview =
    Number.isFinite(previewAmount) && previewAmount > 0 && Number.isFinite(previewTax)
  const previewSetAside = showPreview ? round2((previewAmount * previewTax) / 100) : 0

  function resetForm() {
    setForm(blankForm())
    setEditingId(null)
    setError('')
  }

  function startEdit(payment: Payment) {
    setEditingId(payment.id)
    setForm({
      contractId: payment.contractId,
      amount: String(payment.amount),
      date: payment.date,
      status: payment.status,
      taxPct: String(payment.taxPct),
    })
    setError('')
    document.getElementById(`${ids}-project`)?.focus()
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const amount = Number(form.amount)
    const taxPct = Number(form.taxPct)
    if (!selectedContractId) return setError('Add a contract first, then choose it here.')
    if (!Number.isFinite(amount) || amount <= 0) return setError('Enter a payment amount greater than 0.')
    if (!form.date) return setError('Choose a payment date.')
    if (!Number.isFinite(taxPct) || taxPct < 0 || taxPct > 100) {
      return setError('Enter a tax set-aside percentage from 0 to 100.')
    }
    tracker.upsertPayment({
      id: editingId ?? newId(),
      contractId: selectedContractId,
      amount: round2(amount),
      date: form.date,
      status: form.status,
      taxPct,
    })
    resetForm()
  }

  return (
    <Section
      id="payments"
      title="Payments"
      description="Cash that is expected or already received. Set-aside and remaining amounts are shown for received payments."
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat tone="primary" label="Cash received" value={formatCurrency(receivedTotal)} sub={`${received.length} payment${received.length === 1 ? '' : 's'}`} />
        <Stat label="Set aside for taxes" value={formatCurrency(setAsideTotal)} sub="From received payments" />
        <Stat label="Remaining after set-aside" value={formatCurrency(receivedTotal - setAsideTotal)} sub="Yours to spend" />
        <Stat tone="muted" label="Still expected" value={formatCurrency(expectedTotal)} sub="Not yet received" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <Field label="Project" htmlFor={`${ids}-project`} className="sm:col-span-2">
            <SelectInput
              id={`${ids}-project`}
              value={selectedContractId}
              onChange={(e) => update('contractId', e.target.value)}
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
          <Field label="Amount (USD)" htmlFor={`${ids}-amount`}>
            <TextInput
              id={`${ids}-amount`}
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              placeholder="500"
              value={form.amount}
              onChange={(e) => update('amount', e.target.value)}
              required
            />
          </Field>
          <Field label="Date" htmlFor={`${ids}-date`}>
            <TextInput
              id={`${ids}-date`}
              type="date"
              value={form.date}
              onChange={(e) => update('date', e.target.value)}
              required
            />
          </Field>
          <Field label="Status" htmlFor={`${ids}-status`}>
            <SelectInput
              id={`${ids}-status`}
              value={form.status}
              onChange={(e) => update('status', e.target.value as PaymentStatus)}
            >
              {PAYMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Tax set-aside (%)" htmlFor={`${ids}-tax`}>
            <TextInput
              id={`${ids}-tax`}
              type="number"
              inputMode="decimal"
              min={0}
              max={100}
              step="0.5"
              value={form.taxPct}
              onChange={(e) => update('taxPct', e.target.value)}
              required
            />
          </Field>
        </div>
        {showPreview ? (
          <p className="text-sm text-muted-foreground" aria-live="polite">
            Set aside <span className="font-medium text-foreground">{formatCurrency(previewSetAside)}</span>
            {', '}keep{' '}
            <span className="font-medium text-foreground">
              {formatCurrency(round2(previewAmount - previewSetAside))}
            </span>
            {form.status === 'Expected' ? ' once received.' : '.'}
          </p>
        ) : null}
        <FormError message={error} />
        <div className="flex flex-wrap gap-2">
          <Button type="submit" className={primaryButtonClass()} disabled={data.contracts.length === 0}>
            {editingId ? 'Save changes' : 'Log payment'}
          </Button>
          {editingId ? (
            <Button type="button" variant="outline" className="h-10 px-4" onClick={resetForm}>
              Cancel edit
            </Button>
          ) : null}
        </div>
      </form>

      {sortedPayments.length === 0 ? (
        <EmptyState>No payments logged yet.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-3xl text-sm">
            <caption className="sr-only">Payments</caption>
            <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-2 font-medium">Date</th>
                <th scope="col" className="px-4 py-2 font-medium">Project</th>
                <th scope="col" className="px-4 py-2 font-medium">Status</th>
                <th scope="col" className="px-4 py-2 text-right font-medium">Amount</th>
                <th scope="col" className="px-4 py-2 text-right font-medium">Tax %</th>
                <th scope="col" className="px-4 py-2 text-right font-medium">Set aside</th>
                <th scope="col" className="px-4 py-2 text-right font-medium">Remaining</th>
                <th scope="col" className="px-4 py-2"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sortedPayments.map((payment) => {
                const isReceived = payment.status === 'Received'
                const setAside = setAsideFor(payment)
                return (
                  <tr key={payment.id} className={editingId === payment.id ? 'bg-accent/60' : undefined}>
                    <td className="whitespace-nowrap px-4 py-2.5">{formatDate(payment.date)}</td>
                    <td className="px-4 py-2.5">{contractLabel(contractsById.get(payment.contractId))}</td>
                    <td className="px-4 py-2.5">
                      <StatusBadge
                        status={payment.status}
                        className={isReceived ? 'bg-primary/10 text-primary' : 'bg-amber-100 text-amber-900'}
                      />
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium tabular-nums">{formatCurrency(payment.amount)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{payment.taxPct}%</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {isReceived ? formatCurrency(setAside) : <span className="text-muted-foreground" aria-label="Not received yet">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {isReceived ? formatCurrency(round2(payment.amount - setAside)) : <span className="text-muted-foreground" aria-label="Not received yet">—</span>}
                    </td>
                    <td className="whitespace-nowrap px-2 py-1.5 text-right">
                      {!isReceived ? (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => tracker.upsertPayment({ ...payment, status: 'Received' })}
                          aria-label={`Mark ${formatCurrency(payment.amount)} payment as received`}
                          title="Mark as received"
                        >
                          <Check aria-hidden="true" />
                        </Button>
                      ) : null}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => startEdit(payment)}
                        aria-label={`Edit ${formatCurrency(payment.amount)} payment`}
                      >
                        <Pencil aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => {
                          if (editingId === payment.id) resetForm()
                          tracker.deletePayment(payment.id)
                        }}
                        aria-label={`Delete ${formatCurrency(payment.amount)} payment`}
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
    </Section>
  )
}
