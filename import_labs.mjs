// import_labs.mjs
// 使い方: node import_labs.mjs data/labs/labs_eng.csv
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

// 引数でCSVパスを受け取る（例: node import_labs.mjs data/labs/labs_eng.csv）
const csvArg = process.argv[2]
if (!csvArg) {
  console.error('❌ CSVファイルを引数で指定してください')
  console.error('例: node import_labs.mjs data/labs/labs_eng.csv')
  process.exit(1)
}

let inserted = 0
let skipped = 0

console.log(`\n📂 処理中: ${csvArg}`)
const raw = readFileSync(join(__dirname, csvArg), 'utf-8')
const rows = parse(raw, { columns: true, skip_empty_lines: true, bom: true })

for (const row of rows) {
  const name = row.name?.trim()
  const faculty_name = row.faculty_name?.trim()
  const lab_url = row.lab_url?.trim()
  const dept = row.dept?.trim()

  if (!name) { console.log('  ⚠️ name空のためスキップ'); skipped++; continue }

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

console.log(`\n完了: ${inserted}件投入 / ${skipped}件スキップ`)