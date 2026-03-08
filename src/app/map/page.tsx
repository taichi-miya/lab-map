'use client'
import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { usePins } from '@/hooks/usePins'
import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs'
import Link from 'next/link'

type Lab = {
  id: string
  name: string
  faculty_name: string | null
  map_x: number | null
  map_y: number | null
  cluster_id: number | null
  dept: string | null
  summary_text: string | null
  tags: string[]
}

type Suggestion = {
  type: 'lab' | 'faculty' | 'tag'
  label: string
  sub?: string
  labId?: string
  matchIds?: string[]
}

type LabCourse = {
  lab_id: string
  undergraduate_dept: string
  course: string
}

type FilterMode = 'course' | 'dept' | 'tag' | null
type MapViewMode = 'global' | 'scoped'

type AnimCoord = {
  x: number
  y: number
  cluster_id: number
}

const C        = ['#3B82F6','#22C55E','#F59E0B','#EF4444','#8B5CF6','#EC4899','#14B8A6','#F97316','#0EA5E9','#A855F7'] as const
const C_FILL   = ['rgba(59,130,246,0.10)','rgba(34,197,94,0.10)','rgba(245,158,11,0.10)','rgba(239,68,68,0.10)','rgba(139,92,246,0.10)','rgba(236,72,153,0.10)','rgba(20,184,166,0.10)','rgba(249,115,22,0.10)','rgba(14,165,233,0.10)','rgba(168,85,247,0.10)']
const C_STROKE = ['rgba(59,130,246,0.35)','rgba(34,197,94,0.35)','rgba(245,158,11,0.35)','rgba(239,68,68,0.35)','rgba(139,92,246,0.35)','rgba(236,72,153,0.35)','rgba(20,184,166,0.35)','rgba(249,115,22,0.35)','rgba(14,165,233,0.35)','rgba(168,85,247,0.35)']
const C_CHIP   = ['rgba(59,130,246,0.12)','rgba(34,197,94,0.12)','rgba(245,158,11,0.12)','rgba(239,68,68,0.12)','rgba(139,92,246,0.12)','rgba(236,72,153,0.12)','rgba(20,184,166,0.12)','rgba(249,115,22,0.12)','rgba(14,165,233,0.12)','rgba(168,85,247,0.12)']
const C_CHIP_H = ['rgba(59,130,246,0.22)','rgba(34,197,94,0.22)','rgba(245,158,11,0.22)','rgba(239,68,68,0.22)','rgba(139,92,246,0.22)','rgba(236,72,153,0.22)','rgba(20,184,166,0.22)','rgba(249,115,22,0.22)','rgba(14,165,233,0.22)','rgba(168,85,247,0.22)']
const CLUSTER_NAMES = ['情報・社会システム','材料プロセス・金属','流体・航空宇宙・計算力学','環境・土木・化学プロセス','ナノ材料・機能デバイス','エネルギーデバイス・ナノ化学','ロボット・医工学・バイオ','計測・イメージング・量子ビーム','通信・光・電子デバイス','原子力・核融合・プラズマ']
const CLUSTER_DESC = [
  '交通・都市計画・社会システム設計から、量子デバイス・スピン材料・通信技術まで、社会基盤と先端情報技術を横断する研究室群。',
  '金属・合金・セラミックスのプロセス設計・組織制御から、生体材料・環境適合材料の開発まで取り組む研究室群。',
  '流体力学・熱流体・燃焼から、航空宇宙推進・空力設計・数値計算力学まで幅広く取り組む研究室群。',
  '津波・地震・地盤工学などの防災技術から、水環境・廃水処理・化学反応プロセスまで取り組む研究室群。',
  'ナノスケールの材料計測・磁性材料・電子デバイス材料の機能設計と評価を行う研究室群。',
  '蓄電池・スピントロニクス・ナノ化学材料など、次世代エネルギーデバイスの創製に取り組む研究室群。',
  'ロボティクス・医療機器・バイオデバイスの開発から、生体機能の計測・神経工学まで取り組む研究室群。',
  '放射線・量子ビームを用いた医用イメージング・がん治療技術と、光通信・信号計測技術を研究する研究室群。',
  '光通信・フォトニクス・無線通信・電子デバイスなど、情報通信を支えるハードウェア技術を研究する研究室群。',
  '核融合・プラズマ制御・原子炉安全から、核燃料・放射線工学まで、原子力エネルギーの全領域を研究する研究室群。',
]
const FILTER_W = 228
const FILTER_BTN_W = 52
const LEGEND_W = 220
const LEGEND_BTN_W = 36
const ZOOM_CTRL_W = 52
const CARD_H_EST = 130
const BOTTOM_PAD = 16

const TOTAL_W = 8000, TOTAL_H = 6400
const MAP_MARGIN = 800
const W = TOTAL_W - MAP_MARGIN * 2
const H = TOTAL_H - MAP_MARGIN * 2
const NODE_MIN_X = MAP_MARGIN
const NODE_MAX_X = MAP_MARGIN + W
const NODE_MIN_Y = MAP_MARGIN
const NODE_MAX_Y = MAP_MARGIN + H
const GRID_SIZE = 200

const MIN_ZOOM_HARD = 0.03
const MAX_ZOOM = 3.0, ZOOM_STEP = 0.25
const LABEL_SHOW_ZOOM = 0.18
const NODE_SHRINK_ZOOM = 0.12

function clampOffset(ox: number, oy: number, zoom: number, svgW = 800, svgH = 600) {
  const PAD = 80
  const minX = Math.min(0, svgW - TOTAL_W * zoom - PAD), maxX = Math.max(0, PAD)
  const minY = Math.min(0, svgH - TOTAL_H * zoom - PAD), maxY = Math.max(0, PAD)
  return { x: Math.min(maxX, Math.max(minX, ox)), y: Math.min(maxY, Math.max(minY, oy)) }
}
function calcFocusTransform(x: number, y: number, targetZoom = 2, svgW = 800, svgH = 600) {
  const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM_HARD, targetZoom))
  return { zoom: clamped, offset: clampOffset(svgW / 2 - x * clamped, svgH / 2 - y * clamped, clamped, svgW, svgH) }
}

function FilterIcon({ active }: { active: boolean }) {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={active ? '#3B82F6' : 'currentColor'} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  )
}

function HamburgerIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  )
}

const FILTER_TABS: { mode: FilterMode; label: string }[] = [
  { mode: 'course', label: '学科/コース' },
  { mode: 'dept',   label: '専攻' },
  { mode: 'tag',    label: 'タグ' },
]

