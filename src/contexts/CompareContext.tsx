'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

const STORAGE_KEY = 'lab-compare-ids'
const MAX_COMPARE = 3

type CompareContextType = {
  compareIds: string[]
  addCompare: (id: string) => void
  removeCompare: (id: string) => void
  toggleCompare: (id: string) => void
  isComparing: (id: string) => boolean
  clearCompare: () => void
  isFull: boolean
}

const CompareContext = createContext<CompareContextType | null>(null)

export function CompareProvider({ children }: { children: ReactNode }) {
  const [compareIds, setCompareIds] = useState<string[]>([])

  // SSR対策：マウント後にlocalStorageから読み込む
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setCompareIds(JSON.parse(stored))
    } catch {
      // localStorageが使えない環境では無視
    }
  }, [])

  // compareIdsが変わるたびにlocalStorageへ保存
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(compareIds))
    } catch {}
  }, [compareIds])

  const addCompare = (id: string) => {
    setCompareIds(prev => {
      if (prev.includes(id)) return prev
      if (prev.length >= MAX_COMPARE) return prev // 最大3件
      return [...prev, id]
    })
  }

  const removeCompare = (id: string) => {
    setCompareIds(prev => prev.filter(i => i !== id))
  }

  const toggleCompare = (id: string) => {
    if (compareIds.includes(id)) {
      removeCompare(id)
    } else {
      addCompare(id)
    }
  }

  const isComparing = (id: string) => compareIds.includes(id)

  const clearCompare = () => setCompareIds([])

  const isFull = compareIds.length >= MAX_COMPARE

  return (
    <CompareContext.Provider value={{
      compareIds, addCompare, removeCompare, toggleCompare,
      isComparing, clearCompare, isFull
    }}>
      {children}
    </CompareContext.Provider>
  )
}

export function useCompare() {
  const ctx = useContext(CompareContext)
  if (!ctx) throw new Error('useCompare must be used within CompareProvider')
  return ctx
}
