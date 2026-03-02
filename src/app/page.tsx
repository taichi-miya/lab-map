'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type Lab = {
  id: string
  name: string
  faculty_name: string | null
  map_x: number | null
  map_y: number | null
  cluster_id: number | null
  summary_text: string | null
  tags: string[]
}

type Suggestion = {
  type: 'lab' | 'faculty' | 'tag'
  label: string
  sub?: string
  labId?: string
  // tag検索の場合は複数の研究室にマッチする
  matchIds?: string[]
}

const C        = ['#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'] as const
const C_FILL   = ['rgba(59,130,246,0.10)', 'rgba(34,197,94,0.10)', 'rgba(245,158,11,0.10)', 'rgba(239,68,68,0.10)', 'rgba(139,92,246,0.10)', 'rgba(236,72,153,0.10)', 'rgba(20,184,166,0.10)', 'rgba(249,115,22,0.10)']
const C_STROKE = ['rgba(59,130,246,0.35)', 'rgba(34,197,94,0.35)', 'rgba(245,158,11,0.35)', 'rgba(239,68,68,0.35)', 'rgba(139,92,246,0.35)', 'rgba(236,72,153,0.35)', 'rgba(20,184,166,0.35)', 'rgba(249,115,22,0.35)']
const C_CHIP   = ['rgba(59,130,246,0.12)', 'rgba(34,197,94,0.12)', 'rgba(245,158,11,0.12)', 'rgba(239,68,68,0.12)', 'rgba(139,92,246,0.12)', 'rgba(236,72,153,0.12)', 'rgba(20,184,166,0.12)', 'rgba(249,115,22,0.12)']
const C_CHIP_H = ['rgba(59,130,246,0.22)', 'rgba(34,197,94,0.22)', 'rgba(245,158,11,0.22)', 'rgba(239,68,68,0.22)', 'rgba(139,92,246,0.22)', 'rgba(236,72,153,0.22)', 'rgba(20,184,166,0.22)', 'rgba(249,115,22,0.22)']
const CLUSTER_NAMES = ['計測・安全システム', '材料プロセス・生体材料', '電子・磁性材料', '核燃料・廃棄物処理', '核融合・原子力材料', '組織制御・構造材料', '放射線・量子医療', '素材プロセス・無機材料']
const CLUSTER_DESC = [
  '電磁・超音波・マイクロ波などを用いた非破壊検査・材料評価技術と、原子力・航空システムの安全性向上に取り組む研究室群。',
  '金属・セラミックス・生体材料の接合・プロセス設計から、医療応用材料の開発まで幅広く取り組む研究室群。',
  '磁性材料・電子デバイス材料・情報記録材料など、次世代エレクトロニクスを支える機能性材料を研究する研究室群。',
  '使用済核燃料の再処理・核種分離技術から、放射性廃棄物の地層処分・長期安全評価まで研究する研究室群。',
  '核融合炉材料の開発・照射効果解析から、プラズマ制御・超伝導マグネット設計まで、核融合エネルギー実現に取り組む研究室群。',
  '金属・合金の結晶組織制御・相変態メカニズムの解明から、高強度・耐熱構造材料の設計まで研究する研究室群。',
  '粒子ビーム・放射線を用いたがん治療・医用イメージング技術の開発から、放射線センサー・検出器の研究まで取り組む研究室群。',
  '製錬・精製・分離などの素材プロセス技術と、無機固体材料の構造・機能評価を研究する研究室群。',
]
const PIN_KEY = 'labmap_pins'

const W = 800, H = 600  // ノード座標の基準サイズ（変更しない）
const MIN_ZOOM = 0.5, MAX_ZOOM = 3.0, ZOOM_STEP = 0.25

function clampOffset(ox: number, oy: number, zoom: number, svgW = W, svgH = H) {
  // コンテンツのサイズ（ノード座標はW×Hの論理空間）
  const contentW = W * zoom
  const contentH = H * zoom
  const PAD = 80
  const minX = Math.min(0, svgW - contentW - PAD)
  const maxX = Math.max(0, PAD)
  const minY = Math.min(0, svgH - contentH - PAD)
  const maxY = Math.max(0, PAD)
  return {
    x: Math.min(maxX, Math.max(minX, ox)),
    y: Math.min(maxY, Math.max(minY, oy)),
  }
}
function loadPins(): string[] {
  try { return JSON.parse(localStorage.getItem(PIN_KEY) ?? '[]') } catch { return [] }
}
function savePins(ids: string[]) {
  try { localStorage.setItem(PIN_KEY, JSON.stringify(ids)) } catch {}
}

