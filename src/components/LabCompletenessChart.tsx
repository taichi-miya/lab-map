'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Lab = {
  id: string; name: string; dept: string; faculty_name: string | null
  summary_text: string | null; lab_url: string | null
  instagram_url: string | null; twitter_url: string | null
  youtube_channel_url: string | null; intro_url: string | null
  student_count: number | null
  student_count_doc: number | null
  student_count_master: number | null
  student_count_under: number | null
}
type Faculty = {
  id: string; lab_id: string; name: string
  researchmap_id: string | null; twitter_url: string | null; instagram_url: string | null
}
type Crumb = { label: string; dept: string }

// 分母に含める必須項目
const LAB_REQUIRED: { key: keyof Lab; label: string }[] = [
  { key: 'summary_text', label: '研究概要テキスト' },
  { key: 'lab_url',      label: '公式HP URL'       },
]
const FAC_REQUIRED: { key: keyof Faculty; label: string }[] = [
  { key: 'researchmap_id', label: 'researchmap（教員）' },
]

// 分母に含めないがあれば分子に加算するボーナス項目
const LAB_BONUS: { key: keyof Lab; label: string }[] = [
  { key: 'instagram_url',       label: '公式Instagram'    },
  { key: 'twitter_url',         label: '公式X'            },
  { key: 'youtube_channel_url', label: 'YouTubeチャンネル' },
  { key: 'intro_url',           label: '紹介ページURL'     },
  { key: 'student_count',       label: '学生数（全体）'    },
  { key: 'student_count_doc',    label: '学生数（博士）'   },
  { key: 'student_count_master', label: '学生数（修士）'   },
  { key: 'student_count_under',  label: '学生数（学部）'   },
]
const FAC_BONUS: { key: keyof Faculty; label: string }[] = [
  { key: 'twitter_url',   label: 'X（教員）'         },
  { key: 'instagram_url', label: 'Instagram（教員）' },
]

// tooltip表示用
const LAB_FIELDS = [...LAB_REQUIRED, ...LAB_BONUS]
const FAC_FIELDS = [...FAC_REQUIRED, ...FAC_BONUS]

function calcFilled(lab: Lab): number {
  return LAB_FIELDS.filter(f => {
    const v = lab[f.key]
    return v !== null && v !== undefined && String(v) !== ''
  }).length
}
function calcFacFilled(facs: Faculty[]): number {
  let n = 0
  for (const f of FAC_FIELDS)
    n += facs.filter(fc => fc[f.key] !== null && fc[f.key] !== undefined && String(fc[f.key]) !== '').length
  return n
}

// 分母は必須項目のみ・分子はボーナス込み → 100%超えあり
function labScore(lab: Lab, facs: Faculty[]): { filled: number; slots: number; pct: number } {
  const filled = calcFilled(lab) + calcFacFilled(facs)
  const slots  = LAB_REQUIRED.length + facs.length * FAC_REQUIRED.length
  const pct    = slots === 0 ? 0 : Math.round(filled / slots * 1000) / 10
  return { filled, slots, pct }
}

function deptScore(dLabs: Lab[], faculties: Faculty[]): { filled: number; slots: number; pct: number } {
  let filled = 0, slots = 0
  for (const lab of dLabs) {
    const facs = faculties.filter(f => f.lab_id === lab.id)
    filled += calcFilled(lab) + calcFacFilled(facs)
    slots  += LAB_REQUIRED.length + facs.length * FAC_REQUIRED.length
  }
  const pct = slots === 0 ? 0 : Math.round(filled / slots * 1000) / 10
  return { filled, slots, pct }
}

// ── 変更点：必須・推奨を分けて返す ──────────────────────────────────────────
type DetailItem = { label: string; required: boolean }

