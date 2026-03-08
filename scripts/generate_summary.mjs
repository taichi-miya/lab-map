import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const SUPABASE_URL = 'https://vyatwmsakptuyhnxlniv.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const SYSTEM_PROMPT = `あなたは大学の研究室を高校生・学部低学年に紹介するライターです。
与えられた情報（研究室名・専攻・教員名・研究概要テキスト）をもとに、以下のJSONを返してください。
研究概要テキストがない場合は研究室名と専攻名から推測して生成してください。

必ず以下のJSON形式のみで返してください（余分なテキスト・マークダウン不要）:
{
  "bullets": ["研究の特徴や面白さ1文", "研究の特徴や面白さ1文", "研究の特徴や面白さ1文"],
  "long": "高校生にもわかる500字程度の研究紹介文。専門用語には簡単な説明を添えて。"
}

bullets は各1〜2文、合計で150字程度。longは400〜550字を目安。`

async function main() {
  const { data: labs, error } = await supabase
    .from('labs')
    .select('id, name, dept, faculty_name, summary_text')
    .is('summary_generated_at', null)  // 未処理のみ（再実行しても安全）

  if (error) { console.error(error); process.exit(1) }
  console.log(`${labs.length}件を処理します`)

  for (const lab of labs) {
    const userContent = `
研究室名: ${lab.name}
専攻: ${lab.dept ?? '不明'}
教員名: ${lab.faculty_name ?? '不明'}
研究概要テキスト:
${lab.summary_text ?? '（情報なし）'}
`.trim()

    try {
      const res = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userContent }
        ],
        max_tokens: 800,
        response_format: { type: 'json_object' }
      })

      const json = JSON.parse(res.choices[0].message.content)

      // バリデーション
      if (!Array.isArray(json.bullets) || json.bullets.length !== 3 || !json.long) {
        throw new Error('JSONの形式が不正: ' + JSON.stringify(json))
      }

      // summary_clean = bullets + long を結合したもの（embedding用）
      const summary_clean = json.bullets.join('\n') + '\n' + json.long

      await supabase.from('labs').update({
        summary_bullets: json.bullets,
        summary_long: json.long,
        summary_clean,
        summary_generated_at: new Date().toISOString()
      }).eq('id', lab.id)

      console.log(`✓ ${lab.name}`)
    } catch (e) {
      console.error(`✗ ${lab.name}: ${e.message}`)
    }

    await new Promise(r => setTimeout(r, 300)) // レート制限対策
  }

  console.log('完了！')
}

main()