export default function ExplorePage() {
  const { isSignedIn } = useUser()
  const { pins, togglePin, clearPins } = usePins()
  const [labs, setLabs] = useState<Lab[]>([])
  const [preview, setPreview] = useState<{ lab: Lab; pinned: boolean } | null>(null)
  const [query, setQuery] = useState('')
  const [activeCluster, setActiveCluster] = useState<number | null>(null)
  const [chipHover, setChipHover] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [zoom, setZoom] = useState(1)
  const [fitZoom, setFitZoom] = useState(MIN_ZOOM_HARD)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [showPinList, setShowPinList] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const [labCourses, setLabCourses] = useState<LabCourse[]>([])
  const [filterOpen, setFilterOpen] = useState(true)
  const [legendOpen, setLegendOpen] = useState(true)
  const [filterMode, setFilterMode] = useState<FilterMode>('course')

  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set())
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set())
  const [selectedDepts, setSelectedDepts] = useState<Set<string>>(new Set())
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())
  const [tagSearch, setTagSearch] = useState('')

  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [suggIndex, setSuggIndex] = useState(-1)
  const [showSugg, setShowSugg] = useState(false)
  const [focusedLabId, setFocusedLabId] = useState<string | null>(null)
  const [clusterPanel, setClusterPanel] = useState<number | null>(null)

  // ── 再配置関連 ──
  const [mapViewMode, setMapViewMode] = useState<MapViewMode>('global')
  const [animCoords, setAnimCoords] = useState<Record<string, AnimCoord>>({})
  const [isAnimating, setIsAnimating] = useState(false)
  const [scopedLabel, setScopedLabel] = useState('')

  const isDragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const offsetAtDrag = useRef({ x: 0, y: 0 })
  const dragMoved = useRef(false)
  const svgRef = useRef<SVGSVGElement>(null)
  const mapDivRef = useRef<HTMLDivElement>(null)
  const [svgW, setSvgW] = useState(typeof window !== 'undefined' ? window.innerWidth : 800)
  const [svgH, setSvgH] = useState(typeof window !== 'undefined' ? window.innerHeight : 600)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggRef = useRef<HTMLDivElement>(null)
  const enterTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cardHovered = useRef(false)
  const fittedRef = useRef(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const pinListRef = useRef<HTMLDivElement>(null)

  const filterLeftOffset = filterOpen ? FILTER_W + 16 + 8 : FILTER_BTN_W + 16
  const legendRightOffset = legendOpen ? LEGEND_W + 16 + 8 : LEGEND_BTN_W + 16
  const cardVisible = !!preview
  const ZOOM_RIGHT_EDGE = 16 + 34
  const cardRight = legendRightOffset + ZOOM_CTRL_W + 8
  const zoomBottom = (cardVisible && cardRight <= ZOOM_RIGHT_EDGE + 8) ? BOTTOM_PAD + CARD_H_EST + 12 : BOTTOM_PAD

  useEffect(() => {
    const onResize = () => { setSvgW(window.innerWidth); setSvgH(window.innerHeight); fittedRef.current = false }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuOpen && menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
      if (showPinList && pinListRef.current && !pinListRef.current.contains(e.target as Node)) setShowPinList(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen, showPinList])

  useEffect(() => {
    ;(async () => {
      const { data: labData } = await supabase.from('labs').select('id,name,faculty_name,map_x,map_y,cluster_id,dept,summary_text')
      const { data: tagData } = await supabase.from('lab_tags').select('lab_id,tag').limit(10000)
      const { data: courseData } = await supabase.from('lab_courses').select('lab_id,undergraduate_dept,course')
      const tagMap: Record<string, string[]> = {}
      for (const t of tagData ?? []) { if (!tagMap[t.lab_id]) tagMap[t.lab_id] = []; tagMap[t.lab_id].push(t.tag) }
      setLabs((labData ?? []).map(l => ({ ...l, tags: tagMap[l.id] ?? [] })))
      setLabCourses(courseData ?? [])
      setLoading(false)
    })()
  }, [])

  const animFrameRef = useRef<number | null>(null)

  // 即時フィット（初期表示・リサイズ用）
  const doFit = useCallback((w: number, h: number, xs: number[], ys: number[]) => {
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys)
    const PAD = 60
    const z = Math.min((w - PAD * 2) / (maxX - minX), (h - PAD * 2) / (maxY - minY), MAX_ZOOM)
    setFitZoom(z)
    setZoom(z)
    setOffset({ x: w / 2 - ((minX + maxX) / 2) * z, y: h / 2 - ((minY + maxY) / 2) * z })
  }, [])

  // ease-in-out (logistic風) でズーム＋オフセットをアニメーション
  const animateToFit = useCallback((
    w: number, h: number, xs: number[], ys: number[],
    fromZoom: number, fromOffset: { x: number; y: number },
    duration = 800
  ) => {
    const minX = Math.min(...xs), maxX = Math.max(...xs)
    const minY = Math.min(...ys), maxY = Math.max(...ys)
    const PAD = 80
    const toZoom = Math.min((w - PAD * 2) / (maxX - minX), (h - PAD * 2) / (maxY - minY), MAX_ZOOM)
    const toOffset = { x: w / 2 - ((minX + maxX) / 2) * toZoom, y: h / 2 - ((minY + maxY) / 2) * toZoom }

    setFitZoom(toZoom)

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    const start = performance.now()

    // cubic-bezier(0.45,0,0.55,1) ≈ ease-in-out をJS側でも再現
    const easeInOut = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const e = easeInOut(t)
      const z = fromZoom + (toZoom - fromZoom) * e
      const ox = fromOffset.x + (toOffset.x - fromOffset.x) * e
      const oy = fromOffset.y + (toOffset.y - fromOffset.y) * e
      setZoom(z)
      setOffset({ x: ox, y: oy })
      if (t < 1) animFrameRef.current = requestAnimationFrame(tick)
    }
    animFrameRef.current = requestAnimationFrame(tick)
  }, [])

  useEffect(() => {
    if (fittedRef.current || labs.length === 0 || svgW < 100 || svgH < 100) return
    fittedRef.current = true
    doFit(svgW, svgH, labs.map(l => l.map_x != null ? MAP_MARGIN + l.map_x * 2 : MAP_MARGIN + 400), labs.map(l => l.map_y != null ? MAP_MARGIN + l.map_y * 2 : MAP_MARGIN + 300))
  }, [labs, svgW, svgH, doFit])

  useEffect(() => {
    const q = query.trim().toLowerCase()
    if (!q) { setSuggestions([]); setShowSugg(false); setSuggIndex(-1); return }
    const suggs: Suggestion[] = []
    const labMatches = labs.filter(l => l.name.toLowerCase().includes(q)).slice(0, 5)
    for (const l of labMatches) suggs.push({ type: 'lab', label: l.name, sub: l.faculty_name ?? '', labId: l.id })
    const facMatches = labs.filter(l => !labMatches.find(m => m.id === l.id) && (l.faculty_name ?? '').toLowerCase().includes(q)).slice(0, 3)
    for (const l of facMatches) suggs.push({ type: 'faculty', label: l.faculty_name ?? '', sub: l.name, labId: l.id })
    const tagSet = new Map<string, string[]>()
    for (const l of labs) for (const t of l.tags) if (t.toLowerCase().includes(q)) { if (!tagSet.has(t)) tagSet.set(t, []); tagSet.get(t)!.push(l.id) }
    let tc = 0
    for (const [tag, ids] of tagSet) { if (tc >= 4) break; suggs.push({ type: 'tag', label: tag, sub: `${ids.length}件の研究室`, matchIds: ids }); tc++ }
    setSuggestions(suggs); setShowSugg(suggs.length > 0); setSuggIndex(-1)
  }, [query, labs])

  const handleTogglePin = useCallback((id: string, e?: React.MouseEvent) => {
    e?.stopPropagation(); e?.preventDefault()
    togglePin(id)
  }, [togglePin])

  // ── 再配置: 1つだけ選択されているスコープを返す ──
  const getSingleScope = useCallback((): { scope_type: string; scope_value: string; label: string } | null => {
    if (selectedCourses.size === 1 && selectedDepts.size === 0 && selectedTags.size === 0) {
      const key = [...selectedCourses][0]
      const parts = key.split('::')
      const course = parts[1] || parts[0]
      return { scope_type: 'course', scope_value: key, label: course }
    }
    if (selectedDepts.size === 1 && selectedCourses.size === 0 && selectedTags.size === 0) {
      const dept = [...selectedDepts][0]
      return { scope_type: 'grad_dept', scope_value: dept, label: dept }
    }
    return null
  }, [selectedCourses, selectedDepts, selectedTags])

  const singleScope = getSingleScope()

  // ── 再配置実行 ──
  const applyMapView = useCallback(async () => {
    if (!singleScope) return
    setIsAnimating(true)

    const { data } = await supabase
      .from('map_views')
      .select('lab_id, view_x, view_y, cluster_id')
      .eq('scope_type', singleScope.scope_type)
      .eq('scope_value', singleScope.scope_value)

    if (!data || data.length === 0) {
      setIsAnimating(false)
      return
    }

    // スコープ内の座標を小さな領域にコンパクトに収める
    // view_x/view_yはPythonで[240, 2960]×[240, 2160]に正規化済み
    // それをそのままMAP_MARGIN+x*2で使うと広大なマップ全体に散らばる
    // → スコープ内でさらに再正規化して中央付近の狭い領域にまとめる
    const SCOPED_W = 1200  // スコープ表示用の幅（全体8000の15%）
    const SCOPED_H = 900   // スコープ表示用の高さ
    const CENTER_X = TOTAL_W / 2
    const CENTER_Y = TOTAL_H / 2

    const rawXs = data.map((d: { view_x: number }) => d.view_x)
    const rawYs = data.map((d: { view_y: number }) => d.view_y)
    const minX = Math.min(...rawXs), maxX = Math.max(...rawXs)
    const minY = Math.min(...rawYs), maxY = Math.max(...rawYs)
    const rangeX = maxX - minX || 1
    const rangeY = maxY - minY || 1

    const coordMap: Record<string, AnimCoord> = {}
    for (const row of data) {
      // スコープ内で再正規化 → 中央付近の小領域に配置
      const nx = ((row.view_x - minX) / rangeX - 0.5) * SCOPED_W + CENTER_X
      const ny = ((row.view_y - minY) / rangeY - 0.5) * SCOPED_H + CENTER_Y
      coordMap[row.lab_id] = {
        x: nx,
        y: ny,
        cluster_id: row.cluster_id ?? 0,
      }
    }

    setAnimCoords(coordMap)
    setMapViewMode('scoped')
    setScopedLabel(singleScope.label)
    setIsAnimating(false)

    // ノードアニメーション（0.8s）と同時にズーム・オフセットもアニメーション
    const xs = Object.values(coordMap).map(c => c.x)
    const ys = Object.values(coordMap).map(c => c.y)
    animateToFit(svgW, svgH, xs, ys, zoom, offset, 800)
  }, [singleScope, svgW, svgH, doFit, animateToFit, zoom, offset])

  // ── 全体マップに戻す ──
  const resetMapView = useCallback(() => {
    setMapViewMode('global')
    setScopedLabel('')
    setAnimCoords({})
    fittedRef.current = false
    // ノードが元位置へ戻るアニメーション（0.8s）と同時にズームも戻す
    const xs = labs.map(l => l.map_x != null ? MAP_MARGIN + l.map_x * 2 : MAP_MARGIN + 400)
    const ys = labs.map(l => l.map_y != null ? MAP_MARGIN + l.map_y * 2 : MAP_MARGIN + 300)
    animateToFit(svgW, svgH, xs, ys, zoom, offset, 800)
  }, [svgW, svgH, labs, animateToFit, zoom, offset])

  // ── placed: animCoordsがあればそちらの座標・cluster_idを使う ──
  const placed = labs.map((lab, i) => {
    const anim = animCoords[lab.id]
    return {
      ...lab,
      cluster_id: anim ? anim.cluster_id : lab.cluster_id,
      x: anim
        ? anim.x
        : lab.map_x != null
          ? Math.min(NODE_MAX_X, Math.max(NODE_MIN_X, MAP_MARGIN + lab.map_x * 2))
          : MAP_MARGIN + 100 + (i % 5) * 130,
      y: anim
        ? anim.y
        : lab.map_y != null
          ? Math.min(NODE_MAX_Y, Math.max(NODE_MIN_Y, MAP_MARGIN + lab.map_y * 2))
          : MAP_MARGIN + 100 + Math.floor(i / 5) * 120,
    }
  })
  const pinnedLabs = placed.filter(l => pins.includes(l.id))

  const visibleLabelIds = useMemo(() => {
    if (zoom < LABEL_SHOW_ZOOM) return new Set<string>()
    const labelW = (name: string) => Math.min(name.length, 14) * 7.5
    const labelH = 14
    const pad = 6
    const sorted = [...placed].sort((a, b) => { const ap = pins.includes(a.id) ? 0 : 1; const bp = pins.includes(b.id) ? 0 : 1; return ap - bp })
    const shown = new Set<string>()
    const boxes: { x1: number; y1: number; x2: number; y2: number }[] = []
    for (const lab of sorted) {
      const lw = labelW(lab.name) / zoom, lh = labelH / zoom
      const lx = lab.x - lw / 2, ly = lab.y + (13 / zoom), p = pad / zoom
      const overlaps = boxes.some(b => lx - p < b.x2 && lx + lw + p > b.x1 && ly - p < b.y2 && ly + lh + p > b.y1)
      if (!overlaps) { shown.add(lab.id); boxes.push({ x1: lx, y1: ly, x2: lx + lw, y2: ly + lh }) }
    }
    return shown
  }, [placed, zoom, pins])

  const commitSuggestion = useCallback((s: Suggestion) => {
    setShowSugg(false); setSuggIndex(-1)
    if (s.type === 'lab' || s.type === 'faculty') {
      const lab = placed.find(p => p.id === s.labId)
      if (lab) { const { zoom: z, offset: o } = calcFocusTransform(lab.x, lab.y, 2, svgW, svgH); setZoom(z); setOffset(o); setFocusedLabId(lab.id); setPreview({ lab, pinned: true }); setQuery(s.label) }
    } else if (s.type === 'tag') { setQuery(s.label); setFocusedLabId(null) }
  }, [placed, svgW, svgH])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSugg) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setSuggIndex(i => Math.min(i + 1, suggestions.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSuggIndex(i => Math.max(i - 1, -1)) }
    else if (e.key === 'Enter') { e.preventDefault(); if (suggestions.length > 0) commitSuggestion(suggIndex >= 0 ? suggestions[suggIndex] : suggestions[0]) }
    else if (e.key === 'Escape') { setShowSugg(false); setSuggIndex(-1) }
  }

  const deptCourseMap = new Map<string, string[]>()
  for (const c of labCourses) {
    if (!deptCourseMap.has(c.undergraduate_dept)) deptCourseMap.set(c.undergraduate_dept, [])
    const cs = deptCourseMap.get(c.undergraduate_dept)!
    if (!cs.includes(c.course)) cs.push(c.course)
  }
  const deptList = [...deptCourseMap.keys()]
  const deptNameList = [...new Set(labs.map(l => l.dept).filter(Boolean) as string[])].sort()
  const allTags = [...new Set(labs.flatMap(l => l.tags))].sort()
  const filteredTags = tagSearch ? allTags.filter(t => t.toLowerCase().includes(tagSearch.toLowerCase())) : allTags

  const toggleDeptExpand = (dept: string) => setExpandedDepts(prev => { const n = new Set(prev); n.has(dept) ? n.delete(dept) : n.add(dept); return n })
  const toggleCourse = (dept: string, course: string) => { const key = `${dept}::${course}`; setSelectedCourses(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n }) }
  const toggleAllCourses = (dept: string) => {
    const keys = (deptCourseMap.get(dept) ?? []).map(c => `${dept}::${c}`)
    const allSel = keys.every(k => selectedCourses.has(k))
    setSelectedCourses(prev => { const n = new Set(prev); allSel ? keys.forEach(k => n.delete(k)) : keys.forEach(k => n.add(k)); return n })
  }
  const toggleDept = (dept: string) => setSelectedDepts(prev => { const n = new Set(prev); n.has(dept) ? n.delete(dept) : n.add(dept); return n })
  const toggleTag = (tag: string) => setSelectedTags(prev => { const n = new Set(prev); n.has(tag) ? n.delete(tag) : n.add(tag); return n })
  const clearFilter = () => { setSelectedCourses(new Set()); setSelectedDepts(new Set()); setSelectedTags(new Set()) }

  const hasCourseFilter = selectedCourses.size > 0
  const hasDeptFilter   = selectedDepts.size > 0
  const hasTagFilter    = selectedTags.size > 0
  const hasFilter = hasCourseFilter || hasDeptFilter || hasTagFilter
  const filterCount = selectedCourses.size + selectedDepts.size + selectedTags.size

  const switchMode = (mode: FilterMode) => {
    if (mode === filterMode) return
    if ((mode === 'course' && hasDeptFilter) || (mode === 'dept' && hasCourseFilter)) { setSelectedCourses(new Set()); setSelectedDepts(new Set()) }
    setFilterMode(mode)
  }

  const matchLab = useCallback((lab: Lab) => {
    if (activeCluster !== null && lab.cluster_id !== activeCluster) return false
    if (hasCourseFilter) { const ok = labCourses.some(c => c.lab_id === lab.id && selectedCourses.has(`${c.undergraduate_dept}::${c.course}`)); if (!ok) return false }
    if (hasDeptFilter) { if (!lab.dept || !selectedDepts.has(lab.dept)) return false }
    if (hasTagFilter) { const ok = lab.tags.some(t => selectedTags.has(t)); if (!ok) return false }
    if (!query) return true
    const q = query.toLowerCase()
    return lab.name.toLowerCase().includes(q) || (lab.faculty_name ?? '').toLowerCase().includes(q) || lab.tags.some(t => t.toLowerCase().includes(q))
  }, [query, activeCluster, selectedCourses, selectedDepts, selectedTags, labCourses, hasCourseFilter, hasDeptFilter, hasTagFilter])

  const getLabCourseInfo = (labId: string) => {
    const entries = labCourses.filter(c => c.lab_id === labId)
    if (entries.length === 0) return null
    return { depts: [...new Set(entries.map(c => c.undergraduate_dept))], courses: [...new Set(entries.map(c => c.course))] }
  }

  const clusterEllipses = CLUSTER_NAMES.map((_, ci) => {
    const pts = placed.filter(l => l.cluster_id === ci)
    if (pts.length < 2) return null
    const xs = pts.map(p => p.x), ys = pts.map(p => p.y)
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2
    return { cx, cy, rx: (Math.max(...xs) - Math.min(...xs)) / 2 + 80, ry: (Math.max(...ys) - Math.min(...ys)) / 2 + 80 }
  })

  const applyZoom = (newZoom: number) => {
    const clamped = Math.min(MAX_ZOOM, Math.max(fitZoom, newZoom))
    const cx = svgW / 2, cy = svgH / 2
    setZoom(clamped)
    setOffset(clampOffset(cx - (cx - offset.x) * (clamped / zoom), cy - (cy - offset.y) * (clamped / zoom), clamped, svgW, svgH))
  }

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if ((e.target as Element).closest('g[data-node]')) return
    isDragging.current = true; dragMoved.current = false
    dragStart.current = { x: e.clientX, y: e.clientY }; offsetAtDrag.current = { ...offset }
  }
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging.current) return
    const dx = e.clientX - dragStart.current.x, dy = e.clientY - dragStart.current.y
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragMoved.current = true
    setOffset(clampOffset(offsetAtDrag.current.x + dx, offsetAtDrag.current.y + dy, zoom, svgW, svgH))
  }
  const handleMouseUp = () => { isDragging.current = false }

  const handleWheel = useCallback((e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault()
    const rect = svgRef.current?.getBoundingClientRect(); if (!rect) return
    const mx = e.clientX - rect.left, my = e.clientY - rect.top
    const newZoom = Math.min(MAX_ZOOM, Math.max(fitZoom, zoom + (e.deltaY > 0 ? -0.06 : 0.06)))
    setZoom(newZoom)
    setOffset(clampOffset(mx - (mx - offset.x) * (newZoom / zoom), my - (my - offset.y) * (newZoom / zoom), newZoom, svgW, svgH))
  }, [zoom, fitZoom, offset, svgW, svgH])

  const transform = `translate(${offset.x},${offset.y}) scale(${zoom})`
  const matchCount = placed.filter(l => matchLab(l)).length

  if (loading) return (
    <main style={{ background: '#FAFAF7' }} className="flex items-center justify-center h-screen">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
        <p style={{ color: '#6B7280' }} className="text-sm">読み込み中...</p>
      </div>
    </main>
  )

  const renderPreviewCard = (item: { lab: Lab; pinned: boolean }) => {
    const { lab, pinned } = item
    const ci = lab.cluster_id ?? 0
    const color = lab.cluster_id !== null ? C[ci] : '#94A3B8'
    const chipBg = lab.cluster_id !== null ? C_CHIP[ci] : 'rgba(148,163,184,0.12)'
    const chipColor = lab.cluster_id !== null ? C[ci] : '#64748B'
    const strokeColor = lab.cluster_id !== null ? C_STROKE[ci] : 'rgba(148,163,184,0.35)'
    const clusterName = lab.cluster_id !== null ? CLUSTER_NAMES[ci] : '未分類'
    const isPinned = pins.includes(lab.id)
    const courseInfo = getLabCourseInfo(lab.id)
    const facultyNames = lab.faculty_name ? lab.faculty_name.split(/[、,，]/).map(s => s.trim()).filter(Boolean) : []
    return (
      <div style={{ animation: 'slideUpOuter 0.15s ease forwards' }}
        onMouseEnter={() => { cardHovered.current = true; if (leaveTimer.current) clearTimeout(leaveTimer.current) }}
        onMouseLeave={() => { cardHovered.current = false; if (!preview?.pinned) { leaveTimer.current = setTimeout(() => setPreview(null), 2000) } }}>
        <div style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderRadius: 16, border: `1.5px solid ${pinned ? color : strokeColor}`, boxShadow: `0 4px 24px rgba(17,24,39,${pinned ? '0.18' : '0.14'})`, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 600, color: chipColor, background: chipBg, padding: '2px 9px 2px 6px', borderRadius: 999 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />{clusterName}
              </span>
            </div>
            <p style={{ fontSize: 15, fontWeight: 700, margin: '0 0 4px', color: 'var(--text)', lineHeight: 1.3 }}>{lab.name}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 7 }}>
              {facultyNames.length > 0 && <p style={{ fontSize: 11, color: 'var(--muted)', margin: 0, lineHeight: 1.4 }}><span style={{ color: '#9CA3AF', fontWeight: 600, marginRight: 4 }}>教員</span>{facultyNames.join('、')}</p>}
              {courseInfo && <p style={{ fontSize: 11, color: 'var(--muted)', margin: 0, lineHeight: 1.4 }}><span style={{ color: '#9CA3AF', fontWeight: 600, marginRight: 4 }}>学科/コース</span>{courseInfo.depts.map((d, i) => <span key={i}>{d}{courseInfo.courses.length > 0 && <span style={{ color: '#A5B4FC' }}> {courseInfo.courses.slice(0, 2).join(' / ')}</span>}{i < courseInfo.depts.length - 1 && '、'}</span>)}</p>}
              {lab.dept && <p style={{ fontSize: 11, color: 'var(--muted)', margin: 0, lineHeight: 1.4 }}><span style={{ color: '#9CA3AF', fontWeight: 600, marginRight: 4 }}>大学院</span>{lab.dept}</p>}
            </div>
            {lab.tags.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>{lab.tags.slice(0, 5).map((t, i) => <span key={i} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: chipBg, color: chipColor, fontWeight: 500 }}>{t}</span>)}</div>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {pinned && <button onClick={() => setPreview(null)} title="カードを閉じる" style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: '#F3F4F6', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280', transition: 'background 0.15s' }} onMouseEnter={e => (e.currentTarget.style.background = '#E5E7EB')} onMouseLeave={e => (e.currentTarget.style.background = '#F3F4F6')}>✕</button>}
            <button onClick={(e) => handleTogglePin(lab.id, e)} title={isPinned ? 'ピンを外す' : 'ピン留め'} style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: isPinned ? '#FEF9C3' : '#F3F4F6', cursor: 'pointer', fontSize: 17, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s,transform 0.1s' }} onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.12)')} onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>{isPinned ? '⭐' : '☆'}</button>
            <Link href={`/lab/${lab.id}`} className="detail-btn" style={{ display: 'inline-block', padding: '9px 18px', borderRadius: 10, background: color, color: 'white', fontSize: 13, fontWeight: 600, textDecoration: 'none', letterSpacing: '0.01em', whiteSpace: 'nowrap', transition: 'opacity 0.15s' }}>詳細を見る →</Link>
          </div>
        </div>
      </div>
    )
  }

  const suggIcon = (type: Suggestion['type']) => type === 'lab' ? <span style={{ fontSize: 14 }}>🏛</span> : type === 'faculty' ? <span style={{ fontSize: 14 }}>👤</span> : <span style={{ fontSize: 14 }}>🏷</span>

  const renderFilterContent = () => {
    if (filterMode === 'course') {
      return (
        <>
          {hasDeptFilter && <div style={{ padding: '6px 10px', background: 'rgba(239,68,68,0.06)', margin: '0 8px 6px', borderRadius: 8, fontSize: 11, color: '#EF4444' }}>⚠ 専攻フィルター選択中。切り替えるとリセットされます。</div>}
          {deptList.map(dept => {
            const courses = deptCourseMap.get(dept) ?? [], isExpanded = expandedDepts.has(dept)
            const selCount = courses.filter(c => selectedCourses.has(`${dept}::${c}`)).length
            const allSel = selCount === courses.length && courses.length > 0
            return (
              <div key={dept}>
                <div className="dept-row" onClick={() => toggleDeptExpand(dept)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid rgba(229,231,235,0.5)' }}>
                  <span style={{ fontSize: 10, color: '#9CA3AF', flexShrink: 0, display: 'inline-block', transition: 'transform 0.15s', transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}>▼</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: selCount > 0 ? '#3B82F6' : 'var(--text)', flex: 1, lineHeight: 1.3 }}>{dept}</span>
                  {selCount > 0 && <span style={{ fontSize: 10, background: '#3B82F6', color: 'white', borderRadius: 999, padding: '1px 6px', flexShrink: 0 }}>{selCount}</span>}
                </div>
                {isExpanded && (
                  <div style={{ background: 'rgba(249,250,251,0.8)' }}>
                    <label className="course-row" onClick={e => { e.preventDefault(); toggleAllCourses(dept) }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px 6px 28px', cursor: 'pointer', borderBottom: '1px solid rgba(229,231,235,0.3)' }}>
                      <input type="checkbox" checked={allSel} onChange={() => toggleAllCourses(dept)} style={{ accentColor: '#3B82F6', width: 13, height: 13, flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: '#6B7280', fontWeight: 600 }}>全コース 選択/解除</span>
                    </label>
                    {courses.map(course => {
                      const key = `${dept}::${course}`, checked = selectedCourses.has(key)
                      return (
                        <label key={course} className="course-row" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px 6px 28px', cursor: 'pointer', background: checked ? 'rgba(59,130,246,0.06)' : 'transparent' }}>
                          <input type="checkbox" checked={checked} onChange={() => toggleCourse(dept, course)} style={{ accentColor: '#3B82F6', width: 13, height: 13, flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: checked ? '#3B82F6' : 'var(--text)', fontWeight: checked ? 600 : 400, lineHeight: 1.3 }}>{course}</span>
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </>
      )
    }
    if (filterMode === 'dept') {
      return (
        <>
          {hasCourseFilter && <div style={{ padding: '6px 10px', background: 'rgba(239,68,68,0.06)', margin: '0 8px 6px', borderRadius: 8, fontSize: 11, color: '#EF4444' }}>⚠ 学科/コースフィルター選択中。切り替えるとリセットされます。</div>}
          {deptNameList.map(dept => {
            const checked = selectedDepts.has(dept)
            return (
              <label key={dept} className="course-row" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', cursor: 'pointer', background: checked ? 'rgba(59,130,246,0.06)' : 'transparent', borderBottom: '1px solid rgba(229,231,235,0.3)' }}>
                <input type="checkbox" checked={checked} onChange={() => toggleDept(dept)} style={{ accentColor: '#3B82F6', width: 13, height: 13, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: checked ? '#3B82F6' : 'var(--text)', fontWeight: checked ? 600 : 400, lineHeight: 1.3 }}>{dept}</span>
              </label>
            )
          })}
        </>
      )
    }
    if (filterMode === 'tag') {
      return (
        <>
          <div style={{ padding: '8px 10px', borderBottom: '1px solid rgba(229,231,235,0.5)', flexShrink: 0 }}>
            <input type="text" placeholder="タグを検索..." value={tagSearch} onChange={e => setTagSearch(e.target.value)} style={{ width: '100%', padding: '6px 10px', fontSize: 12, borderRadius: 8, border: '1.5px solid var(--border)', background: 'white', color: 'var(--text)', fontFamily: 'var(--font)', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          {filteredTags.map(tag => {
            const checked = selectedTags.has(tag), count = labs.filter(l => l.tags.includes(tag)).length
            return (
              <label key={tag} className="course-row" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', cursor: 'pointer', background: checked ? 'rgba(59,130,246,0.06)' : 'transparent', borderBottom: '1px solid rgba(229,231,235,0.2)' }}>
                <input type="checkbox" checked={checked} onChange={() => toggleTag(tag)} style={{ accentColor: '#3B82F6', width: 13, height: 13, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: checked ? '#3B82F6' : 'var(--text)', fontWeight: checked ? 600 : 400, flex: 1 }}>{tag}</span>
                <span style={{ fontSize: 10, color: '#9CA3AF', flexShrink: 0 }}>{count}</span>
              </label>
            )
          })}
        </>
      )
    }
    return null
  }

  return (
    <>
      <style>{`
        :root{--bg:#FAFAF7;--card:#FFFFFF;--text:#1F2937;--muted:#6B7280;--border:#E5E7EB;--shadow:rgba(17,24,39,0.08);--font:'Hiragino Kaku Gothic ProN','Hiragino Sans','Noto Sans JP',sans-serif;}
        html,body{height:100%;margin:0;}
        body{background:var(--bg);font-family:var(--font);color:var(--text);margin:0;}
        @keyframes slideUpOuter{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeInDown{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideInRight{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}
        @keyframes pulseBlue{0%,100%{box-shadow:0 0 0 0 rgba(59,130,246,0.4)}50%{box-shadow:0 0 0 6px rgba(59,130,246,0)}}
        .zoom-btn{transition:background .1s,transform .1s}
        .zoom-btn:hover:not(:disabled){background:#F3F4F6!important;transform:scale(1.06)}
        .zoom-btn:disabled{opacity:.3!important;cursor:not-allowed!important}
        .chip-btn{transition:background .15s,box-shadow .15s}
        .reset-btn:hover{background:#F9FAFB!important}
        .detail-btn:hover{opacity:.88}
        .pin-item:hover{background:#F9FAFB!important}
        .sugg-item{transition:background .1s}
        .sugg-item:hover{background:#F9FAFB}
        .dept-row:hover{background:rgba(0,0,0,.03)!important}
        .course-row:hover{background:rgba(59,130,246,.05)!important}
        .filter-fab:hover{box-shadow:0 4px 16px rgba(17,24,39,.18)!important}
        .filter-tab{transition:background .15s,color .15s;cursor:pointer;border:none;font-family:var(--font);}
        .menu-item:hover{background:rgba(59,130,246,0.06)!important}
        .hamburger-btn:hover{background:#F3F4F6!important}
        .remap-btn:hover{opacity:.88!important;transform:translateY(-1px)}
        .remap-btn{transition:opacity .15s,transform .15s}
        .remap-btn:disabled{opacity:.5!important;cursor:not-allowed!important;transform:none}
        .node-circle{transition:cx 0.8s cubic-bezier(0.45,0,0.55,1),cy 0.8s cubic-bezier(0.45,0,0.55,1)}
      `}</style>

      <main style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
        {/* ── ヘッダー ── */}
        <header style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', padding: '10px 16px 8px', background: 'rgba(250,250,247,0.88)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(229,231,235,0.6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 21, fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--text)', margin: 0, lineHeight: 1.25 }}>東北大学 研究室マップ</h1>
              <p style={{ fontSize: 12, color: 'var(--muted)', margin: '5px 0 0', lineHeight: 1.6 }}>
                {mapViewMode === 'scoped'
                  ? <><span style={{ color: '#3B82F6', fontWeight: 700 }}>✦ {scopedLabel}</span> の研究室を絞り込んで再配置中</>
                  : '研究概要の類似度で研究室を配置。近いほど研究内容が似ています。'}
              </p>
            </div>
            {/* ページ切替タブ */}
            <div style={{ display: 'flex', gap: 3, background: '#F3F4F6', borderRadius: 9, padding: 3, flexShrink: 0 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 6, fontSize: 12, fontWeight: 700, color: '#1F2937', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                🗺 マップ
              </span>
              <Link href="/cards" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 6, fontSize: 12, fontWeight: 500, color: '#6B7280', textDecoration: 'none', transition: 'background .15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.04)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                ☰ カード
              </Link>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {/* 検索バー */}
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'relative' }}>
                <svg style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 1 }} width={14} height={14} viewBox="0 0 20 20" fill="none">
                  <circle cx="8.5" cy="8.5" r="5.5" stroke="#9CA3AF" strokeWidth="1.8"/><path d="M13 13l3.5 3.5" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
                <input ref={inputRef} type="text" placeholder="研究室名・教員名・タグで検索..." value={query}
                  onChange={e => { setQuery(e.target.value); setFocusedLabId(null) }}
                  onKeyDown={handleKeyDown} onFocus={() => { if (suggestions.length > 0) setShowSugg(true) }}
                  style={{ width: 240, paddingLeft: 32, paddingRight: query ? 28 : 12, paddingTop: 9, paddingBottom: 9, fontSize: 13, borderRadius: 10, border: `1.5px solid ${showSugg ? '#93C5FD' : 'var(--border)'}`, background: 'var(--card)', color: 'var(--text)', outline: 'none', boxShadow: '0 1px 4px var(--shadow)', fontFamily: 'var(--font)', transition: 'border-color .15s' }}
                  onBlur={() => setTimeout(() => setShowSugg(false), 150)} />
                {query && <button onClick={() => { setQuery(''); setFocusedLabId(null); setShowSugg(false); inputRef.current?.focus() }} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#9CA3AF', padding: 2, lineHeight: 1 }}>✕</button>}
              </div>
              {showSugg && suggestions.length > 0 && (
                <div ref={suggRef} style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, width: 300, zIndex: 60, background: 'white', borderRadius: 12, border: '1px solid var(--border)', boxShadow: '0 8px 24px rgba(17,24,39,0.12)', overflow: 'hidden', animation: 'fadeInDown 0.12s ease' }}>
                  {(['lab','faculty','tag'] as const).map(type => {
                    const group = suggestions.filter(s => s.type === type)
                    if (!group.length) return null
                    return (
                      <div key={type}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', padding: '8px 12px 4px', letterSpacing: '0.06em' }}>{type === 'lab' ? '研究室' : type === 'faculty' ? '教員' : 'タグ'}</div>
                        {group.map((s, i) => {
                          const globalIdx = suggestions.indexOf(s), isSel = suggIndex === globalIdx
                          return (
                            <div key={i} className="sugg-item" onMouseDown={() => commitSuggestion(s)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', cursor: 'pointer', background: isSel ? '#EFF6FF' : 'white', borderLeft: isSel ? '2px solid #3B82F6' : '2px solid transparent' }}>
                              {suggIcon(s.type)}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: 13, fontWeight: 600, margin: 0, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{highlightMatch(s.label, query)}</p>
                                {s.sub && <p style={{ fontSize: 11, color: 'var(--muted)', margin: 0 }}>{s.sub}</p>}
                              </div>
                              {(s.type === 'lab' || s.type === 'faculty') && <span style={{ fontSize: 10, color: '#9CA3AF', flexShrink: 0 }}>ズーム →</span>}
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                  <div style={{ padding: '6px 12px', fontSize: 10, color: '#9CA3AF', borderTop: '1px solid #F3F4F6', display: 'flex', gap: 12 }}>
                    <span>↑↓ 選択</span><span>Enter 確定</span><span>Esc 閉じる</span>
                  </div>
                </div>
              )}
            </div>

            {/* ピン */}
            <div ref={pinListRef} style={{ position: 'relative' }}>
              <button onClick={() => { setShowPinList(v => !v); setMenuOpen(false) }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 13px', borderRadius: 10, border: 'none', background: pins.length > 0 ? '#FEF9C3' : '#F3F4F6', color: pins.length > 0 ? '#92400E' : 'var(--muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 1px 4px var(--shadow)', fontFamily: 'var(--font)', transition: 'background .15s' }}>
                <span style={{ fontSize: 16 }}>{pins.length > 0 ? '⭐' : '☆'}</span>{pins.length > 0 ? `${pins.length}件` : 'ピン'}
              </button>
              {showPinList && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 300, zIndex: 70, background: 'white', borderRadius: 14, border: '1px solid var(--border)', boxShadow: '0 8px 28px rgba(17,24,39,0.12)', overflow: 'hidden', animation: 'fadeIn 0.12s ease' }}>
                  <div style={{ padding: '10px 14px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>⭐ ピン留め（{pins.length}件）</span>
                    {pins.length > 0 && <button onClick={clearPins} style={{ fontSize: 11, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', fontFamily: 'var(--font)' }}>全て外す</button>}
                  </div>
                  {pins.length === 0 ? <p style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', padding: '20px 0', margin: 0 }}>研究室の ☆ を押してピン留めできます</p> : (
                    <ul style={{ listStyle: 'none', margin: 0, padding: '4px 0', maxHeight: 300, overflowY: 'auto' }}>
                      {pinnedLabs.map(lab => {
                        const color = lab.cluster_id !== null ? C[lab.cluster_id] : '#94A3B8'
                        return (
                          <li key={lab.id}>
                            <div className="pin-item" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: 'white', transition: 'background .1s' }}>
                              <span style={{ width: 9, height: 9, borderRadius: '50%', background: color, flexShrink: 0 }} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <Link href={`/lab/${lab.id}`} style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} onClick={() => setShowPinList(false)}>{lab.name}</Link>
                                <p style={{ fontSize: 11, color: 'var(--muted)', margin: 0 }}>{lab.faculty_name}</p>
                              </div>
                              <button onClick={() => handleTogglePin(lab.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#D97706', padding: '2px 4px', flexShrink: 0 }}>⭐</button>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* ハンバーガーメニュー */}
            <div ref={menuRef} style={{ position: 'relative' }}>
              <button className="hamburger-btn" onClick={() => { setMenuOpen(v => !v); setShowPinList(false) }} style={{ width: 38, height: 38, borderRadius: 10, border: 'none', background: menuOpen ? '#F3F4F6' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280', transition: 'background 0.15s', fontFamily: 'var(--font)' }}>
                <HamburgerIcon />
              </button>
              {menuOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 210, zIndex: 70, background: 'white', borderRadius: 14, border: '1px solid var(--border)', boxShadow: '0 8px 28px rgba(17,24,39,0.12)', overflow: 'hidden', animation: 'slideInRight 0.12s ease' }}>
                  <div style={{ padding: '8px 0' }}>
                    {/* 認証セクション */}
                    <div style={{ padding: '6px 14px 8px', borderBottom: '1px solid var(--border)' }}>
                      {isSignedIn ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <UserButton afterSignOutUrl="/" />
                          <div style={{ fontSize: 12, color: '#6B7280' }}>アカウント設定</div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <p style={{ fontSize: 11, color: '#9CA3AF', margin: '0 0 4px' }}>ログインするとピン留めを保存できます</p>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <SignInButton mode="modal">
                              <button onClick={() => setMenuOpen(false)} style={{ flex: 1, padding: '7px 0', fontSize: 12, fontWeight: 600, borderRadius: 8, border: '1.5px solid #E5E7EB', background: 'white', color: '#374151', cursor: 'pointer', fontFamily: 'var(--font)' }}>ログイン</button>
                            </SignInButton>
                            <SignUpButton mode="modal">
                              <button onClick={() => setMenuOpen(false)} style={{ flex: 1, padding: '7px 0', fontSize: 12, fontWeight: 700, borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#3B82F6,#6366F1)', color: 'white', cursor: 'pointer', fontFamily: 'var(--font)' }}>新規登録</button>
                            </SignUpButton>
                          </div>
                        </div>
                      )}
                    </div>
                    <div style={{ padding: '6px 14px 4px', fontSize: 10, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.06em' }}>メニュー</div>
                    <Link href="/cards" onClick={() => setMenuOpen(false)} className="menu-item" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', textDecoration: 'none', color: '#1F2937', transition: 'background 0.1s' }}>
                      <span style={{ fontSize: 16, flexShrink: 0 }}>☰</span><div><div style={{ fontSize: 13, fontWeight: 600 }}>カード一覧</div><div style={{ fontSize: 11, color: '#9CA3AF' }}>リスト形式で閲覧</div></div>
                    </Link>
                    <Link href="/contact?type=correction" onClick={() => setMenuOpen(false)} className="menu-item" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', textDecoration: 'none', color: '#1F2937', transition: 'background 0.1s' }}>
                      <span style={{ fontSize: 16, flexShrink: 0 }}>📝</span><div><div style={{ fontSize: 13, fontWeight: 600 }}>情報修正依頼</div><div style={{ fontSize: 11, color: '#9CA3AF' }}>研究室情報の誤りを報告</div></div>
                    </Link>
                    <Link href="/contact?type=feature" onClick={() => setMenuOpen(false)} className="menu-item" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', textDecoration: 'none', color: '#1F2937', transition: 'background 0.1s' }}>
                      <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span><div><div style={{ fontSize: 13, fontWeight: 600 }}>新機能を要望する</div><div style={{ fontSize: 11, color: '#9CA3AF' }}>アイデアを送る</div></div>
                    </Link>
                    <Link href="/contact" onClick={() => setMenuOpen(false)} className="menu-item" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', textDecoration: 'none', color: '#1F2937', transition: 'background 0.1s' }}>
                      <span style={{ fontSize: 16, flexShrink: 0 }}>💬</span><div><div style={{ fontSize: 13, fontWeight: 600 }}>お問い合わせ</div><div style={{ fontSize: 11, color: '#9CA3AF' }}>不具合報告・ご意見など</div></div>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── マップ ── */}
        <div ref={mapDivRef} style={{ position: 'absolute', inset: 0, background: 'var(--card)', overflow: 'hidden', userSelect: 'none' }}>
          <svg ref={svgRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', cursor: isDragging.current ? 'grabbing' : 'grab' }}
            onMouseDown={handleMouseDown} onMouseMove={handleMouseMove}
            onMouseUp={e => { handleMouseUp(); if (!dragMoved.current) { const target = e.target as Element; if (!target.closest('g[data-node]') && !target.closest('g[data-ellipse]')) setClusterPanel(null) } }}
            onMouseLeave={handleMouseUp} onWheel={handleWheel}>
            <defs>
              <clipPath id="map-clip"><rect x={0} y={0} width={svgW} height={svgH} /></clipPath>
              <filter id="ns" x="-60%" y="-60%" width="220%" height="220%"><feDropShadow dx="0" dy="1" stdDeviation="2.5" floodColor="rgba(17,24,39,0.16)" /></filter>
              <filter id="ns-h" x="-60%" y="-60%" width="220%" height="220%"><feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="rgba(17,24,39,0.22)" /></filter>
              <filter id="ns-focus" x="-60%" y="-60%" width="220%" height="220%"><feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="rgba(59,130,246,0.5)" /></filter>
            </defs>
            <g clipPath="url(#map-clip)">
              <g transform={transform}>
                <rect x={0} y={0} width={TOTAL_W} height={TOTAL_H} fill="rgba(248,250,252,0.7)" />
                {(() => {
                  const lines = [], lw = 1 / zoom
                  for (let x = 0; x <= TOTAL_W; x += GRID_SIZE) lines.push(<line key={`vl${x}`} x1={x} y1={0} x2={x} y2={TOTAL_H} stroke="rgba(180,190,200,0.30)" strokeWidth={lw} />)
                  for (let y = 0; y <= TOTAL_H; y += GRID_SIZE) lines.push(<line key={`hl${y}`} x1={0} y1={y} x2={TOTAL_W} y2={y} stroke="rgba(180,190,200,0.30)" strokeWidth={lw} />)
                  return lines
                })()}
                {clusterEllipses.map((el, i) => {
                  if (!el) return null
                  // scoped時は楕円非表示
                  if (mapViewMode === 'scoped') return null
                  const labelW = CLUSTER_NAMES[i].length * 10.5 + 26
                  return (
                    <g key={i} data-ellipse="true" style={{ cursor: 'pointer' }} onClick={e => { e.stopPropagation(); setClusterPanel(clusterPanel === i ? null : i) }}>
                      <ellipse cx={el.cx} cy={el.cy} rx={el.rx} ry={el.ry} fill={C_FILL[i]} stroke={clusterPanel === i ? C[i] : C_STROKE[i]} strokeWidth={clusterPanel === i ? 2 : 1} />
                      <g transform={`translate(${el.cx},${el.cy - el.ry + 4}) scale(${1/zoom})`}>
                        <rect x={-(labelW/2)} y={-10} width={labelW} height={20} rx={10} fill="white" stroke={C_STROKE[i]} strokeWidth={1} />
                        <circle cx={-(labelW/2) + 10} cy={0} r={3.5} fill={C[i]} />
                        <text x={-(labelW/2) + 18} y={4} fontSize={10} fontWeight={600} fill={C[i]} style={{ pointerEvents: 'none' }}>{CLUSTER_NAMES[i]}</text>
                      </g>
                    </g>
                  )
                })}
                {placed.map(lab => {
                  const color = lab.cluster_id !== null ? C[lab.cluster_id] : '#94A3B8'
                  const isActive = preview?.lab.id === lab.id, isFocused = focusedLabId === lab.id
                  const isPinned = pins.includes(lab.id), isMatch = matchLab(lab)
                  const showLabel = zoom >= LABEL_SHOW_ZOOM && visibleLabelIds.has(lab.id)
                  const nodeScale = zoom < NODE_SHRINK_ZOOM ? Math.max(0.4, zoom / NODE_SHRINK_ZOOM) : 1
                  const r = (isActive || isFocused ? 13 : 10) * nodeScale
                  const hasAnim = !!animCoords[lab.id]
                  const isScoped = mapViewMode === 'scoped'
                  // scoped時: 対象外ノードは完全非表示
                  if (isScoped && !hasAnim) return null
                  const transStyle = hasAnim ? { transition: 'cx 0.8s cubic-bezier(0.45,0,0.55,1), cy 0.8s cubic-bezier(0.45,0,0.55,1)' } : {}
                  return (
                    <g key={lab.id} data-node="true" style={{ cursor: 'pointer' }}
                      onMouseEnter={() => { if (leaveTimer.current) clearTimeout(leaveTimer.current); enterTimer.current = setTimeout(() => setPreview({ lab, pinned: false }), 100) }}
                      onMouseLeave={() => { if (enterTimer.current) clearTimeout(enterTimer.current); if (!preview?.pinned) { leaveTimer.current = setTimeout(() => { if (!cardHovered.current) setPreview(null) }, 2000) } }}
                      onClick={(e) => { e.stopPropagation(); if (dragMoved.current) return; if (preview?.pinned && preview.lab.id === lab.id) { setPreview(null) } else { if (leaveTimer.current) clearTimeout(leaveTimer.current); setPreview({ lab, pinned: true }) } }}>
                      {(isActive || isFocused) && <circle cx={lab.x} cy={lab.y} r={r + 9} fill="none" stroke={color} strokeWidth={1.5} opacity={0.28} style={transStyle} />}
                      {isPinned && <circle cx={lab.x} cy={lab.y} r={r + (isActive ? 3 : 2) + 3} fill="none" stroke="#F59E0B" strokeWidth={2} opacity={0.7} style={transStyle} />}
                      <circle cx={lab.x} cy={lab.y} r={r + (isActive || isFocused ? 3 : 2)} fill="white" filter={isFocused ? 'url(#ns-focus)' : isActive ? 'url(#ns-h)' : 'url(#ns)'} opacity={isMatch ? 1 : 0.18} style={transStyle} />
                      <circle cx={lab.x} cy={lab.y} r={r} fill={color} opacity={isMatch ? (isActive || isFocused ? 1 : 0.82) : 0.15} style={transStyle} />
                      {isPinned && <text x={lab.x} y={lab.y + 4} textAnchor="middle" fontSize={(isActive ? 11 : 9) / zoom} style={{ pointerEvents: 'none' }}>⭐</text>}
                      {showLabel && (
                        <text x={lab.x} y={lab.y + r + 15} textAnchor="middle" fontSize={10.5 / zoom} fontWeight={isActive || isFocused || isPinned ? 700 : 500}
                          fill={isActive || isFocused ? color : isPinned ? '#92400E' : '#4B5563'}
                          opacity={isMatch ? Math.min(1, (zoom - LABEL_SHOW_ZOOM) / (LABEL_SHOW_ZOOM * 0.5) + 0.3) : 0.15}
                          style={{ pointerEvents: 'none' }}>{lab.name.slice(0, 14)}</text>
                      )}
                    </g>
                  )
                })}
              </g>
            </g>
          </svg>

          {/* フィルターパネル */}
          <div style={{ position: 'absolute', top: 80, left: 16, bottom: 72, zIndex: 20, display: 'flex', alignItems: 'flex-start', gap: 8, pointerEvents: 'none' }}>
            <div style={{ width: filterOpen ? FILTER_W : 0, opacity: filterOpen ? 1 : 0, overflow: 'hidden', transition: 'width 0.22s ease, opacity 0.18s ease', pointerEvents: filterOpen ? 'auto' : 'none', height: '100%' }}>
              <div style={{ width: FILTER_W, height: '100%', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderRadius: 14, border: '1px solid rgba(229,231,235,0.9)', boxShadow: '0 4px 20px rgba(17,24,39,0.12)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ padding: '10px 12px 0', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FilterIcon active={hasFilter} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: hasFilter ? '#3B82F6' : 'var(--text)' }}>絞り込み</span>
                    </div>
                    {hasFilter && <span style={{ fontSize: 11, color: '#6B7280' }}>{matchCount}件</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 2, marginBottom: 0, background: 'rgba(243,244,246,0.8)', borderRadius: 8, padding: 2 }}>
                    {FILTER_TABS.map(({ mode, label }) => {
                      const isActive = filterMode === mode
                      const isDisabled = (mode === 'dept' && hasCourseFilter) || (mode === 'course' && hasDeptFilter)
                      return (
                        <button key={mode} className="filter-tab" onClick={() => switchMode(mode)}
                          style={{ flex: 1, padding: '5px 4px', borderRadius: 6, fontSize: 11, fontWeight: isActive ? 700 : 500, background: isActive ? 'white' : 'transparent', color: isActive ? '#1F2937' : isDisabled ? '#D1D5DB' : '#6B7280', boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
                          {label}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div style={{ width: '100%', height: 1, background: 'var(--border)', margin: '8px 0 0', flexShrink: 0 }} />
                <div style={{ overflowY: 'auto', flex: 1 }}>
                  {renderFilterContent()}
                </div>

                {/* ── 再配置ボタン ── */}
                {singleScope && mapViewMode === 'global' && (
                  <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
                    <button className="remap-btn" onClick={applyMapView} disabled={isAnimating}
                      style={{ width: '100%', padding: '9px 8px', fontSize: 12, color: 'white', background: 'linear-gradient(135deg, #3B82F6, #6366F1)', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font)', fontWeight: 700, boxShadow: '0 2px 8px rgba(59,130,246,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, animation: 'pulseBlue 2.5s infinite' }}>
                      {isAnimating ? <><span>⟳</span> 再配置中...</> : <><span>✦</span> {singleScope.label}だけで再配置</>}
                    </button>
                  </div>
                )}

                {/* ── 再配置中バナー ── */}
                {mapViewMode === 'scoped' && (
                  <div style={{ padding: '8px 12px', borderTop: '1px solid rgba(59,130,246,0.2)', background: 'rgba(59,130,246,0.04)', flexShrink: 0 }}>
                    <div style={{ fontSize: 11, color: '#3B82F6', fontWeight: 700, marginBottom: 6, textAlign: 'center' }}>
                      ✦ {scopedLabel} で再配置中
                    </div>
                    <button onClick={resetMapView}
                      style={{ width: '100%', padding: '7px', fontSize: 11, color: '#6B7280', background: 'white', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font)', fontWeight: 600, transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'white')}>
                      ← 全体マップに戻す
                    </button>
                  </div>
                )}

                {hasFilter && (
                  <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
                    <button onClick={clearFilter} style={{ width: '100%', padding: '6px', fontSize: 11, color: '#EF4444', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font)' }}>✕ 絞り込み解除</button>
                  </div>
                )}
              </div>
            </div>
            <button className="filter-fab" onClick={() => setFilterOpen(v => !v)}
              style={{ width: 36, height: 36, borderRadius: 10, border: 'none', flexShrink: 0, background: hasFilter ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.94)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', boxShadow: '0 2px 10px rgba(17,24,39,0.13)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: hasFilter ? '#3B82F6' : '#6B7280', transition: 'background 0.15s,box-shadow 0.15s', pointerEvents: 'auto', position: 'relative' }}>
              <FilterIcon active={hasFilter} />
              {hasFilter && <span style={{ position: 'absolute', top: -5, right: -5, background: '#3B82F6', color: 'white', borderRadius: 999, fontSize: 9, fontWeight: 700, padding: '1px 4px', lineHeight: 1.4 }}>{filterCount}</span>}
            </button>
          </div>

          {/* 凡例パネル */}
          <div style={{ position: 'absolute', top: 80, right: 16, zIndex: 25, display: 'flex', alignItems: 'flex-start', gap: 8, pointerEvents: 'none', flexDirection: 'row-reverse' }}>
            <div style={{ width: legendOpen ? LEGEND_W : 0, opacity: legendOpen ? 1 : 0, overflow: 'hidden', transition: 'width 0.22s ease, opacity 0.18s ease', pointerEvents: legendOpen ? 'auto' : 'none', maxHeight: 'calc(100vh - 200px)' }}>
              <div style={{ width: LEGEND_W, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderRadius: 14, border: '1px solid rgba(229,231,235,0.9)', boxShadow: '0 4px 20px rgba(17,24,39,0.12)', overflow: 'hidden' }}>
                <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: activeCluster !== null ? C[activeCluster] : 'var(--text)' }}>● 研究クラスタ</span>
                  {activeCluster !== null && <button onClick={() => setActiveCluster(null)} style={{ fontSize: 10, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', padding: '1px 4px', fontFamily: 'var(--font)' }}>✕ 解除</button>}
                </div>
                <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 240px)' }}>
                  {CLUSTER_NAMES.map((name, i) => {
                    const active = activeCluster === i, hov = chipHover === i
                    return (
                      <button key={i} className="chip-btn" onClick={() => setActiveCluster(active ? null : i)} onMouseEnter={() => setChipHover(i)} onMouseLeave={() => setChipHover(null)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 12px', background: active || hov ? C_CHIP_H[i] : 'transparent', border: 'none', borderBottom: '1px solid rgba(229,231,235,0.4)', cursor: 'pointer', fontFamily: 'var(--font)', textAlign: 'left' }}>
                        <span style={{ width: 9, height: 9, borderRadius: '50%', background: C[i], flexShrink: 0, boxShadow: active ? `0 0 0 3px ${C_CHIP[i]}` : 'none' }} />
                        <span style={{ fontSize: 11, fontWeight: active ? 700 : 500, color: active ? C[i] : 'var(--text)', lineHeight: 1.3 }}>{name}</span>
                        {active && <span style={{ marginLeft: 'auto', fontSize: 10, color: C[i] }}>✓</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
            <button onClick={() => setLegendOpen(v => !v)}
              style={{ width: LEGEND_BTN_W, height: 36, borderRadius: 10, border: 'none', flexShrink: 0, background: activeCluster !== null ? C_CHIP[activeCluster] : 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', boxShadow: '0 2px 10px rgba(17,24,39,0.13)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', pointerEvents: 'auto', transition: 'background 0.15s' }}
              title={legendOpen ? '凡例を閉じる' : '凡例を開く'}>
              {activeCluster !== null
                ? <span style={{ width: 11, height: 11, borderRadius: '50%', background: C[activeCluster], display: 'inline-block' }} />
                : <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="5" cy="6" r="1.5" fill="#6B7280"/><line x1="9" y1="6" x2="20" y2="6"/><circle cx="5" cy="12" r="1.5" fill="#6B7280"/><line x1="9" y1="12" x2="20" y2="12"/><circle cx="5" cy="18" r="1.5" fill="#6B7280"/><line x1="9" y1="18" x2="20" y2="18"/></svg>}
            </button>
          </div>

          {/* ズームコントロール */}
          <div style={{ position: 'absolute', bottom: zoomBottom, right: 16, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center', transition: 'bottom 0.22s ease', zIndex: 20 }}>
            <button className="zoom-btn" onClick={() => applyZoom(zoom + ZOOM_STEP)} disabled={zoom >= MAX_ZOOM} style={{ width: 34, height: 34, borderRadius: 10, background: 'white', border: 'none', boxShadow: '0 2px 8px rgba(17,24,39,0.12)', fontSize: 20, color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontFamily: 'monospace' }}>+</button>
            <div style={{ width: 34, height: 22, borderRadius: 6, background: 'rgba(255,255,255,0.9)', boxShadow: '0 1px 4px rgba(17,24,39,0.08)', fontSize: 10, color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{Math.round(zoom * 100)}%</div>
            <button className="zoom-btn" onClick={() => applyZoom(zoom - ZOOM_STEP)} disabled={zoom <= fitZoom} style={{ width: 34, height: 34, borderRadius: 10, background: 'white', border: 'none', boxShadow: '0 2px 8px rgba(17,24,39,0.12)', fontSize: 22, color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontFamily: 'monospace' }}>−</button>
            <button className="zoom-btn" onClick={() => { setFocusedLabId(null); if (mapViewMode === 'scoped') { resetMapView() } else { fittedRef.current = false; const xs = labs.map(l => l.map_x != null ? MAP_MARGIN + l.map_x * 2 : MAP_MARGIN + 400); const ys = labs.map(l => l.map_y != null ? MAP_MARGIN + l.map_y * 2 : MAP_MARGIN + 300); animateToFit(svgW, svgH, xs, ys, zoom, offset, 500) } }} title="全体表示に戻す" style={{ width: 34, height: 34, borderRadius: 10, background: 'white', border: 'none', boxShadow: '0 2px 8px rgba(17,24,39,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>
            </button>
          </div>

          {/* クラスタパネル */}
          {clusterPanel !== null && (
            <div style={{ position: 'absolute', top: 80, left: filterLeftOffset, zIndex: 20, width: 280, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 14, border: `1.5px solid ${C_STROKE[clusterPanel]}`, boxShadow: '0 4px 24px rgba(17,24,39,0.10)', padding: '16px', fontFamily: 'var(--font)', transition: 'left 0.22s ease' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: C[clusterPanel] }} />
                  <span style={{ fontWeight: 700, fontSize: 14, color: C[clusterPanel] }}>{CLUSTER_NAMES[clusterPanel]}</span>
                </div>
                <button onClick={() => setClusterPanel(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#9ca3af', lineHeight: 1, padding: 2 }}>✕</button>
              </div>
              <p style={{ fontSize: 12, color: '#4b5563', lineHeight: 1.7, margin: '0 0 12px' }}>{CLUSTER_DESC[clusterPanel]}</p>
              <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6, fontWeight: 600 }}>所属研究室 {placed.filter(l => l.cluster_id === clusterPanel).length}件</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto' }}>
                {placed.filter(l => l.cluster_id === clusterPanel).map(l => (
                  <button key={l.id} onClick={() => { const t = calcFocusTransform(l.x, l.y, 2, svgW, svgH); setZoom(t.zoom); setOffset(t.offset); setFocusedLabId(l.id); setClusterPanel(null) }}
                    style={{ textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 6, fontSize: 12, color: '#374151', transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = C_CHIP[clusterPanel])}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}>{l.name}</button>
                ))}
              </div>
            </div>
          )}

          {/* プレビューカード */}
          {preview && (
            <div style={{ position: 'absolute', bottom: BOTTOM_PAD, left: filterLeftOffset, right: cardRight, zIndex: 10, pointerEvents: 'auto', transition: 'left 0.22s ease, right 0.22s ease' }}>
              {renderPreviewCard(preview)}
            </div>
          )}
        </div>
      </main>
    </>
  )
}

function highlightMatch(text: string, query: string) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <>{text}</>
  return <>{text.slice(0, idx)}<mark style={{ background: '#DBEAFE', color: '#1D4ED8', borderRadius: 2, padding: '0 1px' }}>{text.slice(idx, idx + query.length)}</mark>{text.slice(idx + query.length)}</>
}
