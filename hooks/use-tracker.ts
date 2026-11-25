'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  buildSampleData,
  emptyData,
  type Contract,
  type HoursEntry,
  type Payment,
  type TrackerData,
} from '@/lib/tracker'

const STORAGE_KEY = 'ai-trainer-pay-hours-tracker:v1'

function readStoredData(): TrackerData {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyData
    const parsed = JSON.parse(raw) as Partial<TrackerData>
    return {
      contracts: Array.isArray(parsed.contracts) ? parsed.contracts : [],
      payments: Array.isArray(parsed.payments) ? parsed.payments : [],
      hours: Array.isArray(parsed.hours) ? parsed.hours : [],
      weeklyGoal: typeof parsed.weeklyGoal === 'number' ? parsed.weeklyGoal : 0,
      nextContractId: typeof parsed.nextContractId === 'string' ? parsed.nextContractId : '',
    }
  } catch {
    return emptyData
  }
}

export function useTracker() {
  const [data, setData] = useState<TrackerData>(emptyData)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setData(readStoredData())
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      // Storage can be unavailable (private mode, quota); the app still works in memory.
    }
  }, [data, ready])

  const upsertContract = useCallback((contract: Contract) => {
    setData((prev) => {
      const exists = prev.contracts.some((c) => c.id === contract.id)
      return {
        ...prev,
        contracts: exists
          ? prev.contracts.map((c) => (c.id === contract.id ? contract : c))
          : [...prev.contracts, contract],
        nextContractId: prev.nextContractId || contract.id,
      }
    })
  }, [])

  const deleteContract = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      contracts: prev.contracts.filter((c) => c.id !== id),
      payments: prev.payments.filter((p) => p.contractId !== id),
      hours: prev.hours.filter((h) => h.contractId !== id),
      nextContractId: prev.nextContractId === id ? '' : prev.nextContractId,
    }))
  }, [])

  const upsertPayment = useCallback((payment: Payment) => {
    setData((prev) => {
      const exists = prev.payments.some((p) => p.id === payment.id)
      return {
        ...prev,
        payments: exists
          ? prev.payments.map((p) => (p.id === payment.id ? payment : p))
          : [...prev.payments, payment],
      }
    })
  }, [])

  const deletePayment = useCallback((id: string) => {
    setData((prev) => ({ ...prev, payments: prev.payments.filter((p) => p.id !== id) }))
  }, [])

  const addHours = useCallback((entry: HoursEntry) => {
    setData((prev) => ({ ...prev, hours: [...prev.hours, entry] }))
  }, [])

  const deleteHours = useCallback((id: string) => {
    setData((prev) => ({ ...prev, hours: prev.hours.filter((h) => h.id !== id) }))
  }, [])

  const setWeeklyGoal = useCallback((weeklyGoal: number) => {
    setData((prev) => ({ ...prev, weeklyGoal }))
  }, [])

  const setNextContractId = useCallback((nextContractId: string) => {
    setData((prev) => ({ ...prev, nextContractId }))
  }, [])

  const loadSampleData = useCallback(() => setData(buildSampleData()), [])
  const clearAll = useCallback(() => setData(emptyData), [])

  return {
    data,
    ready,
    upsertContract,
    deleteContract,
    upsertPayment,
    deletePayment,
    addHours,
    deleteHours,
    setWeeklyGoal,
    setNextContractId,
    loadSampleData,
    clearAll,
  }
}

export type TrackerActions = ReturnType<typeof useTracker>
