'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { usePins } from '@/hooks/usePins'
import { useUser, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'

type Lab = {
  id: string
  name: string
  faculty_name: string | null
  cluster_id: number | null
  dept: string | null
  summary_text: string | null
  summary_bullets: string | null
  lab_url: string | null
  tags: string[]
}

type LabCourse = {
  lab_id: string
  undergraduate_dept: string
  course: string
}

type FilterMode = 'course' | 'dept' | 'tag' | null

const C      = ['#3B82F6','#22C55E','#F59E0B','#EF4444','#8B5CF6','#EC4899','#14B8A6','#F97316','#0EA5E9','#A855F7'] as const
const C_CHIP = ['rgba(59,130,246,0.12)','rgba(34,197,94,0.12)','rgba(245,158,11,0.12)','rgba(239,68,68,0.12)','rgba(139,92,246,0.12)','rgba(236,72,153,0.12)','rgba(20,184,166,0.12)','rgba(249,115,22,0.12)','rgba(14,165,233,0.12)','rgba(168,85,247,0.12)']
const CLUSTER_NAMES = ['情報・社会システム','材料プロセス・金属','流体・航空宇宙・計算力学','環境・土木・化学プロセス','ナノ材料・機能デバイス','エネルギーデバイス・ナノ化学','ロボット・医工学・バイオ','計測・イメージング・量子ビーム','通信・光・電子デバイス','原子力・核融合・プラズマ']
const FILTER_W = 240

const FILTER_TABS: { mode: FilterMode; label: string }[] = [
  { mode: 'course', label: '学科/コース' },
  { mode: 'dept',   label: '専攻' },
  { mode: 'tag',    label: 'タグ' },
]

function FilterIcon({ active }: { active: boolean }) {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={active ? '#3B82F6' : 'currentColor'} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  )
}

