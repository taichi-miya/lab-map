import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import PinButton from '@/components/PinButton'
import { getClusterStyle } from '@/lib/clusters'

export default async function LabDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: lab } = await supabase
    .from('labs')
    .select('*, lab_tags(tag)')
    .eq('id', id)
    .single()

  if (!lab) return (
    <main style={{
      padding: 24,
      fontFamily: "'Sora','Noto Sans JP',sans-serif",
      background: '#F3FBFD', minHeight: '100vh',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    }}>
      <p style={{ color: '#5B6B79', fontSize: 14 }}>研究室が見つかりません</p>
      <Link href="/" style={{ color: '#5FAFC6', fontSize: 13, marginTop: 8 }}>← マップに戻る</Link>
    </main>
  )

  // ── 教員情報 ──
  const { data: faculties } = await supabase
    .from('faculties')
    .select('id, name, role, researchmap_id, twitter_url, instagram_url, x_username')
    .eq('lab_id', id)
    .order('name')

  // 近い研究室 Top5
  const { data: edgesA } = await supabase
    .from('edges')
    .select('lab_b,similarity')
    .eq('lab_a', id)
    .order('similarity', { ascending: false })
    .limit(5)

  const { data: edgesB } = await supabase
    .from('edges')
    .select('lab_a,similarity')
    .eq('lab_b', id)
    .order('similarity', { ascending: false })
    .limit(5)

  const rawNeighbors = [
    ...(edgesA ?? []).map(e => ({ id: e.lab_b, similarity: e.similarity })),
    ...(edgesB ?? []).map(e => ({ id: e.lab_a, similarity: e.similarity })),
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

  const bullets: string[] = (() => {
    if (!lab.summary_bullets) return []
    if (Array.isArray(lab.summary_bullets)) return lab.summary_bullets
    try { return JSON.parse(lab.summary_bullets) } catch { return [] }
  })()

  const contactUrl = `/contact?type=correction&lab_id=${id}&lab_name=${encodeURIComponent(lab.name)}`
  const contributeUrl = `/contribute?lab_id=${id}&lab_name=${encodeURIComponent(lab.name)}`

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Noto+Sans+JP:wght@400;500;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; background: #F3FBFD; }

        .back-link:hover    { color: #3E95AE !important; border-color: #5FAFC6 !important; }
        .lab-url-btn:hover  { background: #F3FBFD !important; border-color: #5FAFC6 !important; color: #3E95AE !important; }
        .neighbor-card      { transition: border-color .18s, box-shadow .18s, transform .18s; }
        .neighbor-card:hover { transform: translateY(-1px); border-color: #5FAFC6 !important; box-shadow: 0 4px 16px rgba(41,88,107,0.10) !important; }
        .correction-btn:hover { background: rgba(95,175,198,0.12) !important; border-color: #5FAFC6 !important; }
        .rm-btn:hover { background: rgba(80,70,229,0.15) !important; border-color: #5046E5 !important; }
        .sns-btn:hover { opacity: 0.75 !important; }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(95,175,198,0.3); border-radius: 99px; }

        @media (max-width: 600px) {
          .hd-back-full { display: none !important; }
          .hd-back-short { display: inline-flex !important; }
          .main-card { padding: 18px 14px !important; border-radius: 18px !important; }
          .lab-h1 { font-size: 20px !important; margin-bottom: 14px !important; }
          .staff-row { flex-direction: column !important; align-items: flex-start !important; gap: 6px !important; }
          .link-row { flex-direction: column !important; align-items: flex-start !important; }
          .neighbor-card { flex-wrap: wrap !important; row-gap: 6px !important; }
          .neighbor-badge { margin-left: auto !important; }
          .fix-footer { flex-direction: column !important; align-items: flex-start !important; }
          .meta-text { word-break: break-all !important; white-space: normal !important; }
          .contribute-bar { flex-direction: column !important; align-items: flex-start !important; }
        }
      `}</style>

      {/* ── ヘッダー ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 30,
        background: 'rgba(255,255,255,0.94)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid #DCE8EE',
        padding: '0 16px', height: 54,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 9, flexShrink: 0,
            background: 'linear-gradient(135deg,#5FAFC6 0%,#8FD3E0 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 13,
            boxShadow: '0 3px 10px rgba(95,175,198,0.3)',
          }}>L</div>
          <span style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 14, color: '#1F2D3D', letterSpacing: '-0.02em' }}>Labo Navi</span>
        </Link>
        <Link href="/map" className="back-link" style={{
          fontSize: 13, color: '#8FA1AE', textDecoration: 'none',
          display: 'inline-flex', alignItems: 'center', gap: 5,
          fontFamily: "'Sora',sans-serif", fontWeight: 600,
          padding: '6px 12px', borderRadius: 9, flexShrink: 0,
          border: '1px solid #DCE8EE', background: 'white',
          transition: 'color .15s, border-color .15s',
        }}>
          <span className="hd-back-full">← マップに戻る</span>
          <span className="hd-back-short" style={{ display: 'none', alignItems: 'center', gap: 4 }}>← 戻る</span>
        </Link>
      </header>

      <main style={{
        maxWidth: 700, margin: '0 auto', padding: '24px 16px 72px',
        fontFamily: "'Noto Sans JP',sans-serif", color: '#1F2D3D',
      }}>

        {/* ── 情報提供バー（最上部） ── */}
        <div className="contribute-bar" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 18px', borderRadius: 14, marginBottom: 16,
          background: 'linear-gradient(135deg, rgba(80,70,229,0.05) 0%, rgba(95,175,198,0.05) 100%)',
          border: '1.5px solid rgba(80,70,229,0.14)',
          flexWrap: 'wrap', gap: 8,
        }}>
          <p style={{ fontSize: 12, color: '#5B6B79', margin: 0, lineHeight: 1.5, fontFamily: "'Noto Sans JP',sans-serif" }}>
            📬 SNS・動画・教員情報をご存知ですか？
          </p>
          <Link href={contributeUrl} style={{
            fontSize: 12, color: '#5046E5', textDecoration: 'none', fontWeight: 700,
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '6px 13px', borderRadius: 9,
            border: '1.5px solid rgba(80,70,229,0.22)',
            background: 'rgba(80,70,229,0.06)',
            fontFamily: "'Sora',sans-serif",
            whiteSpace: 'nowrap',
          }}>
            情報を提供する →
          </Link>
        </div>

        {/* ── メインカード ── */}
        <div className="main-card" style={{
          background: 'white', borderRadius: 24,
          border: `1.5px solid ${strokeColor}`,
          boxShadow: '0 4px 24px rgba(41,88,107,0.09)',
          padding: '28px 28px',
          marginBottom: 24,
        }}>

          {/* クラスタバッジ＋ピンボタン */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: 11, fontWeight: 700, color: clusterColor,
              background: chipBg, padding: '3px 11px 3px 7px', borderRadius: 999,
              letterSpacing: '0.01em', fontFamily: "'Sora',sans-serif",
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: clusterColor, flexShrink: 0 }} />
              {clusterName}
            </span>
            <PinButton labId={id} />
          </div>

          {/* 研究室名 */}
          <h1 className="lab-h1" style={{
            fontSize: 26, fontWeight: 800, margin: '0 0 20px',
            letterSpacing: '-0.03em', lineHeight: 1.25,
            fontFamily: "'Sora','Noto Sans JP',sans-serif", color: '#1F2D3D',
          }}>
            {lab.name}
          </h1>

          {/* ── STAFF ── */}
          {faculties && faculties.length > 0 && (
            <div style={{ marginBottom: 22 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#8FA1AE', marginBottom: 8, letterSpacing: '0.08em', fontFamily: "'Sora',sans-serif" }}>
                STAFF
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {faculties.map((fac) => {
                  const rmUrl = fac.researchmap_id ? `https://researchmap.jp/${fac.researchmap_id}` : null
                  const hasRM = !!rmUrl
                  const hasX  = !!(fac.twitter_url || fac.x_username)
                  const hasIG = !!fac.instagram_url
                  const xUrl  = fac.twitter_url ?? (fac.x_username ? `https://x.com/${fac.x_username}` : null)
                  return (
                    <div key={fac.id} className="staff-row" style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 14px', borderRadius: 11,
                      background: '#F3FBFD', border: '1px solid #DCE8EE',
                      gap: 10, flexWrap: 'wrap',
                    }}>
                      {/* 名前・役職 */}
                      <div>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#1F2D3D', fontFamily: "'Noto Sans JP',sans-serif" }}>
                          {fac.name}
                        </span>
                        {fac.role && (
                          <span style={{ fontSize: 11, color: '#8FA1AE', marginLeft: 8, fontFamily: "'Noto Sans JP',sans-serif" }}>
                            {fac.role}
                          </span>
                        )}
                      </div>

                      {/* ボタン群 */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>

                        {/* ResearchMap：常に表示、リンクあり/なしで色分け */}
                        {hasRM ? (
                          
                            href={rmUrl!}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="researchmapを開く"
                            className="rm-btn"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                              color: '#5046E5', textDecoration: 'none',
                              background: 'rgba(80,70,229,0.08)',
                              border: '1.5px solid rgba(80,70,229,0.25)',
                              fontFamily: "'Sora',sans-serif",
                              transition: 'all .15s',
                            }}
                          >
                            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                            </svg>
                            researchmap
                          </a>
                        ) : (
                          <div
                            title="researchmap情報がまだ登録されていません"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                              color: '#C4CDD6', cursor: 'not-allowed',
                              background: '#F3F4F6',
                              border: '1.5px solid #E5E7EB',
                              fontFamily: "'Sora',sans-serif",
                            }}
                          >
                            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                            </svg>
                            researchmap
                          </div>
                        )}

                        {/* X：ある場合のみ表示 */}
                        {hasX && xUrl && (
                          
                            href={xUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="X (Twitter)"
                            className="sns-btn"
                            style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              width: 30, height: 30, borderRadius: 8,
                              background: '#000', flexShrink: 0,
                              transition: 'opacity .15s',
                            }}
                          >
                            <svg width={13} height={13} viewBox="0 0 24 24" fill="white">
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                            </svg>
                          </a>
                        )}

                        {/* Instagram：ある場合のみ表示 */}
                        {hasIG && (
                          
                            href={fac.instagram_url!}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Instagram"
                            className="sns-btn"
                            style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                              background: 'linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                              transition: 'opacity .15s',
                            }}
                          >
                            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                              <rect x="2" y="2" width="20" height="20" rx="5"/>
                              <circle cx="12" cy="12" r="4"/>
                              <circle cx="17.5" cy="6.5" r="0.5" fill="white" stroke="none"/>
                            </svg>
                          </a>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── リンク行：研究室HP ── */}
          <div className="link-row" style={{
            display: 'flex', alignItems: 'center',
            marginBottom: 22, flexWrap: 'wrap', gap: 8,
          }}>
            {lab.lab_url && (
              
                href={lab.lab_url}
                target="_blank"
                rel="noopener noreferrer"
                className="lab-url-btn"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  fontSize: 13, color: '#5FAFC6', textDecoration: 'none', fontWeight: 600,
                  padding: '7px 14px', borderRadius: 10,
                  border: '1.5px solid rgba(95,175,198,0.35)',
                  background: 'rgba(95,175,198,0.05)',
                  fontFamily: "'Sora',sans-serif",
                  transition: 'all .15s',
                }}
              >
                🔗 研究室HP →
              </a>
            )}
          </div>

          {/* ── TAGS ── */}
          {lab.lab_tags?.length > 0 && (
            <div style={{ marginBottom: 22 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#8FA1AE', marginBottom: 8, letterSpacing: '0.08em', fontFamily: "'Sora',sans-serif" }}>
                TAGS
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {lab.lab_tags.map((t: { tag: string }, i: number) => (
                  <span key={i} style={{
                    fontSize: 12, padding: '4px 11px', borderRadius: 999,
                    background: chipBg, color: clusterColor, fontWeight: 600,
                    border: `1px solid ${strokeColor}`,
                    fontFamily: "'Noto Sans JP',sans-serif",
                  }}>{t.tag}</span>
                ))}
              </div>
            </div>
          )}

          {/* ── 研究概要 ── */}
          <div style={{ borderTop: '1px solid #DCE8EE', paddingTop: 22 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#8FA1AE', marginBottom: 12, letterSpacing: '0.08em', fontFamily: "'Sora',sans-serif" }}>
              研究概要
            </p>

            {bullets.length > 0 && (
              <div style={{
                background: chipBg, borderRadius: 14, padding: '14px 18px',
                marginBottom: 18, border: `1px solid ${strokeColor}`,
              }}>
                {bullets.map((b, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    marginBottom: i < bullets.length - 1 ? 10 : 0,
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: clusterColor, flexShrink: 0, marginTop: 7 }} />
                    <p style={{ fontSize: 13, lineHeight: 1.75, color: '#1F2D3D', margin: 0, fontFamily: "'Noto Sans JP',sans-serif" }}>{b}</p>
                  </div>
                ))}
              </div>
            )}

            <p style={{ fontSize: 14, lineHeight: 1.9, color: '#5B6B79', whiteSpace: 'pre-wrap', margin: 0, fontFamily: "'Noto Sans JP',sans-serif" }}>
              {lab.summary_long ?? lab.summary_text ?? '（未取得）'}
            </p>

            {lab.summary_source_url && (
              
                href={lab.summary_source_url_override ?? lab.summary_source_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 11, color: '#8FA1AE', textDecoration: 'underline', marginTop: 12, display: 'inline-block', fontFamily: "'Noto Sans JP',sans-serif" }}
              >
                出典を見る →
              </a>
            )}
          </div>
        </div>

        {/* ── 近い研究室 Top5 ── */}
        {neighbors.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#5B6B79', marginBottom: 12, fontFamily: "'Sora',sans-serif" }}>
              近い研究室 Top{neighbors.length}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {neighbors.map((n, i) => {
                const { color: nc, chipBg: nChipBg, stroke: nStroke } = getClusterStyle(n.lab!.cluster_id)
                return (
                  <Link
                    key={n.id}
                    href={`/lab/${n.id}`}
                    className="neighbor-card"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '13px 16px', borderRadius: 14,
                      background: 'white', border: '1px solid #DCE8EE',
                      textDecoration: 'none', color: 'inherit',
                      boxShadow: '0 2px 8px rgba(41,88,107,0.05)',
                    }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#DCE8EE', width: 18, flexShrink: 0, textAlign: 'center', fontFamily: "'Sora',sans-serif" }}>{i + 1}</span>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: nc, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, margin: '0 0 2px', color: '#1F2D3D', fontFamily: "'Noto Sans JP',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {n.lab!.name}
                      </p>
                      <p style={{ fontSize: 12, color: '#8FA1AE', margin: 0, fontFamily: "'Noto Sans JP',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {n.lab!.faculty_name}
                      </p>
                    </div>
                    <span className="neighbor-badge" style={{
                      fontSize: 11, color: nc, fontWeight: 700,
                      background: nChipBg, padding: '3px 10px', borderRadius: 999,
                      flexShrink: 0, border: `1px solid ${nStroke}`,
                      fontFamily: "'Sora',sans-serif",
                    }}>
                      {Math.round(n.similarity * 100)}%
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* ── フッター：情報修正 ── */}
        <div className="fix-footer" style={{
          marginTop: 8, padding: '14px 20px', borderRadius: 14,
          background: '#F3FBFD', border: '1px solid #DCE8EE',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 8,
        }}>
          <p style={{ fontSize: 12, color: '#5B6B79', margin: 0, lineHeight: 1.5, fontFamily: "'Noto Sans JP',sans-serif" }}>
            情報に誤りや変更がありますか？
          </p>
          <Link href={contactUrl} className="correction-btn" style={{
            fontSize: 12, color: '#5FAFC6', textDecoration: 'none', fontWeight: 700,
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '6px 13px', borderRadius: 9,
            border: '1.5px solid rgba(95,175,198,0.3)',
            background: 'rgba(95,175,198,0.06)',
            fontFamily: "'Sora',sans-serif",
            transition: 'all .15s',
          }}>
            ✏️ 情報修正を依頼する
          </Link>
        </div>

        {/* メタ情報 */}
        <p className="meta-text" style={{ fontSize: 11, color: '#DCE8EE', marginTop: 16, fontFamily: "'Noto Sans JP',sans-serif", wordBreak: 'break-all' }}>
          取得元: {lab.summary_source_url ?? '未設定'} ／ 最終取得: {lab.fetched_at?.slice(0, 10) ?? '未取得'}
        </p>
      </main>
    </>
  )
}