function calcDetail(lab: Lab, facs: Faculty[]): {
  missingRequired: DetailItem[]
  missingBonus:    DetailItem[]
  present:         DetailItem[]
} {
  const missingRequired: DetailItem[] = []
  const missingBonus:    DetailItem[] = []
  const present:         DetailItem[] = []

  // ラボ必須
  for (const f of LAB_REQUIRED) {
    const v = lab[f.key]
    if (v !== null && v !== undefined && String(v) !== '') present.push({ label: f.label, required: true })
    else missingRequired.push({ label: f.label, required: true })
  }
  // ラボボーナス
  for (const f of LAB_BONUS) {
    const v = lab[f.key]
    if (v !== null && v !== undefined && String(v) !== '') present.push({ label: f.label, required: false })
    else missingBonus.push({ label: f.label, required: false })
  }
  // 教員必須
  for (const f of FAC_REQUIRED) {
    const filled = facs.filter(fc => fc[f.key] !== null && fc[f.key] !== undefined && String(fc[f.key]) !== '').length
    const total  = facs.length
    if (total === 0) { missingRequired.push({ label: `${f.label}（教員なし）`, required: true }); continue }
    if (filled === 0)        missingRequired.push({ label: `${f.label} (0/${total}名)`,              required: true })
    else if (filled < total) missingRequired.push({ label: `${f.label} (${filled}/${total}名・一部)`, required: true })
    else                     present.push({ label: `${f.label} (${filled}/${total}名)`,              required: true })
  }
  // 教員ボーナス
  for (const f of FAC_BONUS) {
    const filled = facs.filter(fc => fc[f.key] !== null && fc[f.key] !== undefined && String(fc[f.key]) !== '').length
    const total  = facs.length
    if (total === 0) continue
    if (filled === 0)        missingBonus.push({ label: `${f.label} (0/${total}名)`,               required: false })
    else if (filled < total) missingBonus.push({ label: `${f.label} (${filled}/${total}名・一部)`, required: false })
    else                     present.push({ label: `${f.label} (${filled}/${total}名)`,            required: false })
  }

  return { missingRequired, missingBonus, present }
}
// ─────────────────────────────────────────────────────────────────────────────

function barColor(pct: number) {
  if (pct >= 100) return '#7C3AED'
  if (pct >= 60)  return '#10B981'
  if (pct >= 30)  return '#06B6D4'
  return '#5046E5'
}

function Bar({ pct, delay }: { pct: number; delay: number }) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setWidth(Math.min(pct, 100)), delay)
    return () => clearTimeout(t)
  }, [pct, delay])
  return (
    <div style={{ flex: 1, height: 16, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
      <div style={{ height: '100%', borderRadius: 4, background: barColor(pct), width: `${width}%`, transition: 'width 0.55s cubic-bezier(0.4,0,0.2,1)' }} />
    </div>
  )
}

// ── 変更点：LabTooltip を必須・推奨カラー分けに刷新 ────────────────────────
function LabTooltip({ lab, facs, score }: { lab: Lab; facs: Faculty[]; score: { filled: number; slots: number; pct: number } }) {
  const { missingRequired, missingBonus, present } = calcDetail(lab, facs)

  // ドット＋テキストの1行コンポーネント
  const Row = ({ label, dot }: { label: string; dot: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '2px 0' }}>
      <div style={{ width: 5, height: 5, borderRadius: '50%', background: dot, flexShrink: 0 }} />
      <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 10 }}>{label}</span>
    </div>
  )

  return (
    <div style={{
      position: 'absolute', left: 162, top: '50%', transform: 'translateY(-50%)',
      background: '#1e293b', color: '#fff', borderRadius: 10,
      padding: '10px 12px', fontSize: 10, zIndex: 200, width: 230,
      pointerEvents: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
    }}>
      {/* 吹き出し矢印 */}
      <div style={{ position: 'absolute', left: -5, top: '50%', transform: 'translateY(-50%)', width: 0, height: 0, borderTop: '5px solid transparent', borderBottom: '5px solid transparent', borderRight: '5px solid #1e293b' }} />

      {/* タイトル */}
      <p style={{ fontWeight: 700, fontSize: 11, margin: '0 0 4px', lineHeight: 1.4 }}>{lab.name}</p>
      <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', margin: '0 0 8px' }}>
        {score.filled} / {score.slots} 必須項目（SNS等はボーナス）
      </p>

      {/* 未入力・必須 */}
      {missingRequired.length > 0 && (
        <>
          <p style={{ margin: '0 0 3px', fontSize: 9, fontWeight: 700, color: '#f87171', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 10 }}>✕</span> 未入力・必須
          </p>
          {missingRequired.map(item => <Row key={item.label} label={item.label} dot="#f87171" />)}
        </>
      )}

      {/* 未入力・推奨（ボーナス） */}
      {missingBonus.length > 0 && (
        <>
          <p style={{ margin: `${missingRequired.length > 0 ? 7 : 0}px 0 3px`, fontSize: 9, fontWeight: 700, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 10 }}>△</span> 未入力・推奨
          </p>
          {missingBonus.map(item => <Row key={item.label} label={item.label} dot="#fbbf24" />)}
        </>
      )}

      {/* 入力済み */}
      {present.length > 0 && (
        <>
          <p style={{ margin: `${(missingRequired.length > 0 || missingBonus.length > 0) ? 7 : 0}px 0 3px`, fontSize: 9, fontWeight: 700, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 10 }}>✓</span> 入力済み
          </p>
          {present.map(item => (
            <Row key={item.label} label={item.label} dot={item.required ? '#4ade80' : '#86efac'} />
          ))}
        </>
      )}
    </div>
  )
}
// ─────────────────────────────────────────────────────────────────────────────

