import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import PinButton from '@/components/PinButton'
import { CompareButton } from '@/components/CompareButton'
import { getClusterStyle } from '@/lib/clusters'
import YoutubeCarousel from '@/components/YoutubeCarousel'

// ── 2軸チャート ───────────────────────────────────────────────────────────────
function AxisChart({ axisX, axisY, color }: { axisX: number; axisY: number; color: string }) {
  const SIZE = 160, CENTER = SIZE / 2, RANGE = 0.25
  const clamp = (v: number) => Math.max(-RANGE, Math.min(RANGE, v))
  const px = CENTER + (clamp(axisX) / RANGE) * (CENTER - 16)
  const py = CENTER - (clamp(axisY) / RANGE) * (CENTER - 16)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: '#8FA1AE', margin: 0, letterSpacing: '0.08em', fontFamily: "'Sora',sans-serif" }}>研究スタイル</p>
      <div style={{ position: 'relative', width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} style={{ position: 'absolute', top: 0, left: 0 }}>
          <rect x={0} y={0} width={CENTER} height={CENTER} fill="rgba(95,175,198,0.04)" />
          <rect x={CENTER} y={0} width={CENTER} height={CENTER} fill="rgba(95,175,198,0.08)" />
          <rect x={0} y={CENTER} width={CENTER} height={CENTER} fill="rgba(95,175,198,0.08)" />
          <rect x={CENTER} y={CENTER} width={CENTER} height={CENTER} fill="rgba(95,175,198,0.04)" />
          <line x1={CENTER} y1={4} x2={CENTER} y2={SIZE - 4} stroke="#DCE8EE" strokeWidth={1} />
          <line x1={4} y1={CENTER} x2={SIZE - 4} y2={CENTER} stroke="#DCE8EE" strokeWidth={1} />
          <rect x={0.5} y={0.5} width={SIZE - 1} height={SIZE - 1} rx={12} fill="none" stroke="#DCE8EE" strokeWidth={1} />
          <circle cx={px} cy={py} r={7} fill={color} opacity={0.2} />
          <circle cx={px} cy={py} r={4} fill={color} />
        </svg>
        <span style={{ position: 'absolute', top: 4, left: '50%', transform: 'translateX(-50%)', fontSize: 9, color: '#8FA1AE', fontFamily: "'Noto Sans JP',sans-serif", whiteSpace: 'nowrap' }}>実験・フィールド</span>
        <span style={{ position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)', fontSize: 9, color: '#8FA1AE', fontFamily: "'Noto Sans JP',sans-serif", whiteSpace: 'nowrap' }}>理論・計算</span>
        <span style={{ position: 'absolute', left: 4, top: '50%', transform: 'translateY(-50%)', fontSize: 9, color: '#8FA1AE', fontFamily: "'Noto Sans JP',sans-serif" }}>基礎</span>
        <span style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', fontSize: 9, color: '#8FA1AE', fontFamily: "'Noto Sans JP',sans-serif" }}>応用</span>
      </div>
    </div>
  )
}

// ── 学生ピクトグラム ──────────────────────────────────────────────────────────
function PersonIcon({ color }: { color: string }) {
  return (
    <svg width={16} height={22} viewBox="0 0 16 22" fill={color}>
      <circle cx={8} cy={4} r={3.5} />
      <path d="M2 21c0-3.314 2.686-6 6-6s6 2.686 6 6" strokeLinecap="round" />
      <rect x={2} y={10} width={12} height={8} rx={3} />
    </svg>
  )
}

function StudentPictogram({ doc, master, under }: { doc: number | null; master: number | null; under: number | null }) {
  const d = doc ?? 0, m = master ?? 0, u = under ?? 0
  const total = d + m + u
  if (total === 0) return null
  const groups = [
    { label: 'D（博士）', count: d, color: '#7C3AED' },
    { label: 'M（修士）', count: m, color: '#5FAFC6' },
    { label: 'B（学部）', count: u, color: '#34D399' },
  ]
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 12 }}>
        {groups.flatMap(g =>
          Array.from({ length: g.count }, (_, i) => (
            <PersonIcon key={`${g.label}-${i}`} color={g.color} />
          ))
        )}
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        {groups.filter(g => g.count > 0).map(g => (
          <div key={g.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: g.color, flexShrink: 0, display: 'inline-block' }} />
            <span style={{ fontSize: 12, color: '#5B6B79', fontFamily: "'Noto Sans JP',sans-serif" }}>{g.label}：{g.count}名</span>
          </div>
        ))}
        <span style={{ fontSize: 12, color: '#8FA1AE', fontFamily: "'Noto Sans JP',sans-serif" }}>合計 {total}名</span>
      </div>
    </div>
  )
}

