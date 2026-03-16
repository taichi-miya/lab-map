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
}
type Faculty = {
  id: string; lab_id: string; name: string; role: string | null
  researchmap_id: string | null; twitter_url: string | null; instagram_url: string | null
}
type Tab = 'lab' | 'fac'
type Crumb = { label: string; dept: string }

const LAB_ITEMS = [
  { key: 'summary_text',        label: '研究概要テキスト',  pts: 30, color: '#5046E5' },
  { key: 'lab_url',             label: '公式HP URL',       pts: 20, color: '#06B6D4' },
  { key: 'instagram_url',       label: '公式Instagram',    pts: 10, color: '#10B981' },
  { key: 'twitter_url',         label: '公式X',            pts: 10, color: '#10B981' },
  { key: 'youtube_channel_url', label: 'YouTubeチャンネル', pts: 10, color: '#10B981' },
  { key: 'intro_url',           label: '紹介ページURL',     pts: 10, color: '#10B981' },
  { key: 'student_count',       label: '学生数',            pts: 10, color: '#10B981' },
] as const
const LAB_MAX = LAB_ITEMS.reduce((s, i) => s + i.pts, 0)

const FAC_ITEMS = [
  { key: 'researchmap_id', label: 'researchmap',  pts: 50, color: '#5046E5' },
  { key: 'twitter_url',    label: 'X (Twitter)',  pts: 25, color: '#10B981' },
  { key: 'instagram_url',  label: 'Instagram',    pts: 25, color: '#10B981' },
] as const
const FAC_MAX = FAC_ITEMS.reduce((s, i) => s + i.pts, 0)

function labScore(l: Lab) {
  return Math.round(LAB_ITEMS.reduce((s, i) => s + (l[i.key as keyof Lab] ? i.pts : 0), 0) / LAB_MAX * 100)
}
function facScore(f: Faculty) {
  return Math.round(FAC_ITEMS.reduce((s, i) => s + (f[i.key as keyof Faculty] ? i.pts : 0), 0) / FAC_MAX * 100)
}
function avg(arr: number[]) {
  return arr.length ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) : 0
}
function barColor(pct: number) {
  if (pct >= 60) return '#10B981'
  if (pct >= 30) return '#06B6D4'
  return '#5046E5'
}

