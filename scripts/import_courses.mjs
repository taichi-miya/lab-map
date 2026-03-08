import { createClient } from '@supabase/supabase-js'
import { parse } from 'csv-parse/sync'
import { readFileSync } from 'fs'

const SUPABASE_URL = "https://vyatwmsakptuyhnxlniv.supabase.co"
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5YXR3bXNha3B0dXlobnhsbml2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjMxODgxOCwiZXhwIjoyMDg3ODk0ODE4fQ.CFlrk2PMMnmV8sTVzi01PcYOEx6F7EMLzEkkioEpzIQ"
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const csv = readFileSync('data/labs/course_map.csv', 'utf8')
const rows = parse(csv, { columns: true, skip_empty_lines: true })

// 専攻名 → lab_idのマップを取得
const { data: labs } = await supabase.from('labs').select('id, dept')
const deptToIds = {}
for (const lab of labs) {
  if (!lab.dept) continue
  if (!deptToIds[lab.dept]) deptToIds[lab.dept] = []
  deptToIds[lab.dept].push(lab.id)
}

const records = []
for (const row of rows) {
  const depts = row.grad_dept.split(';').map(d => d.trim())
  for (const dept of depts) {
    const labIds = deptToIds[dept]
    if (!labIds) {
      console.warn(`専攻が見つかりません: ${dept}`)
      continue
    }
    for (const lab_id of labIds) {
      records.push({
        lab_id,
        undergraduate_dept: row.undergraduate_dept,
        course: row.course,
      })
    }
  }
}

console.log(`投入件数: ${records.length}`)

// バッチ投入（100件ずつ）
for (let i = 0; i < records.length; i += 100) {
  const { error } = await supabase.from('lab_courses').insert(records.slice(i, i + 100))
  if (error) console.error(error)
  else console.log(`${i + 100} 件完了`)
}

console.log('完了')