export default async function LabDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: lab } = await supabase
    .from('labs')
    .select('*, lab_tags(tag)')
    .eq('id', id)
    .single()

  if (!lab) return (
    <main style={{ padding: 24, fontFamily: "'Sora','Noto Sans JP',sans-serif", background: '#F3FBFD', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#5B6B79', fontSize: 14 }}>研究室が見つかりません</p>
      <Link href="/" style={{ color: '#5FAFC6', fontSize: 13, marginTop: 8 }}>← マップに戻る</Link>
    </main>
  )

  const ROLE_ORDER: Record<string, number> = {
    '教授': 0, '特任教授': 1, '准教授': 2, '特任准教授': 3,
    '講師': 4, '特任講師': 5, '助教': 6, '特任助教': 7,
  }

  const { data: facultyLabRows } = await supabase
    .from('faculty_labs')
    .select('role, is_primary, faculties(id, name, researchmap_id, twitter_url, instagram_url, x_username)')
    .eq('lab_id', id)
    .order('is_primary', { ascending: false })

  type FacultyRow = {
    id: string; name: string; role: string | null
    researchmap_id: string | null; twitter_url: string | null
    instagram_url: string | null; x_username: string | null
  }
  const faculties = (facultyLabRows ?? [])
    .sort((a, b) => {
      const aOrder = ROLE_ORDER[a.role ?? ''] ?? 99
      const bOrder = ROLE_ORDER[b.role ?? ''] ?? 99
      return aOrder - bOrder
    })
    .map(row => {
      const rawFac = row.faculties
      const fac = (Array.isArray(rawFac) ? rawFac[0] : rawFac) as unknown as {
        id: string; name: string; researchmap_id: string | null
        twitter_url: string | null; instagram_url: string | null; x_username: string | null
      } | null
      if (!fac) return null
      return { ...fac, role: (row.role ?? null) as string | null } satisfies FacultyRow
    })
    .filter((f): f is FacultyRow => f !== null)

  const { data: edgesA } = await supabase.from('edges').select('to_lab_id,weight').eq('from_lab_id', id).eq('type', 'similarity').order('weight', { ascending: false }).limit(5)
  const { data: edgesB } = await supabase.from('edges').select('from_lab_id,weight').eq('to_lab_id', id).eq('type', 'similarity').order('weight', { ascending: false }).limit(5)

  const rawNeighbors = [
    ...(edgesA ?? []).map(e => ({ id: e.to_lab_id, similarity: e.weight })),
    ...(edgesB ?? []).map(e => ({ id: e.from_lab_id, similarity: e.weight })),
  ].sort((a, b) => b.similarity - a.similarity).slice(0, 5)

  const neighborIds = rawNeighbors.map(n => n.id)
  const { data: neighborLabs } = neighborIds.length > 0
    ? await supabase.from('labs').select('id,name,faculty_name,cluster_id,lab_tags(tag)').in('id', neighborIds)
    : { data: [] }

  const neighbors = rawNeighbors
    .map(n => ({ ...n, lab: neighborLabs?.find(l => l.id === n.id) }))
    .filter(n => n.lab)

  const { color: clusterColor, chipBg, stroke: strokeColor } = getClusterStyle(lab.cluster_id)
  const clusterName = `クラスタ${lab.cluster_id ?? '不明'}`
  const depts: string[] = [lab.dept, lab.dept2].filter(Boolean) as string[]

  const bullets: string[] = (() => {
    if (!lab.summary_bullets) return []
    if (Array.isArray(lab.summary_bullets)) return lab.summary_bullets
    try { return JSON.parse(lab.summary_bullets) } catch { return [] }
  })()

  const youtubeUrls: string[] = (() => {
    if (!lab.youtube_video_urls) return []
    if (Array.isArray(lab.youtube_video_urls)) return lab.youtube_video_urls
    try { return JSON.parse(lab.youtube_video_urls) } catch { return [] }
  })()

  const hasAxisData = lab.axis_x != null && lab.axis_y != null
  const hasStudentData = (lab.student_count_doc ?? 0) + (lab.student_count_master ?? 0) + (lab.student_count_under ?? 0) > 0
  const hasIntroContent = youtubeUrls.length > 0 || lab.twitter_url

  const contactUrl = `/contact?type=correction&lab_id=${id}&lab_name=${encodeURIComponent(lab.name)}`
  const contributeUrl = `/contribute?lab_id=${id}&lab_name=${encodeURIComponent(lab.name)}`

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Noto+Sans+JP:wght@400;500;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; background: #F3FBFD; }
        .back-link:hover { color: #3E95AE !important; border-color: #5FAFC6 !important; }
        .lab-url-btn:hover { background: #F3FBFD !important; border-color: #5FAFC6 !important; color: #3E95AE !important; }
        .neighbor-card { transition: border-color .18s, box-shadow .18s, transform .18s; }
        .neighbor-card:hover { transform: translateY(-1px); border-color: #5FAFC6 !important; box-shadow: 0 4px 16px rgba(41,88,107,0.10) !important; }
        .correction-btn:hover { background: rgba(95,175,198,0.12) !important; border-color: #5FAFC6 !important; }
        .rm-btn:hover { background: rgba(80,70,229,0.15) !important; border-color: #5046E5 !important; }
        .sns-btn:hover { opacity: 0.75 !important; }
        .section-card { background: white; border-radius: 20px; border: 1.5px solid #DCE8EE; box-shadow: 0 4px 24px rgba(41,88,107,0.07); padding: 24px; margin-bottom: 16px; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(95,175,198,0.3); border-radius: 99px; }
        @media (max-width: 600px) {
          .hd-back-full { display: none !important; }
          .hd-back-short { display: inline-flex !important; }
          .section-card { padding: 16px !important; border-radius: 16px !important; }
          .lab-h1 { font-size: 20px !important; }
          .staff-row { flex-direction: column !important; align-items: flex-start !important; gap: 6px !important; }
          .axis-chart-row { flex-direction: column !important; }
          .neighbor-card { flex-wrap: wrap !important; row-gap: 6px !important; }
          .neighbor-badge { margin-left: auto !important; }
          .fix-footer { flex-direction: column !important; align-items: flex-start !important; }
          .meta-text { word-break: break-all !important; white-space: normal !important; }
          .contribute-bar { flex-direction: column !important; align-items: flex-start !important; }
          .basic-info-links { flex-direction: column !important; align-items: flex-start !important; }
        }
      `}</style>

      {/* ヘッダー */}
      <header style={{ position: 'sticky', top: 0, zIndex: 30, background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: '1px solid #DCE8EE', padding: '0 16px', height: 54, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: 'linear-gradient(135deg,#5FAFC6 0%,#8FD3E0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 13, boxShadow: '0 3px 10px rgba(95,175,198,0.3)' }}>L</div>
          <span style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 14, color: '#1F2D3D', letterSpacing: '-0.02em' }}>Labo Navi</span>
        </Link>
        <Link href="/map" className="back-link" style={{ fontSize: 13, color: '#8FA1AE', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: "'Sora',sans-serif", fontWeight: 600, padding: '6px 12px', borderRadius: 9, flexShrink: 0, border: '1px solid #DCE8EE', background: 'white', transition: 'color .15s, border-color .15s' }}>
          <span className="hd-back-full">← マップに戻る</span>
          <span className="hd-back-short" style={{ display: 'none', alignItems: 'center', gap: 4 }}>← 戻る</span>
        </Link>
      </header>

      <main style={{ maxWidth: 700, margin: '0 auto', padding: '24px 16px 72px', fontFamily: "'Noto Sans JP',sans-serif", color: '#1F2D3D' }}>

        {/* 情報提供バー */}
        <div className="contribute-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderRadius: 14, marginBottom: 16, background: 'linear-gradient(135deg, rgba(80,70,229,0.05) 0%, rgba(95,175,198,0.05) 100%)', border: '1.5px solid rgba(80,70,229,0.14)', flexWrap: 'wrap', gap: 8 }}>
          <p style={{ fontSize: 12, color: '#5B6B79', margin: 0, lineHeight: 1.5, fontFamily: "'Noto Sans JP',sans-serif" }}>📬 SNS・動画・教員情報をご存知ですか？</p>
          <Link href={contributeUrl} style={{ fontSize: 12, color: '#5046E5', textDecoration: 'none', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 13px', borderRadius: 9, border: '1.5px solid rgba(80,70,229,0.22)', background: 'rgba(80,70,229,0.06)', fontFamily: "'Sora',sans-serif", whiteSpace: 'nowrap' }}>情報を提供する →</Link>
        </div>

        {/* ① 研究室名・クラスタ・ピン */}
        <div className="section-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: clusterColor, background: chipBg, padding: '3px 11px 3px 7px', borderRadius: 999, letterSpacing: '0.01em', fontFamily: "'Sora',sans-serif" }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: clusterColor, flexShrink: 0 }} />
              {clusterName}
            </span>
            <PinButton labId={id} />
          </div>
          {depts.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
              {depts.map((d, i) => (
                <span key={i} style={{
                  fontSize: 11, fontWeight: 600,
                  padding: '2px 10px', borderRadius: 999,
                  background: 'rgba(91,107,121,0.08)',
                  color: '#5B6B79',
                  border: '1px solid rgba(91,107,121,0.18)',
                  fontFamily: "'Noto Sans JP',sans-serif",
                }}>
                  {d}
                </span>
              ))}
            </div>
          )}
          <h1 className="lab-h1" style={{ fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: '-0.03em', lineHeight: 1.25, fontFamily: "'Sora','Noto Sans JP',sans-serif", color: '#1F2D3D' }}>
            {lab.name}
          </h1>
          <div style={{ marginTop: 12 }}>
            <CompareButton labId={lab.id} labName={lab.name} size="medium" />
          </div>
        </div>

        {/* ② STAFF */}
        <div className="section-card">
          <p style={{ fontSize: 11, fontWeight: 700, color: '#8FA1AE', marginBottom: 12, marginTop: 0, letterSpacing: '0.08em', fontFamily: "'Sora',sans-serif" }}>STAFF</p>
          {faculties.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {faculties.map((fac) => {
                const rmUrl = fac.researchmap_id ? `https://researchmap.jp/${fac.researchmap_id}` : null
                const xUrl = fac.twitter_url ?? (fac.x_username ? `https://x.com/${fac.x_username}` : null)
                return (
                  <div key={fac.id} className="staff-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 11, background: '#F3FBFD', border: '1px solid #DCE8EE', gap: 10, flexWrap: 'wrap' }}>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#1F2D3D', fontFamily: "'Noto Sans JP',sans-serif" }}>{fac.name}</span>
                      {fac.role && <span style={{ fontSize: 11, color: '#8FA1AE', marginLeft: 8, fontFamily: "'Noto Sans JP',sans-serif" }}>{fac.role}</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {xUrl && (
                        <a href={xUrl} target="_blank" rel="noopener noreferrer" className="sns-btn" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, background: '#000', flexShrink: 0, transition: 'opacity .15s' }}>
                          <svg width={13} height={13} viewBox="0 0 24 24" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                        </a>
                      )}
                      {fac.instagram_url && (
                        <a href={fac.instagram_url} target="_blank" rel="noopener noreferrer" className="sns-btn" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: 'linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', transition: 'opacity .15s' }}>
                          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.5" fill="white" stroke="none" /></svg>
                        </a>
                      )}
                      {rmUrl ? (
                        <a href={rmUrl} target="_blank" rel="noopener noreferrer" className="rm-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, color: '#5046E5', textDecoration: 'none', background: 'rgba(80,70,229,0.08)', border: '1.5px solid rgba(80,70,229,0.25)', fontFamily: "'Sora',sans-serif", transition: 'all .15s' }}>
                          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
                          researchmap
                        </a>
                      ) : (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, color: '#C4CDD6', cursor: 'not-allowed', background: '#F3F4F6', border: '1.5px solid #E5E7EB', fontFamily: "'Sora',sans-serif" }}>
                          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
                          researchmap
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: '#8FA1AE', margin: 0, fontFamily: "'Noto Sans JP',sans-serif" }}>教員情報は未登録です</p>
          )}
        </div>

        {/* ③ TAGS */}
        <div className="section-card">
          <p style={{ fontSize: 11, fontWeight: 700, color: '#8FA1AE', marginBottom: 10, marginTop: 0, letterSpacing: '0.08em', fontFamily: "'Sora',sans-serif" }}>TAGS</p>
          {lab.lab_tags?.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {lab.lab_tags.map((t: { tag: string }, i: number) => (
                <span key={i} style={{ fontSize: 12, padding: '4px 11px', borderRadius: 999, background: chipBg, color: clusterColor, fontWeight: 600, border: `1px solid ${strokeColor}`, fontFamily: "'Noto Sans JP',sans-serif" }}>{t.tag}</span>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: '#8FA1AE', margin: 0, fontFamily: "'Noto Sans JP',sans-serif" }}>タグは未登録です</p>
          )}
        </div>

        {/* ④ 基礎情報 */}
        <div className="section-card">
          <p style={{ fontSize: 11, fontWeight: 700, color: '#8FA1AE', marginBottom: 16, marginTop: 0, letterSpacing: '0.08em', fontFamily: "'Sora',sans-serif" }}>基礎情報</p>

          {/* リンク群 */}
          <div className="basic-info-links" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            {lab.lab_url ? (
              <a href={lab.lab_url} target="_blank" rel="noopener noreferrer" className="lab-url-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#5FAFC6', textDecoration: 'none', fontWeight: 600, padding: '7px 14px', borderRadius: 10, border: '1.5px solid rgba(95,175,198,0.35)', background: 'rgba(95,175,198,0.05)', fontFamily: "'Sora',sans-serif", transition: 'all .15s' }}>
                🔗 公式HP
              </a>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#C4CDD6', padding: '7px 14px', borderRadius: 10, border: '1.5px solid #E5E7EB', background: '#F9FAFB', fontFamily: "'Sora',sans-serif" }}>
                🔗 公式HP（未登録）
              </span>
            )}
            {lab.twitter_url && (
              <a href={lab.twitter_url} target="_blank" rel="noopener noreferrer" className="sns-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'white', textDecoration: 'none', fontWeight: 600, padding: '7px 14px', borderRadius: 10, background: '#000', fontFamily: "'Sora',sans-serif", transition: 'opacity .15s' }}>
                <svg width={13} height={13} viewBox="0 0 24 24" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                公式X
              </a>
            )}
            {lab.instagram_url && (
              <a href={lab.instagram_url} target="_blank" rel="noopener noreferrer" className="sns-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'white', textDecoration: 'none', fontWeight: 600, padding: '7px 14px', borderRadius: 10, background: 'linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', fontFamily: "'Sora',sans-serif", transition: 'opacity .15s' }}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.5" fill="white" stroke="none" /></svg>
                Instagram
              </a>
            )}
            {lab.instagram_url_other && (
              <a href={lab.instagram_url_other} target="_blank" rel="noopener noreferrer" className="sns-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'white', textDecoration: 'none', fontWeight: 600, padding: '7px 14px', borderRadius: 10, background: 'linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', fontFamily: "'Sora',sans-serif", transition: 'opacity .15s', opacity: 0.8 }}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.5" fill="white" stroke="none" /></svg>
                Instagram（非公式）
              </a>
            )}
            {lab.youtube_channel_url && (
              <a href={lab.youtube_channel_url} target="_blank" rel="noopener noreferrer" className="sns-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'white', textDecoration: 'none', fontWeight: 600, padding: '7px 14px', borderRadius: 10, background: '#FF0000', fontFamily: "'Sora',sans-serif", transition: 'opacity .15s' }}>
                <svg width={15} height={12} viewBox="0 0 24 18" fill="white"><path d="M23.495 2.205a3.02 3.02 0 0 0-2.122-2.122C19.505 0 12 0 12 0S4.495 0 2.627.083A3.02 3.02 0 0 0 .505 2.205 31.247 31.247 0 0 0 0 9a31.247 31.247 0 0 0 .505 6.795 3.02 3.02 0 0 0 2.122 2.122C4.495 18 12 18 12 18s7.505 0 9.373-.083a3.02 3.02 0 0 0 2.122-2.122A31.247 31.247 0 0 0 24 9a31.247 31.247 0 0 0-.505-6.795zM9.545 12.818V5.182L15.818 9l-6.273 3.818z" /></svg>
                YouTubeチャンネル
              </a>
            )}
          </div>

          {/* 学生数 */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#8FA1AE', marginBottom: 12, marginTop: 0, letterSpacing: '0.08em', fontFamily: "'Sora',sans-serif" }}>
              学生数
              {lab.student_count_year && <span style={{ fontSize: 10, fontWeight: 400, marginLeft: 6, color: '#B0BEC5' }}>（{lab.student_count_year}時点）</span>}
            </p>
            {hasStudentData ? (
              <StudentPictogram doc={lab.student_count_doc} master={lab.student_count_master} under={lab.student_count_under} />
            ) : (
              <p style={{ fontSize: 13, color: '#8FA1AE', margin: 0, fontFamily: "'Noto Sans JP',sans-serif" }}>学生数は未登録です</p>
            )}
          </div>
        </div>

        {/* ⑤ 研究概要 */}
        <div className="section-card">
          <p style={{ fontSize: 11, fontWeight: 700, color: '#8FA1AE', marginBottom: 16, marginTop: 0, letterSpacing: '0.08em', fontFamily: "'Sora',sans-serif" }}>研究概要</p>

          {/* 2軸チャート */}
          {hasAxisData && (
            <div className="axis-chart-row" style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 20, padding: '16px 20px', borderRadius: 16, background: '#F3FBFD', border: '1px solid #DCE8EE' }}>
              <AxisChart axisX={lab.axis_x} axisY={lab.axis_y} color={clusterColor} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#8FA1AE', margin: '0 0 10px', letterSpacing: '0.08em', fontFamily: "'Sora',sans-serif" }}>スコア</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div>
                    <p style={{ fontSize: 11, color: '#8FA1AE', margin: '0 0 4px', fontFamily: "'Noto Sans JP',sans-serif" }}>基礎 ↔ 応用</p>
                    <div style={{ height: 6, borderRadius: 99, background: '#DCE8EE', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 99, background: clusterColor, width: `${Math.round(((lab.axis_x + 0.25) / 0.5) * 100)}%` }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                      <span style={{ fontSize: 9, color: '#B0BEC5', fontFamily: "'Noto Sans JP',sans-serif" }}>基礎</span>
                      <span style={{ fontSize: 9, color: '#B0BEC5', fontFamily: "'Noto Sans JP',sans-serif" }}>応用</span>
                    </div>
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: '#8FA1AE', margin: '0 0 4px', fontFamily: "'Noto Sans JP',sans-serif" }}>理論 ↔ 実験</p>
                    <div style={{ height: 6, borderRadius: 99, background: '#DCE8EE', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 99, background: clusterColor, width: `${Math.round(((lab.axis_y + 0.15) / 0.3) * 100)}%` }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                      <span style={{ fontSize: 9, color: '#B0BEC5', fontFamily: "'Noto Sans JP',sans-serif" }}>理論</span>
                      <span style={{ fontSize: 9, color: '#B0BEC5', fontFamily: "'Noto Sans JP',sans-serif" }}>実験</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 箇条書き */}
          {bullets.length > 0 && (
            <div style={{ background: chipBg, borderRadius: 14, padding: '14px 18px', marginBottom: 18, border: `1px solid ${strokeColor}` }}>
              {bullets.map((b: string, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: i < bullets.length - 1 ? 10 : 0 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: clusterColor, flexShrink: 0, marginTop: 7 }} />
                  <p style={{ fontSize: 13, lineHeight: 1.75, color: '#1F2D3D', margin: 0, fontFamily: "'Noto Sans JP',sans-serif" }}>{b}</p>
                </div>
              ))}
            </div>
          )}

          {/* 概要文章 */}
          <p style={{ fontSize: 14, lineHeight: 1.9, color: '#5B6B79', whiteSpace: 'pre-wrap', margin: 0, fontFamily: "'Noto Sans JP',sans-serif" }}>
            {lab.summary_long ?? lab.summary_text ?? '（研究概要は未取得です）'}
          </p>
          {lab.summary_source_url && (
            <a href={lab.summary_source_url_override ?? lab.summary_source_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#8FA1AE', textDecoration: 'underline', marginTop: 12, display: 'inline-block', fontFamily: "'Noto Sans JP',sans-serif" }}>出典を見る →</a>
          )}
        </div>

        {/* ⑥ 紹介コンテンツ */}
        {hasIntroContent && (
          <div className="section-card">
            <p style={{ fontSize: 11, fontWeight: 700, color: '#8FA1AE', marginBottom: 16, marginTop: 0, letterSpacing: '0.08em', fontFamily: "'Sora',sans-serif" }}>紹介</p>

            {/* YouTube動画カルーセル */}
            {youtubeUrls.length > 0 && (
              <div style={{ marginBottom: lab.twitter_url ? 20 : 0 }}>
                <p style={{ fontSize: 12, color: '#8FA1AE', marginBottom: 12, marginTop: 0, fontFamily: "'Noto Sans JP',sans-serif" }}>📹 紹介動画</p>
                <YoutubeCarousel urls={youtubeUrls} />
              </div>
            )}

            {/* X */}
            {lab.twitter_url && (
              <div>
                <p style={{ fontSize: 12, color: '#8FA1AE', marginBottom: 10, marginTop: 0, fontFamily: "'Noto Sans JP',sans-serif" }}>𝕏 X（Twitter）</p>
                <a href={lab.twitter_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 12, background: 'rgba(0,0,0,0.04)', border: '1.5px solid rgba(0,0,0,0.12)', textDecoration: 'none' }}>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="#000"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#5B6B79', fontFamily: "'Noto Sans JP',sans-serif" }}>Xを見る →</span>
                </a>
              </div>
            )}
          </div>
        )}

        {/* ⑦ 近い研究室 Top5 */}
        {neighbors.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#5B6B79', marginBottom: 12, fontFamily: "'Sora',sans-serif" }}>近い研究室 Top{neighbors.length}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {neighbors.map((n, i) => {
                const { color: nc, chipBg: nChipBg, stroke: nStroke } = getClusterStyle(n.lab!.cluster_id)
                return (
                  <Link key={n.id} href={`/lab/${n.id}`} className="neighbor-card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderRadius: 14, background: 'white', border: '1px solid #DCE8EE', textDecoration: 'none', color: 'inherit', boxShadow: '0 2px 8px rgba(41,88,107,0.05)' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#DCE8EE', width: 18, flexShrink: 0, textAlign: 'center', fontFamily: "'Sora',sans-serif" }}>{i + 1}</span>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: nc, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, margin: '0 0 2px', color: '#1F2D3D', fontFamily: "'Noto Sans JP',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.lab!.name}</p>
                      <p style={{ fontSize: 12, color: '#8FA1AE', margin: 0, fontFamily: "'Noto Sans JP',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.lab!.faculty_name}</p>
                    </div>
                    <span className="neighbor-badge" style={{ fontSize: 11, color: nc, fontWeight: 700, background: nChipBg, padding: '3px 10px', borderRadius: 999, flexShrink: 0, border: `1px solid ${nStroke}`, fontFamily: "'Sora',sans-serif" }}>
                      {Math.round(n.similarity * 100)}%
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* フッター */}
        <div className="fix-footer section-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <p style={{ fontSize: 12, color: '#5B6B79', margin: 0, lineHeight: 1.5, fontFamily: "'Noto Sans JP',sans-serif" }}>情報に誤りや変更がありますか？</p>
          <Link href={contactUrl} className="correction-btn" style={{ fontSize: 12, color: '#5FAFC6', textDecoration: 'none', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 13px', borderRadius: 9, border: '1.5px solid rgba(95,175,198,0.3)', background: 'rgba(95,175,198,0.06)', fontFamily: "'Sora',sans-serif", transition: 'all .15s' }}>
            ✏️ 情報修正を依頼する
          </Link>
        </div>

        <p className="meta-text" style={{ fontSize: 11, color: '#DCE8EE', marginTop: 16, fontFamily: "'Noto Sans JP',sans-serif", wordBreak: 'break-all' }}>
          取得元: {lab.summary_source_url ?? '未設定'} ／ 最終取得: {lab.fetched_at?.slice(0, 10) ?? '未取得'}
        </p>
      </main>
    </>
  )
}