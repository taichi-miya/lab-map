// import_labs.mjs
// 使い方: node import_labs.mjs
// .env.localから NEXT_PUBLIC_SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY を読む

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { parse } from 'csv-parse/sync'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const CSV_FILES = [
  'labs_Mate_kinzoku.csv',
  'labs_Mate_zairyo.csv',
  'labs_Mate_chinou.csv',
]

let inserted = 0
let skipped = 0

for (const file of CSV_FILES) {
  console.log(`\n📂 処理中: ${file}`)
  const raw = readFileSync(join(__dirname, file), 'utf-8')
  const rows = parse(raw, { columns: true, skip_empty_lines: true, bom: true })

  for (const row of rows) {
    const name = row.name?.trim()
    const faculty_name = row.faculty_name?.trim()
    const lab_url = row.lab_url?.trim()
    const dept = row.dept?.trim()

    if (!name) { console.log('  ⚠️ name空のためスキップ'); skipped++; continue }

    // 既存チェック
    const { data: existing } = await supabase
      .from('labs')
      .select('id')
      .eq('name', name)
      .single()

    if (existing) {
      console.log(`  ⏭️ スキップ（既存）: ${name}`)
      skipped++
      continue
    }

    const { error } = await supabase.from('labs').insert({
      name,
      faculty_name,
      lab_url,
      dept,
      university: '東北大学',
      faculty: '工学研究科',
      extract_status: 'pending',
    })

    if (error) {
      console.error(`  ❌ エラー: ${name}`, error.message)
      skipped++
    } else {
      console.log(`  ✅ 投入: ${name}`)
      inserted++
    }
  }
}

console.log(`\n完了: ${inserted}件投入 / ${skipped}件スキップ`)