export default function CardsPage() {
  const { isLoaded: authLoaded, isSignedIn } = useUser()
  const { pins, togglePin } = usePins()

  const [labs, setLabs] = useState<Lab[]>([])
  const [labCourses, setLabCourses] = useState<LabCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  const [filterOpen, setFilterOpen] = useState(true)
  const [filterMode, setFilterMode] = useState<FilterMode>('course')
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set())
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set())
  const [selectedDepts, setSelectedDepts] = useState<Set<string>>(new Set())
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())
  const [tagSearch, setTagSearch] = useState('')
  const [activeCluster, setActiveCluster] = useState<number | null>(null)
  const [sortBy, setSortBy] = useState<'default' | 'cluster' | 'name'>('default')
  const [showPinsOnly, setShowPinsOnly] = useState(false)

  useEffect(() => {
    ;(async () => {
      const { data: labData } = await supabase.from('labs').select('id,name,faculty_name,cluster_id,dept,summary_text,summary_bullets,lab_url')
      const { data: tagData } = await supabase.from('lab_tags').select('lab_id,tag').limit(10000)
      const { data: courseData } = await supabase.from('lab_courses').select('lab_id,undergraduate_dept,course')
      const tagMap: Record<string, string[]> = {}
      for (const t of tagData ?? []) { if (!tagMap[t.lab_id]) tagMap[t.lab_id] = []; tagMap[t.lab_id].push(t.tag) }
      setLabs((labData ?? []).map(l => ({ ...l, tags: tagMap[l.id] ?? [] })))
      setLabCourses(courseData ?? [])
      setLoading(false)
    })()
  }, [])

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

  const hasCourseFilter = selectedCourses.size > 0
  const hasDeptFilter   = selectedDepts.size > 0
  const hasTagFilter    = selectedTags.size > 0
  const hasFilter = hasCourseFilter || hasDeptFilter || hasTagFilter || activeCluster !== null
  const filterCount = selectedCourses.size + selectedDepts.size + selectedTags.size + (activeCluster !== null ? 1 : 0)

  const toggleCourse = (dept: string, course: string) => {
    const key = `${dept}::${course}`
    setSelectedCourses(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n })
  }
  const toggleAllCourses = (dept: string) => {
    const keys = (deptCourseMap.get(dept) ?? []).map(c => `${dept}::${c}`)
    const allSel = keys.every(k => selectedCourses.has(k))
    setSelectedCourses(prev => { const n = new Set(prev); allSel ? keys.forEach(k => n.delete(k)) : keys.forEach(k => n.add(k)); return n })
  }
  const toggleDept = (dept: string) => setSelectedDepts(prev => { const n = new Set(prev); n.has(dept) ? n.delete(dept) : n.add(dept); return n })
  const toggleTag = (tag: string) => setSelectedTags(prev => { const n = new Set(prev); n.has(tag) ? n.delete(tag) : n.add(tag); return n })
  const clearFilter = () => { setSelectedCourses(new Set()); setSelectedDepts(new Set()); setSelectedTags(new Set()); setActiveCluster(null) }

  const switchMode = (mode: FilterMode) => {
    if (mode === filterMode) return
    if ((mode === 'course' && hasDeptFilter) || (mode === 'dept' && hasCourseFilter)) {
      setSelectedCourses(new Set()); setSelectedDepts(new Set())
    }
    setFilterMode(mode)
  }

  const matchLab = useCallback((lab: Lab) => {
    if (showPinsOnly && !pins.includes(lab.id)) return false
    if (activeCluster !== null && lab.cluster_id !== activeCluster) return false
    if (hasCourseFilter) { const ok = labCourses.some(c => c.lab_id === lab.id && selectedCourses.has(`${c.undergraduate_dept}::${c.course}`)); if (!ok) return false }
    if (hasDeptFilter) { if (!lab.dept || !selectedDepts.has(lab.dept)) return false }
    if (hasTagFilter) { const ok = lab.tags.some(t => selectedTags.has(t)); if (!ok) return false }
    if (!query) return true
    const q = query.toLowerCase()
    return lab.name.toLowerCase().includes(q) || (lab.faculty_name ?? '').toLowerCase().includes(q) || lab.tags.some(t => t.toLowerCase().includes(q))
  }, [query, activeCluster, selectedCourses, selectedDepts, selectedTags, labCourses, hasCourseFilter, hasDeptFilter, hasTagFilter, pins, showPinsOnly])

  const getLabCourseInfo = (labId: string) => {
    const entries = labCourses.filter(c => c.lab_id === labId)
    if (entries.length === 0) return null
    return { depts: [...new Set(entries.map(c => c.undergraduate_dept))], courses: [...new Set(entries.map(c => c.course))] }
  }

  const parseBullets = (raw: string | null): string[] => {
    if (!raw) return []
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed.filter(Boolean).slice(0, 4)
    } catch {}
    return raw.split('\n').map(s => s.replace(/^[-・•]\s*/, '').trim()).filter(Boolean).slice(0, 4)
  }

  const filteredLabs = labs.filter(matchLab)
  const sortedLabs = [...filteredLabs].sort((a, b) => {
    if (sortBy === 'cluster') return (a.cluster_id ?? 99) - (b.cluster_id ?? 99)
    if (sortBy === 'name') return a.name.localeCompare(b.name, 'ja')
    return 0
  })

  const renderFilterContent = () => {
    if (filterMode === 'course') return (
      <>
        {hasDeptFilter && <div style={{ padding: '6px 10px', background: 'rgba(239,68,68,0.06)', margin: '0 8px 6px', borderRadius: 8, fontSize: 11, color: '#EF4444' }}>⚠ 専攻フィルター選択中</div>}
        <div style={{ padding: '8px 12px 6px', borderBottom: '1px solid rgba(229,231,235,0.5)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', marginBottom: 6, letterSpacing: '0.06em' }}>研究クラスタ</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {CLUSTER_NAMES.map((name, i) => (
              <button key={i} onClick={() => setActiveCluster(activeCluster === i ? null : i)}
                style={{ fontSize: 10, padding: '3px 8px', borderRadius: 999, border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: activeCluster === i ? C[i] : C_CHIP[i], color: activeCluster === i ? 'white' : C[i], fontWeight: activeCluster === i ? 700 : 500, transition: 'all .15s' }}>
                {name}
              </button>
            ))}
          </div>
        </div>
        {deptList.map(dept => {
          const courses = deptCourseMap.get(dept) ?? [], isExpanded = expandedDepts.has(dept)
          const selCount = courses.filter(c => selectedCourses.has(`${dept}::${c}`)).length
          return (
            <div key={dept}>
              <div className="dept-row" onClick={() => setExpandedDepts(prev => { const n = new Set(prev); n.has(dept) ? n.delete(dept) : n.add(dept); return n })}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid rgba(229,231,235,0.5)' }}>
                <span style={{ fontSize: 10, color: '#9CA3AF', display: 'inline-block', transition: 'transform .15s', transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}>▼</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: selCount > 0 ? '#3B82F6' : '#1F2937', flex: 1, lineHeight: 1.3 }}>{dept}</span>
                {selCount > 0 && <span style={{ fontSize: 10, background: '#3B82F6', color: 'white', borderRadius: 999, padding: '1px 6px' }}>{selCount}</span>}
              </div>
              {isExpanded && (
                <div style={{ background: 'rgba(249,250,251,0.8)' }}>
                  <label className="course-row" onClick={e => { e.preventDefault(); toggleAllCourses(dept) }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px 6px 28px', cursor: 'pointer', borderBottom: '1px solid rgba(229,231,235,0.3)' }}>
                    <input type="checkbox" checked={courses.every(c => selectedCourses.has(`${dept}::${c}`))} onChange={() => toggleAllCourses(dept)} style={{ accentColor: '#3B82F6', width: 13, height: 13 }} />
                    <span style={{ fontSize: 11, color: '#6B7280', fontWeight: 600 }}>全コース 選択/解除</span>
                  </label>
                  {courses.map(course => {
                    const key = `${dept}::${course}`, checked = selectedCourses.has(key)
                    return (
                      <label key={course} className="course-row" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px 6px 28px', cursor: 'pointer', background: checked ? 'rgba(59,130,246,0.06)' : 'transparent' }}>
                        <input type="checkbox" checked={checked} onChange={() => toggleCourse(dept, course)} style={{ accentColor: '#3B82F6', width: 13, height: 13 }} />
                        <span style={{ fontSize: 12, color: checked ? '#3B82F6' : '#1F2937', fontWeight: checked ? 600 : 400, lineHeight: 1.3 }}>{course}</span>
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
    if (filterMode === 'dept') return (
      <>
        {hasCourseFilter && <div style={{ padding: '6px 10px', background: 'rgba(239,68,68,0.06)', margin: '0 8px 6px', borderRadius: 8, fontSize: 11, color: '#EF4444' }}>⚠ 学科フィルター選択中</div>}
        {deptNameList.map(dept => {
          const checked = selectedDepts.has(dept)
          return (
            <label key={dept} className="course-row" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', cursor: 'pointer', background: checked ? 'rgba(59,130,246,0.06)' : 'transparent', borderBottom: '1px solid rgba(229,231,235,0.3)' }}>
              <input type="checkbox" checked={checked} onChange={() => toggleDept(dept)} style={{ accentColor: '#3B82F6', width: 13, height: 13 }} />
              <span style={{ fontSize: 12, color: checked ? '#3B82F6' : '#1F2937', fontWeight: checked ? 600 : 400, lineHeight: 1.3 }}>{dept}</span>
            </label>
          )
        })}
      </>
    )
    if (filterMode === 'tag') return (
      <>
        <div style={{ padding: '8px 10px', borderBottom: '1px solid rgba(229,231,235,0.5)' }}>
          <input type="text" placeholder="タグを検索..." value={tagSearch} onChange={e => setTagSearch(e.target.value)}
            style={{ width: '100%', padding: '6px 10px', fontSize: 12, borderRadius: 8, border: '1.5px solid #E5E7EB', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        {filteredTags.map(tag => {
          const checked = selectedTags.has(tag), count = labs.filter(l => l.tags.includes(tag)).length
          return (
            <label key={tag} className="course-row" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', cursor: 'pointer', background: checked ? 'rgba(59,130,246,0.06)' : 'transparent', borderBottom: '1px solid rgba(229,231,235,0.2)' }}>
              <input type="checkbox" checked={checked} onChange={() => toggleTag(tag)} style={{ accentColor: '#3B82F6', width: 13, height: 13 }} />
              <span style={{ fontSize: 12, color: checked ? '#3B82F6' : '#1F2937', fontWeight: checked ? 600 : 400, flex: 1 }}>{tag}</span>
              <span style={{ fontSize: 10, color: '#9CA3AF' }}>{count}</span>
            </label>
          )
        })}
      </>
    )
    return null
  }

  if (loading || !authLoaded) return (
    <main style={{ background: '#FAFAF7', fontFamily: "'Hiragino Kaku Gothic ProN','Hiragino Sans','Noto Sans JP',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid #93C5FD', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: '#6B7280', fontSize: 14 }}>読み込み中...</p>
      </div>
    </main>
  )

  return (
    <>
      <style>{`
        :root{--bg:#FAFAF7;--text:#1F2937;--muted:#6B7280;--border:#E5E7EB;--font:'Hiragino Kaku Gothic ProN','Hiragino Sans','Noto Sans JP',sans-serif;}
        *{box-sizing:border-box;}
        body{margin:0;background:var(--bg);font-family:var(--font);color:var(--text);}
        .dept-row:hover{background:rgba(0,0,0,.03)!important}
        .course-row:hover{background:rgba(59,130,246,.05)!important}
        .filter-tab{cursor:pointer;border:none;font-family:var(--font);transition:background .15s,color .15s}
        .lab-card{transition:box-shadow .2s,transform .2s;will-change:transform}
        .lab-card:hover{box-shadow:0 8px 32px rgba(17,24,39,0.13)!important;transform:translateY(-2px)}
        .pin-btn{transition:transform .1s,background .15s;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center}
        .pin-btn:hover{transform:scale(1.15)}
        @keyframes fadeInUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .card-anim{animation:fadeInUp 0.25s ease forwards;opacity:0}
        .tag-chip:hover{opacity:0.75}
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#FAFAF7' }}>

        {/* ── ヘッダー ── */}
        <header style={{ position: 'sticky', top: 0, zIndex: 30, background: 'rgba(250,250,247,0.92)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(229,231,235,0.6)', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#1F2937', letterSpacing: '-0.025em', lineHeight: 1.2 }}>東北大学 研究室一覧</h1>
              <p style={{ fontSize: 11, color: '#9CA3AF', margin: '2px 0 0' }}>{sortedLabs.length}件表示中</p>
            </div>
            {/* ページ切替 */}
            <div style={{ display: 'flex', gap: 3, background: '#F3F4F6', borderRadius: 9, padding: 3 }}>
              <Link href="/map" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 6, fontSize: 12, fontWeight: 500, color: '#6B7280', textDecoration: 'none' }}>
                🗺 マップ
              </Link>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 6, fontSize: 12, fontWeight: 700, color: '#1F2937', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                ☰ カード
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {/* 検索 */}
            <div style={{ position: 'relative' }}>
              <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width={13} height={13} viewBox="0 0 20 20" fill="none">
                <circle cx="8.5" cy="8.5" r="5.5" stroke="#9CA3AF" strokeWidth="1.8"/><path d="M13 13l3.5 3.5" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              <input type="text" placeholder="研究室名・教員名・キーワード..." value={query} onChange={e => setQuery(e.target.value)}
                style={{ paddingLeft: 30, paddingRight: query ? 28 : 12, paddingTop: 8, paddingBottom: 8, fontSize: 13, borderRadius: 10, border: '1.5px solid #E5E7EB', background: 'white', outline: 'none', width: 220, fontFamily: 'inherit', transition: 'border-color .15s' }}
                onFocus={e => (e.currentTarget.style.borderColor = '#93C5FD')}
                onBlur={e => (e.currentTarget.style.borderColor = '#E5E7EB')} />
              {query && <button onClick={() => setQuery('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#9CA3AF', padding: 2 }}>✕</button>}
            </div>

            {/* ソート */}
            <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
              style={{ padding: '8px 10px', fontSize: 12, borderRadius: 10, border: '1.5px solid #E5E7EB', background: 'white', outline: 'none', fontFamily: 'inherit', color: '#374151', cursor: 'pointer' }}>
              <option value="default">並び順: デフォルト</option>
              <option value="cluster">クラスタ別</option>
              <option value="name">名前順</option>
            </select>

            {/* ピンのみ */}
            <button onClick={() => setShowPinsOnly(v => !v)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 12px', borderRadius: 10, border: 'none', background: showPinsOnly ? '#FEF9C3' : '#F3F4F6', color: showPinsOnly ? '#92400E' : '#6B7280', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}>
              {showPinsOnly ? '⭐' : '☆'} ピン
            </button>

            {/* Clerk認証UI */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {isSignedIn ? (
                <UserButton />
              ) : (
                <>
                  <SignInButton mode="modal">
                    <button style={{ padding: '7px 12px', fontSize: 12, fontWeight: 600, borderRadius: 9, border: '1.5px solid #E5E7EB', background: 'white', color: '#374151', cursor: 'pointer', fontFamily: 'inherit', transition: 'border-color .15s' }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = '#93C5FD')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = '#E5E7EB')}>
                      ログイン
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button style={{ padding: '7px 13px', fontSize: 12, fontWeight: 700, borderRadius: 9, border: 'none', background: 'linear-gradient(135deg,#3B82F6,#6366F1)', color: 'white', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 1px 4px rgba(59,130,246,0.3)', transition: 'opacity .15s' }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                      新規登録
                    </button>
                  </SignUpButton>
                </>
              )}
            </div>
          </div>
        </header>

        <div style={{ display: 'flex', flex: 1 }}>
          {/* ── フィルターサイドバー ── */}
          <aside style={{ width: filterOpen ? FILTER_W + 16 : 52, flexShrink: 0, transition: 'width 0.22s ease', position: 'sticky', top: 57, height: 'calc(100vh - 57px)', overflowY: 'auto', display: 'flex', flexDirection: 'column', padding: '10px 0' }}>
            <div style={{ padding: '0 8px 8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button onClick={() => setFilterOpen(v => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 8, color: hasFilter ? '#3B82F6' : '#6B7280', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, position: 'relative' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#F3F4F6')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                <FilterIcon active={hasFilter} />
                {filterOpen && <span>絞り込み</span>}
                {hasFilter && <span style={{ background: '#3B82F6', color: 'white', borderRadius: 999, fontSize: 9, padding: '1px 5px', lineHeight: 1.4 }}>{filterCount}</span>}
              </button>
              {filterOpen && hasFilter && <span style={{ fontSize: 11, color: '#6B7280', paddingRight: 8 }}>{sortedLabs.length}件</span>}
            </div>

            {filterOpen && (
              <div style={{ margin: '0 8px', background: 'rgba(255,255,255,0.95)', borderRadius: 14, border: '1px solid rgba(229,231,235,0.9)', boxShadow: '0 2px 12px rgba(17,24,39,0.08)', overflow: 'hidden', flex: 1 }}>
                <div style={{ padding: '8px 8px 0' }}>
                  <div style={{ display: 'flex', gap: 2, background: 'rgba(243,244,246,0.8)', borderRadius: 8, padding: 2 }}>
                    {FILTER_TABS.map(({ mode, label }) => (
                      <button key={mode} className="filter-tab" onClick={() => switchMode(mode)}
                        style={{ flex: 1, padding: '5px 4px', borderRadius: 6, fontSize: 11, fontWeight: filterMode === mode ? 700 : 500, background: filterMode === mode ? 'white' : 'transparent', color: filterMode === mode ? '#1F2937' : '#6B7280', boxShadow: filterMode === mode ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ width: '100%', height: 1, background: '#E5E7EB', margin: '8px 0 0' }} />
                <div style={{ overflowY: 'auto' }}>{renderFilterContent()}</div>
                {hasFilter && (
                  <div style={{ padding: '8px 12px', borderTop: '1px solid #E5E7EB' }}>
                    <button onClick={clearFilter} style={{ width: '100%', padding: '6px', fontSize: 11, color: '#EF4444', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }}>✕ 絞り込み解除</button>
                  </div>
                )}
              </div>
            )}
          </aside>

          {/* ── カードグリッド ── */}
          <main style={{ flex: 1, padding: '20px 20px 60px', minWidth: 0 }}>
            {sortedLabs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: '#9CA3AF' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                <p style={{ fontSize: 15, fontWeight: 600 }}>条件に一致する研究室が見つかりません</p>
                <button onClick={clearFilter} style={{ marginTop: 12, padding: '8px 18px', fontSize: 13, borderRadius: 10, border: 'none', background: '#F3F4F6', color: '#374151', cursor: 'pointer', fontFamily: 'inherit' }}>絞り込みを解除</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                {sortedLabs.map((lab, idx) => {
                  const ci = lab.cluster_id ?? 0
                  const color = lab.cluster_id !== null ? C[ci] : '#94A3B8'
                  const chipBg = lab.cluster_id !== null ? C_CHIP[ci] : 'rgba(148,163,184,0.12)'
                  const clusterName = lab.cluster_id !== null ? CLUSTER_NAMES[ci] : '未分類'
                  const isPinned = pins.includes(lab.id)
                  const courseInfo = getLabCourseInfo(lab.id)
                  const bullets = parseBullets(lab.summary_bullets)

                  return (
                    <div key={lab.id} className="lab-card card-anim"
                      style={{ background: 'white', borderRadius: 16, border: `1.5px solid ${isPinned ? color : '#E5E7EB'}`, boxShadow: isPinned ? `0 2px 16px rgba(17,24,39,0.10)` : '0 1px 6px rgba(17,24,39,0.06)', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 11, animationDelay: `${Math.min(idx * 25, 400)}ms`, animationFillMode: 'both' }}>

                      {/* ヘッダー */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 600, color, background: chipBg, padding: '2px 9px 2px 6px', borderRadius: 999, marginBottom: 6 }}>
                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: color }} />{clusterName}
                          </span>
                          <h2 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 4px', color: '#1F2937', lineHeight: 1.3, letterSpacing: '-0.01em' }}>{lab.name}</h2>
                          {lab.faculty_name && <p style={{ fontSize: 12, color: '#6B7280', margin: 0, lineHeight: 1.4 }}><span style={{ color: '#9CA3AF', fontWeight: 600, marginRight: 4 }}>教員</span>{lab.faculty_name}</p>}
                        </div>
                        <button className="pin-btn" onClick={() => togglePin(lab.id)}
                          style={{ width: 34, height: 34, borderRadius: 10, background: isPinned ? '#FEF9C3' : '#F3F4F6', fontSize: 16, flexShrink: 0 }}>
                          {isPinned ? '⭐' : '☆'}
                        </button>
                      </div>

                      {/* 学科・専攻 */}
                      {(courseInfo || lab.dept) && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {courseInfo && <p style={{ fontSize: 11, color: '#6B7280', margin: 0, lineHeight: 1.5 }}><span style={{ color: '#9CA3AF', fontWeight: 600, marginRight: 4 }}>学科/コース</span>{courseInfo.depts.join('、')}<span style={{ color: '#A5B4FC' }}> › {courseInfo.courses.slice(0, 2).join(' / ')}</span></p>}
                          {lab.dept && <p style={{ fontSize: 11, color: '#6B7280', margin: 0, lineHeight: 1.5 }}><span style={{ color: '#9CA3AF', fontWeight: 600, marginRight: 4 }}>大学院</span>{lab.dept}</p>}
                        </div>
                      )}

                      {/* 箇条書き */}
                      {bullets.length > 0 ? (
                        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5 }}>
                          {bullets.map((b, i) => (
                            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 12, color: '#374151', lineHeight: 1.55 }}>
                              <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0, marginTop: 6 }} />{b}
                            </li>
                          ))}
                        </ul>
                      ) : lab.summary_text ? (
                        <p style={{ fontSize: 12, color: '#6B7280', margin: 0, lineHeight: 1.7, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{lab.summary_text}</p>
                      ) : null}

                      {/* タグ */}
                      {lab.tags.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {lab.tags.slice(0, 6).map((t, i) => (
                            <span key={i} className="tag-chip" onClick={() => { toggleTag(t); setFilterMode('tag') }}
                              style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: chipBg, color, fontWeight: 500, cursor: 'pointer', transition: 'opacity .15s' }}>
                              {t}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* フッター */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 10, borderTop: '1px solid #F3F4F6' }}>
                        <Link href="/map" style={{ fontSize: 11, color: '#9CA3AF', textDecoration: 'none' }}>🗺 マップで見る</Link>
                        <Link href={`/lab/${lab.id}`}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '7px 14px', borderRadius: 8, background: color, color: 'white', fontSize: 12, fontWeight: 700, textDecoration: 'none', transition: 'opacity .15s' }}
                          onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                          詳細を見る →
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  )
}
