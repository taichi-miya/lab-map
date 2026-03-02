'use client'
import { useEffect, useState } from 'react'

const PIN_KEY = 'labmap_pins'

function loadPins(): string[] {
  try { return JSON.parse(localStorage.getItem(PIN_KEY) ?? '[]') } catch { return [] }
}
function savePins(ids: string[]) {
  try { localStorage.setItem(PIN_KEY, JSON.stringify(ids)) } catch {}
}

export default function PinButton({ labId }: { labId: string }) {
  const [pinned, setPinned] = useState(false)
  const [mounted, setMounted] = useState(false) // SSR hydrationのズレ防止

  useEffect(() => {
    setMounted(true)
    setPinned(loadPins().includes(labId))
  }, [labId])

  const toggle = () => {
    const pins = loadPins()
    const next = pins.includes(labId) ? pins.filter(p => p !== labId) : [...pins, labId]
    savePins(next)
    setPinned(!pinned)
  }

  if (!mounted) return null // SSR時は何も描画しない

  return (
    <button
      onClick={toggle}
      title={pinned ? 'ピンを外す' : 'ピン留めする'}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '8px 14px', borderRadius: 10, border: 'none',
        background: pinned ? '#FEF9C3' : '#F3F4F6',
        color: pinned ? '#92400E' : '#6B7280',
        fontSize: 13, fontWeight: 600, cursor: 'pointer',
        transition: 'background 0.15s, transform 0.1s',
        fontFamily: 'inherit',
      }}
      onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
      onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
    >
      <span style={{ fontSize: 16, lineHeight: 1 }}>{pinned ? '⭐' : '☆'}</span>
      {pinned ? 'ピン済み' : 'ピン留め'}
    </button>
  )
}