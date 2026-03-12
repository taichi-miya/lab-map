import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const SUPABASE_URL = 'https://vyatwmsakptuyhnxlniv.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// ============================================================
// モデル設定
// ============================================================
const MODEL = 'gpt-4o'  // mini → 4o に変更

// ============================================================
// System Prompt
// ============================================================
const SYSTEM_PROMPT = `
あなたは大学の研究室Webサイトから得られたテキストを整理する編集者です。
あなたの役割は、研究室を魅力的に紹介することではありません。
公開情報から確認できる研究内容だけを、誠実に抽出・整理して要約することです。

## 絶対に守るルール

### 推測禁止
- 入力に書かれていない内容を推測して書かないこと
- 研究室名・専攻名だけから研究内容を想像して埋めることは禁止
- 一般的な学問分野の説明を足して研究室固有の内容のように書くことは禁止
- 情報が足りないときは「ない」として扱うこと

### 研究内容以外は出力しない
含めてよい情報：何を研究しているか／何を明らかにしようとしているか／どのような課題に取り組んでいるか／どのような手法で調べているか／応用先や意義（明記されている場合のみ）

含めてはいけない情報：学生の活躍・雰囲気・国際交流・教育体制・イベント・進路・就職実績・教員の受賞歴・「最先端」「幅広い」「魅力的」などの広報語・評価語

## 処理ステップ

### Step 1. 研究内容に関する記述だけを抽出
入力テキストから研究内容に関係する部分だけを拾い、それ以外は捨てる。

### Step 2. 4項目に整理
- research_target: 何を研究対象としているか（材料・現象・対象領域・システムなど）
- research_question: 何を明らかにしたいか・どのような課題に取り組んでいるか
- method: どうやって調べるか（実験・数値計算・理論・調査など）
- application_or_significance: 応用先・意義（取れれば使うが、取れなくても不足扱いにしない）

### Step 3. 不足判定
research_target / research_question / method の3項目のみで判定。
missing_fields に該当する項目名を入れる。application_or_significance は不足扱いにしない。

### Step 4. 品質ラベル A/B/C を付ける
- A（十分）: research_target / research_question / method のうち複数が明確に取れている
- B（一部不足）: 研究内容はある程度わかるが不足あり
- C（不足大）: 研究内容として使える具体情報がほとんどない

## bullets の設計
- 1〜3本の可変。常に3本出す必要はない
- 出す順番: ①研究対象・テーマ → ②研究課題または手法 → ③応用・意義
- 情報が取れない役割は以下の定型文を使う:
  - 研究対象・テーマが不明: 「公開情報から研究対象・テーマの詳細は確認できませんでした。」
  - 研究課題・手法が不明: 「公開情報から研究課題や研究手法の詳細は確認できませんでした。」
  - ③は情報がなければ省略してよい（不足扱いにしない）
- 情報が極端に少ない場合は1〜2本でよい

## long の設計
- 研究内容のみを書く。研究室紹介にしない
- 高校生・学部低学年にも読めるよう平易に書く
- A: 400〜550字程度
- B: 短めでよい。確認できた事実だけを書き、不足部分は補わない
- C: かなり短くてよい。研究内容の詳細が十分に確認できなかった旨を含めてもよい
- 水増し禁止。情報のために字数を無理に増やさない

## 出力形式
必ず以下のJSON形式のみで返してください（余分なテキスト・マークダウン・コードフェンス不要）:
{
  "bullets": ["..."],
  "long": "...",
  "quality": "A",
  "missing_fields": [],
  "structured": {
    "research_target": "...",
    "research_question": "...",
    "method": "...",
    "application_or_significance": "..."
  }
}
`.trim()

// ============================================================
// バリデーション（新仕様: bullets可変・quality必須）
// ============================================================
function validate(json) {
  if (!Array.isArray(json.bullets))
    throw new Error('bullets が配列でない')
  if (json.bullets.length === 0)
    throw new Error('bullets が空配列')
  if (json.bullets.length > 3)
    throw new Error('bullets が3本超')
  if (typeof json.long !== 'string' || json.long.trim() === '')
    throw new Error('long がない')
  if (!['A', 'B', 'C'].includes(json.quality))
    throw new Error('quality が A/B/C でない')
  if (!Array.isArray(json.missing_fields))
    throw new Error('missing_fields が配列でない')
  if (typeof json.structured !== 'object' || json.structured === null)
    throw new Error('structured がない')
}

// ============================================================
// summary_clean の組み立て（embedding用）
// structured の主要3項目 + long を結合して意味密度を上げる
// ============================================================
function buildSummaryClean(json) {
  const s = json.structured
  const parts = []
  if (s.research_target)         parts.push(`研究対象: ${s.research_target}`)
  if (s.research_question)       parts.push(`研究課題: ${s.research_question}`)
  if (s.method)                  parts.push(`手法: ${s.method}`)
  if (s.application_or_significance) parts.push(`意義: ${s.application_or_significance}`)
  parts.push(json.long)
  return parts.join('\n')
}

// ============================================================
// メイン処理
// ============================================================
async function main() {
  // コマンドライン引数: --force で summary_generated_at がある行も再処理
  const isForce = process.argv.includes('--force')

  let query = supabase
    .from('labs')
    .select('id, name, dept, faculty_name, summary_text')

  if (!isForce) {
    query = query.is('summary_generated_at', null)
  }

  const { data: labs, error } = await query
  if (error) { console.error(error); process.exit(1) }

  console.log(`${labs.length}件を処理します（モデル: ${MODEL}${isForce ? ' / 強制再実行' : ''}）`)

  let ok = 0, ng = 0

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
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user',   content: userContent }
        ],
        max_tokens: 1200,
        response_format: { type: 'json_object' }
      })

      const raw = res.choices[0].message.content ?? ''
      // コードフェンスが混入した場合に備えてクリーニング
      const cleaned = raw.replace(/```json|```/g, '').trim()
      const json = JSON.parse(cleaned)

      validate(json)

      const summary_clean = buildSummaryClean(json)

      await supabase.from('labs').update({
        summary_bullets:       json.bullets,
        summary_long:          json.long,
        summary_clean,
        summary_quality:       json.quality,        // 新カラム（後述）
        summary_missing:       json.missing_fields, // 新カラム（後述）
        summary_structured:    json.structured,     // 新カラム（後述）
        summary_generated_at:  new Date().toISOString()
      }).eq('id', lab.id)

      const flag = json.quality === 'C' ? ' ⚠️ C判定' : json.missing_fields.length > 0 ? ' △' : ''
      console.log(`✓ [${json.quality}] ${lab.name}${flag}`)
      ok++
    } catch (e) {
      console.error(`✗ ${lab.name}: ${e.message}`)
      ng++
    }

    await new Promise(r => setTimeout(r, 500)) // レート制限対策（4oは少し余裕を持たせる）
  }

  console.log(`\n完了: 成功 ${ok}件 / 失敗 ${ng}件`)
}

main()
