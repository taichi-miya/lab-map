'use client'
import { useEffect, useState, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'

const PIN_KEY = 'labmap_pins'

function loadLocal(): string[] {
  try { return JSON.parse(localStorage.getItem(PIN_KEY) ?? '[]') } catch { return [] }
}
function saveLocal(ids: string[]) {
  try { localStorage.setItem(PIN_KEY, JSON.stringify(ids)) } catch {}
}

export function usePins() {
  const { user, isLoaded } = useUser()
  const [pins, setPins] = useState<string[]>([])
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    if (!isLoaded) return

    if (user) {
      setSyncing(true)
      supabase
        .from('user_pins')
        .select('lab_id')
        .eq('clerk_user_id', user.id)
        .then(({ data }) => {
          const dbIds = (data ?? []).map((r: { lab_id: string }) => r.lab_id)
          const local = loadLocal()
          const merged = [...new Set([...dbIds, ...local])]
          if (local.length > 0) {
            const newRows = local
              .filter(id => !dbIds.includes(id))
              .map(id => ({ clerk_user_id: user.id, lab_id: id }))
            if (newRows.length > 0) {
              supabase.from('user_pins').upsert(newRows).then(() => {})
            }
            saveLocal([])
          }
          setPins(merged)
          setSyncing(false)
        })
    } else {
      setPins(loadLocal())
    }
  }, [user, isLoaded])

  const togglePin = useCallback(async (labId: string) => {
    const isPinned = pins.includes(labId)
    const next = isPinned ? pins.filter(id => id !== labId) : [...pins, labId]
    setPins(next)

    if (user) {
      if (isPinned) {
        await supabase.from('user_pins').delete().eq('clerk_user_id', user.id).eq('lab_id', labId)
      } else {
        await supabase.from('user_pins').upsert({ clerk_user_id: user.id, lab_id: labId })
      }
    } else {
      saveLocal(next)
    }
  }, [pins, user])

  const clearPins = useCallback(async () => {
    if (user) {
      await supabase.from('user_pins').delete().eq('clerk_user_id', user.id)
    } else {
      saveLocal([])
    }
    setPins([])
  }, [user])

  return { pins, togglePin, clearPins, syncing }
}