function Bar({ pct, delay }: { pct: number; delay: number }) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), delay)
    return () => clearTimeout(t)
  }, [pct, delay])
  return (
    <div style={{ flex: 1, height: 16, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
      <div style={{
        height: '100%', borderRadius: 4, background: barColor(pct),
        width: `${width}%`,
        transition: 'width 0.55s cubic-bezier(0.4,0,0.2,1)',
      }} />
    </div>
  )
}

function LabTooltip({ lab, facs, tab }: { lab: Lab; facs: Faculty[]; tab: Tab }) {
  const missing: string[] = []
  const present: string[] = []

  if (tab === 'lab') {
    LAB_ITEMS.forEach(it => {
      if (lab[it.key as keyof Lab]) present.push(it.label)
      else missing.push(it.label)
    })
  } else {
    FAC_ITEMS.forEach(it => {
      const filled = facs.filter(f => f[it.key as keyof Faculty]).length
      const total  = facs.length || 1
      if (Math.round(filled / total * 100) < 50) missing.push(`${it.label} (${filled}/${total}名)`)
      else present.push(`${it.label} (${filled}/${total}名)`)
    })
  }

  return (
    <div style={{
      position: 'absolute', left: 162, top: '50%', transform: 'translateY(-50%)',
      background: '#1e293b', color: '#fff', borderRadius: 10,
      padding: '10px 12px', fontSize: 10, zIndex: 200,
      width: 210, pointerEvents: 'none',
      boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
    }}>
      <div style={{ position: 'absolute', left: -5, top: '50%', transform: 'translateY(-50%)', width: 0, height: 0, borderTop: '5px solid transparent', borderBottom: '5px solid transparent', borderRight: '5px solid #1e293b' }} />
      <p style={{ fontWeight: 700, fontSize: 11, margin: '0 0 7px', lineHeight: 1.4 }}>{lab.name}</p>
      {missing.length > 0 && (
        <>
          <p style={{ color: '#f87171', fontWeight: 700, margin: '5px 0 3px', fontSize: 9 }}>▲ 未入力・追加してみませんか</p>
          {missing.map(l => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '2px 0' }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#f87171', flexShrink: 0 }} />
              <span style={{ flex: 1, color: 'rgba(255,255,255,0.65)' }}>{l}</span>
              <span style={{ fontWeight: 700, color: '#f87171' }}>未入力</span>
            </div>
          ))}
        </>
      )}
      {present.length > 0 && (
        <>
          <p style={{ color: '#4ade80', fontWeight: 700, margin: '5px 0 3px', fontSize: 9 }}>✓ 入力済み</p>
          {present.map(l => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '2px 0' }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ade80', flexShrink: 0 }} />
              <span style={{ flex: 1, color: 'rgba(255,255,255,0.65)' }}>{l}</span>
              <span style={{ fontWeight: 700, color: '#4ade80' }}>✓</span>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

export default function LabCompletenessChart() {
  const [labs,      setLabs]      = useState<Lab[]>([])
  const [faculties, setFaculties] = useState<Faculty[]>([])
  const [tab,       setTab]       = useState<Tab>('lab')
  const [stack,     setStack]     = useState<Crumb[]>([])
  const [loading,   setLoading]   = useState(true)
  const [hoverId,   setHoverId]   = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      sb.from('labs').select('id,name,dept,faculty_name,summary_text,lab_url,instagram_url,twitter_url,youtube_channel_url,intro_url,student_count').not('dept', 'is', null),
      sb.from('faculties').select('id,lab_id,name,role,researchmap_id,twitter_url,instagram_url'),
    ]).then(([lr, fr]) => {
      if (lr.data) setLabs(lr.data)
      if (fr.data) setFaculties(fr.data)
      setLoading(false)
    })
  }, [])

  const goRoot  = () => { setStack([]);                          setHoverId(null) }
  const goStack = (i: number) => { setStack(s => s.slice(0, i + 1)); setHoverId(null) }
  const goDept  = (dept: string) => { setStack([{ label: dept, dept }]); setHoverId(null) }

  const currentDept = stack.length > 0 ? stack[stack.length - 1].dept : null

  const rows = (() => {
    if (!currentDept) {
      const depts = [...new Set(labs.map(l => l.dept))].sort()
      return depts.map(dept => {
        const dLabs = labs.filter(l => l.dept === dept)
        const pct   = tab === 'lab'
          ? avg(dLabs.map(labScore))
          : avg(faculties.filter(f => dLabs.some(l => l.id === f.lab_id)).map(facScore))
        return { id: dept, label: dept, sub: `${dLabs.length}研究室`, pct, isDept: true, lab: null, facs: [] as Faculty[] }
      }).sort((a, b) => b.pct - a.pct)
    } else {
      return labs
        .filter(l => l.dept === currentDept)
        .map(lab => {
          const facs = faculties.filter(f => f.lab_id === lab.id)
          const pct  = tab === 'lab' ? labScore(lab) : avg(facs.map(facScore))
          return { id: lab.id, label: lab.name, sub: lab.faculty_name ?? '', pct, isDept: false, lab, facs }
        })
        .sort((a, b) => a.pct - b.pct)
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

      {/* タブ */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(148,163,184,0.15)' }}>
        {(['lab', 'fac'] as Tab[]).map(t => (
          <button key={t} onClick={() => { setTab(t); setHoverId(null) }}
            style={{ flex: 1, padding: '10px 16px', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: f, transition: 'all 0.15s',
              color: tab === t ? '#5046E5' : '#94a3b8',
              background: tab === t ? 'rgba(80,70,229,0.03)' : 'transparent',
              borderBottom: tab === t ? '2px solid #5046E5' : '2px solid transparent',
            }}>
            {t === 'lab' ? '🏫 研究室情報' : '👤 教員情報'}
          </button>
        ))}
      </div>

      {/* 凡例 */}
      <div style={{ display: 'flex', gap: 12, padding: '8px 16px', borderBottom: '1px solid rgba(148,163,184,0.08)', flexWrap: 'wrap', alignItems: 'center' }}>
        {(tab === 'lab'
          ? [{ color: '#5046E5', label: '研究概要' }, { color: '#06B6D4', label: '公式HP' }, { color: '#10B981', label: 'SNS・動画・その他' }]
          : [{ color: '#5046E5', label: 'researchmap' }, { color: '#10B981', label: 'X・Instagram' }]
        ).map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#64748b' }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
            {label}
          </div>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 10, color: '#94a3b8' }}>
          {currentDept ? '研究室にホバーで詳細' : 'クリックで展開 ›'}
        </span>
      </div>

      {/* チャート */}
      <div style={{ padding: '10px 14px 14px', maxHeight: 400, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: 13 }}>読み込み中...</div>
        ) : rows.map((row, i) => (
          <div key={row.id} style={{ position: 'relative', marginBottom: 5 }}>
            <div
              onClick={() => row.isDept ? goDept(row.label) : undefined}
              onMouseEnter={() => !row.isDept ? setHoverId(row.id) : undefined}
              onMouseLeave={() => setHoverId(null)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 6px', borderRadius: 8, cursor: row.isDept ? 'pointer' : 'default', transition: 'background 0.1s',
                background: hoverId === row.id ? '#f8faff' : 'transparent',
              }}
            >
              <div style={{ width: 150, flexShrink: 0 }}>
                <div style={{ fontSize: 11, color: '#334155', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: row.isDept ? 600 : 400 }}>
                  {row.label}
                  {row.isDept && <span style={{ fontSize: 9, color: '#94a3b8', marginLeft: 4 }}>{row.sub}</span>}
                </div>
                {!row.isDept && row.sub && (
                  <div style={{ fontSize: 9, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.sub}</div>
                )}
              </div>
              <Bar pct={row.pct} delay={40 + i * 25} />
              <div style={{ width: 30, fontSize: 10, color: '#94a3b8', textAlign: 'right', flexShrink: 0, fontWeight: 600 }}>{row.pct}%</div>
              <div style={{ width: 12, fontSize: 10, color: '#cbd5e1', flexShrink: 0 }}>{row.isDept ? '›' : '💬'}</div>
            </div>
            {!row.isDept && hoverId === row.id && row.lab && (
              <LabTooltip lab={row.lab} facs={row.facs} tab={tab} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}