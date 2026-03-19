'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { useCompare } from '@/contexts/CompareContext'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// クラスタ定数（map/page.tsxと同じ値を使う）
const CLUSTER_NAMES: Record<number, string> = {
  0: 'プラズマ・核融合',
  1: '材料・照射工学',
  2: '計測・医療応用',
  3: '安全・システム',
}
const CLUSTER_COLORS: Record<number, string> = {
  0: '#5FAFC6',
  1: '#6DBF9E',
  2: '#F0A84E',
  3: '#9B8FD4',
}

type Lab = {
  id: string
  name: string
  faculty_name: string | null
  dept: string | null
  lab_url: string | null
  cluster_id: number | null
  summary_text: string | null
  lab_tags: { tag: string }[]
}

const font = "'Noto Sans JP', sans-serif"
const fontSora = "'Sora', 'Noto Sans JP', sans-serif"

export default function ComparePage() {
  const { compareIds, removeCompare, clearCompare } = useCompare()
  const router = useRouter()
  const [labs, setLabs] = useState<Lab[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (compareIds.length === 0) {
      setLoading(false)
      return
    }
    const fetchLabs = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('labs')
        .select('id, name, faculty_name, dept, lab_url, cluster_id, summary_text, lab_tags(tag)')
        .in('id', compareIds)
      setLabs((data as Lab[]) ?? [])
      setLoading(false)
    }
    fetchLabs()
  }, [compareIds])

  // compareIdsの順番通りに並べる
  const orderedLabs = compareIds
    .map(id => labs.find(l => l.id === id))
    .filter(Boolean) as Lab[]

  // 差分強調：全研究室で値が異なる行はtrueを返す
  const hasDiff = (values: (string | null | undefined)[]) => {
    const nonNull = values.filter(v => v != null && v !== '')
    if (nonNull.length < 2) return false
    return new Set(nonNull).size > 1
  }

  const rowBg = (diff: boolean) =>
    diff ? 'rgba(95,175,198,0.07)' : 'transparent'

  // ── ローディング ──
  if (loading) return (
    <main style={{ background: '#F3FBFD', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: font }}>
      <p style={{ color: '#8FA1AE', fontSize: 13 }}>読み込み中...</p>
    </main>
  )

  // ── 空状態（0件） ──
  if (compareIds.length === 0) return (
    <main style={{ background: '#F3FBFD', minHeight: '100vh', fontFamily: font }}>
      <Header />
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>🔬</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1F2D3D', marginBottom: 12, fontFamily: fontSora }}>
          比較する研究室がまだありません
        </h2>
        <p style={{ fontSize: 14, color: '#8FA1AE', lineHeight: 1.8, marginBottom: 32 }}>
          マップや一覧から「比較に追加」ボタンを押して、<br />気になる研究室を選んでください。
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/map" style={btnStyle('#5FAFC6', 'white')}>マップで探す</Link>
          <Link href="/cards" style={btnStyle('white', '#5FAFC6', '#DCE8EE')}>一覧で探す</Link>
        </div>
      </div>
    </main>
  )

  // ── 1件のみ ──
  if (compareIds.length === 1) return (
    <main style={{ background: '#F3FBFD', minHeight: '100vh', fontFamily: font }}>
      <Header />
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>➕</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1F2D3D', marginBottom: 12, fontFamily: fontSora }}>
          あと1〜2件追加すると比較できます
        </h2>
        <p style={{ fontSize: 14, color: '#8FA1AE', lineHeight: 1.8, marginBottom: 32 }}>
          現在 <strong style={{ color: '#5FAFC6' }}>1件</strong> 選択中。<br />
          マップや一覧から追加の研究室を選んでください。
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/map" style={btnStyle('#5FAFC6', 'white')}>マップに戻る</Link>
          <Link href="/cards" style={btnStyle('white', '#5FAFC6', '#DCE8EE')}>一覧に戻る</Link>
        </div>
      </div>
    </main>
  )

  // ── 比較表（2〜3件） ──
  const clusterValues = orderedLabs.map(l => CLUSTER_NAMES[l.cluster_id ?? -1] ?? '未分類')
  const deptValues = orderedLabs.map(l => l.dept)
  const tagValues = orderedLabs.map(l => l.lab_tags.map(t => t.tag).sort().join(','))

  return (
    <main style={{ background: '#F3FBFD', minHeight: '100vh', fontFamily: font, paddingBottom: 120 }}>
      <Header />

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 16px 0' }}>

        {/* ページタイトル */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1F2D3D', margin: '0 0 6px', fontFamily: fontSora }}>
            研究室を比較
          </h1>
          <p style={{ fontSize: 13, color: '#8FA1AE', margin: 0 }}>
            {orderedLabs.length}件を比較中　／
            <button onClick={clearCompare} style={{ background: 'none', border: 'none', color: '#5FAFC6', fontSize: 13, cursor: 'pointer', padding: 0, fontFamily: font }}>
              すべてクリア
            </button>
          </p>
        </div>

        {/* 比較表 */}
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: orderedLabs.length * 240 }}>

            {/* ヘッダー行：研究室名 */}
            <thead>
              <tr>
                <th style={{ width: 100, minWidth: 80, padding: '12px 8px', textAlign: 'left', fontSize: 11, color: '#8FA1AE', fontWeight: 700, borderBottom: '2px solid #DCE8EE', verticalAlign: 'bottom' }}>
                  項目
                </th>
                {orderedLabs.map(lab => {
                  const color = CLUSTER_COLORS[lab.cluster_id ?? -1] ?? '#94A3B8'
                  return (
                    <th key={lab.id} style={{ padding: '12px 12px 16px', textAlign: 'left', borderBottom: `2px solid ${color}`, verticalAlign: 'bottom', minWidth: 240 }}>
                      {/* 研究室名 */}
                      <p style={{ fontSize: 15, fontWeight: 800, color: '#1F2D3D', margin: '0 0 4px', lineHeight: 1.3, fontFamily: fontSora }}>
                        {lab.name}
                      </p>
                      {/* 教員名 */}
                      {lab.faculty_name && (
                        <p style={{ fontSize: 12, color: '#5B6B79', margin: '0 0 8px' }}>
                          {lab.faculty_name}
                        </p>
                      )}
                      {/* 比較から外すボタン */}
                      <button
                        onClick={() => removeCompare(lab.id)}
                        style={{ fontSize: 11, color: '#8FA1AE', background: 'none', border: '1px solid #DCE8EE', borderRadius: 999, padding: '2px 10px', cursor: 'pointer', fontFamily: font }}
                      >
                        外す
                      </button>
                    </th>
                  )
                })}
              </tr>
            </thead>

            <tbody>

              {/* クラスタ（研究分野） */}
              <Row label="研究分野" diff={hasDiff(clusterValues)} bg={rowBg(hasDiff(clusterValues))}>
                {orderedLabs.map(lab => {
                  const name = CLUSTER_NAMES[lab.cluster_id ?? -1] ?? '未分類'
                  const color = CLUSTER_COLORS[lab.cluster_id ?? -1] ?? '#94A3B8'
                  return (
                    <td key={lab.id} style={tdStyle(rowBg(hasDiff(clusterValues)))}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color, background: `${color}18`, padding: '3px 10px', borderRadius: 999, border: `1px solid ${color}40` }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
                        {name}
                      </span>
                    </td>
                  )
                })}
              </Row>

              {/* 所属専攻 */}
              <Row label="所属専攻" diff={hasDiff(deptValues)} bg={rowBg(hasDiff(deptValues))}>
                {orderedLabs.map(lab => (
                  <td key={lab.id} style={tdStyle(rowBg(hasDiff(deptValues)))}>
                    <span style={{ fontSize: 13, color: '#1F2D3D' }}>{lab.dept ?? '—'}</span>
                  </td>
                ))}
              </Row>

              {/* 研究分野タグ */}
              <Row label="タグ" diff={hasDiff(tagValues)} bg={rowBg(hasDiff(tagValues))}>
                {orderedLabs.map(lab => (
                  <td key={lab.id} style={tdStyle(rowBg(hasDiff(tagValues)))}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {lab.lab_tags.length > 0
                        ? lab.lab_tags.map((t, i) => (
                          <span key={i} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: '#EDF6F9', color: '#3A8BA5', border: '1px solid #C8E6EE', fontWeight: 600 }}>
                            {t.tag}
                          </span>
                        ))
                        : <span style={{ fontSize: 12, color: '#8FA1AE' }}>未取得</span>
                      }
                    </div>
                  </td>
                ))}
              </Row>

              {/* 研究概要 */}
              <Row label="研究概要">
                {orderedLabs.map(lab => (
                  <td key={lab.id} style={tdStyle('transparent')}>
                    {lab.summary_text
                      ? <p style={{ fontSize: 12, color: '#5B6B79', lineHeight: 1.8, margin: 0 }}>
                          {lab.summary_text.slice(0, 150)}
                          {lab.summary_text.length > 150 && '…'}
                        </p>
                      : <span style={{ fontSize: 12, color: '#8FA1AE' }}>概要未取得</span>
                    }
                  </td>
                ))}
              </Row>

              {/* アクション行 */}
              <tr>
                <td style={{ padding: '20px 8px 8px', fontSize: 11, color: '#8FA1AE', fontWeight: 700, verticalAlign: 'top' }}>
                  リンク
                </td>
                {orderedLabs.map(lab => (
                  <td key={lab.id} style={{ padding: '20px 12px 8px', verticalAlign: 'top' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <Link href={`/lab/${lab.id}`} style={btnStyle('#5FAFC6', 'white', undefined, true)}>
                        詳細ページを見る
                      </Link>
                      {lab.lab_url && (
                        <a href={lab.lab_url} target="_blank" rel="noopener noreferrer" style={btnStyle('white', '#5FAFC6', '#DCE8EE', true)}>
                          公式HP ↗
                        </a>
                      )}
                    </div>
                  </td>
                ))}
              </tr>

            </tbody>
          </table>
        </div>

        {/* 下部：マップ・一覧へ戻る */}
        <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid #DCE8EE', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/map" style={btnStyle('white', '#5FAFC6', '#DCE8EE')}>← マップに戻る</Link>
          <Link href="/cards" style={btnStyle('white', '#5FAFC6', '#DCE8EE')}>← 一覧に戻る</Link>
        </div>
      </div>
    </main>
  )
}