export default function LabCompletenessChart() {
  const [labs,      setLabs]      = useState<Lab[]>([])
  const [faculties, setFaculties] = useState<Faculty[]>([])
  const [stack,     setStack]     = useState<Crumb[]>([])
  const [loading,   setLoading]   = useState(true)
  const [hoverId,   setHoverId]   = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      sb.from('labs').select('id,name,dept,faculty_name,summary_text,lab_url,instagram_url,twitter_url,youtube_channel_url,intro_url,student_count,student_count_doc,student_count_master,student_count_under').not('dept', 'is', null),
      sb.from('faculties').select('id,lab_id,name,researchmap_id,twitter_url,instagram_url'),
    ]).then(([lr, fr]) => {
      if (lr.data) setLabs(lr.data)
      if (fr.data) setFaculties(fr.data)
      setLoading(false)
    })
  }, [])

  const goRoot  = () => { setStack([]);                                   setHoverId(null) }
  const goStack = (i: number) => { setStack(s => s.slice(0, i + 1));     setHoverId(null) }
  const goDept  = (dept: string) => { setStack([{ label: dept, dept }]); setHoverId(null) }

  const currentDept = stack.length > 0 ? stack[stack.length - 1].dept : null

  const rows = (() => {
    if (!currentDept) {
      const depts = [...new Set(labs.map(l => l.dept))].sort()
      return depts.map(dept => {
        const dLabs = labs.filter(l => l.dept === dept)
        const { filled, slots, pct } = deptScore(dLabs, faculties)
        return {
          id: dept, label: dept,
          sub: `${dLabs.length}研究室`,
          subDetail: `${filled}/${slots}必須`,
          pct, isDept: true, lab: null as Lab | null, facs: [] as Faculty[],
          score: { filled, slots, pct },
        }
      }).sort((a, b) => b.pct - a.pct)
    } else {
      return labs
        .filter(l => l.dept === currentDept)
        .map(lab => {
          const facs  = faculties.filter(f => f.lab_id === lab.id)
          const score = labScore(lab, facs)
          return {
            id: lab.id, label: lab.name,
            sub: lab.faculty_name ?? '',
            subDetail: `${score.filled}/${score.slots}必須`,
            pct: score.pct, isDept: false, lab, facs, score,
          }
        })
        .sort((a, b) => b.pct - a.pct)
    }
  })()

  const f = "'Noto Sans JP','Hiragino Sans',system-ui,sans-serif"

  return (
    <div style={{ background: '#fff', border: '1px solid rgba(148,163,184,0.22)', borderRadius: 20, overflow: 'hidden', fontFamily: f }}>

      {/* ヘッダー */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#fafcff', borderBottom: '1px solid rgba(148,163,184,0.15)', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#64748b', flexWrap: 'wrap' }}>
          <span style={{ cursor: 'pointer', color: '#5046E5', fontWeight: 700 }} onClick={goRoot}>全専攻</span>
          {stack.map((s, i) => (
            <span key={i} style={{ display: 'contents' }}>
              <span style={{ color: '#cbd5e1' }}>›</span>
              {i < stack.length - 1
                ? <span style={{ cursor: 'pointer', color: '#5046E5', fontWeight: 700 }} onClick={() => goStack(i)}>{s.label}</span>
                : <span style={{ color: '#334155', fontWeight: 700 }}>{s.label}</span>
              }
            </span>
          ))}
        </div>
        <Link href="/contribute" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 13px', background: '#5046E5', color: 'white', borderRadius: 999, fontSize: 11, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
          📬 情報を提供する
        </Link>
      </div>

      {/* 凡例 */}
      <div style={{ display: 'flex', gap: 8, padding: '8px 16px', borderBottom: '1px solid rgba(148,163,184,0.08)', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ fontSize: 10, color: '#64748b' }}>
          充実度 = 全項目数 ÷ 必須項目数（研究概要・HP・researchmap）。SNS等は100%超えに貢献。
        </div>
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', alignItems: 'center' }}>
          {[
            { color: '#5046E5', label: '〜30%' },
            { color: '#06B6D4', label: '30〜60%' },
            { color: '#10B981', label: '60〜100%' },
            { color: '#7C3AED', label: '100%超' },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 9, color: '#94a3b8' }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
              {label}
            </div>
          ))}
        </div>
        {/* ── 変更点：凡例にも必須・推奨の凡例を追加 ── */}
        <div style={{ display: 'flex', gap: 10, width: '100%', alignItems: 'center', marginTop: 2 }}>
          <span style={{ fontSize: 10, color: '#94a3b8' }}>ポップアップ：</span>
          {[
            { color: '#f87171', mark: '✕', label: '未入力・必須' },
            { color: '#fbbf24', mark: '△', label: '未入力・推奨' },
            { color: '#4ade80', mark: '✓', label: '入力済み'     },
          ].map(({ color, mark, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: '#94a3b8' }}>
              <span style={{ color, fontWeight: 700, fontSize: 10 }}>{mark}</span>
              <span>{label}</span>
            </div>
          ))}
          <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
            {currentDept ? '研究室にホバーで詳細 💬' : 'クリックで展開 ›'}
          </span>
        </div>
      </div>

      {/* チャート */}
      <div style={{ padding: '10px 14px 14px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: 13 }}>読み込み中...</div>
        ) : rows.map((row, i) => (
          <div key={row.id} style={{ position: 'relative', marginBottom: 5 }}>
            <div
              onClick={() => row.isDept ? goDept(row.label) : undefined}
              onMouseEnter={() => !row.isDept ? setHoverId(row.id) : undefined}
              onMouseLeave={() => setHoverId(null)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 6px', borderRadius: 8, cursor: row.isDept ? 'pointer' : 'default', transition: 'background 0.1s', background: hoverId === row.id ? '#f8faff' : 'transparent' }}
            >
              <div style={{ width: 150, flexShrink: 0 }}>
                <div
                  style={{ fontSize: 11, color: row.isDept ? '#334155' : '#5046E5', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: row.isDept ? 600 : 500, cursor: 'pointer', textDecoration: row.isDept ? 'none' : 'underline' }}
                  onClick={e => { if (!row.isDept) { e.stopPropagation(); window.location.href = `/lab/${row.id}` } }}
                >
                  {row.label}
                </div>
                <div style={{ fontSize: 9, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {row.isDept ? `${row.sub} · ${row.subDetail}` : row.subDetail}
                </div>
              </div>
              <Bar pct={row.pct} delay={40 + i * 25} />
              <div style={{ width: 42, fontSize: 10, color: row.pct >= 100 ? '#7C3AED' : '#94a3b8', textAlign: 'right', flexShrink: 0, fontWeight: row.pct >= 100 ? 700 : 600 }}>
                {row.pct}%
              </div>
              <div style={{ width: 12, fontSize: 10, color: '#cbd5e1', flexShrink: 0 }}>{row.isDept ? '›' : '💬'}</div>
            </div>
            {!row.isDept && hoverId === row.id && row.lab && (
              <LabTooltip lab={row.lab} facs={row.facs} score={row.score} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}