'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { usePins } from '@/hooks/usePins'
import { useUser, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'
import Link from 'next/link'

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

type ClusterLabel = {
  cluster_id: number
  label: string
}

type FilterMode = 'course' | 'dept' | 'tag' | null

const C      = ['#5FAFC6','#22C55E','#F59E0B','#EF4444','#8B5CF6','#EC4899','#14B8A6','#F97316','#0EA5E9','#A855F7'] as const
const C_CHIP = ['rgba(95,175,198,0.12)','rgba(34,197,94,0.12)','rgba(245,158,11,0.12)','rgba(239,68,68,0.12)','rgba(139,92,246,0.12)','rgba(236,72,153,0.12)','rgba(20,184,166,0.12)','rgba(249,115,22,0.12)','rgba(14,165,233,0.12)','rgba(168,85,247,0.12)']
const FILTER_W = 240

const FILTER_TABS: { mode: FilterMode; label: string }[] = [
  { mode: 'course', label: '学科/コース' },
  { mode: 'dept',   label: '専攻' },
  { mode: 'tag',    label: 'タグ' },
]

function FilterIcon({ active }: { active: boolean }) {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={active ? '#5FAFC6' : '#8FA1AE'} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  )
}

export default function CardsPage() {
  const { isLoaded: authLoaded, isSignedIn } = useUser()
  const { pins, togglePin } = usePins()

  const [labs, setLabs] = useState<Lab[]>([])
  const [labCourses, setLabCourses] = useState<LabCourse[]>([])
  const [clusterLabels, setClusterLabels] = useState<ClusterLabel[]>([])
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

  const [isMobile, setIsMobile] = useState(false)
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

  // ── クラスタラベル取得ヘルパー（唯一のソース: cluster_labelsテーブル）──
  const getClusterName = (clusterId: number | null): string => {
    if (clusterId === null) return '未分類'
    return clusterLabels.find(l => l.cluster_id === clusterId)?.label ?? `クラスタ${clusterId}`
  }

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 640
      setIsMobile(mobile)
      if (mobile) setFilterOpen(false)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    ;(async () => {
      const [
        { data: labData },
        { data: tagData },
        { data: courseData },
        { data: labelData },
      ] = await Promise.all([
        supabase.from('labs').select('id,name,faculty_name,cluster_id,dept,summary_text,summary_bullets,lab_url'),
        supabase.from('lab_tags').select('lab_id,tag').limit(10000),
        supabase.from('lab_courses').select('lab_id,undergraduate_dept,course'),
        supabase.from('cluster_labels').select('cluster_id,label').order('cluster_id'),
      ])
      const tagMap: Record<string, string[]> = {}
      for (const t of tagData ?? []) {
        if (!tagMap[t.lab_id]) tagMap[t.lab_id] = []
        tagMap[t.lab_id].push(t.tag)
      }
      setLabs((labData ?? []).map(l => ({ ...l, tags: tagMap[l.id] ?? [] })))
      setLabCourses(courseData ?? [])
      setClusterLabels(labelData ?? [])
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
        {hasDeptFilter && <div style={{ padding: '6px 10px', background: 'rgba(239,68,68,0.06)', margin: '0 8px 6px', borderRadius: 8, fontSize: 11, color: '#EF4444', fontFamily: "'Noto Sans JP',sans-serif" }}>⚠ 専攻フィルター選択中</div>}
        {/* クラスタフィルター: DBから取得したclusterLabelsを使う */}
        {clusterLabels.length > 0 && (
          <div style={{ padding: '8px 12px 8px', borderBottom: '1px solid #DCE8EE' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#8FA1AE', marginBottom: 6, letterSpacing: '0.06em', fontFamily: "'Sora',sans-serif" }}>研究クラスタ</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {clusterLabels.map(({ cluster_id: i, label: name }) => (
                <button key={i} onClick={() => setActiveCluster(activeCluster === i ? null : i)}
                  style={{ fontSize: 10, padding: '3px 9px', borderRadius: 999, border: 'none', cursor: 'pointer', fontFamily: "'Noto Sans JP',sans-serif", background: activeCluster === i ? C[i % C.length] : C_CHIP[i % C_CHIP.length], color: activeCluster === i ? 'white' : C[i % C.length], fontWeight: activeCluster === i ? 700 : 500, transition: 'all .15s' }}>
                  {name}
                </button>
              ))}
            </div>
          </div>
        )}
        {deptList.map(dept => {
          const courses = deptCourseMap.get(dept) ?? [], isExpanded = expandedDepts.has(dept)
          const selCount = courses.filter(c => selectedCourses.has(`${dept}::${c}`)).length
          return (
            <div key={dept}>
              <div className="dept-row" onClick={() => setExpandedDepts(prev => { const n = new Set(prev); n.has(dept) ? n.delete(dept) : n.add(dept); return n })}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid rgba(220,232,238,0.6)' }}>
                <span style={{ fontSize: 10, color: '#8FA1AE', display: 'inline-block', transition: 'transform .15s', transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}>▼</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: selCount > 0 ? '#3E95AE' : '#1F2D3D', flex: 1, lineHeight: 1.3, fontFamily: "'Noto Sans JP',sans-serif" }}>{dept}</span>
                {selCount > 0 && <span style={{ fontSize: 10, background: '#5FAFC6', color: 'white', borderRadius: 999, padding: '1px 6px' }}>{selCount}</span>}
              </div>
              {isExpanded && (
                <div style={{ background: '#F3FBFD' }}>
                  <label className="course-row" onClick={e => { e.preventDefault(); toggleAllCourses(dept) }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px 6px 28px', cursor: 'pointer', borderBottom: '1px solid rgba(220,232,238,0.4)' }}>
                    <input type="checkbox" checked={courses.every(c => selectedCourses.has(`${dept}::${c}`))} onChange={() => toggleAllCourses(dept)} style={{ accentColor: '#5FAFC6', width: 13, height: 13 }} />
                    <span style={{ fontSize: 11, color: '#5B6B79', fontWeight: 600, fontFamily: "'Noto Sans JP',sans-serif" }}>全コース 選択/解除</span>
                  </label>
                  {courses.map(course => {
                    const key = `${dept}::${course}`, checked = selectedCourses.has(key)
                    return (
                      <label key={course} className="course-row" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px 6px 28px', cursor: 'pointer', background: checked ? 'rgba(95,175,198,0.07)' : 'transparent' }}>
                        <input type="checkbox" checked={checked} onChange={() => toggleCourse(dept, course)} style={{ accentColor: '#5FAFC6', width: 13, height: 13 }} />
                        <span style={{ fontSize: 12, color: checked ? '#3E95AE' : '#1F2D3D', fontWeight: checked ? 600 : 400, lineHeight: 1.3, fontFamily: "'Noto Sans JP',sans-serif" }}>{course}</span>
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
        {hasCourseFilter && <div style={{ padding: '6px 10px', background: 'rgba(239,68,68,0.06)', margin: '0 8px 6px', borderRadius: 8, fontSize: 11, color: '#EF4444', fontFamily: "'Noto Sans JP',sans-serif" }}>⚠ 学科フィルター選択中</div>}
        {deptNameList.map(dept => {
          const checked = selectedDepts.has(dept)
          return (
            <label key={dept} className="course-row" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', cursor: 'pointer', background: checked ? 'rgba(95,175,198,0.07)' : 'transparent', borderBottom: '1px solid rgba(220,232,238,0.4)' }}>
              <input type="checkbox" checked={checked} onChange={() => toggleDept(dept)} style={{ accentColor: '#5FAFC6', width: 13, height: 13 }} />
              <span style={{ fontSize: 12, color: checked ? '#3E95AE' : '#1F2D3D', fontWeight: checked ? 600 : 400, lineHeight: 1.3, fontFamily: "'Noto Sans JP',sans-serif" }}>{dept}</span>
            </label>
          )
        })}
      </>
    )
    if (filterMode === 'tag') return (
      <>
        <div style={{ padding: '8px 10px', borderBottom: '1px solid #DCE8EE' }}>
          <input type="text" placeholder="タグを検索..." value={tagSearch} onChange={e => setTagSearch(e.target.value)}
            style={{ width: '100%', padding: '6px 10px', fontSize: 12, borderRadius: 9, border: '1.5px solid #DCE8EE', background: '#F3FBFD', color: '#1F2D3D', fontFamily: "'Noto Sans JP',sans-serif", outline: 'none', boxSizing: 'border-box' }} />
        </div>
        {filteredTags.map(tag => {
          const checked = selectedTags.has(tag), count = labs.filter(l => l.tags.includes(tag)).length
          return (
            <label key={tag} className="course-row" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', cursor: 'pointer', background: checked ? 'rgba(95,175,198,0.07)' : 'transparent', borderBottom: '1px solid rgba(220,232,238,0.25)' }}>
              <input type="checkbox" checked={checked} onChange={() => toggleTag(tag)} style={{ accentColor: '#5FAFC6', width: 13, height: 13 }} />
              <span style={{ fontSize: 12, color: checked ? '#3E95AE' : '#1F2D3D', fontWeight: checked ? 600 : 400, flex: 1, fontFamily: "'Noto Sans JP',sans-serif" }}>{tag}</span>
              <span style={{ fontSize: 10, color: '#8FA1AE' }}>{count}</span>
            </label>
          )
        })}
      </>
    )
    return null
  }

  if (loading || !authLoaded) return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=Noto+Sans+JP:wght@400;500;700&display=swap');@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <main style={{ background: '#F3FBFD', fontFamily: "'Noto Sans JP',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2.5px solid #5FAFC6', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: '#8FA1AE', fontSize: 13, fontFamily: "'Sora',sans-serif" }}>研究室を読み込み中...</p>
        </div>
      </main>
    </>
  )

  const renderMobileFilterSheet = () => (
    <>
      <div onClick={() => setMobileFilterOpen(false)}
        style={{ position: 'fixed', inset: 0, zIndex: 55, background: 'rgba(0,0,0,0.3)' }} />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 60,
        background: 'white', borderRadius: '20px 20px 0 0',
        maxHeight: '82vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 -4px 32px rgba(41,88,107,0.18)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        animation: 'slideUpSheet 0.22s cubic-bezier(0.34,1.3,0.64,1) forwards',
      }}>
        <div style={{ flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 0' }}>
            <div style={{ width: 36, height: 4, borderRadius: 99, background: '#DCE8EE' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px 8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <FilterIcon active={hasFilter} />
              <span style={{ fontSize: 15, fontWeight: 700, color: hasFilter ? '#5FAFC6' : '#1F2D3D', fontFamily: "'Sora',sans-serif" }}>絞り込み</span>
              {hasFilter && <span style={{ fontSize: 12, color: '#8FA1AE', fontFamily: "'Noto Sans JP',sans-serif" }}>{sortedLabs.length}件</span>}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {hasFilter && (
                <button onClick={clearFilter}
                  style={{ fontSize: 12, color: '#EF4444', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontFamily: "'Sora',sans-serif" }}>
                  解除
                </button>
              )}
              <button onClick={() => setMobileFilterOpen(false)}
                style={{ fontSize: 13, color: '#5B6B79', background: '#F3FBFD', border: '1px solid #DCE8EE', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontWeight: 600, fontFamily: "'Sora',sans-serif" }}>
                完了
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 2, background: '#F3FBFD', borderRadius: 10, padding: 3, margin: '0 12px 8px', border: '1px solid #DCE8EE' }}>
            {FILTER_TABS.map(({ mode, label }) => (
              <button key={mode} className="filter-tab" onClick={() => switchMode(mode)}
                style={{ flex: 1, padding: '7px 4px', borderRadius: 8, fontSize: 12, fontWeight: filterMode === mode ? 700 : 500, background: filterMode === mode ? 'white' : 'transparent', color: filterMode === mode ? '#1F2D3D' : '#8FA1AE', boxShadow: filterMode === mode ? '0 1px 4px rgba(41,88,107,0.08)' : 'none', border: 'none', cursor: 'pointer', fontFamily: "'Sora',sans-serif" }}>
                {label}
              </button>
            ))}
          </div>
          <div style={{ height: 1, background: '#DCE8EE' }} />
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>{renderFilterContent()}</div>
      </div>
    </>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Noto+Sans+JP:wght@400;500;700&display=swap');
        :root {
          --brand: #5FAFC6; --brand-dark: #3E95AE; --brand-soft: #F3FBFD;
          --border: #DCE8EE; --text: #1F2D3D; --muted: #8FA1AE;
          --font: 'Sora','Noto Sans JP',sans-serif; --font-body: 'Noto Sans JP',sans-serif;
        }
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; background: #F3FBFD; font-family: var(--font-body); color: var(--text); }
        .dept-row:hover  { background: rgba(95,175,198,0.05) !important; }
        .course-row:hover { background: rgba(95,175,198,0.07) !important; }
        .filter-tab { cursor: pointer; border: none; font-family: var(--font); transition: background .15s, color .15s; }
        .lab-card { transition: box-shadow .2s, transform .2s, border-color .2s; will-change: transform; }
        .lab-card:hover { box-shadow: 0 8px 32px rgba(41,88,107,0.13) !important; transform: translateY(-2px); border-color: var(--brand) !important; }
        .pin-btn { transition: transform .1s, background .15s; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .pin-btn:hover { transform: scale(1.15); }
        @keyframes fadeInUp { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
        @keyframes slideUpSheet { from { transform:translateY(100%) } to { transform:translateY(0) } }
        @keyframes spin { to { transform: rotate(360deg) } }
        .card-anim { animation: fadeInUp 0.25s ease forwards; opacity: 0; }
        .tag-chip:hover { opacity: 0.75; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(95,175,198,0.3); border-radius: 99px; }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#F3FBFD' }}>

        {!isMobile && (
          <header style={{
            position: 'sticky', top: 0, zIndex: 30,
            background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            borderBottom: '1px solid #DCE8EE', padding: '0 20px', height: 54,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: 'linear-gradient(135deg,#5FAFC6 0%,#8FD3E0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 13, boxShadow: '0 3px 10px rgba(95,175,198,0.3)' }}>L</div>
                <span style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 14, color: '#1F2D3D', letterSpacing: '-0.02em' }}>Labo Navi</span>
              </Link>
              <div style={{ borderLeft: '1px solid #DCE8EE', paddingLeft: 14 }}>
                <p style={{ fontSize: 12, color: '#8FA1AE', margin: 0, fontFamily: "'Noto Sans JP',sans-serif" }}>{sortedLabs.length}件表示中</p>
              </div>
              <div style={{ display: 'flex', gap: 3, background: '#F3FBFD', borderRadius: 10, padding: 3, border: '1px solid #DCE8EE', flexShrink: 0 }}>
                <Link href="/map" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 500, color: '#8FA1AE', textDecoration: 'none', transition: 'background .15s', fontFamily: "'Sora',sans-serif" }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(95,175,198,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>🗺 マップ</Link>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 700, color: '#1F2D3D', background: 'white', boxShadow: '0 1px 4px rgba(41,88,107,0.08)', fontFamily: "'Sora',sans-serif" }}>☰ カード</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width={13} height={13} viewBox="0 0 20 20" fill="none">
                  <circle cx="8.5" cy="8.5" r="5.5" stroke="#8FA1AE" strokeWidth="1.8"/><path d="M13 13l3.5 3.5" stroke="#8FA1AE" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
                <input type="text" placeholder="研究室名・教員名・キーワード..." value={query} onChange={e => setQuery(e.target.value)}
                  style={{ paddingLeft: 30, paddingRight: query ? 28 : 12, paddingTop: 8, paddingBottom: 8, fontSize: 13, borderRadius: 11, border: '1.5px solid #DCE8EE', background: '#F3FBFD', outline: 'none', width: 226, fontFamily: "'Noto Sans JP',sans-serif", color: '#1F2D3D', transition: 'border-color .15s, box-shadow .15s' }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#5FAFC6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(95,175,198,0.15)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#DCE8EE'; e.currentTarget.style.boxShadow = 'none' }} />
                {query && <button onClick={() => setQuery('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#8FA1AE', padding: 2 }}>✕</button>}
              </div>
              <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
                style={{ padding: '8px 10px', fontSize: 12, borderRadius: 11, border: '1.5px solid #DCE8EE', background: 'white', outline: 'none', fontFamily: "'Sora',sans-serif", color: '#1F2D3D', cursor: 'pointer' }}>
                <option value="default">並び順: デフォルト</option>
                <option value="cluster">クラスタ別</option>
                <option value="name">名前順</option>
              </select>
              <button onClick={() => setShowPinsOnly(v => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 11, border: `1px solid ${showPinsOnly ? '#FEF08A' : '#DCE8EE'}`, background: showPinsOnly ? '#FEFCE8' : 'white', color: showPinsOnly ? '#92400E' : '#5B6B79', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Sora',sans-serif", transition: 'all .15s' }}>
                {showPinsOnly ? '⭐' : '☆'} ピン
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {isSignedIn ? <UserButton /> : (
                  <>
                    <SignInButton mode="modal">
                      <button style={{ padding: '7px 12px', fontSize: 12, fontWeight: 600, borderRadius: 9, border: '1.5px solid #DCE8EE', background: 'white', color: '#1F2D3D', cursor: 'pointer', fontFamily: "'Sora',sans-serif", transition: 'border-color .15s' }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = '#5FAFC6')}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = '#DCE8EE')}>ログイン</button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <button style={{ padding: '7px 13px', fontSize: 12, fontWeight: 700, borderRadius: 9, border: 'none', background: '#5FAFC6', color: 'white', cursor: 'pointer', fontFamily: "'Sora',sans-serif", boxShadow: '0 2px 8px rgba(95,175,198,0.35)', transition: 'opacity .15s' }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
                        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>新規登録</button>
                    </SignUpButton>
                  </>
                )}
              </div>
            </div>
          </header>
        )}

        {isMobile && (
          <header style={{
            position: 'sticky', top: 0, zIndex: 30,
            background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            borderBottom: '1px solid #DCE8EE', padding: '0 12px', height: 52,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
          }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 7, textDecoration: 'none', flexShrink: 0 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#5FAFC6 0%,#8FD3E0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 12, boxShadow: '0 2px 8px rgba(95,175,198,0.3)' }}>L</div>
              <span style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 15, color: '#1F2D3D', letterSpacing: '-0.02em' }}>Labo Navi</span>
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button onClick={() => setMobileSearchOpen(v => !v)}
                style={{ width: 38, height: 38, borderRadius: 10, border: '1px solid #DCE8EE', background: (query || mobileSearchOpen) ? 'rgba(95,175,198,0.1)' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: query ? '#5FAFC6' : '#5B6B79', position: 'relative' }}>
                <svg width={16} height={16} viewBox="0 0 20 20" fill="none">
                  <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.8"/>
                  <path d="M13 13l3.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
                {query && <span style={{ position: 'absolute', top: 6, right: 6, width: 6, height: 6, borderRadius: '50%', background: '#5FAFC6' }} />}
              </button>
              <div style={{ display: 'flex', gap: 2, background: '#F3FBFD', borderRadius: 9, padding: 2, border: '1px solid #DCE8EE' }}>
                <Link href="/map" style={{ display: 'flex', alignItems: 'center', padding: '5px 9px', borderRadius: 7, fontSize: 12, color: '#8FA1AE', textDecoration: 'none', fontFamily: "'Sora',sans-serif" }}>🗺</Link>
                <span style={{ display: 'flex', alignItems: 'center', padding: '5px 9px', borderRadius: 7, fontSize: 12, fontWeight: 700, color: '#1F2D3D', background: 'white', boxShadow: '0 1px 3px rgba(41,88,107,0.08)', fontFamily: "'Sora',sans-serif" }}>☰</span>
              </div>
            </div>
          </header>
        )}

        {isMobile && mobileSearchOpen && (
          <div style={{ position: 'sticky', top: 52, zIndex: 29, background: 'white', borderBottom: '1px solid #DCE8EE', padding: '10px 12px', display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <svg style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width={14} height={14} viewBox="0 0 20 20" fill="none">
                <circle cx="8.5" cy="8.5" r="5.5" stroke="#8FA1AE" strokeWidth="1.8"/>
                <path d="M13 13l3.5 3.5" stroke="#8FA1AE" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              <input autoFocus type="text" placeholder="研究室名・教員名・キーワード..." value={query} onChange={e => setQuery(e.target.value)}
                style={{ width: '100%', paddingLeft: 32, paddingRight: query ? 32 : 12, paddingTop: 10, paddingBottom: 10, fontSize: 14, borderRadius: 11, border: '1.5px solid #5FAFC6', background: '#F3FBFD', color: '#1F2D3D', outline: 'none', boxSizing: 'border-box', fontFamily: "'Noto Sans JP',sans-serif", boxShadow: '0 0 0 3px rgba(95,175,198,0.12)' }} />
              {query && <button onClick={() => setQuery('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#8FA1AE', padding: 2 }}>✕</button>}
            </div>
            <button onClick={() => { setMobileSearchOpen(false); setQuery('') }}
              style={{ fontSize: 13, color: '#5B6B79', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: '8px 0', fontFamily: "'Sora',sans-serif", flexShrink: 0 }}>
              キャンセル
            </button>
          </div>
        )}

        <div style={{ display: 'flex', flex: 1 }}>
          {!isMobile && (
            <aside style={{
              width: filterOpen ? FILTER_W + 16 : 52, flexShrink: 0,
              transition: 'width 0.22s ease',
              position: 'sticky', top: 54, height: 'calc(100vh - 54px)',
              overflowY: 'auto', display: 'flex', flexDirection: 'column', padding: '10px 0',
              borderRight: '1px solid #DCE8EE', background: 'white',
            }}>
              <div style={{ padding: '0 8px 8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button onClick={() => setFilterOpen(v => !v)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 8, color: hasFilter ? '#5FAFC6' : '#5B6B79', fontFamily: "'Sora',sans-serif", fontSize: 12, fontWeight: 700 }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F3FBFD')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                  <FilterIcon active={hasFilter} />
                  {filterOpen && <span>絞り込み</span>}
                  {hasFilter && <span style={{ background: '#5FAFC6', color: 'white', borderRadius: 999, fontSize: 9, padding: '1px 5px', lineHeight: 1.4 }}>{filterCount}</span>}
                </button>
                {filterOpen && hasFilter && <span style={{ fontSize: 11, color: '#8FA1AE', paddingRight: 8, fontFamily: "'Noto Sans JP',sans-serif" }}>{sortedLabs.length}件</span>}
              </div>
              {filterOpen && (
                <div style={{ margin: '0 8px', background: 'white', borderRadius: 14, border: '1px solid #DCE8EE', boxShadow: '0 2px 12px rgba(41,88,107,0.07)', overflow: 'hidden', flex: 1 }}>
                  <div style={{ padding: '8px 8px 0' }}>
                    <div style={{ display: 'flex', gap: 2, background: '#F3FBFD', borderRadius: 9, padding: 2, border: '1px solid #DCE8EE' }}>
                      {FILTER_TABS.map(({ mode, label }) => (
                        <button key={mode} className="filter-tab" onClick={() => switchMode(mode)}
                          style={{ flex: 1, padding: '5px 4px', borderRadius: 7, fontSize: 11, fontWeight: filterMode === mode ? 700 : 500, background: filterMode === mode ? 'white' : 'transparent', color: filterMode === mode ? '#1F2D3D' : '#8FA1AE', boxShadow: filterMode === mode ? '0 1px 4px rgba(41,88,107,0.08)' : 'none' }}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ width: '100%', height: 1, background: '#DCE8EE', margin: '8px 0 0' }} />
                  <div style={{ overflowY: 'auto' }}>{renderFilterContent()}</div>
                  {hasFilter && (
                    <div style={{ padding: '8px 12px', borderTop: '1px solid #DCE8EE' }}>
                      <button onClick={clearFilter} style={{ width: '100%', padding: '6px', fontSize: 11, color: '#EF4444', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 9, cursor: 'pointer', fontFamily: "'Sora',sans-serif" }}>✕ 絞り込み解除</button>
                    </div>
                  )}
                </div>
              )}
            </aside>
          )}

          <main style={{ flex: 1, padding: isMobile ? '12px 12px 32px' : '20px 24px 60px', minWidth: 0 }}>
            {isMobile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: 12, color: '#8FA1AE', fontFamily: "'Noto Sans JP',sans-serif", flex: 1, whiteSpace: 'nowrap' }}>{sortedLabs.length}件</span>
                <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
                  style={{ padding: '7px 8px', fontSize: 11, borderRadius: 9, border: '1.5px solid #DCE8EE', background: 'white', outline: 'none', fontFamily: "'Sora',sans-serif", color: '#1F2D3D', cursor: 'pointer', flexShrink: 0 }}>
                  <option value="default">デフォルト</option>
                  <option value="cluster">クラスタ別</option>
                  <option value="name">名前順</option>
                </select>
                <button onClick={() => setShowPinsOnly(v => !v)}
                  style={{ display: 'flex', alignItems: 'center', padding: '7px 10px', borderRadius: 9, border: `1px solid ${showPinsOnly ? '#FEF08A' : '#DCE8EE'}`, background: showPinsOnly ? '#FEFCE8' : 'white', color: showPinsOnly ? '#92400E' : '#5B6B79', fontSize: 14, cursor: 'pointer', flexShrink: 0 }}>
                  {showPinsOnly ? '⭐' : '☆'}
                </button>
                <button onClick={() => setMobileFilterOpen(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 9, border: `1.5px solid ${hasFilter ? '#5FAFC6' : '#DCE8EE'}`, background: hasFilter ? 'rgba(95,175,198,0.08)' : 'white', color: hasFilter ? '#5FAFC6' : '#5B6B79', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Sora',sans-serif", flexShrink: 0 }}>
                  <FilterIcon active={hasFilter} />
                  絞り込み
                  {hasFilter && <span style={{ background: '#5FAFC6', color: 'white', borderRadius: 999, fontSize: 9, fontWeight: 700, padding: '1px 4px', lineHeight: 1.4 }}>{filterCount}</span>}
                </button>
              </div>
            )}

            {sortedLabs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: '#8FA1AE' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                <p style={{ fontSize: 15, fontWeight: 600, fontFamily: "'Sora',sans-serif", color: '#5B6B79' }}>条件に一致する研究室が見つかりません</p>
                <button onClick={clearFilter} style={{ marginTop: 14, padding: '9px 20px', fontSize: 13, borderRadius: 11, border: '1px solid #DCE8EE', background: 'white', color: '#5B6B79', cursor: 'pointer', fontFamily: "'Sora',sans-serif", transition: 'all .15s', boxShadow: '0 1px 4px rgba(41,88,107,0.07)' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#5FAFC6'; e.currentTarget.style.color = '#3E95AE' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#DCE8EE'; e.currentTarget.style.color = '#5B6B79' }}>
                  絞り込みを解除
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: isMobile ? 12 : 16 }}>
                {sortedLabs.map((lab, idx) => {
                  const ci          = lab.cluster_id ?? 0
                  const color       = lab.cluster_id !== null ? C[ci % C.length] : '#94A3B8'
                  const chipBg      = lab.cluster_id !== null ? C_CHIP[ci % C_CHIP.length] : 'rgba(148,163,184,0.12)'
                  const clusterName = getClusterName(lab.cluster_id)  // ← DBから取得
                  const isPinned    = pins.includes(lab.id)
                  const courseInfo  = getLabCourseInfo(lab.id)
                  const bullets     = parseBullets(lab.summary_bullets)

                  return (
                    <div key={lab.id} className="lab-card card-anim"
                      style={{
                        background: 'white', borderRadius: 18,
                        border: `1.5px solid ${isPinned ? color : '#DCE8EE'}`,
                        boxShadow: isPinned ? '0 4px 20px rgba(41,88,107,0.12)' : '0 2px 8px rgba(41,88,107,0.06)',
                        padding: isMobile ? '16px' : '18px 20px',
                        display: 'flex', flexDirection: 'column', gap: 11,
                        animationDelay: `${Math.min(idx * 25, 400)}ms`, animationFillMode: 'both',
                      }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700, color, background: chipBg, padding: '2px 9px 2px 6px', borderRadius: 999, marginBottom: 6 }}>
                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: color }} />{clusterName}
                          </span>
                          <h2 style={{ fontSize: isMobile ? 16 : 15, fontWeight: 800, margin: '0 0 4px', color: '#1F2D3D', lineHeight: 1.3, letterSpacing: '-0.02em', fontFamily: "'Sora','Noto Sans JP',sans-serif" }}>{lab.name}</h2>
                          {lab.faculty_name && (
                            <p style={{ fontSize: 12, color: '#5B6B79', margin: 0, lineHeight: 1.4, fontFamily: "'Noto Sans JP',sans-serif" }}>
                              <span style={{ color: '#8FA1AE', fontWeight: 700, marginRight: 4 }}>教員</span>{lab.faculty_name}
                            </p>
                          )}
                        </div>
                        <button className="pin-btn" onClick={() => togglePin(lab.id)}
                          style={{ width: isMobile ? 38 : 34, height: isMobile ? 38 : 34, borderRadius: 10, background: isPinned ? '#FEFCE8' : '#F3FBFD', border: `1px solid ${isPinned ? '#FEF08A' : '#DCE8EE'}`, fontSize: isMobile ? 18 : 16, flexShrink: 0 }}>
                          {isPinned ? '⭐' : '☆'}
                        </button>
                      </div>

                      {(courseInfo || lab.dept) && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {courseInfo && (
                            <p style={{ fontSize: 11, color: '#5B6B79', margin: 0, lineHeight: 1.5, fontFamily: "'Noto Sans JP',sans-serif" }}>
                              <span style={{ color: '#8FA1AE', fontWeight: 700, marginRight: 4 }}>学科/コース</span>
                              {courseInfo.depts.join('・')}
                              <span style={{ color: '#5FAFC6' }}> › {courseInfo.courses.slice(0, 2).join(' / ')}</span>
                            </p>
                          )}
                          {lab.dept && (
                            <p style={{ fontSize: 11, color: '#5B6B79', margin: 0, lineHeight: 1.5, fontFamily: "'Noto Sans JP',sans-serif" }}>
                              <span style={{ color: '#8FA1AE', fontWeight: 700, marginRight: 4 }}>大学院</span>{lab.dept}
                            </p>
                          )}
                        </div>
                      )}

                      {bullets.length > 0 ? (
                        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5 }}>
                          {bullets.map((b, i) => (
                            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: '#5B6B79', lineHeight: 1.6, fontFamily: "'Noto Sans JP',sans-serif" }}>
                              <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0, marginTop: 7 }} />{b}
                            </li>
                          ))}
                        </ul>
                      ) : lab.summary_text ? (
                        <p style={{ fontSize: 12, color: '#5B6B79', margin: 0, lineHeight: 1.75, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontFamily: "'Noto Sans JP',sans-serif" }}>{lab.summary_text}</p>
                      ) : null}

                      {lab.tags.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {lab.tags.slice(0, 6).map((t, i) => (
                            <span key={i} className="tag-chip" onClick={() => { toggleTag(t); setFilterMode('tag') }}
                              style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: chipBg, color, fontWeight: 600, cursor: 'pointer', transition: 'opacity .15s', fontFamily: "'Noto Sans JP',sans-serif" }}>
                              {t}
                            </span>
                          ))}
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 11, borderTop: '1px solid #F3FBFD' }}>
                        <Link href="/map" style={{ fontSize: 11, color: '#8FA1AE', textDecoration: 'none', fontFamily: "'Noto Sans JP',sans-serif", transition: 'color .15s' }}
                          onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.color = '#5FAFC6')}
                          onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.color = '#8FA1AE')}>
                          🗺 マップで見る
                        </Link>
                        <Link href={`/lab/${lab.id}`}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: isMobile ? '9px 18px' : '7px 15px', borderRadius: 10, background: '#5FAFC6', color: 'white', fontSize: isMobile ? 13 : 12, fontWeight: 700, textDecoration: 'none', transition: 'all .15s', fontFamily: "'Sora',sans-serif", boxShadow: '0 2px 8px rgba(95,175,198,0.28)' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#3E95AE'; (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-1px)' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#5FAFC6'; (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)' }}>
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

        {isMobile && mobileFilterOpen && renderMobileFilterSheet()}
      </div>
    </>
  )
}