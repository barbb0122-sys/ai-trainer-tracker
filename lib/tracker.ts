export type ContractStatus = 'Active' | 'Paused' | 'Completed'
export type PaymentStatus = 'Expected' | 'Received'

export const CONTRACT_STATUSES: ContractStatus[] = ['Active', 'Paused', 'Completed']
export const PAYMENT_STATUSES: PaymentStatus[] = ['Expected', 'Received']

export interface Contract {
  id: string
  platform: string
  project: string
  rate: number
  startDate: string
  endDate: string
  status: ContractStatus
}

export interface Payment {
  id: string
  contractId: string
  amount: number
  date: string
  status: PaymentStatus
  taxPct: number
}

export interface HoursEntry {
  id: string
  contractId: string
  date: string
  hours: number
}

export interface TrackerData {
  contracts: Contract[]
  payments: Payment[]
  hours: HoursEntry[]
  weeklyGoal: number
  nextContractId: string
}

export const emptyData: TrackerData = {
  contracts: [],
  payments: [],
  hours: [],
  weeklyGoal: 0,
  nextContractId: '',
}

export function newId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function toISODate(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseISODate(value: string) {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

export function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export function startOfWeek(date: Date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  return addDays(d, diff)
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

export function formatCurrency(value: number) {
  return currencyFormatter.format(Number.isFinite(value) ? value : 0)
}

export function formatDate(value: string, options?: Intl.DateTimeFormatOptions) {
  if (!value) return ''
  return parseISODate(value).toLocaleDateString(
    'en-US',
    options ?? { month: 'short', day: 'numeric', year: 'numeric' },
  )
}

export function round2(value: number) {
  return Math.round(value * 100) / 100
}

export function contractLabel(contract: Contract | undefined) {
  if (!contract) return 'Deleted project'
  return `${contract.project} · ${contract.platform}`
}

export function buildSampleData(): TrackerData {
  const today = new Date()
  const monday = startOfWeek(today)
  const day = (offset: number) => toISODate(addDays(monday, offset))
  const relative = (offset: number) => toISODate(addDays(today, offset))

  const contracts: Contract[] = [
    {
      id: newId(),
      platform: 'Lumenwork',
      project: 'Code Reasoning Review',
      rate: 48,
      startDate: relative(-60),
      endDate: '',
      status: 'Active',
    },
    {
      id: newId(),
      platform: 'Quillset AI',
      project: 'Creative Writing Feedback',
      rate: 32,
      startDate: relative(-35),
      endDate: relative(55),
      status: 'Active',
    },
    {
      id: newId(),
      platform: 'Harborline Data',
      project: 'Medical Q&A Evaluation',
      rate: 55,
      startDate: relative(-20),
      endDate: '',
      status: 'Paused',
    },
    {
      id: newId(),
      platform: 'Brightfield Labs',
      project: 'Image Caption Rating',
      rate: 24,
      startDate: relative(-120),
      endDate: relative(-40),
      status: 'Completed',
    },
  ]

  const [code, writing, medical, captions] = contracts

  const hours: HoursEntry[] = [
    { id: newId(), contractId: code.id, date: day(0), hours: 3.5 },
    { id: newId(), contractId: writing.id, date: day(0), hours: 2 },
    { id: newId(), contractId: code.id, date: day(1), hours: 4 },
    { id: newId(), contractId: medical.id, date: day(2), hours: 1.5 },
    { id: newId(), contractId: writing.id, date: day(2), hours: 3 },
    { id: newId(), contractId: code.id, date: toISODate(addDays(monday, -5)), hours: 5 },
    { id: newId(), contractId: writing.id, date: toISODate(addDays(monday, -4)), hours: 4 },
  ]

  const payments: Payment[] = [
    { id: newId(), contractId: captions.id, amount: 612, date: relative(-45), status: 'Received', taxPct: 25 },
    { id: newId(), contractId: code.id, amount: 1440, date: relative(-14), status: 'Received', taxPct: 28 },
    { id: newId(), contractId: writing.id, amount: 704, date: relative(-7), status: 'Received', taxPct: 25 },
    { id: newId(), contractId: code.id, amount: 960, date: relative(3), status: 'Expected', taxPct: 28 },
    { id: newId(), contractId: medical.id, amount: 412.5, date: relative(9), status: 'Expected', taxPct: 30 },
  ]

  return {
    contracts,
    payments,
    hours,
    weeklyGoal: 1500,
    nextContractId: code.id,
  }
}
