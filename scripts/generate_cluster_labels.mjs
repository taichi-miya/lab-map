import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  'https://vyatwmsakptuyhnxlniv.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ============================================================
// 全研究室のクラスタ情報を取得
// ============================================================
const { data: labs, error } = await supabase
  .from('labs')
  .select('id, name, cluster_id, summary_structured')
  .not('cluster_id', 'is', null)

if (error) { console.error(error); process.exit(1) }

// クラスタIDごとに研究室をグループ化
const clusterMap = {}
for (const lab of labs) {
  const cid = lab.cluster_id
  if (!clusterMap[cid]) clusterMap[cid] = []
  clusterMap[cid].push(lab)
}

const clusterIds = Object.keys(clusterMap).map(Number).sort((a, b) => a - b)
console.log(`クラスタ数: ${clusterIds.length}`)
console.log(`件数内訳: ${clusterIds.map(i => `[${i}]${clusterMap[i].length}件`).join(' ')}`)

// ============================================================
// 各クラスタのサマリーを組み立て（プロンプト用）
// ============================================================
function buildClusterSummary(cid) {
  const labs = clusterMap[cid]
  const items = labs.map(lab => {
    const s = lab.summary_structured ?? {}
    const parts = []
    if (s.research_target)   parts.push(`対象: ${s.research_target}`)
    if (s.research_question) parts.push(`課題: ${s.research_question}`)
    if (s.method)            parts.push(`手法: ${s.method}`)
    return `・${lab.name}\n  ${parts.join(' / ') || '（情報不足）'}`
  }).join('\n')
  return `【クラスタ${cid}】（${labs.length}件）\n${items}`
}

const allClusterText = clusterIds.map(buildClusterSummary).join('\n\n')

// ============================================================
// System Prompt
// ============================================================
const SYSTEM_PROMPT = `
あなたは大学の研究室群に対して、学術的に正確かつ高校生にも伝わるクラスタ名をつける専門家です。

## 入力
複数のクラスタが与えられます。各クラスタには複数の研究室が含まれており、それぞれの研究対象・課題・手法が示されています。

## あなたの仕事
全クラスタを俯瞰したうえで、各クラスタに「ラベル（名前）」と「説明文」をつけてください。

## 命名ルール
- **他のクラスタと被らない**名前にすること。全クラスタを比較して、それぞれの固有性を際立たせる
- **学問の対象・目的・アプローチの軸**で名付けること（例:「何を・どうする研究か」）
- **10〜20字以内**の簡潔な名前
- 「〜工学」「〜科学」で終わる無難な名前は避ける。研究の本質が伝わる名前にする
- 高校生が見て「なんとなくどんな研究室か」想像できる粒度にする
- 情報不足の研究室が混じっていても、多数派の傾向から判断してよい

## 説明文ルール
- **50〜80字**で、このクラスタならではの特徴・他との違いを書く
- 「〜を研究する研究室群」で終わる定型文は避ける
- 具体的な研究対象や手法のキーワードを入れる

## 出力形式
必ず以下のJSON形式のみで返してください（余分なテキスト・マークダウン不要）:
{
  "clusters": [
    {
      "cluster_id": 0,
      "label": "クラスタ名（10〜20字）",
      "description": "説明文（50〜80字）"
    }
  ]
}
`.trim()

// ============================================================
// GPT-4o に一括で命名させる
// ============================================================
console.log('\nGPT-4oにクラスタ名を生成させています...')

const res = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user',   content: allClusterText }
  ],
  max_tokens: 2000,
  response_format: { type: 'json_object' }
})

const raw = res.choices[0].message.content ?? ''
const cleaned = raw.replace(/```json|```/g, '').trim()
const json = JSON.parse(cleaned)

if (!Array.isArray(json.clusters)) {
  console.error('形式エラー:', raw)
  process.exit(1)
}

// ============================================================
// 結果を表示
// ============================================================
console.log('\n=== 生成されたクラスタ名 ===')
for (const c of json.clusters) {
  console.log(`[${c.cluster_id}] ${c.label}`)
  console.log(`     ${c.description}`)
}

// ============================================================
// DBに保存（全件delete→insert で冪等化）
// upsertではなくdelete→insertにすることで、
// embed_umap.pyでk値が変わった際に古いクラスタが残らない。
// ============================================================
console.log('\nDBに保存中（delete→insert）...')

const { error: delErr } = await supabase
  .from('cluster_labels')
  .delete()
  .gte('cluster_id', 0)

if (delErr) { console.error('削除失敗:', delErr); process.exit(1) }

const { error: insErr } = await supabase
  .from('cluster_labels')
  .insert(json.clusters.map(c => ({
    cluster_id:  c.cluster_id,
    label:       c.label,
    description: c.description,
    updated_at:  new Date().toISOString(),
  })))

if (insErr) { console.error('挿入失敗:', insErr); process.exit(1) }

console.log('完了！')
console.log('\n⚠️  運用ルール: embed_umap.py を実行したら必ずこのスクリプトも再実行すること。')
