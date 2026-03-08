import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// 失敗した研究室を取得（YouTube・URLなしは除外）
const SKIP_IDS = [
  'ea1d50b0-0971-43c6-8b40-befc5709e999', // 1番 YouTube
  '57e8c669-4248-447d-85c5-17ab39d613c7', // 12番 YouTube
]

const { data: labs, error } = await supabase
  .from('labs')
  .select('id, name, faculty_name, lab_url, summary_source_url, summary_source_url_override')
  .eq('extract_status', 'failed')
  .order('name')

if (error) { console.error(error); process.exit(1) }

const targets = labs.filter(l => !SKIP_IDS.includes(l.id))
console.log(`対象: ${targets.length}件`)

async function fetchText(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LabNavi/1.0)' },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const html = await res.text()
    // HTMLタグを除去してテキストだけ抽出
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 8000) // トークン節約
  } catch (e) {
    console.warn(`  fetch失敗 ${url}: ${e.message}`)
    return null
  }
}

let success = 0, fail = 0

for (const lab of targets) {
  console.log(`\n処理中: ${lab.name}`)

  // 取得するURLリストを組み立て
  let urls = []
  if (lab.summary_source_url_override) {
    try {
      urls = JSON.parse(lab.summary_source_url_override)
    } catch {
      urls = [lab.summary_source_url]
    }
  } else if (lab.summary_source_url) {
    urls = [lab.summary_source_url]
  } else {
    urls = [lab.lab_url]
  }

  // 各URLからテキスト取得
  const texts = []
  for (const url of urls) {
    console.log(`  取得: ${url}`)
    const text = await fetchText(url)
    if (text) texts.push(`【${url}】\n${text}`)
    await new Promise(r => setTimeout(r, 500))
  }

  if (texts.length === 0) {
    console.error(`  ❌ 全URLの取得に失敗`)
    fail++
    continue
  }

  // GPTで概要生成
  try {
    const prompt = `
以下は東北大学の研究室「${lab.name}」（担当教員: ${lab.faculty_name ?? '不明'}）のウェブページから取得したテキストです。

${texts.join('\n\n---\n\n')}

このテキストをもとに、高校生・学部低学年向けに研究室の研究内容を説明する文章を作成してください。
研究室のウェブサイトに掲載されている実際の研究内容を正確に反映してください。

以下のJSON形式のみで回答してください（他のテキスト・マークダウン不要）:
{
  "summary_text": "研究概要（100〜200文字）",
  "summary_clean": "研究概要（整形済み・100〜200文字）",
  "summary_long": "詳細な研究概要（300〜500文字）",
  "summary_bullets": ["ポイント1（30文字以内）", "ポイント2（30文字以内）", "ポイント3（30文字以内）"]
}
`

    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    })

    const raw = res.choices[0].message.content ?? ''
    const clean = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    const { error: updateError } = await supabase
      .from('labs')
      .update({
        summary_text: parsed.summary_text,
        summary_clean: parsed.summary_clean,
        summary_long: parsed.summary_long,
        summary_bullets: JSON.stringify(parsed.summary_bullets),
        extract_status: 'scraped',
        fetched_at: new Date().toISOString(),
      })
      .eq('id', lab.id)

    if (updateError) throw updateError
    console.log(`  ✅ 完了: ${parsed.summary_text.slice(0, 50)}...`)
    success++

  } catch (e) {
    console.error(`  ❌ GPT/DB失敗: ${e.message}`)
    fail++
  }

  await new Promise(r => setTimeout(r, 1000))
}

console.log(`\n=============================`)
console.log(`完了: 成功${success}件 / 失敗${fail}件`)
console.log(`スキップ（要手動）: ${SKIP_IDS.length}件`)
console.log(`  - 1番: グリーンクロステック（YouTube）`)
console.log(`  - 12番: エネルギーサステナビリティ（YouTube）`)