// ノードにフォーカスズームするときのターゲットoffset/zoom計算
function calcFocusTransform(x: number, y: number, targetZoom = 2, svgW = W, svgH = H) {
  const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, targetZoom))
  // ノード(x,y)をSVG中央に持ってくる
  const ox = svgW / 2 - x * clamped
  const oy = svgH / 2 - y * clamped
  return { zoom: clamped, offset: clampOffset(ox, oy, clamped, svgW, svgH) }
}

export default function ExplorePage() {
  const router = useRouter()
  const [labs, setLabs] = useState<Lab[]>([])
  const [preview, setPreview] = useState<Lab | null>(null)
  const [query, setQuery] = useState('')
  const [activeCluster, setActiveCluster] = useState<number | null>(null)
  const [chipHover, setChipHover] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [pins, setPins] = useState<string[]>([])
  const [showPinList, setShowPinList] = useState(false)

  // サジェスト
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [suggIndex, setSuggIndex] = useState(-1)  // キーボード選択中のインデックス
  const [showSugg, setShowSugg] = useState(false)
  const [focusedLabId, setFocusedLabId] = useState<string | null>(null)
  const [clusterPanel, setClusterPanel] = useState<number | null>(null) // フォーカスズーム対象

  const isDragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const offsetAtDrag = useRef({ x: 0, y: 0 })
  const dragMoved = useRef(false)
  const svgRef = useRef<SVGSVGElement>(null)
  const mapDivRef = useRef<HTMLDivElement>(null)
  const [svgW, setSvgW] = useState(typeof window !== 'undefined' ? window.innerWidth : W)
  const [svgH, setSvgH] = useState(typeof window !== 'undefined' ? window.innerHeight : H)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggRef = useRef<HTMLDivElement>(null)
  const enterTimer = useRef<ReturnType<typeof setTimeout> | null>(null)  // 表示ディレイ
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)  // 消去ディレイ
  const cardHovered = useRef(false)  // ミニカード上にカーソルがいるか

  const fittedRef = useRef(false)

  // ウィンドウリサイズを監視
  useEffect(() => {
    const onResize = () => {
      setSvgW(window.innerWidth)
      setSvgH(window.innerHeight)
      fittedRef.current = false // リサイズ時に再フィット
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    setPins(loadPins())
    ;(async () => {
      const { data: labData } = await supabase
        .from('labs')
        .select('id,name,faculty_name,map_x,map_y,cluster_id,summary_text')
      const { data: tagData } = await supabase
        .from('lab_tags')
        .select('lab_id,tag')
      const tagMap: Record<string, string[]> = {}
      for (const t of tagData ?? []) {
        if (!tagMap[t.lab_id]) tagMap[t.lab_id] = []
        tagMap[t.lab_id].push(t.tag)
      }
      setLabs((labData ?? []).map(l => ({ ...l, tags: tagMap[l.id] ?? [] })))
      setLoading(false)
    })()
  }, [])

  // フィット共通関数
  const doFit = useCallback((w: number, h: number, xs: number[], ys: number[]) => {
    const minX = Math.min(...xs), maxX = Math.max(...xs)
    const minY = Math.min(...ys), maxY = Math.max(...ys)
    const nodeCx = (minX + maxX) / 2
    const nodeCy = (minY + maxY) / 2
    const PAD = 60
    const z = Math.min((w - PAD * 2) / (maxX - minX), (h - PAD * 2) / (maxY - minY), MAX_ZOOM)
    setZoom(z)
    setOffset({ x: w / 2 - nodeCx * z, y: h / 2 - nodeCy * z })
  }, [])

  // labsとsvgサイズ両方が揃ってから一度だけフィット
  useEffect(() => {
    if (fittedRef.current) return
    if (labs.length === 0) return
    if (svgW < 100 || svgH < 100) return  // SVGサイズ未確定なら待つ
    fittedRef.current = true
    const xs = labs.map(l => l.map_x ?? 400)
    const ys = labs.map(l => l.map_y ?? 300)
    doFit(svgW, svgH, xs, ys)
  }, [labs, svgW, svgH, doFit])

  // サジェスト生成
  useEffect(() => {
    const q = query.trim().toLowerCase()
    if (!q || q.length < 1) {
      setSuggestions([])
      setShowSugg(false)
      setSuggIndex(-1)
      return
    }

    const suggs: Suggestion[] = []

    // 研究室名マッチ（最大5件）
    const labMatches = labs.filter(l => l.name.toLowerCase().includes(q)).slice(0, 5)
    for (const l of labMatches) {
      suggs.push({ type: 'lab', label: l.name, sub: l.faculty_name ?? '', labId: l.id })
    }

    // 教員名マッチ（研究室名でヒットしていないもの、最大3件）
    const facMatches = labs
      .filter(l => !labMatches.find(m => m.id === l.id) && (l.faculty_name ?? '').toLowerCase().includes(q))
      .slice(0, 3)
    for (const l of facMatches) {
      suggs.push({ type: 'faculty', label: l.faculty_name ?? '', sub: l.name, labId: l.id })
    }

    // タグマッチ（ユニークなタグ、最大4件）
    const tagSet = new Map<string, string[]>()
    for (const l of labs) {
      for (const t of l.tags) {
        if (t.toLowerCase().includes(q)) {
          if (!tagSet.has(t)) tagSet.set(t, [])
          tagSet.get(t)!.push(l.id)
        }
      }
    }
    let tagCount = 0
    for (const [tag, ids] of tagSet) {
      if (tagCount >= 4) break
      // 研究室名・教員名でヒット済みのタグは除外
      suggs.push({ type: 'tag', label: tag, sub: `${ids.length}件の研究室`, matchIds: ids })
      tagCount++
    }

    setSuggestions(suggs)
    setShowSugg(suggs.length > 0)
    setSuggIndex(-1)
  }, [query, labs])

  const togglePin = useCallback((id: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    e?.preventDefault()
    setPins(prev => {
      const next = prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
      savePins(next)
      return next
    })
  }, [])

  const placed = labs.map((lab, i) => ({
    ...lab,
    x: lab.map_x ?? 100 + (i % 5) * 130,
    y: lab.map_y ?? 100 + Math.floor(i / 5) * 120,
  }))

  const pinnedLabs = placed.filter(l => pins.includes(l.id))

  // サジェスト選択時の処理
  const commitSuggestion = useCallback((s: Suggestion) => {
    setShowSugg(false)
    setSuggIndex(-1)

    if (s.type === 'lab' || s.type === 'faculty') {
      // 該当研究室に自動ズーム
      const lab = placed.find(p => p.id === s.labId)
      if (lab) {
        const { zoom: z, offset: o } = calcFocusTransform(lab.x, lab.y, 2, svgW, svgH)
        setZoom(z)
        setOffset(o)
        setFocusedLabId(lab.id)
        setPreview(lab)
        setQuery(s.label)
      }
    } else if (s.type === 'tag') {
      // タグ検索：クエリをセットしてフィルタ
      setQuery(s.label)
      setFocusedLabId(null)
    }
  }, [placed])

  // キーボード操作
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSugg) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSuggIndex(i => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSuggIndex(i => Math.max(i - 1, -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (suggIndex >= 0) {
        commitSuggestion(suggestions[suggIndex])
      } else if (suggestions.length > 0) {
        commitSuggestion(suggestions[0])
      }
    } else if (e.key === 'Escape') {
      setShowSugg(false)
      setSuggIndex(-1)
    }
  }

  const matchLab = useCallback((lab: Lab) => {
    const clusterOk = activeCluster === null || lab.cluster_id === activeCluster
    if (!clusterOk) return false
    if (!query) return true
    const q = query.toLowerCase()
    return (
      lab.name.toLowerCase().includes(q) ||
      (lab.faculty_name ?? '').toLowerCase().includes(q) ||
      lab.tags.some(t => t.toLowerCase().includes(q))
    )
  }, [query, activeCluster])

  const clusterEllipses = CLUSTER_NAMES.map((_, ci) => {
    const pts = placed.filter(l => l.cluster_id === ci)
    if (pts.length < 2) return null
    const xs = pts.map(p => p.x), ys = pts.map(p => p.y)
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2
    const rx = (Math.max(...xs) - Math.min(...xs)) / 2 + 42
    const ry = (Math.max(...ys) - Math.min(...ys)) / 2 + 42
    return { cx, cy, rx, ry }
  })

  const applyZoom = (newZoom: number) => {
    const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, newZoom))
    // SVG中心を固定点としてズーム
    const cx = svgW / 2
    const cy = svgH / 2
    const newOx = cx - (cx - offset.x) * (clamped / zoom)
    const newOy = cy - (cy - offset.y) * (clamped / zoom)
    setZoom(clamped)
    setOffset(clampOffset(newOx, newOy, clamped, svgW, svgH))
  }

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if ((e.target as Element).closest('g[data-node]')) return
    isDragging.current = true
    dragMoved.current = false
    dragStart.current = { x: e.clientX, y: e.clientY }
    offsetAtDrag.current = { ...offset }
  }
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging.current) return
    const dx = e.clientX - dragStart.current.x
    const dy = e.clientY - dragStart.current.y
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragMoved.current = true
    setOffset(clampOffset(offsetAtDrag.current.x + dx, offsetAtDrag.current.y + dy, zoom, svgW, svgH))
  }
  const handleMouseUp = () => { isDragging.current = false }

  const transform = `translate(${offset.x}, ${offset.y}) scale(${zoom})`

  if (loading) {
    return (
      <main style={{ background: '#FAFAF7' }} className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
          <p style={{ color: '#6B7280' }} className="text-sm">読み込み中...</p>
        </div>
      </main>
    )
  }

  const renderPreviewCard = (lab: Lab) => {
    const ci = lab.cluster_id ?? 0
    const color     = lab.cluster_id !== null ? C[ci] : '#94A3B8'
    const chipBg    = lab.cluster_id !== null ? C_CHIP[ci] : 'rgba(148,163,184,0.12)'
    const chipColor = lab.cluster_id !== null ? C[ci] : '#64748B'
    const strokeColor = lab.cluster_id !== null ? C_STROKE[ci] : 'rgba(148,163,184,0.35)'
    const clusterName = lab.cluster_id !== null ? CLUSTER_NAMES[ci] : '未分類'
    const isPinned = pins.includes(lab.id)
    return (
      <div
        style={{ animation: 'slideUpOuter 0.15s ease forwards' }}
        onMouseEnter={() => {
          cardHovered.current = true
          if (leaveTimer.current) clearTimeout(leaveTimer.current)
        }}
        onMouseLeave={() => {
          cardHovered.current = false
          setPreview(null)
        }}
      >
        <div style={{
          background: 'rgba(255,255,255,0.70)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRadius: 16,
          border: `1.5px solid ${strokeColor}`,
          boxShadow: '0 4px 24px rgba(17,24,39,0.14)',
          padding: '14px 16px',
          display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: 10, fontWeight: 600, color: chipColor,
              background: chipBg, padding: '2px 9px 2px 6px', borderRadius: 999, marginBottom: 5,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
              {clusterName}
            </span>
            <p style={{ fontSize: 15, fontWeight: 700, margin: '0 0 2px', color: 'var(--text)', lineHeight: 1.3 }}>
              {lab.name}
            </p>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 8px' }}>{lab.faculty_name}</p>
            {lab.tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {lab.tags.slice(0, 6).map((t, i) => (
                  <span key={i} style={{
                    fontSize: 11, padding: '2px 8px', borderRadius: 999,
                    background: chipBg, color: chipColor, fontWeight: 500,
                  }}>{t}</span>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <button
              onClick={(e) => togglePin(lab.id, e)}
              title={isPinned ? 'ピンを外す' : 'ピン留め'}
              style={{
                width: 38, height: 38, borderRadius: 10, border: 'none',
                background: isPinned ? '#FEF9C3' : '#F3F4F6',
                cursor: 'pointer', fontSize: 18,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s, transform 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.12)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            >{isPinned ? '⭐' : '☆'}</button>
            <Link
              href={`/lab/${lab.id}`}
              className="detail-btn"
              style={{
                display: 'inline-block', padding: '10px 20px', borderRadius: 10,
                background: color, color: 'white', fontSize: 13, fontWeight: 600,
                textDecoration: 'none', letterSpacing: '0.01em', whiteSpace: 'nowrap',
                transition: 'opacity 0.15s',
              }}
            >詳細を見る →</Link>
          </div>
        </div>
      </div>
    )
  }

  // サジェストアイコン
  const suggIcon = (type: Suggestion['type']) => {
    if (type === 'lab')     return <span style={{ fontSize: 14 }}>🏛</span>
    if (type === 'faculty') return <span style={{ fontSize: 14 }}>👤</span>
    return <span style={{ fontSize: 14 }}>🏷</span>
  }

  return (
    <>
      <style>{`
        :root {
          --bg: #FAFAF7; --card: #FFFFFF; --text: #1F2937;
          --muted: #6B7280; --border: #E5E7EB;
          --shadow: rgba(17,24,39,0.08);
          --font: 'Hiragino Kaku Gothic ProN','Hiragino Sans','Noto Sans JP',sans-serif;
        }
        html, body { height: 100%; margin: 0; }
        body { background: var(--bg); font-family: var(--font); color: var(--text); margin: 0; }
        @keyframes slideUpOuter {
          from { opacity:0; transform:translateY(10px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes fadeInDown {
          from { opacity:0; transform:translateY(-6px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        .zoom-btn { transition: background 0.1s, transform 0.1s; }
        .zoom-btn:hover:not(:disabled) { background: #F3F4F6 !important; transform: scale(1.06); }
        .zoom-btn:disabled { opacity: 0.3 !important; cursor: not-allowed !important; }
        .chip-btn { transition: background 0.15s, box-shadow 0.15s; }
        .reset-btn:hover { background: #F9FAFB !important; }
        .detail-btn:hover { opacity: 0.88; }
        .pin-item:hover { background: #F9FAFB !important; }
        .sugg-item { transition: background 0.1s; }
        .sugg-item:hover { background: #F9FAFB; }
      `}</style>

      <main style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>

        {/* ── ヘッダー ── */}
        <header style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30,
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
          padding: '10px 16px 8px',
          background: 'rgba(250,250,247,0.88)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderBottom: '1px solid rgba(229,231,235,0.6)',
        }}>
          <div>
            <h1 style={{
              fontSize: 21, fontWeight: 700, letterSpacing: '-0.025em',
              color: 'var(--text)', margin: 0, lineHeight: 1.25,
            }}>東北大学 研究室マップ</h1>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: '5px 0 0', lineHeight: 1.6 }}>
              研究概要の類似度で研究室を配置。近いほど研究内容が似ています。
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {/* ── 検索バー＋サジェスト ── */}
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'relative' }}>
                <svg style={{
                  position: 'absolute', left: 11, top: '50%',
                  transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 1,
                }} width={14} height={14} viewBox="0 0 20 20" fill="none">
                  <circle cx="8.5" cy="8.5" r="5.5" stroke="#9CA3AF" strokeWidth="1.8"/>
                  <path d="M13 13l3.5 3.5" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="研究室名・教員名・タグで検索..."
                  value={query}
                  onChange={e => { setQuery(e.target.value); setFocusedLabId(null) }}
                  onKeyDown={handleKeyDown}
                  onFocus={() => { if (suggestions.length > 0) setShowSugg(true) }}
                  style={{
                    width: 240, paddingLeft: 32, paddingRight: query ? 28 : 12,
                    paddingTop: 9, paddingBottom: 9,
                    fontSize: 13, borderRadius: 10,
                    border: `1.5px solid ${showSugg ? '#93C5FD' : 'var(--border)'}`,
                    background: 'var(--card)', color: 'var(--text)',
                    outline: 'none', boxShadow: '0 1px 4px var(--shadow)',
                    fontFamily: 'var(--font)', transition: 'border-color 0.15s',
                  }}
                  onBlur={() => setTimeout(() => setShowSugg(false), 150)}
                />
                {/* クリアボタン */}
                {query && (
                  <button
                    onClick={() => { setQuery(''); setFocusedLabId(null); setShowSugg(false); inputRef.current?.focus() }}
                    style={{
                      position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: 14, color: '#9CA3AF', padding: 2, lineHeight: 1,
                    }}
                  >✕</button>
                )}
              </div>

              {/* サジェストドロップダウン */}
              {showSugg && suggestions.length > 0 && (
                <div
                  ref={suggRef}
                  style={{
                    position: 'absolute', top: 'calc(100% + 6px)', left: 0,
                    width: 300, zIndex: 60,
                    background: 'white', borderRadius: 12,
                    border: '1px solid var(--border)',
                    boxShadow: '0 8px 24px rgba(17,24,39,0.12)',
                    overflow: 'hidden',
                    animation: 'fadeInDown 0.12s ease',
                  }}
                >
                  {/* 種別ごとにグルーピング表示 */}
                  {(['lab', 'faculty', 'tag'] as const).map(type => {
                    const group = suggestions.filter(s => s.type === type)
                    if (group.length === 0) return null
                    const typeLabel = type === 'lab' ? '研究室' : type === 'faculty' ? '教員' : 'タグ'
                    return (
                      <div key={type}>
                        <div style={{
                          fontSize: 10, fontWeight: 700, color: '#9CA3AF',
                          padding: '8px 12px 4px', letterSpacing: '0.06em',
                        }}>{typeLabel}</div>
                        {group.map((s, i) => {
                          const globalIdx = suggestions.indexOf(s)
                          const isSelected = suggIndex === globalIdx
                          return (
                            <div
                              key={i}
                              className="sugg-item"
                              onMouseDown={() => commitSuggestion(s)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '8px 12px', cursor: 'pointer',
                                background: isSelected ? '#EFF6FF' : 'white',
                                borderLeft: isSelected ? '2px solid #3B82F6' : '2px solid transparent',
                              }}
                            >
                              {suggIcon(s.type)}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{
                                  fontSize: 13, fontWeight: 600, margin: 0,
                                  color: 'var(--text)',
                                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                }}>
                                  {/* クエリ部分をハイライト */}
                                  {highlightMatch(s.label, query)}
                                </p>
                                {s.sub && (
                                  <p style={{ fontSize: 11, color: 'var(--muted)', margin: 0 }}>{s.sub}</p>
                                )}
                              </div>
                              {s.type === 'lab' || s.type === 'faculty' ? (
                                <span style={{ fontSize: 10, color: '#9CA3AF', flexShrink: 0 }}>
                                  ズーム →
                                </span>
                              ) : null}
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                  <div style={{
                    padding: '6px 12px', fontSize: 10, color: '#9CA3AF',
                    borderTop: '1px solid #F3F4F6',
                    display: 'flex', gap: 12,
                  }}>
                    <span>↑↓ 選択</span>
                    <span>Enter 確定</span>
                    <span>Esc 閉じる</span>
                  </div>
                </div>
              )}
            </div>

            {/* ピン一覧ボタン */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowPinList(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 13px', borderRadius: 10, border: 'none',
                  background: pins.length > 0 ? '#FEF9C3' : '#F3F4F6',
                  color: pins.length > 0 ? '#92400E' : 'var(--muted)',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  boxShadow: '0 1px 4px var(--shadow)',
                  fontFamily: 'var(--font)', transition: 'background 0.15s',
                }}
              >
                <span style={{ fontSize: 16 }}>{pins.length > 0 ? '⭐' : '☆'}</span>
                {pins.length > 0 ? `${pins.length}件` : 'ピン'}
              </button>
              {showPinList && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  width: 300, zIndex: 50,
                  background: 'white', borderRadius: 14,
                  border: '1px solid var(--border)',
                  boxShadow: '0 8px 28px rgba(17,24,39,0.12)',
                  overflow: 'hidden', animation: 'fadeIn 0.12s ease',
                }}>
                  <div style={{
                    padding: '10px 14px 8px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    borderBottom: '1px solid var(--border)',
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>
                      ⭐ ピン留め（{pins.length}件）
                    </span>
                    {pins.length > 0 && (
                      <button onClick={() => { setPins([]); savePins([]) }} style={{
                        fontSize: 11, color: '#EF4444', background: 'none',
                        border: 'none', cursor: 'pointer', padding: '2px 4px', fontFamily: 'var(--font)',
                      }}>全て外す</button>
                    )}
                  </div>
                  {pins.length === 0 ? (
                    <p style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', padding: '20px 0', margin: 0 }}>
                      研究室の ☆ を押してピン留めできます
                    </p>
                  ) : (
                    <ul style={{ listStyle: 'none', margin: 0, padding: '4px 0', maxHeight: 300, overflowY: 'auto' }}>
                      {pinnedLabs.map(lab => {
                        const ci = lab.cluster_id ?? 0
                        const color = lab.cluster_id !== null ? C[ci] : '#94A3B8'
                        return (
                          <li key={lab.id}>
                            <div className="pin-item" style={{
                              display: 'flex', alignItems: 'center', gap: 10,
                              padding: '8px 14px', background: 'white', transition: 'background 0.1s',
                            }}>
                              <span style={{ width: 9, height: 9, borderRadius: '50%', background: color, flexShrink: 0 }} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <Link href={`/lab/${lab.id}`} style={{
                                  fontSize: 13, fontWeight: 600, color: 'var(--text)',
                                  textDecoration: 'none', display: 'block',
                                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                }} onClick={() => setShowPinList(false)}>{lab.name}</Link>
                                <p style={{ fontSize: 11, color: 'var(--muted)', margin: 0 }}>{lab.faculty_name}</p>
                              </div>
                              <button onClick={() => togglePin(lab.id)} style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                fontSize: 14, color: '#D97706', padding: '2px 4px', flexShrink: 0,
                              }}>⭐</button>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* 外クリックで閉じる */}
        {showPinList && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 45 }} onClick={() => setShowPinList(false)} />
        )}

        {/* ── カテゴリチップ ── */}
        <div style={{
          position: 'absolute', top: 68, left: 0, right: 0, zIndex: 29,
          display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center',
          padding: '6px 16px 8px',
          background: 'rgba(250,250,247,0.80)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        }}>
          {CLUSTER_NAMES.map((name, i) => {
            const active = activeCluster === i
            const hov    = chipHover === i
            return (
              <button key={i} className="chip-btn"
                onClick={() => setActiveCluster(active ? null : i)}
                onMouseEnter={() => setChipHover(i)}
                onMouseLeave={() => setChipHover(null)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '5px 13px 5px 10px', borderRadius: 999,
                  background: active || hov ? C_CHIP_H[i] : C_CHIP[i],
                  border: `1.5px solid ${active ? C[i] : 'transparent'}`,
                  color: C[i], fontSize: 12, fontWeight: active ? 600 : 500,
                  cursor: 'pointer', boxShadow: active ? `0 0 0 3px ${C_CHIP[i]}` : 'none',
                  fontFamily: 'var(--font)',
                }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: C[i], flexShrink: 0, opacity: active ? 1 : 0.75 }} />
                {name}
              </button>
            )
          })}
          {activeCluster !== null && (
            <button onClick={() => setActiveCluster(null)} style={{
              fontSize: 11, color: 'var(--muted)', background: 'transparent',
              border: 'none', cursor: 'pointer', padding: '4px 6px', fontFamily: 'var(--font)',
            }}>✕ 解除</button>
          )}
        </div>

        {/* ── マップカード ── */}
        <div
          ref={mapDivRef}
          style={{
            position: 'absolute', inset: 0,
            background: 'var(--card)',
            overflow: 'hidden', userSelect: 'none',
          }}>
          <svg
            ref={svgRef}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              display: 'block', cursor: isDragging.current ? 'grabbing' : 'grab',
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <defs>
              <clipPath id="map-clip"><rect x={0} y={0} width={svgW} height={svgH} /></clipPath>
              <filter id="ns" x="-60%" y="-60%" width="220%" height="220%">
                <feDropShadow dx="0" dy="1" stdDeviation="2.5" floodColor="rgba(17,24,39,0.16)" />
              </filter>
              <filter id="ns-h" x="-60%" y="-60%" width="220%" height="220%">
                <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="rgba(17,24,39,0.22)" />
              </filter>
              <filter id="ns-focus" x="-60%" y="-60%" width="220%" height="220%">
                <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="rgba(59,130,246,0.5)" />
              </filter>
            </defs>
            <g clipPath="url(#map-clip)">
              <g transform={transform}>
                {/* クラスタ楕円 */}
                {clusterEllipses.map((el, i) => {
                  if (!el) return null
                  const labelW = CLUSTER_NAMES[i].length * 10.5 + 26
                  return (
                    <g key={i} style={{ cursor: 'pointer' }}
                      onClick={e => { e.stopPropagation(); setClusterPanel(clusterPanel === i ? null : i) }}>
                      <ellipse cx={el.cx} cy={el.cy} rx={el.rx} ry={el.ry}
                        fill={C_FILL[i]} stroke={clusterPanel === i ? C[i] : C_STROKE[i]}
                        strokeWidth={clusterPanel === i ? 2 : 1} />
                      <g transform={`translate(${el.cx - el.rx + 8}, ${el.cy - el.ry + 6}) scale(${1/zoom})`}>
                        <rect x={0} y={0} width={labelW} height={20} rx={10}
                          fill="white" stroke={C_STROKE[i]} strokeWidth={1} />
                        <circle cx={10} cy={10} r={3.5} fill={C[i]} />
                        <text x={18} y={14} fontSize={10} fontWeight={600} fill={C[i]}
                          style={{ pointerEvents: 'none' }}>{CLUSTER_NAMES[i]}</text>
                      </g>
                    </g>
                  )
                })}

                {/* ノード */}
                {placed.map(lab => {
                  const color    = lab.cluster_id !== null ? C[lab.cluster_id] : '#94A3B8'
                  const isActive = preview?.id === lab.id
                  const isFocused = focusedLabId === lab.id
                  const isPinned = pins.includes(lab.id)
                  const isMatch  = matchLab(lab)
                  const r = isActive || isFocused ? 13 : 10

                  return (
                    <g key={lab.id} data-node="true" style={{ cursor: 'pointer' }}
                      onMouseEnter={() => {
                        // 消去タイマーをキャンセル
                        if (leaveTimer.current) clearTimeout(leaveTimer.current)
                        // 100ms以上留まったら表示
                        enterTimer.current = setTimeout(() => setPreview(lab), 100)
                      }}
                      onMouseLeave={() => {
                        // 表示タイマーをキャンセル（通過しただけなら表示しない）
                        if (enterTimer.current) clearTimeout(enterTimer.current)
                        // カードにカーソルが移動する時間を150ms与える
                        leaveTimer.current = setTimeout(() => {
                          if (!cardHovered.current) setPreview(null)
                        }, 5000)
                      }}
                      onClick={() => { if (dragMoved.current) return; router.push(`/lab/${lab.id}`) }}
                    >
                      {(isActive || isFocused) && (
                        <circle cx={lab.x} cy={lab.y} r={r + 9}
                          fill="none" stroke={color} strokeWidth={1.5} opacity={0.28} />
                      )}
                      {isPinned && (
                        <circle cx={lab.x} cy={lab.y} r={r + (isActive ? 3 : 2) + 3}
                          fill="none" stroke="#F59E0B" strokeWidth={2} opacity={0.7} />
                      )}
                      <circle
                        cx={lab.x} cy={lab.y} r={r + (isActive || isFocused ? 3 : 2)}
                        fill="white"
                        filter={isFocused ? 'url(#ns-focus)' : isActive ? 'url(#ns-h)' : 'url(#ns)'}
                        opacity={isMatch ? 1 : 0.2}
                      />
                      <circle cx={lab.x} cy={lab.y} r={r} fill={color}
                        opacity={isMatch ? (isActive || isFocused ? 1 : 0.82) : 0.18}
                      />
                      {isPinned && (
                        <text x={lab.x} y={lab.y + 4} textAnchor="middle"
                          fontSize={(isActive ? 11 : 9) / zoom} style={{ pointerEvents: 'none' }}>⭐</text>
                      )}
                      <text
                        x={lab.x} y={lab.y + r + 15}
                        textAnchor="middle" fontSize={10.5 / zoom}
                        fontWeight={isActive || isFocused || isPinned ? 700 : 500}
                        fill={isActive || isFocused ? color : isPinned ? '#92400E' : '#4B5563'}
                        opacity={isMatch ? 1 : 0.18}
                        style={{ pointerEvents: 'none' }}
                      >{lab.name.slice(0, 14)}</text>
                    </g>
                  )
                })}
              </g>
            </g>
          </svg>

          {/* ズームコントロール */}
          <div style={{
            position: 'absolute', bottom: 16, right: 16,
            display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center',
          }}>
            <button className="zoom-btn" onClick={() => applyZoom(zoom + ZOOM_STEP)} disabled={zoom >= MAX_ZOOM}
              style={{
                width: 34, height: 34, borderRadius: 10, background: 'white', border: 'none',
                boxShadow: '0 2px 8px rgba(17,24,39,0.12)', fontSize: 20, color: '#374151',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', fontFamily: 'monospace',
              }}>+</button>
            <div style={{
              width: 34, height: 22, borderRadius: 6, background: 'rgba(255,255,255,0.9)',
              boxShadow: '0 1px 4px rgba(17,24,39,0.08)', fontSize: 10, color: 'var(--muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{Math.round(zoom * 100)}%</div>
            <button className="zoom-btn" onClick={() => applyZoom(zoom - ZOOM_STEP)} disabled={zoom <= MIN_ZOOM}
              style={{
                width: 34, height: 34, borderRadius: 10, background: 'white', border: 'none',
                boxShadow: '0 2px 8px rgba(17,24,39,0.12)', fontSize: 22, color: '#374151',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', fontFamily: 'monospace',
              }}>−</button>
          </div>
          <button className="reset-btn" onClick={() => {
                setFocusedLabId(null)
                const xs = labs.map(l => l.map_x ?? 400)
                const ys = labs.map(l => l.map_y ?? 300)
                doFit(svgW, svgH, xs, ys)
              }}
            style={{
              position: 'absolute', bottom: 16, left: 16,
              fontSize: 11, color: 'var(--muted)', background: 'white', border: 'none',
              borderRadius: 8, padding: '5px 10px',
              boxShadow: '0 2px 8px rgba(17,24,39,0.10)',
              cursor: 'pointer', fontFamily: 'var(--font)', transition: 'background 0.1s',
            }}>リセット</button>

          {/* ── クラスタパネル ── */}
          {clusterPanel !== null && (
            <div style={{
              position: 'absolute', top: 120, left: 16, zIndex: 20,
              width: 280,
              background: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              borderRadius: 14,
              border: `1.5px solid ${C_STROKE[clusterPanel]}`,
              boxShadow: '0 4px 24px rgba(17,24,39,0.10)',
              padding: '16px',
              fontFamily: 'var(--font)',
            }}>
              {/* ヘッダー */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: C[clusterPanel] }} />
                  <span style={{ fontWeight: 700, fontSize: 14, color: C[clusterPanel] }}>
                    {CLUSTER_NAMES[clusterPanel]}
                  </span>
                </div>
                <button onClick={() => setClusterPanel(null)} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 16, color: '#9ca3af', lineHeight: 1, padding: 2,
                }}>✕</button>
              </div>
              {/* 説明文 */}
              <p style={{ fontSize: 12, color: '#4b5563', lineHeight: 1.7, margin: '0 0 12px' }}>
                {CLUSTER_DESC[clusterPanel]}
              </p>
              {/* 所属研究室リスト */}
              <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6, fontWeight: 600 }}>
                所属研究室 {placed.filter(l => l.cluster_id === clusterPanel).length}件
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto' }}>
                {placed.filter(l => l.cluster_id === clusterPanel).map(l => (
                  <button key={l.id} onClick={() => {
                    const t = calcFocusTransform(l.x, l.y, 2, svgW, svgH)
                    setZoom(t.zoom); setOffset(t.offset); setFocusedLabId(l.id)
                    setClusterPanel(null)
                  }} style={{
                    textAlign: 'left', background: 'none', border: 'none',
                    cursor: 'pointer', padding: '4px 6px', borderRadius: 6,
                    fontSize: 12, color: '#374151',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = C_CHIP[clusterPanel])}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    {l.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── プレビューカード（マップ内下部・半透明） ── */}
          {preview && (
            <div style={{
              position: 'absolute', bottom: 16, left: 16, right: 16, zIndex: 10,
              pointerEvents: 'auto',
            }}>
              {renderPreviewCard(preview)}
            </div>
          )}
        </div>


      </main>
    </>
  )
}

// クエリ部分をハイライトするヘルパー
function highlightMatch(text: string, query: string) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: '#DBEAFE', color: '#1D4ED8', borderRadius: 2, padding: '0 1px' }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  )
}