// ── 共通ヘッダー ──
function Header() {
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 30,
      background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid #DCE8EE',
      padding: '0 20px', height: 54,
      display: 'flex', alignItems: 'center', gap: 14,
      fontFamily: "'Noto Sans JP', sans-serif",
    }}>
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: 'linear-gradient(135deg,#5FAFC6 0%,#8FD3E0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 13, boxShadow: '0 3px 10px rgba(95,175,198,0.3)' }}>L</div>
        <span style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 14, color: '#1F2D3D', letterSpacing: '-0.02em' }}>Labo Navi</span>
      </Link>
      <div style={{ borderLeft: '1px solid #DCE8EE', paddingLeft: 14 }}>
        <p style={{ fontSize: 12, color: '#8FA1AE', margin: 0 }}>研究室を比較</p>
      </div>
    </header>
  )
}

// ── テーブル行コンポーネント ──
function Row({ label, diff, bg, children }: { label: string; diff?: boolean; bg?: string; children: React.ReactNode }) {
  return (
    <tr style={{ background: bg ?? 'transparent' }}>
      <td style={{
        padding: '14px 8px', fontSize: 11, fontWeight: 700,
        color: diff ? '#3A8BA5' : '#8FA1AE',
        verticalAlign: 'top', whiteSpace: 'nowrap',
        borderBottom: '1px solid #EDF2F7',
      }}>
        {diff && <span style={{ marginRight: 4 }}>◉</span>}
        {label}
      </td>
      {children}
    </tr>
  )
}

// ── スタイルヘルパー ──
function tdStyle(bg: string): React.CSSProperties {
  return {
    padding: '14px 12px',
    verticalAlign: 'top',
    borderBottom: '1px solid #EDF2F7',
    background: bg,
  }
}

function btnStyle(bg: string, color: string, borderColor?: string, small?: boolean): React.CSSProperties {
  return {
    display: 'inline-block',
    padding: small ? '7px 14px' : '9px 20px',
    borderRadius: 999,
    background: bg,
    color: color,
    border: `1.5px solid ${borderColor ?? bg}`,
    fontSize: small ? 12 : 13,
    fontWeight: 700,
    textDecoration: 'none',
    cursor: 'pointer',
    fontFamily: "'Noto Sans JP', sans-serif",
    whiteSpace: 'nowrap' as const,
    textAlign: 'center' as const,
  }
}
