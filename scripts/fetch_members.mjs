import { createClient } from '@supabase/supabase-js'
import fetch from 'node-fetch'

const SUPABASE_URL = 'https://vyatwmsakptuyhnxlniv.supabase.co'
const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

async function searchResearchmap(name) {
  try {
    const url = `https://researchmap.jp/api/researchers?name=${encodeURIComponent(name)}&limit=1`
    const res = await fetch(url)
    const json = await res.json()
    console.log(`  [researchmap raw] ${name}:`, JSON.stringify(json).slice(0, 200))
    const hit = json.items?.[0]
    if (!hit) return null
    return `https://researchmap.jp/${hit.rid}`
  } catch (e) { console.error(`  [researchmap error] ${name}:`, e.message); return null }
}

async function searchTohokuDB(name) {
  try {
    const url = `https://researchers.tohoku.ac.jp/html/search.html?key=${encodeURIComponent(name)}`
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
    const html = await res.text()
    console.log(`  [東北大DB raw] ${name}: ステータス=${res.status} html冒頭=${html.slice(0, 100)}`)
    const match = html.match(/href="(\/html\/[0-9]+_ja\.html)"/)
    if (!match) return null
    return `https://researchers.tohoku.ac.jp${match[1]}`
  } catch (e) { console.error(`  [東北大DB error] ${name}:`, e.message); return null }
}

async function searchKaken(name) {
  try {
    const url = `https://kaken.nii.ac.jp/search/?qm=${encodeURIComponent(name)}&type=researcher`
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
    const html = await res.text()
    console.log(`  [KAKEN raw] ${name}: ステータス=${res.status} html冒頭=${html.slice(0, 100)}`)
    const match = html.match(/href="(\/researcher\/[0-9]+)"/)
    if (!match) return null
    return `https://kaken.nii.ac.jp${match[1]}`
  } catch (e) { console.error(`  [KAKEN error] ${name}:`, e.message); return null }
}

async function main() {
  const { data: labs } = await supabase
    .from('labs')
    .select('id, name, faculty_name')
    .not('faculty_name', 'is', null)

  console.log(`${labs.length}件の研究室を処理します`)

  // デバッグ用：最初の1件だけ試す
  const testLab = labs[0]
  console.log(`テスト対象: ${testLab.name} / ${testLab.faculty_name}`)
  const members = testLab.faculty_name.split('・').map(n => n.trim()).filter(Boolean)

  for (const memberName of members) {
    console.log(`\n--- ${memberName} ---`)
    const researchmap_url = await searchResearchmap(memberName)
    const tohoku_profile_url = await searchTohokuDB(memberName)
    const kaken_url = await searchKaken(memberName)
    console.log(`結果: researchmap=${researchmap_url} 東北大=${tohoku_profile_url} KAKEN=${kaken_url}`)
  }
}

main()