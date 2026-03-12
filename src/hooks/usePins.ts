'use client'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { useUser, useAuth } from '@clerk/nextjs'
import { createClient } from '@supabase/supabase-js'

const PIN_KEY = 'labmap_pins'

function loadLocal(): string[] {
  try { return JSON.parse(localStorage.getItem(PIN_KEY) ?? '[]') } catch { return [] }
}
function saveLocal(ids: string[]) {
  try { localStorage.setItem(PIN_KEY, JSON.stringify(ids)) } catch {}
}

export function usePins() {
  const { user, isLoaded } = useUser()
  const { getToken } = useAuth()
  const [pins, setPins] = useState<string[]>([])
  const [syncing, setSyncing] = useState(false)

  const supabase = useMemo(() => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: async (url, options = {}) => {
          const token = await getToken({ template: 'supabase' })
          const headers = new Headers(options?.headers)
          if (token) headers.set('Authorization', `Bearer ${token}`)
          return fetch(url, { ...options, headers })
        },
      },
    }
  ), [getToken])

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
  }, [user, isLoaded, supabase])

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
  }, [pins, user, supabase])

  const clearPins = useCallback(async () => {
    if (user) {
      await supabase.from('user_pins').delete().eq('clerk_user_id', user.id)
    } else {
      saveLocal([])
    }
    setPins([])
  }, [user, supabase])

  return { pins, togglePin, clearPins, syncing }
}